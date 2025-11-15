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
        id,
        listing_id,
        host_id,
        user_id,
        proprietor_share,
        main_tenant_share,
        platform_share,
        total_amount,
        caution_status,
        caution_payment_intent_id,
        balances_allocated,
        status,
        payment_status,
        end_date,
        listings (
          id,
          title,
          owner_id,
          id_proprietaire
        )
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

        // 3. Récupérer les IDs du propriétaire et locataire principal
        const listing = reservation.listings;
        if (!listing) {
          console.error(`❌ Listing introuvable pour réservation #${reservation.id}`);
          results.push({
            reservation_id: reservation.id,
            success: false,
            error: 'Listing not found'
          });
          continue;
        }

        const proprietorUserId = listing.id_proprietaire;  // Propriétaire (40%)
        const mainTenantUserId = listing.owner_id;         // Locataire principal (60%)

        // 4. Calculer les montants
        const proprietorAmount = Number(reservation.proprietor_share || 0);
        const mainTenantAmount = Number(reservation.main_tenant_share || 0);
        const platformAmount = Number(reservation.platform_share || 0);

        console.log(`💰 Répartition: Propriétaire ${proprietorAmount}€, Locataire principal ${mainTenantAmount}€, Plateforme ${platformAmount}€`);

        // 5. Mettre à jour les soldes des profils
        const updates = [];

        if (proprietorUserId && proprietorAmount > 0) {
          console.log(`👤 Ajout ${proprietorAmount}€ au solde du propriétaire ${proprietorUserId}`);
          
          const { data: propProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, total_earnings, to_be_paid_to_user')
            .eq('id', proprietorUserId)
            .single();

          if (propProfile) {
            updates.push(
              supabaseAdmin
                .from('profiles')
                .update({
                  total_earnings: Number(propProfile.total_earnings || 0) + proprietorAmount,
                  to_be_paid_to_user: Number(propProfile.to_be_paid_to_user || 0) + proprietorAmount,
                })
                .eq('id', proprietorUserId)
            );
          } else {
            console.warn(`⚠️ Profil propriétaire ${proprietorUserId} introuvable`);
          }
        }

        if (mainTenantUserId && mainTenantAmount > 0) {
          console.log(`👤 Ajout ${mainTenantAmount}€ au solde du locataire principal ${mainTenantUserId}`);
          
          const { data: tenantProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, total_earnings, to_be_paid_to_user')
            .eq('id', mainTenantUserId)
            .single();

          if (tenantProfile) {
            updates.push(
              supabaseAdmin
                .from('profiles')
                .update({
                  total_earnings: Number(tenantProfile.total_earnings || 0) + mainTenantAmount,
                  to_be_paid_to_user: Number(tenantProfile.to_be_paid_to_user || 0) + mainTenantAmount,
                })
                .eq('id', mainTenantUserId)
            );
          } else {
            console.warn(`⚠️ Profil locataire principal ${mainTenantUserId} introuvable`);
          }
        }

        // Exécuter toutes les mises à jour
        const updateResults = await Promise.all(updates);
        for (const r of updateResults) {
          if (r.error) {
            console.error(`❌ Erreur mise à jour profil:`, r.error);
            throw new Error(r.error.message);
          }
        }

        // 6. Marquer la réservation comme allouée
        await supabaseAdmin
          .from('reservations')
          .update({
            balances_allocated: true,
            balances_allocated_at: new Date().toISOString(),
            host_payout_date: new Date().toISOString(),
            kokyage_commission: platformAmount
          })
          .eq('id', reservation.id);

        results.push({
          reservation_id: reservation.id,
          success: true,
          proprietor_amount: proprietorAmount,
          main_tenant_amount: mainTenantAmount,
          platform_amount: platformAmount
        });

        console.log(`🎉 Paiement automatique réussi pour #${reservation.id}`);

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
