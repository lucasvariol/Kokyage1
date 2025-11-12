# Configuration Supabase pour la vérification d'email

## Problème

Par défaut, Supabase permet la connexion même si l'email n'est pas confirmé, à moins que la configuration soit explicitement définie.

## Solution : Configuration dans Supabase Dashboard

### 1. Désactiver l'auto-confirmation

Allez dans votre dashboard Supabase :

1. **Authentication** → **Settings** → **Email Auth**
2. Décochez **"Enable email confirmations"** si vous voulez que les utilisateurs se connectent immédiatement
3. OU gardez coché pour forcer la confirmation

### 2. Configurer la confirmation d'email obligatoire

Dans **Authentication** → **Settings** :

- **Enable email confirmations** : ✅ **Activé**
- **Secure email change** : ✅ Activé (recommandé)
- **Double confirm email changes** : ✅ Activé (recommandé)

### 3. Configuration des URL de redirection

Dans **Authentication** → **URL Configuration** :

- **Site URL** : `https://kokyage.com`
- **Redirect URLs** : 
  - `https://kokyage.com/verification-email/*`
  - `https://kokyage.com/connexion`
  - `http://localhost:3000/*` (pour développement)

## Alternative : Utiliser RLS (Row Level Security)

Si Supabase ne bloque pas correctement, vous pouvez ajouter cette politique RLS sur vos tables critiques :

```sql
-- Politique pour bloquer les utilisateurs non vérifiés
CREATE POLICY "Users must confirm email"
ON public.profiles
FOR ALL
USING (
  auth.uid() = id 
  AND 
  (
    SELECT email_confirmed_at 
    FROM auth.users 
    WHERE id = auth.uid()
  ) IS NOT NULL
);
```

## Configuration actuelle du code

Le code vérifie maintenant :
1. `user.email_confirmed_at` (Supabase Auth)
2. `user.confirmed_at` (backup)
3. Notre table `email_verifications` (système personnalisé)

Si aucune de ces vérifications ne passe, la connexion est bloquée.

## Test de la vérification

### Tester en développement

1. Créez un compte avec un email de test
2. **NE PAS** cliquer sur le lien de vérification
3. Essayez de vous connecter
4. Vous devriez voir : "⚠️ Veuillez confirmer votre adresse email avant de vous connecter"

### Forcer la vérification manuelle (debug)

Si un utilisateur est bloqué injustement, vous pouvez le débloquer via SQL :

```sql
-- Vérifier le statut d'un utilisateur
SELECT id, email, email_confirmed_at, confirmed_at 
FROM auth.users 
WHERE email = 'user@example.com';

-- Forcer la confirmation (ADMIN ONLY)
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email = 'user@example.com';
```

## Variables d'environnement requises

```env
# Dans .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# URL du site (importante pour les emails)
NEXT_PUBLIC_SITE_URL=https://kokyage.com

# Resend pour les emails
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

## Dépannage

### La connexion fonctionne sans vérification

**Cause** : La configuration Supabase "Enable email confirmations" est désactivée

**Solution** :
1. Activez dans Dashboard → Authentication → Settings
2. OU forcez la vérification côté code (déjà fait)

### L'email de vérification n'arrive pas

**Cause** : Configuration Resend ou SMTP incorrecte

**Solution** :
1. Vérifiez la clé API Resend
2. Vérifiez le domaine dans Resend Dashboard
3. Consultez les logs : `app/api/emails/verify-email/route.js`

### "Email already confirmed" mais l'utilisateur ne peut pas se connecter

**Cause** : Incohérence entre Supabase Auth et notre table

**Solution** :
```sql
-- Synchroniser les données
UPDATE auth.users 
SET email_confirmed_at = (
  SELECT verified_at 
  FROM email_verifications 
  WHERE user_id = auth.users.id 
  AND verified_at IS NOT NULL
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE email_confirmed_at IS NULL;
```

## Sécurité

✅ Double vérification (Supabase + table custom)  
✅ Déconnexion automatique si non vérifié  
✅ Message clair à l'utilisateur  
✅ Logs pour debug  
✅ Compatible avec Supabase RLS  

## Support

En cas de problème, vérifiez :
1. Les logs de la console navigateur (F12)
2. Les logs Supabase Dashboard → Authentication → Users
3. La table `email_verifications` dans Database
