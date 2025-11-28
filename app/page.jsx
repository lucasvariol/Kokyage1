"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Petit délai pour s'assurer que tout est rendu avant d'afficher
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleModeSelection = (mode) => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (mode === 'voyageur') {
        router.push('/je-cherche-un-sejour');
      } else {
        router.push('/sous-louer');
      }
    }, 800);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #995741ff 0%, #D68E74 50%, #C96745  100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      opacity: isTransitioning ? 0 : (isReady ? 1 : 0),
      transition: 'opacity 0.8s ease-out'
    }}>
      {/* Animated background particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0
      }}>
        {[...Array(5)].map((_, i) => {
          const size = Math.random() * 300 + 50;
          return (
            <div
              key={i}
              className="floating-bubble"
              style={{
                position: 'absolute',
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: `rgba(255, 255, 255, ${Math.random() * 0.15 + 0.05})`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 20 + 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          );
        })}
      </div>

      {/* Main content */}
      <div className="mode-selection-container" style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        padding: '20px 20px 40px',
        maxWidth: '1100px',
        width: '100%',
        opacity: isTransitioning ? 0 : (isReady ? 1 : 0),
        filter: isTransitioning ? 'blur(20px)' : 'blur(0px)',
        transform: isTransitioning ? 'scale(0.9)' : (isReady ? 'scale(1)' : 'scale(0.95)'),
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '50px', animation: 'fadeInDown 1s ease-out', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img 
            src="/logo.png" 
            alt="Kokyage" 
            style={{ 
              height: 'clamp(120px, 15vw, 150px)', 
              filter: 'brightness(0) invert(1)',
              marginBottom: '20px',
              display: 'block'
            }} 
          />
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            color: 'white',
            marginBottom: '0',
            letterSpacing: '-0.02em',
            textShadow: '0 4px 30px rgba(0,0,0,0.3)'
          }}>
            Bienvenue sur Kokyage
          </h1>
        </div>

        {/* Cards de sélection modernes */}
        <div className="mode-selection-cards" style={{
          display: 'flex',
          gap: '24px',
          maxWidth: '800px',
          margin: '0 auto',
          animation: 'fadeInUp 1s ease-out 0.3s both',
          justifyContent: 'center',
          alignItems: 'stretch',
          flexWrap: 'wrap'
        }}>
          {/* Card Voyageur */}
          <div
            onClick={() => handleModeSelection('voyageur')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '24px',
              padding: '40px 32px',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '18px',
              minHeight: '220px',
              flex: '1 1 360px',
              minWidth: '280px',
              maxWidth: '400px',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
              e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{
              fontSize: '4rem',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
            }}>
              🏖️
            </div>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 1.8rem)',
              fontWeight: 600,
              color: 'white',
              letterSpacing: '-0.02em',
              textAlign: 'center',
              margin: 0,
              textShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              Je cherche un séjour
            </h2>
          </div>

          {/* Card Hôte */}
          <div
            onClick={() => handleModeSelection('hote')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '24px',
              padding: '40px 32px',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '18px',
              minHeight: '220px',
              flex: '1 1 360px',
              minWidth: '280px',
              maxWidth: '400px',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
              e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{
              fontSize: '4rem',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
            }}>
              🏠
            </div>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 1.8rem)',
              fontWeight: 600,
              color: 'white',
              letterSpacing: '-0.02em',
              textAlign: 'center',
              margin: 0,
              textShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              Je sous-loue mon logement
            </h2>
          </div>
        </div>
      </div>

      {/* Animations CSS */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          20% {
            transform: translate(40px, -60px) scale(1.08) rotate(8deg);
          }
          40% {
            transform: translate(-50px, -30px) scale(0.95) rotate(-6deg);
          }
          60% {
            transform: translate(30px, 45px) scale(1.06) rotate(5deg);
          }
          80% {
            transform: translate(-35px, 20px) scale(0.98) rotate(-4deg);
          }
          100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .floating-bubble {
            width: 120px !important;
            height: 120px !important;
            max-width: 120px !important;
            max-height: 120px !important;
          }
          
          .mode-selection-container {
            padding: 28px 16px !important;
          }

          .mode-selection-container > div:first-child {
            margin-bottom: 28px !important;
          }

          .mode-selection-container > div:first-child img {
            height: clamp(90px, 20vw, 120px) !important;
            margin-bottom: 16px !important;
          }

          .mode-selection-container h1 {
            font-size: clamp(1.9rem, 5.5vw, 2.5rem) !important;
            margin-bottom: 4px !important;
          }

          .mode-selection-cards {
            flex-wrap: wrap !important;
            justify-content: center !important;
            gap: 12px !important;
            padding: 0 12px !important;
            max-width: 100% !important;
          }
          
          .mode-selection-cards > div {
            flex: 1 1 calc(50% - 12px) !important;
            min-width: calc(50% - 12px) !important;
            max-width: calc(50% - 12px) !important;
            padding: clamp(22px, 5.5vw, 28px) clamp(16px, 4.5vw, 22px) !important;
            gap: clamp(12px, 3.6vw, 16px) !important;
            min-height: auto !important;
            height: auto !important;
          }
          
          .mode-selection-cards > div > div:first-child {
            font-size: 2.8rem !important;
          }
          
          .mode-selection-cards h2 {
            font-size: clamp(1.25rem, 3.8vw, 1.6rem) !important;
            line-height: 1.28 !important;
          }
        }

        @media (max-width: 480px) {
          .mode-selection-container {
            padding: 24px 12px !important;
          }

          .mode-selection-container > div:first-child img {
            height: clamp(80px, 24vw, 110px) !important;
          }

          .mode-selection-container h1 {
            font-size: clamp(1.75rem, 6.3vw, 2.2rem) !important;
          }

          .mode-selection-cards {
            gap: 10px !important;
          }

          .mode-selection-cards > div {
            flex: 1 1 calc(50% - 10px) !important;
            min-width: calc(50% - 10px) !important;
            max-width: calc(50% - 10px) !important;
            padding: clamp(20px, 6vw, 24px) clamp(14px, 5vw, 18px) !important;
            gap: clamp(10px, 4vw, 14px) !important;
            min-height: auto !important;
            height: auto !important;
          }
          
          .mode-selection-cards > div > div:first-child {
            font-size: 2.4rem !important;
          }
          
          .mode-selection-cards h2 {
            font-size: clamp(1.1rem, 4.2vw, 1.35rem) !important;
          }
        }

        @media (max-width: 380px) {
          .mode-selection-container {
            padding: 20px 10px !important;
          }

          .mode-selection-container h1 {
            font-size: clamp(1.6rem, 6.8vw, 2rem) !important;
          }

          .mode-selection-cards {
            gap: 8px !important;
          }

          .mode-selection-cards > div {
            flex: 1 1 calc(50% - 8px) !important;
            min-width: calc(50% - 8px) !important;
            max-width: calc(50% - 8px) !important;
            padding: clamp(18px, 6.5vw, 22px) clamp(12px, 5.2vw, 16px) !important;
            gap: clamp(8px, 4.5vw, 12px) !important;
          }

          .mode-selection-cards > div > div:first-child {
            font-size: 2.2rem !important;
          }

          .mode-selection-cards h2 {
            font-size: clamp(1.05rem, 5.2vw, 1.3rem) !important;
          }
        }
      `}</style>
    </div>
  );
}
