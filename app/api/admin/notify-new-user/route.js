import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, table, record, old_record } = body;

    // Vérifier que c'est bien une insertion dans profiles
    if (type !== 'INSERT' || table !== 'profiles') {
      return NextResponse.json({ received: true });
    }

    const { id, name, email, created_at } = record;

    // Email à l'admin
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@kokyage.com';

    const emailContent = {
      from: 'Kokyage <notifications@kokyage.com>',
      to: adminEmail,
      subject: '🎉 Nouvel utilisateur inscrit sur Kokyage',
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
                          🎉 Nouvel Utilisateur
                        </h1>
                        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">
                          Une nouvelle inscription sur Kokyage
                        </p>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding:32px 24px;">
                        
                        <!-- User Info Card -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:12px;margin-bottom:24px;">
                          <tr>
                            <td style="padding:20px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding:8px 0;">
                                    <p style="margin:0 0 4px;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                                      👤 Nom
                                    </p>
                                    <p style="margin:0;font-size:16px;color:#0F172A;font-weight:700;">
                                      ${name || 'Non renseigné'}
                                    </p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 0 8px;">
                                    <p style="margin:0 0 4px;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                                      📧 Email
                                    </p>
                                    <p style="margin:0;font-size:16px;color:#0F172A;font-weight:700;">
                                      <a href="mailto:${email}" style="color:#C96745;text-decoration:none;">
                                        ${email || 'Non renseigné'}
                                      </a>
                                    </p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 0 8px;">
                                    <p style="margin:0 0 4px;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                                      🆔 ID Utilisateur
                                    </p>
                                    <p style="margin:0;font-size:14px;color:#64748B;font-family:monospace;">
                                      ${id}
                                    </p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 0 0;">
                                    <p style="margin:0 0 4px;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                                      📅 Date d'inscription
                                    </p>
                                    <p style="margin:0;font-size:14px;color:#64748B;">
                                      ${new Date(created_at).toLocaleDateString('fr-FR', { 
                                        day: 'numeric', 
                                        month: 'long', 
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <!-- Action Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding:8px 0 24px;">
                              <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL}/project/${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || '_'}/auth/users" 
                                 style="display:inline-block;background:linear-gradient(135deg,#C96745 0%,#D68E74 100%);color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(201,103,69,0.3);">
                                Voir dans Supabase →
                              </a>
                            </td>
                          </tr>
                        </table>

                        <!-- Info Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#EFF6FF;border-left:4px solid #3B82F6;border-radius:8px;">
                          <tr>
                            <td style="padding:16px;">
                              <p style="margin:0;font-size:13px;color:#1E40AF;line-height:1.6;">
                                💡 <strong>Conseil :</strong> Surveillez l'activité des nouveaux utilisateurs et n'hésitez pas à les contacter pour les accompagner dans leurs premières réservations.
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
🎉 NOUVEL UTILISATEUR INSCRIT

Nom: ${name || 'Non renseigné'}
Email: ${email || 'Non renseigné'}
ID: ${id}
Date: ${new Date(created_at).toLocaleString('fr-FR')}

Voir dans Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}
      `
    };

    await resend.emails.send(emailContent);

    console.log('✅ Email de notification envoyé pour le nouvel utilisateur:', email);

    return NextResponse.json({ 
      success: true,
      message: 'Notification envoyée' 
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la notification:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
