# Nouvelle logique de caution - SetupIntent manuel

## Principe

La caution n'est plus gérée automatiquement. Au lieu d'un PaymentIntent qui s'active selon la proximité de l'événement, nous utilisons maintenant un **SetupIntent** qui :

1. ✅ Enregistre la carte du voyageur lors de la réservation
2. ✅ Reste en standby (aucun débit automatique)
3. ✅ Ne sera activé **manuellement** que s'il y a un litige déclaré

## Avantages

- **Pas de gestion complexe** : plus besoin de surveiller les dates d'arrivée pour activer/libérer
- **Moins de risques** : pas d'autorisation qui expire avant la fin du séjour
- **Plus flexible** : activation uniquement si nécessaire
- **Meilleure UX** : pas de blocage de 300€ systématique sur la carte

## Workflow

### 1. Lors de la réservation

**Fichier** : [`app/api/payment/stripe/route.js`](app/api/payment/stripe/route.js)

```javascript
// Création d'un SetupIntent au lieu d'un PaymentIntent
const setupIntent = await stripe.setupIntents.create({
  payment_method: paymentMethodToUse,
  customer: customer.id,
  confirm: true,
  usage: 'off_session', // Permet de charger la carte plus tard
  description: 'Enregistrement carte pour caution - activation manuelle si litige',
  metadata: {
    type: 'caution_setup',
    max_amount: '30000', // 300€ max (info uniquement)
    note: 'Carte en standby - débit uniquement si litige déclaré'
  }
});
```

Le `setup_intent_id` est stocké dans la table `reservations` avec `caution_status = 'setup'`.

### 2. Pendant le séjour

**Rien n'est fait automatiquement.**

La carte reste enregistrée en standby.

### 3. En cas de litige

**Activation manuelle** (à implémenter dans l'interface admin) :

```javascript
// Créer un PaymentIntent avec la carte enregistrée
const paymentIntent = await stripe.paymentIntents.create({
  amount: montantDuLitige, // Montant réel du litige (max 30000 = 300€)
  currency: 'eur',
  customer: customerId,
  payment_method: paymentMethodId, // Récupéré depuis le SetupIntent
  off_session: true,
  confirm: true,
  description: `Caution prélevée - Litige réservation #${reservationId}`,
  metadata: {
    reservation_id: reservationId,
    type: 'caution_capture',
    dispute_reason: 'description du litige'
  }
});

// Mettre à jour la réservation
await supabase
  .from('reservations')
  .update({
    caution_status: 'captured',
    caution_amount_captured: montantDuLitige / 100,
    caution_captured_at: new Date().toISOString()
  })
  .eq('id', reservationId);
```

### 4. Si pas de litige

**Libération manuelle** ou simplement laisser expirer le SetupIntent (il n'y a aucun montant bloqué).

Optionnel : mettre à jour le statut pour traçabilité :

```javascript
await supabase
  .from('reservations')
  .update({
    caution_status: 'released',
    caution_released_at: new Date().toISOString()
  })
  .eq('id', reservationId);
```

## Statuts de caution

| Statut | Description |
|--------|-------------|
| `NULL` | Pas de caution (ancienne réservation ou erreur) |
| `setup` | Carte enregistrée via SetupIntent, en standby |
| `captured` | Caution prélevée manuellement suite à un litige |
| `released` | Caution libérée manuellement (optionnel, pour traçabilité) |

## Colonnes de la table reservations

```sql
setup_intent_id TEXT           -- ID du SetupIntent Stripe
caution_status TEXT            -- Statut : setup, captured, released, NULL
caution_amount_captured DECIMAL -- Montant capturé en cas de litige
caution_captured_at TIMESTAMP  -- Date de capture si litige
caution_released_at TIMESTAMP  -- Date de libération (optionnel)
payment_method_id TEXT         -- PaymentMethod enregistré
```

## Migration depuis l'ancienne logique

Exécutez le script SQL : [`update-caution-setup-intent.sql`](update-caution-setup-intent.sql)

## CRON

Le CRON [`app/api/cron/process-payments/route.js`](app/api/cron/process-payments/route.js) ne gère **plus du tout** la caution :

- ❌ Plus de création automatique d'empreinte bancaire
- ❌ Plus de libération automatique après 14 jours
- ✅ Focus uniquement sur la répartition des revenus

## À implémenter

Pour compléter cette nouvelle logique, il faudra créer une interface admin permettant de :

1. **Voir les réservations** avec leur statut de caution
2. **Déclarer un litige** et saisir le montant à prélever
3. **Capturer la caution** manuellement
4. **Voir l'historique** des captures et libérations

Exemple d'interface :

```jsx
// Page admin : /admin/reservations/[id]
function ReservationCautionPanel({ reservation }) {
  const [disputeAmount, setDisputeAmount] = useState(0);
  const [disputeReason, setDisputeReason] = useState('');

  const handleCaptureDeposit = async () => {
    await fetch('/api/admin/capture-deposit', {
      method: 'POST',
      body: JSON.stringify({
        reservationId: reservation.id,
        amount: disputeAmount,
        reason: disputeReason
      })
    });
  };

  if (reservation.caution_status === 'setup') {
    return (
      <div>
        <h3>Caution en standby (carte enregistrée)</h3>
        <input 
          type="number" 
          max="300" 
          value={disputeAmount}
          onChange={(e) => setDisputeAmount(e.target.value)}
          placeholder="Montant du litige (max 300€)"
        />
        <textarea 
          value={disputeReason}
          onChange={(e) => setDisputeReason(e.target.value)}
          placeholder="Raison du litige"
        />
        <button onClick={handleCaptureDeposit}>
          Prélever la caution
        </button>
      </div>
    );
  }

  return <div>Statut : {reservation.caution_status}</div>;
}
```

## Notes importantes

- ⚠️ Le SetupIntent n'a **pas de montant bloqué** : c'est juste un enregistrement de carte
- ⚠️ Vous devez **créer un PaymentIntent** au moment du litige pour prélever effectivement
- ⚠️ Le montant peut être inférieur à 300€ selon le litige réel
- ✅ Pas de problème d'expiration d'autorisation (plus de extended_authorization requis)
- ✅ Plus simple à gérer et à expliquer aux utilisateurs
