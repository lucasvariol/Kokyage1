-- Ajouter les colonnes nécessaires pour le système de caution différée
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter la colonne payment_method_id pour stocker le PaymentMethod Stripe
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS payment_method_id TEXT;

-- 2. Ajouter la colonne caution_created_at pour tracer la création de la caution
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS caution_created_at TIMESTAMPTZ;

-- 3. Ajouter la colonne caution_released_at pour tracer la libération de la caution
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS caution_released_at TIMESTAMPTZ;

-- 4. Créer un index sur payment_method_id pour optimiser les requêtes du CRON
CREATE INDEX IF NOT EXISTS idx_reservations_payment_method 
ON reservations(payment_method_id);

-- 5. Créer un index sur date_arrivee pour optimiser les requêtes du CRON
CREATE INDEX IF NOT EXISTS idx_reservations_date_arrivee 
ON reservations(date_arrivee);

-- 6. Créer un index sur caution_status pour optimiser les requêtes de libération
CREATE INDEX IF NOT EXISTS idx_reservations_caution_status 
ON reservations(caution_status);

-- Vérification : afficher la structure de la table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND column_name IN ('payment_method_id', 'caution_created_at', 'caution_released_at', 'caution_status', 'caution_intent_id')
ORDER BY column_name;
