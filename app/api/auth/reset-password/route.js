import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import { passwordResetTemplate } from '@/email-templates/password-reset';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.find(u => u.email === email);

    if (!user) {
      // Pour des raisons de sécurité, on renvoie un message de succès même si l'email n'existe pas
      return NextResponse.json({ 
        success: true, 
        message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
      });
    }

    // Forcer l'URL de production
    const redirectUrl = 'https://kokyage.com/nouveau-mot-de-passe';

    console.log('redirectTo configuré:', redirectUrl);

    // Générer un lien de réinitialisation via Supabase
    const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (resetError) {
      console.error('Erreur génération lien:', resetError);
      return NextResponse.json({ 
        error: 'Erreur lors de la génération du lien' 
      }, { status: 500 });
    }

    const resetUrl = data.properties.action_link;
    const prenom = user.user_metadata?.prenom || '';

    console.log('Lien de réinitialisation généré:', resetUrl);

    // Envoyer l'email via Resend
    const emailData = await resend.emails.send({
      from: 'Kokyage <noreply@kokyage.com>',
      to: email,
      subject: passwordResetTemplate.subject,
      html: passwordResetTemplate.getHtml({
        prenom: prenom,
        resetUrl: resetUrl
      })
    });

    console.log('Email de réinitialisation envoyé:', emailData);

    return NextResponse.json({ 
      success: true,
      message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'envoi de l\'email',
      details: error.message 
    }, { status: 500 });
  }
}
