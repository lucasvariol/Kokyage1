import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// POST /api/moderation/allocate { reservationId }
// Ajoute les parts aux soldes internes (profiles.to_be_paid_to_user et total_earnings)
export async function POST(request) {
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

    const { reservationId } = await request.json();
    if (!reservationId) return NextResponse.json({ error: 'reservationId requis' }, { status: 400 });

    // 1) Lire la réservation avec parts et mapping des rôles
    const { data: res, error: resErr } = await supabaseAdmin
      .from('reservations')
      .select('id, listing_id, host_id, user_id, proprietor_share, main_tenant_share, platform_share, balances_allocated')
      .eq('id', reservationId)
      .single();

    if (resErr || !res) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });

    if (res.balances_allocated) {
      return NextResponse.json({ error: 'Déjà alloué aux soldes' }, { status: 409 });
    }

    // 2) Récupérer le listing pour savoir qui est propriétaire et locataire principal
    const { data: listing, error: listingErr } = await supabaseAdmin
      .from('listings')
      .select('owner_id, id_proprietaire')
      .eq('id', res.listing_id)
      .single();

    if (listingErr || !listing) return NextResponse.json({ error: 'Listing introuvable' }, { status: 404 });

    const proprietorUserId = listing.id_proprietaire;      // propriétaire (40%)
    const mainTenantUserId = listing.owner_id;            // locataire principal (60%)

    // 3) Appliquer les montants aux soldes
    const proprietorAmount = Number(res.proprietor_share || 0);
    const mainTenantAmount = Number(res.main_tenant_share || 0);

    // Lire soldes actuels
    const { data: propProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, total_earnings, to_be_paid_to_user')
      .eq('id', proprietorUserId)
      .single();

    const { data: tenantProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, total_earnings, to_be_paid_to_user')
      .eq('id', mainTenantUserId)
      .single();

    // Calculer nouveaux soldes
    const updates = [];
    if (proprietorUserId && proprietorAmount > 0) {
      if (!propProfile) return NextResponse.json({ error: 'Profil propriétaire introuvable' }, { status: 400 });
      updates.push(
        supabaseAdmin
          .from('profiles')
          .update({
            total_earnings: Number(propProfile?.total_earnings || 0) + proprietorAmount,
            to_be_paid_to_user: Number(propProfile?.to_be_paid_to_user || 0) + proprietorAmount,
          })
          .eq('id', proprietorUserId)
          .select('id')
      );
    }

    if (mainTenantUserId && mainTenantAmount > 0) {
      if (!tenantProfile) return NextResponse.json({ error: 'Profil locataire principal introuvable' }, { status: 400 });
      updates.push(
        supabaseAdmin
          .from('profiles')
          .update({
            total_earnings: Number(tenantProfile?.total_earnings || 0) + mainTenantAmount,
            to_be_paid_to_user: Number(tenantProfile?.to_be_paid_to_user || 0) + mainTenantAmount,
          })
          .eq('id', mainTenantUserId)
          .select('id')
      );
    }

    const results = await Promise.all(updates);
    for (const r of results) {
      if (r.error) return NextResponse.json({ error: r.error.message || 'Erreur mise à jour profils' }, { status: 500 });
      if (!r.data || r.data.length === 0) return NextResponse.json({ error: 'Mise à jour profils non appliquée' }, { status: 500 });
    }

    // 4) Marquer la réservation comme allouée
    await supabaseAdmin
      .from('reservations')
      .update({ balances_allocated: true, balances_allocated_at: new Date().toISOString() })
      .eq('id', res.id);

    return NextResponse.json({ success: true, proprietorAmount, mainTenantAmount });
  } catch (e) {
    console.error('[Moderation Allocate] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
