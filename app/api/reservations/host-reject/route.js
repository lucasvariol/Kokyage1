import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import { reservationHostRejectedTemplate } from '@/email-templates/reservation-host-rejected';
import Stripe from 'stripe';
import { hostRejectReservationSchema, validateOrError } from '@/lib/validators';
import logger from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validation
    const validation = validateOrError(hostRejectReservationSchema, body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }
    
    const { reservationId, reason } = validation.data;
    logger.api('POST', '/api/reservations/host-reject', { reservationId });

    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .select('id, host_id, user_id, listing_id, status, date_arrivee, date_depart, guests, nights, total_price, transaction_id, caution_intent_id')
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (String(reservation.host_id) !== String(userRes.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (reservation.status === 'cancelled') {
      return NextResponse.json({ error: 'Reservation already cancelled' }, { status: 400 });
    }

    // Annuler la réservation
    const { error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ 
        status: 'cancelled',
        host_validation_ok: false
      })
      .eq('id', reservationId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Débloquer les dates dans disponibilities
    try {
      const startDate = new Date(reservation.date_arrivee);
      const endDate = new Date(reservation.date_depart);
      const datesToUnblock = [];
      let currentDate = new Date(startDate);
      
      while (currentDate < endDate) {
        datesToUnblock.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      for (const dateStr of datesToUnblock) {
        await supabaseAdmin
          .from('disponibilities')
          .update({ booked: 'No' })
          .eq('listing_id', reservation.listing_id)
          .eq('date', dateStr);
      }

      console.log('📅 Dates débloquées:', datesToUnblock);
    } catch (dateError) {
      console.error('Erreur déblocage dates:', dateError);
    }

    // Remboursement Stripe (idempotent et tolérant)
    let refundAmount = 0;
    try {
      // Ne tenter un remboursement que si l'ID ressemble à un PaymentIntent Stripe réel
      if (reservation.transaction_id && String(reservation.transaction_id).startsWith('pi_')) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(reservation.transaction_id);

          if (paymentIntent.status === 'succeeded') {
            // Vérifier s'il y a déjà eu un remboursement
            const existingRefunds = await stripe.refunds.list({ payment_intent: reservation.transaction_id, limit: 1 });
            const alreadyRefunded = existingRefunds?.data?.some(r => r.status !== 'failed' && r.status !== 'canceled');

            if (alreadyRefunded) {
              console.log('ℹ️ Paiement déjà remboursé. Aucun nouvel avoir créé.');
            } else {
              const refund = await stripe.refunds.create({
                payment_intent: reservation.transaction_id,
                reason: 'requested_by_customer'
              });
              refundAmount = (refund.amount || 0) / 100;
              console.log('💰 Remboursement créé:', refund.id, refundAmount, 'EUR');
            }
          } else {
            console.log('ℹ️ PaymentIntent non débité (status:', paymentIntent.status, '), remboursement non nécessaire.');
          }
        } catch (stripeErr) {
          // Gérer proprement les cas idempotents ou tests
          const code = stripeErr?.code || stripeErr?.raw?.code;
          if (code === 'charge_already_refunded') {
            console.warn('⚠️ Paiement déjà remboursé (Stripe). On continue.');
          } else if (code === 'resource_missing') {
            console.warn('⚠️ PaymentIntent introuvable. Probablement un ID de test. On continue.');
          } else {
            console.warn('⚠️ Erreur Stripe lors du remboursement:', stripeErr.message);
          }
        }
      } else if (reservation.transaction_id) {
        console.log('ℹ️ Remboursement ignoré: transaction_id non Stripe ou test ->', reservation.transaction_id);
      }

      // Annuler l'autorisation de caution si elle existe (et ressemble à un PI)
      if (reservation.caution_intent_id && String(reservation.caution_intent_id).startsWith('pi_')) {
        try {
          await stripe.paymentIntents.cancel(reservation.caution_intent_id);
          console.log('🔓 Autorisation caution annulée:', reservation.caution_intent_id);
        } catch (cautionError) {
          console.warn('Erreur annulation caution:', cautionError.message);
        }
      } else if (reservation.caution_intent_id) {
        console.log('ℹ️ Annulation caution ignorée: caution_intent_id non Stripe ou test ->', reservation.caution_intent_id);
      }
    } catch (stripeError) {
      // Ne bloque pas l'annulation si le remboursement échoue: on journalise et on continue
      console.warn('⚠️ Remboursement Stripe non abouti, mais réservation annulée:', stripeError?.message || stripeError);
    }

    // Envoyer email au voyageur
    try {
      const hostUser = userRes.user;

      const [listingResult, guestProfileResult, hostProfileResult, guestUserResult] = await Promise.all([
        supabaseAdmin
          .from('listings')
          .select('title, city')
          .eq('id', reservation.listing_id)
          .maybeSingle(),
        supabaseAdmin
          .from('profiles')
          .select('name')
          .eq('id', reservation.user_id)
          .maybeSingle(),
        supabaseAdmin
          .from('profiles')
          .select('name')
          .eq('id', reservation.host_id)
          .maybeSingle(),
        supabaseAdmin.auth.admin.getUserById(reservation.user_id)
      ]);

      if (listingResult?.error) throw listingResult.error;
      if (guestProfileResult?.error) throw guestProfileResult.error;
      if (hostProfileResult?.error) throw hostProfileResult.error;
      if (guestUserResult?.error) throw guestUserResult.error;

      const listing = listingResult?.data;
      const guestProfile = guestProfileResult?.data;
      const hostProfile = hostProfileResult?.data;
      const guestUser = guestUserResult?.data?.user;

      const hostRawName = hostProfile?.name
        || hostUser?.user_metadata?.full_name
        || hostUser?.user_metadata?.name
        || hostUser?.email
        || 'Votre hôte';

      const guestRawName = guestProfile?.name
        || guestUser?.user_metadata?.full_name
        || guestUser?.email
        || 'Voyageur';

      const formatDate = (value) => new Date(value).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(Number(value || 0));

      const emailPayload = {
        guestName: guestRawName.trim?.() || 'Voyageur',
        hostName: hostRawName.trim?.().split(/\s+/)[0] || 'Votre hôte',
        listingTitle: listing?.title || 'Logement',
        listingCity: listing?.city || 'Localisation',
        startDate: formatDate(reservation.date_arrivee),
        endDate: formatDate(reservation.date_depart),
        nights: reservation.nights || 1,
        guests: reservation.guests || 1,
        totalPrice: formatCurrency(reservation.total_price),
        refundAmount: formatCurrency(refundAmount)
      };

      if (guestUser?.email) {
        await resend.emails.send({
          from: process.env.MAIL_FROM || 'Kokyage <contact@kokyage.com>',
          to: guestUser.email,
          subject: reservationHostRejectedTemplate.subject,
          html: reservationHostRejectedTemplate.getHtml(emailPayload),
          text: reservationHostRejectedTemplate.getText(emailPayload)
        });

        console.log('📧 Email refus envoyé au voyageur', { reservationId });
      } else {
        console.warn('⚠️ Email refus non envoyé : adresse voyageur manquante', { reservationId });
      }
    } catch (emailError) {
      console.error('❌ Échec envoi email refus:', emailError);
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Reservation cancelled and refund processed',
      refundAmount 
    });
  } catch (error) {
    console.error('host-reject route error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
