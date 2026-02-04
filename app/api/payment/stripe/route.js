import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createPaymentSchema, validateOrError } from '@/lib/validators';
import logger from '@/lib/logger';
import { applyRateLimit, paymentRateLimit } from '@/lib/ratelimit';

// Configuration Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const STRIPE_KEY_MODE = (process.env.STRIPE_SECRET_KEY || '').includes('_test_') ? 'test' : 'live';
logger.info(`[Stripe API] Running in ${STRIPE_KEY_MODE} mode`);

export async function POST(request) {
  // Rate limiting: 3 paiements par 5 minutes
  const rateLimitResult = await applyRateLimit(paymentRateLimit, request);
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  try {
    const body = await request.json();
    
    // Validation sécurisée des inputs
    const validation = validateOrError(createPaymentSchema, body);
    if (!validation.valid) {
      logger.warn('Invalid payment data', { errors: validation.errors });
      return NextResponse.json(
        { error: validation.message, errors: validation.errors },
        { status: 400 }
      );
    }

    const { 
      amount, 
      currency = 'eur',
      paymentMethodId,
      userId,
      userEmail,
      listingId,
      reservationData,
      metadata
    } = validation.data;

    logger.payment('Stripe payment request', { amount, currency, listingId });

    // 0. Récupérer/créer le Customer Stripe
    let customer;
    if (userId && userEmail) {
      // Recherche d'un customer existant par email
      const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (existingCustomers?.data && existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: userEmail,
          metadata: { userId }
        });
      }
    }

    // 0b. PaymentMethod sera attaché automatiquement lors de la création du PaymentIntent
    let paymentMethodToUse = paymentMethodId;
    if (!paymentMethodToUse) {
      console.warn('[Stripe API] No paymentMethodId provided');
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
    // Calcul détaillé pour métadonnées et traçabilité comptable
    const VAT_RATE = Number(process.env.VAT_RATE || 20); // Taux de TVA en %
    const nights = Number(reservationData?.nights || 1);
    const pricePerNight = Number(reservationData?.pricePerNight || 0);
    const hebergementTotal = pricePerNight * nights;
    const basePrice = Number(reservationData?.basePrice || 0);
    const taxPrice = Number(reservationData?.taxPrice || 0);
    
    // Frais de plateforme = basePrice - hébergement (TTC avec TVA)
    const fraisTTC = basePrice - hebergementTotal;
    const fraisHT = Math.round((fraisTTC / (1 + VAT_RATE / 100)) * 100) / 100; // HT pour comptabilité
    
    const paymentIntentConfig = {
      amount: Math.round(amount), // Montant en centimes
      currency: currency,
      metadata: {
        userId: userId || 'test-user',
        listingId: listingId || '',
        guests: reservationData?.guests?.toString() || '',
        nights: nights.toString(),
        // Détail comptable pour Stripe Dashboard
        hebergement: hebergementTotal.toFixed(2),
        frais_plateforme_ht: fraisHT.toFixed(2),
        frais_plateforme_tva_rate: VAT_RATE.toString(), // Taux de TVA applicable
        taxe_sejour: taxPrice.toFixed(2),
        total_ttc: (hebergementTotal + fraisTTC + taxPrice).toFixed(2),
        ...metadata
      },
      description: `Réservation Kokyage - ${nights} nuit(s) - Hébergement: ${hebergementTotal}€ + Frais (HT+TVA${VAT_RATE}%): ${fraisTTC}€ + Taxes: ${taxPrice}€`,
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

    // 1. Paiement principal
    // Objectif produit: ne pas débiter immédiatement, mais autoriser la carte, puis capturer au moment de l'acceptation hôte.
    const paymentIntent = await stripe.paymentIntents.create({
      ...paymentIntentConfig,
      payment_method: paymentMethodToUse,
      customer: customer ? customer.id : undefined,
      confirmation_method: 'manual',
      capture_method: 'manual', // autorisation, pas de débit immédiat
      confirm: true,
      setup_future_usage: 'off_session',
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com'}/reservations`,
    });

    console.log('[Stripe API] PaymentIntent created:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      customer: paymentIntent.customer,
      payment_method: paymentIntent.payment_method
    });

    // 2. SetupIntent pour la caution — carte enregistrée en standby, activation manuelle uniquement si litige
    let setupIntent = null;

    // Si le paiement principal nécessite une action supplémentaire (3D Secure, etc.)
    if (paymentIntent.status === 'requires_action') {
      return NextResponse.json({
        requiresAction: true,
        paymentIntent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          status: paymentIntent.status
        },
        setupIntent: null
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
        setupIntent: null
      }, { status: 400 });
    }

    // Paiement principal autorisé (non capturé) ou capturé (cas rare)
    if (paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded') {
      // Récupérer le PaymentMethod attaché au Customer après le succès
      const attachedPaymentMethod = paymentIntent.payment_method;
      console.log('[Stripe API] PaymentIntent succeeded. Attached PM:', attachedPaymentMethod);
      
      // Créer un SetupIntent pour enregistrer la carte (pas de débit, juste stockage)
      // Ce SetupIntent sera utilisé uniquement en cas de litige
      try {
        setupIntent = await stripe.setupIntents.create({
          payment_method: paymentMethodToUse,
          customer: customer ? customer.id : undefined,
          confirm: true,
          usage: 'off_session', // Permet de charger la carte plus tard sans présence du client
          description: 'Enregistrement carte pour caution - activation manuelle si litige',
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com'}/reservations`,
          metadata: {
            type: 'caution_setup',
            userId: userId || 'test-user',
            listingId: listingId || '',
            reservation: JSON.stringify(reservationData || {}),
            max_amount: '30000', // 300€ max (info uniquement)
            note: 'Carte en standby - débit uniquement si litige déclaré'
          }
        });

        console.log('[Stripe API] SetupIntent créé:', setupIntent.id, 'Status:', setupIntent.status);

        // Si le SetupIntent nécessite une action (3D Secure)
        if (setupIntent.status === 'requires_action') {
          return NextResponse.json({
            requiresAction: true,
            paymentIntent: {
              id: paymentIntent.id,
              client_secret: paymentIntent.client_secret,
              status: paymentIntent.status
            },
            setupIntent: {
              id: setupIntent.id,
              status: setupIntent.status,
              client_secret: setupIntent.client_secret
            },
            message: 'Action requise pour enregistrer la carte (3D Secure).'
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
          setupIntent: {
            id: setupIntent.id,
            status: setupIntent.status,
            payment_method: setupIntent.payment_method
          },
          payment_method_id: attachedPaymentMethod,
          message: paymentIntent.status === 'requires_capture'
            ? "Paiement autorisé (non débité). Le débit aura lieu lors de l'acceptation par l'hôte. Carte enregistrée pour caution (activation manuelle si litige uniquement)."
            : 'Paiement effectué avec succès ! Carte enregistrée pour caution (activation manuelle si litige uniquement).'
        });
      } catch (setupError) {
        console.error('[Stripe API] Erreur création SetupIntent:', setupError);
        // Continuer même si le SetupIntent échoue (le paiement principal a réussi)
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
          setupIntent: null,
          payment_method_id: attachedPaymentMethod,
          message: paymentIntent.status === 'requires_capture'
            ? "Paiement autorisé (non débité). Le débit aura lieu lors de l'acceptation par l'hôte."
            : 'Paiement effectué avec succès !',
          warning: 'Carte non enregistrée pour caution - SetupIntent a échoué'
        });
      }
    }

    // Autres statuts
    return NextResponse.json({
      success: false,
      error: 'Statut de paiement inattendu',
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status
      },
      setupIntent: null
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
    
    // Cas fréquent: PaymentMethod introuvable (souvent dû à une clé Stripe en mode différent)
    if (error.type === 'StripeInvalidRequestError' && /No such PaymentMethod/i.test(error.message)) {
      return NextResponse.json(
        {
          success: false,
          error: `Erreur Stripe: ${error.message}. Vérifiez que le PaymentMethod vient du même environnement (${STRIPE_KEY_MODE}) que la clé serveur.`,
          hint: `Si vous testez localement, utilisez des cartes de test et une clé sk_test_ côté serveur. En production, utilisez sk_live_.`,
          transaction: {
            status: 'error',
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
        },
        stripeEnv: STRIPE_KEY_MODE
      },
      { status: 500 }
    );
  }
}