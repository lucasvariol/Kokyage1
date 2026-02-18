-- Configuration complète pour activer les notifications email

-- ÉTAPE 1: Activer l'extension pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ÉTAPE 2: Mettre à jour la fonction avec l'URL codée en dur
CREATE OR REPLACE FUNCTION notify_new_user()
RETURNS trigger AS $$
DECLARE
  request_id bigint;
  payload jsonb;
  api_url text;
BEGIN
  -- URL de l'API en dur (Supabase ne permet pas ALTER DATABASE)
  api_url := 'https://kokyage.com';
  
  -- Construire le payload avec les informations de l'utilisateur
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', NULL
  );

  -- Appeler l'API via http request
  BEGIN
    -- Vérifier que pg_net est disponible
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
      RAISE NOTICE 'pg_net extension not installed, skipping notification';
      RETURN NEW;
    END IF;
    
    -- Appeler l'API
    SELECT net.http_post(
      url := api_url || '/api/admin/notify-new-user',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := payload
    ) INTO request_id;
    
    RAISE NOTICE 'New user notification sent with request_id: %', request_id;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log l'erreur mais ne pas bloquer l'insertion
      RAISE WARNING 'Failed to send new user notification: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ÉTAPE 3: Vérifier la configuration
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') 
    THEN '✅ pg_net installé'
    ELSE '❌ pg_net non installé'
  END as status_pg_net,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_new_user') 
    THEN '✅ Fonction notify_new_user existe'
    ELSE '❌ Fonction manquante'
  END as status_function;

-- ÉTAPE 4: Tester avec un appel HTTP de test (optionnel)
-- Décommentez les lignes suivantes pour tester
/*
SELECT net.http_post(
  url := current_setting('app.api_url', true) || '/api/admin/notify-new-user',
  headers := jsonb_build_object('Content-Type', 'application/json'),
  body := jsonb_build_object(
    'type', 'INSERT',
    'table', 'profiles',
    'record', jsonb_build_object(
      'id', 'test-' || gen_random_uuid()::text,
      'name', 'Utilisateur Test',
      'email', 'test@example.com',
      'created_at', now()
    ),
    'old_record', null
  )
) as request_id;
*/

-- NOTES:
-- 1. Après avoir exécuté ce script, les nouvelles inscriptions déclencheront des emails
-- 2. Vérifiez que ADMIN_EMAIL est configuré dans vos variables d'environnement Vercel
-- 3. Vérifiez que RESEND_API_KEY est configuré et valide
