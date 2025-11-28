"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from './_components/Header';
import Footer from './_components/Footer';
import Chatbot from './_components/Chatbot';

export default function HomePage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <Header />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F5F1ED 0%, #E8DED2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: '900px',
          width: '100%',
          textAlign: 'center'
        }}>
          {/* Titre principal */}
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: '800',
            color: '#2D3748',
            marginBottom: '20px',
            lineHeight: '1.2'
          }}>
            Bienvenue sur <span style={{ color: '#C96745' }}>Kokyage</span>
          </h1>
          
          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: '#4A5568',
            marginBottom: '60px',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto 60px'
          }}>
            La plateforme de sous-location sécurisée et légale
          </p>

          {/* Cards de choix */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '30px',
            marginBottom: '40px'
          }}>
            {/* Card Voyageur */}
            <div
              onClick={() => router.push('/je-cherche-un-sejour')}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '40px 30px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(201, 103, 69, 0.2)';
                e.currentTarget.style.borderColor = '#C96745';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div style={{
                fontSize: '64px',
                marginBottom: '20px'
              }}>
                🏖️
              </div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#2D3748',
                marginBottom: '15px'
              }}>
                Je cherche un séjour
              </h2>
              <p style={{
                fontSize: '16px',
                color: '#718096',
                lineHeight: '1.6',
                marginBottom: '25px'
              }}>
                Trouvez le logement idéal pour vos prochaines vacances ou votre prochain déplacement
              </p>
              <div style={{
                display: 'inline-block',
                padding: '12px 30px',
                background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                color: 'white',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '16px'
              }}>
                Explorer les logements →
              </div>
            </div>

            {/* Card Hôte */}
            <div
              onClick={() => router.push('/sous-louer')}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '40px 30px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(96, 162, 157, 0.2)';
                e.currentTarget.style.borderColor = '#60A29D';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div style={{
                fontSize: '64px',
                marginBottom: '20px'
              }}>
                🏠
              </div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#2D3748',
                marginBottom: '15px'
              }}>
                Je sous-loue mon logement
              </h2>
              <p style={{
                fontSize: '16px',
                color: '#718096',
                lineHeight: '1.6',
                marginBottom: '25px'
              }}>
                Générez des revenus en sous-louant votre logement de manière légale et sécurisée
              </p>
              <div style={{
                display: 'inline-block',
                padding: '12px 30px',
                background: 'linear-gradient(135deg, #60A29D 0%, #4A8D89 100%)',
                color: 'white',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '16px'
              }}>
                Calculer mes revenus →
              </div>
            </div>
          </div>

          {/* Section avantages */}
          <div style={{
            marginTop: '80px',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '30px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>✓</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2D3748', marginBottom: '8px' }}>
                100% Légal
              </h3>
              <p style={{ fontSize: '14px', color: '#718096' }}>
                Avec l'accord du propriétaire
              </p>
            </div>
            <div>
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>🔒</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2D3748', marginBottom: '8px' }}>
                Sécurisé
              </h3>
              <p style={{ fontSize: '14px', color: '#718096' }}>
                Paiements protégés
              </p>
            </div>
            <div>
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>💰</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2D3748', marginBottom: '8px' }}>
                Rentable
              </h3>
              <p style={{ fontSize: '14px', color: '#718096' }}>
                Optimisez vos revenus
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <Chatbot />
    </>
  );
}
