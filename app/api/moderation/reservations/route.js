import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET /api/moderation/reservations
// Liste des dernières réservations avec infos nécessaires pour allocation de soldes
export async function GET() {
  try {
    // Authorization: only the moderator can call this
    const hdrs = headers();
    const auth = hdrs.get('authorization') || hdrs.get('Authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userRes?.user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    const moderatorEmail = 'lucas.variol@gmail.com';
    if (userRes.user.email !== moderatorEmail) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

    // 1) Lire un batch de réservations récentes
    const { data: reservations, error: resErr } = await supabaseAdmin
      .from('reservations')
      .select('id, listing_id, start_date, end_date, proprietor_share, main_tenant_share, platform_share, balances_allocated, balances_allocated_at, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (resErr) throw resErr;

    if (!reservations || reservations.length === 0) {
      return NextResponse.json({ reservations: [] });
    }

    // 2) Récupérer les titres des listings correspondants
    const listingIds = [...new Set(reservations.map(r => r.listing_id).filter(Boolean))];
    let titlesById = {};
    if (listingIds.length > 0) {
      const { data: listings, error: listErr } = await supabaseAdmin
        .from('listings')
        .select('id, title')
        .in('id', listingIds);
      if (listErr) throw listErr;
      titlesById = (listings || []).reduce((acc, l) => { acc[l.id] = l.title || null; return acc; }, {});
    }

    const result = reservations.map(r => ({
      id: r.id,
      listing_id: r.listing_id,
      listing_title: titlesById[r.listing_id] || null,
      start_date: r.start_date,
      end_date: r.end_date,
      proprietor_share: r.proprietor_share,
      main_tenant_share: r.main_tenant_share,
      balances_allocated: r.balances_allocated,
      balances_allocated_at: r.balances_allocated_at,
      created_at: r.created_at,
    }));

    return NextResponse.json({ reservations: result });
  } catch (e) {
    console.error('[Moderation Reservations] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
