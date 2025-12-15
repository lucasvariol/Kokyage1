import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const listing_id = searchParams.get('listing_id');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!listing_id) {
      return Response.json({ error: 'listing_id requis' }, { status: 400 });
    }

    // Fetch reviews (no join to user profiles to avoid schema dependency)
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        updated_at,
        user_id,
        reviewer_type
      `)
      .eq('listing_id', listing_id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reviewsError) {
      console.error('Fetch reviews error:', reviewsError);
      return Response.json({ error: 'Erreur lors de la récupération des avis' }, { status: 500 });
    }

    console.log(`📊 Reviews API - listing_id: ${listing_id}, total fetched: ${reviews?.length || 0}`);
    if (reviews && reviews.length > 0) {
      console.log('First review sample:', { 
        id: reviews[0].id, 
        reviewer_type: reviews[0].reviewer_type,
        is_published: reviews[0].is_published 
      });
    }

    // Filter to show only guest reviews (or legacy reviews without reviewer_type)
    // This prevents host-to-guest reviews from appearing on listing pages
    const guestReviews = (reviews || []).filter(r => 
      !r.reviewer_type || r.reviewer_type === 'guest'
    );

    console.log(`📊 After guest filter: ${guestReviews.length} reviews`);

    // Enrich with author's first name from auth metadata (best-effort)
    let enrichedReviews = guestReviews;
    if (enrichedReviews.length > 0) {
      const uniqueUserIds = [...new Set(enrichedReviews.map(r => r.user_id).filter(Boolean))];
      const nameMap = new Map();

      // Fetch names sequentially to avoid admin rate limits; small batch size (<=10)
      for (const uid of uniqueUserIds) {
        try {
          const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(uid);
          const meta = userResp?.user?.user_metadata || {};
          const full = meta.full_name || meta.name || '';
          const first = meta.prenom || meta.first_name || (full ? String(full).split(/\s+/)[0] : null);
          nameMap.set(uid, first || null);
        } catch (e) {
          // ignore per-user failures
          nameMap.set(uid, null);
        }
      }

      enrichedReviews = enrichedReviews.map(r => ({
        ...r,
        author_first_name: nameMap.get(r.user_id) || 'Voyageur'
      }));
    }

    // Rating summary (calculated from guest reviews to match what we display)
    const totalRating = guestReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const summaryData = {
      review_count: guestReviews.length,
      average_rating: guestReviews.length > 0
        ? Math.round((totalRating / guestReviews.length) * 10) / 10
        : 0
    };

    console.log(`✅ Returning: ${enrichedReviews.length} reviews, avg: ${summaryData.average_rating}`);

    return Response.json({
      reviews: enrichedReviews,
      summary: summaryData,
      has_more: reviews && reviews.length === limit
    }, { status: 200 });
  } catch (error) {
    console.error('Get reviews error:', error);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
