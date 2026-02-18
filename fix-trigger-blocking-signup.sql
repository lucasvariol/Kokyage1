-- FIX URGENT: Rendre le trigger notify_new_user non-bloquant
-- Exécutez ce script dans le SQL Editor de Supabase pour permettre les inscriptions

-- Remplacer la fonction pour qu'elle ne bloque pas les inscriptions
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

  -- Appeler l'API via http request (nécessite l'extension pg_net)
  -- Si quelque chose échoue, on ne bloque pas l'insertion
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

-- Le trigger existe déjà, pas besoin de le recréer
-- Vérifier que le trigger est bien actif
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'on_new_user_created';
