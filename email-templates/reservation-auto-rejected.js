/**
 * Template email : Refus automatique après 48h sans réponse de l'hôte
 */

export const reservationAutoRejectedTemplate = {
  subject: 'Réservation expirée - Remboursement intégral',

  getHtml: ({ guestName, listingTitle, listingCity, startDate, endDate, totalPrice }) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réservation expirée</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Reservation annulée</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Bonjour ${guestName},
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Nous avons le regret de vous informer que votre demande de réservation n'a pas été acceptée par l'hôte dans les délais impartis (48 heures).
              </p>

              <!-- Détails réservation -->
              <div style="background-color: #c2c2c2ff; border-left: 4px solid #000000ff; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h2 style="margin: 0 0 15px; color: #353434ff; font-size: 18px; font-weight: 700;">
                  ${listingTitle}
                </h2>
                <p style="margin: 0 0 10px; color: #353434ff; font-size: 14px;">
                  📍 ${listingCity}
                </p>
                <p style="margin: 0 0 10px; color: #353434ff; font-size: 14px;">
                  📅 Du ${startDate} au ${endDate}
                </p>
                <p style="margin: 0; color: #353434ff; font-size: 16px; font-weight: 700;">
                  💰 Montant : ${totalPrice}
                </p>
              </div>

              <!-- Remboursement -->
              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 10px; color: #065f46; font-size: 16px; font-weight: 700;">
                  ✅ Aucun prélèvement effectué
                </h3>
                <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.6;">
                  Votre carte bancaire n'a pas été débitée. L'autorisation de paiement sera automatiquement libérée par votre banque sous 3 à 7 jours ouvrés.
                </p>
              </div>

              <p style="margin: 30px 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Nous vous invitons à rechercher un autre logement qui correspondra mieux à vos besoins.
              </p>

              <!-- CTA -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com'}/logements" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px;">
                  Trouver un logement
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                Des questions ? Contactez-nous à <a href="mailto:contact@kokyage.com" style="color: #667eea; text-decoration: none;">contact@kokyage.com</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Kokyage.
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

  getText: ({ guestName, listingTitle, listingCity, startDate, endDate, totalPrice }) => `
Bonjour ${guestName},

Nous vous informons que votre demande de réservation n'a pas été acceptée dans les délais impartis (48 heures).

DÉTAILS DE LA RÉSERVATION :
${listingTitle}
${listingCity}
Du ${startDate} au ${endDate}
Montant : ${totalPrice}

AUCUN PRÉLÈVEMENT EFFECTUÉ
Votre carte bancaire n'a pas été débitée. L'autorisation de paiement sera automatiquement libérée par votre banque sous 3 à 7 jours ouvrés.

Nous vous invitons à rechercher un autre logement qui correspondra mieux à vos besoins.

Trouver un logement : ${process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com'}/logements

Cordialement,
L'équipe Kokyage

Des questions ? contact@kokyage.com
© ${new Date().getFullYear()} Kokyage
  `
};
