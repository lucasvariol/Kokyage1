'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Header() {
  const pathname = usePathname();
  const isActive = (href) => pathname === href;
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  // État de scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Authentification
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setConnected(!!session);
      setLoading(false);
    };
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setConnected(!!session);
    });
    
    return () => subscription?.unsubscribe();
  }, []);

  if (loading) return null;

  // Variables pour les styles
  const isHomePage = pathname === '/';
  const isTransparent = false; // Transparence désactivée
  
  const headerStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    padding: '16px 24px',
    background: isTransparent ? 'transparent' : 'rgba(255,255,255,0.95)',
    backdropFilter: isTransparent ? 'none' : 'blur(20px)',
    borderBottom: isTransparent ? 'none' : '1px solid rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    boxShadow: isTransparent ? 'none' : '0 4px 20px rgba(0,0,0,0.1)'
  };

  const logoStyle = {
    height: scrolled ? '45px' : '55px',
    width: 'auto',
    display: 'block',
    transition: 'all 0.3s ease',
    filter: isTransparent ? 'brightness(0) invert(1)' : 'none'
  };

  const burgerStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: isTransparent ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(10px)',
    border: isTransparent ? '2px solid rgba(255,255,255,0.3)' : '2px solid rgba(96,162,157,0.2)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    zIndex: 101,
    padding: 0,
    outline: 'none'
  };

  const lineStyle = {
    display: 'block',
    width: '18px',
    height: '2px',
    background: isTransparent ? 'white' : '#1f2937',
    borderRadius: '2px',
    margin: '2px 0',
    transition: 'all 0.3s ease'
  };

  return (
    <header style={headerStyle}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        {/* LOGO */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <img src="/logo.png" alt="Kokyage" style={logoStyle} />
        </Link>

        {/* NAVIGATION */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Navigation desktop pour utilisateurs non connectés */}
          {!connected && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Link href="/fonctionnement" style={{
                color: isTransparent ? 'white' : '#374151',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: '500',
                padding: '8px 16px',
                borderRadius: '20px',
                transition: 'all 0.3s ease'
              }}>
                Comment ça marche
              </Link>

              <Link href="/connexion" style={{
                background: 'rgba(96,162,157,0.12)',
                color: '#2D3748',
                padding: '11px 22px',
                borderRadius: '24px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                border: '1px solid rgba(96,162,157,0.25)',
                boxShadow: '0 3px 10px rgba(96,162,157,0.18)',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap'
              }}>
                ✨ Proposer un logement
              </Link>
              
              <Link href="/inscription" style={{
                background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '25px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: '0 4px 15px rgba(215,144,119,0.3)',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap'
              }}>
                🚀 Inscription
              </Link>
            </nav>
          )}

          {/* CTA pour utilisateurs connectés */}
          {connected && (
            <Link href="/ajout-logement" style={{
              background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '25px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 4px 15px rgba(215,144,119,0.3)',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}>
              ✨ Proposer un logement
            </Link>
          )}

          {/* BURGER BUTTON */}
          <button
            onClick={() => setOpen(!open)}
            style={burgerStyle}
            aria-label="Menu"
          >
            <span style={{
              ...lineStyle,
              transform: open ? 'rotate(45deg) translate(5px, 5px)' : 'none'
            }}></span>
            <span style={{
              ...lineStyle,
              opacity: open ? 0 : 1
            }}></span>
            <span style={{
              ...lineStyle,
              transform: open ? 'rotate(-45deg) translate(7px, -6px)' : 'none'
            }}></span>
          </button>
        </div>
      </div>

      {/* MENU MOBILE */}
      {open && (
        <div 
          style={{ 
            position: 'fixed',
            top: 0,
            right: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            zIndex: 200
          }}
          onClick={() => setOpen(false)}
        >
          <div style={{
            position: 'absolute',
            top: '80px',
            right: '24px',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '32px 24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            minWidth: '280px',
            maxWidth: '320px'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {connected ? (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <Link href="/ajout-logement" style={{
                    background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '14px',
                    display: 'block',
                    textAlign: 'center'
                  }}>
                    ✨ Proposer un logement
                  </Link>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ 
                    color: '#6b7280', 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    textTransform: 'uppercase', 
                    margin: '0 0 12px 0'
                  }}>Navigation</h4>
                  
                  <Link href="/messages" style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#374151',
                    textDecoration: 'none',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginBottom: '8px',
                    gap: '12px'
                  }}>
                    💬 Messages
                  </Link>
                  
                  <Link href="/reservations" style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#374151',
                    textDecoration: 'none',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginBottom: '8px',
                    gap: '12px'
                  }}>
                    📅 Réservations
                  </Link>
                  
                  <Link href="/profil-hote" style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#374151',
                    textDecoration: 'none',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginBottom: '8px',
                    gap: '12px'
                  }}>
                    🏠 Profil hôte
                  </Link>
                </div>

                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

                <Link href="/profil" style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#374151',
                  textDecoration: 'none',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  marginBottom: '8px',
                  gap: '12px'
                }}>
                  ⚙️ Paramètres
                </Link>

                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

                <button
                  onClick={async () => { 
                    await supabase.auth.signOut(); 
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#dc2626',
                    background: 'none',
                    border: 'none',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    gap: '12px',
                    fontSize: '15px',
                    borderRadius: '12px',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  🚪 Déconnexion
                </button>
              </div>
            ) : (
              <div>
                <h4 style={{ 
                  color: '#6b7280', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  textTransform: 'uppercase', 
                  margin: '0 0 16px 0'
                }}>Navigation</h4>
                
                <Link href="/fonctionnement" style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#374151',
                  textDecoration: 'none',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  marginBottom: '12px',
                  gap: '12px'
                }}>
                  ❓ Comment ça marche
                </Link>

                <Link href="/ajout-logement" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1F2937',
                  background: 'rgba(96,162,157,0.12)',
                  border: '1px solid rgba(96,162,157,0.25)',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  gap: '12px',
                  fontWeight: '600'
                }}>
                  ✨ Proposer un logement
                </Link>

                <Link href="/inscription" style={{
                  background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                  color: 'white',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '16px'
                }}>
                  🚀 Inscription gratuite
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}