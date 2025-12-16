-- Supprimer d'abord les politiques RLS qui dépendent de tenant_id
DROP POLICY IF EXISTS "Users can view their own consent logs" ON owner_consent_logs;
DROP POLICY IF EXISTS "Authenticated users can create consent logs" ON owner_consent_logs;

-- Supprimer les colonnes tenant car le tenant ne signe plus l'accord
ALTER TABLE owner_consent_logs 
DROP COLUMN IF EXISTS tenant_id CASCADE,
DROP COLUMN IF EXISTS tenant_email CASCADE,
DROP COLUMN IF EXISTS tenant_full_name CASCADE,
DROP COLUMN IF EXISTS tenant_signed_at CASCADE,
DROP COLUMN IF EXISTS tenant_ip_address CASCADE,
DROP COLUMN IF EXISTS tenant_user_agent CASCADE,
DROP COLUMN IF EXISTS info_accuracy_accepted CASCADE;

-- Recréer les politiques RLS basées uniquement sur owner_email si nécessaire
-- (À adapter selon vos besoins de sécurité)

-- Vérification des colonnes restantes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'owner_consent_logs'
ORDER BY ordinal_position;
