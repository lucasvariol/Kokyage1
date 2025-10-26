import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import { reservationGuestCancelledTemplate } from '@/email-templates/reservation-guest-cancelled';
import Stripe from 'stripe';

const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { reservationId, reason = 'Annulé par le voyageur' } = body;

    if (!reservationId) {
      return NextResponse.json(
        { error: 'ID de réservation manquant' },
        { status: 400 }
      );
    }

    // Vérifier que la réservation appartient à l'utilisateur connecté
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;

    // Si pas de token dans le header, essayer avec les cookies
    let userRes;
    if (token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data?.user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }
      userRes = data;
    } else {
      // Fallback : essayer d'extraire le token depuis les cookies (moins sécurisé mais fonctionnel)
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
      if (!match) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }
      const cookieToken = decodeURIComponent(match[1]);
      const parsedToken = JSON.parse(cookieToken);
      const accessToken = parsedToken?.access_token;
      
      if (!accessToken) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }

      const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
      if (error || !data?.user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }
      userRes = data;
    }

    const user = userRes.user;

    // Vérifier la réservation avec toutes les infos nécessaires
    const { data: reservation, error: checkError } = await supabaseAdmin
      .from('reservations')
      .select('id, user_id, guest_id, host_id, listing_id, status, date_arrivee, date_depart, guests, nights, total_price, transaction_id, caution_intent_id')
      .eq('id', reservationId)
      .single();

    if (checkError || !reservation) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur peut annuler (user_id, guest_id)
    const guestId = reservation.user_id || reservation.guest_id;
    if (guestId !== user.id) {
      return NextResponse.json(
        { error: 'Seul le voyageur peut annuler cette réservation' },
        { status: 403 }
      );
    }

    // Vérifier que la réservation peut être annulée
    if (reservation.status === 'cancelled' || reservation.status === 'canceled') {
      return NextResponse.json(
        { error: 'Cette réservation est déjà annulée' },
        { status: 400 }
      );
    }

    // Annuler la réservation
    const { error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ 
        status: 'cancelled'
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

      console.log('📅 Dates débloquées après annulation voyageur:', datesToUnblock);
    } catch (dateError) {
      console.error('Erreur déblocage dates:', dateError);
    }

    // Remboursement Stripe intégral
    let refundAmount = 0;
    try {
      if (reservation.transaction_id && String(reservation.transaction_id).startsWith('pi_')) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(reservation.transaction_id);

          if (paymentIntent.status === 'succeeded') {
            // Vérifier s'il y a déjà eu un remboursement
            const existingRefunds = await stripe.refunds.list({ payment_intent: reservation.transaction_id, limit: 1 });
            const alreadyRefunded = existingRefunds?.data?.some(r => r.status !== 'failed' && r.status !== 'canceled');

            if (alreadyRefunded) {
              console.log('ℹ️ Paiement déjà remboursé.');
            } else {
              const refund = await stripe.refunds.create({
                payment_intent: reservation.transaction_id,
                reason: 'requested_by_customer'
              });
              refundAmount = (refund.amount || 0) / 100;
              console.log('💰 Remboursement intégral créé:', refund.id, refundAmount, 'EUR');
            }
          } else {
            console.log('ℹ️ PaymentIntent non débité, remboursement non nécessaire.');
          }
        } catch (stripeErr) {
          const code = stripeErr?.code || stripeErr?.raw?.code;
          if (code === 'charge_already_refunded') {
            console.warn('⚠️ Paiement déjà remboursé.');
          } else if (code === 'resource_missing') {
            console.warn('⚠️ PaymentIntent introuvable.');
          } else {
            console.warn('⚠️ Erreur Stripe:', stripeErr.message);
          }
        }
      }

      // Annuler l'autorisation de caution si elle existe
      if (reservation.caution_intent_id && String(reservation.caution_intent_id).startsWith('pi_')) {
        try {
          await stripe.paymentIntents.cancel(reservation.caution_intent_id);
          console.log('🔓 Autorisation caution annulée:', reservation.caution_intent_id);
        } catch (cautionError) {
          console.warn('Erreur annulation caution:', cautionError.message);
        }
      }
    } catch (stripeError) {
      console.warn('⚠️ Remboursement non abouti:', stripeError?.message || stripeError);
    }

    // Envoyer email à l'hôte
    try {
      const [listingResult, guestProfileResult, hostProfileResult, hostUserResult] = await Promise.all([
        supabaseAdmin
          .from('listings')
          .select('title, city')
          .eq('id', reservation.listing_id)
          .maybeSingle(),
        supabaseAdmin
          .from('profiles')
          .select('name')
          .eq('id', guestId)
          .maybeSingle(),
        supabaseAdmin
          .from('profiles')
          .select('name')
          .eq('id', reservation.host_id)
          .maybeSingle(),
        supabaseAdmin.auth.admin.getUserById(reservation.host_id)
      ]);

      if (listingResult?.error) throw listingResult.error;
      if (guestProfileResult?.error) throw guestProfileResult.error;
      if (hostProfileResult?.error) throw hostProfileResult.error;
      if (hostUserResult?.error) throw hostUserResult.error;

      const listing = listingResult?.data;
      const guestProfile = guestProfileResult?.data;
      const hostProfile = hostProfileResult?.data;
      const hostUser = hostUserResult?.data?.user;

      const guestRawName = guestProfile?.name
        || user?.user_metadata?.full_name
        || user?.email
        || 'Voyageur';

      const hostRawName = hostProfile?.name
        || hostUser?.user_metadata?.full_name
        || hostUser?.email
        || 'Hôte';

      const formatDate = (value) => new Date(value).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(Number(value || 0));

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kokyage.com';

      const emailPayload = {
        hostName: hostRawName.trim?.() || 'Hôte',
        guestName: guestRawName.trim?.() || 'Voyageur',
        listingTitle: listing?.title || 'Votre logement',
        listingCity: listing?.city || 'Localisation non renseignée',
        startDate: formatDate(reservation.date_arrivee),
        endDate: formatDate(reservation.date_depart),
        nights: reservation.nights,
        guests: reservation.guests || 1,
        totalPrice: formatCurrency(reservation.total_price),
        reason: reason || 'Non spécifiée',
        reservationsUrl: `${baseUrl}/reservations?view=host`
      };

      if (hostUser?.email) {
        await resend.emails.send({
          from: process.env.MAIL_FROM || 'Kokyage <contact@kokyage.com>',
          to: hostUser.email,
          subject: reservationGuestCancelledTemplate.subject,
          html: reservationGuestCancelledTemplate.getHtml(emailPayload),
          text: reservationGuestCancelledTemplate.getText(emailPayload)
        });

        console.log('📧 Email annulation envoyé à l\'hôte:', hostUser.email);
      } else {
        console.warn('⚠️ Impossible d\'envoyer l\'email : adresse de l\'hôte manquante');
      }
    } catch (emailError) {
      console.error('❌ Échec envoi email annulation:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Réservation annulée avec succès. Vous avez été remboursé intégralement.',
      refundAmount
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de la réservation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'annulation' },
      { status: 500 }
    );
  }
}