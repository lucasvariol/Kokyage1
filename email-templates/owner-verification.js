/**
 * Template d'email de vérification propriétaire
 * Envoyé au propriétaire d'un logement pour valider son accord de sous-location
 */

export const ownerVerificationTemplate = {
  subject: "Validation de votre logement — Kokyage",
  
  getHtml: ({ ownerEmail, title, address, city, verifyUrl, isDevelopment, tenantFullName }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Validation de votre logement</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F5F1ED;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F1ED; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header avec gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #D79077 0%, #C96745 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                Validez votre logement Kokyage 🏠
              </h1>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #2D3748;">
                Bonjour,
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #2D3748;">
                Votre locataire ${tenantFullName || 'votre locataire'} a référencé un logement sur <strong style="color: #C96745;">Kokyage.com</strong> et vous a désigné comme propriétaire de ce bien.
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #2D3748;">
                Pour que ce logement puisse être mis en location sur notre plateforme, nous avons besoin de votre accord. Cliquez sur le bouton ci-dessous pour lire le détail de l'accord et confirmer votre acceptation. 
              </p>

              <!-- Bouton CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #D79077 0%, #C96745 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(201, 103, 69, 0.3);">
                      ✓ Confirmer ma propriété
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Encadré explication du concept -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #E6F7F5; border-left: 4px solid #60A29D; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <p style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #2D3748;">
                      💡 Comment fonctionne Kokyage ?
                    </p>
                    <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #4A5568;">
                      Kokyage est la première plateforme de sous-location permettant le partage des revenus entre locataires et propriétaires :
                    </p>
                    <ul style="margin: 0; padding-left: 18px; font-size: 14px; line-height: 1.6; color: #4A5568;">
                      <li style="margin: 0 0 8px;">
                        <strong style="color: #C96745;">Vous gardez le contrôle</strong> : vous pouvez annuler à tout moment (avec un préavis de 14 jours).
                      </li>
                      <li style="margin: 0 0 8px;">
                        <strong style="color: #C96745;">Vous augmentez vos revenus</strong> : vous obtenez 40% des revenus générés, en plus de votre loyer.
                      </li>
                      <li style="margin: 0;">
                        <strong style="color: #C96745;">Vous limitez les risques</strong> : enregistrement d'une caution de 300€ au moment de la réservation.
                      </li>
                    </ul>
                    <div style="margin-top: 14px;">
                      <a href="${(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com')}/fonctionnement" style="display: inline-block; background: #60A29D; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 10px; font-weight: 700; font-size: 14px;">
                        En savoir plus sur Kokyage
                      </a>
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F5F1ED; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 13px; color: #718096;">
                ⏱ Ce lien est valable pendant 24 heures.
              </p>
              <p style="margin: 0 0 15px; font-size: 13px; color: #718096;">
                Si vous n'êtes pas propriétaire de ce logement ou si vous n'avez pas autorisé cette annonce, vous pouvez ignorer cet email.
              </p>
              <p style="margin: 0; font-size: 12px; color: #A0AEC0;">
                © 2026 Kokyage
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
};
