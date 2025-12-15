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
      'CONCERNANT LE BIEN:',
      '',
      `Adresse: ${listing.address || ''}, ${listing.city || ''}`,
      `Type: ${listing.title || 'Logement'}`,
      `Prix par nuit: ${listing.price_per_night || 0}€`,
      ''
    ];

    infoLines.forEach(line => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 6;
    });

    // Clauses
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('CLAUSES DE L\'ACCORD:', margin, y);
    y += 8;

    const clauses = [
      {
        title: '1. Objet de l\'accord',
        text: 'Le Propriétaire autorise expressément le Locataire Principal à sous-louer le bien immobilier décrit ci-dessus via la plateforme Kokyage, conformément aux dispositions légales en vigueur.'
      },
      {
        title: '2. Durée et conditions',
        text: 'Cette autorisation est valable pour toute la durée de mise en ligne du bien sur la plateforme Kokyage. Le Locataire Principal s\'engage à respecter les conditions du bail principal et à ne pas dépasser la capacité d\'accueil autorisée.'
      },
      {
        title: '3. Responsabilités',
        text: 'Le Locataire Principal demeure responsable du bien et de son entretien. Il s\'engage à informer le Propriétaire de toute dégradation et à maintenir le bien en bon état.'
      },
      {
        title: '4. Répartition financière',
        text: 'Les revenus générés par la sous-location seront répartis conformément aux pourcentages définis sur la plateforme Kokyage. Le Propriétaire recevra sa part directement selon les modalités convenues.'
      },
      {
        title: '5. Résiliation',
        text: 'Le Propriétaire peut révoquer cette autorisation à tout moment en utilisant la fonctionnalité "Mettre en pause mon accord" sur la plateforme. La résiliation prendra effet dans un délai raisonnable permettant d\'honorer les réservations en cours.'
      }
    ];

    doc.setFont('helvetica', 'normal');
    clauses.forEach(clause => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(clause.title, margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(clause.text, maxWidth);
      lines.forEach(line => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 5;
      });
      y += 4;
    });

    // Signatures
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    y += 10;
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
      if (consentLog.owner_ip_address && consentLog.owner_ip_address !== 'unknown') {
        doc.text(`IP: ${consentLog.owner_ip_address}`, margin, y);
        y += 4;
      }
    }

    // Footer légal
    if (y > 250) {
      doc.addPage();
      y = 20;
    } else {
      y += 15;
    }

    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    const footerText = [
      '',
      'Ce document constitue une preuve de consentement électronique conforme aux articles 1366 et 1367 du Code civil français.',
      'La signature électronique a la même valeur juridique qu\'une signature manuscrite.',
      `Document généré automatiquement le ${new Date().toLocaleString('fr-FR')} par Kokyage.com`,
      `ID du bien: ${listingId}`
    ];

    footerText.forEach(line => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      const lines = doc.splitTextToSize(line, maxWidth);
      lines.forEach(l => {
        doc.text(l, margin, y);
        y += 4;
      });
    });

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
