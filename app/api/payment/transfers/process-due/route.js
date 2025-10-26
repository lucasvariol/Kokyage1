import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

// POST /api/payment/transfers/process-due
// Optionally accepts { date?: 'YYYY-MM-DD' } to process stays ended before or on date (default today)
export async function POST(request) {
  try {
    const { date } = await request.json().catch(() => ({ }));
    const cutoff = date ? new Date(date) : new Date();
    cutoff.setHours(0,0,0,0);

    // Trouver les réservations dont le séjour est terminé et sans transferts
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('id, listing_id, end_date, proprietor_share, main_tenant_share, transfer_owner_id, transfer_tenant_id, ready_for_payout')
      .lte('end_date', cutoff.toISOString().slice(0,10))
      .is('transfer_owner_id', null)
      .is('transfer_tenant_id', null)
      .eq('status', 'confirmed')
      .eq('ready_for_payout', true);

    if (error) {
      return NextResponse.json({ error: 'Erreur de récupération des réservations à traiter' }, { status: 500 });
    }

    const processed = [];
    for (const r of (reservations || [])) {
      // Appeler l'endpoint de création de transfert pour chaque réservation
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment/transfers/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: r.id })
      });
      const json = await res.json();
      processed.push({ reservationId: r.id, ok: res.ok, result: json });
    }

    return NextResponse.json({ success: true, count: processed.length, processed });
  } catch (e) {
    console.error('Erreur process-due transferts:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
