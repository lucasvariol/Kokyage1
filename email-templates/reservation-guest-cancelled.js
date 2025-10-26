/**
 * Email envoyé à l'hôte lorsque le voyageur annule sa réservation.
 */

export const reservationGuestCancelledTemplate = {
  subject: '🚫 Annulation de réservation par le voyageur',

  getHtml: ({
    hostName,
    guestName,
    listingTitle,
    listingCity,
    startDate,
    endDate,
    nights,
    guests,
    totalPrice,
    reason,
    reservationsUrl
  }) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Annulation de réservation</title>
</head>
<body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#F4F7FB;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F7FB;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 16px 44px rgba(15,23,42,0.12);">
          <tr>
            <td style="background:linear-gradient(135deg,#F59E0B 0%,#EF4444 100%);padding:38px 32px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:999px;padding:14px;margin-bottom:18px;">
                <span style="font-size:42px;">🚫</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.01em;">
                Annulation de réservation
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <p style="font-size:16px;line-height:1.7;color:#1F2937;margin:0 0 20px;">
                Bonjour <strong>${hostName}</strong>,
              </p>
              <p style="font-size:16px;line-height:1.7;color:#475569;margin:0 0 26px;">
                Nous vous informons que <strong>${guestName}</strong> a annulé sa réservation pour votre logement. Les dates sont à nouveau disponibles à la réservation.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:14px;border:1px solid #E2E8F0;margin-bottom:26px;overflow:hidden;">
                <tr>
                  <td style="padding:22px 24px;background:#F8FAFC;">
                    <p style="margin:0 0 8px;font-size:13px;color:#0F172A;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">🏠 Logement concerné</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#1F2937;">${listingTitle}</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#64748B;">📍 ${listingCity}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0;font-size:15px;color:#475569;line-height:1.6;">
                      <strong style="color:#1F2937;">Voyageur :</strong> ${guestName}<br />
                      <strong style="color:#1F2937;">Dates :</strong> ${startDate} → ${endDate}<br />
                      <strong style="color:#1F2937;">Séjour :</strong> ${nights} nuit${nights > 1 ? 's' : ''}<br />
                      <strong style="color:#1F2937;">Voyageurs :</strong> ${guests}<br />
                      <strong style="color:#1F2937;">Montant :</strong> ${totalPrice}
                    </p>
                  </td>
                </tr>
              </table>

              ${reason && reason !== 'Annulé par le voyageur' ? `
              <div style="padding:18px 22px;background:#FEF3C7;border-left:4px solid #F59E0B;border-radius:14px;margin-bottom:28px;color:#1F2937;font-size:14px;line-height:1.6;">
                <strong style="display:block;margin-bottom:8px;">📝 Raison de l'annulation :</strong>
                <p style="margin:0;color:#92400E;">${reason}</p>
              </div>
              ` : ''}

              <div style="padding:20px 22px;background:linear-gradient(135deg,rgba(34,197,94,0.08),rgba(22,163,74,0.1));border-left:4px solid #22C55E;border-radius:14px;margin-bottom:30px;color:#1F2937;font-size:15px;line-height:1.6;">
                <strong style="display:block;margin-bottom:10px;">✅ Dates à nouveau disponibles</strong>
                <p style="margin:0;color:#475569;">
                  Les dates du <strong>${startDate}</strong> au <strong>${endDate}</strong> sont maintenant libres et peuvent être réservées par d'autres voyageurs.
                </p>
              </div>

              <div style="padding:18px 22px;background:#EFF6FF;border-left:4px solid #3B82F6;border-radius:14px;margin-bottom:28px;color:#1F2937;font-size:14px;line-height:1.6;">
                <p style="margin:0;color:#1E40AF;">
                  <strong>💰 Informations financières :</strong><br />
                  Le voyageur a été remboursé intégralement. Aucun paiement ne sera effectué pour cette réservation annulée.
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${reservationsUrl || 'https://kokyage.com/reservations?view=host'}" style="display:inline-block;background:linear-gradient(135deg,#2563EB 0%,#1E40AF 100%);color:#ffffff;text-decoration:none;padding:14px 38px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 12px 26px rgba(37,99,235,0.25);">
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
                Besoin d'aide ? Contactez-nous à <a href="mailto:contact@kokyage.com" style="color:#2563EB;text-decoration:none;font-weight:600;">contact@kokyage.com</a>
              </p>
              <p style="margin:0;color:#94A3B8;font-size:12px;">
                © ${new Date().getFullYear()} Kokyage. Tous droits réservés.
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

  getText: ({
    hostName,
    guestName,
    listingTitle,
    listingCity,
    startDate,
    endDate,
    nights,
    guests,
    totalPrice,
    reason,
    reservationsUrl
  }) => `
ANNULATION DE RÉSERVATION

Bonjour ${hostName},

Nous vous informons que ${guestName} a annulé sa réservation pour votre logement. Les dates sont à nouveau disponibles à la réservation.

DÉTAILS DE LA RÉSERVATION ANNULÉE
----------------------------------
Logement : ${listingTitle}
Ville : ${listingCity}
Voyageur : ${guestName}
Dates : ${startDate} → ${endDate}
Séjour : ${nights} nuit${nights > 1 ? 's' : ''}
Voyageurs : ${guests}
Montant : ${totalPrice}

${reason && reason !== 'Annulé par le voyageur' ? `
RAISON DE L'ANNULATION
----------------------
${reason}
` : ''}

DATES À NOUVEAU DISPONIBLES
----------------------------
Les dates du ${startDate} au ${endDate} sont maintenant libres et peuvent être réservées par d'autres voyageurs.

INFORMATIONS FINANCIÈRES
-------------------------
Le voyageur a été remboursé intégralement. Aucun paiement ne sera effectué pour cette réservation annulée.

Voir mes réservations : ${reservationsUrl || 'https://kokyage.com/reservations?view=host'}

---
Besoin d'aide ? Contactez-nous à contact@kokyage.com
© ${new Date().getFullYear()} Kokyage. Tous droits réservés.
  `
};
