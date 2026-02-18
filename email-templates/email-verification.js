/**
 * Template d'email de vérification d'adresse email
 * Envoyé lors de l'inscription d'un nouvel utilisateur
 * Utilise un code OTP à 6 chiffres saisi directement sur la page
 */

export const emailVerificationTemplate = {
  subject: "Votre code de vérification Kokyage",
  
  getHtml: ({ prenom, otpCode }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre code de vérification</title>
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
                Merci de vous être inscrit sur <strong style="color: #C96745;">Kokyage</strong> !
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #2D3748;">
                Entrez ce code sur la page d'inscription pour confirmer votre adresse email :
              </p>

              <!-- Code OTP affiché en grand -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #F5F1ED 0%, #EDE8E3 100%); border: 2px solid #D79077; border-radius: 16px; padding: 24px 48px;">
                      <p style="margin: 0 0 8px; font-size: 13px; color: #718096; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Votre code de vérification</p>
                      <p style="margin: 0; font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #C96745; font-family: 'Courier New', monospace;">
                        ${otpCode}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #718096; text-align: center;">
                Ce code est valable pendant <strong>15 minutes</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F5F1ED; padding: 30px; text-align: center;">
              <p style="margin: 0 0 15px; font-size: 13px; color: #718096;">
                Si vous n'avez pas créé de compte sur Kokyage, vous pouvez ignorer cet email.
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
