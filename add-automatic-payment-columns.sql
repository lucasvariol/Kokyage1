-- Ajouter les colonnes nécessaires pour les paiements automatiques
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS balances_allocated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS balances_allocated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS host_payout_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS kokyage_commission DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS caution_released_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS litige BOOLEAN DEFAULT false;

-- Ajouter les colonnes pour les gains dans profiles (si pas déjà présentes)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS to_be_paid_to_user DECIMAL(10, 2) DEFAULT 0;

-- Index pour optimiser les requêtes du cron job
CREATE INDEX IF NOT EXISTS idx_reservations_auto_payment 
ON reservations(status, end_date, balances_allocated)
WHERE status = 'confirmed' AND balances_allocated = false;

-- Commentaires pour documentation
COMMENT ON COLUMN reservations.balances_allocated IS 'Indique si les paiements ont été automatiquement traités après le checkout';
COMMENT ON COLUMN reservations.balances_allocated_at IS 'Date et heure de l''allocation automatique';
COMMENT ON COLUMN reservations.kokyage_commission IS 'Commission Kokyage prélevée (part plateforme)';
COMMENT ON COLUMN reservations.host_payout_date IS 'Date du transfert automatique vers les hôtes';
COMMENT ON COLUMN reservations.caution_released_at IS 'Date de libération (restitution) de la caution au voyageur';
COMMENT ON COLUMN reservations.litige IS 'Indique si un litige est en cours (empêche la libération automatique de la caution)';

COMMENT ON COLUMN profiles.total_earnings IS 'Total des gains accumulés (historique complet)';
COMMENT ON COLUMN profiles.to_be_paid_to_user IS 'Montant en attente de paiement vers l''utilisateur';
