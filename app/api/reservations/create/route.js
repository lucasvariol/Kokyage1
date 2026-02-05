import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import { reservationHostPendingTemplate } from '@/email-templates/reservation-host-pending';
import { reservationGuestPendingTemplate } from '@/email-templates/reservation-guest-pending';
import { calculateShares } from '@/lib/commissions';
import { createReservationSchema, validateOrError } from '@/lib/validators';
import logger from '@/lib/logger';
import { applyRateLimit, contentRateLimit } from '@/lib/ratelimit';
import { generateUniqueShortId } from '@/lib/generateShortId';
import Stripe from 'stripe';

const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

export async function POST(request) {
  // Rate limiting: 10 réservations par minute
  const rateLimitResult = await applyRateLimit(contentRateLimit, request);
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  try {
    const body = await request.json();
    
    // ✅ VALIDATION SÉCURISÉE DES INPUTS
    const validation = validateOrError(createReservationSchema, body);
    if (!validation.valid) {
      logger.warn('Invalid reservation data', { errors: validation.errors });
      return NextResponse.json(
        { error: validation.message, errors: validation.errors },
        { status: 400 }
      );
    }

    // Données validées et typées
    const {
      listingId,
      guestId,
      startDate,
      endDate,
      guests,
      basePrice,
      taxPrice,
      totalPrice,
      transactionId,
      cautionIntentId,
      paymentMethodId,
      refund50PercentDate,
      refund0PercentDate
    } = validation.data;

    console.log('🔍 [API Reservation] Données reçues:', {
      cautionIntentId,
      paymentMethodId,
      transactionId
    });

    logger.api('POST', '/api/reservations/create', { listingId, guestId, totalPrice });

    // Récupérer les infos du logement (owner et id_proprietaire, price)
    logger.debug('Fetching listing', { listingId });
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('owner_id, id_proprietaire, price_per_night, title, city')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      logger.error('Listing not found', { listingId, error: listingError?.message });
      return NextResponse.json(
        { error: 'Logement non trouvé' },
        { status: 404 }
      );
    }

    logger.debug('Listing found', { listingId, title: listing.title });

    // Calculer le nombre de nuits - Parser les dates YYYY-MM-DD comme dates locales
    const parseLocalDate = (dateStr) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };
    const startDateObj = parseLocalDate(startDate);
    const endDateObj = parseLocalDate(endDate);
    const nights = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24));

    // Calculs des parts selon le business model :
    // basePrice contient déjà hébergement + frais plateforme
    const totalBasePrice = Number(basePrice || 0); // hébergement + frais plateforme
    const totalTaxPrice = Number(taxPrice || 0);
    
    // Le prix d'hébergement par nuit depuis le listing
    const ppn = Number(listing.price_per_night || 0);
    const hebergementTotal = ppn * nights;
    
    // Les frais de plateforme sont : basePrice - hébergement
    const fraisPlateforme = totalBasePrice - hebergementTotal;
    
    // Utiliser la fonction centralisée pour calculer les parts
    const { platform_share, platform_tva, main_tenant_share, proprietor_share } = calculateShares(
      hebergementTotal,
      fraisPlateforme
    );

    // Générer un ID court unique pour la réservation
    const checkDisplayIdExists = async (displayId) => {
      const { data } = await supabaseAdmin
        .from('reservations')
        .select('id')
        .eq('display_id', displayId)
        .maybeSingle();
      return !!data;
    };
    
    const displayId = await generateUniqueShortId(checkDisplayIdExists);
    logger.debug('Generated display ID', { displayId });

    console.log('💾 [API Reservation] Insertion avec caution_intent_id:', cautionIntentId);

    // Créer la réservation directement dans la table
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .insert({
        display_id: displayId,
        user_id: guestId,  // Utiliser user_id au lieu de guest_id
        listing_id: listingId,
        host_id: listing.owner_id,
        date_arrivee: startDate,  // Date d'arrivée
        date_depart: endDate,     // Date de départ
        nights: nights,
  guests: parseInt(guests, 10),
        base_price: basePrice,
        tax_price: taxPrice,
        total_price: totalPrice,
        transaction_id: transactionId,
        proprietor_share,
        main_tenant_share,
        platform_share,
        platform_tva,
        caution_intent_id: cautionIntentId || null,
        caution_status: cautionIntentId ? 'setup' : null,
        payment_method_id: paymentMethodId || null,
        refund_50_percent_date: refund50PercentDate || null,
        refund_0_percent_date: refund0PercentDate || null,
        status: 'confirmed',
        payment_status: 'authorized',
        host_validation_ok: false
      })
      .select()
      .single();

    if (reservationError) {
      console.error('Erreur lors de la création de la réservation:', reservationError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la réservation: ' + reservationError.message },
        { status: 500 }
      );
    }

    console.log('✅ [API Reservation] Créée avec ID:', reservation.id, 'caution_intent_id:', reservation.caution_intent_id);

    // Mettre à jour le PaymentIntent Stripe avec l'ID de réservation pour traçabilité
    if (transactionId && displayId) {
      try {
        await stripe.paymentIntents.update(transactionId, {
          metadata: {
            reservation_id: reservation.id,
            display_id: displayId,
            reservation_display: '#' + displayId
          },
          description: `Réservation #${displayId} - ${listing.title}`
        });
        logger.debug('PaymentIntent updated with reservation ID', { transactionId, displayId });
      } catch (stripeError) {
        // Non-bloquant : si la mise à jour Stripe échoue, on continue quand même
        logger.warn('Failed to update PaymentIntent metadata', { error: stripeError.message });
      }
    }

    // Mettre à jour le SetupIntent également si présent
    if (cautionIntentId && displayId) {
      try {
        await stripe.setupIntents.update(cautionIntentId, {
          metadata: {
            reservation_id: reservation.id,
            display_id: displayId,
            reservation_display: '#' + displayId
          },
          description: `Caution réservation #${displayId}`
        });
        logger.debug('SetupIntent updated with reservation ID', { setupIntentId: cautionIntentId, displayId });
      } catch (stripeError) {
        logger.warn('Failed to update SetupIntent metadata', { error: stripeError.message });
      }
    }

    // Bloquer les dates dans la table disponibilities
    const reservationId = reservation.id;
    
    // Générer toutes les dates entre start et end (exclusive)
    // Utiliser les dates déjà parsées en local
    const datesToBlock = [];
    let currentDate = new Date(startDateObj);
    
    while (currentDate < endDateObj) {
      datesToBlock.push({
        listing_id: listingId,
        date: currentDate.toISOString().split('T')[0], // Format YYYY-MM-DD
        booked: 'Yes'  // Marquer comme réservé
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Marquer les dates comme réservées (booked = 'Yes')
    if (datesToBlock.length > 0) {
      let insertedCount = 0;
      let updatedCount = 0;
      
      // Traiter chaque date individuellement
      for (const dateToBlock of datesToBlock) {
        // Vérifier si la date existe déjà
        const { data: existingDate } = await supabaseAdmin
          .from('disponibilities')
          .select('id')
          .eq('listing_id', dateToBlock.listing_id)
          .eq('date', dateToBlock.date)
          .single();

        if (existingDate) {
          // Mettre à jour la date existante
          const { error: updateError } = await supabaseAdmin
            .from('disponibilities')
            .update({ booked: 'Yes' })
            .eq('id', existingDate.id);
            
          if (!updateError) updatedCount++;
        } else {
          // Insérer une nouvelle date
          const { error: insertError } = await supabaseAdmin
            .from('disponibilities')
            .insert(dateToBlock);
            
          if (!insertError) insertedCount++;
        }
      }

      console.log(`✅ Réservation ${reservationId}: ${insertedCount} dates créées, ${updatedCount} dates mises à jour`);
      console.log('📅 Dates marquées comme "booked: Yes":', datesToBlock.map(d => d.date).join(', '));
    }

    // Essayer de récupérer les détails avec une requête manuelle si la vue n'existe pas
    let reservationDetails = null;
    try {
      const { data: details } = await supabaseAdmin
        .from('reservations')
        .select(`
          *,
          listings!inner(title, owner_id),
          guest:profiles!user_id(full_name, email),
          host:profiles!host_id(full_name, email)
        `)
        .eq('id', reservationId)
        .single();
      
      reservationDetails = details;
    } catch (detailsError) {
      console.error('Erreur lors de la récupération des détails:', detailsError);
      // Continuer sans les détails
    }

    // Envoi de 2 emails systématiques: un à l'hôte (validation requise) et un au voyageur (confirmation + délai 48h).
    try {
      if (listing?.owner_id) {
        const { data: hostUserData, error: hostUserError } = await supabaseAdmin.auth.admin.getUserById(listing.owner_id);
        if (hostUserError) throw hostUserError;

        const hostUser = hostUserData?.user;
        if (hostUser?.email) {
          const [hostProfileResult, guestProfileResult, guestUserResult] = await Promise.all([
            supabaseAdmin
              .from('profiles')
              .select('name')
              .eq('id', listing.owner_id)
              .maybeSingle(),
            supabaseAdmin
              .from('profiles')
              .select('name')
              .eq('id', guestId)
              .maybeSingle(),
            supabaseAdmin.auth.admin.getUserById(guestId)
          ]);

          if (hostProfileResult?.error) throw hostProfileResult.error;
          if (guestProfileResult?.error) throw guestProfileResult.error;
          if (guestUserResult?.error) throw guestUserResult.error;

          const hostProfile = hostProfileResult?.data;
          const guestProfile = guestProfileResult?.data;
          const guestUser = guestUserResult?.data?.user;

          const hostRawName = hostProfile?.name
            || hostUser.user_metadata?.full_name
            || hostUser.email;
          const guestRawName = guestProfile?.name
            || guestUser?.user_metadata?.full_name
            || guestUser?.email
            || 'Voyageur';

          const hostName = hostRawName?.trim?.().split(/\s+/)[0] || 'Hôte';
          const guestName = guestRawName?.trim?.() || 'Voyageur';

          const formatDate = (value) => new Date(value).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });

          const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
          }).format(Number(value || 0));

          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com';
          const reservationUrl = `${baseUrl}/profil-hote`;

          const emailPayload = {
            reservationId: '#' + displayId, // ID court et lisible
            tenantName: hostName,
            guestName,
            listingTitle: listing.title || 'Votre logement',
            listingCity: listing.city || 'Localisation non renseignée',
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            nights,
            guests: parseInt(guests, 10) || 1,
            totalPrice: formatCurrency(totalPrice),
            reservationUrl
          };

          // Envoi email à l'hôte (notification nouvelle réservation à valider)
          await resend.emails.send({
            from: process.env.MAIL_FROM || 'Kokyage <contact@kokyage.com>',
            to: hostUser.email,
            subject: reservationHostPendingTemplate.subject,
            html: reservationHostPendingTemplate.getHtml(emailPayload),
            text: reservationHostPendingTemplate.getText(emailPayload)
          });

          console.log('📧 Email envoyé à l\'hôte (validation requise)');

          // Envoi email au voyageur (confirmation + info délai 48h)
          if (guestUser?.email) {
            const guestEmailPayload = {
              reservationId: '#' + displayId, // ID court et lisible
              guestName,
              listingTitle: listing.title || 'Votre logement',
              listingCity: listing.city || 'Localisation non renseignée',
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              nights,
              guests: parseInt(guests, 10) || 1,
              totalPrice: formatCurrency(totalPrice)
            };

            await resend.emails.send({
              from: process.env.MAIL_FROM || 'Kokyage <contact@kokyage.com>',
              to: guestUser.email,
              subject: reservationGuestPendingTemplate.subject,
              html: reservationGuestPendingTemplate.getHtml(guestEmailPayload),
              text: reservationGuestPendingTemplate.getText(guestEmailPayload)
            });

            console.log('📧 Email envoyé au voyageur (confirmation + délai 48h)');
          } else {
            console.warn('⚠️ Impossible d\'envoyer l\'email au voyageur : adresse email manquante');
          }
        } else {
          console.warn('⚠️ Impossible d\'envoyer l\'email : adresse de l\'hôte manquante');
        }
      }
    } catch (emailError) {
      console.error('❌ Échec envoi emails:', emailError);
    }

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservationId,
        status: 'confirmed',
        message: 'Réservation créée avec succès !',
        details: reservationDetails || reservation
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de la réservation' },
      { status: 500 }
    );
  }
}