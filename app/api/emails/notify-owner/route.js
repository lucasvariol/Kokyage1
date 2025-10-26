import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import crypto from 'crypto';

export async function POST(req) {
  try {
    console.log('📧 Email API called');
    
    // Vérifier que les clés Supabase sont présentes
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase credentials');
      return NextResponse.json({ 
        error: 'Server configuration error: Missing Supabase credentials' 
      }, { status: 500 });
    }
    
    // Vérification du body de la requête
    const body = await req.json();
    console.log('📝 Request body:', body);
    
    const { listingId, ownerEmail, title, address, city } = body;

    // Vérification des paramètres requis avec des messages plus précis
    if (!listingId) {
      console.log('❌ Missing listingId');
      return NextResponse.json({ error: 'listingId manquant' }, { status: 400 });
    }
    
    if (!ownerEmail) {
      console.log('❌ Missing ownerEmail');
      return NextResponse.json({ error: 'ownerEmail manquant' }, { status: 400 });
    }

    // MODE DÉVELOPPEMENT - Configuration via variables d'environnement
    const isDevelopment = process.env.EMAIL_DEV_MODE === 'true';
    const testEmail = process.env.EMAIL_TEST_ADDRESS || 'lucas.variol@gmail.com';
    const actualRecipient = isDevelopment ? testEmail : ownerEmail;
    
    console.log('� NODE_ENV:', process.env.NODE_ENV);
    console.log('🔧 Development mode:', isDevelopment);
    console.log('📬 Email will be sent to:', actualRecipient);
    console.log('🔧 Original recipient would be:', ownerEmail);

    // Générer un token unique pour la vérification
    const token = crypto.randomBytes(32).toString('hex');
    console.log('🔑 Generated token for owner verification');

    // Stocker le token dans la base de données
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expire dans 24h

    // Insérer le token dans pending_owner_verification
    console.log('💾 Inserting token into pending_owner_verification:', {
      email: ownerEmail,
      listing_id: listingId,
      token: token.substring(0, 10) + '...',
      expires_at: expiresAt.toISOString()
    });
    
    const { data: insertedData, error: tokenError } = await supabaseAdmin
      .from('pending_owner_verification')
      .insert({
        email: ownerEmail,
        listing_id: listingId,
        token: token,
        expires_at: expiresAt.toISOString()
      })
      .select();

    if (tokenError) {
      console.error('❌ FAILED to insert verification token');
      console.error('Error code:', tokenError.code);
      console.error('Error message:', tokenError.message);
      console.error('Error details:', tokenError.details);
      console.error('Error hint:', tokenError.hint);
      
      return NextResponse.json({ 
        error: 'Erreur lors de la création du token de vérification',
        details: tokenError.message 
      }, { status: 500 });
    }

    console.log('✅ Token stored successfully');
    console.log('   Inserted data:', insertedData);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const verifyUrl = `${appUrl}/verification-proprietaire/${token}`;

    const subject = 'Validation de votre logement — Kokyage';
    const html = `
      <div style="font-family: Inter, system-ui, -apple-system, sans-serif; line-height: 1.6; color: #222">
        ${isDevelopment ? `
        <div style="background: #fef3c7; padding: 16px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #f59e0b;">
          <h3 style="margin: 0; color: #92400e;">🧪 MODE TEST</h3>
          <p style="margin: 8px 0 0 0; color: #92400e;">
            Cet email était destiné à : <strong>${ownerEmail}</strong><br>
            En mode développement, il est envoyé à votre adresse de test.
          </p>
        </div>
        ` : ''}
        
        <h2 style="color:#C96745;margin:0 0 8px">🏠 Nouveau logement déclaré sur Kokyage</h2>
        <p>Bonjour,</p>
        <p>Un locataire a ajouté un logement sur Kokyage et vous a désigné comme propriétaire.</p>
        <ul>
          ${title ? `<li><strong>Logement:</strong> ${title}</li>` : ''}
          ${address ? `<li><strong>Adresse:</strong> ${address}${city ? `, ${city}` : ''}</li>` : ''}
        </ul>
        
        <p><strong>Pour valider votre propriété et gérer ce logement:</strong></p>
        <p>Cliquez sur le bouton ci-dessous pour créer votre compte ou vous connecter.</p>
        <p>
          <a href="${verifyUrl}"
             style="display:inline-block;padding:14px 24px;background:#C96745;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
            ✓ Confirmer ma propriété
          </a>
        </p>
        <p style="font-size:13px;color:#666;margin-top:16px">⏱ Ce lien expire dans 24 heures.</p>
        
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="font-size:13px;color:#888">
          <strong>Pas propriétaire?</strong> Si vous n'êtes pas concerné par ce logement, vous pouvez ignorer cet email en toute sécurité.
        </p>
      </div>
    `;

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM || 'Kokyage <contact@kokyage.com>';

    console.log('🔑 RESEND_API_KEY exists:', !!RESEND_API_KEY);
    console.log('📤 From address:', from);

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY manquant — email non envoyé.');
      return NextResponse.json({ ok: true, skipped: true });
    }

    console.log('📤 Sending email with Resend...');

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: actualRecipient,
        subject,
        html,
      }),
    });

    console.log('📬 Resend response status:', resp.status);

    if (!resp.ok) {
      const txt = await resp.text();
      console.error('❌ Resend error:', txt);
      return NextResponse.json({ error: 'Email provider error', details: txt }, { status: 502 });
    }

    const responseData = await resp.json();
    console.log('✅ Email sent successfully:', responseData);

    return NextResponse.json({ 
      ok: true, 
      data: responseData,
      testMode: isDevelopment,
      sentTo: actualRecipient,
      originalRecipient: ownerEmail
    });
  } catch (e) {
    console.error('💥 notify-owner error:', e);
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
  }
}
