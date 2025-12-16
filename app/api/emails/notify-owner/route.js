import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import crypto from 'crypto';
import { ownerVerificationTemplate } from '@/email-templates/owner-verification';

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

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kokyage.com';
    const verifyUrl = `${appUrl}/verification-proprietaire/${token}`;

    // Get tenant full name (prénom nom) to personalize the email
    let tenantFullName = null;
    try {
      const { data: listing, error: listingErr } = await supabaseAdmin
        .from('listings')
        .select('owner_id')
        .eq('id', listingId)
        .maybeSingle();

      if (listingErr) throw listingErr;

      const tenantId = listing?.owner_id;
      if (tenantId) {
        const { data: tenantProfile, error: tenantProfileErr } = await supabaseAdmin
          .from('profiles')
          .select('name')
          .eq('id', tenantId)
          .maybeSingle();
        if (tenantProfileErr) throw tenantProfileErr;

        tenantFullName = tenantProfile?.name?.trim?.() || null;

        if (!tenantFullName) {
          const { data: tenantUserData, error: tenantUserError } = await supabaseAdmin.auth.admin.getUserById(tenantId);
          if (tenantUserError) throw tenantUserError;
          const tenantUser = tenantUserData?.user;
          tenantFullName = tenantUser?.user_metadata?.full_name
            || tenantUser?.user_metadata?.name
            || null;
          tenantFullName = tenantFullName?.trim?.() || null;
        }
      }
    } catch (nameErr) {
      console.warn('⚠️ Could not resolve tenantFullName for owner verification email', nameErr?.message || nameErr);
    }

    const subject = ownerVerificationTemplate.subject;
    const html = ownerVerificationTemplate.getHtml({
      ownerEmail,
      title,
      address,
      city,
      verifyUrl,
      isDevelopment,
      tenantFullName
    });

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
