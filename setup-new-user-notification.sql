-- Notification automatique par email lors de la création d'un nouvel utilisateur
-- Ce webhook appellera l'API route pour envoyer un email à l'admin

-- 1. Créer la fonction qui appelle l'API
CREATE OR REPLACE FUNCTION notify_new_user()
RETURNS trigger AS $$
DECLARE
  request_id bigint;
  payload jsonb;
BEGIN
  -- Construire le payload avec les informations de l'utilisateur
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', NULL
  );

  -- Appeler l'API via http request (nécessite l'extension pg_net)
  SELECT net.http_post(
    url := current_setting('app.api_url') || '/api/admin/notify-new-user',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := payload
  ) INTO request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Créer le trigger sur la table profiles
DROP TRIGGER IF EXISTS on_new_user_created ON profiles;

CREATE TRIGGER on_new_user_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_user();

-- Note: Pour que cela fonctionne, vous devez :
-- 1. Activer l'extension pg_net dans Supabase
-- 2. Configurer la variable app.api_url avec votre URL de production

-- Pour configurer l'URL de l'API (à exécuter avec votre URL de production) :
-- ALTER DATABASE postgres SET app.api_url TO 'https://votre-domaine.vercel.app';

-- Pour activer pg_net (si pas déjà activé) :
-- CREATE EXTENSION IF NOT EXISTS pg_net;
