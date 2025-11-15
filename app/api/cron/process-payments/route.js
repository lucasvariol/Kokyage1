import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });
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
        total_price,
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
      .eq('status', 'confirmed')
      .eq('payment_status', 'paid')
      .eq('host_validation_ok', true)
      .lt('date_depart', new Date().toISOString().split('T')[0])
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

        // 2. Gérer la caution : libérer après 14 jours si pas de litige
        if (reservation.caution_status === 'authorized' && reservation.caution_intent_id) {
          const endDate = new Date(reservation.date_depart);
          const now = new Date();
          const daysSinceEnd = Math.floor((now - endDate) / (1000 * 60 * 60 * 24));

          // Vérifier s'il y a un litige
          const hasDispute = reservation.litige === true || reservation.litige === 'pending';

          if (daysSinceEnd >= 14 && !hasDispute) {
            console.log(`🔓 Libération caution pour #${reservation.id} (${daysSinceEnd} jours écoulés, pas de litige)`);
            
            try {
              // Annuler (libérer) la caution au lieu de la capturer
              const paymentIntent = await stripe.paymentIntents.cancel(
                reservation.caution_intent_id
              );

              await supabaseAdmin
                .from('reservations')
                .update({
                  caution_status: 'released',
                  caution_released_at: new Date().toISOString()
                })
                .eq('id', reservation.id);

              console.log(`✅ Caution libérée: ${paymentIntent.amount / 100}€ rendus au voyageur`);
            } catch (err) {
              console.error(`❌ Erreur libération caution #${reservation.id}:`, err.message);
            }
          } else if (hasDispute) {
            console.log(`⚠️ Caution maintenue pour #${reservation.id} - Litige en cours`);
          } else {
            console.log(`⏳ Caution #${reservation.id} - Attente ${14 - daysSinceEnd} jours restants`);
          }
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
          console.log(`ℹ️ Commission plateforme ${platformAmount}€ reste sur compte principal (PLATFORM_USER_ID non configuré)`);
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

    // 8. NOUVEAU: Vérifier et payer les soldes en attente pour les comptes Stripe désormais actifs
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
