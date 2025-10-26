/**
 * Email envoyé au locataire principal (owner_id) lorsque
 * le propriétaire réactive son accord.
 */

export const ownerConsentResumedTemplate = {
  subject: '✅ Accord propriétaire réactivé',

  getHtml: ({ tenantName, listingTitle, listingCity, proprietaireName, resumedAt }) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Accord propriétaire réactivé</title>
</head>
<body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#F5F1ED;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1ED;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#4ECDC4 0%,#44B5AC 100%);padding:36px 30px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:999px;padding:14px;margin-bottom:14px;">
                <span style="font-size:42px;">🔔</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.02em;">
                Accord propriétaire réactivé
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <p style="font-size:16px;line-height:1.7;color:#1F2937;margin:0 0 16px;">
                Bonjour <strong>${tenantName}</strong>,
              </p>
              <p style="font-size:16px;line-height:1.7;color:#475569;margin:0 0 24px;">
                Le propriétaire <strong>${proprietaireName}</strong> vient de réactiver son accord pour votre logement.
                Vous pouvez à nouveau proposer des réservations aux voyageurs.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(78,205,196,0.08),rgba(68,181,168,0.05));border-left:4px solid #4ECDC4;border-radius:12px;margin:0 0 24px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#0F172A;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">🏠 Logement concerné</p>
                    <p style="margin:0;font-size:17px;font-weight:700;color:#1F2937;">${listingTitle}</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#64748B;">📍 ${listingCity}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0;font-size:14px;color:#475569;">
                      Date de réactivation : <strong style="color:#1F2937;">${resumedAt}</strong>
                    </p>
                  </td>
                </tr>
              </table>
              <div style="padding:18px 20px;background:linear-gradient(135deg,rgba(59,130,246,0.08),rgba(37,99,235,0.05));border-left:4px solid #3B82F6;border-radius:12px;margin-bottom:28px;color:#1F2937;font-size:15px;line-height:1.6;">
                <strong style="display:block;margin-bottom:8px;">Prochaines étapes :</strong>
                <ul style="padding-left:18px;margin:0;color:#475569;">
                  <li>Vérifiez vos disponibilités et tarifs</li>
                  <li>Informez vos voyageurs que le logement est à nouveau disponible</li>
                  <li>Assurez-vous que les informations du logement sont à jour</li>
                </ul>
              </div>
              <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 28px;">
                Merci pour votre collaboration. Cette étape garantit un suivi transparent entre vous et le propriétaire du logement.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://kokyage.com'}/profil-hote" style="display:inline-block;background:linear-gradient(135deg,#3B82F6 0%,#2563EB 100%);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 10px 24px rgba(37,99,235,0.2);">
                      Accéder à mon espace hôte
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#F9FAFB;padding:28px 24px;text-align:center;border-top:1px solid #E5E7EB;">
              <p style="margin:0 0 8px;color:#64748B;font-size:13px;">
                Besoin d'aide ? Contactez-nous à <a href="mailto:contact@kokyage.com" style="color:#4ECDC4;text-decoration:none;font-weight:600;">contact@kokyage.com</a>
              </p>
              <p style="margin:0;color:#94A3B8;font-size:12px;">© 2025 Kokyage - Plateforme de co-gestion locative</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  getText: ({ tenantName, listingTitle, listingCity, proprietaireName, resumedAt }) => `
Accord propriétaire réactivé

Bonjour ${tenantName},

Le propriétaire ${proprietaireName} vient de réactiver son accord pour votre logement.
Vous pouvez à nouveau proposer des réservations aux voyageurs.

Logement concerné :
${listingTitle}
${listingCity}

Date de réactivation : ${resumedAt}

Prochaines étapes :
- Vérifiez vos disponibilités et tarifs
- Informez vos voyageurs que le logement est à nouveau disponible
- Assurez-vous que les informations du logement sont à jour

Accéder à mon espace hôte : ${process.env.NEXT_PUBLIC_APP_URL || 'https://kokyage.com'}/profil-hote

Besoin d'aide ? contact@kokyage.com

© 2025 Kokyage
  `
};
