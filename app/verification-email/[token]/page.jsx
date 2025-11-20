'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/app/_components/Header';
import Footer from '@/app/_components/Footer';

export default function VerifyEmailPage({ params }) {
  const [status, setStatus] = useState('loading'); // loading, success, error, expired
  const [message, setMessage] = useState('');
  const router = useRouter();
  const token = params.token;

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant');
      return;
    }

    verifyEmail();
  }, [token]);

  async function verifyEmail() {
    try {
      // Appeler l'API de vérification
      const response = await fetch('/api/verify-email-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Votre email a été vérifié avec succès ! Vous allez être redirigé vers la page de connexion...');
        
        // Redirection après 3 secondes
        setTimeout(() => {
          router.push('/inscription');
        }, 3000);
      } else if (data.expired) {
        setStatus('expired');
        setMessage('Ce lien de vérification a expiré. Veuillez demander un nouveau lien.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Erreur lors de la vérification de votre email');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setStatus('error');
      setMessage('Une erreur est survenue lors de la vérification');
    }
  }

  return (
    <>
      <Header />
      <main style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(135deg, #F5F1ED 0%, #E8E3DC 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          background: 'white',
          borderRadius: '24px',
          padding: '60px 40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          {status === 'loading' && (
            <>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid #E8E3DC',
                borderTop: '4px solid #C96745',
                borderRadius: '50%',
                margin: '0 auto 30px',
                animation: 'spin 1s linear infinite'
              }}></div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#2D3748',
                marginBottom: '20px'
              }}>
                Vérification en cours...
              </h1>
              <p style={{ color: '#718096', fontSize: '1.1rem' }}>
                Veuillez patienter pendant que nous confirmons votre email.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 30px',
                fontSize: '40px'
              }}>
                ✓
              </div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#2D3748',
                marginBottom: '20px'
              }}>
                Email vérifié !
              </h1>
              <p style={{ color: '#718096', fontSize: '1.1rem', lineHeight: 1.6 }}>
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #F56565 0%, #E53E3E 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 30px',
                fontSize: '40px',
                color: 'white'
              }}>
                ✕
              </div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#2D3748',
                marginBottom: '20px'
              }}>
                Erreur de vérification
              </h1>
              <p style={{ color: '#718096', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '30px' }}>
                {message}
              </p>
              <button
                onClick={() => router.push('/inscription')}
                style={{
                  background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                  color: 'white',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Retour à l'inscription
              </button>
            </>
          )}

          {status === 'expired' && (
            <>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #ED8936 0%, #DD6B20 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 30px',
                fontSize: '40px',
                color: 'white'
              }}>
                ⏱
              </div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#2D3748',
                marginBottom: '20px'
              }}>
                Lien expiré
              </h1>
              <p style={{ color: '#718096', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '30px' }}>
                {message}
              </p>
              <button
                onClick={() => router.push('/inscription')}
                style={{
                  background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                  color: 'white',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Aller à la connexion
              </button>
            </>
          )}
        </div>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
