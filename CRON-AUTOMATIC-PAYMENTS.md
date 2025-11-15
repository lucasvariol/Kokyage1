# Configuration Vercel Cron pour paiements automatiques

## Variables d'environnement à ajouter

Ajoute cette variable dans ton `.env.local` ET dans Vercel (Project Settings > Environment Variables) :

```env
CRON_SECRET=ton_secret_aleatoire_tres_long_et_complexe
```

Génère un secret aléatoire avec :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Configuration

Le fichier `vercel.json` configure un cron job qui s'exécute **chaque jour à 2h du matin** :

```json
{
  "crons": [{
    "path": "/api/cron/process-payments",
    "schedule": "0 2 * * *"
  }]
}
```

### Format cron expliqué
`0 2 * * *` signifie :
- `0` = à la minute 0
- `2` = à l'heure 2 (2h du matin)
- `*` = chaque jour du mois
- `*` = chaque mois
- `*` = chaque jour de la semaine

### Autres exemples de planification

Toutes les heures :
```json
"schedule": "0 * * * *"
```

Toutes les 6 heures :
```json
"schedule": "0 */6 * * *"
```

Chaque jour à minuit :
```json
"schedule": "0 0 * * *"
```

Tous les lundis à 9h :
```json
"schedule": "0 9 * * 1"
```

## Fonctionnement

1. **Vercel Cron** appelle automatiquement `/api/cron/process-payments` selon le planning
2. L'API vérifie le secret pour sécuriser l'appel
3. Recherche toutes les réservations terminées (`end_date < aujourd'hui`)
4. Pour chaque réservation :
   - Libère la caution après 14 jours si pas de litige
   - Utilise les shares pré-calculées (basées sur les variables d'environnement)
   - Transfère automatiquement les montants via Stripe Connect
   - Met à jour `balances_allocated = true`

## Colonnes à ajouter dans Supabase

Exécute ce SQL dans Supabase :

```sql
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS balances_allocated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS host_payout_amount DECIMAL,
ADD COLUMN IF NOT EXISTS kokyage_commission DECIMAL,
ADD COLUMN IF NOT EXISTS host_payout_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS caution_captured_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_reservations_auto_payment 
ON reservations(status, end_date, balances_allocated)
WHERE status = 'confirmed' AND balances_allocated = false;
```

## Tester le cron manuellement

Appelle l'API avec le secret :

```bash
curl -X GET https://ton-site.vercel.app/api/cron/process-payments \
  -H "Authorization: Bearer ton_secret_aleatoire"
```

## Logs et monitoring

Dans Vercel Dashboard :
1. Va dans "Deployments"
2. Clique sur ton deployment
3. Onglet "Functions"
4. Cherche `/api/cron/process-payments`
5. Tu verras tous les logs avec les emojis 🔄 💳 ✅ ❌

## Important

⚠️ **Avant d'activer en production** :
1. Teste d'abord avec quelques réservations tests
2. Vérifie que les transferts Stripe fonctionnent
3. Assure-toi que les hôtes ont configuré leur compte Stripe Connect
4. Active les notifications email pour les erreurs
