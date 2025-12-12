'use client';

import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà accepté les cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setShowBanner(true);
      // Bloquer le scroll quand la bannière est affichée
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
    document.body.style.overflow = 'auto';
    
    // Déclencher un événement personnalisé pour notifier GoogleAnalytics
    window.dispatchEvent(new Event('cookieConsentAccepted'));
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
    document.body.style.overflow = 'auto';
    
    // Déclencher un événement pour notifier le refus
    window.dispatchEvent(new Event('cookieConsentRejected'));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay gris qui bloque l'interaction */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
        animation: 'fadeIn 0.3s ease-out'
      }} />

      {/* Modal centré */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '500px',
        width: 'calc(100% - 32px)',
        padding: '32px 24px 24px',
        animation: 'slideIn 0.4s ease-out'
      }}>
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from {
              transform: translate(-50%, -40%);
              opacity: 0;
            }
            to {
              transform: translate(-50%, -50%);
              opacity: 1;
            }
          }
        `}</style>

        {/* Bouton discret en haut à droite */}
        <button
          onClick={handleReject}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#9CA3AF',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#F3F4F6';
            e.target.style.color = '#6B7280';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#9CA3AF';
          }}
        >
          Continuer sans accepter
        </button>

        {/* Contenu principal */}
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🍪</div>
          
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#1F2937',
            marginBottom: '12px',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            Cookies & Confidentialité
          </h2>

          <p style={{
            fontSize: '0.95rem',
            color: '#6B7280',
            lineHeight: 1.6,
            marginBottom: '24px',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            En poursuivant votre navigation sur ce site, vous acceptez l'utilisation de cookies afin de vous fournir les services que vous demandez expressément et de réaliser des statistiques anonymes de visites pour nous permettre d'améliorer l'expérience utilisateur.
          </p>

          {/* Bouton En savoir plus */}
          <a
            href="/privacy"
            style={{
              display: 'block',
              width: '100%',
              padding: '14px 32px',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#4ECDC4',
              background: 'white',
              border: '2px solid #4ECDC4',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontFamily: 'Inter, system-ui, sans-serif',
              textDecoration: 'none',
              marginBottom: '12px',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#F0FFFE';
              e.target.style.borderColor = '#44B5AC';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#4ECDC4';
            }}
          >
            En savoir plus
          </a>

          {/* Gros bouton Accepter */}
          <button
            onClick={handleAccept}
            style={{
              width: '100%',
              padding: '16px 32px',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'white',
              background: 'linear-gradient(135deg, #4ECDC4 0%, #44B5AC 100%)',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(78, 205, 196, 0.4)',
              transition: 'all 0.3s',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 30px rgba(78, 205, 196, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 20px rgba(78, 205, 196, 0.4)';
            }}
          >
            Accepter et continuer
          </button>
        </div>
      </div>
    </>
  );
}
