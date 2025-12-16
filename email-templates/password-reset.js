/**
 * Template d'email de réinitialisation de mot de passe
 */

export const passwordResetTemplate = {
  subject: "Réinitialisez votre mot de passe - Kokyage",
  
  getHtml: ({ prenom, resetUrl }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisez votre mot de passe</title>
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
                Réinitialisation de mot de passe 🔐
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
                Vous avez demandé à réinitialiser votre mot de passe sur <strong style="color: #C96745;">Kokyage</strong>.
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #2D3748;">
                Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
              </p>

              <!-- Bouton CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #D79077 0%, #C96745 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(201, 103, 69, 0.3);">
                      Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #718096;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
              </p>
              <p style="margin: 10px 0 0; font-size: 13px; word-break: break-all; color: #60A29D;">
                ${resetUrl}
              </p>

              <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #E8E3DC;">
                <ul style="margin: 0; padding-left: 20px; color: #4A5568; font-size: 14px; line-height: 1.8;">
                  <li>Ce lien est <strong>valable pendant 1 heure</strong></li>
                  <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                  <li>Votre mot de passe actuel reste valide tant que vous n'en créez pas un nouveau</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F5F1ED; padding: 30px; text-align: center;">
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
