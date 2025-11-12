import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req) {
  try {
    const body = await req.json();
    const { listing_id, rating, comment } = body;

    // Get user from session
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return Response.json({ error: 'Session invalide' }, { status: 401 });
    }

    // Validate inputs
    if (!listing_id || !rating) {
      return Response.json({ error: 'listing_id et rating requis' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return Response.json({ error: 'La note doit être entre 1 et 5' }, { status: 400 });
    }

    // Check if listing exists
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return Response.json({ error: 'Logement introuvable' }, { status: 404 });
    }

    // Insert or update review (upsert)
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .upsert({
        listing_id,
        user_id: user.id,
        rating,
        comment: comment || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'listing_id,user_id'
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Review error:', reviewError);
      return Response.json({ error: 'Erreur lors de la création de l\'avis' }, { status: 500 });
    }

    return Response.json({ success: true, review }, { status: 200 });
  } catch (error) {
    console.error('Submit review error:', error);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
