import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

// POST /api/connect/update { userId }
export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com';

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_account_id) {
      return NextResponse.json({ error: 'Compte Stripe Connect non trouvé' }, { status: 404 });
    }

    // Vérifier l'état du compte pour savoir quel type de lien créer
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    const currentlyDue = account?.requirements?.currently_due || [];

    // Choix du type:
    // - S'il reste des éléments à fournir (currently_due non vide) OU si details_submitted est faux => onboarding
    // - Sinon => update
    let linkType = (!account.details_submitted || (Array.isArray(currentlyDue) && currentlyDue.length > 0))
      ? 'account_onboarding'
      : 'account_update';

    console.log(`[Connect Update] Creating ${linkType} link for account ${profile.stripe_account_id}`, {
      details_submitted: account.details_submitted,
      currently_due_count: currentlyDue.length,
    });

    let accLink;
    try {
      accLink = await stripe.accountLinks.create({
        account: profile.stripe_account_id,
        refresh_url: `${origin}/profil-hote?update=refresh`,
        return_url: `${origin}/profil-hote?update=return`,
        type: linkType
      });
    } catch (err) {
      // Fallback si Stripe refuse account_update: réessayer en onboarding
      console.warn('[Connect Update] accountLinks.create failed, retrying with account_onboarding:', err?.message);
      accLink = await stripe.accountLinks.create({
        account: profile.stripe_account_id,
        refresh_url: `${origin}/profil-hote?update=refresh`,
        return_url: `${origin}/profil-hote?update=return`,
        type: 'account_onboarding'
      });
      linkType = 'account_onboarding';
    }

    return NextResponse.json({ success: true, url: accLink.url, linkType });
  } catch (e) {
    console.error('[Connect Update] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
