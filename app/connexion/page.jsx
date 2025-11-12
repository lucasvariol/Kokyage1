'use client';

import Header from '../_components/Header';
import Footer from '../_components/Footer';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function ConnexionContent(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [activeTab, setActiveTab] = useState('connexion');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/profil';

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message || 'Erreur de connexion');
      setLoading(false);
      return;
    }

    const user = data.user;
    
    // Vérifier si l'email est confirmé
    if (user && !user.email_confirmed_at) {
      setError('Veuillez confirmer votre adresse email avant de vous connecter. Consultez votre boîte mail.');
      setLoading(false);
      
      // Déconnecter l'utilisateur
      await supabase.auth.signOut();
      return;
    }
    if (user) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        const fullName = user.user_metadata?.full_name ||
          `${user.user_metadata?.prenom || ''} ${user.user_metadata?.nom || ''}`.trim() ||
          user.email.split('@')[0];

        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          name: fullName
        });
        if (insertError) {
          console.warn('Impossible de créer le profil immédiatement:', insertError.message);
        }
      }
    }

    setSuccess('Connexion réussie ! Redirection en cours...');
    setLoading(false);
    setTimeout(() => router.push(redirectUrl), 1200);
  }

  return (<>
    <Header />
    <main style={{
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #F5F1ED 0%, #E8E3DC 100%)',
      minHeight: '100vh',
      paddingBottom: 0
    }}>
      <section className="auth-hero-section" style={{
        background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
        padding: '60px 24px 90px',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '18%',
          left: '10%',
          width: '150px',
          height: '150px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '55%',
          right: '12%',
          width: '120px',
          height: '120px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>

        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Onglets Connexion / Inscription */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginBottom: '36px',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            padding: '8px',
            borderRadius: '16px',
            maxWidth: '400px',
            margin: '0 auto 36px'
          }}>
            <button
              onClick={() => setActiveTab('connexion')}
              style={{
                flex: 1,
                padding: '14px 28px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'connexion' 
                  ? 'rgba(255,255,255,0.95)' 
                  : 'transparent',
                color: activeTab === 'connexion' ? '#C96745' : 'white',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === 'connexion' 
                  ? '0 4px 12px rgba(0,0,0,0.1)' 
                  : 'none'
              }}
            >
              Connexion
            </button>
            <button
              onClick={() => router.push('/inscription')}
              style={{
                flex: 1,
                padding: '14px 28px',
                borderRadius: '12px',
                border: 'none',
                background: 'transparent',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Inscription
            </button>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3.25rem)',
            fontWeight: 800,
            marginBottom: '18px',
            letterSpacing: '-0.02em',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.23)'
          }}>
            Bon retour
          </h1>
        </div>
      </section>

      <section style={{ padding: '0 24px 80px', transform: 'translateY(-50px)' }}>
        <div className="auth-card-modern" style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '44px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.2)',
          maxWidth: '480px',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{
              fontSize: '1.65rem',
              fontWeight: 700,
              color: '#2D3748'
            }}>
              Se connecter
            </h2>
          </div>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                placeholder="vous@exemple.com"
              />
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
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                style={{
                  width: '100%',
                  padding: '16px 20px',
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
                placeholder="Votre mot de passe"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <a
                  href="/reset-password"
                  style={{ color: '#C96745', fontSize: '0.85rem', fontWeight: 600 }}
                  onMouseEnter={e => e.target.style.color = '#D79077'}
                  onMouseLeave={e => e.target.style.color = '#C96745'}
                >
                  Mot de passe oublié ?
                </a>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  Minimum 6 caractères
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                width: '100%',
                padding: '18px 24px',
                borderRadius: '12px',
                border: 'none',
                background: (loading || !email || !password)
                  ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                  : 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '700',
                cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: (loading || !email || !password)
                  ? 'none'
                  : '0 4px 20px rgba(201,103,69,0.3)',
                transform: (loading || !email || !password) ? 'none' : 'translateY(0)',
                opacity: (loading || !email || !password) ? 0.7 : 1
              }}
              onMouseEnter={e => {
                if (!loading && email && password) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 30px rgba(201,103,69,0.4)';
                }
              }}
              onMouseLeave={e => {
                if (!loading && email && password) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 20px rgba(201,103,69,0.3)';
                }
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <span className="spinner" style={{
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></span>
                  Connexion en cours...
                </div>
              ) : (
                'Se connecter'
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
                Pas encore de compte ?
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
                Créer un compte Kokyage →
              </a>
            </div>
          </form>
        </div>
      </section>
    </main>
    <Footer />
  </>);
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Chargement...</div>}>
      <ConnexionContent />
    </Suspense>
  );
}
