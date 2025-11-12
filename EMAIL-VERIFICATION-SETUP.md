# Configuration de la vérification d'email personnalisée

## Problème résolu

Par défaut, Supabase envoie des emails de confirmation automatiques avec un template basique et non personnalisable. Cette solution remplace ce système par des emails personnalisés envoyés via Resend avec un design professionnel.

## Étapes de configuration

### 1. Désactiver les emails automatiques de Supabase

Dans votre dashboard Supabase :
1. Allez dans **Authentication** → **Email Templates**
2. Désactivez l'envoi automatique du "Confirm signup" email
   - OU configurez Supabase pour ne pas demander de confirmation email (Authentication → Settings → "Enable email confirmations" → OFF)

**Alternative recommandée :**
Dans **Authentication** → **Settings** :
- Décochez "Enable email confirmations" si vous voulez que les utilisateurs puissent se connecter immédiatement
- OU gardez activé mais personnalisez le template pour rediriger vers votre propre système

### 2. Créer la table de vérification

Exécutez le script SQL dans votre base de données Supabase :

```bash
# Connectez-vous à votre dashboard Supabase
# SQL Editor → New Query → Collez le contenu de create-email-verifications-table.sql
```

Ou utilisez la CLI Supabase :
```bash
supabase db push create-email-verifications-table.sql
```

### 3. Variables d'environnement

Assurez-vous que ces variables sont configurées dans votre `.env.local` :

```env
# Resend (pour l'envoi d'emails)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# URL du site (pour les liens de vérification)
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # ou https://votre-domaine.com en production
```

### 4. Configuration Resend

1. Créez un compte sur [Resend](https://resend.com)
2. Ajoutez et vérifiez votre domaine `kokyage.com`
3. Créez une clé API et ajoutez-la à `.env.local`
4. Configurez le "From" email dans `app/api/emails/verify-email/route.js` :
   ```javascript
   from: 'Kokyage <noreply@kokyage.com>'
   ```

## Flux de vérification

1. **Inscription** (`app/inscription/page.jsx`)
   - L'utilisateur crée son compte
   - Supabase crée l'utilisateur (mais l'email n'est pas encore vérifié)
   - Un email personnalisé est envoyé via `/api/emails/verify-email`

2. **Email de vérification**
   - L'utilisateur reçoit un email avec design Kokyage
   - Le lien contient un token unique : `/verification-email/[token]`
   - Le token expire après 24h

3. **Vérification** (`app/verification-email/[token]/page.jsx`)
   - L'utilisateur clique sur le lien
   - La page appelle `/api/verify-email-token`
   - Le token est validé et l'email marqué comme confirmé dans Supabase Auth
   - Redirection vers la page de connexion

## Fichiers créés

### API Routes
- `app/api/emails/verify-email/route.js` - Envoie l'email de vérification
- `app/api/verify-email-token/route.js` - Valide le token et confirme l'email

### Pages
- `app/verification-email/[token]/page.jsx` - Page de vérification du token

### SQL
- `create-email-verifications-table.sql` - Création de la table

## Personnalisation

### Modifier le design de l'email

Éditez le HTML dans `app/api/emails/verify-email/route.js` :
- Couleurs : Modifiez les gradients `#D79077`, `#C96745`
- Logo : Ajoutez une image dans le header
- Contenu : Personnalisez le texte de bienvenue

### Modifier la durée d'expiration

Dans `app/api/emails/verify-email/route.js` :
```javascript
expiresAt.setHours(expiresAt.getHours() + 24); // Change 24 pour autre durée
```

### Ajouter une limite de tentatives

Ajoutez une colonne `attempts` dans la table et comptez les échecs de vérification.

## Tests

### En développement

1. Inscrivez-vous avec un email de test
2. Vérifiez les logs dans la console
3. Consultez l'email dans Resend Dashboard
4. Testez le lien de vérification

### En production

1. Configurez un domaine vérifié dans Resend
2. Testez avec plusieurs adresses email
3. Vérifiez les emails dans spam/promotions
4. Testez l'expiration (modifiez temporairement à 1 minute)

## Dépannage

### L'email n'est pas reçu
- Vérifiez la clé API Resend
- Vérifiez que le domaine est vérifié dans Resend
- Consultez les logs Resend Dashboard
- Vérifiez le dossier spam

### Le token est invalide
- Vérifiez que la table `email_verifications` existe
- Vérifiez les RLS policies
- Consultez les logs de l'API

### L'utilisateur ne peut pas se connecter
- Vérifiez que `email_confirm: true` est bien défini
- Dans Supabase Dashboard → Authentication → Users, vérifiez que "Email Confirmed At" a une date

## Migration depuis le système Supabase

Si vous avez déjà des utilisateurs avec le système par défaut :

1. Les anciens utilisateurs peuvent toujours se connecter
2. Seuls les nouveaux utilisateurs utilisent le système personnalisé
3. Optionnel : Créez un script de migration pour renvoyer des emails aux utilisateurs non vérifiés

## Sécurité

✅ Les tokens sont générés avec `crypto.randomBytes(32)`  
✅ Les tokens expirent après 24h  
✅ Les tokens ne peuvent être utilisés qu'une fois  
✅ RLS activé sur la table de vérification  
✅ Utilisation du service role key côté serveur uniquement  

## Support

Pour toute question, consultez la documentation :
- [Resend Docs](https://resend.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
