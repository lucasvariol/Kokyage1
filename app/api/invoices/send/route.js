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

    const currency = paymentIntent.currency || 'eur';
    const baseAmount = Math.round(Number(reservation?.base_price || 0) * 100);
    const taxAmount = Math.round(Number(reservation?.tax_price || 0) * 100);
    const totalAmount = Math.max(0, Math.round(Number(reservation?.total_price || paymentIntent.amount || 0)));

    // Crée une facture en mode "send_invoice" pour envoi par email
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 0,
      auto_advance: false,
      description: `Séjour Kokyage du ${reservation?.date_arrivee || reservation?.start_date || ''} au ${reservation?.date_depart || reservation?.end_date || ''}`.trim(),
      metadata: {
        reservationId: effectiveReservationId,
        listingId: reservation?.listing_id || listing?.id || '',
        paymentIntentId,
      },
    });

    const lineItemPromises = [];
    if (baseAmount > 0) {
      lineItemPromises.push(stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: baseAmount,
        currency,
        description: 'Hébergement et frais Kokyage',
      }));
    }

    if (taxAmount > 0) {
      lineItemPromises.push(stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: taxAmount,
        currency,
        description: 'Taxes de séjour',
      }));
    }

    // Si aucun des montants n'est fourni, on crée au moins une ligne équivalente au montant du payment intent
    if (lineItemPromises.length === 0 && totalAmount > 0) {
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
