/**
 * Email envoyé au locataire principal (owner_id) lorsque
 * le propriétaire met en pause son accord.
 */

export const ownerConsentPausedTemplate = {
  subject: '⏸️ Accord propriétaire mis en pause',

  getHtml: ({ tenantName, listingTitle, listingCity, proprietaireName, pausedAt, cutoffDate }) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Accord propriétaire en pause</title>
</head>
<body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#F5F1ED;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1ED;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);padding:36px 30px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:999px;padding:14px;margin-bottom:14px;">
                <span style="font-size:42px;">⏸️</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.02em;">
                Accord propriétaire en pause
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <p style="font-size:16px;line-height:1.7;color:#1F2937;margin:0 0 16px;">
                Bonjour ${tenantName},
              </p>
              <p style="font-size:16px;line-height:1.7;color:#475569;margin:0 0 24px;">
                Votre propriétaire a mis en pause son accord pour votre logement.
                Le logement est désormais indisponible à la réservation jusqu'à réactivation de sa part.
                Toutes les réservations dont le début est postérieur au ${cutoffDate || 'J+14'} sont annulées. Les réservations démarrant avant cette date restent inchangées.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(249,115,22,0.08),rgba(234,88,12,0.05));border-left:4px solid #F97316;border-radius:12px;margin:0 0 24px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#0F172A;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">🏠 Logement concerné</p>
                    <p style="margin:0;font-size:17px;font-weight:700;color:#1F2937;">${listingTitle}</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#64748B;">📍 ${listingCity}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://kokyage.com'}/profil-hote" style="display:inline-block;background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 10px 24px rgba(249,115,22,0.25);">
                      Voir mes réservations
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
              <p style="margin:0;color:#94A3B8;font-size:12px;">© 2026 Kokyage</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  getText: ({ tenantName, listingTitle, listingCity, proprietaireName, pausedAt, cutoffDate }) => `
Accord propriétaire en pause

Bonjour ${tenantName},

Le propriétaire ${proprietaireName} a mis en pause son accord pour votre logement.
Le logement est temporairement indisponible à la réservation.

Toutes les réservations dont la date de début est postérieure au ${cutoffDate || 'J+14'} sont annulées. Les réservations démarrant avant cette date restent inchangées.

Logement concerné :
${listingTitle}
${listingCity}

Date de mise en pause : ${pausedAt}

À faire :
- Mettre à jour vos voyageurs si des séjours étaient prévus
- Mettre en pause les campagnes marketing
- Attendre la nouvelle validation du propriétaire avant toute nouvelle réservation

Voir mes réservations : ${process.env.NEXT_PUBLIC_APP_URL || 'https://kokyage.com'}/profil-hote

Nous vous informerons dès la réactivation. Merci pour votre vigilance.

© 2025 Kokyage
  `
};
