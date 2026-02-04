import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

/**
 * Créer un SetupIntent pour enregistrer la carte du client
 * Utilisé pour la caution - prélèvement uniquement en cas de litige
 */
export async function POST(request) {
  try {
    const { paymentMethodId, customerId, userId, listingId, reservationData } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'PaymentMethod ID requis' },
        { status: 400 }
      );
    }

    // Créer le SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      payment_method: paymentMethodId,
      customer: customerId || undefined,
      confirm: true,
      usage: 'off_session', // Permet de charger la carte plus tard sans présence du client
      description: 'Enregistrement carte pour caution - activation manuelle si litige',
      metadata: {
        type: 'caution_setup',
        userId: userId || '',
        listingId: listingId || '',
        reservation: JSON.stringify(reservationData || {}),
        max_amount: '30000', // 300€ max (info uniquement)
        note: 'Carte en standby - débit uniquement si litige déclaré'
      }
    });

    console.log('✅ SetupIntent créé:', setupIntent.id, 'Status:', setupIntent.status);

    return NextResponse.json({
      success: true,
      setupIntent: {
        id: setupIntent.id,
        status: setupIntent.status,
        payment_method: setupIntent.payment_method
      }
    });

  } catch (error) {
    console.error('❌ Erreur création SetupIntent:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du SetupIntent' },
      { status: 500 }
    );
  }
}
