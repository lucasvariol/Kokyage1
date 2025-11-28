import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import { reservationHostValidatedTemplate } from '@/email-templates/reservation-host-validated';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const { reservationId, hostValidation } = await request.json();
    if (!reservationId) {
      return NextResponse.json({ error: 'Missing reservationId' }, { status: 400 });
    }

    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .select('id, host_id, user_id, listing_id, host_validation_ok, status, date_arrivee, date_depart, guests, nights, total_price')
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (String(reservation.host_id) !== String(userRes.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const nextValue = hostValidation === false ? false : true;

    if (reservation.host_validation_ok === nextValue) {
      return NextResponse.json({ ok: true, reservation });
    }

    const { data: updatedReservation, error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ host_validation_ok: nextValue })
      .eq('id', reservationId)
      .select('id, host_validation_ok, status')
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (nextValue) {
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

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com';
        const reservationUrl = `${baseUrl}/reservations?reservationId=${reservationId}`;

        const emailPayload = {
          guestName: guestRawName.trim?.() || 'Voyageur',
          hostName: hostRawName.trim?.().split(/\s+/)[0] || 'Votre hôte',
          listingTitle: listing?.title || 'Votre logement',
          listingCity: listing?.city || 'Localisation à venir',
          startDate: formatDate(reservation.date_arrivee),
          endDate: formatDate(reservation.date_depart),
          nights: reservation.nights || 1,
          guests: reservation.guests || 1,
          totalPrice: formatCurrency(reservation.total_price),
          reservationUrl
        };

        if (guestUser?.email) {
          await resend.emails.send({
            from: process.env.MAIL_FROM || 'Kokyage <contact@kokyage.com>',
            to: guestUser.email,
            subject: reservationHostValidatedTemplate.subject,
            html: reservationHostValidatedTemplate.getHtml(emailPayload),
            text: reservationHostValidatedTemplate.getText(emailPayload)
          });

          console.log('📧 Email validation hôte envoyé au voyageur', { reservationId });
        } else {
          console.warn('⚠️ Email validation hôte non envoyé : adresse voyageur manquante', { reservationId });
        }
      } catch (emailError) {
        console.error('❌ Échec envoi email validation hôte:', emailError);
      }
    }

    return NextResponse.json({ ok: true, reservation: updatedReservation });
  } catch (error) {
    console.error('host-validate route error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
