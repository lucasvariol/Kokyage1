-- Ajouter les colonnes pour les dates de remboursement dans la table reservations

-- Date à partir de laquelle le remboursement est de 50% (6 jours avant l'arrivée)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS refund_50_percent_date DATE;

-- Date à partir de laquelle le remboursement est de 0% (2 jours avant l'arrivée, la veille)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS refund_0_percent_date DATE;

-- Commentaires pour documenter les colonnes
COMMENT ON COLUMN reservations.refund_50_percent_date IS 'Date limite pour un remboursement à 50% (6 jours avant arrivée)';
COMMENT ON COLUMN reservations.refund_0_percent_date IS 'Date limite pour un remboursement à 0% (2 jours avant arrivée)';

-- Mettre à jour les réservations existantes avec ces dates calculées
UPDATE reservations 
SET 
  refund_50_percent_date = date_arrivee - INTERVAL '6 days',
  refund_0_percent_date = date_arrivee - INTERVAL '2 days'
WHERE refund_50_percent_date IS NULL 
  AND refund_0_percent_date IS NULL
  AND date_arrivee IS NOT NULL;
