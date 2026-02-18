-- ================================================================
-- DIAGNOSTIC : Visibilité du logement 3c0be2be-dbda-4014-9e89-880a408dbccf
-- À exécuter dans Supabase SQL Editor
-- ================================================================

SELECT 
  id,
  title,
  status,
  price_per_night,
  nb_voyageurs,
  bedrooms,
  bathrooms,
  beds,
  type,
  city,
  address,
  latitude,
  longitude,
  owner_id,
  id_proprietaire,
  created_at,
  updated_at
FROM listings
WHERE id = '3c0be2be-dbda-4014-9e89-880a408dbccf';
