import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import { reviewRequestGuestTemplate } from '@/email-templates/review-request-guest';
import { reviewRequestHostTemplate } from '@/email-templates/review-request-host';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * CRON pour envoyer les demandes d'avis le jour du départ
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

        const reviewUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com'}/avis/${reservation.id}`;

        // Envoyer l'email au voyageur
        console.log(`📧 Envoi email au voyageur: ${guestUser.email}`);
        const guestEmailResult = await resend.emails.send({
          from: 'Kokyage <noreply@kokyage.com>',
          to: guestUser.email,
          subject: reviewRequestGuestTemplate.subject,
          html: reviewRequestGuestTemplate.getHtml({
            guestName,
            listingTitle,
            listingCity,
            hostName,
            reviewUrl,
            reservationId: reservation.id
          }),
          text: reviewRequestGuestTemplate.getText({
            guestName,
            listingTitle,
            listingCity,
            hostName,
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
            hostName,
            guestName,
            listingTitle,
            reviewUrl,
            reservationId: reservation.id
          }),
          text: reviewRequestHostTemplate.getText({
            hostName,
            guestName,
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
