"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '../_components/Header';
import Footer from '../_components/Footer';
import Chatbot from '../_components/Chatbot';
import Link from 'next/link';

function PageContent() {
  const [activeTab, setActiveTab] = useState('concept');
  const searchParams = useSearchParams();
  const contentRef = useRef(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['concept', 'proprietaire', 'locataire', 'faq'].includes(tabParam)) {
      setActiveTab(tabParam);
      // Si un onglet est fourni dans l'URL, on scrolle aussi sur mobile
      if (typeof window !== 'undefined' && window.innerWidth <= 768 && contentRef.current) {
        setTimeout(() => {
          contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [searchParams]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // Scroll vers le contenu sur mobile
    if (window.innerWidth <= 768 && contentRef.current) {
      setTimeout(() => {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #60A29D 0%, #4A8985 100%)',
        padding: '80px 20px 60px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '150px',
          height: '150px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>

        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3.5rem)', 
            fontWeight: 800, 
            marginBottom: '24px',
            letterSpacing: '-0.02em',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            Le principe Kokyage<br />
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            opacity: 0.95, 
            marginBottom: '40px',
            lineHeight: 1.6,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Une plateforme équitable qui met fin à la compétition entre touristes et habitants
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <section style={{
        maxWidth: '1200px',
        margin: '-30px auto 0',
        padding: '0 20px',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          padding: '8px',
          display: 'inline-flex',
          gap: '8px',
          width: '100%',
          maxWidth: '1000px',
          margin: '0 auto',
          position: 'relative',
          left: '50%',
          transform: 'translateX(-50%)',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => handleTabClick('concept')}
            style={{
              flex: '1 1 200px',
              padding: '16px 20px',
              border: 'none',
              borderRadius: '14px',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: activeTab === 'concept' ? '#60A29D' : 'transparent',
              color: activeTab === 'concept' ? 'white' : '#666',
              boxShadow: activeTab === 'concept' ? '0 4px 12px rgba(96,162,157,0.3)' : 'none'
            }}
          >
            💡 Le concept
          </button>
          <button
            onClick={() => handleTabClick('proprietaire')}
            style={{
              flex: '1 1 200px',
              padding: '16px 20px',
              border: 'none',
              borderRadius: '14px',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: activeTab === 'proprietaire' ? '#60A29D' : 'transparent',
              color: activeTab === 'proprietaire' ? 'white' : '#666',
              boxShadow: activeTab === 'proprietaire' ? '0 4px 12px rgba(96,162,157,0.3)' : 'none'
            }}
          >
            👤 Propriétaire
          </button>
          <button
            onClick={() => handleTabClick('locataire')}
            style={{
              flex: '1 1 200px',
              padding: '16px 20px',
              border: 'none',
              borderRadius: '14px',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: activeTab === 'locataire' ? '#60A29D' : 'transparent',
              color: activeTab === 'locataire' ? 'white' : '#666',
              boxShadow: activeTab === 'locataire' ? '0 4px 12px rgba(96,162,157,0.3)' : 'none'
            }}
          >
            🏠 Locataire
          </button>
          <button
            onClick={() => handleTabClick('faq')}
            style={{
              flex: '1 1 200px',
              padding: '16px 20px',
              border: 'none',
              borderRadius: '14px',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: activeTab === 'faq' ? '#60A29D' : 'transparent',
              color: activeTab === 'faq' ? 'white' : '#666',
              boxShadow: activeTab === 'faq' ? '0 4px 12px rgba(96,162,157,0.3)' : 'none'
            }}
          >
            ❓ FAQ
          </button>
        </div>
      </section>

      {/* Content Section */}
      <section ref={contentRef} style={{
        maxWidth: '900px',
        margin: '60px auto',
        padding: '0 20px 80px'
      }}>
        {activeTab === 'concept' && <ConceptContent />}
        {activeTab === 'proprietaire' && <ProprietaireContent />}
        {activeTab === 'locataire' && <LocataireContent />}
        {activeTab === 'faq' && <FAQContent />}
      </section>

      <Footer />
      
      {/* Chatbot */}
      <Chatbot />

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}

function EmailConvictionForm() {
  const [email, setEmail] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setMessage('');

    try {
      const response = await fetch('/api/emails/send-conviction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenantEmail: email,
          tenantName: tenantName,
          ownerName: ownerName 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('✅ Email envoyé avec succès !');
        setEmail('');
        setTenantName('');
        setOwnerName('');
      } else {
        setMessage('❌ Erreur lors de l\'envoi : ' + (data.error || 'Réessayez'));
      }
    } catch (error) {
      setMessage('❌ Erreur lors de l\'envoi. Vérifiez votre connexion.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      marginTop: '60px',
      padding: '40px',
      background: 'linear-gradient(135deg, #60A29D 0%, #4A8985 100%)',
      borderRadius: '20px',
      color: 'white'
    }}>
      <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>
        💬 Convainquez votre locataire
      </h3>
      <p style={{ fontSize: '1.1rem', marginBottom: '12px', opacity: 0.95, maxWidth: '600px', margin: '0 auto 12px', textAlign: 'center' }}>
        Nous lui envoyons un email avec tous les arguments !
      </p>
      <p style={{ fontSize: '0.9rem', marginBottom: '32px', opacity: 0.85, maxWidth: '600px', margin: '0 auto 32px', textAlign: 'center', fontStyle: 'italic' }}>
        🔒 Confidentialité : Nous n'enregistrons aucune donnée.
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Votre nom (ex: Jean Dupont)"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 20px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Nom de votre locataire (ex: Marie Dubois)"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 20px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="email"
            placeholder="Email de votre locataire"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 20px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSending}
          style={{
            width: '100%',
            padding: '16px',
            background: isSending ? '#ccc' : 'white',
            color: isSending ? '#666' : '#60A29D',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '1.1rem',
            cursor: isSending ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isSending) {
              e.target.style.transform = 'scale(1.02)';
              e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
        >
          {isSending ? '📤 Envoi en cours...' : '✉️ Envoyer l\'email'}
        </button>

        {message && (
          <p style={{ 
            marginTop: '20px', 
            textAlign: 'center', 
            fontSize: '1rem',
            padding: '12px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px'
          }}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

function EmailToOwnerForm() {
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setMessage('');

    try {
      const response = await fetch('/api/emails/send-to-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ownerEmail: ownerEmail,
          ownerName: ownerName,
          tenantName: tenantName 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('✅ Email envoyé avec succès !');
        setOwnerEmail('');
        setOwnerName('');
        setTenantName('');
      } else {
        setMessage('❌ Erreur lors de l\'envoi : ' + (data.error || 'Réessayez'));
      }
    } catch (error) {
      setMessage('❌ Erreur lors de l\'envoi. Vérifiez votre connexion.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      marginTop: '60px',
      padding: '40px',
      background: 'linear-gradient(135deg, #60A29D 0%, #4A8985 100%)',
      borderRadius: '20px',
      color: 'white'
    }}>
      <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>
        💬 Convainquez votre propriétaire
      </h3>
      <p style={{ fontSize: '1.1rem', marginBottom: '12px', opacity: 0.95, maxWidth: '600px', margin: '0 auto 12px', textAlign: 'center' }}>
        Envoyez un email à votre propriétaire pour lui présenter Kokyage !
      </p>
      <p style={{ fontSize: '0.9rem', marginBottom: '32px', opacity: 0.85, maxWidth: '600px', margin: '0 auto 32px', textAlign: 'center', fontStyle: 'italic' }}>
        🔒 Confidentialité : Nous n'enregistrons aucune donnée. 
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Votre nom (ex: Marie Dubois)"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 20px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Prénom de votre propriétaire (ex: Jean)"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 20px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="email"
            placeholder="Email de votre propriétaire"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 20px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSending}
          style={{
            width: '100%',
            padding: '16px',
            background: isSending ? '#ccc' : 'white',
            color: isSending ? '#666' : '#60A29D',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '1.1rem',
            cursor: isSending ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isSending) {
              e.target.style.transform = 'scale(1.02)';
              e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
        >
          {isSending ? '📤 Envoi en cours...' : '✉️ Envoyer l\'email'}
        </button>

        {message && (
          <p style={{ 
            marginTop: '20px', 
            textAlign: 'center', 
            fontSize: '1rem',
            padding: '12px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px'
          }}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

function ConceptContent() {
  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
      {/* Section Title */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 800,
          color: '#2D3748',
          marginBottom: '16px',
          letterSpacing: '-0.01em'
        }}>
          Le concept Kokyage
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '700px', margin: '0 auto' }}>
          Une plateforme de sous-location encadrée, légale et équitable
        </p>
      </div>

      {/* Main Concept */}
      <div className="concept-section" style={{
        background: 'linear-gradient(135deg, #60A29D 0%, #4A8985 100%)',
        padding: '48px 40px',
        borderRadius: '20px',
        marginBottom: '50px',
        color: 'white',
        boxShadow: '0 12px 32px rgba(96,162,157,0.3)'
      }}>

        
        <div className="concept-content" style={{ 
          maxWidth: '800px', 
          margin: '10px auto',
          fontSize: '1.15rem',
          lineHeight: 1.8
        }}>


          <div className="revenue-section" style={{ 
            background: 'rgba(255,255,255,0.15)',
            padding: '32px',
            borderRadius: '12px',
            marginBottom: '32px'
          }}>
            <h4 className="revenue-heading" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
              Répartition des revenus de sous-location
            </h4>
            
            <div className="revenue-split-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '24px',
              marginBottom: '24px'
            }}>
              <div className="revenue-split-card" style={{ 
                background: 'rgba(255,255,255,0.2)',
                padding: '24px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div className="revenue-percent" style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '8px', color: '#ffffffff' }}>
                  60%
                </div>
                <div className="revenue-title" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  Pour le locataire
                </div>
                <div className="revenue-desc" style={{ fontSize: '0.9rem', marginTop: '8px', opacity: 0.9 }}>
                  Celui qui gère la sous-location
                </div>
              </div>

              <div className="revenue-split-card" style={{ 
                background: 'rgba(255,255,255,0.2)',
                padding: '24px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div className="revenue-percent" style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '8px', color: '#ffffffff' }}>
                  40%
                </div>
                <div className="revenue-title" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  Pour le propriétaire
                </div>
                <div className="revenue-desc" style={{ fontSize: '0.9rem', marginTop: '8px', opacity: 0.9 }}>
                  Sans aucun effort de sa part
                </div>
              </div>
            </div>

            <p style={{ 
              fontSize: '0.95rem', 
              textAlign: 'center',
              opacity: 0.9,
              fontStyle: 'italic'
            }}>
            </p>
          </div>

          <p className="concept-motto" style={{ 
            textAlign: 'center',
            fontSize: '1.3rem',
            fontWeight: 700,
            margin: '0',
            padding: '20px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px'
          }}>
            ✨ Un modèle gagnant-gagnant : revenus passifs pour le propriétaire, 
            revenus actifs pour le locataire, et logements authentiques pour les voyageurs
          </p>
        </div>
      </div>

      {/* How it works */}
      <div style={{ marginBottom: '50px' }}>
        <h3 style={{
          fontSize: '1.8rem',
          fontWeight: 700,
          color: '#2D3748',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          Comment ça fonctionne ?
        </h3>
        
        <div style={{ display: 'grid', gap: '24px' }}>
          <StepCard
            number="1"
            title="Le locataire s'inscrit"
            description="Il crée son compte et ajoute son logement en quelques clics."
          />
          <StepCard
            number="2"
            title="Le propriétaire donne son accord"
            description="En un clic, il valide le modèle Kokyage. Tout est sécurisé juridiquement et il percevra 40% des revenus."
          />
          <StepCard
            number="3"
            title="Le logement est publié"
            description="Après modération par notre équipe, le logement devient visible pour les voyageurs qui recherchent un hébergement."
          />
          <StepCard
            number="4"
            title="Un voyageur réserve"
            description="Il paie en ligne de manière sécurisée. Une empreinte bancaire de 300€ est prise en guise de caution."
          />
          <StepCard
            number="5"
            title="Le séjour se déroule"
            description=""
          />
          <StepCard
            number="6"
            title="Les revenus sont partagés"
            description="Une fois le séjour terminé, Kokyage reverse automatiquement la part du propriétaire et du locataire, moins les commissions."
          />
        </div>
      </div>

      {/* Key Benefits */}
      <div style={{ marginBottom: '50px' }}>
        <h3 style={{
          fontSize: '1.8rem',
          fontWeight: 700,
          color: '#2D3748',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          Pourquoi Kokyage ?
        </h3>

        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <BenefitCard
            icon="✅"
            title="100% légal"
            description="Accord électronique validé par des juristes, conforme à la loi."
          />
          <BenefitCard
            icon="🛡️"
            title="100% sécurisé"
            description="Caution, modération et système de notation."
          />
          <BenefitCard
            icon="🤝"
            title="100% équitable"
            description="Chaque acteur est gagnant : locataire, propriétaire et voyageur."
          />
          <BenefitCard
            icon="🌍"
            title="100% responsable"
            description="Contre la spéculation immobilière, pour un usage raisonné du logement."
          />
        </div>
      </div>

      {/* Comparison */}
      <div style={{
        background: '#F5F1ED',
        padding: '40px',
        borderRadius: '20px',
        marginBottom: '50px'
      }}>
        <h3 style={{
          fontSize: '1.8rem',
          fontWeight: 700,
          color: '#2D3748',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          Kokyage vs. Sous-location classique
        </h3>
        
        <div style={{ display: 'grid', gap: '16px', maxWidth: '700px', margin: '0 auto' }}>
          <ComparisonRow
            label="Autorisation du propriétaire"
            kokyage="✅ Obligatoire et tracée"
            classic="❌ Souvent ignorée"
          />
          <ComparisonRow
            label="Revenus pour le propriétaire"
            kokyage="✅ 40% automatiques"
            classic="❌ 0%"
          />
          <ComparisonRow
            label="empreinte bancaire du voyageur"
            kokyage="✅ 300€ enregistrés"
            classic="❌ Aucune couverture"
          />
          <ComparisonRow
            label="Sécurité juridique"
            kokyage="✅ Accord électronique validé"
            classic="⚠️ Zone grise"
          />
          <ComparisonRow
            label="Contrôle et traçabilité"
            kokyage="✅ Total via la plateforme"
            classic="❌ Aucun"
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 768px) {
          .concept-section {
            padding: 32px 24px !important;
            margin-bottom: 32px !important;
          }
          
          .concept-content {
            margin: 0 auto !important;
            font-size: 1rem !important;
            line-height: 1.6 !important;
          }
          
          .revenue-section {
            padding: 20px !important;
            margin-bottom: 20px !important;
          }
          
          .revenue-heading {
            font-size: 1.4rem !important;
            margin-bottom: 16px !important;
          }
          
          .revenue-split-grid {
            gap: 16px !important;
          }
          
          .revenue-split-card {
            padding: 20px 16px !important;
          }
          
          .revenue-percent {
            font-size: 2.5rem !important;
          }
          
          .revenue-title {
            font-size: 1rem !important;
          }
          
          .revenue-desc {
            font-size: 0.85rem !important;
          }
          
          .concept-motto {
            font-size: 1.1rem !important;
            padding: 16px !important;
            line-height: 1.5 !important;
          }
        }
        
        @media (max-width: 480px) {
          .concept-section {
            padding: 24px 16px !important;
            margin-bottom: 24px !important;
          }
          
          .concept-content {
            font-size: 0.95rem !important;
          }
          
          .revenue-section {
            padding: 16px !important;
            margin-bottom: 16px !important;
          }
          
          .revenue-heading {
            font-size: 1.2rem !important;
            margin-bottom: 12px !important;
          }
          
          .revenue-split-grid {
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          
          .revenue-split-card {
            padding: 16px 12px !important;
          }
          
          .revenue-percent {
            font-size: 2rem !important;
            margin-bottom: 6px !important;
          }
          
          .revenue-title {
            font-size: 0.9rem !important;
          }
          
          .revenue-desc {
            font-size: 0.75rem !important;
            margin-top: 6px !important;
          }
          
          .concept-motto {
            font-size: 0.95rem !important;
            padding: 12px !important;
            line-height: 1.4 !important;
          }
        }
      `}</style>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div style={{
      display: 'flex',
      gap: '24px',
      alignItems: 'flex-start',
      padding: '24px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      border: '1px solid #f0f0f0',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(96,162,157,0.15)';
      e.currentTarget.style.transform = 'translateX(8px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
      e.currentTarget.style.transform = 'translateX(0)';
    }}
    >
      <div style={{
        minWidth: '50px',
        height: '50px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #60A29D 0%, #4A8985 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        fontWeight: 800,
        boxShadow: '0 4px 12px rgba(96,162,157,0.3)'
      }}>
        {number}
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{
          fontSize: '1.3rem',
          fontWeight: 700,
          color: '#2D3748',
          marginBottom: '8px'
        }}>
          {title}
        </h4>
        <p style={{
          fontSize: '1.05rem',
          lineHeight: 1.6,
          color: '#4A5568',
          margin: 0
        }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function BenefitCard({ icon, title, description }) {
  return (
    <div style={{
      background: 'white',
      padding: '32px 24px',
      borderRadius: '16px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      border: '1px solid #f0f0f0',
      textAlign: 'center',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(96,162,157,0.15)';
      e.currentTarget.style.transform = 'translateY(-4px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{icon}</div>
      <h4 style={{
        fontSize: '1.3rem',
        fontWeight: 700,
        color: '#2D3748',
        marginBottom: '12px'
      }}>
        {title}
      </h4>
      <p style={{
        fontSize: '1rem',
        lineHeight: 1.6,
        color: '#4A5568',
        margin: 0
      }}>
        {description}
      </p>
    </div>
  );
}

function ComparisonRow({ label, kokyage, classic }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '16px',
      alignItems: 'center',
      padding: '16px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <div style={{
        fontWeight: 600,
        color: '#2D3748',
        fontSize: '1rem'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '0.95rem',
        color: '#60A29D',
        fontWeight: 600,
        textAlign: 'center'
      }}>
        {kokyage}
      </div>
      <div style={{
        fontSize: '0.95rem',
        color: '#999',
        textAlign: 'center'
      }}>
        {classic}
      </div>
    </div>
  );
}

function ProprietaireContent() {
  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
      {/* Section Title */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 800,
          color: '#2D3748',
          marginBottom: '16px',
          letterSpacing: '-0.01em'
        }}>
          Pourquoi rejoindre Kokyage<br />en tant que propriétaire ?
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '700px', margin: '0 auto' }}>
          Transformez vos locataires en partenaires de confiance
        </p>
      </div>

      {/* Intro Card */}
      <div style={{
        background: 'linear-gradient(135deg, #F5F1ED 0%, #FFFFFF 100%)',
        padding: '40px',
        borderRadius: '20px',
        marginBottom: '40px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
      }}>
        <p style={{ fontSize: '1.15rem', lineHeight: 1.8, color: '#2D3748', margin: 0 }}>
          Avec Kokyage, chaque sous-location devient une opportunité gagnant-gagnant.
          Lorsque votre locataire s'absente, son logement ne reste plus vide : il peut être loué temporairement, 
          et vous percevez automatiquement <strong style={{ color: '#60A29D' }}>40 % des revenus générés</strong>.
          <br /><br />
          <strong>Aucun effort, aucun risque, aucun contrat à gérer</strong> — tout est automatisé et sécurisé.
        </p>
      </div>

      {/* Features Grid */}
      <div style={{ display: 'grid', gap: '30px' }}>
        
        {/* Sécurité juridique */}
        <FeatureCard
          icon="🔒"
          title="Une sécurité juridique totale"
          description="Chaque sous-location s'effectue dans le cadre d'un accord de consentement électronique, validé par nos experts juridiques."
        />
  
        {/* Responsabilité */}
        <FeatureCard
          icon="⚖️"
          title="Qui est responsable en cas de problème ?"
          description={
            <>
              Sur Kokyage, le propriétaire n'a jamais à gérer directement les voyageurs : <strong>c'est le locataire principal qui reste l'unique responsable du logement</strong> pendant toute la durée de la sous-location.
              <br /><br />
              Pour les petites dégradations, une empreinte bancaire (équivalente à une caution) est enregistrée auprès du voyageur.
              En cas de dommage validé par nos modérateurs, jusqu'à <strong>300 €</strong> peuvent être prélevés automatiquement afin de couvrir les réparations mineures.
              <br /><br />
              Dans les rares cas d'incidents plus importants, c'est l'assurance responsabilité civile du voyageur qui est sollicitée en priorité, s'il en possède une.
              Et si cela s'avère nécessaire, le locataire principal demeure garant vis-à-vis de vous, conformément à la loi et à l'accord signé.
              Il est fortement recommandé au locataire principal de demander au voyageur une attestation de villégiature, généralement incluse dans l'assurance habitation du voyageur.
              <br /><br />
              <strong style={{ color: '#60A29D' }}>Vous bénéficiez ainsi d'une triple sécurité :</strong>
              <ol style={{ marginTop: '16px', paddingLeft: '20px' }}>
                <li>Une caution enregistrée couvrant les dégradations jusqu'à 300 € ;</li>
                <li>l'assurance responsabilité civile du voyageur, s'il en a une ;</li>
                <li>Un locataire juridiquement responsable, qui reste votre interlocuteur unique.</li>
              </ol>
              <br />
              Enfin, chaque voyageur est noté par le locataire principal à la fin de son séjour.
              Un système de signalement permet de bannir définitivement les utilisateurs peu fiables, pour maintenir une communauté respectueuse et de confiance.
              <br />  </>
          }
        />

        {/* Contrôle */}
        <FeatureCard
          icon="🔄"
          title="Contrôle à tout moment"
          description={
            <>
              Une fois votre logement validé par vous-même et par nos modérateurs, vous conservez la pleine maîtrise de votre autorisation.
              Vous pouvez y mettre fin à tout instant : Kokyage.com retirera immédiatement votre bien de la plateforme et annulera toute réservation dont le début est prévu dans plus de 14 jours.
              <br /><br />
              Par ailleurs, l'accord que vous signez encadre strictement la sous-location : <strong>votre locataire n'est autorisé à louer que via Kokyage.com</strong>, garantissant ainsi une traçabilité totale et une sécurité absolue.
              <br /><br />
              <strong style={{ color: '#60A29D', fontSize: '1.1rem' }}>
                👉 Comme vous pouvez annuler à tout moment, pourquoi ne pas simplement tester ?
              </strong>
            </>
          }
        />

        {/* Revenus */}
        <FeatureCard
          icon="💶"
          title="Des revenus supplémentaires sans effort"
          description="En autorisant la sous-location encadrée, vous augmentez vos revenus locatifs sans frais supplémentaires. Vous continuez à toucher votre loyer via votre locataire et Kokyage vous reverse votre part des sous-locations chaque mois."
        />

        {/* Fidélisation */}
        <FeatureCard
          icon="🧘‍♀️"
          title="Fidélisez vos locataires, réduisez vos risques"
          description="Ce modèle encourage le locataire à conserver son logement, ce qui vous évite d'avoir à en chercher un autre et augmente sa solvabilité, vous prémunissant des risques d'impayés."
        />

        {/* Relation apaisée */}
        <FeatureCard
          icon="🤝"
          title="Une relation locative apaisée"
          description="Kokyage transforme un sujet de méfiance en partenariat équilibré : le locataire partage ses revenus, vous gardez le contrôle, et tout le monde y gagne. C'est une nouvelle manière de concevoir la location : transparente, équitable et moderne."
        />

        {/* Transparence des frais */}
        <FeatureCard
          icon="💰"
          title="Aucun frais cachés, tout est transparent !"
          description={
            <>
              Sur Kokyage, la répartition des revenus est claire et transparente pour chaque acteur.
              <br /><br />
              Le locataire fixe librement le prix de la nuitée.
              <br /><br />
              Le voyageur paie ce prix, plus des frais de service de 17%
              Ensuite, les revenus sont partagés automatiquement : <strong>40 % pour le propriétaire</strong> et <strong>60 % pour le locataire</strong>, chacun déduisant une commission de 3 % pour Kokyage.
              <br /><br />
              <strong style={{ color: '#60A29D' }}>Exemple concret :</strong>
              <br />
              Si le locataire fixe le prix de la nuit à <strong>100 €</strong> :
              <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                <li>Le voyageur paie environ <strong>117 €</strong>, dont 17 € de frais pour Kokyage</li>
                <li>Le propriétaire perçoit <strong>40 €</strong>, moins 3 % de commission, soit <strong style={{ color: '#60A29D' }}>38,80 € nets</strong>.</li>
                <li>Le locataire reçoit <strong>60 €</strong>, moins 3 % de commission, soit <strong>58,20 € nets</strong>.</li>
              </ul>
            </>
          }
        />

        {/* Modèle responsable */}
        <FeatureCard
          icon="🌍"
          title="Vers un modèle plus juste et responsable"
          description={
            <>
              En choisissant Kokyage, vous participez à rééquilibrer le marché locatif.
              Notre modèle met fin à la compétition entre plateformes touristiques comme Airbnb ou Booking et habitants qui cherchent simplement à se loger.
              <br /><br />
              Ici, la sous-location se fait de manière <strong>encadrée, légale et équitable</strong>, profitant à la fois aux locataires, aux propriétaires et aux voyageurs.
              <br /><br />
              Plutôt qu'un système tourné vers la spéculation, Kokyage défend un usage raisonné du logement : permettre à chacun de profiter d'un bien vacant sans priver les habitants de leur place.
            </>
          }
        />
      </div>

      {/* CTA */}
      <EmailConvictionForm />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function LocataireContent() {
  const FeatureCard = ({ icon, title, description }) => (
    <div style={{
      padding: '32px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: 'pointer',
      marginBottom: '24px'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.boxShadow = '0 12px 32px rgba(96,162,157,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2D3748', marginBottom: '12px' }}>
        {title}
      </h3>
      <p style={{ color: '#666', lineHeight: 1.7, fontSize: '1.05rem' }}>
        {description}
      </p>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
      {/* Section Title */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 800,
          color: '#2D3748',
          marginBottom: '16px'
        }}>
          Pourquoi rejoindre Kokyage<br />en tant que Locataire ?        </h2>
        <p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '700px', margin: '0 auto' }}>
          Transformez vos absences en revenus, avec l'accord de votre locataire 
        </p>
      </div>

      {/* Feature Cards */}
      <FeatureCard
        icon="💰"
        title="Gagnez de l'argent pendant vos absences"
        description={
          <>
            Vous partez en vacances, en week-end ou en déplacement professionnel ? Au lieu de payer un loyer pour un logement vide, générez des revenus complémentaires. Vous recevez <strong style={{ color: '#60A29D' }}>60% de chaque sous-location</strong> et votre propriétaire 40%.
          </>
        }
      />

      <FeatureCard
        icon="✅"
        title="Demandez l'autorisation simplement"
        description="Kokyage vous aide à convaincre votre propriétaire avec un email clé en main qui explique tous les avantages pour lui aussi. L'accord est signé électroniquement, en toute simplicité et sécurité juridique."
      />

      <FeatureCard
        icon="🛡️"
        title="Vous êtes protégé"
        description="chaque séjour fait l'objet d'une prise d'empreinte bancaire de 300€ auprès du voyageur, couvrant les petites dégradations. Pour les dégradations plus importantes, c'est l'assurance responsabilité civile du voyageur qui est sollicitée en priorité. Il est fortement recommandé au locataire principal de demander au voyageur une attestation de villégiature, généralement incluse dans son assurance habitation."
      />

      <FeatureCard
        icon="👤"
        title="Vous restez maître chez vous"
        description="C'est VOUS qui validez ou refusez chaque demande de réservation. Vous pouvez mettre votre annonce en pause à tout moment. Vous choisissez vos dates de disponibilité. Vous gérez tout depuis votre espace personnel."
      />

      <FeatureCard
        icon="💳"
        title="Paiements sécurisés et automatiques"
        description="Kokyage gère tous les paiements de manière sécurisée. Vous recevez automatiquement vos 60% après chaque séjour, sans effort. Votre propriétaire reçoit ses 40%. Tout est transparent et traçable."
      />

      {/* Example Section */}
      <div style={{
        marginTop: '60px',
        padding: '40px',
        background: '#F7FAFC',
        borderRadius: '20px',
        border: '2px solid #E2E8F0'
      }}>
        <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2D3748', marginBottom: '24px', textAlign: 'center' }}>
          💡 Exemple concret : Marie, 28 ans
        </h3>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
            Marie loue un T2 à Lyon pour 800€/mois. Elle part 2 semaines en vacances d'été et sous-loue son appartement 80€/nuit sur Kokyage.
          </p>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ fontSize: '1.1rem', marginBottom: '12px' }}>
              📊 <strong>Calcul des revenus :</strong>
            </div>
            <div style={{ color: '#666', lineHeight: 2 }}>
              • 14 nuits × 80€ = 1 120€ de revenus totaux<br/>
              • Marie reçoit : 60% - 3% = <strong style={{ color: '#60A29D' }}>638,40€</strong><br/>
              • Son propriétaire reçoit : 40% - 3% = <strong style={{ color: '#60A29D' }}>425,60€</strong>
            </div>
          </div>
          <p style={{ fontSize: '1.1rem', color: '#60A29D', fontWeight: 600, textAlign: 'center' }}>
            ✨ Marie a financé 80% de son loyer du mois grâce à ses 2 semaines de vacances !
          </p>
        </div>
      </div>

      {/* Legal Section */}
      <div style={{
        marginTop: '60px',
        padding: '32px',
        background: 'white',
        borderRadius: '16px',
        border: '2px solid #60A29D'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2D3748', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>⚖️</span> C'est légal ?
        </h3>
        <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: 1.8, marginBottom: '16px' }}>
          <strong>Oui, absolument !</strong> La sous-location est légale en France si vous avez l'accord écrit de votre propriétaire. Kokyage facilite cette démarche en gérant le partage des revenus et la gestion des contrats.
        </p>
      </div>

      {/* CTA Section */}


      <EmailToOwnerForm />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function FAQContent() {
  const [openQuestion, setOpenQuestion] = useState(null);

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  const faqs = [
    {
      category: "Général",
      questions: [
        {
          q: "Kokyage, c'est légal ?",
          a: "Oui, totalement ! Kokyage encadre la sous-location dans le respect de la loi. Chaque sous-location nécessite l'accord préalable du propriétaire, matérialisé par une signature électronique juridiquement valable. Nous veillons à ce que chaque utilisateur respecte les règles en vigueur."
        },
        {
          q: "Comment fonctionne la répartition des revenus ?",
          a: "Pour chaque nuit louée : 60% reviennent au locataire, 40% au propriétaire. Kokyage prélève ensuite 3% de commission sur chaque part pour financer la plateforme et la modération. et fait payer des frais de service de 17% au voyageur."
        },
        {
          q: "Que se passe-t-il si le propriétaire refuse ?",
          a: "Le propriétaire est libre de refuser ou d'accepter la demande de sous-location. Sans son accord, le logement ne peut pas être publié sur Kokyage. Le locataire ne peut donc pas sous-louer via notre plateforme. Pour l'aider à convaincre son propriétaire, Kokyage fournit un email type expliquant les avantages du modèle dans le volet 'locataire' de cette meme page."
        }
      ]
    },
    {
      category: "Pour les propriétaires",
      questions: [
        {
          q: "Puis-je annuler mon autorisation ?",
          a: "Oui, à tout moment ! Vous pouvez retirer votre autorisation depuis votre espace personnel. Kokyage retirera immédiatement votre bien de la plateforme et annulera toute réservation dont le début est prévu dans plus de 14 jours."
        },
        {
          q: "Comment suis-je protégé en cas de dégradation ?",
          a: "Triple protection : 1) Empreinte bancaire du voyageur (caution jusqu'à 300€), 2) l'assurance responsabilité civile du voyageur s'il en a, 3) Responsabilité du locataire principal qui reste votre garant conformément à la loi."
        },
        {
          q: "Dois-je gérer les voyageurs ?",
          a: "Non, jamais. Le locataire principal reste votre unique interlocuteur et l'unique responsable du logement. C'est lui qui gère la relation avec les voyageurs."
        },
        {
          q: "Comment je reçois mes revenus ?",
          a: "Kokyage vous verse votre part (40% - 3% de commission) automatiquement chaque mois par virement bancaire. Tout est transparent et tracé dans votre espace personnel."
        },
        {
          q: "Comment déclarer mes revenus de sous-location ?",
          a: (
            <>
              <strong>🪑 Cas n°1 – Ton logement est loué meublé</strong>
              <br /><br />
              Si tu loues déjà ton bien meublé (bail meublé classique, résidence principale ou secondaire), les revenus perçus via Kokyage s'ajoutent à tes revenus locatifs meublés existants.
              <br /><br />
              Ils doivent être déclarés dans la catégorie des Bénéfices Industriels et Commerciaux (BIC), car la location meublée est juridiquement une activité commerciale.
              <br /><br />
              <strong>🏠 Cas n°2 – Ton logement est loué non meublé (nu)</strong>
              <br /><br />
              Si tu loues ton logement vide à ton locataire, mais que tu perçois une part de revenus issus de la sous-location, ces sommes s'ajoutent à tes revenus fonciers.
              <br /><br />
              Tu restes donc imposé dans la catégorie des revenus fonciers (article 29 du Code général des impôts).
              <br /><br />
              <strong>📊 Comment Kokyage m'aide à faire ma déclaration ?</strong>
              <br /><br />
              Conformément à l'article 242 bis du Code général des impôts, Kokyage transmet chaque année à l'administration fiscale le montant brut des revenus perçus via la plateforme.
              Tu recevras également un relevé annuel récapitulatif dans ton espace personnel, indiquant les montants à intégrer dans ta déclaration de revenus.
              <br /><br />
              <strong>💼 Et si j'ai plusieurs logements ?</strong>
              <br /><br />
              Chaque logement doit être déclaré séparément selon son statut (meublé ou non meublé).
              Tu peux cumuler des revenus BIC pour les logements meublés et des revenus fonciers pour les logements nus, si tu en détiens plusieurs.
              <br /><br />
              <strong>⚖️ Et si je suis un bailleur professionnel ?</strong>
              <br /><br />
              Si tu loues de manière habituelle et significative, tu peux relever du statut de Loueur en Meublé Professionnel (LMP).
              Tu seras alors soumis à des cotisations sociales et à une imposition spécifique, gérée via ton numéro SIRET.
              <br /><br />
              <strong>📚 Où trouver les informations officielles ?</strong>
              <br /><br />
              Tu peux consulter les sites officiels suivants :<br />
              • impots.gouv.fr – Revenus fonciers et BIC<br />
              • service-public.fr – Loueur en meublé<br />
              • urssaf.fr – Activité de location meublée
            </>
          )
        }
      ]
    }, 
    {
      category: "Pour les locataires",
      questions: [
        {
          q: "Mon propriétaire va-t-il accepter ?",
          a: "De plus en plus de propriétaires comprennent l'intérêt du modèle : ils touchent 40% des revenus sans effort, fidélisent leur locataire et diminuent le risque d'impayés. La demande se fait en un clic depuis la plateforme."
        },
        {
          q: "Que se passe-t-il si un voyageur dégrade mon logement ?",
          a: "Kokyage enregistre une empreinte bancaire de 300€ auprès du voyageur, couvrant les petites dégradations. Pour les dommages plus importants, c'est l'assurance responsabilité civile du voyageur qui est sollicitée en priorité. Il est fortement recommandé de demander au voyageur une attestation de villégiature, généralement incluse dans son assurance habitation."
        },
        {
          q: "Puis-je choisir qui loue mon logement ?",
          a: "Oui ! Vous validez chaque réservation et pouvez consulter le profil des voyageurs (avis, vérifications). Vous gardez le contrôle total."
        },
        {
          q: "Combien de temps puis-je sous-louer ?",
          a: "Autant que vous le souhaitez pendant vos absences, dans le respect des limites légales (maximum 120 jours par an en résidence principale dans certaines villes)."
        },
        {
          q: "Comment déclarer mes revenus de sous-location ?",
          a: (
            <>
              <strong>Tu n'as rien à déclarer si toutes les conditions suivantes sont réunies :</strong>
              <br /><br />
              • Le logement sous-loué est ta résidence principale (tu y vis au moins 8 mois par an).<br />
              • Tu loues à des voyageurs de passage pour de courts séjours.<br />
              • Le montant total perçu sur l'année ne dépasse pas 206 € par m² et par an en IDF et 152 € par m² et par an ailleurs (plafond 2025, mis à jour chaque année).<br />
              • Tu n'offres aucun service hôtelier (petit-déjeuner, ménage quotidien, réception, etc.).
              <br /><br />
              <strong>➡️ Exemple :</strong><br />
              Si ton logement principal fait 40 m² en région Parisienne, tu peux percevoir jusqu'à 8 240 € par an sans rien déclarer.
              En dessous de ce seuil, aucune déclaration n'est requise et aucune imposition n'est due.
              <br /><br />
              <strong>💰 Et si je dépasse les 206 €/m²/an ?</strong>
              <br /><br />
              Dès que ce seuil est franchi, tes revenus deviennent imposables.
              Tu dois alors les déclarer dans la catégorie des Bénéfices Industriels et Commerciaux (BIC).
              <br /><br />
              Tu bénéficieras automatiquement du régime micro-BIC, sauf si tu choisis le régime réel :<br />
              • <strong>Micro-BIC</strong> : tu déclares le montant total perçu et bénéficies d'un abattement de 50 % pour frais.<br />
              • <strong>Régime réel</strong> : tu déduis tes charges réelles, si cela est plus avantageux.
              <br /><br />
              <strong>🏢 Et si je sous-loue un logement qui n'est pas ma résidence principale ?</strong>
              <br /><br />
              Dans ce cas, l'exonération ne s'applique pas.
              Les revenus sont imposables dès le premier euro, quelle que soit leur importance.
              Ils doivent être déclarés en BIC, selon le régime micro-BIC ou réel simplifié.
              <br /><br />
              <strong>📊 Comment Kokyage m'aide à faire ma déclaration ?</strong>
              <br /><br />
              Conformément à l'article 242 bis du Code général des impôts, Kokyage transmet chaque année à l'administration fiscale le montant brut des revenus perçus via la plateforme.
              Tu recevras également un relevé annuel dans ton espace personnel, récapitulant le total de tes revenus bruts à déclarer.
              <br /><br />
              <strong>📅 Et si je loue souvent ou plusieurs logements ?</strong>
              <br /><br />
              Si tu sous-loues régulièrement ou plusieurs logements, ton activité peut être considérée comme professionnelle.
              Tu devras alors :<br />
              • t'immatriculer en tant que loueur en meublé non professionnel (LMNP) ou professionnel (LMP) ;<br />
              • déclarer tes revenus à l'URSSAF pour payer les cotisations sociales correspondantes.
              <br /><br />
              <strong>🧮 Comment est calculé le plafond de 206 €/m²/an en IDF et 152 €/m²/an ailleurs ?</strong>
              <br /><br />
              Le plafond s'applique sur la surface habitable du logement sous-loué :<br />
              Exemple : 30 m² × 206 € = 6 180 € par an maximum pour rester exonéré.
              <br /><br />
              Ce plafond est révisé chaque année par arrêté ministériel. Il est consultable sur service-public.fr.
              <br /><br />
              <strong>🧾 Où trouver des informations officielles ?</strong>
              <br /><br />
              Tu peux consulter les sources suivantes :<br />
              • impots.gouv.fr – Revenus issus de la location ou de la sous-location de meublés<br />
              • Service-public.fr – Sous-location d'un logement<br />
              • URSSAF – Activités de location meublée
            </>
          )
        },
        {
          q: "Qu'en est-il de la taxe de séjour ?",
          a: "La taxe de séjour est une taxe locale collectée auprès des voyageurs et reversée à la commune. Kokyage collecte automatiquement cette taxe lors de chaque réservation (montant variable selon la commune, entre 0,20 € et 4,50 € par nuit et par personne) et se charge de la reverser aux autorités locales. Vous n'avez aucune démarche à effectuer !"
        }
      ]
    },
    {
      category: "Pour les voyageurs",
      questions: [
        {
          q: "C'est différent d'Airbnb ?",
          a: "Oui ! Sur Kokyage, vous louez chez de vrais habitants qui s'absentent temporairement. C'est plus authentique, souvent moins cher, et vous ne participez pas à la spéculation immobilière qui chasse les résidents des centres-villes."
        },
        {
          q: "Que se passe-t-il si j'annule ?",
          a: "Les conditions d'annulation sont définies par le locataire lors de la publication (flexible, modérée ou stricte). Elles sont clairement affichées avant votre réservation."
        },
        {
          q: "Comment je suis sûr que le logement existe vraiment ?",
          a: "Chaque logement est modéré par notre équipe avant publication. De plus, les locataires sont vérifiés (identité, justificatif de domicile) et notés par les précédents voyageurs."
        }
      ]
    },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 800,
          color: '#2D3748',
          marginBottom: '16px',
          letterSpacing: '-0.01em'
        }}>
          Questions fréquentes
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '700px', margin: '0 auto' }}>
          Tout ce que vous devez savoir sur Kokyage
        </p>
      </div>

      {/* Disclaimer */}
      <div
        className="disclaimer"
        style={{
          background: '#FFF9E6',
          border: '2px solid #FFD700',
          borderRadius: '12px',
          padding: '24px 32px',
          marginBottom: '48px',
          boxShadow: '0 4px 12px rgba(255, 215, 0, 0.1)'
        }}
      >
        <div className="disclaimer-inner" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div className="disclaimer-icon" style={{ fontSize: '2rem', flexShrink: 0 }}>⚠️</div>
          <div>
            <h3
              className="disclaimer-title"
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: '#2D3748',
                marginBottom: '12px'
              }}
            >
              Avertissement
            </h3>
            <p
              className="disclaimer-text"
              style={{
                fontSize: '1rem',
                lineHeight: 1.7,
                color: '#4A5568',
                margin: 0
              }}
            >
              Les informations présentées sur cette page sont fournies à titre informatif et général.
              Elles ne constituent pas un conseil fiscal, juridique ou comptable personnalisé.
              Chaque utilisateur demeure responsable de vérifier sa situation auprès de l'administration fiscale ou d'un conseiller compétent.
            </p>
          </div>
        </div>
      </div>

      {faqs.map((category, catIndex) => (
        <div key={catIndex} style={{ marginBottom: '48px' }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#60A29D',
            marginBottom: '24px',
            paddingBottom: '12px',
            borderBottom: '3px solid #60A29D'
          }}>
            {category.category}
          </h3>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {category.questions.map((faq, qIndex) => {
              const globalIndex = `${catIndex}-${qIndex}`;
              const isOpen = openQuestion === globalIndex;
              
              return (
                <div
                  key={qIndex}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: isOpen ? '0 8px 24px rgba(96,162,157,0.15)' : '0 4px 16px rgba(0,0,0,0.06)',
                    border: isOpen ? '2px solid #60A29D' : '2px solid #f0f0f0',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <button
                    onClick={() => toggleQuestion(globalIndex)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{
                      fontSize: '1.15rem',
                      fontWeight: 600,
                      color: isOpen ? '#60A29D' : '#2D3748',
                      flex: 1,
                      paddingRight: '16px'
                    }}>
                      {faq.q}
                    </span>
                    <span style={{
                      fontSize: '1.5rem',
                      color: '#60A29D',
                      transition: 'transform 0.3s ease',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      display: 'inline-block'
                    }}>
                      ▼
                    </span>
                  </button>
                  
                  <div style={{
                    maxHeight: isOpen ? '2000px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease'
                  }}>
                    <div style={{
                      padding: '0 24px 24px',
                      fontSize: '1.05rem',
                      lineHeight: 1.7,
                      color: '#4A5568'
                    }}>
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* CTA */}
      <div style={{
        marginTop: '60px',
        textAlign: 'center',
        padding: '40px',
        background: 'linear-gradient(135deg, #60A29D 0%, #4A8985 100%)',
        borderRadius: '20px',
        color: 'white'
      }}>
        <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '16px' }}>
          Vous ne trouvez pas votre réponse ?
        </h3>
        <p style={{ fontSize: '1.1rem', marginBottom: '24px', opacity: 0.95 }}>
          Notre équipe est là pour vous aider
        </p>
        <Link href="/contact" style={{
          display: 'inline-block',
          padding: '16px 40px',
          background: 'white',
          color: '#60A29D',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '1.1rem',
          textDecoration: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          Nous contacter
        </Link>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Disclaimer responsive sizing */
        @media (max-width: 768px) {
          .disclaimer {
            padding: 12px 16px !important;
            margin-bottom: 32px !important;
          }
          .disclaimer-inner {
            gap: 8px !important;
            align-items: center !important;
          }
          .disclaimer-icon {
            font-size: 1.5rem !important;
          }
          .disclaimer-title {
            font-size: 1rem !important;
            margin-bottom: 6px !important;
          }
          .disclaimer-text {
            font-size: 0.9rem !important;
            line-height: 1.5 !important;
          }
        }

        @media (max-width: 480px) {
          .disclaimer {
            padding: 10px 12px !important;
          }
          .disclaimer-icon {
            font-size: 1.3rem !important;
          }
          .disclaimer-title {
            font-size: 0.95rem !important;
          }
          .disclaimer-text {
            font-size: 0.85rem !important;
            line-height: 1.45 !important;
          }
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div style={{
      background: 'white',
      padding: '32px',
      borderRadius: '16px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      border: '1px solid #f0f0f0',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(96,162,157,0.15)';
      e.currentTarget.style.transform = 'translateY(-4px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{
        fontSize: '1.4rem',
        fontWeight: 700,
        color: '#2D3748',
        marginBottom: '16px',
        lineHeight: 1.3
      }}>
        {title}
      </h3>
      <div style={{
        fontSize: '1.05rem',
        lineHeight: 1.7,
        color: '#4A5568'
      }}>
        {description}
      </div>
    </div>
  );
}
