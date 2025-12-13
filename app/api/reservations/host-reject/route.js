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
      .select('id, host_id, user_id, listing_id, status, date_arrivee, date_depart, guests, nights, total_price, transaction_id, payment_status, caution_intent_id')
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

    // Si le paiement principal est une autorisation non capturée, l'annuler pour libérer les fonds
    try {
      const transactionId = reservation.transaction_id;
      if (transactionId && String(transactionId).startsWith('pi_') && reservation.payment_status !== 'paid') {
        try {
          const pi = await stripe.paymentIntents.retrieve(transactionId);
          if (pi.status === 'requires_capture' || pi.status === 'requires_confirmation' || pi.status === 'requires_action') {
            await stripe.paymentIntents.cancel(transactionId);
            await supabaseAdmin
              .from('reservations')
              .update({ payment_status: 'canceled' })
              .eq('id', reservationId);
            console.log('🔓 Autorisation paiement principal annulée (fonds libérés):', transactionId);
          }
        } catch (cancelPayErr) {
          console.warn('⚠️ Annulation autorisation paiement principal non aboutie:', cancelPayErr?.message || cancelPayErr);
        }
      }
    } catch (stripeError) {
      console.warn('⚠️ Check/annulation paiement principal non abouti:', stripeError?.message || stripeError);
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

    // IMPORTANT: les remboursements Stripe sont gérés uniquement par le CRON.
    // Ici, on libère uniquement la caution si elle existe (autorisation), sans rembourser le paiement principal.
    try {
      if (reservation.caution_intent_id && String(reservation.caution_intent_id).startsWith('pi_')) {
        try {
          const paymentIntent = await stripe.paymentIntents.cancel(reservation.caution_intent_id);
          console.log('🔓 Autorisation caution annulée:', reservation.caution_intent_id);

          // Log en base (tolérant si la colonne n'existe pas encore)
          const { error: cautionLogError } = await supabaseAdmin
            .from('reservations')
            .update({
              caution_status: 'released',
              caution_released_at: new Date().toISOString()
            })
            .eq('id', reservation.id);
          if (cautionLogError) {
            console.warn('⚠️ Log caution non écrit (migration manquante ?):', cautionLogError.message);
          }

          if (paymentIntent?.status) {
            console.log('ℹ️ Status Stripe caution après annulation:', paymentIntent.status);
          }
        } catch (cautionError) {
          console.warn('Erreur annulation caution:', cautionError.message);
        }
      } else if (reservation.caution_intent_id) {
        console.log('ℹ️ Annulation caution ignorée: caution_intent_id non Stripe ou test ->', reservation.caution_intent_id);
      }
    } catch (stripeError) {
      console.warn('⚠️ Annulation caution non aboutie:', stripeError?.message || stripeError);
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
