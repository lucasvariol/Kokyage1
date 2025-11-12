'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '../_components/Header';
import Footer from '../_components/Footer';

function NouveauMotDePasseContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  // État de session récupéré depuis le lien de récupération
  const [sessionReady, setSessionReady] = useState(false);

  // Vérifier la présence du token de récupération et initialiser la session Supabase
  useEffect(() => {
    const hash = window.location.hash?.substring(1) || '';
    const hashParams = new URLSearchParams(hash);

    const type = hashParams.get('type');
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');

    if (type !== 'recovery') {
      setError('Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.');
      return;
    }

    async function initSession() {
      try {
        if (access_token && refresh_token) {
          const { data, error: setErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (setErr) {
            console.error('Erreur setSession:', setErr);
            setError("Le lien de réinitialisation a expiré ou n'est pas valide. Veuillez en demander un nouveau.");
            setSessionReady(false);
            return;
          }
          setSessionReady(true);
          // Nettoyer l'URL (enlève les tokens du hash)
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }

        // Si pas de tokens dans l'URL, essayer de récupérer une session existante
        const { data: sess } = await supabase.auth.getSession();
        if (sess?.session) {
          setSessionReady(true);
        } else {
          setError("Session de récupération introuvable. Veuillez rouvrir le lien depuis l'email.");
          setSessionReady(false);
        }
      } catch (e) {
        console.error('Erreur initialisation session:', e);
        setError('Impossible de vérifier la session. Veuillez réessayer via le lien de l’email.');
        setSessionReady(false);
      }
    }

    initSession();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation du mot de passe
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      // Mise à jour du mot de passe via Supabase
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Erreur Supabase:', updateError);
        setError(updateError.message || 'Impossible de mettre à jour le mot de passe');
        return;
      }

      setSuccess('Mot de passe mis à jour avec succès ! Redirection...');
      
      // Redirection vers la page de connexion après 2 secondes
      setTimeout(() => {
        router.push('/inscription?tab=connexion');
      }, 2000);
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
              Nouveau mot de passe
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
                Créer un nouveau mot de passe
              </h2>
              <p style={{ color: '#718096', fontSize: '1rem', lineHeight: 1.6 }}>
                Choisissez un mot de passe sécurisé d'au moins 6 caractères.
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
                  Nouveau mot de passe
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '16px 50px 16px 20px',
                      borderRadius: '12px',
                      border: passwordFocused ? '2px solid #60A29D' : '2px solid #E2E8F0',
                      fontSize: '16px',
                      background: '#F7FAFC',
                      color: '#2D3748',
                      boxShadow: passwordFocused ? '0 4px 20px rgba(96,162,157,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      fontWeight: '500'
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '20px',
                      color: '#718096',
                      padding: '5px'
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

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
                  Confirmer le mot de passe
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '16px 50px 16px 20px',
                      borderRadius: '12px',
                      border: confirmFocused ? '2px solid #60A29D' : '2px solid #E2E8F0',
                      fontSize: '16px',
                      background: '#F7FAFC',
                      color: '#2D3748',
                      boxShadow: confirmFocused ? '0 4px 20px rgba(96,162,157,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      fontWeight: '500'
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '20px',
                      color: '#718096',
                      padding: '5px'
                    }}
                  >
                    {showConfirm ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword || !sessionReady}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: (loading || !password || !confirmPassword || !sessionReady)
                    ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                    : 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: (loading || !password || !confirmPassword || !sessionReady) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: (loading || !password || !confirmPassword || !sessionReady)
                    ? 'none'
                    : '0 4px 20px rgba(201,103,69,0.3)',
                  opacity: (loading || !password || !confirmPassword || !sessionReady) ? 0.7 : 1
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
                    Mise à jour...
                  </div>
                ) : (
                  'Confirmer le nouveau mot de passe'
                )}
              </button>

              {!sessionReady && !error && (
                <p style={{ color: '#718096', fontSize: '14px', textAlign: 'center' }}>
                  Initialisation de la session… Si rien ne se passe, ouvrez le lien directement depuis l’email.
                </p>
              )}

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

export default function NouveauMotDePassePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F5F1ED 0%, #E8E3DC 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            width: '50px',
            height: '50px',
            border: '4px solid rgba(201,103,69,0.2)',
            borderTop: '4px solid #C96745',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '20px', color: '#2D3748', fontSize: '16px' }}>Chargement...</p>
        </div>
      </div>
    }>
      <NouveauMotDePasseContent />
    </Suspense>
  );
}
