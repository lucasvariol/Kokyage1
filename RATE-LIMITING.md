# 🚦 Configuration Rate Limiting - Upstash Redis

## Pourquoi le Rate Limiting ?

Le rate limiting protège ton application contre :
- **Spam** : Envoi massif de messages/reviews
- **Brute force** : Tentatives de connexion répétées
- **DoS** : Surcharge volontaire du serveur
- **Abus API** : Coûts excessifs (OpenAI, Stripe)

## 📊 Limites configurées

| API | Limite | Fenêtre | Raison |
|-----|--------|---------|--------|
| **Paiements** | 3 requêtes | 5 min | Protection fraude + coûts Stripe |
| **Chatbot** | 20 messages | 1 heure | Coûts OpenAI |
| **Messages** | 10 messages | 1 min | Anti-spam |
| **Réservations** | 10 créations | 1 min | Anti-spam |
| **Reviews** | 10 avis | 1 min | Anti-spam |
| **Authentification** | 5 tentatives | 15 min | Anti-brute force |

## 🔧 Configuration Upstash (GRATUIT)

### Étape 1 : Créer un compte Upstash

1. Va sur **https://upstash.com**
2. Clique sur **Sign up** (ou connecte-toi avec GitHub)
3. Gratuit jusqu'à **10 000 commandes/jour** ✅

### Étape 2 : Créer une base Redis

1. Dans le dashboard Upstash, clique sur **Create Database**
2. Configuration :
   - **Name** : `kokyage-ratelimit`
   - **Type** : Regional (gratuit)
   - **Region** : Europe (West) - Paris ou Frankfurt
   - **Eviction** : No eviction (recommandé)
3. Clique sur **Create**

### Étape 3 : Récupérer les credentials

Dans la page de ta database :

1. Section **REST API** (pas le Redis client classique !)
2. Tu verras :
   ```
   UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxA
   ```

### Étape 4 : Ajouter à Vercel

#### Sur Vercel Dashboard :

1. Va sur ton projet Kokyage
2. **Settings** → **Environment Variables**
3. Ajoute ces 2 variables :

| Name | Value |
|------|-------|
| `UPSTASH_REDIS_REST_URL` | `https://xxxxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | `AxxxxxxxxxxxxxxxxxxxA` |

4. Sélectionne **Production**, **Preview**, **Development**
5. **Save**
6. **Redeploy** le projet

#### En local (.env.local) :

```env
# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxA
```

## ✅ Vérifier que ça fonctionne

### Test 1 : En local

```bash
npm run dev
```

Dans la console, tu NE verras PLUS :
```
⚠️ Rate limiting disabled (Redis not configured)
```

### Test 2 : Tester une limite

1. Va sur https://kokyage.com
2. Envoie **21 messages** au chatbot rapidement
3. Au 21ème message, tu devrais voir :

```json
{
  "error": "Trop de requêtes",
  "message": "Limite atteinte. Réessayez dans 3600 secondes.",
  "retryAfter": 3600
}
```

Headers HTTP reçus :
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-12-12T14:30:00.000Z
Retry-After: 3600
```

### Test 3 : Dashboard Upstash

1. Retourne sur **https://console.upstash.com**
2. Clique sur ta database `kokyage-ratelimit`
3. Onglet **Data Browser**
4. Tu verras des clés comme :
   ```
   @upstash/ratelimit/chatbot:192.168.1.1_Mozilla/5.0
   @upstash/ratelimit/payment:192.168.1.1_Mozilla/5.0
   ```

Chaque clé = un client avec son compteur de requêtes

### Test 4 : Vérifier les métriques

Dans **Analytics** sur Upstash :
- Nombre de commandes
- Latence moyenne
- Erreurs éventuelles

## 🎛️ Personnaliser les limites

Dans `lib/ratelimit.js`, modifie les valeurs :

```javascript
// Plus strict sur le chatbot (5 messages/heure)
export const chatbotRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'), // ← Change ici
  // ...
});

// Plus souple sur les messages (30/min)
export const contentRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'), // ← Change ici
  // ...
});
```

Options de fenêtre :
- `'1 s'` : 1 seconde
- `'1 m'` : 1 minute
- `'1 h'` : 1 heure
- `'1 d'` : 1 jour

## 🔐 Sécurité des credentials

✅ **À FAIRE** :
- Ajouter les variables sur Vercel
- Ne JAMAIS commit `.env.local`
- `.env.example` ne contient que des placeholders

❌ **À NE PAS FAIRE** :
- Hardcoder les URLs/tokens dans le code
- Partager les credentials Upstash
- Utiliser la même database pour dev et prod

## 💰 Coûts

**Tier gratuit Upstash :**
- ✅ 10 000 commandes/jour
- ✅ 256 MB de stockage
- ✅ Pas de carte bancaire requise

**Au-delà du gratuit :**
- $0.20 par 100 000 commandes
- Très peu probable d'atteindre avec Kokyage

## 🚨 Que faire si rate limit atteint ?

### Côté utilisateur :
Le frontend devrait afficher :
```
⏱️ Trop de requêtes. Réessayez dans 5 minutes.
```

### Côté développeur :
Si un utilisateur légitime est bloqué :

1. **Option 1** : Augmenter la limite dans `lib/ratelimit.js`
2. **Option 2** : Whitelist son IP (pour tests)
3. **Option 3** : Attendre l'expiration automatique

## 📊 Monitoring

### Dashboard Upstash
- **Commandes/jour** : Voir si proche de la limite
- **Top clients** : Identifier les IPs abusives
- **Latence** : Vérifier les performances

### Logs Vercel
Rechercher dans les logs :
```
Rate limit exceeded
429 Too Many Requests
```

## 🔄 Désactiver temporairement

Si besoin de désactiver (tests, démo...) :

**Option 1** : Retirer les variables d'environnement sur Vercel

**Option 2** : Modifier `lib/ratelimit.js` :
```javascript
// Forcer le mode dégradé
const redis = null; // Au lieu de la vraie config
```

Le code continue de fonctionner, mais sans limites.

## ✨ Résumé

- ✅ Redis configuré sur Upstash (gratuit)
- ✅ 5 API protégées avec rate limiting
- ✅ Headers HTTP standard (X-RateLimit-*)
- ✅ Messages d'erreur clairs pour utilisateurs
- ✅ Mode dégradé si Redis down (fail open)
- ✅ Prêt pour production

**Prochaine étape** : Tester en production après déploiement Vercel ! 🚀
