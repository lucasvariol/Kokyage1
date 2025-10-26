import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { ownerVerificationConfirmedTemplate } from '@/email-templates/owner-verification-confirmed';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json(
        { error: 'listingId manquant' },
        { status: 400 }
      );
    }

    // Récupérer les infos du logement avec le propriétaire (owner_id) et son email
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select(`
        id,
        title,
        city,
        owner_id,
        id_proprietaire,
        email_proprietaire
      `)
      .eq('id', listingId)
      .single();

    console.log('📊 Listing récupéré:', listing);
    console.log('🔍 owner_id:', listing?.owner_id);

    if (listingError || !listing) {
      console.error('❌ Erreur récupération listing:', listingError);
      return NextResponse.json(
        { error: 'Logement introuvable' },
        { status: 404 }
      );
    }

    if (!listing.owner_id) {
      console.error('❌ Le listing n\'a pas d\'owner_id');
      return NextResponse.json(
        { error: 'Le logement n\'a pas encore de propriétaire assigné' },
        { status: 400 }
      );
    }

    // Récupérer le profil du propriétaire du logement (owner_id)
    console.log('🔍 Recherche du profil pour owner_id:', listing.owner_id);
    const { data: ownerProfile, error: ownerError } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('id', listing.owner_id)
      .maybeSingle();

    if (ownerError) {
      console.warn('⚠️ Erreur récupération profile owner (non bloquant):', ownerError);
    }

    console.log('👤 Profil owner récupéré:', ownerProfile);

    // Récupérer l'utilisateur dans auth (pour l'email)
    const { data: ownerUserData, error: ownerUserError } = await supabaseAdmin.auth.admin.getUserById(listing.owner_id);

    if (ownerUserError || !ownerUserData?.user) {
      console.error('❌ Impossible de récupérer l\'utilisateur owner:', ownerUserError);
      return NextResponse.json(
        { error: 'Utilisateur propriétaire introuvable', details: ownerUserError },
        { status: 404 }
      );
    }

    const ownerEmail = ownerUserData.user.email;

    if (!ownerEmail) {
      console.error('❌ Aucun email trouvé pour owner_id:', listing.owner_id);
      return NextResponse.json(
        { error: 'Email propriétaire introuvable' },
        { status: 400 }
      );
    }

    const rawOwnerName = ownerProfile?.name
      || ownerUserData.user.user_metadata?.full_name
      || ownerUserData.user.email;

    const ownerName = rawOwnerName
      ? rawOwnerName.trim().split(/\s+/)[0]
      : 'Hôte';

    // Récupérer le nom du propriétaire réel (id_proprietaire)
    let proprietaireName = 'Propriétaire';
    if (listing.id_proprietaire) {
      const { data: proprietaireProfile } = await supabaseAdmin
        .from('profiles')
        .select('name')
        .eq('id', listing.id_proprietaire)
        .maybeSingle();

      if (proprietaireProfile?.name) {
        proprietaireName = proprietaireProfile.name;
      } else if (listing.email_proprietaire) {
        proprietaireName = listing.email_proprietaire.split('@')[0];
      }
    } else if (listing.email_proprietaire) {
      proprietaireName = listing.email_proprietaire.split('@')[0];
    }

    // Préparer les données pour le template
    const emailData = {
      ownerName,
      listingTitle: listing.title,
      listingCity: listing.city,
      proprietaireName,
      verificationDate: new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    };

    console.log('📧 Tentative d\'envoi email à:', ownerEmail);
    console.log('📋 Données email:', emailData);

    // Envoyer l'email au propriétaire du logement (owner_id)
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: process.env.MAIL_FROM || 'Kokyage <contact@kokyage.com>',
      to: ownerEmail,
      subject: ownerVerificationConfirmedTemplate.subject,
      html: ownerVerificationConfirmedTemplate.getHtml(emailData),
      text: ownerVerificationConfirmedTemplate.getText(emailData),
    });

    if (emailError) {
      console.error('❌ Erreur envoi email:', emailError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email', details: emailError },
        { status: 500 }
      );
    }

    console.log('✅ Email de confirmation envoyé:', emailResult);

    return NextResponse.json({
      success: true,
      message: 'Email de confirmation envoyé',
      emailId: emailResult.id
    });

  } catch (error) {
    console.error('Erreur dans /api/emails/owner-verification-confirmed:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
