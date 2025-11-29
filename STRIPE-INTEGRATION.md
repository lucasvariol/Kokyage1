# Intégration Stripe - Guide de Configuration

Ce document explique comment configurer complètement l'intégration Stripe pour les paiements sécurisés.

## 1. Configuration des clés Stripe

### Ajoutez vos clés dans le fichier `.env.local` :

```bash
# Stripe Configuration
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

### Obtenir vos clés :

1. Créez un compte sur [Stripe Dashboard](https://dashboard.stripe.com/)
2. Récupérez vos clés depuis la section "Developers > API keys"
3. Pour les tests : utilisez les clés commençant par `pk_test_` et `sk_test_`
4. Pour la production : utilisez les clés commençant par `pk_live_` et `sk_live_`

## 2. Structure des tables Supabase

Assurez-vous d'avoir ces colonnes dans votre table `reservations` :

```sql
-- Ajout de colonnes pour Stripe
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR;
```

## 3. Numéros de cartes de test

Pour tester l'intégration, utilisez ces numéros de cartes valides :

### Cartes de test qui fonctionnent :
- **4242424242424242** (Visa) - Toujours acceptée
- **4000000000000002** (Visa) - Toujours refusée
- **4000000000009995** (Visa) - Fonds insuffisants
- **4000002760003184** (Visa) - Nécessite authentification 3D Secure

### Autres informations de test :
- **Date d'expiration** : N'importe quelle date future (ex: 12/25)
- **CVV** : N'importe quel code à 3 chiffres (ex: 123)
- **Code postal** : N'importe quel code postal valide

## 4. Gestion des webhooks Stripe (optionnel mais recommandé)

Pour une intégration robuste, configurez les webhooks Stripe :

```javascript
// app/api/webhooks/stripe/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Traiter les événements Stripe
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Mettre à jour la réservation comme payée
        console.log('Paiement réussi:', paymentIntent.id);
        break;
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        // Gérer l'échec du paiement
        console.log('Paiement échoué:', failedPayment.id);
        break;
      
      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erreur webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## 5. Configuration des webhooks dans Stripe Dashboard

1. Allez dans **Developers > Webhooks** dans votre dashboard Stripe
2. Cliquez sur **"Add endpoint"**
3. URL de l'endpoint : `https://votre-domaine.com/api/webhooks/stripe`
4. Sélectionnez ces événements :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.requires_action`

## 6. Sécurité et bonnes pratiques

### 6.1 Validation côté serveur
- Toujours valider les montants côté serveur
- Ne jamais faire confiance aux données côté client
- Vérifier l'authenticité des webhooks avec la signature

### 6.2 Gestion des erreurs
- Implémenter une gestion complète des erreurs Stripe
- Logger tous les événements de paiement
- Prévoir des mécanismes de retry pour les échecs temporaires

### 6.3 Conformité PCI DSS
- Stripe gère la conformité PCI DSS
- Ne jamais stocker les données de carte côté serveur
- Utiliser Stripe Elements pour sécuriser la saisie des cartes

### 6.4 Configuration de production
```bash
# Variables d'environnement de production
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 7. Tests et validation

### 7.1 Tests automatisés
- Tester les paiements réussis
- Tester les paiements échoués
- Tester les cas d'authentification 3D Secure

### 7.2 Tests manuels
- Tester avec différents types de cartes
- Vérifier les webhooks en local avec Stripe CLI
- Tester les remboursements et annulations

### 7.3 Commandes Stripe CLI utiles
```bash
# Installer Stripe CLI
npm install -g stripe-cli

# Se connecter à votre compte
stripe login

# Écouter les webhooks en local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Tester un paiement
stripe payment_intents create --amount=2000 --currency=eur
```

## 8. Mise en production

1. **Changez les clés** pour les clés de production (`pk_live_`, `sk_live_`)
2. **Configurez les webhooks** en production avec la vraie URL
3. **Activez votre compte Stripe** (vérification d'identité requise)
4. **Testez avec de petits montants** avant le lancement complet
5. **Configurez les notifications** d'erreur et de surveillance

## 9. Monitoring et analytics

- Utilisez le dashboard Stripe pour surveiller les transactions
- Configurez des alertes pour les échecs de paiement
- Analysez les taux de conversion et d'abandon

Pour plus d'informations, consultez la [documentation officielle Stripe](https://stripe.com/docs).