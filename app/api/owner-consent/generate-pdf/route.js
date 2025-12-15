import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { jsPDF } from 'jspdf';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérifier si c'est un appel interne avec SERVICE_ROLE_KEY
    const isServiceRole = token === process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Si ce n'est pas un appel de service, vérifier l'authentification utilisateur
    let userId = null;
    if (!isServiceRole) {
      const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token);
      if (userErr || !userRes?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = userRes.user.id;
    }

    const { listingId } = await request.json();
    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
    }

    // Récupérer le listing avec toutes les infos nécessaires
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Vérifier les permissions seulement si ce n'est pas un appel de service
    if (!isServiceRole && userId) {
      if (listing.owner_id !== userId && listing.id_proprietaire !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Récupérer les profils du propriétaire et du locataire
    const [ownerResult, tenantResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('full_name, name, prenom, nom, email')
        .eq('id', listing.id_proprietaire)
        .single(),
      supabaseAdmin
        .from('profiles')
        .select('full_name, name, prenom, nom, email')
        .eq('id', listing.owner_id)
        .single()
    ]);

    const ownerProfile = ownerResult.data;
    const tenantProfile = tenantResult.data;

    const ownerName = ownerProfile?.full_name || `${ownerProfile?.prenom || ''} ${ownerProfile?.nom || ''}`.trim() || ownerProfile?.name || ownerProfile?.email || 'Propriétaire';
    const tenantName = tenantProfile?.full_name || `${tenantProfile?.prenom || ''} ${tenantProfile?.nom || ''}`.trim() || tenantProfile?.name || tenantProfile?.email || 'Locataire principal';

    // Créer le PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let currentY = margin;

    // En-tête
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('KOKYAGE', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Accord de sous-location', pageWidth / 2, 25, { align: 'center' });

    currentY = 50;

    // Titre du document
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('AUTORISATION DE SOUS-LOCATION', margin, currentY);
    currentY += 15;

    // Statut de signature
    doc.setFillColor(236, 253, 245);
    doc.rect(margin, currentY, maxWidth, 15, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.rect(margin, currentY, maxWidth, 15);
    doc.setTextColor(6, 95, 70);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('✓ SIGNÉ NUMÉRIQUEMENT', margin + 5, currentY + 10);
    currentY += 25;

    // Informations du logement
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('LOGEMENT CONCERNÉ', margin, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Titre : ${listing.title || 'Non renseigné'}`, margin, currentY);
    currentY += 6;
    doc.text(`Adresse : ${listing.address || 'Non renseigné'}`, margin, currentY);
    currentY += 6;
    doc.text(`Ville : ${listing.city || 'Non renseigné'}`, margin, currentY);
    currentY += 6;
    doc.text(`Code postal : ${listing.postal_code || 'Non renseigné'}`, margin, currentY);
    currentY += 15;

    // Parties
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('PARTIES SIGNATAIRES', margin, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Le Propriétaire :', margin, currentY);
    currentY += 6;
    doc.setFont(undefined, 'normal');
    doc.text(ownerName, margin + 5, currentY);
    currentY += 6;
    doc.text(`Email : ${ownerProfile?.email || 'Non renseigné'}`, margin + 5, currentY);
    currentY += 10;

    doc.setFont(undefined, 'bold');
    doc.text('Le Locataire principal :', margin, currentY);
    currentY += 6;
    doc.setFont(undefined, 'normal');
    doc.text(tenantName, margin + 5, currentY);
    currentY += 6;
    doc.text(`Email : ${tenantProfile?.email || 'Non renseigné'}`, margin + 5, currentY);
    currentY += 15;

    // Termes de l'accord
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('TERMES DE L\'ACCORD', margin, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const termsText = `Le Propriétaire autorise expressément le Locataire principal à sous-louer le logement susmentionné via la plateforme Kokyage, dans le respect des conditions suivantes :

1. La sous-location s'effectue dans le cadre de locations de courte durée via la plateforme Kokyage.

2. Le Locataire principal s'engage à respecter le règlement intérieur de l'immeuble et à faire respecter ce règlement par les sous-locataires.

3. Le Locataire principal reste responsable des dégradations éventuelles causées par les sous-locataires.

4. Le Propriétaire conserve son droit de visite du logement avec un préavis raisonnable.

5. Cette autorisation est valable tant que le bail principal est en cours et peut être révoquée par le Propriétaire moyennant un préavis de 30 jours.`;

    const splitTerms = doc.splitTextToSize(termsText, maxWidth);
    doc.text(splitTerms, margin, currentY);
    currentY += splitTerms.length * 5 + 10;

    // Date et lieu de signature
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = margin;
    }

    const signatureDate = new Date(listing.owner_consent_date || listing.updated_at || new Date());
    const formattedDate = signatureDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('SIGNATURES', margin, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Fait à distance, le ${formattedDate}`, margin, currentY);
    currentY += 15;

    // Signatures numériques
    const col1X = margin;
    const col2X = pageWidth / 2 + 10;

    doc.setFillColor(248, 250, 252);
    doc.rect(col1X, currentY, maxWidth / 2 - 15, 30, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(col1X, currentY, maxWidth / 2 - 15, 30);
    doc.setFont(undefined, 'bold');
    doc.text('Le Propriétaire', col1X + 5, currentY + 10);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('Signature électronique', col1X + 5, currentY + 17);
    doc.text(ownerName, col1X + 5, currentY + 24);

    doc.setFillColor(248, 250, 252);
    doc.rect(col2X, currentY, maxWidth / 2 - 15, 30, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(col2X, currentY, maxWidth / 2 - 15, 30);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Le Locataire principal', col2X + 5, currentY + 10);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('Signature électronique', col2X + 5, currentY + 17);
    doc.text(tenantName, col2X + 5, currentY + 24);

    currentY += 40;

    // Pied de page légal
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFillColor(249, 250, 251);
    doc.rect(0, pageHeight - 35, pageWidth, 35, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);
    
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont(undefined, 'normal');
    doc.text('Ce document constitue une preuve de l\'accord entre les parties et a la même valeur qu\'une signature manuscrite', pageWidth / 2, pageHeight - 25, { align: 'center' });
    doc.text(`conformément aux articles 1366 et 1367 du Code civil.`, pageWidth / 2, pageHeight - 20, { align: 'center' });
    doc.text(`Document généré par Kokyage - ${new Date().toISOString()}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.text(`ID Document: ${listingId.substring(0, 8).toUpperCase()}`, pageWidth / 2, pageHeight - 7, { align: 'center' });

    // Générer le PDF en base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    // Sauvegarder dans la base de données
    const { error: updateError } = await supabaseAdmin
      .from('listings')
      .update({
        owner_consent_pdf: pdfBase64
      })
      .eq('id', listingId);

    if (updateError) {
      console.error('Erreur sauvegarde PDF:', updateError);
      return NextResponse.json({ error: 'Failed to save PDF' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      pdfBase64,
      message: 'PDF généré et sauvegardé'
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
