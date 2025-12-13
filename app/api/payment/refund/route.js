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

    logger.info('🔄 Tentative de remboursement', { paymentIntentId, reason });

    // Créer un remboursement complet
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
