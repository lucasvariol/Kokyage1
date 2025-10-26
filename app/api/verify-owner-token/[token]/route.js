import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request, { params }) {
  try {
    const { token } = params;
    
    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token manquant' }, { status: 400 });
    }

    console.log('🔍 Verifying token:', token);

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

    console.log('📊 Query result:', { verification, error });

    if (error || !verification) {
      console.log('❌ Token not found or error:', error);
      return NextResponse.json({ valid: false, error: 'Token invalide ou expiré' }, { status: 404 });
    }

    console.log('✅ Token valid for listing:', verification.listing_id);

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
    console.error('💥 verify-owner-token error:', e);
    return NextResponse.json({ 
      valid: false, 
      error: 'Erreur serveur', 
      details: e.message 
    }, { status: 500 });
  }
}