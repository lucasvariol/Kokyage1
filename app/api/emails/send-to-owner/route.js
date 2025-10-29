import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { ownerEmail, ownerName, tenantName } = await request.json();

    if (!ownerEmail || !ownerName || !tenantName) {
      return NextResponse.json(
        { error: 'Email et noms requis' },
        { status: 400 }
      );
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Template d'email
    const emailContent = `
Bonjour ${ownerName},

Votre locataire, ${tenantName}, souhaiterait vous proposer d'utiliser ensemble Kokyage.com, une plateforme française qui permet de sous-louer un logement en toute légalité en partageant les revenus avec le propriétaire !

L'objectif est simple : transformer les périodes où le logement reste vide en revenus partagés et sécurisés, sans aucun risque pour vous.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 VOICI COMMENT CELA FONCTIONNE :

💶 DES REVENUS SUPPLÉMENTAIRES SANS EFFORT
   → À chaque sous-location, vous percevez 40% des revenus générés
   → Automatiquement et sans gestion de votre part
   → Paiements sécurisés et traçables

🔒 UNE SÉCURITÉ JURIDIQUE TOTALE
   → Tout est encadré par un accord électronique officiel
   → Rédigé par nos juristes conformément à la loi française
   → Signature électronique juridiquement valable

🔄 UN CONTRÔLE TOTAL
   → Vous pouvez mettre fin à votre autorisation à tout moment
   → Sans contrainte ni pénalité
   → Préavis de 14 jours pour l'annulation des réservations en cours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛡️ UNE PROTECTION COMPLÈTE DE VOTRE BIEN

TRIPLE SÉCURITÉ pour vous protéger :

1. 💳 EMPREINTE BANCAIRE (CAUTION)
   → Empreinte bancaire de 300€ enregistrée pour chaque réservation
   → Prélèvement automatique en cas de dégradation validée
   → Couvre les petites réparations immédiatement

2. 🏠 ASSURANCE DU VOYAGEUR
   → L'assurance responsabilité civile du voyageur est sollicitée pour les dommages importants
   → Recommandé de demander une attestation de villégiature
   → Généralement incluse dans l'assurance habitation du voyageur

3. 👤 RESPONSABILITÉ DU LOCATAIRE
   → Votre locataire reste juridiquement garant vis-à-vis de vous
   → Conformément à la loi et à l'accord signé
   → Il demeure votre interlocuteur unique

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌍 UN MODÈLE PLUS JUSTE ET RESPONSABLE

Kokyage réinvente la location pour qu'elle soit équitable, légale et bénéfique à tous :

✅ Le propriétaire garde le contrôle total
✅ Le locataire gagne en flexibilité et revenus
✅ Le logement reste valorisé au lieu de rester vide
✅ Pas de spéculation immobilière
✅ Une solution gagnant-gagnant transparente

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 EXEMPLE CONCRET :

Votre locataire part 2 semaines en vacances. Le logement est sous-loué 80€/nuit :

   Revenus totaux : 1 120€ (14 nuits × 80€)
   → Vous recevez : 425,60€ (net après commission 3%)
   → Votre locataire : 638,40€ (net après commission 3%)

Au lieu d'un logement vide, vous générez 425,60€ de revenus passifs, sans aucun effort de votre part !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔒 GARANTIES SUPPLÉMENTAIRES :

• Vérification d'identité obligatoire (KYC) pour tous les voyageurs
• Modération professionnelle de chaque annonce avant publication
• Respect automatique de la limite légale (120 jours/an maximum en résidence principale)
• Service client disponible 7j/7
• Système de notation et d'avis pour les voyageurs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👉 POUR DÉCOUVRIR LA PLATEFORME :

Rendez-vous sur https://kokyage.com

Vous pourrez :
• Explorer la plateforme en détail
• Consulter notre FAQ complète
• Poser vos questions à notre chatbot intelligent
• Voir les témoignages d'autres propriétaires
• Comprendre le processus étape par étape

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nous sommes convaincus que Kokyage représente une opportunité intéressante pour vous, tout en permettant à ${tenantName} de mieux vivre dans votre logement.

Si vous avez la moindre question, n'hésitez pas à nous contacter ou à consulter notre FAQ.

Bien cordialement,
L'équipe Kokyage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Découvrir Kokyage : https://kokyage.com
🔒 100% légal • 100% sécurisé • 100% transparent
    `.trim();

    // Envoi avec Resend
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // En mode dev, rediriger vers l'email de test
    const emailDevMode = process.env.EMAIL_DEV_MODE === 'true';
    const finalRecipient = emailDevMode ? process.env.EMAIL_TEST_ADDRESS : ownerEmail;
    
    const result = await resend.emails.send({
      from: process.env.MAIL_FROM || 'Kokyage <contact@kokyage.com>',
      to: finalRecipient,
      subject: `${tenantName} souhaite utiliser Kokyage pour votre logement`,
      text: emailContent,
    });

    console.log('✅ Email envoyé au propriétaire:', finalRecipient);
    console.log('📧 Resend response:', result);
    if (emailDevMode) {
      console.log('⚠️ MODE DEV : Email redirigé vers', finalRecipient, 'au lieu de', ownerEmail);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Email envoyé avec succès',
      devMode: emailDevMode,
      emailId: result.data?.id
    });

  } catch (error) {
    console.error('Erreur envoi email:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
