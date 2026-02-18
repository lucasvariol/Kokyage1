-- Configuration complète pour activer TOUTES les notifications email

-- ÉTAPE 1: Activer l'extension pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ÉTAPE 2A: Fonction pour notifier les nouveaux utilisateurs
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

-- ÉTAPE 2B: Fonction pour notifier les logements à modérer
CREATE OR REPLACE FUNCTION notify_listing_for_moderation()
RETURNS trigger AS $$
DECLARE
  request_id bigint;
  payload jsonb;
  api_url text;
BEGIN
  -- URL de l'API en dur (Supabase ne permet pas ALTER DATABASE)
  api_url := 'https://kokyage.com';
  
  -- Vérifier que le statut a changé vers "en attente validation modérateur"
  IF NEW.status = 'en attente validation modérateur' AND (OLD.status IS NULL OR OLD.status != 'en attente validation modérateur') THEN
    
    -- Construire le payload avec les informations du logement
    payload := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
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
        url := api_url || '/api/admin/notify-listing-moderation',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := payload
      ) INTO request_id;
      
      RAISE NOTICE 'Listing moderation notification sent with request_id: %', request_id;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log l'erreur mais ne pas bloquer l'update
        RAISE WARNING 'Failed to send listing moderation notification: %', SQLERRM;
    END;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ÉTAPE 3: Créer les triggers
DROP TRIGGER IF EXISTS on_new_user_created ON profiles;
CREATE TRIGGER on_new_user_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_user();

DROP TRIGGER IF EXISTS on_listing_ready_for_moderation ON listings;
CREATE TRIGGER on_listing_ready_for_moderation
  AFTER UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION notify_listing_for_moderation();

-- ÉTAPE 4: Vérifier la configuration
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') 
    THEN '✅ pg_net installé'
    ELSE '❌ pg_net non installé'
  END as status_pg_net;

SELECT 
  proname as function_name,
  '✅ Fonction existe' as status
FROM pg_proc 
WHERE proname IN ('notify_new_user', 'notify_listing_for_moderation');

SELECT 
  tgname as trigger_name,
  CASE tgenabled
    WHEN 'O' THEN '✅ Actif'
    WHEN 'D' THEN '❌ Désactivé'
    ELSE '⚠️ État inconnu'
  END as status
FROM pg_trigger 
WHERE tgname IN ('on_new_user_created', 'on_listing_ready_for_moderation');
