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

    // Stocker le token dans une table personnalisée
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

    // URL de vérification
    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verification-email/${verificationToken}`;

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
