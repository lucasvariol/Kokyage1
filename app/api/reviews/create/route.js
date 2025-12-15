import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import logger from '@/lib/logger';
import { reservationIdSchema } from '@/lib/validators';

// Schéma spécifique pour cette API (avec reviewerType)
const createReviewWithTypeSchema = z.object({
  reservationId: reservationIdSchema,
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.preprocess(
    (val) => {
      if (val === null || val === undefined) return '';
      if (typeof val !== 'string') return val;
      return val.trim();
    },
    z.string().min(20).max(2000)
  ),
  reviewerType: z.enum(['guest', 'host']),
  cleanliness: z.number().int().min(1).max(5).optional(),
  accuracy: z.number().int().min(1).max(5).optional(),
  communication: z.number().int().min(1).max(5).optional(),
  location: z.number().int().min(1).max(5).optional(),
  checkin: z.number().int().min(1).max(5).optional(),
  value: z.number().int().min(1).max(5).optional(),
});

/**
 * API pour créer un avis (review)
 * POST /api/reviews/create
 * 
 * Body: {
 *   reservationId: number,
 *   rating: 1-5,
 *   comment: string,
 *   reviewerType: 'guest' | 'host'
 * }
 */

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validation sécurisée avec Zod
    const result = createReviewWithTypeSchema.safeParse(body);
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const errors = issues.map((issue) => ({
        field: Array.isArray(issue.path) ? issue.path.join('.') : 'body',
        message: issue.message,
      }));
      logger.warn('Invalid review data', { errors });
      return NextResponse.json(
        { error: errors[0].message, errors },
        { status: 400 }
      );
    }

    const { reservationId, rating, comment, reviewerType, cleanliness, accuracy, communication, location, checkin, value } = result.data;
    logger.api('POST', '/api/reviews/create', { reservationId, rating, reviewerType });

    // Récupérer la réservation
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .select('id, listing_id, user_id, guest_id, host_id, date_depart, created_at')
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: 'Réservation introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que le délai de 14 jours n'est pas dépassé
    const departDate = new Date(reservation.date_depart);
    const today = new Date();
    const daysSinceDeparture = Math.floor((today - departDate) / (1000 * 60 * 60 * 24));

    if (daysSinceDeparture > 14) {
      return NextResponse.json(
        { error: 'Le délai de 14 jours pour laisser un avis est dépassé' },
        { status: 400 }
      );
    }

    // Déterminer le reviewer et le reviewee
    let reviewerId, revieweeId;
    // Toujours associer l'avis à un logement (utile si la colonne est NOT NULL)
    const listingId = reservation.listing_id;

    if (reviewerType === 'guest') {
      // Le voyageur note l'hôte et le logement
      reviewerId = reservation.guest_id || reservation.user_id;
      revieweeId = reservation.host_id;
    } else {
      // L'hôte note le voyageur (on garde listing_id mais on filtrera côté public)
      reviewerId = reservation.host_id;
      revieweeId = reservation.guest_id || reservation.user_id;
    }

    // Vérifier qu'un avis n'existe pas déjà pour cette réservation par ce reviewer
    const { data: existingReview } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('reservation_id', reservationId)
      .eq('user_id', reviewerId)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'Vous avez déjà laissé un avis pour cette réservation' },
        { status: 400 }
      );
    }

    // Validation finale avant insert
    if (!reservationId || !listingId || !reviewerId || !revieweeId) {
      console.error('❌ Champs manquants:', { reservationId, listingId, reviewerId, revieweeId });
      return NextResponse.json(
        { error: 'Données incomplètes pour créer l\'avis' },
        { status: 400 }
      );
    }

    // Créer l'avis (non publié par défaut)
    const reviewData = {
      reservation_id: reservationId,
      listing_id: listingId,
      user_id: reviewerId,
      reviewee_id: revieweeId,
      reviewer_type: reviewerType,
      rating,
      comment: comment || null,
      is_published: false
    };

    console.log('📝 Tentative création avis:', { ...reviewData, comment: comment ? '(présent)' : null });

    const { data: newReview, error: createError } = await supabaseAdmin
      .from('reviews')
      .insert(reviewData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erreur création avis (Supabase):', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        reviewData: { ...reviewData, comment: comment ? '(masqué)' : null }
      });
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'avis', details: createError.message },
        { status: 500 }
      );
    }

    console.log('✅ Avis créé:', newReview.id);

    // Vérifier si les deux parties ont laissé un avis
    await checkAndPublishReviews(reservationId);

    return NextResponse.json({
      success: true,
      review: newReview,
      message: 'Avis enregistré avec succès. Il sera publié une fois que l\'autre partie aura également laissé son avis, ou après 14 jours.'
    });

  } catch (error) {
    console.error('❌ Erreur API reviews/create:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Fonction pour vérifier et publier les avis si les deux parties ont noté
 */
async function checkAndPublishReviews(reservationId) {
  try {
    // Récupérer tous les avis non publiés pour cette réservation
    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('id, reviewer_type, created_at')
      .eq('reservation_id', reservationId)
      .eq('is_published', false);

    if (error) {
      console.error('❌ Erreur récupération avis:', error);
      return;
    }

    if (!reviews || reviews.length < 2) {
      console.log('ℹ️  Pas encore les deux avis pour la réservation', reservationId);
      return;
    }

    // Vérifier qu'on a bien un avis guest et un avis host
    const hasGuestReview = reviews.some(r => r.reviewer_type === 'guest');
    const hasHostReview = reviews.some(r => r.reviewer_type === 'host');

    if (hasGuestReview && hasHostReview) {
      // Publier les deux avis
      const now = new Date().toISOString();
      const { error: updateError } = await supabaseAdmin
        .from('reviews')
        .update({
          is_published: true,
          published_at: now
        })
        .eq('reservation_id', reservationId)
        .eq('is_published', false);

      if (updateError) {
        console.error('❌ Erreur publication avis:', updateError);
      } else {
        console.log('✅ Avis publiés pour la réservation', reservationId);
      }
    }
  } catch (err) {
    console.error('❌ Erreur checkAndPublishReviews:', err);
  }
}
