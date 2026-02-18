# 🔧 FIX: "Database error saving new user"

## ✅ Problème résolu
Le trigger `notify_new_user()` bloquait les inscriptions car il tentait de faire un appel HTTP sans gestion d'erreur.

## Statut actuel
- ✅ **Les inscriptions fonctionnent** (trigger non-bloquant)
- ⚠️ **Les notifications email ne sont pas encore actives**

---

## 🔔 Activer les notifications email

Pour recevoir un email à chaque nouvel utilisateur, suivez ces étapes:

### ÉTAPE 1: Configuration Supabase

1. Allez dans **Supabase Dashboard** > **SQL Editor**

2. **Exécuter le diagnostic** (copiez le contenu de `diagnostic-notification.sql`)
   - Cela vous dira ce qui manque

3. **Activer les notifications** (copiez le contenu de `activer-notifications.sql`)
   - Active `pg_net`
   - Met à jour la fonction avec l'URL de l'API

### ÉTAPE 2: Configuration Vercel

1. Allez dans **Vercel Dashboard** > Votre projet > **Settings** > **Environment Variables**

2. Ajoutez/vérifiez ces variables:
   ```
   ADMIN_EMAIL=votre-email@gmail.com
   RESEND_API_KEY=re_xxxxx (déjà configuré normalement)
   ```

3. **Redéployez** si vous avez modifié les variables

### ÉTAPE 3: Tester

1. Créez un nouveau compte test
2. Vérifiez votre boîte email (et les spams)
3. Vous devriez recevoir une notification avec les infos du nouvel utilisateur

---

## 📁 Fichiers utiles

- `fix-trigger-blocking-signup.sql` - Correctif déjà appliqué ✅
- `diagnostic-notification.sql` - Vérifier la configuration
- `activer-notifications.sql` - Activer les notifications
- `NEW-USER-NOTIFICATION.md` - Documentation complète

---

## 🔍 Dépannage

### Les emails ne s'envoient toujours pas

1. **Vérifier les logs Supabase:**
   - Allez dans Supabase > Logs > Postgres Logs
   - Cherchez "Failed to send new user notification"

2. **Vérifier les logs Vercel:**
   - Allez dans Vercel > Deployments > Logs
   - Cherchez les appels à `/api/admin/notify-new-user`

3. **Vérifier Resend:**
   - Allez sur [resend.com](https://resend.com) > Emails
   - Vérifiez si les emails sont envoyés mais bloqués

### Tester manuellement l'API

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
