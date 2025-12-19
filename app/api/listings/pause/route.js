import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import { ownerConsentPausedTemplate } from '@/email-templates/owner-consent-paused';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
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

    const { listingId } = await req.json();
    if (!listingId) return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });

    // Verify ownership (propriétaire)
    const { data: listing, error: listErr } = await supabaseAdmin
      .from('listings')
      .select('id, id_proprietaire, owner_id, title, city')
      .eq('id', listingId)
      .single();
    if (listErr || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    if (String(listing.id_proprietaire) !== String(userRes.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cancel upcoming reservations (>14 days) and zero-out shares
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 14);
    const cutoffDateStr = cutoff.toISOString().split('T')[0]; // YYYY-MM-DD

    const { data: candidateReservations, error: reservationsError } = await supabaseAdmin
      .from('reservations')
      .select('id, listing_id, status, date_arrivee, date_depart')
      .eq('listing_id', listingId)
      .neq('status', 'cancelled');

    if (reservationsError) {
      return NextResponse.json({ error: reservationsError.message }, { status: 500 });
    }
    const reservationIdsToCancel = (candidateReservations || [])
      .filter((r) => {
        const start = r.date_arrivee;
        if (!start) return false;
        const startDateStr = String(start).slice(0, 10); // tolerate timestamp
        return startDateStr > cutoffDateStr;
      })
      .map((r) => r.id);

    if (reservationIdsToCancel.length > 0) {
      const { error: cancelError } = await supabaseAdmin
        .from('reservations')
        .update({
          status: 'cancelled',
          proprietor_share: 0,
          main_tenant_share: 0,
          platform_share: 0,
          platform_tva: 0,
        })
        .in('id', reservationIdsToCancel);

      if (cancelError) {
        return NextResponse.json({ error: cancelError.message }, { status: 500 });
      }

      // Best-effort: unblock dates in disponibilities for cancelled reservations
      try {
        const reservationsToUnblock = (candidateReservations || []).filter((r) => reservationIdsToCancel.includes(r.id));
        for (const r of reservationsToUnblock) {
          const start = r.date_arrivee;
          const end = r.date_depart;
          if (!start || !end) continue;

          const startDate = new Date(start);
          const endDate = new Date(end);
          if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) continue;

          const datesToUnblock = [];
          const currentDate = new Date(startDate);
          while (currentDate < endDate) {
            datesToUnblock.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
          }

          for (const dateStr of datesToUnblock) {
            await supabaseAdmin
              .from('disponibilities')
              .update({ booked: 'No' })
              .eq('listing_id', listingId)
              .eq('date', dateStr);
          }
        }
      } catch (unblockErr) {
        console.error('pause route: failed to unblock disponibilities (non-blocking)', unblockErr);
      }
    }

    // Update listing status only (no reservation cancellation for now)
    const newStatus = 'Accord propriétaire en pause';
    const { error: updErr } = await supabaseAdmin
      .from('listings')
      .update({ status: newStatus })
      .eq('id', listingId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // Notifier le locataire principal (owner_id)
    let emailSent = false;
    if (listing.owner_id) {
      try {
        const { data: tenantUserData, error: tenantUserError } = await supabaseAdmin.auth.admin.getUserById(listing.owner_id);
        if (tenantUserError) throw tenantUserError;
        const tenantUser = tenantUserData?.user;
        if (tenantUser?.email) {
          const { data: tenantProfile } = await supabaseAdmin
            .from('profiles')
            .select('name')
            .eq('id', listing.owner_id)
            .maybeSingle();

          const tenantRawName = tenantProfile?.name
            || tenantUser.user_metadata?.full_name
            || tenantUser.email;
          const tenantName = tenantRawName
            ? tenantRawName.trim().split(/\s+/)[0]
            : 'Hôte';

          const ownerRawName = userRes.user.user_metadata?.full_name
            || userRes.user.user_metadata?.name
            || userRes.user.email;
          const proprietaireName = ownerRawName?.trim?.() || 'Le propriétaire';

          const emailPayload = {
            tenantName,
            listingTitle: listing.title || 'Votre logement',
            listingCity: listing.city || 'Localisation non renseignée',
            proprietaireName,
            cutoffDate: new Date(cutoffDateStr).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            pausedAt: new Date().toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })
          };

          await resend.emails.send({
            from: process.env.MAIL_FROM || 'Kokyage <contact@kokyage.com>',
            to: tenantUser.email,
            subject: ownerConsentPausedTemplate.subject,
            html: ownerConsentPausedTemplate.getHtml(emailPayload),
            text: ownerConsentPausedTemplate.getText(emailPayload)
          });
          emailSent = true;
        } else {
          console.warn('pause route: tenant user has no email', { ownerId: listing.owner_id });
        }
      } catch (emailErr) {
        console.error('pause route: email send failed', emailErr);
      }
    }

    return NextResponse.json({
      ok: true,
      status: newStatus,
      emailSent,
      cancelledReservationsCount: reservationIdsToCancel.length,
      cancelledReservationsCutoffDate: cutoffDateStr,
    });
  } catch (e) {
    console.error('pause route error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
