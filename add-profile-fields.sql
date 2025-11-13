-- Ajouter les colonnes pour le profil utilisateur dans la table users

-- Ajouter la colonne photo_url si elle n'existe pas
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Ajouter la colonne phone si elle n'existe pas
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Ajouter la colonne date_naissance si elle n'existe pas
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_naissance DATE;

-- Ajouter la colonne full_name si elle n'existe pas
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Créer un index sur full_name pour les recherches
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);

-- Commentaires pour documentation
COMMENT ON COLUMN users.photo_url IS 'URL de la photo de profil stockée dans Supabase Storage';
COMMENT ON COLUMN users.phone IS 'Numéro de téléphone de l''utilisateur';
COMMENT ON COLUMN users.date_naissance IS 'Date de naissance de l''utilisateur';
COMMENT ON COLUMN users.full_name IS 'Nom complet (prénom + nom) pour recherches rapides';
