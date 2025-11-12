# 🚨 Solution : Désactiver les emails automatiques de Supabase

## Problème

Supabase envoie automatiquement ses propres emails de confirmation en plus de nos emails personnalisés via Resend, créant une confusion pour l'utilisateur.

## ✅ Solution rapide (Recommandé)

### Méthode 1 : Désactiver complètement les emails de confirmation Supabase

1. Allez dans **Supabase Dashboard**
2. **Authentication** → **Providers** → **Email**
3. **Décochez "Confirm email"** ✅

**Résultat** : Supabase ne bloque plus la connexion et n'envoie plus d'email. Notre système personnalisé gère tout.

### Méthode 2 : Vider le template d'email Supabase

Si vous voulez garder l'option "Confirm email" activée pour la sécurité :

1. **Authentication** → **Email Templates**
2. Cliquez sur **"Confirm signup"**
3. Videz complètement le contenu du template (Subject + Body)
4. Sauvegardez

**Résultat** : La vérification est requise mais aucun email n'est envoyé par Supabase.

## 🔧 Configuration recommandée finale

### Dans Supabase Dashboard → Authentication → Providers → Email

```
✅ Enable Email provider: ON
❌ Confirm email: OFF  ← IMPORTANT !
✅ Secure email change: ON
```

### Dans Supabase Dashboard → Authentication → Email Templates

Si vous avez laissé "Confirm email" activé, modifiez le template :

**Confirm signup** :
- **Subject** : (vide)
- **Body** : `<!-- Géré par Resend -->`

## 🎯 Résultat attendu

Après cette configuration :

1. ✅ L'utilisateur s'inscrit
2. ✅ Un seul email est envoyé (via Resend avec design Kokyage)
3. ✅ L'utilisateur clique sur le lien et valide son email
4. ✅ Notre API marque l'email comme vérifié dans Supabase Auth
5. ✅ L'utilisateur peut se connecter

## 🧪 Test

### Avant la modification
- 2 emails reçus (Supabase + Resend)
- Confusion sur quel lien utiliser

### Après la modification
- 1 seul email reçu (Resend)
- Expérience utilisateur claire

## 🔐 Sécurité maintenue

Notre code vérifie toujours :
- `email_verifications.verified_at` (notre table)
- `auth.users.email_confirmed_at` (mis à jour par notre API)
- Blocage à la connexion si non vérifié

## 📝 Code concerné

Le blocage à la connexion se fait dans `/app/inscription/page.jsx` :

```javascript
// Vérifier si l'email est confirmé dans notre système
const { data: verificationData } = await supabase
  .from('email_verifications')
  .select('verified_at')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

// Bloquer si pas vérifié
if (!verificationData || !verificationData.verified_at) {
  setError('Veuillez confirmer votre email...');
  await supabase.auth.signOut();
  return;
}
```

## ❓ FAQ

### Q : Est-ce que c'est sécurisé de désactiver "Confirm email" ?
**R :** Oui, car notre système personnalisé gère la vérification. C'est même plus flexible.

### Q : Et si je veux garder la double vérification ?
**R :** Gardez "Confirm email" activé mais videz le template pour qu'aucun email ne parte.

### Q : Les anciens utilisateurs sont-ils affectés ?
**R :** Non, seuls les nouveaux comptes utilisent le nouveau système.

### Q : Comment migrer les anciens utilisateurs ?
**R :** Exécutez ce SQL pour synchroniser :
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL 
  AND created_at < '2025-11-12';  -- Date de mise en place du nouveau système
```

## 🆘 Support

Si vous recevez toujours deux emails :
1. Vérifiez les logs Supabase : **Authentication** → **Logs**
2. Vérifiez les logs Resend : **Resend Dashboard** → **Logs**
3. Videz le cache navigateur et réessayez
4. Attendez 5 minutes (propagation des changements Supabase)
