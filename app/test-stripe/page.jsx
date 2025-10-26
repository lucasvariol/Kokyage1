'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useState } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

function TestStripeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const testPayment = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/payment/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 2000, // 20€
          currency: 'eur',
          metadata: {
            listing_id: 'test-123',
            guest_count: '2',
            checkin: '2024-01-15',
            checkout: '2024-01-17'
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ PaymentIntent créé avec succès! ID: ${data.paymentIntent.id}`);
      } else {
        setMessage(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Erreur réseau: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Test de l'API Stripe</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">Test de création PaymentIntent</h3>
          <p className="text-sm text-gray-600 mb-3">
            Ce test vérifie que l'API Stripe fonctionne en créant un PaymentIntent de 20€.
          </p>
          <button
            onClick={testPayment}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Test en cours...' : 'Tester l\'API Stripe'}
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded text-sm ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="p-4 bg-blue-50 rounded">
          <h3 className="font-medium mb-2">Variables d'environnement</h3>
          <div className="text-xs space-y-1">
            <div>
              <strong>Public Key:</strong> {
                process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY 
                  ? `${process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY.substring(0, 20)}...` 
                  : '❌ Non définie'
              }
            </div>
            <div>
              <strong>Status:</strong> {
                process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY?.startsWith('pk_test_')
                  ? '✅ Mode test'
                  : process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY?.startsWith('pk_live_')
                  ? '🔴 Mode production'
                  : '❌ Clé invalide'
              }
            </div>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
          <h3 className="font-medium mb-2 text-yellow-800">Instructions de test</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p><strong>1.</strong> Cliquez sur "Tester l'API Stripe"</p>
            <p><strong>2.</strong> Vérifiez que le PaymentIntent est créé</p>
            <p><strong>3.</strong> Consultez le dashboard Stripe pour voir la transaction</p>
            <p><strong>4.</strong> Si ça marche, testez le flux complet depuis /logements</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestStripePage() {
  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Test Intégration Stripe
            </h1>
            <p className="text-gray-600">
              Page de diagnostic pour vérifier que Stripe fonctionne correctement
            </p>
          </div>

          <TestStripeForm />

          <div className="mt-8 text-center">
            <a 
              href="/logements" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← Retour aux logements pour tester le flux complet
            </a>
          </div>
        </div>
      </div>
    </Elements>
  );
}