# Système de Pénalités d'Annulation Hôte

## Vue d'ensemble

Ce système applique des pénalités financières aux hôtes qui annulent une réservation déjà confirmée, afin de :
- Protéger les voyageurs (remboursement 100% garanti)
- Dissuader les annulations de dernière minute
- Couvrir les frais de transaction de la plateforme
- Maintenir la confiance dans le système

## Règles de Pénalités

Les pénalités sont calculées en **pourcentage du montant total de la réservation** :

| Moment de l'annulation | Taux de pénalité | Exemple (réservation à 200€) |
|------------------------|------------------|------------------------------|
| **> 30 jours** avant l'arrivée | **15%** | 30€ de pénalité |
| **Entre 2 et 30 jours** avant | **25%** | 50€ de pénalité |
| **< 48h avant** ou **après** l'arrivée | **50%** | 100€ de pénalité |

### Calcul du Délai

Le délai est calculé en **jours calendaires** entre :
- La date d'annulation (maintenant)
- La date d'arrivée prévue

**Exemples :**
- Annulation le 10/02 pour arrivée le 15/03 → 33 jours → **15% de pénalité**
- Annulation le 10/02 pour arrivée le 20/02 → 10 jours → **25% de pénalité**
- Annulation le 13/02 pour arrivée le 14/02 → 1 jour → **50% de pénalité**
- Annulation le 16/02 pour arrivée le 15/02 (déjà passée) → **50% de pénalité**

## Fonctionnement Technique

### 1. Affichage de la Pénalité

Avant de confirmer l'annulation, l'hôte voit :
```
⚠️ ATTENTION - Annulation de réservation

Une pénalité de 50,00€ (25%) sera appliquée.
Raison: entre 2 et 30 jours avant l'arrivée

Cette pénalité sera déduite de votre prochain versement.
Le voyageur sera remboursé intégralement.

Voulez-vous vraiment annuler cette réservation ?
```

### 2. Application de la Pénalité

Lors de l'annulation :
1. **Voyageur** : Remboursé à 100% du montant payé (frais Stripe inclus)
2. **Hôte** : 
   - Le solde `penalty_balance` devient négatif (dette)
   - Les parts de revenus (proprietor_share, main_tenant_share) sont mises à 0
3. **Plateforme** : Absorbe les frais Stripe

### 3. Déduction des Pénalités

Les pénalités sont **automatiquement déduites** du prochain virement hôte :

**Exemple :**
- Revenus disponibles : 300€
- Pénalité en attente : -50€
- **Virement effectué : 250€**

Le solde de pénalité est visible dans l'onglet "Paiements" du profil hôte.

## Structure Base de Données

### Table `reservations`

```sql
cancelled_by VARCHAR(10)              -- 'host' ou 'guest'
host_penalty_amount DECIMAL(10, 2)    -- Montant en euros
host_penalty_rate DECIMAL(5, 2)       -- Taux appliqué (15, 25 ou 50)
```

### Table `profiles`

```sql
penalty_balance DECIMAL(10, 2)        -- Solde des pénalités
                                      -- Négatif = dette envers plateforme
                                      -- Positif = crédits (cas rare)
```

## APIs

### Calculer la Pénalité

**Endpoint :** `POST /api/reservations/calculate-host-penalty`

**Body :**
```json
{
  "reservationId": "uuid"
}
```

**Response :**
```json
{
  "success": true,
  "penalty": {
    "rate": 25,
    "amount": 50.00,
    "reason": "entre 2 et 30 jours avant l'arrivée",
    "daysBeforeArrival": 10,
    "totalPrice": 200.00
  }
}
```

### Annuler une Réservation (Hôte)

**Endpoint :** `POST /api/reservations/host-cancel`

**Body :**
```json
{
  "reservationId": "uuid",
  "reason": "Raison de l'annulation"
}
```

**Response :**
```json
{
  "ok": true,
  "message": "Reservation cancelled and refund processed",
  "refundAmount": 200.00,
  "penalty": {
    "amount": 50.00,
    "rate": 25,
    "reason": "Annulation entre 2 et 30 jours avant l'arrivée"
  }
}
```

## Notes Importantes

### Frais Stripe

Les frais Stripe (~1,4% + 0,25€) sont **absorbés par la plateforme** lors d'une annulation hôte.

**Exemple :**
- Paiement voyageur : 200€
- Frais Stripe : 3,05€
- Net reçu plateforme : 196,95€
- Remboursement voyageur : 200€ (100%)
- Pénalité hôte : 50€ (25%)
- **Coût net pour la plateforme : 200€ - 196,95€ - 50€ = -46,95€**

La plateforme récupère donc une partie de ses coûts via la pénalité, mais n'engrange pas de profit sur les annulations hôtes.

### Cas Particuliers

**Réservations non validées :**
- Si l'hôte n'a pas encore accepté la réservation, il doit utiliser "Refuser" au lieu d'"Annuler"
- Aucune pénalité n'est appliquée lors d'un refus

**Multiples annulations :**
- Les pénalités s'accumulent dans `penalty_balance`
- Exemple : -50€ + -30€ + -20€ = -100€ de dette totale

**Solde positif :**
- Cas rare (par exemple, crédit exceptionnel accordé à un hôte)
- S'ajoute au montant du virement

## Migration

Pour activer le système :

1. **Exécuter le SQL :**
```bash
psql -h <host> -U <user> -d <database> -f add-host-penalty-columns.sql
```

2. **Vérifier les colonnes :**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND column_name IN ('cancelled_by', 'host_penalty_amount', 'host_penalty_rate');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'penalty_balance';
```

3. **Redémarrer l'application**

Le système est rétroactif : les nouvelles annulations hôtes appliquent immédiatement les pénalités.

## Monitoring

### Requêtes Utiles

**Voir les annulations hôtes récentes :**
```sql
SELECT 
  r.id,
  r.created_at,
  r.total_price,
  r.host_penalty_amount,
  r.host_penalty_rate,
  r.date_arrivee,
  p.email as host_email
FROM reservations r
JOIN profiles p ON r.host_id = p.id
WHERE r.cancelled_by = 'host'
ORDER BY r.updated_at DESC
LIMIT 20;
```

**Voir les hôtes avec pénalités en cours :**
```sql
SELECT 
  p.id,
  p.email,
  p.penalty_balance,
  p.to_be_paid_to_user,
  COUNT(r.id) as nb_annulations
FROM profiles p
LEFT JOIN reservations r ON r.host_id = p.id AND r.cancelled_by = 'host'
WHERE p.penalty_balance < 0
GROUP BY p.id, p.email, p.penalty_balance, p.to_be_paid_to_user
ORDER BY p.penalty_balance ASC;
```

## Support

Pour toute question sur le système de pénalités :
- Documentation : Ce fichier
- Code API : `app/api/reservations/host-cancel/route.js`
- Code Frontend : `app/profil-hote/page.jsx`
- Email : contact@kokyage.com
