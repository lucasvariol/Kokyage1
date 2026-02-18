import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import crypto from 'crypto';
import { emailVerificationTemplate } from '@/email-templates/email-verification';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, userId, nom, prenom } = await req.json();

    if (!email || !userId) {
      return NextResponse.json({ error: 'Email et userId requis' }, { status: 400 });
    }

    // Générer un token de vérification unique
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expire dans 24h

    // Vérifier si une ligne existe déjà pour cet utilisateur (non vérifiée)
    const { data: existingRow } = await supabaseAdmin
      .from('email_verifications')
      .select('id')
      .eq('user_id', userId)
      .is('verified_at', null)
      .limit(1)
      .maybeSingle();

    if (existingRow) {
      // Mettre à jour la ligne existante avec un nouveau token
      const { error: updateError } = await supabaseAdmin
        .from('email_verifications')
        .update({
          token: verificationToken,
          expires_at: expiresAt.toISOString()
        })
        .eq('id', existingRow.id);

      if (updateError) {
        console.error('Erreur lors de la mise à jour du token:', updateError);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour du token' }, { status: 500 });
      }
    } else {
      // Insérer une nouvelle ligne seulement si aucune n'existe
      const { error: insertError } = await supabaseAdmin
        .from('email_verifications')
        .insert({
          user_id: userId,
          email: email,
          token: verificationToken,
          expires_at: expiresAt.toISOString()
        });

      if (insertError) {
        console.error('Erreur lors de la création du token:', insertError);
        return NextResponse.json({ error: 'Erreur lors de la création du token' }, { status: 500 });
      }
    }

    // URL de vérification - utilise la variable d'environnement ou le domaine par défaut
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com';
    const verificationUrl = `${siteUrl}/verification-email/${verificationToken}`;

    console.log('URL de vérification générée:', verificationUrl);

    // Envoyer l'email via Resend avec le template
    const emailData = await resend.emails.send({
      from: 'Kokyage <noreply@kokyage.com>',
      to: email,
      subject: emailVerificationTemplate.subject,
      html: emailVerificationTemplate.getHtml({
        prenom: prenom,
        verificationUrl: verificationUrl
      })
    });

    console.log('Email de vérification envoyé:', emailData);

    return NextResponse.json({ 
      success: true, 
      message: 'Email de vérification envoyé'
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'envoi de l\'email',
      details: error.message 
    }, { status: 500 });
  }
}
