-- Ajout d'un ID court et lisible pour les réservations (format: #X87DY)
-- Cet ID sera affiché aux utilisateurs au lieu de l'UUID interne

-- Ajouter la colonne display_id
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS display_id TEXT UNIQUE;

-- Créer un index unique sur display_id pour garantir l'unicité et optimiser les recherches
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_display_id 
ON reservations(display_id);

-- Optionnel: Générer des display_id pour les réservations existantes
-- Attention: Cette fonction génère des IDs aléatoires. En production, utilisez plutôt
-- la fonction generateUniqueShortId() côté application pour éviter les collisions.

-- Fonction pour générer un ID court (5 caractères alphanumériques sans ambiguïté)
CREATE OR REPLACE FUNCTION generate_short_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Sans 0, O, I, 1
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..5 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Mettre à jour les réservations existantes (optionnel)
-- Décommenter si vous voulez générer des IDs pour les réservations existantes
/*
DO $$
DECLARE
  reservation_record RECORD;
  new_id TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER;
  id_exists BOOLEAN;
BEGIN
  FOR reservation_record IN 
    SELECT id FROM reservations WHERE display_id IS NULL
  LOOP
    attempt := 0;
    LOOP
      new_id := generate_short_id();
      
      -- Vérifier si l'ID existe déjà
      SELECT EXISTS(SELECT 1 FROM reservations WHERE display_id = new_id) INTO id_exists;
      
      EXIT WHEN NOT id_exists OR attempt >= max_attempts;
      
      attempt := attempt + 1;
    END LOOP;
    
    IF attempt >= max_attempts THEN
      RAISE NOTICE 'Unable to generate unique ID for reservation %', reservation_record.id;
    ELSE
      UPDATE reservations 
      SET display_id = new_id 
      WHERE id = reservation_record.id;
    END IF;
  END LOOP;
END $$;
*/

-- Commentaire sur la colonne
COMMENT ON COLUMN reservations.display_id IS 'ID court et lisible affiché aux utilisateurs (format: X87DY, 5 caractères alphanumériques)';
