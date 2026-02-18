import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import { emailVerificationTemplate } from '@/email-templates/email-verification';

const resend = new Resend(process.env.RESEND_API_KEY);

// Génère un code OTP numérique à 6 chiffres
function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req) {
  try {
    const { email, userId, nom, prenom } = await req.json();

    if (!email || !userId) {
      return NextResponse.json({ error: 'Email et userId requis' }, { status: 400 });
    }

    // Générer un code OTP à 6 chiffres
    const otpCode = generateOtpCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Expire dans 15 minutes

    // Vérifier si une ligne existe déjà pour cet utilisateur (non vérifiée)
    const { data: existingRow } = await supabaseAdmin
      .from('email_verifications')
      .select('id')
      .eq('user_id', userId)
      .is('verified_at', null)
      .limit(1)
      .maybeSingle();

    if (existingRow) {
      // Mettre à jour la ligne existante avec le nouveau code
      const { error: updateError } = await supabaseAdmin
        .from('email_verifications')
        .update({
          token: otpCode,
          expires_at: expiresAt.toISOString()
        })
        .eq('id', existingRow.id);

      if (updateError) {
        console.error('Erreur lors de la mise à jour du code OTP:', updateError);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour du code' }, { status: 500 });
      }
    } else {
      // Insérer une nouvelle ligne
      const { error: insertError } = await supabaseAdmin
        .from('email_verifications')
        .insert({
          user_id: userId,
          email: email,
          token: otpCode,
          expires_at: expiresAt.toISOString()
        });

      if (insertError) {
        console.error('Erreur lors de la création du code OTP:', insertError);
        return NextResponse.json({ error: 'Erreur lors de la création du code' }, { status: 500 });
      }
    }

    console.log(`Code OTP généré pour ${email}: ${otpCode}`);

    // Envoyer l'email via Resend avec le code OTP
    const emailData = await resend.emails.send({
      from: 'Kokyage <noreply@kokyage.com>',
      to: email,
      subject: emailVerificationTemplate.subject,
      html: emailVerificationTemplate.getHtml({
        prenom: prenom || '',
        otpCode: otpCode
      })
    });

    console.log('Email OTP envoyé:', emailData);

    return NextResponse.json({ 
      success: true, 
      message: 'Code de vérification envoyé'
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi du code OTP:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'envoi du code',
      details: error.message 
    }, { status: 500 });
  }
}
