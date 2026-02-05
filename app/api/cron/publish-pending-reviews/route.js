import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * CRON pour publier automatiquement les avis après 14 jours
 * Déclenché quotidiennement
 * Route: GET /api/cron/publish-pending-reviews
 */

export async function GET(request) {
  try {
    // Vérification du CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📝 CRON: Publication des avis en attente...');

    // Calculer la date limite (14 jours avant aujourd'hui)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);
    const cutoffDate = fourteenDaysAgo.toISOString();

    console.log(`📅 Recherche des avis créés avant le ${cutoffDate}`);

    // Récupérer les avis non publiés créés il y a plus de 14 jours
    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        id,
        reservation_id,
        reviewer_type,
        created_at,
        reservations!inner (
          display_id
        )
      `)
      .eq('is_published', false)
      .lt('created_at', cutoffDate);

    if (error) {
      console.error('❌ Erreur récupération avis:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`📊 ${reviews?.length || 0} avis à publier`);

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun avis à publier',
        published: 0
      });
    }

    // Publier tous les avis
    const now = new Date().toISOString();
    const reviewIds = reviews.map(r => r.id);

    const { error: updateError } = await supabaseAdmin
      .from('reviews')
      .update({
        is_published: true,
        published_at: now
      })
      .in('id', reviewIds);

    if (updateError) {
      console.error('❌ Erreur publication avis:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`✅ ${reviewIds.length} avis publiés automatiquement`);

    // Grouper par réservation pour le résultat
    const reservationGroups = {};
    reviews.forEach(review => {
      const displayId = review.reservations?.display_id || review.reservation_id;
      if (!reservationGroups[displayId]) {
        reservationGroups[displayId] = {
          reservation_id: review.reservation_id,
          reviews: []
        };
      }
      reservationGroups[displayId].reviews.push({
        id: review.id,
        reviewer_type: review.reviewer_type,
        created_at: review.created_at
      });
    });

    return NextResponse.json({
      success: true,
      published: reviewIds.length,
      reservations: Object.keys(reservationGroups).length,
      details: reservationGroups
    });

  } catch (error) {
    console.error('❌ Erreur globale CRON publish-pending-reviews:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
