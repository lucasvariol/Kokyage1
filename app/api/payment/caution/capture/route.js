import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

// POST /api/payment/caution/capture { reservationId, amount } amount in euros
export async function POST(request) {
  try {
    const { reservationId, amount } = await request.json();
    if (!reservationId || !amount) {
      return NextResponse.json({ error: 'reservationId et amount requis' }, { status: 400 });
    }

    const { data: r, error } = await supabase
      .from('reservations')
      .select('id, caution_intent_id')
      .eq('id', reservationId)
      .single();
    if (error || !r?.caution_intent_id) {
      return NextResponse.json({ error: 'Réservation introuvable ou caution absente' }, { status: 404 });
    }

    // Récupérer le PaymentIntent de caution et capturer partiellement
    const pi = await stripe.paymentIntents.retrieve(r.caution_intent_id);
    if (pi.status !== 'requires_capture' && pi.status !== 'requires_action') {
      // Si déjà capturé ou expiré
      return NextResponse.json({ error: `Caution non capturable (status=${pi.status})` }, { status: 400 });
    }

    const capture = await stripe.paymentIntents.capture(pi.id, {
      amount_to_capture: Math.round(Number(amount) * 100)
    });

    await supabase
      .from('reservations')
      .update({
        caution_captured_amount: amount,
        caution_charge_id: capture.latest_charge || null,
        caution_status: 'captured',
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId);

    return NextResponse.json({ success: true, capture });
  } catch (e) {
    console.error('Erreur capture caution:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
