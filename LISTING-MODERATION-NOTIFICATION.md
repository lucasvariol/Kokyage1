# 🏠 Notification de Modération de Logements

Ce système envoie automatiquement un email à l'administrateur lorsqu'un logement passe au statut "en attente validation modérateur".

## 🎯 Déclencheurs

L'email est envoyé quand :
- Un propriétaire valide son logement (via le lien de vérification)
- Un propriétaire est assigné à un logement existant (via `/api/assign-owner`)
- Un propriétaire réactive un logement mis en pause (via `/api/listings/resume`)

Dans tous ces cas, le statut du logement passe à **"en attente validation modérateur"**.

---

## 📋 Composants

1. **API Route** : `/api/admin/notify-listing-moderation`
2. **Trigger SQL** : `setup-listing-moderation-notification.sql`
3. **Email via Resend** : Notification formatée avec les informations du logement

---

## ⚙️ Configuration

### 1. Variables d'environnement

Déjà configurées normalement :

```env
ADMIN_EMAIL=votre-email@gmail.com
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_SITE_URL=https://kokyage.com
```

### 2. Installation du trigger

Dans le **SQL Editor de Supabase**, exécutez le contenu de `setup-listing-moderation-notification.sql`.

> ⚠️ **Prérequis** : L'extension `pg_net` doit être activée (voir étape suivante).

### 3. Activer pg_net (si pas déjà fait)

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

---

## 📧 Contenu de l'email

L'email contient :
- **Titre du logement**
- **Adresse complète**
- **Email du propriétaire**
- **ID du logement**
- **Lien direct vers la page de modération**
- **Lien pour prévisualiser le logement**

---

## 🧪 Test

1. Créez un nouveau logement via `/ajout-logement`
2. Validez-le en tant que propriétaire (via le lien envoyé par email)
3. Vérifiez que vous recevez l'email de modération

Ou testez manuellement en SQL :

```sql
-- Simuler un changement de statut
UPDATE listings 
SET status = 'en attente validation modérateur'
WHERE id = 123; -- Remplacez par un ID valide
```

---

## 🔍 Vérification

### Vérifier que le trigger est actif

```sql
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'on_listing_ready_for_moderation';
```

### Voir les logs du trigger

Dans **Supabase** > **Logs** > **Postgres Logs**, cherchez :
- `Listing moderation notification sent`
- `Failed to send listing moderation notification`

### Vérifier les appels API

Dans **Vercel** > **Deployments** > **Logs**, cherchez :
- Appels à `/api/admin/notify-listing-moderation`

---

## 🔧 Dépannage

### L'email n'est pas envoyé

1. Vérifiez que `pg_net` est activé :
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

2. Vérifiez les logs Postgres dans Supabase

3. Vérifiez que `ADMIN_EMAIL` est configuré dans Vercel

4. Testez l'API manuellement :
   ```bash
   curl -X POST https://kokyage.com/api/admin/notify-listing-moderation \
     -H "Content-Type: application/json" \
     -d '{
       "type": "UPDATE",
       "table": "listings",
       "record": {
         "id": 123,
         "title": "Test",
         "address": "1 rue Test",
         "city": "Paris",
         "email_proprietaire": "test@example.com",
         "status": "en attente validation modérateur"
       },
       "old_record": {
         "status": "en attente validation propriétaire"
       }
     }'
   ```

---

## 📊 Statistiques

Pour voir tous les logements en attente de modération :

```sql
SELECT 
  id,
  title,
  city,
  email_proprietaire,
  created_at
FROM listings
WHERE status = 'en attente validation modérateur'
ORDER BY created_at DESC;
```

---

## 🎨 Personnalisation

### Changer le destinataire

Modifiez `ADMIN_EMAIL` dans vos variables d'environnement Vercel.

### Personnaliser l'email

Éditez le template HTML dans `app/api/admin/notify-listing-moderation/route.js`.

### Désactiver temporairement

```sql
ALTER TABLE listings DISABLE TRIGGER on_listing_ready_for_moderation;
```

Pour réactiver :

```sql
ALTER TABLE listings ENABLE TRIGGER on_listing_ready_for_moderation;
```

---

## 🔗 Triggers connexes

Ce trigger fonctionne en complément de :
- `on_new_user_created` - Notification lors de nouvelles inscriptions
- Vous pouvez créer d'autres triggers pour :
  - Nouvelles réservations
  - Avis laissés
  - Messages non lus
  - etc.
