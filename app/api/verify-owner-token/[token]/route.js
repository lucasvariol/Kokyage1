import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import logger from '@/lib/logger';

export async function GET(request, { params }) {
  try {
    const { token } = params;
    
    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token manquant' }, { status: 400 });
    }

    console.log('🔍 Verifying owner token:', token.substring(0, 10) + '...');
    const now = new Date().toISOString();
    console.log('📅 Current time:', now);

    // Chercher le token dans pending_owner_verification
    const { data: verification, error } = await supabaseAdmin
      .from('pending_owner_verification')
      .select(`
        *,
        listings (
          id,
          title,
          address,
          city,
          owner_id
        )
      `)
      .eq('token', token)
      .single();

    console.log('📊 Token lookup result:', {
      found: Boolean(verification),
      error: error?.code,
      errorMessage: error?.message,
      expiresAt: verification?.expires_at,
      isExpired: verification ? new Date(verification.expires_at) < new Date() : null
    });

    if (error || !verification) {
      console.error('❌ Token invalid or not found:', error?.message);
      return NextResponse.json({ valid: false, error: 'Token invalide ou expiré' }, { status: 404 });
    }

    // Vérifier manuellement l'expiration
    if (new Date(verification.expires_at) < new Date()) {
      console.error('⏰ Token expired:', verification.expires_at);
      return NextResponse.json({ valid: false, error: 'Token expiré' }, { status: 404 });
    }

    logger.info('Owner token valid', { listingId: verification.listing_id });

    const listingData = verification.listings;
    const email = verification.email;
    const listingId = verification.listing_id;

    // Optionnel: récupérer le profil du locataire principal (créateur du listing)
    let tenant = null;
    if (listingData?.owner_id) {
      const { data: tenantProfile } = await supabaseAdmin
        .from('profiles')
        .select('id,name')
        .eq('id', listingData.owner_id)
        .maybeSingle();
      if (tenantProfile) tenant = tenantProfile;
    }

    return NextResponse.json({ 
      valid: true,
      email: email,
      listing: {
        id: listingData.id,
        title: listingData.title,
        address: listingData.address,
        city: listingData.city
      },
      tenant
    });

  } catch (e) {
    logger.error('verify-owner-token error', { error: e?.message });
    return NextResponse.json({ 
      valid: false, 
      error: 'Erreur serveur', 
      details: e.message 
    }, { status: 500 });
  }
}