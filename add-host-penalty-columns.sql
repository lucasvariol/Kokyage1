-- Ajouter les colonnes pour gérer les pénalités d'annulation hôte
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(10) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS host_penalty_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS host_penalty_rate DECIMAL(5, 2) DEFAULT 0;

-- Ajouter une colonne pour le solde de pénalités hôte dans la table profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS penalty_balance DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN reservations.cancelled_by IS 'Qui a annulé: host ou guest';
COMMENT ON COLUMN reservations.host_penalty_amount IS 'Montant de la pénalité si annulation hôte (en euros)';
COMMENT ON COLUMN reservations.host_penalty_rate IS 'Taux de pénalité appliqué (15%, 25% ou 50%)';
COMMENT ON COLUMN profiles.penalty_balance IS 'Solde des pénalités (négatif = dette envers plateforme, déduit des prochains versements)';
