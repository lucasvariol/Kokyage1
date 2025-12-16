import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import { reviewRequestGuestTemplate } from '@/email-templates/review-request-guest';
import { reviewRequestHostTemplate } from '@/email-templates/review-request-host';
import { reservationAutoRejectedTemplate } from '@/email-templates/reservation-auto-rejected';
import Stripe from 'stripe';

const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * CRON pour envoyer les demandes d'avis le jour du départ
 * ET refuser automatiquement les réservations en attente > 48h
 * Déclenché quotidiennement à 18h
 * Route: GET /api/cron/send-review-requests
 */

export async function GET(request) {
  try {
    // Vérification du CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📧 CRON: Envoi des demandes d\'avis...');

    // ===== PARTIE 1: Refuser les réservations en attente > 48h =====
    console.log('⏱️ Vérification des réservations en attente > 48h...');
    
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const { data: pendingReservations, error: pendingError } = await supabaseAdmin
      .from('reservations')
      .select(`
        id,
        guest_id,
        user_id,
        host_id,
        listing_id,
        created_at,
        date_arrivee,
        date_depart,
        guests,
        nights,
        total_price,
        transaction_id,
        caution_intent_id,
        listings (
          id,
          title,
          city
        )
      `)
      .eq('status', 'confirmed')
      .eq('host_validation_ok', false)
      .lt('created_at', fortyEightHoursAgo.toISOString());

    if (pendingError) {
      console.error('❌ Erreur récupération réservations en attente:', pendingError);
    } else {
      console.log(`📊 ${pendingReservations?.length || 0} réservation(s) en attente > 48h`);

      for (const reservation of pendingReservations || []) {
        try {
          console.log(`🚫 Refus automatique réservation ${reservation.id} (créée le ${reservation.created_at})`);

          // Annuler la réservation
          const { error: updateError } = await supabaseAdmin
            .from('reservations')
            .update({ 
              status: 'cancelled',
              host_validation_ok: false,
              cancellation_reason: 'Refus automatique: pas de réponse de l\'hôte sous 48h'
            })
            .eq('id', reservation.id);

          if (updateError) {
            console.error(`❌ Erreur mise à jour réservation ${reservation.id}:`, updateError);
            continue;
          }

          // Annuler l'autorisation de paiement
          if (reservation.transaction_id && String(reservation.transaction_id).startsWith('pi_')) {
            try {
              const pi = await stripe.paymentIntents.retrieve(reservation.transaction_id);
              if (pi.status === 'requires_capture' || pi.status === 'requires_confirmation' || pi.status === 'requires_action') {
                await stripe.paymentIntents.cancel(reservation.transaction_id);
                await supabaseAdmin
                  .from('reservations')
                  .update({ payment_status: 'canceled' })
                  .eq('id', reservation.id);
                console.log('🔓 Autorisation paiement annulée:', reservation.transaction_id);
              }
            } catch (cancelErr) {
              console.warn('⚠️ Annulation autorisation paiement échouée:', cancelErr.message);
            }
          }

          // Annuler la caution
          if (reservation.caution_intent_id && String(reservation.caution_intent_id).startsWith('pi_')) {
            try {
              await stripe.paymentIntents.cancel(reservation.caution_intent_id);
              console.log('🔓 Autorisation caution annulée:', reservation.caution_intent_id);
            } catch (cautionErr) {
              console.warn('⚠️ Annulation caution échouée:', cautionErr.message);
            }
          }

          // Débloquer les dates
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

          // Envoyer email au voyageur
          try {
            const guestId = reservation.guest_id || reservation.user_id;
            const { data: { user: guestUser } } = await supabaseAdmin.auth.admin.getUserById(guestId);

            if (guestUser?.email) {
              const { data: guestProfile } = await supabaseAdmin
                .from('profiles')
                .select('full_name, prenom, name')
                .eq('id', guestId)
                .single();

              const guestName = guestProfile?.full_name || guestProfile?.prenom || guestProfile?.name || guestUser.email;
              const listingTitle = reservation.listings?.title || 'le logement';
              const listingCity = reservation.listings?.city || '';

              const formatDate = (value) => new Date(value).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });

              const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              }).format(Number(value || 0));

              await resend.emails.send({
                from: 'Kokyage <noreply@kokyage.com>',
                to: guestUser.email,
                subject: reservationAutoRejectedTemplate.subject,
                html: reservationAutoRejectedTemplate.getHtml({
                  guestName,
                  listingTitle,
                  listingCity,
                  startDate: formatDate(reservation.date_arrivee),
                  endDate: formatDate(reservation.date_depart),
                  totalPrice: formatCurrency(reservation.total_price)
                }),
                text: reservationAutoRejectedTemplate.getText({
                  guestName,
                  listingTitle,
                  listingCity,
                  startDate: formatDate(reservation.date_arrivee),
                  endDate: formatDate(reservation.date_depart),
                  totalPrice: formatCurrency(reservation.total_price)
                })
              });

              console.log(`✅ Email refus automatique envoyé à ${guestUser.email}`);
            }
          } catch (emailError) {
            console.error('❌ Erreur envoi email refus auto:', emailError);
          }

        } catch (err) {
          console.error(`❌ Erreur traitement refus auto ${reservation.id}:`, err);
        }
      }
    }

    // ===== PARTIE 2: Envoi des demandes d'avis =====
    console.log('📧 Envoi des demandes d\'avis pour réservations terminées...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Récupérer les réservations qui se terminent aujourd'hui
    const { data: reservations, error } = await supabaseAdmin
      .from('reservations')
      .select(`
        id,
        guest_id,
        host_id,
        user_id,
        listing_id,
        date_depart,
        listings (
          id,
          title,
          city
        )
      `)
      .eq('date_depart', todayStr)
      .eq('status', 'confirmed');

    if (error) {
      console.error('❌ Erreur récupération réservations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`📊 ${reservations?.length || 0} réservation(s) se terminant aujourd'hui`);

    if (!reservations || reservations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucune réservation se terminant aujourd\'hui',
        sent: 0
      });
    }

    const results = [];

    for (const reservation of reservations) {
      try {
        const guestId = reservation.guest_id || reservation.user_id;
        const hostId = reservation.host_id;
        const listingTitle = reservation.listings?.title || 'le logement';
        const listingCity = reservation.listings?.city || '';

        // Récupérer les emails
        const { data: { user: guestUser } } = await supabaseAdmin.auth.admin.getUserById(guestId);
        const { data: { user: hostUser } } = await supabaseAdmin.auth.admin.getUserById(hostId);

        if (!guestUser?.email || !hostUser?.email) {
          console.error(`❌ Emails introuvables pour réservation ${reservation.id}`);
          results.push({
            reservation_id: reservation.id,
            success: false,
            error: 'Emails introuvables'
          });
          continue;
        }

        // Récupérer les noms depuis profiles
        const { data: guestProfile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, prenom, name')
          .eq('id', guestId)
          .single();

        const { data: hostProfile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, prenom, name')
          .eq('id', hostId)
          .single();

        const guestName = guestProfile?.full_name || guestProfile?.prenom || guestProfile?.name || guestUser.email;
        const hostName = hostProfile?.full_name || hostProfile?.prenom || hostProfile?.name || hostUser.email;
        
        // Extraire seulement le prénom
        const guestFirstName = guestName.trim?.().split(/\s+/)[0] || guestName;
        const hostFirstName = hostName.trim?.().split(/\s+/)[0] || hostName;

        const reviewUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com'}/avis/${reservation.id}`;

        // Envoyer l'email au voyageur
        console.log(`📧 Envoi email au voyageur: ${guestUser.email}`);
        const guestEmailResult = await resend.emails.send({
          from: 'Kokyage <noreply@kokyage.com>',
          to: guestUser.email,
          subject: reviewRequestGuestTemplate.subject,
          html: reviewRequestGuestTemplate.getHtml({
            guestName: guestFirstName,
            listingTitle,
            listingCity,
            hostName: hostFirstName,
            reviewUrl,
            reservationId: reservation.id
          }),
          text: reviewRequestGuestTemplate.getText({
            guestName: guestFirstName,
            listingTitle,
            listingCity,
            hostName: hostFirstName,
            reviewUrl
          })
        });

        // Envoyer l'email à l'hôte
        console.log(`📧 Envoi email à l'hôte: ${hostUser.email}`);
        const hostEmailResult = await resend.emails.send({
          from: 'Kokyage <noreply@kokyage.com>',
          to: hostUser.email,
          subject: reviewRequestHostTemplate.subject,
          html: reviewRequestHostTemplate.getHtml({
            hostName: hostFirstName,
            guestName: guestFirstName,
            listingTitle,
            reviewUrl,
            reservationId: reservation.id
          }),
          text: reviewRequestHostTemplate.getText({
            hostName: hostFirstName,
            guestName: guestFirstName,
            listingTitle,
            reviewUrl
          })
        });

        console.log(`✅ Emails envoyés pour réservation ${reservation.id}`);
        results.push({
          reservation_id: reservation.id,
          success: true,
          guest_email: guestEmailResult.id,
          host_email: hostEmailResult.id
        });

      } catch (err) {
        console.error(`❌ Erreur envoi emails pour ${reservation.id}:`, err);
        results.push({
          reservation_id: reservation.id,
          success: false,
          error: err.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ ${successCount} demandes d'avis envoyées`);

    return NextResponse.json({
      success: true,
      sent: successCount,
      total: reservations.length,
      results
    });

  } catch (error) {
    console.error('❌ Erreur globale CRON send-review-requests:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
