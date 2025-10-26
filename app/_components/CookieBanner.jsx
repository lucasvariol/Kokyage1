'use client';

import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà accepté les cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0, 0, 0, 0.1)',
      boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.15)',
      padding: '24px',
      animation: 'slideUp 0.4s ease-out'
    }}>
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
      }}>
        {/* Contenu */}
        <div style={{ flex: '1 1 400px', minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🍪</span>
            <div>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#1F2937',
                marginBottom: '8px',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}>
                Nous utilisons des cookies
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#6B7280',
                lineHeight: 1.6,
                margin: 0,
                fontFamily: 'Inter, system-ui, sans-serif'
              }}>
                Nous utilisons des cookies essentiels pour le fonctionnement du site (authentification, paiements) et améliorer votre expérience.{' '}
                <a 
                  href="/privacy" 
                  style={{ 
                    color: '#4ECDC4', 
                    textDecoration: 'none', 
                    fontWeight: 600,
                    borderBottom: '1px solid transparent',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.borderBottomColor = '#4ECDC4'}
                  onMouseLeave={(e) => e.target.style.borderBottomColor = 'transparent'}
                >
                  En savoir plus
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <button
            onClick={handleReject}
            style={{
              padding: '12px 24px',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#6B7280',
              background: 'transparent',
              border: '2px solid #E5E7EB',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, system-ui, sans-serif',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#9CA3AF';
              e.target.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#E5E7EB';
              e.target.style.color = '#6B7280';
            }}
          >
            Refuser
          </button>

          <button
            onClick={handleAccept}
            style={{
              padding: '12px 32px',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'white',
              background: 'linear-gradient(135deg, #4ECDC4 0%, #44B5AC 100%)',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(78, 205, 196, 0.3)',
              transition: 'all 0.2s',
              fontFamily: 'Inter, system-ui, sans-serif',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(78, 205, 196, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(78, 205, 196, 0.3)';
            }}
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
