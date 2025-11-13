-- Table pour enregistrer les accords de consentement du propriétaire
-- Cette table sert de preuve juridique que l'accord a été accepté
-- Deux signatures : tenant (création annonce) + owner (validation propriétaire)

CREATE TABLE IF NOT EXISTS owner_consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  
  -- Signature du TENANT (locataire qui crée l'annonce)
  tenant_id UUID NOT NULL,
  tenant_full_name TEXT NOT NULL,
  tenant_email TEXT NOT NULL,
  tenant_signed_at TIMESTAMPTZ,
  tenant_ip_address TEXT,
  tenant_user_agent TEXT,
  
  -- Signature du OWNER (propriétaire qui valide)
  owner_email TEXT NOT NULL,
  owner_full_name TEXT,
  owner_signed_at TIMESTAMPTZ,
  owner_ip_address TEXT,
  owner_user_agent TEXT,
  
  -- Données communes
  listing_address TEXT NOT NULL,
  info_accuracy_accepted BOOLEAN NOT NULL DEFAULT true,
  owner_consent_accepted BOOLEAN NOT NULL DEFAULT true,
  
  -- Métadonnées
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  agreement_text TEXT,
  
  -- Statut global
  fully_signed BOOLEAN GENERATED ALWAYS AS (tenant_signed_at IS NOT NULL AND owner_signed_at IS NOT NULL) STORED,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_owner_consent_logs_listing_id ON owner_consent_logs(listing_id);
CREATE INDEX IF NOT EXISTS idx_owner_consent_logs_tenant_id ON owner_consent_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_owner_consent_logs_created_at ON owner_consent_logs(created_at);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_owner_consent_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_owner_consent_logs_updated_at ON owner_consent_logs;

CREATE TRIGGER update_owner_consent_logs_updated_at
  BEFORE UPDATE ON owner_consent_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_owner_consent_logs_updated_at();

-- RLS (Row Level Security)
ALTER TABLE owner_consent_logs ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres logs
DROP POLICY IF EXISTS "Users can view their own consent logs" ON owner_consent_logs;
CREATE POLICY "Users can view their own consent logs"
  ON owner_consent_logs
  FOR SELECT
  USING (auth.uid() = tenant_id);

-- Seuls les utilisateurs authentifiés peuvent créer des logs (via l'API)
DROP POLICY IF EXISTS "Authenticated users can create consent logs" ON owner_consent_logs;
CREATE POLICY "Authenticated users can create consent logs"
  ON owner_consent_logs
  FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

-- Commentaires pour documentation
COMMENT ON TABLE owner_consent_logs IS 'Logs des accords de consentement du propriétaire pour validation juridique';
COMMENT ON COLUMN owner_consent_logs.tenant_signed_at IS 'Horodatage précis de l''acceptation par le locataire';
COMMENT ON COLUMN owner_consent_logs.owner_signed_at IS 'Horodatage précis de l''acceptation par le propriétaire';
COMMENT ON COLUMN owner_consent_logs.tenant_ip_address IS 'Adresse IP du locataire lors de l''acceptation';
COMMENT ON COLUMN owner_consent_logs.owner_ip_address IS 'Adresse IP du propriétaire lors de l''acceptation';
COMMENT ON COLUMN owner_consent_logs.tenant_user_agent IS 'User agent du navigateur du locataire pour traçabilité';
COMMENT ON COLUMN owner_consent_logs.owner_user_agent IS 'User agent du navigateur du propriétaire pour traçabilité';
COMMENT ON COLUMN owner_consent_logs.consent_version IS 'Version de l''accord accepté pour suivi des modifications';
COMMENT ON COLUMN owner_consent_logs.agreement_text IS 'Texte complet de l''accord au moment de l''acceptation';
COMMENT ON COLUMN owner_consent_logs.fully_signed IS 'True si tenant ET owner ont tous deux signé';
