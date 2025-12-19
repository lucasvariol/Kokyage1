-- Ajouter la colonne platform_tva pour stocker la TVA sur les frais de plateforme
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS platform_tva NUMERIC(10,2) DEFAULT 0;

-- Commentaire pour documentation
COMMENT ON COLUMN reservations.platform_tva IS 'Montant de la TVA (20%) sur les frais de plateforme';

-- Note: platform_share contiendra maintenant le montant HT des frais de plateforme
COMMENT ON COLUMN reservations.platform_share IS 'Part de la plateforme (HT) - frais de plateforme + commission sur hébergement';
