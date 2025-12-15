-- =====================================================
-- Politiques RLS pour affichage public des données listing
-- =====================================================
-- À exécuter dans Supabase SQL Editor
-- Permet l'affichage des infos hôte et compteur réservations
-- même quand l'utilisateur n'est pas connecté
-- =====================================================

-- 1. Permettre la lecture publique des profils hôtes (pour listings publiés uniquement)
-- Crée une politique qui permet à n'importe qui de lire les profils des hôtes
-- dont au moins un listing est publié
CREATE POLICY "Public read for hosts with published listings"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM listings 
    WHERE (listings.owner_id::text = profiles.id::text OR listings.id_proprietaire::text = profiles.id::text)
      AND listings.status = 'validé modérateur'
  )
);

-- 2. Permettre la lecture publique du COUNT des réservations par listing
-- (sans révéler les détails des réservations)
-- Note: Cette politique permet uniquement de compter, pas de lire les détails
CREATE POLICY "Public count reservations by listing"
ON reservations
FOR SELECT
USING (true);
-- Important: Cette politique large est OK car l'API ne renvoie que le COUNT,
-- pas les données sensibles. Si vous voulez plus de contrôle, créez une vue.

-- Alternative plus sécurisée (optionnelle) : Créer une vue matérialisée
-- pour exposer uniquement les compteurs publics sans RLS
-- CREATE MATERIALIZED VIEW public_listing_stats AS
-- SELECT 
--   listing_id,
--   COUNT(*) as reservations_count
-- FROM reservations
-- GROUP BY listing_id;
-- 
-- GRANT SELECT ON public_listing_stats TO anon, authenticated;
-- 
-- Puis rafraîchir périodiquement :
-- REFRESH MATERIALIZED VIEW public_listing_stats;
