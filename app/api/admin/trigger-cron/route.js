import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Vérifier que l'utilisateur est admin (PLATFORM_USER_ID)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Vérifier le token Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return Response.json({ error: 'Session invalide' }, { status: 401 });
    }

    // Vérifier que c'est l'admin (PLATFORM_USER_ID)
    const platformUserId = process.env.NEXT_PUBLIC_PLATFORM_USER_ID;
    if (user.id !== platformUserId) {
      return Response.json({ error: 'Accès refusé - réservé aux administrateurs' }, { status: 403 });
    }

    // Déclencher le CRON en utilisant le CRON_SECRET
    const cronUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/cron/process-payments`;
    
    console.log('🔐 Admin déclenchement CRON par:', user.email);
    
    const response = await fetch(cronUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur CRON');
    }

    console.log('✅ CRON déclenché avec succès');

    return Response.json({
      success: true,
      message: 'CRON déclenché avec succès',
      data
    });

  } catch (error) {
    console.error('❌ Erreur déclenchement CRON:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
