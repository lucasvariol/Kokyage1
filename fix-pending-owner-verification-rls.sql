-- Fix RLS pour pending_owner_verification
-- Cette table est accédée uniquement par les routes API avec supabaseAdmin (service role)
-- Les utilisateurs ne peuvent pas y accéder directement depuis le client

-- Supprimer toutes les policies existantes
DROP POLICY IF EXISTS "Service role has full access" ON pending_owner_verification;
DROP POLICY IF EXISTS "System only access" ON pending_owner_verification;

-- Activer RLS (requis par Supabase pour tables dans le schéma public)
ALTER TABLE pending_owner_verification ENABLE ROW LEVEL SECURITY;

-- Créer une policy qui bloque TOUT accès utilisateur (seul service role peut accéder)
-- Aucune policy pour les utilisateurs = accès bloqué
-- Le service role bypass RLS donc il peut toujours accéder
CREATE POLICY "No user access - API only"
ON pending_owner_verification
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- Vérification
SELECT 
  schemaname,
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'pending_owner_verification';
