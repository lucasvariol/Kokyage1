import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const listing_ids = searchParams.get('listing_ids');

    if (!listing_ids) {
      return Response.json({ error: 'listing_ids requis' }, { status: 400 });
    }

    const idsArray = listing_ids.split(',').filter(Boolean);
    
    if (idsArray.length === 0) {
      return Response.json({ ratings: {} }, { status: 200 });
    }

    // Fetch ratings for multiple listings
    const { data, error } = await supabase
      .from('listing_ratings')
      .select('*')
      .in('listing_id', idsArray);

    if (error) {
      console.error('Fetch batch ratings error:', error);
      // If view doesn't exist, return empty ratings instead of error
      if (error.code === '42P01') { // Table/view doesn't exist
        return Response.json({ ratings: {} }, { status: 200 });
      }
      return Response.json({ error: 'Erreur lors de la récupération des notes' }, { status: 500 });
    }

    // Convert array to object keyed by listing_id
    const ratingsMap = {};
    (data || []).forEach(item => {
      ratingsMap[item.listing_id] = {
        review_count: item.review_count || 0,
        average_rating: item.average_rating || 0
      };
    });

    return Response.json({ ratings: ratingsMap }, { status: 200 });
  } catch (error) {
    console.error('Get batch ratings error:', error);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
