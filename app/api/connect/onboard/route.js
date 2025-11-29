import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

// POST /api/connect/onboard { userId, email, refresh_url?, return_url? }
export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY manquante côté serveur' }, { status: 500 });
    }
    const { userId, email, refresh_url, return_url } = await request.json();
    if (!userId || !email) {
      return NextResponse.json({ error: 'userId et email requis' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com';

    // 1) Récupérer ou créer un compte connect
    // On checke s'il existe déjà dans le profil
    const { data: profile, error: pfErr } = await supabaseAdmin
      .from('profiles')
      .select('id, stripe_account_id')
      .eq('id', userId)
      .single();

    let accountId = profile?.stripe_account_id;

    // Vérifier que le compte existe vraiment dans Stripe
    if (accountId) {
      try {
        await stripe.accounts.retrieve(accountId);
        console.log(`✅ Compte Stripe existant trouvé: ${accountId}`);
      } catch (err) {
        console.warn(`⚠️ Compte Stripe ${accountId} introuvable, création d'un nouveau compte`);
        accountId = null; // Forcer la création d'un nouveau compte
      }
    }

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        business_type: 'individual',
        country: 'FR',
        email,
        default_currency: 'eur',
        capabilities: {
          transfers: { requested: true }
        },
        business_profile: {
          product_description: 'Réception de revenus de sous-location via Kokyage',
          support_email: process.env.SUPPORT_EMAIL || undefined,
          support_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com'
        },
        metadata: { appUserId: userId }
      });
      accountId = account.id;
      // Persist (graceful if supabase service role not configured)
      try {
        const { error: upErr } = await supabaseAdmin
          .from('profiles')
          .upsert({ id: userId, stripe_account_id: accountId }, { onConflict: 'id' });
        if (upErr) {
          console.warn('Supabase upsert stripe_account_id failed:', upErr.message);
        }
      } catch (e) {
        console.warn('Supabase admin unavailable, skipping persist of stripe_account_id');
      }
    }

    // 2) Créer le lien d'onboarding
    const accLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refresh_url || `${origin}/profil-hote?onboarding=refresh`,
      return_url: return_url || `${origin}/profil-hote?onboarding=return`,
      type: 'account_onboarding'
    });

  return NextResponse.json({ success: true, accountId, url: accLink.url });
  } catch (e) {
    console.error('Erreur onboarding connect:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
