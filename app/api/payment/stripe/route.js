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
      if (existingCustomers.data.length > 0) {
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

    // 1. Paiement principal (setup_future_usage attachera automatiquement le PM au Customer)
    const paymentIntent = await stripe.paymentIntents.create({
  ...paymentIntentConfig,
  payment_method: paymentMethodToUse,
  customer: customer ? customer.id : undefined,
  confirmation_method: 'manual',
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
      // Récupérer le PaymentMethod attaché au Customer après le succès
      const attachedPaymentMethod = paymentIntent.payment_method;
      console.log('[Stripe API] PaymentIntent succeeded. Attached PM:', attachedPaymentMethod);
      
      // Calculer les jours avant l'arrivée
      const dateArrivee = reservationData?.startDate ? new Date(reservationData.startDate) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate day calculation
      if (dateArrivee) {
        dateArrivee.setHours(0, 0, 0, 0);
      }
      const daysUntilArrival = dateArrivee ? Math.floor((dateArrivee - today) / (1000 * 60 * 60 * 24)) : 0;
      
      console.log('[Stripe API] Date arrivée:', dateArrivee?.toISOString());
      console.log('[Stripe API] Jours avant arrivée:', daysUntilArrival);

      // Si l'arrivée est dans 7 jours ou moins, créer la caution immédiatement
      if (daysUntilArrival <= 7) {
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
          payment_method_id: attachedPaymentMethod,
          message: 'Paiement effectué avec succès et empreinte bancaire enregistrée !'
        });
      } else {
        // Arrivée dans plus de 7 jours : sauvegarder le PaymentMethod pour création différée
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
          cautionIntent: null,
          payment_method_id: attachedPaymentMethod,
          caution_scheduled: true,
          message: `Paiement effectué avec succès ! L'empreinte bancaire de caution (300€) sera créée 7 jours avant votre arrivée.`
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