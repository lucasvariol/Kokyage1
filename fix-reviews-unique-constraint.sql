-- Migration : Corriger la contrainte unique sur reviews
-- Problème : actuellement (listing_id, user_id) empêche plusieurs avis par utilisateur sur le même logement
-- Solution : contrainte sur (reservation_id, user_id) pour permettre un avis par réservation

-- 1. Supprimer l'ancienne contrainte unique sur (listing_id, user_id)
ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS reviews_listing_id_user_id_key;

-- 2. Ajouter la nouvelle contrainte unique sur (reservation_id, user_id)
ALTER TABLE reviews 
ADD CONSTRAINT reviews_reservation_id_user_id_key 
UNIQUE (reservation_id, user_id);

-- 3. Optionnel : ajouter un index pour améliorer les performances des requêtes par listing
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id 
ON reviews(listing_id) 
WHERE is_published = true;

-- Note : Cette migration permet à un utilisateur de laisser plusieurs avis
-- pour le même logement (si plusieurs réservations), tout en garantissant
-- qu'il ne peut laisser qu'un seul avis par réservation.
