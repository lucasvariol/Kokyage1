import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // 1. Récupérer la balance Stripe
    const balance = await stripe.balance.retrieve();
    
    const availableAmount = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
    const pendingAmount = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;

    // 2. Récupérer le total dû aux hôtes (somme de tous les to_be_paid_to_user)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('to_be_paid_to_user')
      .gt('to_be_paid_to_user', 0);

    if (profilesError) {
      throw new Error('Erreur lors de la récupération des profils: ' + profilesError.message);
    }

    const totalOwedToHosts = profiles.reduce((sum, p) => sum + Number(p.to_be_paid_to_user || 0), 0);
    const hostsWithPendingBalance = profiles.length;

    // 3. Calculer les revenus disponibles pour la plateforme
    const availableForPlatform = availableAmount - totalOwedToHosts;

    // 4. Récupérer les statistiques de commissions
    const { data: reservations, error: reservationsError } = await supabaseAdmin
      .from('reservations')
      .select('kokyage_commission, balances_allocated')
      .eq('balances_allocated', true);

    if (reservationsError) {
      throw new Error('Erreur lors de la récupération des réservations: ' + reservationsError.message);
    }

    const totalPlatformCommissions = reservations.reduce((sum, r) => sum + Number(r.kokyage_commission || 0), 0);
    const processedReservations = reservations.length;

    return Response.json({
      stripeBalance: {
        available: availableAmount,
        pending: pendingAmount,
        total: availableAmount + pendingAmount
      },
      totalOwedToHosts,
      hostsWithPendingBalance,
      availableForPlatform: Math.max(0, availableForPlatform),
      totalPlatformCommissions,
      processedReservations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur API finances:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
