/**
 * Template d'email de vérification d'adresse email
 * Envoyé lors de l'inscription d'un nouvel utilisateur
 */

export const emailVerificationTemplate = {
  subject: "Confirmez votre adresse email - Kokyage",
  
  getHtml: ({ prenom, verificationUrl }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vérifiez votre email</title>
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
                Bienvenue sur Kokyage ! 🎉
              </h1>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #2D3748;">
                Bonjour ${prenom ? prenom : ''},
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #2D3748;">
                Merci de vous être inscrit sur <strong style="color: #C96745;">Kokyage</strong> ! Nous sommes ravis de vous compter parmi nous.
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #2D3748;">
                Pour activer votre compte et commencer à profiter de nos services, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :
              </p>

              <!-- Bouton CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #D79077 0%, #C96745 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(201, 103, 69, 0.3);">
                      Confirmer mon email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #718096;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
              </p>
              <p style="margin: 10px 0 0; font-size: 13px; word-break: break-all; color: #60A29D;">
                ${verificationUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F5F1ED; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 13px; color: #718096;">
                Ce lien est valable pendant 24 heures.
              </p>
              <p style="margin: 0 0 15px; font-size: 13px; color: #718096;">
                Si vous n'avez pas créé de compte sur Kokyage, vous pouvez ignorer cet email.
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
