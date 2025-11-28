import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Configuration Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      amount, 
      currency = 'eur',
      paymentMethodId,
      userId,
      userEmail,
      listingId,
      reservationData,
      metadata
    } = body;

    // 0. Récupérer/créer le Customer Stripe
    let customer;
    if (userId && userEmail) {
      // Recherche d'un customer existant par email
      const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: userEmail,
          metadata: { userId }
        });
      }
    }

    // 0b. Vérifier/attacher le PaymentMethod au bon Customer de manière défensive
    let paymentMethodToUse = paymentMethodId;
    if (paymentMethodId) {
      const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
      // Si le PM est déjà rattaché à un autre customer, on réutilise ce customer
      if (pm.customer && !customer) {
        customer = typeof pm.customer === 'string' ? { id: pm.customer } : pm.customer;
      }
      // Si on a un customer cible mais le PM n'y est pas attaché, on tente l'attache
      if (customer && (!pm.customer || (typeof pm.customer === 'string' ? pm.customer !== customer.id : pm.customer.id !== customer.id))) {
        try {
          await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
        } catch (e) {
          // Si l'attache échoue parce qu'il est déjà attaché ailleurs, on bascule sur le customer du PM
          if (pm.customer) {
            customer = typeof pm.customer === 'string' ? { id: pm.customer } : pm.customer;
          } else {
            throw e;
          }
        }
      }
      // Définir le PM par défaut pour ce customer
      if (customer) {
        await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: paymentMethodId } });
      }
    }

    // Validation des données de base
    if (!amount) {
      return NextResponse.json(
        { error: 'Montant manquant pour le paiement' },
        { status: 400 }
      );
    }

    // Configuration différente selon le mode (test vs confirmation)
    const isTestMode = !paymentMethodId;

    // Créer le PaymentIntent avec Stripe
    const paymentIntentConfig = {
      amount: Math.round(amount), // Montant en centimes
      currency: currency,
      metadata: {
        userId: userId || 'test-user',
        listingId: listingId || '',
        guests: reservationData?.guests?.toString() || '',
        nights: reservationData?.nights?.toString() || '',
        ...metadata
      },
      description: `Réservation Kokyage - ${reservationData?.nights || 1} nuit(s)`,
  // Affichage sur le relevé bancaire du client
  // Utiliser uniquement le suffixe pour les paiements carte
      statement_descriptor_suffix: 'KOKYAGE',
    };

    // Si mode test, pas de confirmation immédiate
    if (isTestMode) {
      // Création simple pour test
      const paymentIntent = await stripe.paymentIntents.create(paymentIntentConfig);
      return NextResponse.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          client_secret: paymentIntent.client_secret
        }
      });
    }

    // Mode normal avec payment method
    if (!paymentMethodId || !userId) {
      return NextResponse.json(
        { error: 'PaymentMethod et UserId requis pour la confirmation' },
        { status: 400 }
      );
    }

    // 1. Paiement principal (on permet la réutilisation du PM ensuite)
    const paymentIntent = await stripe.paymentIntents.create({
  ...paymentIntentConfig,
  payment_method: paymentMethodToUse,
  customer: customer ? customer.id : undefined,
  confirmation_method: 'manual',
  confirm: true,
  setup_future_usage: 'off_session',
  return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com'}/reservations`,
    });

    // 2. Empreinte bancaire (caution 300€) — on ne la crée qu'après succès du paiement principal
    let cautionIntent = null;

    // Si le paiement principal nécessite une action supplémentaire (3D Secure, etc.)
    if (paymentIntent.status === 'requires_action') {
      return NextResponse.json({
        requiresAction: true,
        paymentIntent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          status: paymentIntent.status
        },
        cautionIntent: null
      });
    }

    // Si le paiement principal a échoué
    if (paymentIntent.status === 'requires_payment_method') {
      return NextResponse.json({
        error: 'Le paiement a été refusé. Veuillez vérifier vos informations de carte.',
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status
        },
        cautionIntent: null
      }, { status: 400 });
    }

    // Paiement principal réussi
    if (paymentIntent.status === 'succeeded') {
      // Créer l'empreinte bancaire (caution) maintenant que le PM est réutilisable côté customer
      cautionIntent = await stripe.paymentIntents.create({
        amount: 30000, // 300€ en centimes
        currency: 'eur',
        payment_method: paymentMethodToUse,
        customer: customer ? customer.id : undefined,
        confirmation_method: 'manual',
        capture_method: 'manual', // autorisation, pas de débit
        confirm: true,
  description: 'Empreinte bancaire caution Kokyage',
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com'}/reservations`,
        metadata: {
          type: 'caution',
          userId: userId || 'test-user',
          listingId: listingId || '',
          reservation: JSON.stringify(reservationData || {})
        }
      });

      // Si la caution nécessite une action (rare mais possible)
      if (cautionIntent.status === 'requires_action') {
        return NextResponse.json({
          requiresAction: true,
          paymentIntent: {
            id: paymentIntent.id,
            client_secret: paymentIntent.client_secret,
            status: paymentIntent.status
          },
          cautionIntent: {
            id: cautionIntent.id,
            status: cautionIntent.status,
            client_secret: cautionIntent.client_secret
          },
          message: 'Action requise pour la caution (3D Secure).'
        });
      }

      return NextResponse.json({
        success: true,
        transaction: {
          transactionId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        },
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          charges: paymentIntent.charges?.data?.[0] ? {
            id: paymentIntent.charges.data[0].id,
            receipt_url: paymentIntent.charges.data[0].receipt_url,
            payment_method_details: {
              card: {
                last4: paymentIntent.charges.data[0].payment_method_details?.card?.last4,
                brand: paymentIntent.charges.data[0].payment_method_details?.card?.brand
              }
            }
          } : null
        },
        cautionIntent: {
          id: cautionIntent.id,
          status: cautionIntent.status,
          amount: cautionIntent.amount,
          currency: cautionIntent.currency,
          client_secret: cautionIntent.client_secret
        },
        message: 'Paiement effectué avec succès et empreinte bancaire enregistrée !'
      });
    }

    // Autres statuts
    return NextResponse.json({
      success: false,
      error: 'Statut de paiement inattendu',
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status
      },
      cautionIntent: {
        id: cautionIntent.id,
        status: cautionIntent.status
      }
    }, { status: 400 });

  } catch (error) {
    console.error('Erreur Stripe:', error);
    
    // Gestion spécifique des erreurs Stripe
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { 
          success: false,
          error: error.decline_code === 'test_mode_live_card' 
            ? 'Veuillez utiliser un numéro de carte de test : 4242424242424242'
            : error.message,
          transaction: {
            status: 'failed',
            error: error.message
          }
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error.type === 'StripeInvalidRequestError' 
          ? `Erreur Stripe: ${error.message}`
          : 'Erreur lors du traitement du paiement',
        transaction: {
          status: 'error',
          error: error.message
        }
      },
      { status: 500 }
    );
  }
}