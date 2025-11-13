# Configuration Supabase Storage pour les photos de profil

## Étapes à suivre dans le dashboard Supabase :

### 1. Créer le bucket Storage

1. Va dans **Storage** dans le menu Supabase
2. Clique sur **New bucket**
3. Nom du bucket : `profile-photos`
4. Coche **Public bucket** (pour que les photos soient accessibles publiquement)
5. Clique sur **Create bucket**

### 2. Configurer les policies RLS (Row Level Security)

Le bucket étant public, les policies sont automatiquement configurées.

Si tu veux plus de contrôle, ajoute ces policies dans **Storage** > **Policies** :

```sql
-- Policy: Les utilisateurs peuvent uploader leur propre photo
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Policy: Les utilisateurs peuvent mettre à jour leur propre photo
CREATE POLICY "Users can update their own profile photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Policy: Les utilisateurs peuvent supprimer leur propre photo
CREATE POLICY "Users can delete their own profile photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Policy: Tout le monde peut voir les photos (bucket public)
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');
```

### 3. Configuration des tailles de fichiers (optionnel)

Par défaut, Supabase limite les uploads à 50 MB. C'est largement suffisant pour les photos de profil (notre limite est 5 MB dans le code).

## Vérification

Une fois configuré, teste l'upload depuis la page `/profil` :
1. Connecte-toi
2. Clique sur l'icône 📷 sur ton avatar
3. Sélectionne une photo
4. Elle devrait s'uploader et s'afficher immédiatement
