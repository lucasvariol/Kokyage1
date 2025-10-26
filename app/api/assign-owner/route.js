import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { token, userId } = body;

    console.log('🔄 Assigning owner with token:', token, 'userId:', userId);

    if (!token || !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Token et userId requis' 
      }, { status: 400 });
    }

    // Récupérer les informations du token
    const { data: verification, error: tokenError } = await supabase
      .from('pending_owner_verification')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !verification) {
      console.log('❌ Token invalid or expired:', tokenError);
      return NextResponse.json({ 
        success: false, 
        error: 'Token invalide ou expiré' 
      }, { status: 400 });
    }

    const listingId = verification.listing_id;
    console.log('📝 Updating listing:', listingId, 'with real owner:', userId);

    // Récupérer d'abord le listing pour garder l'owner_id original (le locataire principal)
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', listingId)
      .single();

    if (fetchError || !existingListing) {
      console.error('❌ Error fetching listing:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: 'Listing introuvable' 
      }, { status: 404 });
    }

    console.log('👤 Original owner_id (tenant):', existingListing.owner_id);
    console.log('🏠 Real owner (proprietaire):', userId);

    // Vérifier que le propriétaire et le locataire ne sont pas la même personne
    if (existingListing.owner_id === userId) {
      console.log('❌ Tentative de lier le même compte comme propriétaire et locataire');
      return NextResponse.json({ 
        success: false, 
        error: 'Vous ne pouvez pas être à la fois locataire et propriétaire du même logement. Veuillez utiliser un compte différent pour le propriétaire.' 
      }, { status: 400 });
    }

    // Mettre à jour seulement le id_proprietaire (on garde owner_id = locataire principal)
    const { error: updateError } = await supabase
      .from('listings')
      .update({ 
        id_proprietaire: userId,
        status: 'en attente validation modérateur'
      })
      .eq('id', listingId);

    if (updateError) {
      console.error('❌ Error updating listing:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Erreur lors de la mise à jour du listing',
        details: updateError.message 
      }, { status: 500 });
    }

    // Supprimer le token utilisé (pour éviter réutilisation)
    const { error: deleteError } = await supabase
      .from('pending_owner_verification')
      .delete()
      .eq('token', token);

    if (deleteError) {
      console.warn('⚠️ Warning: Could not delete used token:', deleteError);
      // On continue même si la suppression échoue
    } else {
      console.log('✅ Token deleted after use');
    }

    console.log('✅ Owner assigned successfully');

    return NextResponse.json({ 
      success: true,
      listingId: listingId,
      message: 'Propriétaire assigné avec succès'
    });

  } catch (e) {
    console.error('💥 assign-owner error:', e);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur serveur', 
      details: e.message 
    }, { status: 500 });
  }
}