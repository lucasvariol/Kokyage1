/**
 * Email envoyé au voyageur le jour du départ pour demander un avis sur le séjour
 */

export const reviewRequestGuestTemplate = {
  subject: 'Comment s\'est passé votre séjour ?',

  getHtml: ({
    guestName,
    listingTitle,
    listingCity,
    hostName,
    reviewUrl,
    reservationId
  }) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Partagez votre expérience</title>
</head>
<body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#F5F1ED;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1ED;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#4ECDC4 0%,#3B82F6 100%);padding:36px 30px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:999px;padding:14px;margin-bottom:16px;">
                <span style="font-size:42px;">⭐</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.02em;">
                Comment s'est passé votre séjour ?
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <p style="font-size:16px;line-height:1.7;color:#1F2937;margin:0 0 18px;">
                Bonjour <strong>${guestName}</strong>,
              </p>
              <p style="font-size:16px;line-height:1.7;color:#475569;margin:0 0 26px;">
                Nous espérons que votre séjour à ${listingCity} s'est bien passé !
              </p>
              <p style="font-size:16px;line-height:1.7;color:#475569;margin:0 0 26px;">
                Votre avis est précieux pour aider la communauté Kokyage et améliorer l'expérience de tous.
                Prenez quelques instants pour partager votre expérience.
              </p>

              <div style="text-align:center;margin:30px 0;">
                <a href="${reviewUrl}" 
                   style="display:inline-block;background:linear-gradient(135deg,#4ECDC4 0%,#3B82F6 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-weight:700;font-size:16px;letter-spacing:0.02em;box-shadow:0 8px 24px rgba(59,130,246,0.3);transition:all 0.3s ease;">
                  Laisser un avis
                </a>
              </div>

              <p style="font-size:14px;line-height:1.7;color:#64748B;margin:30px 0 0;font-style:italic;">
                Votre avis sera publié une fois que l'hôte aura également laissé son avis, ou automatiquement après 14 jours.
                Cela garantit des évaluations honnêtes et impartiales.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#F8FAFC;padding:30px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="font-size:13px;color:#94A3B8;margin:0 0 8px;">
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
  `,

  getText: ({
    guestName,
    listingTitle,
    listingCity,
    hostName,
    reviewUrl
  }) => `
Bonjour ${guestName},

Nous espérons que votre séjour à ${listingTitle} à ${listingCity} s'est bien passé !

Votre avis est précieux pour aider la communauté Kokyage et améliorer l'expérience de tous.
Prenez quelques instants pour partager votre expérience avec ${hostName}.

Laisser un avis : ${reviewUrl}

⏰ Vous avez 14 jours pour laisser votre avis. Après ce délai, il ne sera plus possible de noter ce séjour.

Votre avis sera publié une fois que ${hostName} aura également laissé son avis, ou automatiquement après 14 jours.

Merci de faire partie de la communauté Kokyage.
https://kokyage.com
  `
};
