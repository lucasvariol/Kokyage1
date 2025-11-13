-- Créer ou mettre à jour la table users pour le profil utilisateur

-- Créer la table users si elle n'existe pas
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom TEXT,
  nom TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  date_naissance DATE,
  photo_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes si la table existe déjà (pour migration)
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_naissance DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Créer un index sur full_name pour les recherches
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leur propre profil
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Les utilisateurs peuvent modifier leur propre profil
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Les utilisateurs peuvent insérer leur propre profil
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Commentaires pour documentation
COMMENT ON TABLE users IS 'Profils utilisateurs étendus avec informations personnelles';
COMMENT ON COLUMN users.photo_url IS 'URL de la photo de profil stockée dans Supabase Storage';
COMMENT ON COLUMN users.phone IS 'Numéro de téléphone de l''utilisateur';
COMMENT ON COLUMN users.date_naissance IS 'Date de naissance de l''utilisateur';
COMMENT ON COLUMN users.full_name IS 'Nom complet (prénom + nom) pour recherches rapides';
