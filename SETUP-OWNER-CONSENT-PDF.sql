-- =====================================================
-- MIGRATION COMPLÈTE : Système PDF Accord de Sous-Location
-- =====================================================
-- À exécuter dans Supabase SQL Editor
-- =====================================================

-- 1. Ajouter la colonne pour stocker le PDF dans listings
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS owner_consent_pdf TEXT;

COMMENT ON COLUMN listings.owner_consent_pdf IS 'PDF de l''accord de sous-location signé numériquement (base64)';

-- 2. Créer la table pour les tokens de vérification propriétaire
CREATE TABLE IF NOT EXISTS pending_owner_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_pending_owner_verification_token ON pending_owner_verification(token);
CREATE INDEX IF NOT EXISTS idx_pending_owner_verification_listing ON pending_owner_verification(listing_id);
CREATE INDEX IF NOT EXISTS idx_pending_owner_verification_expires ON pending_owner_verification(expires_at);

-- Pas de RLS sur cette table : accès uniquement via API routes (service role)
ALTER TABLE pending_owner_verification DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE pending_owner_verification IS 'Tokens temporaires pour validation propriétaire (24h) - Accès API uniquement';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Vérification :
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listings' AND column_name = 'owner_consent_pdf';

SELECT * FROM pending_owner_verification LIMIT 1;
