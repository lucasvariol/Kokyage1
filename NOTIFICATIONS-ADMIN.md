# 🔔 Configuration des Notifications Admin

Guide complet pour configurer tous les emails de notification admin sur Kokyage.

---

## 📧 Notifications disponibles

### 1. **Nouveaux utilisateurs** ✅
- Quand : À chaque inscription
- Email : Infos utilisateur (nom, email, date)
- Fichiers : 
  - API: `app/api/admin/notify-new-user/route.js`
  - Trigger: `setup-new-user-notification.sql`
  - Doc: `NEW-USER-NOTIFICATION.md`

### 2. **Logements à modérer** 🏠
- Quand : Un propriétaire valide son logement
- Email : Infos logement (titre, adresse, propriétaire)
- Fichiers :
  - API: `app/api/admin/notify-listing-moderation/route.js`
  - Trigger: `setup-listing-moderation-notification.sql`
  - Doc: `LISTING-MODERATION-NOTIFICATION.md`

---

## ⚡ Installation rapide (recommandé)

### Étape 1 : Configuration Supabase

Ouvrez le **SQL Editor** dans Supabase et exécutez :

**Option A - Tout installer en une fois :**
```sql
-- Copiez le contenu de activer-toutes-notifications.sql
```

**Option B - Installer séparément :**
```sql
-- 1. Activer pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Installer la notification nouveaux utilisateurs
-- Copiez le contenu de setup-new-user-notification.sql

-- 3. Installer la notification logements
-- Copiez le contenu de setup-listing-moderation-notification.sql
```

### Étape 2 : Configuration Vercel

Allez dans **Vercel Dashboard** > **Settings** > **Environment Variables**

Vérifiez/ajoutez :
```env
ADMIN_EMAIL=votre-email@gmail.com
RESEND_API_KEY=re_xxxxx (déjà configuré)
NEXT_PUBLIC_SITE_URL=https://kokyage.com
```

Si vous modifiez des variables, **redéployez** le projet.

### Étape 3 : Test

**Test nouveaux utilisateurs :**
1. Créez un nouveau compte sur `/inscription`
2. Vérifiez votre email admin

**Test logements à modérer :**
1. Créez un logement sur `/ajout-logement`
2. Validez-le en tant que propriétaire (via le lien reçu par email)
3. Vérifiez votre email admin

---

## 🔍 Diagnostic

Exécutez ce script pour vérifier la configuration :

```sql
-- Vérifier pg_net
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') 
    THEN '✅ pg_net installé'
    ELSE '❌ pg_net NON installé'
  END as status_pg_net;

-- Vérifier les fonctions
SELECT 
  proname as function_name,
  '✅ Existe' as status
FROM pg_proc 
WHERE proname IN ('notify_new_user', 'notify_listing_for_moderation');

-- Vérifier les triggers
SELECT 
  tgname as trigger_name,
  CASE tgenabled
    WHEN 'O' THEN '✅ Actif'
    WHEN 'D' THEN '❌ Désactivé'
    ELSE '⚠️ État inconnu'
  END as status
FROM pg_trigger 
WHERE tgname IN ('on_new_user_created', 'on_listing_ready_for_moderation');
```

**Résultat attendu :**
- ✅ pg_net installé
- ✅ 2 fonctions existent
- ✅ 2 triggers actifs

---

## 🔧 Dépannage

### Les emails ne s'envoient pas

#### 1. Vérifier les logs Supabase
**Supabase** > **Logs** > **Postgres Logs**

Cherchez :
- `notification sent with request_id`
- `Failed to send notification`

#### 2. Vérifier les logs Vercel
**Vercel** > **Deployments** > **Logs**

Cherchez :
- Appels à `/api/admin/notify-new-user`
- Appels à `/api/admin/notify-listing-moderation`

