-- Migration pour le système d'avis croisés
-- Ajoute les colonnes nécessaires pour le système de publication croisée des avis

-- Ajouter les colonnes manquantes à la table reviews
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS reservation_id uuid REFERENCES public.reservations(id),
ADD COLUMN IF NOT EXISTS reviewer_type text CHECK (reviewer_type IN ('guest', 'host')),
ADD COLUMN IF NOT EXISTS reviewee_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;

-- Rendre listing_id nullable (car on peut noter un voyageur sans noter le logement)
ALTER TABLE public.reviews 
ALTER COLUMN listing_id DROP NOT NULL;

-- Index pour optimiser les requêtes de publication croisée
CREATE INDEX IF NOT EXISTS idx_reviews_reservation_published 
ON public.reviews(reservation_id, is_published);

CREATE INDEX IF NOT EXISTS idx_reviews_created_published 
ON public.reviews(created_at, is_published);

-- Contrainte pour empêcher les doublons (un reviewer ne peut noter qu'une fois par réservation)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_reviewer_reservation 
ON public.reviews(reservation_id, user_id) 
WHERE reservation_id IS NOT NULL;

-- Commentaires
COMMENT ON COLUMN public.reviews.reservation_id IS 'Réservation associée à l''avis';
COMMENT ON COLUMN public.reviews.reviewer_type IS 'Type du reviewer: guest (voyageur) ou host (hôte)';
COMMENT ON COLUMN public.reviews.reviewee_id IS 'ID de la personne notée (hôte ou voyageur)';
COMMENT ON COLUMN public.reviews.is_published IS 'Avis publié (visible) ou en attente';
COMMENT ON COLUMN public.reviews.published_at IS 'Date de publication de l''avis';
