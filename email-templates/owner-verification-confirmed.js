/**
 * Template d'email envoyé au propriétaire du logement (owner_id)
 * quand le propriétaire réel confirme son accord
 */

export const ownerVerificationConfirmedTemplate = {
  subject: "✅ Votre logement a été vérifié avec succès",
  
  getHtml: ({ ownerName, listingTitle, listingCity, proprietaireName, verificationDate }) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Logement vérifié</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F5F1ED;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F1ED; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Container principal -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          
          <!-- Header avec gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #4ECDC4 0%, #44B5AC 100%); padding: 40px 30px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 15px; margin-bottom: 15px;">
                <span style="font-size: 48px;">✅</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                Logement vérifié !
              </h1>
            </td>
          </tr>

          <!-- Contenu -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #1F2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Bonjour <strong>${ownerName}</strong>,
              </p>

              <p style="color: #4B5563; font-size: 16px; line-height: 1.8; margin: 0 0 25px;">
                Excellente nouvelle ! Le propriétaire de votre logement a confirmé son accord pour la mise en location sur Kokyage.
              </p>

              <!-- Box logement -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(78,205,196,0.08), rgba(68,181,168,0.05)); border-left: 4px solid #4ECDC4; border-radius: 12px; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #6B7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      🏠 Logement vérifié
                    </p>
                    <p style="margin: 0 0 4px; font-size: 18px; color: #1F2937; font-weight: 700;">
                      ${listingTitle}
                    </p>
                    <p style="margin: 0; font-size: 15px; color: #6B7280;">
                      📍 ${listingCity}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Détails vérification -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #F9FAFB; border-radius: 12px; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #6B7280;">
                      <strong style="color: #374151;">Propriétaire :</strong> ${proprietaireName}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #6B7280;">
                      <strong style="color: #374151;">Date de vérification :</strong> ${verificationDate}
                    </p>
                  </td>
                </tr>
              </table>

              <div style="background: linear-gradient(135deg, rgba(139,92,246,0.08), rgba(99,102,241,0.05)); border-left: 4px solid #8B5CF6; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 12px; font-size: 15px; color: #1F2937; font-weight: 700;">
                  🎉 Prochaines étapes
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #4B5563; font-size: 15px; line-height: 1.8;">
                  <li>Votre logement peut maintenant recevoir des réservations</li>
                  <li>Vous pouvez gérer vos disponibilités depuis votre espace hôte</li>
                  <li>Les voyageurs peuvent désormais découvrir votre logement</li>
                </ul>
              </div>

              <p style="color: #4B5563; font-size: 15px; line-height: 1.8; margin: 25px 0 0;">
                Merci d'avoir complété la vérification de votre logement. Cette étape garantit la confiance et la sécurité pour tous les utilisateurs de Kokyage.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://kokyage.com'}/profil-hote" 
                       style="display: inline-block; background: linear-gradient(135deg, #4ECDC4 0%, #44B5AC 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(78,205,196,0.3);">
                      Voir mon espace hôte
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px; color: #6B7280; font-size: 14px;">
                Besoin d'aide ? Contactez-nous à <a href="mailto:contact@kokyage.com" style="color: #4ECDC4; text-decoration: none; font-weight: 600;">contact@kokyage.com</a>
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 13px;">
                © 2025 Kokyage - Plateforme de co-gestion locative
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  getText: ({ ownerName, listingTitle, listingCity, proprietaireName, verificationDate }) => `
Logement vérifié avec succès !

Bonjour ${ownerName},

Excellente nouvelle ! Le propriétaire réel de votre logement a confirmé son accord pour la mise en location sur Kokyage.

LOGEMENT VÉRIFIÉ
${listingTitle}
${listingCity}

DÉTAILS DE LA VÉRIFICATION
Propriétaire : ${proprietaireName}
Date de vérification : ${verificationDate}

PROCHAINES ÉTAPES
- Votre logement peut maintenant recevoir des réservations
- Vous pouvez gérer vos disponibilités depuis votre espace hôte
- Les voyageurs peuvent désormais découvrir votre logement

Merci d'avoir complété la vérification de votre logement. Cette étape garantit la confiance et la sécurité pour tous les utilisateurs de Kokyage.

Voir mon espace hôte : ${process.env.NEXT_PUBLIC_APP_URL || 'https://kokyage.com'}/profil-hote

Besoin d'aide ? Contactez-nous à contact@kokyage.com

© 2025 Kokyage - Plateforme de co-gestion locative
  `
};
