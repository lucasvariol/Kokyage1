-- Supprimer les colonnes tenant car le tenant ne signe plus l'accord
ALTER TABLE owner_consent_logs 
DROP COLUMN IF EXISTS tenant_id,
DROP COLUMN IF EXISTS tenant_email,
DROP COLUMN IF EXISTS tenant_full_name,
DROP COLUMN IF EXISTS tenant_signed_at,
DROP COLUMN IF EXISTS tenant_ip_address,
DROP COLUMN IF EXISTS tenant_user_agent,
DROP COLUMN IF EXISTS info_accuracy_accepted;

-- Vérification des colonnes restantes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'owner_consent_logs'
ORDER BY ordinal_position;
