-- Ajouter les colonnes pour le profil utilisateur dans la table profiles existante

-- Ajouter la colonne photo_url si elle n'existe pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Ajouter la colonne phone si elle n'existe pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Ajouter la colonne date_naissance si elle n'existe pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_naissance DATE;

-- Ajouter la colonne full_name si elle n'existe pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Ajouter la colonne prenom si elle n'existe pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prenom TEXT;

-- Ajouter la colonne nom si elle n'existe pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nom TEXT;

-- Ajouter la colonne email si elle n'existe pas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Créer un index sur full_name pour les recherches
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);

-- Commentaires pour documentation
COMMENT ON COLUMN profiles.photo_url IS 'URL de la photo de profil stockée dans Supabase Storage';
COMMENT ON COLUMN profiles.phone IS 'Numéro de téléphone de l''utilisateur';
COMMENT ON COLUMN profiles.date_naissance IS 'Date de naissance de l''utilisateur';
COMMENT ON COLUMN profiles.full_name IS 'Nom complet (prénom + nom) pour recherches rapides';
COMMENT ON COLUMN profiles.prenom IS 'Prénom de l''utilisateur';
COMMENT ON COLUMN profiles.nom IS 'Nom de famille de l''utilisateur';
COMMENT ON COLUMN profiles.email IS 'Email de l''utilisateur (copie de auth.users.email)';
