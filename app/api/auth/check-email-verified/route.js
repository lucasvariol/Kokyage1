import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Utiliser supabaseAdmin pour bypasser le RLS
    const { data: verificationData, error: verifyError } = await supabaseAdmin
      .from('email_verifications')
      .select('verified_at, created_at')
      .eq('user_id', userId)
      .not('verified_at', 'is', null)
      .order('verified_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verifyError) {
      console.error('Erreur vérification email:', verifyError);
      return NextResponse.json({ verified: false, error: verifyError.message });
    }

    const isVerified = !!(verificationData && verificationData.verified_at);

    console.log(`[check-email-verified] userId=${userId} verified=${isVerified}`, verificationData);

    return NextResponse.json({ verified: isVerified });

  } catch (err) {
    console.error('[check-email-verified] Erreur:', err);
    return NextResponse.json({ verified: false, error: err.message }, { status: 500 });
  }
}
