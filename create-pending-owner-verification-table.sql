-- Table pour stocker les tokens de vérification propriétaire
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

-- RLS policies
ALTER TABLE pending_owner_verification ENABLE ROW LEVEL SECURITY;

-- Permettre aux API routes (service role) d'accéder à tout
CREATE POLICY "Service role has full access"
ON pending_owner_verification
FOR ALL
USING (auth.role() = 'service_role');

-- Commentaire
COMMENT ON TABLE pending_owner_verification IS 'Tokens temporaires pour validation propriétaire (24h)';
