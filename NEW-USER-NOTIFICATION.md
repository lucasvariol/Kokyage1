# Notification Email pour les Nouveaux Utilisateurs

Ce système envoie automatiquement un email à l'administrateur lors de chaque nouvelle inscription.

## 📋 Composants

1. **API Route** : `/api/admin/notify-new-user`
2. **Trigger SQL** : `setup-new-user-notification.sql`
3. **Email via Resend** : Notification formatée avec les informations utilisateur

## ⚙️ Configuration

### 1. Variables d'environnement

Ajoutez dans votre `.env.local` :

```env
# Email de l'administrateur qui recevra les notifications
ADMIN_EMAIL=votre-email@gmail.com

# Déjà configuré normalement
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_APP_URL=https://kokyage.com
```

### 2. Déploiement de l'API

L'API route a été créée dans `app/api/admin/notify-new-user/route.js`.

Déployez sur Vercel avec :
```bash
git add .
git commit -m "feat: add new user notification system"
git push
```

### 3. Configuration Supabase

#### A. Activer l'extension pg_net

Dans le SQL Editor de Supabase :

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

#### B. Configurer l'URL de l'API

Remplacez par votre URL de production :

```sql
ALTER DATABASE postgres SET app.api_url TO 'https://kokyage.com';
```

#### C. Créer le trigger

Exécutez le contenu du fichier `setup-new-user-notification.sql` dans le SQL Editor de Supabase.

## 🧪 Test

Pour tester le système :

1. Créez un nouveau compte sur votre site
2. Vérifiez que vous recevez un email sur `ADMIN_EMAIL`

### Test manuel de l'API

```bash
curl -X POST https://kokyage.com/api/admin/notify-new-user \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "profiles",
    "record": {
      "id": "test-id",
      "email": "test@example.com",
      "name": "Test User",
      "created_at": "2026-02-17T10:00:00Z"
    }
  }'
```

## 📧 Contenu de l'Email

L'email contient :
- 👤 Nom de l'utilisateur
- 📧 Email
- 🆔 ID utilisateur
- 📅 Date et heure d'inscription
- 🔗 Lien direct vers le dashboard Supabase

## 🔧 Dépannage

### L'email n'est pas envoyé

1. Vérifiez que `pg_net` est activé :
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

2. Vérifiez que l'URL de l'API est configurée :
   ```sql
   SHOW app.api_url;
   ```

3. Vérifiez les logs de l'API sur Vercel

4. Testez manuellement l'API avec curl

### Vérifier si le trigger fonctionne

```sql
-- Voir les triggers sur la table profiles
SELECT * FROM pg_trigger WHERE tgname = 'on_new_user_created';

-- Voir les logs des requêtes HTTP (si disponible)
SELECT * FROM net._http_response ORDER BY created DESC LIMIT 10;
```

## 🎨 Personnalisation

### Changer le destinataire

Modifiez la variable `ADMIN_EMAIL` dans `.env`

### Personnaliser l'email

Éditez le template HTML dans `app/api/admin/notify-new-user/route.js`

### Ajouter d'autres notifications

Créez des triggers similaires pour d'autres événements :
- Nouvelle réservation
- Nouveau logement publié
- Message non lu depuis X jours
- etc.

## 📊 Monitoring

Pour suivre les notifications envoyées, consultez :
- **Vercel Logs** : Voir les appels à l'API
- **Resend Dashboard** : Statut des emails envoyés
- **Supabase Logs** : Exécution du trigger

## 🔐 Sécurité

- L'API n'a pas d'authentification car elle est appelée par Supabase
- Limitez les appels via rate limiting si nécessaire
- Les données sensibles ne sont pas exposées
- Seul l'admin reçoit les notifications
