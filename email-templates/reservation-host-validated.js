/**
 * Email envoyé au voyageur lorsque l'hôte valide la réservation.
 */

export const reservationHostValidatedTemplate = {
  subject: '🎉 Votre réservation est confirmée par l\'hôte',

  getHtml: ({
    guestName,
    hostName,
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
  <title>Réservation validée par l'hôte</title>
</head>
<body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#F4F7FB;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F7FB;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 16px 44px rgba(15,23,42,0.12);">
          <tr>
            <td style="background:linear-gradient(135deg,#2563EB 0%,#7C3AED 100%);padding:38px 32px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:999px;padding:14px;margin-bottom:18px;">
                <span style="font-size:42px;">🎉</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.01em;">
                ${hostName} vient de valider votre réservation
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <p style="font-size:16px;line-height:1.7;color:#1F2937;margin:0 0 20px;">
                Bonjour <strong>${guestName}</strong>,
              </p>
              <p style="font-size:16px;line-height:1.7;color:#475569;margin:0 0 26px;">
                Bonne nouvelle ! Votre hôte vient de confirmer votre séjour. Nous avons hâte de vous accueillir.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:14px;border:1px solid #E2E8F0;margin-bottom:26px;overflow:hidden;">
                <tr>
                  <td style="padding:22px 24px;background:#F8FAFC;">
                    <p style="margin:0 0 8px;font-size:13px;color:#0F172A;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">🏠 Logement</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#1F2937;">${listingTitle}</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#64748B;">📍 ${listingCity}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0;font-size:15px;color:#475569;line-height:1.6;">
                      Dates : <strong style="color:#1F2937;">${startDate}</strong> → <strong style="color:#1F2937;">${endDate}</strong><br />
                      Séjour : <strong style="color:#1F2937;">${nights} nuit${nights > 1 ? 's' : ''}</strong><br />
                      Voyageurs : <strong style="color:#1F2937;">${guests}</strong><br />
                      Montant total : <strong style="color:#1F2937;">${totalPrice}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <div style="padding:20px 22px;background:linear-gradient(135deg,rgba(124,58,237,0.08),rgba(37,99,235,0.1));border-left:4px solid #7C3AED;border-radius:14px;margin-bottom:30px;color:#1F2937;font-size:15px;line-height:1.6;">
                <strong style="display:block;margin-bottom:10px;">Et maintenant ?</strong>
                <ul style="padding-left:18px;margin:0;color:#475569;">
                  <li>Retrouvez tous les détails de votre séjour dans votre espace voyageur</li>
                  <li>Commencez à préparer votre arrivée et contactez l'hôte via le chat</li>
                  <li>Profitez de votre séjour !</li>
                </ul>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${reservationUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED 0%,#4F46E5 100%);color:#ffffff;text-decoration:none;padding:14px 38px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 12px 26px rgba(79,70,229,0.25);">
                      Voir ma réservation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#F9FAFB;padding:28px 24px;text-align:center;border-top:1px solid #E5E7EB;">
              <p style="margin:0 0 8px;color:#64748B;font-size:13px;">
                Une question ? Écrivez-nous à <a href="mailto:contact@kokyage.com" style="color:#2563EB;text-decoration:none;font-weight:600;">contact@kokyage.com</a>
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

  getText: ({
    guestName,
    hostName,
    listingTitle,
    listingCity,
    startDate,
    endDate,
    nights,
    guests,
    totalPrice,
    reservationUrl
  }) => `
Votre réservation est confirmée !

Bonjour ${guestName},

Bonne nouvelle : ${hostName} vient de valider votre séjour.

Logement : ${listingTitle}
Ville : ${listingCity}
Dates : ${startDate} → ${endDate}
Séjour : ${nights} nuit${nights > 1 ? 's' : ''}
Voyageurs : ${guests}
Montant total : ${totalPrice}

Consultez votre réservation : ${reservationUrl}

Nous restons disponibles à contact@kokyage.com.

© 2025 Kokyage
  `
};
