-- Configuration du bucket Storage pour les photos de profil

-- 1. Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- 2. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Allow authenticated users to upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view profile photos" ON storage.objects;

-- 3. Créer les nouvelles policies

-- Permettre aux utilisateurs authentifiés d'uploader dans profile-photos
CREATE POLICY "Allow authenticated users to upload profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
);

-- Permettre aux utilisateurs authentifiés de mettre à jour leurs photos
CREATE POLICY "Allow authenticated users to update profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos')
WITH CHECK (bucket_id = 'profile-photos');

-- Permettre aux utilisateurs authentifiés de supprimer leurs photos
CREATE POLICY "Allow authenticated users to delete profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Permettre à tout le monde de voir les photos (bucket public)
CREATE POLICY "Allow public to view profile photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');
