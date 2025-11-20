import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ isAdmin: false, error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Vérifier le token et récupérer l'utilisateur
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return Response.json({ isAdmin: false, error: 'Invalid token' }, { status: 401 });
    }

    // Vérifier si l'utilisateur est le PLATFORM_USER_ID
    const platformUserId = process.env.PLATFORM_USER_ID;
    const isAdmin = user.id === platformUserId;

    return Response.json({ isAdmin, userId: user.id });
    
  } catch (error) {
    console.error('Error checking admin status:', error);
    return Response.json({ isAdmin: false, error: error.message }, { status: 500 });
  }
}
