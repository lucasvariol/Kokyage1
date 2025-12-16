/**
 * Email envoyé à l'hôte le jour du départ pour demander un avis sur le voyageur
 */

export const reviewRequestHostTemplate = {
  subject: 'Evaluez votre voyageur',

  getHtml: ({
    hostName,
    guestName,
    listingTitle,
    reviewUrl,
    reservationId
  }) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Évaluez votre voyageur</title>
</head>
<body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#F5F1ED;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1ED;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#10B981 0%,#3B82F6 100%);padding:36px 30px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:999px;padding:14px;margin-bottom:16px;">
                <span style="font-size:42px;">🌟</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.02em;">
                Évaluez votre voyageur
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <p style="font-size:16px;line-height:1.7;color:#1F2937;margin:0 0 18px;">
                Bonjour <strong>${hostName}</strong>,
              </p>
              <p style="font-size:16px;line-height:1.7;color:#475569;margin:0 0 26px;">
                Le séjour de <strong>${guestName}</strong> dans votre logement <strong>${listingTitle}</strong> vient de se terminer.
              </p>
              <p style="font-size:16px;line-height:1.7;color:#475569;margin:0 0 26px;">
                Votre avis aide les autres hôtes à mieux connaître les voyageurs et renforce la confiance au sein de la communauté Kokyage.
              </p>
              
              <div style="background:#F8FAFC;border-radius:12px;padding:24px;margin:30px 0;">
                <p style="font-size:14px;color:#64748B;margin:0 0 12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                  📝 Votre évaluation
                </p>
                <ul style="margin:0;padding:0;list-style:none;">
                  <li style="padding:8px 0;color:#475569;font-size:15px;">✓ Notez le respect des lieux</li>
                  <li style="padding:8px 0;color:#475569;font-size:15px;">✓ Évaluez la communication</li>
                  <li style="padding:8px 0;color:#475569;font-size:15px;">✓ Partagez votre expérience</li>
                </ul>
              </div>

              <div style="text-align:center;margin:30px 0;">
                <a href="${reviewUrl}" 
                   style="display:inline-block;background:linear-gradient(135deg,#10B981 0%,#3B82F6 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-weight:700;font-size:16px;letter-spacing:0.02em;box-shadow:0 8px 24px rgba(16,185,129,0.3);transition:all 0.3s ease;">
                  Laisser un avis
                </a>
              </div>

              <div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:8px;margin:30px 0;">
                <p style="font-size:14px;color:#92400E;margin:0;line-height:1.6;">
                  ⏰ <strong>Vous avez 14 jours</strong> pour laisser votre avis. Après ce délai, il ne sera plus possible de noter ce voyageur.
                </p>
              </div>

              <p style="font-size:14px;line-height:1.7;color:#64748B;margin:30px 0 0;font-style:italic;">
                Votre avis sera publié une fois que ${guestName} aura également laissé son avis, ou automatiquement après 14 jours.
                Cela garantit des évaluations honnêtes et impartiales.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#F8FAFC;padding:30px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="font-size:13px;color:#94A3B8;margin:0 0 8px;">
                Merci de faire partie de la communauté Kokyage
              </p>
              <p style="font-size:13px;color:#94A3B8;margin:0;">
                <a href="https://kokyage.com" style="color:#3B82F6;text-decoration:none;">kokyage.com</a>
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
    reviewUrl
  }) => `
Bonjour ${hostName},

Le séjour de ${guestName} dans votre logement ${listingTitle} vient de se terminer.

Votre avis aide les autres hôtes à mieux connaître les voyageurs et renforce la confiance au sein de la communauté Kokyage.

Laisser un avis : ${reviewUrl}

⏰ Vous avez 14 jours pour laisser votre avis. Après ce délai, il ne sera plus possible de noter ce voyageur.

Votre avis sera publié une fois que ${guestName} aura également laissé son avis, ou automatiquement après 14 jours.

Merci de faire partie de la communauté Kokyage.
https://kokyage.com
  `
};
