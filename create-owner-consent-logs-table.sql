-- Table pour enregistrer les accords de consentement du propriétaire
-- Cette table sert de preuve juridique que l'accord a été accepté

CREATE TABLE IF NOT EXISTS owner_consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  owner_email TEXT NOT NULL,
  tenant_full_name TEXT NOT NULL,
  listing_address TEXT NOT NULL,
  
  -- Données de consentement
  consent_accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  info_accuracy_accepted BOOLEAN NOT NULL DEFAULT true,
  owner_consent_accepted BOOLEAN NOT NULL DEFAULT true,
  
  -- Données techniques pour preuves
  ip_address TEXT,
  user_agent TEXT,
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  
  -- Texte complet de l'accord accepté (pour archivage)
  agreement_text TEXT,
  
  -- Métadonnées
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

CREATE TRIGGER update_owner_consent_logs_updated_at
  BEFORE UPDATE ON owner_consent_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_owner_consent_logs_updated_at();

-- RLS (Row Level Security)
ALTER TABLE owner_consent_logs ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres logs
CREATE POLICY "Users can view their own consent logs"
  ON owner_consent_logs
  FOR SELECT
  USING (auth.uid() = tenant_id);

-- Seuls les utilisateurs authentifiés peuvent créer des logs (via l'API)
CREATE POLICY "Authenticated users can create consent logs"
  ON owner_consent_logs
  FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

-- Commentaires pour documentation
COMMENT ON TABLE owner_consent_logs IS 'Logs des accords de consentement du propriétaire pour validation juridique';
COMMENT ON COLUMN owner_consent_logs.consent_accepted_at IS 'Horodatage précis de l''acceptation de l''accord';
COMMENT ON COLUMN owner_consent_logs.ip_address IS 'Adresse IP de l''utilisateur lors de l''acceptation';
COMMENT ON COLUMN owner_consent_logs.user_agent IS 'User agent du navigateur pour traçabilité';
COMMENT ON COLUMN owner_consent_logs.consent_version IS 'Version de l''accord accepté pour suivi des modifications';
COMMENT ON COLUMN owner_consent_logs.agreement_text IS 'Texte complet de l''accord au moment de l''acceptation';
