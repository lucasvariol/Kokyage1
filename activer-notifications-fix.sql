-- SOLUTION: Activer les notifications sans ALTER DATABASE
-- Cette version code l'URL directement dans la fonction

-- Remplacer la fonction avec l'URL codée en dur
CREATE OR REPLACE FUNCTION notify_new_user()
RETURNS trigger AS $$
DECLARE
  request_id bigint;
  payload jsonb;
  api_url text;
BEGIN
  -- URL de l'API en dur (plus besoin de current_setting)
  api_url := 'https://kokyage.com';
  
  -- Construire le payload avec les informations de l'utilisateur
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', NULL
  );

  -- Appeler l'API via http request (nécessite l'extension pg_net)
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

-- Activer l'extension pg_net si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Vérifier que tout est OK
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

-- NOTES:
-- ✅ Plus besoin de ALTER DATABASE (permission refusée)
-- ✅ L'URL est maintenant codée dans la fonction
-- ✅ Les notifications fonctionneront pour les nouvelles inscriptions
-- ⚠️ Vérifiez que ADMIN_EMAIL est configuré dans Vercel
-- ⚠️ Vérifiez que RESEND_API_KEY est configuré dans Vercel
