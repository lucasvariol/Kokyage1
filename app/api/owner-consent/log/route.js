import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      listingId,
      tenantId,
      ownerEmail,
      tenantFullName,
      listingAddress,
      infoAccuracyAccepted,
      ownerConsentAccepted,
      agreementText
    } = body;

    // Validation des données obligatoires
    if (!listingId || !tenantId || !ownerEmail || !tenantFullName || !listingAddress) {
      return Response.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      );
    }

    if (!infoAccuracyAccepted || !ownerConsentAccepted) {
      return Response.json(
        { success: false, error: 'Les accords doivent être acceptés' },
        { status: 400 }
      );
    }

    // Récupérer l'IP et le User-Agent pour la traçabilité
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Enregistrer l'accord dans la base de données
    const { data, error } = await supabaseAdmin
      .from('owner_consent_logs')
      .insert({
        listing_id: listingId,
        tenant_id: tenantId,
        owner_email: ownerEmail,
        tenant_full_name: tenantFullName,
        listing_address: listingAddress,
        info_accuracy_accepted: infoAccuracyAccepted,
        owner_consent_accepted: ownerConsentAccepted,
        ip_address: ip,
        user_agent: userAgent,
        consent_version: 'v1.0',
        agreement_text: agreementText,
        consent_accepted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'enregistrement de l\'accord:', error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data: {
        id: data.id,
        consentAcceptedAt: data.consent_accepted_at
      }
    });

  } catch (error) {
    console.error('Erreur API log-owner-consent:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
