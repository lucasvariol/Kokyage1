import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req) {
  try {
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json({ error: 'userId et code requis' }, { status: 400 });
    }

    // Normaliser le code (enlever les espaces, forcer string)
    const normalizedCode = String(code).trim();

    // Chercher une ligne avec ce userId, ce code, non encore vérifiée et non expirée
    const { data: verificationRow, error: fetchError } = await supabaseAdmin
      .from('email_verifications')
      .select('id, expires_at, verified_at')
      .eq('user_id', userId)
      .eq('token', normalizedCode)
      .is('verified_at', null)
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('[verify-email-code] Erreur fetch:', fetchError);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    if (!verificationRow) {
      console.warn('[verify-email-code] Code invalide ou déjà utilisé pour userId:', userId);
      return NextResponse.json({ error: 'Code invalide ou déjà utilisé' }, { status: 400 });
    }

    // Vérifier si le code n'est pas expiré
    const now = new Date();
    const expiresAt = new Date(verificationRow.expires_at);
    if (now > expiresAt) {
      console.warn('[verify-email-code] Code expiré pour userId:', userId);
      return NextResponse.json({ error: 'Code expiré. Demandez un nouveau code.' }, { status: 400 });
    }

    // Marquer comme vérifié
    const { error: updateError } = await supabaseAdmin
      .from('email_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verificationRow.id);

    if (updateError) {
      console.error('[verify-email-code] Erreur update verified_at:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la validation' }, { status: 500 });
    }

    console.log(`[verify-email-code] Email vérifié avec succès pour userId: ${userId}`);
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[verify-email-code] Erreur inattendue:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
