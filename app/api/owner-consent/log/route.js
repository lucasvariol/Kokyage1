import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      listingId,
      ownerEmail,
      ownerFullName,
      listingAddress,
      agreementText
    } = body;

    // Validation listingId obligatoire
    if (!listingId) {
      return Response.json(
        { success: false, error: 'listingId manquant' },
        { status: 400 }
      );
    }

    // Capturer l'IP et le User-Agent pour traçabilité juridique
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // SIGNATURE DU OWNER (validation propriétaire)
    console.log('📝 Création enregistrement owner_consent_logs');
    
    const { data, error } = await supabaseAdmin
      .from('owner_consent_logs')
      .insert({
        listing_id: listingId,
        owner_email: ownerEmail,
        owner_full_name: ownerFullName,
        owner_signed_at: new Date().toISOString(),
        owner_ip_address: ip,
        owner_user_agent: userAgent,
        listing_address: listingAddress,
        agreement_text: agreementText,
        consent_version: 'v1.0'
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création signature owner:', error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Accord créé et signé par le propriétaire. PDF sera généré à la demande.');

    return Response.json({
      success: true,
      data: {
        id: data.id,
        ownerSignedAt: data.owner_signed_at
      }
    });

  } catch (error) {
    console.error('Erreur API owner-consent:', error);
    return Response.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
