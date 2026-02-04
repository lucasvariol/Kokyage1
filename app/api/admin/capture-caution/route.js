import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

/**
 * API pour capturer la caution en cas de litige
 * POST /api/admin/capture-caution
 */
export async function POST(request) {
  try {
    const { reservationId, amount, reason } = await request.json();

    // Validation
    if (!reservationId || !amount || !reason) {
      return NextResponse.json(
        { error: 'Paramètres manquants: reservationId, amount, reason requis' },
        { status: 400 }
      );
    }

    if (amount <= 0 || amount > 300) {
      return NextResponse.json(
        { error: 'Le montant doit être entre 0.01€ et 300€' },
        { status: 400 }
      );
    }

    // Récupérer la réservation
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .select('*, listings!inner(title)')
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: 'Réservation introuvable' },
        { status: 404 }
      );
    }

    // Vérifier qu'il y a bien un SetupIntent enregistré
    if (!reservation.caution_intent_id) {
      return NextResponse.json(
        { error: 'Aucune empreinte bancaire enregistrée pour cette réservation' },
        { status: 400 }
      );
    }

    // Vérifier que la caution n'a pas déjà été capturée
    if (reservation.caution_status === 'captured') {
      return NextResponse.json(
        { error: 'La caution a déjà été capturée pour cette réservation' },
        { status: 400 }
      );
    }

    // Récupérer le SetupIntent pour obtenir le payment_method et customer
    let paymentMethod;
    let customerId;

    try {
      const setupIntent = await stripe.setupIntents.retrieve(reservation.caution_intent_id);
      paymentMethod = setupIntent.payment_method;
      customerId = setupIntent.customer;

      if (!paymentMethod) {
        throw new Error('Payment method non trouvée dans le SetupIntent');
      }
    } catch (err) {
      console.error('Erreur récupération SetupIntent:', err);
      return NextResponse.json(
        { error: 'Impossible de récupérer les informations de paiement: ' + err.message },
        { status: 500 }
      );
    }

    // Créer le PaymentIntent pour prélever la caution
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir en centimes
      currency: 'eur',
      customer: customerId,
      payment_method: paymentMethod,
      off_session: true, // Permet le prélèvement sans présence du client
      confirm: true,
      description: `Caution prélevée - Réservation #${reservation.display_id || reservationId.slice(0, 8)}`,
      metadata: {
        reservation_id: reservationId,
        display_id: reservation.display_id || '',
        type: 'caution_capture',
        reason: reason,
        listing_title: reservation.listings?.title || ''
      }
    });

    console.log('💳 Caution capturée:', paymentIntent.id, '-', amount, '€');

    // Mettre à jour la réservation
    const { error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({
        caution_status: 'captured',
        caution_captured_at: new Date().toISOString(),
        litige: true,
        refund_amount: amount // Stocke le montant prélevé
      })
      .eq('id', reservationId);

    if (updateError) {
      console.error('Erreur mise à jour DB:', updateError);
      // Le prélèvement a réussi mais la DB n'a pas été mise à jour
      // On continue quand même pour ne pas bloquer
    }

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        status: paymentIntent.status
      },
      message: `Caution de ${amount}€ prélevée avec succès`
    });

  } catch (error) {
    console.error('❌ Erreur capture caution:', error);

    // Gérer les erreurs Stripe spécifiques
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { 
          error: 'Carte refusée: ' + error.message,
          decline_code: error.decline_code
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors du prélèvement: ' + error.message },
      { status: 500 }
    );
  }
}
