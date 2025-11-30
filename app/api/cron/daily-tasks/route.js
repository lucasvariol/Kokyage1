import { NextResponse } from 'next/server';

/**
 * CRON principal qui orchestre toutes les tâches quotidiennes
 * Déclenché à 18h (envoi demandes d'avis + publication avis 14j+)
 * Route: GET /api/cron/daily-tasks
 */

export async function GET(request) {
  try {
    // Vérification du CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 CRON daily-tasks: Démarrage à 18h...');

    const results = {
      sendReviewRequests: null,
      publishReviews: null
    };

    // 1. Envoyer les demandes d'avis (réservations terminant aujourd'hui) - PRIORITAIRE
    try {
      console.log('📧 Exécution: Envoi demandes d\'avis (18h)...');
      const reviewRequestsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/cron/send-review-requests`, {
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        }
      });
      results.sendReviewRequests = await reviewRequestsResponse.json();
      console.log('✅ Envoi demandes avis terminé:', results.sendReviewRequests);
    } catch (err) {
      console.error('❌ Erreur envoi demandes avis:', err);
      results.sendReviewRequests = { error: err.message };
    }

    // 2. Publier les avis en attente (14+ jours)
    try {
      console.log('📝 Exécution: Publication des avis (14j+)...');
      const publishResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/cron/publish-pending-reviews`, {
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        }
      });
      results.publishReviews = await publishResponse.json();
      console.log('✅ Publication avis terminée:', results.publishReviews);
    } catch (err) {
      console.error('❌ Erreur publication avis:', err);
      results.publishReviews = { error: err.message };
    }

    console.log('✅ CRON daily-tasks: Terminé');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('❌ Erreur globale CRON daily-tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
