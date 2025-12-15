import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

// POST /api/connect/status { userId }
export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });

    console.log('[Connect Status API] Checking status for user:', userId);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[Connect Status API] Profile fetch error:', profileError);
      return NextResponse.json({ connected: false, error: `Profil introuvable: ${profileError.message}` });
    }

    if (!profile?.stripe_account_id) {
      console.log('[Connect Status API] No stripe_account_id found for user');
      return NextResponse.json({ connected: false });
    }

    console.log('[Connect Status API] Found stripe_account_id:', profile.stripe_account_id);

    // Essayer de récupérer le statut Stripe, mais ne pas crasher si ça échoue
    try {
      const account = await stripe.accounts.retrieve(profile.stripe_account_id);
      const enabled = account.charges_enabled && account.payouts_enabled;

      console.log('[Connect Status API] Stripe account status:', {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted
      });

      return NextResponse.json({ 
        connected: true, 
        accountId: account.id, 
        charges_enabled: account.charges_enabled, 
        payouts_enabled: account.payouts_enabled, 
        details_submitted: account.details_submitted, 
        requirements: account.requirements 
      });
    } catch (stripeError) {
      console.warn('[Connect Status API] Stripe retrieve error (returning basic status):', stripeError.message);
      // Retourner un statut basique sans interroger Stripe
      return NextResponse.json({ 
        connected: true,
        accountId: profile.stripe_account_id,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        warning: 'Impossible de vérifier le statut Stripe (clés de test vs compte prod?)'
      });
    }
  } catch (e) {
    console.error('[Connect Status API] Error:', e);
    return NextResponse.json({ error: e.message, connected: false }, { status: 500 });
  }
}
