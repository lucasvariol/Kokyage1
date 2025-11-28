/**
 * Template d'email de vérification propriétaire
 * Envoyé au propriétaire d'un logement pour valider son accord de sous-location
 */

export const ownerVerificationTemplate = {
  subject: "Validation de votre logement — Kokyage",
  
  getHtml: ({ ownerEmail, title, address, city, verifyUrl, isDevelopment }) => `
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
          
          ${isDevelopment ? `
          <!-- Banner de test -->
          <tr>
            <td style="background-color: #FEF3C7; padding: 20px 30px; border-bottom: 2px solid #F59E0B;">
              <p style="margin: 0; font-size: 14px; color: #92400E; font-weight: 600;">
                🧪 MODE TEST
              </p>
              <p style="margin: 8px 0 0; font-size: 13px; color: #92400E;">
                Destinataire original : <strong>${ownerEmail}</strong>
              </p>
            </td>
          </tr>
          ` : ''}

          <!-- Header avec gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #D79077 0%, #C96745 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                Votre accord est nécessaire 🏠
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
                Un locataire a référencé un logement sur <strong style="color: #C96745;">Kokyage</strong> et vous a désigné comme propriétaire de ce bien.
              </p>

              <!-- Encadré avec les informations du logement -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F1ED; border-radius: 12px; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px 25px;">
                    <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #C96745; text-transform: uppercase; letter-spacing: 0.5px;">
                      📍 Logement concerné
                    </p>
                    ${title ? `
                    <p style="margin: 0 0 8px; font-size: 15px; color: #2D3748;">
                      <strong>Titre :</strong> ${title}
                    </p>
                    ` : ''}
                    ${address ? `
                    <p style="margin: 0; font-size: 15px; color: #2D3748;">
                      <strong>Adresse :</strong> ${address}${city ? `, ${city}` : ''}
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <p style="margin: 25px 0 20px; font-size: 16px; line-height: 1.6; color: #2D3748;">
                Pour permettre la publication de cette annonce, nous devons nous assurer que vous autorisez bien la sous-location de votre bien.
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #2D3748;">
                <strong>Cliquez sur le bouton ci-dessous pour :</strong>
              </p>

              <ul style="margin: 0 0 30px; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #4A5568;">
                <li>Confirmer votre accord de sous-location</li>
                <li>Consulter les conditions de l'annonce</li>
                <li>Créer votre compte propriétaire (si nécessaire)</li>
              </ul>

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

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #718096;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
              </p>
              <p style="margin: 10px 0 0; font-size: 13px; word-break: break-all; color: #60A29D;">
                ${verifyUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F5F1ED; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 13px; color: #718096;">
                ⏱ Ce lien est valable pendant 24 heures.
              </p>
              <p style="margin: 0 0 15px; font-size: 13px; color: #718096;">
                Si vous n'êtes pas propriétaire de ce logement ou si vous n'avez pas autorisé cette annonce, vous pouvez ignorer cet email en toute sécurité.
              </p>
              <p style="margin: 0; font-size: 12px; color: #A0AEC0;">
                © 2025 Kokyage. Tous droits réservés.
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
