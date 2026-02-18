import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, table, record, old_record } = body;

    // Vérifier que c'est bien un UPDATE dans listings
    if (type !== 'UPDATE' || table !== 'listings') {
      return NextResponse.json({ received: true });
    }

    // Vérifier que le statut a changé vers "en attente validation modérateur"
    const newStatus = record.status;
    const oldStatus = old_record?.status;

    if (newStatus !== 'en attente validation modérateur' || oldStatus === newStatus) {
      return NextResponse.json({ received: true });
    }

    const { id, title, address, city, email_proprietaire, owner_id } = record;

    // Email à l'admin
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@kokyage.com';

    const emailContent = {
      from: 'Kokyage <notifications@kokyage.com>',
      to: adminEmail,
      subject: '🏠 Nouveau logement à modérer sur Kokyage',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#F9FAFB;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#C96745 0%,#D68E74 100%);padding:32px 24px;text-align:center;">
                        <h1 style="margin:0;color:#FFFFFF;font-size:28px;font-weight:800;">
                          🏠 Logement à Modérer
                        </h1>
                        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">
                          Un nouveau logement nécessite votre validation
                        </p>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding:32px 24px;">
                        
                        <!-- Listing Info Card -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:12px;margin-bottom:24px;">
                          <tr>
                            <td style="padding:20px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding:8px 0;">
                                    <p style="margin:0 0 4px;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                                      🏷️ Titre du logement
                                    </p>
                                    <p style="margin:0;font-size:16px;color:#0F172A;font-weight:700;">
                                      ${title || 'Non renseigné'}
                                    </p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 0 8px;">
                                    <p style="margin:0 0 4px;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                                      📍 Adresse
                                    </p>
                                    <p style="margin:0;font-size:16px;color:#0F172A;font-weight:700;">
                                      ${address || 'Non renseignée'}${city ? `, ${city}` : ''}
                                    </p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 0 8px;">
                                    <p style="margin:0 0 4px;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                                      📧 Email propriétaire
                                    </p>
                                    <p style="margin:0;font-size:16px;color:#0F172A;font-weight:700;">
                                      <a href="mailto:${email_proprietaire}" style="color:#C96745;text-decoration:none;">
                                        ${email_proprietaire || 'Non renseigné'}
                                      </a>
                                    </p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 0 8px;">
                                    <p style="margin:0 0 4px;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                                      🆔 ID du logement
                                    </p>
                                    <p style="margin:0;font-size:16px;color:#0F172A;font-weight:700;">
                                      ${id}
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <!-- Action Buttons -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding:8px 0 24px;">
                              <table cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding:0 8px;">
                                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com'}/moderation" 
                                       style="display:inline-block;background:linear-gradient(135deg,#C96745 0%,#D68E74 100%);color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(201,103,69,0.3);">
                                      Modérer maintenant →
                                    </a>
                                  </td>
                                  <td style="padding:0 8px;">
                                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com'}/logement/${id}" 
                                       style="display:inline-block;background:#FFFFFF;color:#C96745;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;border:2px solid #C96745;">
                                      Voir l'annonce
                                    </a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <!-- Info Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7ED;border-left:4px solid #F59E0B;border-radius:8px;">
                          <tr>
                            <td style="padding:16px;">
                              <p style="margin:0;font-size:13px;color:#92400E;line-height:1.6;">
                                ⚠️ <strong>Action requise :</strong> Ce logement a été validé par le propriétaire et attend votre modération pour être publié sur la plateforme.
                              </p>
                            </td>
                          </tr>
                        </table>

                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#F9FAFB;padding:24px;text-align:center;border-top:1px solid #E5E7EB;">
                        <p style="margin:0 0 8px;color:#64748B;font-size:13px;">
                          Notification automatique depuis Kokyage
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
      text: `
🏠 NOUVEAU LOGEMENT À MODÉRER

Titre: ${title || 'Non renseigné'}
Adresse: ${address || 'Non renseignée'}${city ? `, ${city}` : ''}
Email propriétaire: ${email_proprietaire || 'Non renseigné'}
ID: ${id}

Modérer maintenant: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com'}/moderation
      `
    };

    await resend.emails.send(emailContent);

    console.log('✅ Email de notification modération envoyé pour le logement:', id);

    return NextResponse.json({ 
      success: true,
      message: 'Notification modération envoyée' 
    });

  } catch (error) {
    console.error('❌ Erreur notification modération:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
