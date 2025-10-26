"use client";

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      fontWeight: '600',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': {
        color: '#9ca3af',
      },
      padding: '12px',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444'
    }
  },
  hidePostalCode: true,
};

export default function StripeCardForm({ 
  onPaymentSuccess, 
  onPaymentError, 
  amount, 
  loading,
  setLoading,
  disabled 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Élément de carte non trouvé');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Créer la méthode de paiement
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (createError) {
        setError(createError.message);
        setLoading(false);
        return;
      }

      // Appeler notre API pour traiter le paiement
      onPaymentSuccess(paymentMethod.id);

    } catch (err) {
      setError('Une erreur est survenue lors du traitement du paiement');
      onPaymentError(err);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        padding: '16px',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        marginBottom: '20px',
        background: '#fff'
      }}>
        <CardElement
          options={CARD_ELEMENT_OPTIONS}
          onChange={(event) => {
            setCardComplete(event.complete);
            setError(event.error ? event.error.message : null);
          }}
        />
      </div>

      {error && (
        <div style={{
          color: '#ef4444',
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '16px',
          padding: '12px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px'
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !cardComplete || loading || disabled}
        style={{
          width: '100%',
          background: loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 16,
          padding: '18px 24px',
          fontWeight: 900,
          fontSize: 16,
          cursor: (loading || disabled || !cardComplete) ? 'not-allowed' : 'pointer',
          boxShadow: '0 10px 30px rgba(37,99,235,0.3)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          marginBottom: 16,
          opacity: (!cardComplete || disabled) ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!loading && cardComplete && !disabled) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(37,99,235,0.4)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(37,99,235,0.3)';
        }}
      >
        {loading ? (
          <>
            <div style={{
              width: 20,
              height: 20,
              border: '2px solid #ffffff40',
              borderTop: '2px solid #fff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Traitement en cours...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Confirmer et payer {amount}
          </>
        )}
      </button>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
}