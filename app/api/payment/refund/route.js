import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import logger from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * Rembourser un PaymentIntent Stripe
 * Utilisé pour annuler un paiement quand la réservation échoue
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { paymentIntentId, reason } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'paymentIntentId requis' },
        { status: 400 }
      );
    }

    logger.info('🔄 Tentative annulation/remboursement', { paymentIntentId, reason });

    // Nouveau flux: si le PI est autorisé mais non capturé, on annule (libère les fonds) au lieu de rembourser.
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status === 'requires_capture' || pi.status === 'requires_confirmation' || pi.status === 'requires_action') {
      const canceled = await stripe.paymentIntents.cancel(paymentIntentId);
      logger.info('✅ PaymentIntent annulé (autorisation libérée)', { paymentIntentId, status: canceled.status });
      return NextResponse.json({
        success: true,
        canceled: true,
        paymentIntent: {
          id: canceled.id,
          status: canceled.status,
          amount: canceled.amount,
          currency: canceled.currency
        }
      });
    }

    // Flux historique: paiement capturé => remboursement
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        reason: reason || 'Échec de création de réservation',
        refunded_at: new Date().toISOString()
      }
    });

    logger.info('✅ Remboursement créé', { refundId: refund.id, status: refund.status });

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        status: refund.status,
        amount: refund.amount,
        currency: refund.currency
      }
    });

  } catch (error) {
    logger.error('❌ Erreur remboursement', { error: error.message });
    
    return NextResponse.json(
      { 
        error: error.message,
        type: error.type 
      },
      { status: 500 }
    );
  }
}
