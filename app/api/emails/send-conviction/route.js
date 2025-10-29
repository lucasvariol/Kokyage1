import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { tenantEmail, tenantName, ownerName } = await request.json();

    if (!tenantEmail || !ownerName || !tenantName) {
      return NextResponse.json(
        { error: 'Email et noms requis' },
        { status: 400 }
      );
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(tenantEmail)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Template d'email
    const emailContent = `
Bonjour ${tenantName},

Bonne nouvelle 🎉
Votre propriétaire, ${ownerName}, a choisi d’utiliser Kokyage.com pour vous autoriser à sous-louer votre logement en toute légalité.

Kokyage est une plateforme française qui permet aux locataires et aux propriétaires de partager les revenus de sous-location dans un cadre sécurisé, transparent et assuré.

Concrètement :

💰   → Vous pouvez louer votre logement pendant vos absences

✨  → Les revenus sont partagés équitablement : 60% pour vous, 40% pour votre propriétaire
   
🛡️   → Chaque séjour est protégé par une empreinte bancaire (caution de 300€) et l'assurance responsabilité civile du voyageur

Vous gardez le contrôle total et pouvez arrêter à tout moment.

Kokyage s'occupe de tout : gestion des paiements, vérifications et support client.
Vous n’avez qu’à activer votre compte pour commencer à louer en toute légalité et en toute confiance.

💬 ET MAINTENANT ?

Si cette proposition vous intéresse, je vous invite à découvrir Kokyage : https://kokyage.com
Vous y trouverez toutes les informations nécessaires pour bien comprendre le fonctionnement et les avantages de la sous-location avec Kokyage.
À très bientôt,

L’équipe Kokyage.com

Ne répondez pas à cet email, il a été envoyé automatiquement. Contactez directement votre propriétaire pour toute question ou discutez avec nous via le chat sur https://kokyage.com.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 EXEMPLE CONCRET :

Imaginons que vous partiez une semaine en vacances. Votre logement pourrait être loué 100€/nuit :

   Revenus totaux : 700€
   → Vous recevez : 407,40€ (net après commission 3%)
   → Votre propriétaire reçoit : 271,60€ (net après commission 3%)
    `.trim();

    // Envoi avec Resend
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // En mode dev, rediriger vers l'email de test
    const emailDevMode = process.env.EMAIL_DEV_MODE === 'true';
    const finalRecipient = emailDevMode ? process.env.EMAIL_TEST_ADDRESS : tenantEmail;
    
    await resend.emails.send({
      from: process.env.MAIL_FROM || 'Kokyage <contact@kokyage.com>',
      to: finalRecipient,
      subject: `${ownerName} vous invite à découvrir Kokyage !`,
      text: emailContent,
    });

    console.log('✅ Email envoyé avec succès à:', finalRecipient);
    if (emailDevMode) {
      console.log('⚠️ MODE DEV : Email redirigé vers', finalRecipient, 'au lieu de', tenantEmail);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Email envoyé avec succès',
      devMode: emailDevMode
    });

  } catch (error) {
    console.error('Erreur envoi email:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
