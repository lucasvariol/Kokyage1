import { jsPDF } from 'jspdf';
import { supabaseAdmin } from './supabaseAdmin';

/**
 * Génère un PDF de l'accord de sous-location et le sauvegarde dans la DB
 * @param {string} listingId - ID du listing
 * @returns {Promise<{success: boolean, pdfBase64?: string, error?: string}>}
 */
export async function generateOwnerConsentPDF(listingId) {
  try {
    console.log('📄 [generateOwnerConsentPDF] Début génération pour listing:', listingId);

    // Récupérer le listing
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      console.error('❌ Listing non trouvé:', listingError);
      return { success: false, error: 'Listing not found' };
    }

    // Récupérer les profils
    const { data: ownerProfile } = await supabaseAdmin
      .from('profiles')
      .select('name, full_name')
      .eq('id', listing.id_proprietaire || listing.owner_id)
      .maybeSingle();

    const { data: tenantProfile } = await supabaseAdmin
      .from('profiles')
      .select('name, full_name')
      .eq('id', listing.owner_id)
      .maybeSingle();

    // Récupérer le log de consentement
    const { data: consentLog } = await supabaseAdmin
      .from('owner_consent_logs')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('📋 Consent log récupéré:', {
      found: Boolean(consentLog),
      hasAgreementText: Boolean(consentLog?.agreement_text),
      textLength: consentLog?.agreement_text?.length || 0
    });

    // Récupérer le token de vérification propriétaire
    const { data: verificationToken } = await supabaseAdmin
      .from('pending_owner_verification')
      .select('token, created_at')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const ownerName = ownerProfile?.name || ownerProfile?.full_name || listing.email_proprietaire || 'Propriétaire';
    const tenantName = tenantProfile?.name || tenantProfile?.full_name || 'Locataire';

    // Créer le PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let y = 20;

    // En-tête avec badge "SIGNÉ NUMÉRIQUEMENT"
    doc.setFillColor(34, 197, 94);
    doc.rect(margin, y, maxWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ SIGNÉ NUMÉRIQUEMENT', pageWidth / 2, y + 10, { align: 'center' });
    y += 25;

    // Titre
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ACCORD DE SOUS-LOCATION', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Informations parties
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const infoLines = [
      '',
      'PARTIES:',
      '',
      `Le Propriétaire: ${ownerName}`,
      `Email: ${listing.email_proprietaire || 'Non renseigné'}`,
      '',
      `Le Locataire Principal: ${tenantName}`,
      `Email: ${consentLog?.tenant_email || 'Non renseigné'}`,
      '',
    ];

    infoLines.forEach(line => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 6;
    });

    // Texte de l'accord validé par le propriétaire
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('ACCORD DE CONSENTEMENT:', margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Utiliser le texte réel validé par le propriétaire
    const agreementText = consentLog?.agreement_text || 'Texte de l\'accord non disponible';
    const agreementLines = doc.splitTextToSize(agreementText, maxWidth);
    
    agreementLines.forEach(line => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 5;
    });
    
    y += 10;

    // Signatures
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.text('SIGNATURES:', margin, y);
    y += 10;

    // Signature locataire
    doc.setFont('helvetica', 'normal');
    doc.text(`Locataire Principal: ${tenantName}`, margin, y);
    y += 5;
    if (consentLog?.tenant_signed_at) {
      doc.setFontSize(8);
      doc.text(`Signé le: ${new Date(consentLog.tenant_signed_at).toLocaleString('fr-FR')}`, margin, y);
      y += 4;
      if (consentLog.tenant_ip_address && consentLog.tenant_ip_address !== 'unknown') {
        doc.text(`IP: ${consentLog.tenant_ip_address}`, margin, y);
        y += 4;
      }
    }

    y += 6;

    // Signature propriétaire
    doc.setFontSize(10);
    doc.text(`Propriétaire: ${ownerName}`, margin, y);
    y += 5;
    if (consentLog?.owner_signed_at) {
      doc.setFontSize(8);
      doc.text(`Signé le: ${new Date(consentLog.owner_signed_at).toLocaleString('fr-FR')}`, margin, y);
      y += 4;
      if (verificationToken?.token) {
        doc.text(`Token de signature: ${verificationToken.token}`, margin, y);
        y += 4;
      }
    }

    // Convertir en base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    // Sauvegarder dans la DB
    const { error: updateError } = await supabaseAdmin
      .from('listings')
      .update({ owner_consent_pdf: pdfBase64 })
      .eq('id', listingId);

    if (updateError) {
      console.error('❌ Erreur sauvegarde PDF:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('✅ PDF généré et sauvegardé avec succès pour listing:', listingId);
    return { success: true, pdfBase64 };

  } catch (error) {
    console.error('❌ [generateOwnerConsentPDF] Erreur:', error);
    return { success: false, error: error.message };
  }
}