#### 3. Vérifier Resend
[resend.com](https://resend.com) > **Emails**

Vérifiez si les emails sont :
- ✅ Envoyés avec succès
- ⚠️ En attente
- ❌ Bloqués (vérifiez les quotas)

#### 4. Test manuel de l'API

**Nouveaux utilisateurs :**
```bash
curl -X POST https://kokyage.com/api/admin/notify-new-user \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "profiles",
    "record": {
      "id": "test-123",
      "name": "Test User",
      "email": "test@example.com",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }'
```

**Logements à modérer :**
```bash
curl -X POST https://kokyage.com/api/admin/notify-listing-moderation \
  -H "Content-Type: application/json" \
  -d '{
    "type": "UPDATE",
    "table": "listings",
    "record": {
      "id": 123,
      "title": "Appartement Test",
      "address": "1 rue Test",
      "city": "Paris",
      "email_proprietaire": "owner@example.com",
      "status": "en attente validation modérateur"
    },
    "old_record": {
      "status": "en attente validation propriétaire"
    }
  }'
```

---

## 🎛️ Gestion des triggers

### Désactiver temporairement

```sql
-- Désactiver notification utilisateurs
ALTER TABLE profiles DISABLE TRIGGER on_new_user_created;

-- Désactiver notification logements
ALTER TABLE listings DISABLE TRIGGER on_listing_ready_for_moderation;
```

### Réactiver

```sql
-- Réactiver notification utilisateurs
ALTER TABLE profiles ENABLE TRIGGER on_new_user_created;

-- Réactiver notification logements
ALTER TABLE listings ENABLE TRIGGER on_listing_ready_for_moderation;
```

### Supprimer

```sql
-- Supprimer trigger utilisateurs
DROP TRIGGER IF EXISTS on_new_user_created ON profiles;
DROP FUNCTION IF EXISTS notify_new_user();

-- Supprimer trigger logements
DROP TRIGGER IF EXISTS on_listing_ready_for_moderation ON listings;
DROP FUNCTION IF EXISTS notify_listing_for_moderation();
```

---

## 📊 Statistiques

### Nouveaux utilisateurs (7 derniers jours)

```sql
SELECT 
  COUNT(*) as total_users,
  DATE(created_at) as date
FROM profiles
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Logements en attente de modération

```sql
SELECT 
  COUNT(*) as total_pending,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/3600) as avg_hours_waiting
FROM listings
WHERE status = 'en attente validation modérateur';
```

### Détail des logements en attente

```sql
SELECT 
  id,
  title,
  city,
  email_proprietaire,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_waiting
FROM listings
WHERE status = 'en attente validation modérateur'
ORDER BY created_at ASC;
```

---

## 🔐 Sécurité

- ✅ Les triggers utilisent `SECURITY DEFINER` pour s'exécuter avec les permissions appropriées
- ✅ Les erreurs sont capturées et n'interrompent pas les opérations (utilisateur peut s'inscrire même si la notification échoue)
- ✅ Les tokens et IPs sont loggés pour traçabilité
- ✅ Seul l'admin reçoit les notifications (via `ADMIN_EMAIL`)

---

## 📚 Documentation détaillée

- [NEW-USER-NOTIFICATION.md](NEW-USER-NOTIFICATION.md) - Notifications nouveaux utilisateurs
- [LISTING-MODERATION-NOTIFICATION.md](LISTING-MODERATION-NOTIFICATION.md) - Notifications logements
- [FIX-SIGNUP-ERROR.md](FIX-SIGNUP-ERROR.md) - Résolution du bug "Database error saving new user"

---

## 💡 Notifications futures possibles

Vous pouvez créer des triggers similaires pour :
- 📝 Nouvelles réservations créées
- 💬 Messages non lus depuis X heures
- ⭐ Nouveaux avis déposés
- 💰 Virements à effectuer
- 🚨 Signalements de contenu
- 📊 Rapport journalier/hebdomadaire

Le pattern est toujours le même :
1. Créer une API route dans `app/api/admin/`
2. Créer une fonction trigger en SQL
3. Attacher le trigger à la bonne table
