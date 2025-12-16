/**
 * Email envoyé au voyageur après son paiement pour l'informer que sa réservation
 * est en attente de validation par l'hôte (délai de 48h).
 */

export const reservationGuestPendingTemplate = {
  subject: 'Votre réservation est en attente de validation',

  getHtml: ({
    guestName,
    listingTitle,
    listingCity,
    startDate,
    endDate,
    nights,
    guests,
    totalPrice
  }) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Réservation en attente de validation</title>
</head>
<body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#F5F1ED;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1ED;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#4ECDC4 0%,#3B82F6 100%);padding:36px 30px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:999px;padding:14px;margin-bottom:16px;">
                <span style="font-size:42px;">⏳</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.02em;">
                Réservation en attente
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <p style="font-size:16px;line-height:1.7;color:#1F2937;margin:0 0 18px;">
                Bonjour <strong>${guestName}</strong>,
              </p>
              <p style="font-size:16px;line-height:1.7;color:#475569;margin:0 0 26px;">
                Votre paiement a bien été confirmé et l'hôte a reçu une notification pour valider votre réservation.
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

              <div style="padding:18px 20px;background:linear-gradient(135deg,rgba(251,191,36,0.15),rgba(245,158,11,0.08));border-left:4px solid #F59E0B;border-radius:12px;margin-bottom:28px;color:#1F2937;font-size:15px;line-height:1.6;">
                <strong style="display:block;margin-bottom:8px;">⏱️ Validation en cours</strong>
                <p style="margin:0;color:#475569;">
                  L'hôte dispose de <strong style="color:#1F2937;">48 heures</strong> pour accepter ou refuser votre demande de réservation.
                  Vous recevrez un email dès qu'une décision aura été prise.
                </p>
              </div>

              <div style="padding:18px 20px;background:#F0F9FF;border-left:4px solid #3B82F6;border-radius:12px;margin-bottom:28px;color:#1F2937;font-size:14px;line-height:1.6;">
                <p style="margin:0;color:#475569;">
                  <strong style="color:#1F2937;">En cas de refus :</strong> Votre paiement sera intégralement remboursé sous 5 à 7 jours ouvrés.
                </p>
              </div>

              <p style="font-size:15px;line-height:1.7;color:#64748B;margin:0;text-align:center;">
                Merci de votre confiance et à bientôt !
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#F9FAFB;padding:28px 24px;text-align:center;border-top:1px solid #E5E7EB;">
              <p style="margin:0 0 8px;color:#64748B;font-size:13px;">
                Besoin d'aide ? Contactez-nous à <a href="mailto:contact@kokyage.com" style="color:#4ECDC4;text-decoration:none;font-weight:600;">contact@kokyage.com</a>
              </p>
              <p style="margin:0;color:#94A3B8;font-size:12px;">© 2026 Kokyage - Plateforme de co-gestion locative</p>
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
    listingTitle,
    listingCity,
    startDate,
    endDate,
    nights,
    guests,
    totalPrice
  }) => `
Réservation en attente de validation

Bonjour ${guestName},

Votre paiement a bien été confirmé et l'hôte a reçu une notification pour valider votre réservation.

Logement : ${listingTitle}
Ville : ${listingCity}
Dates : ${startDate} → ${endDate}
Séjour : ${nights} nuit${nights > 1 ? 's' : ''}
Voyageurs : ${guests}
Montant payé : ${totalPrice}

⏱️ VALIDATION EN COURS
L'hôte dispose de 48 heures pour accepter ou refuser votre demande de réservation.
Vous recevrez un email dès qu'une décision aura été prise.

En cas de refus : Votre paiement sera intégralement remboursé sous 5 à 7 jours ouvrés.

Merci de votre confiance et à bientôt !

Besoin d'aide ? contact@kokyage.com

© 2026 Kokyage
  `
};
