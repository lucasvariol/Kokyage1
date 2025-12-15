-- Ajouter la colonne pour stocker le PDF de l'accord de sous-location
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS owner_consent_pdf TEXT;

COMMENT ON COLUMN listings.owner_consent_pdf IS 'PDF de l''accord de sous-location signé numériquement (base64)';
