import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CANCELABLE_PAYMENT_INTENT_STATUSES = new Set([
  'requires_payment_method',
  'requires_capture',
  'requires_reauthorization',
  'requires_confirmation',
  'requires_action',
  'processing'
]);

function isStripeAlreadyCanceledPaymentIntentError(err) {
  const message = String(err?.message || '');
  const code = String(err?.code || '');
  return (
    message.includes('status of canceled') ||
    (code === 'payment_intent_unexpected_state' && message.toLowerCase().includes('canceled'))
  );
}

async function cancelPaymentIntentIdempotent(paymentIntentId) {
  if (!paymentIntentId) return { success: false, error: 'missing_payment_intent_id' };

  // Pré-check: si déjà canceled, c'est une libération déjà faite (idempotent)
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi?.status === 'canceled') {
      return { success: true, paymentIntent: pi, alreadyCanceled: true };
    }

    if (pi?.status && !CANCELABLE_PAYMENT_INTENT_STATUSES.has(pi.status)) {
      return {
        success: false,
        paymentIntent: pi,
        error: `payment_intent_not_cancelable_status:${pi.status}`
      };
    }
  } catch (e) {
    // Si retrieve échoue, on tente quand même le cancel (il donnera une erreur explicite)
    console.warn('⚠️ Stripe PI retrieve failed, fallback to cancel:', e?.message);
  }

  try {
    const canceled = await stripe.paymentIntents.cancel(paymentIntentId);
    return { success: true, paymentIntent: canceled, alreadyCanceled: false };
  } catch (e) {
    if (isStripeAlreadyCanceledPaymentIntentError(e)) {
      // Cas course: a été annulé entre retrieve et cancel
      try {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        return { success: true, paymentIntent: pi, alreadyCanceled: true };
      } catch {
        return { success: true, paymentIntent: null, alreadyCanceled: true };
      }
    }
    return { success: false, error: e?.message || 'stripe_cancel_failed' };
  }
}

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
        base_price,
        tax_price,
        total_price,
        transaction_id,
        caution_status,
        caution_intent_id,
        balances_allocated,
        status,
        payment_status,
        date_depart,
        host_validation_ok,
        litige,
        listings (
          id,
          title,
          owner_id,
          id_proprietaire
        )
      `)
      // Traiter comme paiement classique si la réservation est confirmée OU marquée "canceled/cancelled"
      // (cas: statut annulé mais validation hôte OK => on alloue/paye les parts normalement)
      .in('status', ['confirmed', 'canceled', 'cancelled'])
      .eq('payment_status', 'paid')
      .eq('host_validation_ok', true)
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

        // Pour les réservations confirmées, on ne payout qu'après la fin du séjour.
        // Pour les réservations annulées (canceled/cancelled) avec validation hôte OK, on traite immédiatement.
        const todayStr = new Date().toISOString().split('T')[0];
        const statusValueEarly = String(reservation.status || '').toLowerCase();
        if (statusValueEarly === 'confirmed' && reservation.date_depart && String(reservation.date_depart) >= todayStr) {
          console.log(`⏭️ Réservation #${reservation.id} ignorée - séjour pas terminé (date_depart=${reservation.date_depart})`);
          results.push({
            reservation_id: reservation.id,
            success: false,
            skipped: true,
            reason: 'Stay not ended'
          });
          continue;
        }

        // Vérification de sécurité : host_validation_ok doit être TRUE
        if (reservation.host_validation_ok !== true) {
          console.log(`⚠️ Réservation #${reservation.id} ignorée - validation hôte manquante`);
          results.push({
            reservation_id: reservation.id,
            success: false,
            error: 'Host validation required'
          });
          continue;
        }

        // NOTE: La caution (SetupIntent) reste en standby et ne sera activée (capturée)
        // manuellement que s'il y a un litige. Plus de gestion automatique de la caution.

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

        // 4b. Si la réservation est annulée, s'assurer que le voyageur est remboursé (total ou partiel)
        // Règle: le remboursement correspond à la partie NON conservée. On l'infère via les parts réduites.
        const statusValue = String(reservation.status || '').toLowerCase();
        const isCanceled = statusValue === 'canceled' || statusValue === 'cancelled';
        if (isCanceled) {
          const transactionId = reservation.transaction_id;
          const totalPrice = Number(reservation.total_price || 0);
          const basePrice = Number(reservation.base_price || 0);
          const keptBaseAmount = proprietorAmount + mainTenantAmount + platformAmount;

          // Calculer le taux de remboursement en fonction des parts conservées
          // Si toutes les parts sont à 0 (annulation hôte ou voyageur avec remboursement intégral) => refundRate = 1
          let refundRate = 0;
          if (basePrice > 0) {
            const keptRate = Math.max(0, Math.min(1, keptBaseAmount / basePrice));
            refundRate = Math.max(0, Math.min(1, 1 - keptRate));
          } else {
            // Fallback: si aucune part n'est conservée, on considère un remboursement total
            refundRate = keptBaseAmount <= 0 ? 1 : 0;
          }

          // Si on doit rembourser quelque chose, on vérifie/émet le remboursement Stripe avant les payouts.
          if (refundRate > 0 && totalPrice > 0 && transactionId && String(transactionId).startsWith('pi_')) {
            console.log(`↩️ Réservation annulée #${reservation.id}: remboursement requis (taux ${(refundRate * 100).toFixed(0)}%)`);

            // Idempotence: ne pas rembourser si un remboursement existe déjà
            const existingRefunds = await stripe.refunds.list({ payment_intent: transactionId, limit: 10 });
            const alreadyRefunded = existingRefunds?.data?.some((r) => r.status !== 'failed' && r.status !== 'canceled');

            if (alreadyRefunded) {
              console.log(`ℹ️ Remboursement déjà existant pour ${transactionId}, on continue.`);
            } else {
              const refundAmountCents = Math.round(totalPrice * 100 * refundRate);
              if (refundAmountCents > 0) {
                try {
                  const refund = await stripe.refunds.create({
                    payment_intent: transactionId,
                    amount: refundAmountCents,
                    reason: 'requested_by_customer',
                    metadata: {
                      reservation_id: reservation.id,
                      cron: 'process-payments',
                      refund_rate: String(refundRate),
                    }
                  });
                  console.log(`✅ Remboursement Stripe créé: ${refund.id} (${refund.amount / 100}€)`);

                  // Log refund dans la réservation
                  await supabaseAdmin
                    .from('reservations')
                    .update({
                      refund_amount: (refund.amount || 0) / 100,
                      refunded_at: new Date().toISOString(),
                    })
                    .eq('id', reservation.id);
                } catch (refundErr) {
                  console.error(`❌ Échec remboursement Stripe pour réservation #${reservation.id}:`, refundErr?.message || refundErr);
                  // Sécurité: ne pas payer les parties si le remboursement attendu n'a pas pu être effectué.
                  // On laisse balances_allocated à false pour réessayer au prochain cron.
                  throw refundErr;
                }
              }
            }
          }
        }

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

        // Exécuter toutes les mises à jour des soldes
        const updateResults = await Promise.all(updates);
        for (const r of updateResults) {
          if (r.error) {
            console.error(`❌ Erreur mise à jour profil:`, r.error);
            throw new Error(r.error.message);
          }
        }

        // 6. Effectuer les virements Stripe automatiques si les comptes sont configurés
        const transferResults = [];

        if (proprietorUserId && proprietorAmount > 0) {
          const { data: propProfile } = await supabaseAdmin
            .from('profiles')
            .select('stripe_account_id')
            .eq('id', proprietorUserId)
            .single();

          if (propProfile?.stripe_account_id) {
            try {
              console.log(`💸 Virement Stripe vers propriétaire: ${proprietorAmount}€`);
              
              // Vérifier que le compte peut recevoir des paiements
              const account = await stripe.accounts.retrieve(propProfile.stripe_account_id);
              
              if (account.payouts_enabled) {
                const transfer = await stripe.transfers.create({
                  amount: Math.round(proprietorAmount * 100),
                  currency: 'eur',
                  destination: propProfile.stripe_account_id,
                  description: `Revenus réservation #${reservation.id}`,
                  metadata: {
                    reservation_id: reservation.id,
                    user_id: proprietorUserId,
                    type: 'proprietor_share',
                    auto_payout: 'true'
                  }
                });

                console.log(`✅ Transfert propriétaire créé: ${transfer.id}`);
                transferResults.push({ user_id: proprietorUserId, transfer_id: transfer.id, amount: proprietorAmount });

                // Déduire du solde puisque déjà payé
                await supabaseAdmin
                  .from('profiles')
                  .update({
                    to_be_paid_to_user: 0
                  })
                  .eq('id', proprietorUserId);
              } else {
                console.warn(`⚠️ Compte Stripe propriétaire ${proprietorUserId} non actif, montant ajouté au solde`);
              }
            } catch (transferErr) {
              console.error(`❌ Erreur transfert propriétaire:`, transferErr.message);
              // Montant reste dans to_be_paid_to_user pour virement manuel
            }
          } else {
            console.log(`ℹ️ Propriétaire ${proprietorUserId} sans compte Stripe, montant ajouté au solde`);
          }
        }

        if (mainTenantUserId && mainTenantAmount > 0) {
          const { data: tenantProfile } = await supabaseAdmin
            .from('profiles')
            .select('stripe_account_id')
            .eq('id', mainTenantUserId)
            .single();

          if (tenantProfile?.stripe_account_id) {
            try {
              console.log(`💸 Virement Stripe vers locataire principal: ${mainTenantAmount}€`);
              
              const account = await stripe.accounts.retrieve(tenantProfile.stripe_account_id);
              
              if (account.payouts_enabled) {
                const transfer = await stripe.transfers.create({
                  amount: Math.round(mainTenantAmount * 100),
                  currency: 'eur',
                  destination: tenantProfile.stripe_account_id,
                  description: `Revenus réservation #${reservation.id}`,
                  metadata: {
                    reservation_id: reservation.id,
                    user_id: mainTenantUserId,
                    type: 'main_tenant_share',
                    auto_payout: 'true'
                  }
                });

                console.log(`✅ Transfert locataire créé: ${transfer.id}`);
                transferResults.push({ user_id: mainTenantUserId, transfer_id: transfer.id, amount: mainTenantAmount });

                // Déduire du solde puisque déjà payé
                await supabaseAdmin
                  .from('profiles')
                  .update({
                    to_be_paid_to_user: 0
                  })
                  .eq('id', mainTenantUserId);
              } else {
                console.warn(`⚠️ Compte Stripe locataire ${mainTenantUserId} non actif, montant ajouté au solde`);
              }
            } catch (transferErr) {
              console.error(`❌ Erreur transfert locataire:`, transferErr.message);
              // Montant reste dans to_be_paid_to_user pour virement manuel
            }
          } else {
            console.log(`ℹ️ Locataire ${mainTenantUserId} sans compte Stripe, montant ajouté au solde`);
          }
        }

        // 7. Transférer la commission plateforme vers le compte Connect Kokyage
        if (platformAmount > 0 && process.env.PLATFORM_USER_ID) {
          try {
            console.log(`💰 Récupération du compte Stripe Connect Kokyage...`);
            
            // Récupérer le stripe_account_id du profil plateforme
            const { data: platformProfile } = await supabaseAdmin
              .from('profiles')
              .select('stripe_account_id')
              .eq('id', process.env.PLATFORM_USER_ID)
              .single();

            if (platformProfile?.stripe_account_id) {
              console.log(`💸 Virement commission plateforme: ${platformAmount}€ vers compte Kokyage`);
              
              // Vérifier que le compte peut recevoir des paiements
              const account = await stripe.accounts.retrieve(platformProfile.stripe_account_id);
              
              if (account.payouts_enabled) {
                const transfer = await stripe.transfers.create({
                  amount: Math.round(platformAmount * 100),
                  currency: 'eur',
                  destination: platformProfile.stripe_account_id,
                  description: `Commission Kokyage réservation #${reservation.id}`,
                  metadata: {
                    reservation_id: reservation.id,
                    type: 'platform_commission',
                    auto_payout: 'true'
                  }
                });

                console.log(`✅ Transfert plateforme créé: ${transfer.id}`);
                transferResults.push({ type: 'platform', transfer_id: transfer.id, amount: platformAmount });

                // Ajouter au solde du profil plateforme (pour suivi comptable)
                await supabaseAdmin
                  .from('profiles')
                  .update({
                    total_earnings: Number(platformProfile.total_earnings || 0) + platformAmount,
                  })
                  .eq('id', process.env.PLATFORM_USER_ID);
              } else {
                console.warn(`⚠️ Compte Stripe plateforme non actif, commission reste sur compte principal`);
              }
            } else {
              console.warn(`⚠️ Compte utilisateur plateforme sans Stripe Connect configuré`);
            }
          } catch (transferErr) {
            console.error(`❌ Erreur transfert plateforme:`, transferErr.message);
            // La commission reste sur le compte principal si erreur
          }
        } else if (platformAmount > 0) {
          console.log(`ℹ️ Commission plateforme ${platformAmount}€ reste sur compte principal (NEXT_PUBLIC_PLATFORM_USER_ID non configuré)`);
        }

        // 8. Marquer la réservation comme allouée
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
          platform_amount: platformAmount,
          transfers: transferResults
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

    // Vérifier et payer les soldes en attente pour les comptes Stripe désormais actifs
    console.log('\n🔍 Vérification des soldes en attente...');
    const pendingResults = await processPendingBalances();
    
    return Response.json({
      success: true,
      processed: results.length,
      results,
      pending_balances_processed: pendingResults
    });

  } catch (error) {
    console.error('❌ Erreur globale:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Fonction pour traiter les soldes en attente des utilisateurs qui ont maintenant configuré Stripe
async function processPendingBalances() {
  try {
    // Récupérer tous les profils avec un solde positif à payer
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, to_be_paid_to_user, stripe_account_id')
      .gt('to_be_paid_to_user', 0);

    if (error) {
      console.error('❌ Erreur récupération profils avec solde:', error);
      return { success: false, error: error.message };
    }

    if (!profiles || profiles.length === 0) {
      console.log('ℹ️ Aucun solde en attente');
      return { success: true, processed: 0, results: [] };
    }

    console.log(`📊 ${profiles.length} utilisateur(s) avec solde en attente`);

    const results = [];

    for (const profile of profiles) {
      try {
        const amount = Number(profile.to_be_paid_to_user);
        
        // Si pas de compte Stripe, on passe au suivant
        if (!profile.stripe_account_id) {
          console.log(`⏭️ ${profile.email}: ${amount}€ en attente - Pas de compte Stripe`);
          results.push({
            user_id: profile.id,
            email: profile.email,
            amount,
            status: 'waiting_stripe_setup',
            message: 'Compte Stripe non configuré'
          });
          continue;
        }

        // Vérifier si le compte Stripe peut maintenant recevoir des paiements
        const account = await stripe.accounts.retrieve(profile.stripe_account_id);
        
        if (!account.payouts_enabled) {
          console.log(`⏭️ ${profile.email}: ${amount}€ en attente - Compte Stripe non actif`);
          results.push({
            user_id: profile.id,
            email: profile.email,
            amount,
            status: 'stripe_not_ready',
            message: 'Compte Stripe pas encore activé pour recevoir des paiements'
          });
          continue;
        }

        // Le compte est maintenant actif, effectuer le virement
        console.log(`💸 Virement automatique vers ${profile.email}: ${amount}€`);
        
        const transfer = await stripe.transfers.create({
          amount: Math.round(amount * 100),
          currency: 'eur',
          destination: profile.stripe_account_id,
          description: `Paiement solde en attente`,
          metadata: {
            user_id: profile.id,
            type: 'pending_balance_payout',
            auto_payout: 'true'
          }
        });

        console.log(`✅ Transfert créé: ${transfer.id} pour ${profile.email}`);

        // Mettre à jour le profil: remettre le solde à 0
        await supabaseAdmin
          .from('profiles')
          .update({
            to_be_paid_to_user: 0
          })
          .eq('id', profile.id);

        results.push({
          user_id: profile.id,
          email: profile.email,
          amount,
          status: 'paid',
          transfer_id: transfer.id,
          message: 'Virement effectué avec succès'
        });

      } catch (err) {
        console.error(`❌ Erreur traitement solde ${profile.email}:`, err.message);
        results.push({
          user_id: profile.id,
          email: profile.email,
          amount: Number(profile.to_be_paid_to_user),
          status: 'error',
          message: err.message
        });
      }
    }

    console.log(`✅ ${results.filter(r => r.status === 'paid').length} virement(s) effectué(s)`);

    return {
      success: true,
      processed: profiles.length,
      results
    };

  } catch (error) {
    console.error('❌ Erreur traitement soldes en attente:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
