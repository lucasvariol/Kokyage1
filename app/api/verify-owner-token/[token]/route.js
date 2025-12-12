import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';

export async function GET(request, { params }) {
  try {
    const { token } = params;
    
    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token manquant' }, { status: 400 });
    }

    logger.info('Verifying owner token (masked)', { token });

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
      .gt('expires_at', new Date().toISOString())
      .single();

    logger.debug('Owner token query finished', {
      found: Boolean(verification),
      error: error?.message,
    });

    if (error || !verification) {
      logger.warn('Owner token invalid or expired', { error: error?.message });
      return NextResponse.json({ valid: false, error: 'Token invalide ou expiré' }, { status: 404 });
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