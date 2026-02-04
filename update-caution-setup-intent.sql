-- Migration de la logique de caution : 
-- Passage de PaymentIntent (caution_intent_id avec activation automatique)
-- à SetupIntent (setup_intent_id avec activation manuelle uniquement en cas de litige)

-- Ajouter la nouvelle colonne setup_intent_id
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS setup_intent_id TEXT;

-- Mettre à jour caution_status pour refléter la nouvelle logique :
-- 'setup' = carte enregistrée via SetupIntent (en standby)
-- 'captured' = caution capturée manuellement suite à un litige
-- 'released' = caution libérée manuellement
-- NULL = pas de caution

-- Optionnel: Migrer les anciennes données si nécessaire
-- Si vous avez des réservations avec caution_intent_id, vous pouvez les copier vers setup_intent_id
-- et mettre à jour le statut en conséquence :

-- UPDATE reservations 
-- SET setup_intent_id = caution_intent_id,
--     caution_status = CASE 
--       WHEN caution_status = 'authorized' THEN 'setup'
--       ELSE caution_status
--     END
-- WHERE caution_intent_id IS NOT NULL 
--   AND setup_intent_id IS NULL;

-- Note: caution_intent_id peut être conservée pour historique ou supprimée selon vos besoins
-- La nouvelle logique utilise exclusivement setup_intent_id

-- Créer un index pour optimiser les requêtes sur setup_intent_id
CREATE INDEX IF NOT EXISTS idx_reservations_setup_intent 
ON reservations(setup_intent_id)
WHERE setup_intent_id IS NOT NULL;

-- Commentaires sur les colonnes pour documentation
COMMENT ON COLUMN reservations.setup_intent_id IS 'ID du SetupIntent Stripe pour enregistrement de la carte (activation manuelle si litige)';
COMMENT ON COLUMN reservations.caution_status IS 'Statut de la caution: setup (enregistrée), captured (prélevée pour litige), released (libérée), NULL (pas de caution)';
