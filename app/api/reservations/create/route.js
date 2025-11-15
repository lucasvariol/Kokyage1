import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import { reservationPaymentConfirmedTemplate } from '@/email-templates/reservation-payment-confirmed';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
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
      cautionIntentId
    } = body;

    // Pour les tests, utiliser un guestId par défaut si non fourni
    const finalGuestId = guestId || '0583f884-6001-4f3f-9e21-4c7f47859674';

    // Validation des données
    if (!listingId || !startDate || !endDate || !guests || !totalPrice || !transactionId) {
      return NextResponse.json(
        { error: 'Données manquantes pour créer la réservation' },
        { status: 400 }
      );
    }

    // Récupérer les infos du logement (owner et id_proprietaire, price)
    console.log('🔍 Recherche du listing avec ID:', listingId);
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('owner_id, id_proprietaire, price_per_night, title, city')
      .eq('id', listingId)
      .single();

    console.log('📊 Résultat de la requête listing:');
    console.log('- Data:', listing);
    console.log('- Error:', listingError);

    if (listingError || !listing) {
      console.log('❌ Listing non trouvé ou erreur:', listingError?.message);
      return NextResponse.json(
        { error: 'Logement non trouvé', details: listingError?.message },
        { status: 404 }
      );
    }

    console.log('✅ Listing trouvé:', listing);

    // Calculer le nombre de nuits
    const nights = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));

    // Calculs des parts selon le business model :
    // basePrice contient déjà hébergement + frais plateforme
    // On extrait l'hébergement pur en retirant les frais (qui sont calculés depuis confirmer-et-payer)
    const totalBasePrice = Number(basePrice || 0); // hébergement + frais plateforme
    const totalTaxPrice = Number(taxPrice || 0);
    
    // Le prix d'hébergement par nuit depuis le listing
    const ppn = Number(listing.price_per_night || 0);
    const hebergementTotal = ppn * nights;
    
    // Les frais de plateforme sont : basePrice - hébergement
    const fraisPlateforme = totalBasePrice - hebergementTotal;
    
    // Calcul des parts :
    // Platform share = frais plateforme + 3% de l'hébergement
    const platform_share = fraisPlateforme + (hebergementTotal * 0.03);
    
    // Les 97% restants se répartissent entre propriétaire (40%) et locataire (60%)
    const main_tenant_share = hebergementTotal * 0.97 * 0.6;
    const proprietor_share = hebergementTotal * 0.97 * 0.4;

    // Créer la réservation directement dans la table
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .insert({
        user_id: finalGuestId,  // Utiliser user_id au lieu de guest_id
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
        caution_intent_id: cautionIntentId || null,
        caution_status: cautionIntentId ? 'authorized' : null,
        status: 'confirmed',
        payment_status: 'paid',
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

    // Bloquer les dates dans la table disponibilities
    const reservationId = reservation.id;
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Générer toutes les dates entre start et end (exclusive)
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
          guest:profiles!guest_id(full_name, email),
          host:profiles!host_id(full_name, email)
        `)
        .eq('id', reservationId)
        .single();
      
      reservationDetails = details;
    } catch (detailsError) {
      console.error('Erreur lors de la récupération des détails:', detailsError);
      // Continuer sans les détails
    }

    // Notifier le locataire principal (owner_id) qu'un paiement vient d'être confirmé
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
              .eq('id', finalGuestId)
              .maybeSingle(),
            supabaseAdmin.auth.admin.getUserById(finalGuestId)
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

          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kokyage.com';
          const reservationUrl = `${baseUrl}/reservations?view=host&reservationId=${reservationId}`;

          const emailPayload = {
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

          await resend.emails.send({
            from: process.env.MAIL_FROM || 'Kokyage <contact@kokyage.com>',
            to: hostUser.email,
            subject: reservationPaymentConfirmedTemplate.subject,
            html: reservationPaymentConfirmedTemplate.getHtml(emailPayload),
            text: reservationPaymentConfirmedTemplate.getText(emailPayload)
          });

          console.log('📧 Email paiement confirmé envoyé au locataire principal');
        } else {
          console.warn('⚠️ Impossible d\'envoyer l\'email : adresse du locataire principal manquante');
        }
      }
    } catch (emailError) {
      console.error('❌ Échec envoi email paiement confirmé:', emailError);
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