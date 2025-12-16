/**
 * Email envoyé à l'hôte (owner_id) lorsqu'une nouvelle réservation est créée et nécessite sa validation.
 */

export const reservationHostPendingTemplate = {
  subject: 'Une nouvelle réservation doit être validée',

  getHtml: ({
    tenantName,
    guestName,
    listingTitle,
    listingCity,
    startDate,
    endDate,
    nights,
    guests,
    totalPrice,
    reservationUrl
  }) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nouvelle réservation à valider</title>
</head>
<body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#F5F1ED;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1ED;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#4ECDC4 0%,#3B82F6 100%);padding:36px 30px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:999px;padding:14px;margin-bottom:16px;">
                <span style="font-size:42px;">💳</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.02em;">
                Nouvelle réservation reçue
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <p style="font-size:16px;line-height:1.7;color:#1F2937;margin:0 0 18px;">
                Bonjour <strong>${tenantName}</strong>,
              </p>
              <p style="font-size:16px;line-height:1.7;color:#475569;margin:0 0 26px;">
                Une nouvelle réservation a été effectuée par <strong>${guestName}</strong>.
                Vous avez <strong style="color:#1F2937;">48 heures</strong> pour valider ou refuser cette réservation depuis votre espace hôte.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(78,205,196,0.1),rgba(59,130,246,0.08));border-left:4px solid #4ECDC4;border-radius:12px;margin:0 0 26px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#0F172A;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">🏠 Logement</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#1F2937;">${listingTitle}</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#64748B;">📍 ${listingCity}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;border:1px solid #E2E8F0;margin-bottom:26px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0;font-size:14px;color:#475569;">
                      Dates : <strong style="color:#1F2937;">${startDate}</strong> → <strong style="color:#1F2937;">${endDate}</strong><br />
                      Séjour : <strong style="color:#1F2937;">${nights} nuit${nights > 1 ? 's' : ''}</strong><br />
                      Voyageurs : <strong style="color:#1F2937;">${guests}</strong><br />
                      Montant payé : <strong style="color:#1F2937;">${totalPrice}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <div style="padding:18px 20px;background:linear-gradient(135deg,rgba(59,130,246,0.1),rgba(37,99,235,0.06));border-left:4px solid #3B82F6;border-radius:12px;margin-bottom:28px;color:#1F2937;font-size:15px;line-height:1.6;">
                <strong style="display:block;margin-bottom:8px;">⏱️ Vous avez 48 heures pour répondre :</strong>
                <ul style="padding-left:18px;margin:0;color:#475569;">
                  <li>Connectez-vous à votre espace hôte</li>
                  <li>Consultez la réservation et vérifiez les informations</li>
                  <li>Validez ou refusez la réservation</li>
                </ul>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${reservationUrl}" style="display:inline-block;background:linear-gradient(135deg,#3B82F6 0%,#2563EB 100%);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 12px 26px rgba(37,99,235,0.25);">
                      Valider la réservation
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

  getText: ({
    tenantName,
    guestName,
    listingTitle,
    listingCity,
    startDate,
    endDate,
    nights,
    guests,
    totalPrice,
    reservationUrl
  }) => `
Nouvelle réservation à valider

Bonjour ${tenantName},

Une nouvelle réservation a été effectuée par ${guestName}.
Vous avez 48 heures pour valider ou refuser cette réservation depuis votre espace hôte.

Logement : ${listingTitle}
Ville : ${listingCity}
Dates : ${startDate} → ${endDate}
Séjour : ${nights} nuit${nights > 1 ? 's' : ''}
Voyageurs : ${guests}
Montant payé : ${totalPrice}

Valider la réservation : ${reservationUrl}

Besoin d'aide ? contact@kokyage.com

© 2025 Kokyage
  `
};
