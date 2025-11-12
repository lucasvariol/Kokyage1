'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../_components/Header';
import Footer from '../_components/Footer';

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Email de réinitialisation envoyé ! Vérifiez votre boîte mail.');
        setEmail('');
        
        // Redirection après 5 secondes
        setTimeout(() => {
          router.push('/inscription?tab=connexion');
        }, 5000);
      } else {
        setError(data.error || 'Une erreur est survenue');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(135deg, #F5F1ED 0%, #E8E3DC 100%)',
        minHeight: '100vh',
        paddingBottom: 0
      }}>
        {/* Hero Section */}
        <section style={{
          background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
          padding: '60px 24px 80px',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '15%',
            left: '8%',
            width: '150px',
            height: '150px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite'
          }}></div>
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '10%',
            width: '120px',
            height: '120px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite reverse'
          }}></div>

          <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 3.25rem)',
              fontWeight: 800,
              marginBottom: '18px',
              letterSpacing: '-0.02em',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.23)'
            }}>
              Mot de passe oublié ?
            </h1>
          </div>
        </section>

        {/* Formulaire */}
        <section style={{ padding: '0 24px 80px', transform: 'translateY(-40px)' }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '48px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#2D3748',
                marginBottom: '12px'
              }}>
                Réinitialiser le mot de passe
              </h2>
              <p style={{ color: '#718096', fontSize: '1rem', lineHeight: 1.6 }}>
                Entrez votre adresse email et nous vous enverrons un lien pour créer un nouveau mot de passe.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ position: 'relative' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#2D3748',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: emailFocused ? '2px solid #60A29D' : '2px solid #E2E8F0',
                    fontSize: '16px',
                    background: '#F7FAFC',
                    color: '#2D3748',
                    boxShadow: emailFocused ? '0 4px 20px rgba(96,162,157,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  placeholder="votre@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: (loading || !email)
                    ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                    : 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: (loading || !email) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: (loading || !email)
                    ? 'none'
                    : '0 4px 20px rgba(201,103,69,0.3)',
                  opacity: (loading || !email) ? 0.7 : 1
                }}
              >
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></span>
                    Envoi en cours...
                  </div>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </button>

              {error && (
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#DC2626',
                  fontSize: '14px',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  color: '#16A34A',
                  fontSize: '14px',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  ✅ {success}
                </div>
              )}

              <div style={{
                textAlign: 'center',
                paddingTop: '24px',
                borderTop: '1px solid #E2E8F0',
                marginTop: '16px'
              }}>
                <p style={{ color: '#718096', fontSize: '14px', marginBottom: '8px' }}>
                  Vous vous souvenez de votre mot de passe ?
                </p>
                <a
                  href="/inscription"
                  style={{
                    color: '#C96745',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={e => e.target.style.color = '#D79077'}
                  onMouseLeave={e => e.target.style.color = '#C96745'}
                >
                  Retour à la connexion →
                </a>
              </div>
            </form>
          </div>
        </section>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
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
