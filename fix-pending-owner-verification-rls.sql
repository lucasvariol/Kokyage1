-- Fix RLS pour pending_owner_verification
-- Cette table est accédée uniquement par les routes API avec supabaseAdmin (service role)
-- Les utilisateurs ne peuvent pas y accéder directement depuis le client

-- Supprimer toutes les policies existantes
DROP POLICY IF EXISTS "Service role has full access" ON pending_owner_verification;
DROP POLICY IF EXISTS "System only access" ON pending_owner_verification;

-- Désactiver complètement RLS (table accessible uniquement en backend)
ALTER TABLE pending_owner_verification DISABLE ROW LEVEL SECURITY;

-- Vérification
SELECT 
  schemaname,
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'pending_owner_verification';
