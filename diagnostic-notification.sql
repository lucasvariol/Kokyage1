-- Script de diagnostic pour vérifier la configuration des notifications

-- 1. Vérifier si pg_net est installé
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') 
    THEN '✅ pg_net est installé'
    ELSE '❌ pg_net n''est PAS installé - Exécutez: CREATE EXTENSION IF NOT EXISTS pg_net;'
  END as status_pg_net;

-- 2. Vérifier que le trigger existe et est actif
SELECT 
  tgname as trigger_name,
  CASE tgenabled
    WHEN 'O' THEN '✅ Actif'
    WHEN 'D' THEN '❌ Désactivé'
    ELSE '⚠️ État inconnu'
  END as status
FROM pg_trigger 
WHERE tgname = 'on_new_user_created';

-- 3. Vérifier la fonction
SELECT 
  proname as function_name,
  '✅ Fonction existe' as status
FROM pg_proc 
WHERE proname = 'notify_new_user';

-- 4. Vérifier le code de la fonction (contient-elle l'URL?)
SELECT 
  CASE 
    WHEN prosrc LIKE '%https://kokyage.com%' 
    THEN '✅ URL configurée dans la fonction'
    ELSE '❌ URL manquante - Réexécutez activer-notifications.sql'
  END as status_url
FROM pg_proc 
WHERE proname = 'notify_new_user';

-- 5. Tester l'appel HTTP (optionnel - décommentez si pg_net est installé)
/*
SELECT net.http_post(
  url := current_setting('app.api_url', true) || '/api/admin/notify-new-user',
  headers := jsonb_build_object('Content-Type', 'application/json'),
  body := jsonb_build_object(
    'type', 'INSERT',
    'table', 'profiles',
    'record', jsonb_build_object(
      'id', 'test-id',
      'name', 'Test User',
      'email', 'test@example.com',
      'created_at', now()
    ),
    'old_record', null
  )
) as request_id;
*/
