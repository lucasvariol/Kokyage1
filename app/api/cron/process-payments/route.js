import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  // Sécurité : vérifier que l'appel vient de Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('🔄 Début du traitement automatique des paiements');

  try {
    // 1. Trouver les réservations terminées
    const { data: reservations, error } = await supabaseAdmin
      .from('reservations')
      .select(`
        *,
        listings (
          title,
          price_per_night,
          users:user_id (id, email, prenom, nom)
        ),
        users:user_id (id, email, prenom, nom)
      `)
      .eq('status', 'confirmed')
      .eq('payment_status', 'paid')
      .lt('end_date', new Date().toISOString().split('T')[0])
      .eq('balances_allocated', false);

    if (error) {
      console.error('❌ Erreur récupération réservations:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log(`📊 ${reservations?.length || 0} réservations à traiter`);

    const results = [];

    for (const reservation of reservations || []) {
      try {
        console.log(`💳 Traitement réservation #${reservation.id}`);

        // 2. Capturer la caution si nécessaire
        if (reservation.caution_status === 'authorized' && reservation.caution_payment_intent_id) {
          console.log(`🔐 Capture caution pour #${reservation.id}`);
          
          const paymentIntent = await stripe.paymentIntents.capture(
            reservation.caution_payment_intent_id
          );

          await supabaseAdmin
            .from('reservations')
            .update({
              caution_status: 'captured',
              caution_captured_at: new Date().toISOString()
            })
            .eq('id', reservation.id);

          console.log(`✅ Caution capturée: ${paymentIntent.amount_captured / 100}€`);
        }

        // 3. Calculer et transférer les montants
        const totalAmount = reservation.total_amount;
        const commissionKokyage = totalAmount * 0.15; // 15% commission
        const amountToOwner = totalAmount - commissionKokyage;

        console.log(`💰 Montant total: ${totalAmount}€, Commission: ${commissionKokyage}€, Hôte: ${amountToOwner}€`);

        // 4. Créer un paiement vers le compte Stripe Connect de l'hôte
        const listing = reservation.listings;
        if (listing?.users?.stripe_account_id) {
          const transfer = await stripe.transfers.create({
            amount: Math.round(amountToOwner * 100), // en centimes
            currency: 'eur',
            destination: listing.users.stripe_account_id,
            transfer_group: `reservation_${reservation.id}`,
            description: `Paiement réservation #${reservation.id} - ${listing.title}`,
            metadata: {
              reservation_id: reservation.id,
              listing_id: reservation.listing_id
            }
          });

          console.log(`✅ Transfert créé: ${transfer.id}`);

          // 5. Mettre à jour la réservation
          await supabaseAdmin
            .from('reservations')
            .update({
              balances_allocated: true,
              host_payout_amount: amountToOwner,
              kokyage_commission: commissionKokyage,
              host_payout_date: new Date().toISOString(),
              stripe_transfer_id: transfer.id
            })
            .eq('id', reservation.id);

          results.push({
            reservation_id: reservation.id,
            success: true,
            transfer_id: transfer.id,
            amount: amountToOwner
          });

          console.log(`🎉 Paiement automatique réussi pour #${reservation.id}`);
        } else {
          console.warn(`⚠️ Pas de compte Stripe pour l'hôte de la réservation #${reservation.id}`);
          results.push({
            reservation_id: reservation.id,
            success: false,
            error: 'No Stripe account for host'
          });
        }

      } catch (err) {
        console.error(`❌ Erreur traitement réservation #${reservation.id}:`, err);
        results.push({
          reservation_id: reservation.id,
          success: false,
          error: err.message
        });
      }
    }

    console.log('✅ Traitement automatique terminé');

    return Response.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('❌ Erreur globale:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
