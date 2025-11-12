import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    // Récupérer la vérification depuis la base de données
    const { data: verification, error: fetchError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('token', token)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json({ 
        error: 'Token invalide',
        expired: false 
      }, { status: 404 });
    }

    // Vérifier si le token a expiré
    const now = new Date();
    const expiresAt = new Date(verification.expires_at);
    
    if (now > expiresAt) {
      // Supprimer le token expiré
      await supabaseAdmin
        .from('email_verifications')
        .delete()
        .eq('token', token);

      return NextResponse.json({ 
        error: 'Le lien de vérification a expiré',
        expired: true 
      }, { status: 400 });
    }

    // Vérifier si déjà utilisé
    if (verification.verified_at) {
      return NextResponse.json({ 
        error: 'Ce lien a déjà été utilisé',
        expired: false 
      }, { status: 400 });
    }

    // Marquer l'email comme vérifié dans Supabase Auth
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      verification.user_id,
      { email_confirm: true }
    );

    if (updateAuthError) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', updateAuthError);
      return NextResponse.json({ 
        error: 'Erreur lors de la vérification',
        details: updateAuthError.message 
      }, { status: 500 });
    }

    // Marquer le token comme utilisé
    await supabaseAdmin
      .from('email_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('token', token);

    return NextResponse.json({ 
      success: true,
      message: 'Email vérifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error.message 
    }, { status: 500 });
  }
}
