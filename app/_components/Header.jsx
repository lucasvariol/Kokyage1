'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Header({ activeTab, setActiveTab }) {
  const pathname = usePathname();
  const isActive = (href) => pathname === href;
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 820);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

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
    padding: '16px 0px',
    background: isTransparent ? 'transparent' : 'rgba(255,255,255,0.95)',
    backdropFilter: isTransparent ? 'none' : 'blur(20px)',
    borderBottom: isTransparent ? 'none' : '1px solid rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    boxShadow: isTransparent ? 'none' : '0 4px 20px rgba(0,0,0,0.1)',
    width: '100%',
    overflow: 'hidden'
  };

  const logoStyle = {
    height: scrolled ? '45px' : '55px',
    width: 'auto',
    display: 'block',
    transition: 'all 0.3s ease',
    filter: isTransparent ? 'brightness(0) invert(1)' : 'none'
  };

  const secondaryButtonStyle = {
    background: 'rgba(96,162,157,0.12)',
    color: '#2D3748',
    padding: '10px 16px',
    borderRadius: '24px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '13px',
    border: '1px solid rgba(96,162,157,0.25)',
    boxShadow: '0 3px 10px rgba(96,162,157,0.18)',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap'
  };

  const burgerStyle = {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: isTransparent ? 'rgba(255,255,255,0.15)' : 'rgba(96,162,157,0.08)',
    backdropFilter: 'blur(10px)',
    border: isTransparent ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(96,162,157,0.15)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
    zIndex: 101,
    padding: 0,
    outline: 'none'
  };

  const lineStyle = {
    display: 'block',
    width: '20px',
    height: '2.5px',
    background: isTransparent ? 'white' : '#60A29D',
    borderRadius: '2px',
    margin: '2.5px 0',
    transition: 'all 0.3s ease'
  };

  return (
    <>
      <header style={headerStyle}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 20px'
        }}>
          {/* LOGO */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <img src="/logo.png" alt="Kokyage" className="mobile-logo" style={logoStyle} />
          </Link>

          {/* NAVIGATION */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Tab Switcher - Only show on homepage */}
            {pathname === '/' && setActiveTab && (
              <button
                className="mode-switcher-btn"
                onClick={() => setActiveTab(activeTab === 'voyageur' ? 'hote' : 'voyageur')}
                style={{
                  background: 'rgba(96,162,157,0.12)',
                  color: '#2D3748',
                  padding: '10px 16px',
                  borderRadius: '24px',
                  fontWeight: '600',
                  fontSize: '13px',
                  border: '1px solid rgba(96,162,157,0.25)',
                  boxShadow: '0 3px 10px rgba(96,162,157,0.18)',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(96,162,157,0.2)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 5px 15px rgba(96,162,157,0.25)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(96,162,157,0.12)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 3px 10px rgba(96,162,157,0.18)';
                }}
              >
                {activeTab === 'voyageur' ? 'Je sous-loue un logement' : 'Je cherche un séjour'}
              </button>
            )}

            {/* Navigation desktop pour utilisateurs non connectés */}
            {!connected && (
              <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Link href="/fonctionnement" className="desktop-button" style={secondaryButtonStyle}>
                  Comment ça marche
                </Link>
                
                <Link href="/inscription" className="desktop-button" style={{
                  background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                  color: 'white',
                  padding: '11px 18px',
                  borderRadius: '25px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '13px',
                  boxShadow: '0 4px 15px rgba(215,144,119,0.3)',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}>
                Créer un compte
                </Link>
              </nav>
            )}

            {/* Navigation desktop pour utilisateurs connectés */}
            {connected && (
              <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Link href="/fonctionnement" className="desktop-button" style={secondaryButtonStyle}>
                  Comment ça marche
                </Link>
              </nav>
            )}

            {/* CTA pour utilisateurs connectés (caché sur mobile) */}
            {connected && !isMobile && (
              <Link href="/ajout-logement" style={{
                background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                color: 'white',
                padding: '11px 18px',
                borderRadius: '25px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '13px',
                boxShadow: '0 4px 15px rgba(215,144,119,0.3)',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap'
              }}>
                Proposer un logement
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
      </header>

      {/* CSS pour responsive */}
      <style jsx>{`
        @media (max-width: 820px) {
          .desktop-nav {
            display: none !important;
          }
          
          .desktop-link {
            display: none !important;
          }
          
          .desktop-button {
            display: none !important;
          }
        }
        
        @media (max-width: 480px) {
          header {
            padding: 12px 16px !important;
          }
        }
      `}</style>

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
            // Must sit above any page elements (hero/map use very high z-index)
            zIndex: 1000002
          }}
          onClick={() => setOpen(false)}
        >
          <div style={{
            position: 'absolute',
            top: '75px',
            right: '20px',
            left: '20px',
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '28px 24px',
            boxShadow: '0 25px 70px rgba(0,0,0,0.15)',
            border: '1px solid rgba(96,162,157,0.1)',
            maxWidth: '380px',
            margin: '0 auto',
            animation: 'slideIn 0.3s ease-out',
            zIndex: 1000003
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {connected ? (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ 
                    color: '#6b7280', 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    textTransform: 'uppercase', 
                    margin: '0 0 12px 0'
                  }}>ACTIONS</h4>
                  
                  <Link href="/ajout-logement" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                    color: 'white',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '14px',
                    marginBottom: '12px',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(215,144,119,0.25)'
                  }}>
                    🏡 Proposer un logement
                  </Link>
                  
                  <Link href="/fonctionnement" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1F2937',
                    background: 'rgba(96,162,157,0.12)',
                    border: '1px solid rgba(96,162,157,0.25)',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    fontWeight: '600',
                    fontSize: '14px',
                    textDecoration: 'none',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}>
                    ℹ️ Comment ça marche
                  </Link>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ 
                    color: '#6b7280', 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    textTransform: 'uppercase', 
                    margin: '0 0 12px 0'
                  }}>MES ESPACES</h4>
                  
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
                  justifyContent: 'center',
                  color: '#1F2937',
                  background: 'rgba(96,162,157,0.12)',
                  border: '1px solid rgba(96,162,157,0.25)',
                  padding: '20px 24px',
                  borderRadius: '16px',
                  marginBottom: '16px',
                  gap: '12px',
                  fontWeight: '600',
                  fontSize: '16px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}>
                Comment ça marche
                </Link>

                <Link href="/inscription" style={{
                  background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                  color: 'white',
                  padding: '20px 28px',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '17px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '8px',
                  boxShadow: '0 6px 20px rgba(215,144,119,0.25)',
                  transition: 'all 0.2s ease'
                }}>
                Créer un compte
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS pour responsive */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          
          .desktop-link {
            display: none !important;
          }
          
          .desktop-button {
            display: none !important;
          }

          .mode-switcher-btn {
            padding: 8px 12px !important;
            font-size: 11px !important;
            border-radius: 20px !important;
          }
        }
        
        @media (max-width: 480px) {
          header {
            padding: 14px 0px !important;
          }

          .mode-switcher-btn {
            padding: 6px 10px !important;
            font-size: 10px !important;
            border-radius: 18px !important;
          }
          
          header > div {
            padding: 0 16px !important;
          }
          
          .mobile-logo {
            height: 40px !important;
          }
        }
        
        @media (max-width: 360px) {
          header > div {
            padding: 0 12px !important;
          }
        }
      `}</style>
    </>
  );
}