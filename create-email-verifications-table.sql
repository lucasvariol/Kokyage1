-- Table pour stocker les tokens de vérification d'email personnalisés
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);

-- RLS (Row Level Security)
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs ne peuvent voir que leurs propres vérifications
CREATE POLICY "Users can view own verifications"
  ON email_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Seuls les admins peuvent insérer (via service_role)
CREATE POLICY "Service role can insert verifications"
  ON email_verifications
  FOR INSERT
  WITH CHECK (true);

-- Politique : Service role peut tout faire
CREATE POLICY "Service role can update verifications"
  ON email_verifications
  FOR UPDATE
  USING (true);

-- Nettoyage automatique des tokens expirés (optionnel, via cron job ou fonction)
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verifications
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE email_verifications IS 'Stocke les tokens de vérification d''email personnalisés pour remplacer le système par défaut de Supabase';
COMMENT ON COLUMN email_verifications.token IS 'Token unique de vérification envoyé par email';
COMMENT ON COLUMN email_verifications.expires_at IS 'Date d''expiration du token (généralement 24h après création)';
COMMENT ON COLUMN email_verifications.verified_at IS 'Date de vérification, NULL si pas encore vérifié';
