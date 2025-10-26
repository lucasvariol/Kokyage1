-- Script de débogage pour vérifier les réservations et RLS
-- Exécute ces requêtes une par une dans Supabase SQL editor

-- 1. Vérifier combien de réservations existent (en tant qu'utilisateur authentifié)
select count(*) as total_reservations from reservations;

-- 2. Voir les 5 premières réservations avec leurs participants
select 
  id,
  user_id,
  host_id,
  start_date,
  end_date,
  status,
  listing_id
from reservations 
order by start_date desc 
limit 5;

-- 3. Vérifier si RLS est actif sur reservations
select 
  schemaname,
  tablename,
  rowsecurity
from pg_tables 
where tablename = 'reservations';

-- 4. Lister les policies actives sur reservations
select 
  policyname,
  permissive,
  roles,
  cmd,
  qual
from pg_policies 
where tablename = 'reservations';

-- 5. Tester si l'utilisateur connecté peut lire ses réservations
-- (Cette requête devrait retourner les réservations où tu es user_id OU host_id)
select 
  id,
  listing_id,
  user_id,
  host_id,
  start_date,
  end_date,
  status
from reservations
where user_id = auth.uid() or host_id = auth.uid()
order by start_date desc;
