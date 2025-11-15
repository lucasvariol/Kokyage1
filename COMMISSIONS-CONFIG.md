# Configuration des commissions Kokyage

## Variables d'environnement à ajouter dans Vercel

Allez dans **Vercel Dashboard** → **Project Settings** → **Environment Variables** et ajoutez :

### Commissions (valeurs en décimales)

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `COMMISSION_GUEST` | `0.17` | Commission sur voyageur (17% - frais de plateforme) - **Serveur** |
| `NEXT_PUBLIC_COMMISSION_GUEST` | `0.17` | **Même valeur** - Pour le frontend (calculs côté client) |
| `COMMISSION_HOST` | `0.03` | Commission sur hôtes (3% - prélevée sur le prix de base) |
| `SHARE_PROPRIETOR` | `0.40` | Part du propriétaire (40% sur les 97% restants) |
| `SHARE_MAIN_TENANT` | `0.60` | Part du locataire principal (60% sur les 97% restants) |

**Important** : Les deux variables `COMMISSION_GUEST` et `NEXT_PUBLIC_COMMISSION_GUEST` doivent avoir la **même valeur** pour éviter les incohérences entre frontend et backend.

### Exemples de calcul

**Avec une réservation de 110€/nuit** :
- Hébergement : 110€
- Frais plateforme (17%) : 18.70€
- **Total voyageur** : 128.70€ (+ taxes)

**Répartition après paiement** :
- Commission hôte (3% de 110€) : 3.30€
- Reste à répartir : 106.70€ (97%)
  - Propriétaire (40%) : 42.68€
  - Locataire principal (60%) : 64.02€
- **Kokyage garde** : 18.70€ + 3.30€ = 22.00€

### Comment modifier les commissions

1. Allez dans **Vercel** → **Settings** → **Environment Variables**
2. Modifiez les valeurs (ex: `COMMISSION_GUEST=0.15` pour passer à 15%)
3. **Redéployez** le projet pour appliquer les changements

### Avantages de cette approche

✅ **Sécurisé** : Les taux ne sont pas hardcodés dans le code  
✅ **Flexible** : Changez les commissions sans modifier le code  
✅ **Traçable** : Historique des changements dans Vercel  
✅ **Par environnement** : Différents taux pour dev/staging/prod si besoin

### Valeurs par défaut

Si une variable n'est pas définie, les valeurs par défaut du code s'appliquent (17%, 3%, 40%, 60%).
