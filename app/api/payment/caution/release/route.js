import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

// POST /api/payment/caution/release { reservationId }
export async function POST(request) {
  try {
    const { reservationId } = await request.json();
    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId requis' }, { status: 400 });
    }

    const { data: r, error } = await supabase
      .from('reservations')
      .select('id, caution_intent_id')
      .eq('id', reservationId)
      .single();
    if (error || !r?.caution_intent_id) {
      return NextResponse.json({ error: 'Réservation introuvable ou caution absente' }, { status: 404 });
    }

    // Annuler l'autorisation si encore annulable (idempotent)
    const pi = await stripe.paymentIntents.retrieve(r.caution_intent_id);
    let canceled = pi;
    if (pi.status !== 'canceled') {
      try {
        canceled = await stripe.paymentIntents.cancel(r.caution_intent_id);
      } catch (e) {
        // Idempotence: si déjà canceled, c'est OK
        const msg = String(e?.message || '');
        const code = String(e?.code || '');
        const alreadyCanceled = msg.includes('status of canceled') || (code === 'payment_intent_unexpected_state' && msg.toLowerCase().includes('canceled'));
        if (!alreadyCanceled) throw e;
        canceled = await stripe.paymentIntents.retrieve(r.caution_intent_id);
      }
    }

    await supabase
      .from('reservations')
      .update({
        caution_status: 'released',
        caution_released_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId);

    return NextResponse.json({ success: true, canceled });
  } catch (e) {
    console.error('Erreur release caution:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
