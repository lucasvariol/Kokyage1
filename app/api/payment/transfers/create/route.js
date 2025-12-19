import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

// POST /api/payment/transfers/create
// Body: { reservationId }
export async function POST(request) {
  try {
    const { reservationId, dryRun = false } = await request.json();
    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId requis' }, { status: 400 });
    }

    // Récupérer la réservation et les parts
    const { data: res, error: resErr } = await supabase
      .from('reservations')
      .select('id, listing_id, host_id, user_id, end_date, proprietor_share, main_tenant_share, platform_share, platform_tva, transfer_owner_id, transfer_tenant_id')
      .eq('id', reservationId)
      .single();
    if (resErr || !res) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
    }

    // Récupérer les comptes connectés du propriétaire et du locataire principal
    const { data: listing, error: listingErr } = await supabase
      .from('listings')
      .select('owner_id, id_proprietaire')
      .eq('id', res.listing_id)
      .single();
    if (listingErr || !listing) {
      return NextResponse.json({ error: 'Listing introuvable' }, { status: 404 });
    }

    // On suppose que profiles contient stripe_account_id
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('id, stripe_account_id')
      .eq('id', listing.owner_id)
      .single();
    const { data: proprietorProfile } = await supabase
      .from('profiles')
      .select('id, stripe_account_id')
      .eq('id', listing.id_proprietaire)
      .single();

    if (!dryRun && (!ownerProfile?.stripe_account_id || !proprietorProfile?.stripe_account_id)) {
      return NextResponse.json({ error: 'Compte Stripe connecté manquant pour le propriétaire ou le locataire principal' }, { status: 400 });
    }

    // Vérifier qu'on n'a pas déjà transféré
    if (res.transfer_owner_id || res.transfer_tenant_id) {
      return NextResponse.json({ error: 'Transferts déjà effectués pour cette réservation' }, { status: 409 });
    }

    // Créer les transferts vers les comptes connectés
    const transfers = {};

    if (Number(res.proprietor_share) > 0) {
      if (dryRun) {
        transfers.owner = `tr_test_owner_${Date.now()}`;
      } else {
        const t = await stripe.transfers.create({
          amount: Math.round(Number(res.proprietor_share) * 100),
          currency: 'eur',
          destination: proprietorProfile.stripe_account_id,
          description: `Part propriétaire - réservation ${res.id}`,
          metadata: { reservationId: res.id, role: 'proprietor' }
        });
        transfers.owner = t.id;
      }
    }

    if (Number(res.main_tenant_share) > 0) {
      if (dryRun) {
        transfers.tenant = `tr_test_tenant_${Date.now()}`;
      } else {
        const t2 = await stripe.transfers.create({
          amount: Math.round(Number(res.main_tenant_share) * 100),
          currency: 'eur',
          destination: ownerProfile.stripe_account_id,
          description: `Part locataire principal - réservation ${res.id}`,
          metadata: { reservationId: res.id, role: 'main_tenant' }
        });
        transfers.tenant = t2.id;
      }
    }

    // Enregistrer les transferts
    const { error: updErr } = await supabase
      .from('reservations')
      .update({
        transfer_owner_id: transfers.owner || null,
        transfer_tenant_id: transfers.tenant || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', res.id);

    if (updErr) {
      return NextResponse.json({ error: 'Transferts créés mais non enregistrés en base' }, { status: 500 });
    }

    return NextResponse.json({ success: true, transfers });
  } catch (e) {
    console.error('Erreur création transferts:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
