import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      listingId,
      tenantId,
      tenantFullName,
      tenantEmail,
      ownerEmail,
      ownerFullName,
      listingAddress,
      infoAccuracyAccepted,
      ownerConsentAccepted,
      agreementText,
      signatureType = 'tenant' // 'tenant' ou 'owner'
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

    // SIGNATURE DU TENANT (création de l'annonce)
    if (signatureType === 'tenant') {
      if (!tenantId || !tenantFullName || !tenantEmail || !ownerEmail || !listingAddress) {
        return Response.json(
          { success: false, error: 'Données tenant manquantes' },
          { status: 400 }
        );
      }

      if (!infoAccuracyAccepted || !ownerConsentAccepted) {
        return Response.json(
          { success: false, error: 'Les accords doivent être acceptés' },
          { status: 400 }
        );
      }

      // Créer l'enregistrement avec la signature du tenant
      const { data, error } = await supabaseAdmin
        .from('owner_consent_logs')
        .insert({
          listing_id: listingId,
          tenant_id: tenantId,
          tenant_full_name: tenantFullName,
          tenant_email: tenantEmail,
          tenant_signed_at: new Date().toISOString(),
          tenant_ip_address: ip,
          tenant_user_agent: userAgent,
          owner_email: ownerEmail,
          listing_address: listingAddress,
          info_accuracy_accepted: infoAccuracyAccepted,
          owner_consent_accepted: ownerConsentAccepted,
          agreement_text: agreementText,
          consent_version: 'v1.0'
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur signature tenant:', error);
        return Response.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        data: {
          id: data.id,
          tenantSignedAt: data.tenant_signed_at,
          fullySigned: data.fully_signed
        }
      });
    }

    // SIGNATURE DU OWNER (validation propriétaire)
    if (signatureType === 'owner') {
      // Mettre à jour l'enregistrement avec la signature du owner
      const updateData = {
        owner_full_name: ownerFullName,
        owner_signed_at: new Date().toISOString(),
        owner_ip_address: ip,
        owner_user_agent: userAgent
      };
      
      // Mettre à jour le texte de l'accord si fourni
      if (agreementText) {
        updateData.agreement_text = agreementText;
        console.log('📝 Agreement text fourni, longueur:', agreementText.length);
      } else {
        console.log('⚠️ Pas d\'agreement text fourni');
      }
      
      console.log('🔄 Mise à jour owner pour listing:', listingId);
      console.log('📦 Données à mettre à jour:', Object.keys(updateData));
      
      const { data, error } = await supabaseAdmin
        .from('owner_consent_logs')
        .update(updateData)
        .eq('listing_id', listingId)
        .is('owner_signed_at', null) // Seulement si pas encore signé par owner
        .select()
        .single();

      if (error) {
        console.error('Erreur signature owner:', error);
        return Response.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      if (!data) {
        return Response.json(
          { success: false, error: 'Aucun accord à signer ou déjà signé' },
          { status: 404 }
        );
      }

      // Le PDF sera généré à la demande lors du premier clic sur "Relire l'accord"
      console.log('✅ Accord signé par le propriétaire. PDF sera généré à la demande.');

      return Response.json({
        success: true,
        data: {
          id: data.id,
          ownerSignedAt: data.owner_signed_at,
          fullySigned: data.fully_signed
        }
      });
    }

    return Response.json(
      { success: false, error: 'Type de signature invalide' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erreur API owner-consent:', error);
    return Response.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
