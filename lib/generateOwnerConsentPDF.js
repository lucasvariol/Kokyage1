import { jsPDF } from 'jspdf';
import { supabaseAdmin } from './supabaseAdmin';

/**
 * Traite une ligne de markdown avec gras (**text**) et liens [text](url)
 * Retourne un tableau de segments avec leur type et texte
 */
function parseMarkdownSegments(line) {
  const segments = [];
  let currentIndex = 0;
  const regex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let match;
  
  while ((match = regex.exec(line)) !== null) {
    if (match.index > currentIndex) {
      segments.push({
        type: 'normal',
        text: line.substring(currentIndex, match.index)
      });
    }
    
    const matchedText = match[0];
    
    if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
      segments.push({
        type: 'bold',
        text: matchedText.substring(2, matchedText.length - 2)
      });
    } else if (matchedText.startsWith('[')) {
      const linkMatch = matchedText.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        segments.push({
          type: 'link',
          text: linkMatch[1],
          url: linkMatch[2]
        });
      }
    }
    
    currentIndex = match.index + matchedText.length;
  }
  
  if (currentIndex < line.length) {
    segments.push({
      type: 'normal',
      text: line.substring(currentIndex)
    });
  }
  
  return segments.length > 0 ? segments : [{ type: 'normal', text: line }];
}

/**
 * Rend une ligne avec segments markdown en gérant les retours à la ligne
 */
function renderMarkdownLine(doc, line, margin, y, maxWidth, pageWidth) {
  const segments = parseMarkdownSegments(line);
  let currentY = y;
  let currentX = margin;
  
  segments.forEach(segment => {
    const words = segment.text.split(' ');
    
    words.forEach((word, wordIndex) => {
      // Ajouter espace sauf pour le premier mot
      const textToRender = wordIndex > 0 ? ' ' + word : word;
      
      // Calculer largeur selon le type
      if (segment.type === 'bold') {
        doc.setFont('helvetica', 'bold');
      }
      const textWidth = doc.getTextWidth(textToRender);
      doc.setFont('helvetica', 'normal');
      
      // Retour à la ligne si déborde
      if (currentX + textWidth > pageWidth - margin && currentX > margin) {
        currentX = margin;
        currentY += 5;
        
        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }
      }
      
      // Rendre le texte
      if (segment.type === 'bold') {
        doc.setFont('helvetica', 'bold');
        doc.text(textToRender, currentX, currentY);
        doc.setFont('helvetica', 'normal');
      } else if (segment.type === 'link') {
        doc.setTextColor(215, 144, 119);
        const url = segment.url.startsWith('http') ? segment.url : `https://kokyage.com${segment.url}`;
        doc.textWithLink(textToRender, currentX, currentY, { url });
        doc.setTextColor(0, 0, 0);
      } else {
        doc.text(textToRender, currentX, currentY);
      }
      
      currentX += textWidth;
    });
  });
  
  return { newY: currentY + 5 };
}

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
    doc.text('SIGNE NUMERIQUEMENT', pageWidth / 2, y + 10, { align: 'center' });
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

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Utiliser le texte réel validé par le propriétaire
    const agreementText = consentLog?.agreement_text || 'Texte de l\'accord non disponible';
    
    // Parser le markdown pour une belle mise en page
    const lines = agreementText.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Nouvelle page si nécessaire
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      // Ligne vide
      if (trimmedLine === '') {
        y += 4;
        return;
      }
      
      // Titre H1 (# )
      if (trimmedLine.startsWith('# ')) {
        const titleText = trimmedLine.substring(2);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(titleText, pageWidth / 2, y, { align: 'center' });
        y += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        return;
      }
      
      // Titre H2 (## )
      if (trimmedLine.startsWith('## ')) {
        const titleText = trimmedLine.substring(3);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(titleText, margin, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        return;
      }
      
      // Traiter le texte avec gras et liens
      const processedText = renderMarkdownLine(doc, trimmedLine, margin, y, maxWidth, pageWidth);
      y = processedText.newY;
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
