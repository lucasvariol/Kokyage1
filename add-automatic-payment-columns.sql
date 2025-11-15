-- Ajouter les colonnes nécessaires pour les paiements automatiques
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS balances_allocated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS host_payout_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS kokyage_commission DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS host_payout_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS caution_captured_at TIMESTAMP WITH TIME ZONE;

-- Ajouter une colonne pour le Stripe Connect Account de l'hôte
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'not_connected';

-- Index pour optimiser les requêtes du cron job
CREATE INDEX IF NOT EXISTS idx_reservations_auto_payment 
ON reservations(status, end_date, balances_allocated)
WHERE status = 'confirmed' AND balances_allocated = false;

-- Commentaires pour documentation
COMMENT ON COLUMN reservations.balances_allocated IS 'Indique si les paiements ont été automatiquement traités après le checkout';
COMMENT ON COLUMN reservations.host_payout_amount IS 'Montant versé à l''hôte (total - commission)';
COMMENT ON COLUMN reservations.kokyage_commission IS 'Commission Kokyage prélevée (15%)';
COMMENT ON COLUMN reservations.host_payout_date IS 'Date du transfert automatique vers l''hôte';
COMMENT ON COLUMN reservations.stripe_transfer_id IS 'ID du transfert Stripe vers le compte Connect de l''hôte';
COMMENT ON COLUMN reservations.caution_captured_at IS 'Date de capture de la caution';

COMMENT ON COLUMN profiles.stripe_account_id IS 'ID du compte Stripe Connect pour recevoir les paiements en tant qu''hôte';
COMMENT ON COLUMN profiles.stripe_account_status IS 'Statut du compte Stripe Connect: not_connected, pending, active';
