import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const listing_id = searchParams.get('listing_id');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!listing_id) {
      return Response.json({ error: 'listing_id requis' }, { status: 400 });
    }

    // Fetch reviews with user profile info
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        updated_at,
        user_id,
        profiles:user_id (
          nom,
          prenom
        )
      `)
      .eq('listing_id', listing_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reviewsError) {
      console.error('Fetch reviews error:', reviewsError);
      return Response.json({ error: 'Erreur lors de la récupération des avis' }, { status: 500 });
    }

    // Fetch rating summary
    const { data: summary, error: summaryError } = await supabase
      .from('listing_ratings')
      .select('*')
      .eq('listing_id', listing_id)
      .single();

    if (summaryError && summaryError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Fetch summary error:', summaryError);
    }

    return Response.json({
      reviews: reviews || [],
      summary: summary || { review_count: 0, average_rating: 0 },
      has_more: reviews && reviews.length === limit
    }, { status: 200 });
  } catch (error) {
    console.error('Get reviews error:', error);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
