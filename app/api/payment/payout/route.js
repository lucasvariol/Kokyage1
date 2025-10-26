import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

// POST /api/payment/payout { userId }
// Effectue un transfert du montant to_be_paid_to_user vers le compte Stripe Connect de l'utilisateur
export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    console.log('[Payout] Processing payout for user:', userId);

    // 1. Récupérer le profil avec stripe_account_id et montants
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id, total_earnings, to_be_paid_to_user')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('[Payout] Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
    }

    if (!profile.stripe_account_id) {
      return NextResponse.json({ 
        error: 'Compte Stripe Connect non configuré. Veuillez d\'abord connecter votre compte bancaire.' 
      }, { status: 400 });
    }

    const amountToPay = Number(profile.to_be_paid_to_user || 0);
    
    if (amountToPay <= 0) {
      return NextResponse.json({ 
        error: 'Aucun montant à payer. Le solde est de 0 €.' 
      }, { status: 400 });
    }

    // Vérifier que le compte Connect est actif
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    if (!account.payouts_enabled) {
      return NextResponse.json({ 
        error: 'Votre compte Stripe Connect n\'est pas encore prêt à recevoir des paiements. Veuillez compléter la configuration.' 
      }, { status: 400 });
    }

    // 2. Créer le transfert vers le compte Connect
    const amountInCents = Math.round(amountToPay * 100);
    
    console.log('[Payout] Creating transfer:', {
      amount: amountInCents,
      destination: profile.stripe_account_id
    });

    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: 'eur',
      destination: profile.stripe_account_id,
      description: 'Virement de revenus Kokyage',
      metadata: {
        userId: userId,
        type: 'manual_payout',
        original_amount_eur: amountToPay.toFixed(2)
      }
    });

    console.log('[Payout] Transfer created:', transfer.id);

    // 3. Mettre à jour le profil
    const newTotalEarnings = Number(profile.total_earnings || 0) + amountToPay;
    
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        total_earnings: newTotalEarnings,
        to_be_paid_to_user: 0.00
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[Payout] Profile update error:', updateError);
      // Le transfert a été effectué mais la mise à jour a échoué
      return NextResponse.json({ 
        warning: 'Transfert effectué mais erreur lors de la mise à jour du profil',
        transfer: {
          id: transfer.id,
          amount: amountToPay,
          status: 'completed'
        }
      }, { status: 200 });
    }

    console.log('[Payout] Payout completed successfully');

    return NextResponse.json({
      success: true,
      transfer: {
        id: transfer.id,
        amount: amountToPay,
        currency: 'EUR',
        destination: profile.stripe_account_id,
        status: 'completed'
      },
      updated_profile: {
        total_earnings: newTotalEarnings,
        to_be_paid_to_user: 0.00
      }
    });

  } catch (error) {
    console.error('[Payout] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Erreur lors du virement'
    }, { status: 500 });
  }
}
