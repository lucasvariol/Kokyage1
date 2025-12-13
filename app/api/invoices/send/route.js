import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      paymentIntentId,
      reservationId,
      reservation,
      listing,
    } = body || {};

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'paymentIntentId manquant' }, { status: 400 });
    }

    const effectiveReservationId = reservationId || reservation?.id;
    if (!effectiveReservationId) {
      return NextResponse.json({ error: 'reservationId manquant' }, { status: 400 });
    }

    // Récupère le PaymentIntent pour identifier le customer
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const customerId = typeof paymentIntent.customer === 'string'
      ? paymentIntent.customer
      : paymentIntent.customer?.id;

    if (!customerId) {
      return NextResponse.json({ error: 'Impossible de déterminer le customer Stripe' }, { status: 400 });
    }

    // Idempotence basique : ne crée pas une nouvelle facture si elle existe déjà
    // DÉSACTIVÉ POUR TESTS
    /*
    try {
      const existingInvoices = await stripe.invoices.search({
        query: `metadata['reservationId']:'${effectiveReservationId}'`,
        limit: 1,
      });
      const existing = existingInvoices.data?.[0];
      if (existing) {
        return NextResponse.json({
          success: true,
          alreadyExists: true,
          invoice: {
            id: existing.id,
            status: existing.status,
            hosted_invoice_url: existing.hosted_invoice_url,
            invoice_pdf: existing.invoice_pdf,
          },
        });
      }
    } catch (searchError) {
      console.warn('⚠️ Recherche de facture existante échouée (continuation):', searchError?.message || searchError);
    }
    */

    const currency = paymentIntent.currency || 'eur';
    const baseAmount = Math.round(Number(reservation?.base_price || 0) * 100);
    const taxAmount = Math.round(Number(reservation?.tax_price || 0) * 100);
    const totalAmount = Math.max(0, Math.round(Number(reservation?.total_price || paymentIntent.amount || 0)));
    
    // Calcul de l'hébergement et des frais séparément
    const nights = Number(reservation?.nights || 1);
    const pricePerNight = Number(listing?.price_per_night || reservation?.listing_price_per_night || 0);
    const hebergementAmount = Math.round(pricePerNight * nights * 100);
    
    // Frais de plateforme TTC (déjà inclus dans base_price)
    // IMPORTANT: on considère ce montant comme TTC pour éviter que Stripe rajoute la TVA par-dessus.
    const fraisTTC = baseAmount - hebergementAmount;
    
    // Créer/récupérer le taux de TVA français (INCLUSIF)
    // Objectif: afficher la TVA sur la ligne "Frais" sans augmenter le total (le prix payé inclut déjà la TVA).
    const VAT_RATE = Number(process.env.VAT_RATE || 20); // Taux de TVA en %
    let taxRate;
    try {
      // Chercher si le tax_rate existe déjà
      const existingTaxRates = await stripe.taxRates.list({ limit: 10 });
      taxRate = existingTaxRates.data.find(rate => 
        rate.percentage === VAT_RATE && 
        rate.active && 
        rate.jurisdiction === 'FR' &&
        rate.inclusive === true
      );
      
      // Si pas trouvé, créer un nouveau tax_rate
      if (!taxRate) {
        taxRate = await stripe.taxRates.create({
          display_name: 'TVA',
          description: `TVA française ${VAT_RATE}% (incluse)`,
          jurisdiction: 'FR',
          percentage: VAT_RATE,
          inclusive: true, // TVA incluse dans le prix
        });
        console.log('✅ Tax rate créé:', taxRate.id);
      } else {
        console.log('✅ Tax rate existant utilisé:', taxRate.id);
      }
    } catch (taxError) {
      console.error('❌ Erreur création tax_rate:', taxError);
    }
    
    // Les frais sont TTC, on calcule le HT pour logs/contrôles
    const fraisHT = Math.round(fraisTTC / (1 + VAT_RATE / 100));

    console.log('📊 Calcul facture:', {
      nights,
      pricePerNight,
      hebergementAmount,
      fraisTTC,
      fraisHT,
      taxAmount,
      totalAmount,
      taxRateId: taxRate?.id
    });

    // Crée une facture en mode "send_invoice" pour envoi par email
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 0,
      auto_advance: false,
      // On ne veut PAS que Stripe applique des taxes par défaut à toutes les lignes
      automatic_tax: { enabled: false },
      default_tax_rates: [],
      description: `Réservation #${effectiveReservationId.slice(0, 8).toUpperCase()} - Séjour Kokyage du ${reservation?.date_arrivee || reservation?.start_date || ''} au ${reservation?.date_depart || reservation?.end_date || ''}`.trim(),
      footer: process.env.STRIPE_INVOICE_FOOTER || 'KOKYAGE - SAS au capital de 10 000€ - SIRET: XXX XXX XXX - RCS Paris - TVA: FRXX XXX XXX XXX',
      rendering_options: {
        amount_tax_display: 'include_inclusive_tax'
      },
      metadata: {
        reservationId: effectiveReservationId,
        listingId: reservation?.listing_id || listing?.id || '',
        paymentIntentId,
      },
    });

    const lineItemPromises = [];
    
    // Ligne 1: Hébergement (pas de TVA sur l'hébergement meublé)
    if (hebergementAmount > 0) {
      lineItemPromises.push(stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: hebergementAmount,
        currency,
        description: `Hébergement (${nights} nuit${nights > 1 ? 's' : ''})`,
      }));
    }
    
    // Ligne 2: Frais de plateforme (TTC) avec TVA INCLUSE appliquée uniquement sur cette ligne
    // (Stripe extrait la TVA mais ne modifie pas le total)
    if (fraisTTC > 0 && taxRate) {
      lineItemPromises.push(stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: fraisTTC,
        currency,
        description: 'Frais de plateforme Kokyage',
        tax_rates: [taxRate.id], // TVA affichée sur cette ligne uniquement (incluse)
      }));
    }

    // Ligne 3: Taxe de séjour
    if (taxAmount > 0) {
      lineItemPromises.push(stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: taxAmount,
        currency,
        description: 'Taxe de séjour',
      }));
    }

    console.log('📝 Nombre de lignes de facture:', lineItemPromises.length);

    // Si aucun des montants n'est fourni, on crée au moins une ligne équivalente au montant du payment intent
    if (lineItemPromises.length === 0 && totalAmount > 0) {
      console.log('⚠️ Fallback: création d\'une ligne unique');
      lineItemPromises.push(stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: totalAmount,
        currency,
        description: 'Séjour Kokyage',
      }));
    }

    await Promise.all(lineItemPromises);

    // Finalise la facture
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, { auto_advance: false });

    // Marque la facture comme payée pour éviter une nouvelle demande de paiement
    if ((baseAmount + taxAmount > 0) || totalAmount > 0) {
      try {
        await stripe.invoices.pay(finalizedInvoice.id, { paid_out_of_band: true });
      } catch (payError) {
        console.warn('⚠️ Impossible de marquer la facture comme payée automatiquement:', payError?.message || payError);
      }
    }

    // Envoie la facture par email
    try {
      await stripe.invoices.sendInvoice(finalizedInvoice.id);
    } catch (sendError) {
      console.warn('⚠️ Envoi de la facture par email échoué:', sendError?.message || sendError);
    }

    const refreshedInvoice = await stripe.invoices.retrieve(finalizedInvoice.id);

    return NextResponse.json({
      success: true,
      invoice: {
        id: refreshedInvoice.id,
        status: refreshedInvoice.status,
        hosted_invoice_url: refreshedInvoice.hosted_invoice_url,
        invoice_pdf: refreshedInvoice.invoice_pdf,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la création/envoi de facture Stripe:', error);
    return NextResponse.json({
      error: error?.message || 'Erreur lors de la création de la facture',
    }, { status: 500 });
  }
}
