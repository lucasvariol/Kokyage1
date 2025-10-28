"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '../_components/Header';
import Footer from '../_components/Footer';
import Chatbot from '../_components/Chatbot';
import Link from 'next/link';

function PageContent() {
  const [activeTab, setActiveTab] = useState('concept');
  const searchParams = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['concept', 'proprietaire', 'locataire', 'faq'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
            Rejoignez la nouvelle génération<br />de location
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
            onClick={() => setActiveTab('concept')}
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
            onClick={() => setActiveTab('proprietaire')}
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
            onClick={() => setActiveTab('locataire')}
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
            onClick={() => setActiveTab('faq')}
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
      <section style={{
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
      <div style={{
        background: 'linear-gradient(135deg, #60A29D 0%, #4A8985 100%)',
        padding: '48px 40px',
        borderRadius: '20px',
        marginBottom: '50px',
        color: 'white',
        boxShadow: '0 12px 32px rgba(96,162,157,0.3)'
      }}>

        
        <div style={{ 
          maxWidth: '800px', 
          margin: '10px auto',
          fontSize: '1.15rem',
          lineHeight: 1.8
        }}>


          <div style={{ 
            background: 'rgba(255,255,255,0.15)',
            padding: '32px',
            borderRadius: '12px',
            marginBottom: '32px'
          }}>
            <h4 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
              Répartition des revenus de sous-location
            </h4>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '24px',
              marginBottom: '24px'
            }}>
              <div style={{ 
                background: 'rgba(255,255,255,0.2)',
                padding: '24px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '8px', color: '#ffffffff' }}>
                  60%
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  Pour le locataire
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '8px', opacity: 0.9 }}>
                  Celui qui gère la sous-location
                </div>
              </div>

              <div style={{ 
                background: 'rgba(255,255,255,0.2)',
                padding: '24px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '8px', color: '#ffffffff' }}>
                  40%
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  Pour le propriétaire
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '8px', opacity: 0.9 }}>
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

          <p style={{ 
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
            description="Il paie en ligne de manière sécurisée. L'assurance et les garanties sont automatiquement activées."
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
            description="Assurance automatique, caution, modération et système de notation."
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
            label="Assurance dédiée"
            kokyage="✅ Incluse et automatique"
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

        {/* Assurance */}
        <FeatureCard
          icon="🛡️"
          title="Une assurance qui protège tout le monde"
          description={
            <>
              Sur Kokyage, chaque séjour est automatiquement couvert par une assurance dédiée.
              Elle protège le propriétaire, le locataire et le voyageur et couvre jusqu'à <strong>X00 000 €</strong> dans les rares cas où surviennent dégradations, vols ou incidents.
              <br /><br />
              Aucune démarche à effectuer : la couverture est un supplément payé par le voyageur lors de sa réservation.
              <br /><br />
              Ainsi, vous avez la garantie que votre bien reste protégé en toutes circonstances, sans avance de frais ni paperasse.
              <br /><br />
              <Link href="/faq" style={{ 
                color: '#60A29D', 
                fontWeight: 600,
                textDecoration: 'none',
                borderBottom: '2px solid #60A29D'
              }}>
                → Cliquez ici pour connaître les détails sur l'assurance
              </Link>
            </>
          }
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
              Dans les rares cas d'incidents plus importants, l'assurance intervient pour indemniser les dommages matériels.
              Et si cela s'avère nécessaire, le locataire principal demeure garant vis-à-vis de vous, conformément à la loi et à l'accord signé.
              <br /><br />
              <strong style={{ color: '#60A29D' }}>Vous bénéficiez ainsi d'une triple sécurité :</strong>
              <ol style={{ marginTop: '16px', paddingLeft: '20px' }}>
                <li>Une caution enregistrée couvrant les dégradations jusqu'à 300 € ;</li>
                <li>Une assurance active protégeant chaque séjour jusqu'à [X00 000 €] ;</li>
                <li>Un locataire juridiquement responsable, qui reste votre interlocuteur unique.</li>
              </ol>
              <br />
              Enfin, chaque voyageur est noté par le locataire principal à la fin de son séjour.
              Un système de signalement permet de bannir définitivement les utilisateurs peu fiables, pour maintenir une communauté respectueuse et de confiance.
              <br /><br />
              Kokyage veille à ce que votre logement soit toujours entre de bonnes mains — <strong>protégé, encadré et sous contrôle</strong>.
            </>
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
              Sur Kokyage, chaque séjour profite à tout le monde : au locataire, au propriétaire et à la plateforme qui assure la gestion et la sécurité.
              <br /><br />
              <strong style={{ color: '#60A29D' }}>👉 Exemple concret :</strong>
              <br />
              Si le locataire fixe le prix de la nuit à <strong>100 €</strong> :
              <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                <li>Le voyageur paie environ <strong>117 €</strong>, dont 15 € pour Kokyage (frais de service) et 2 € pour l'assurance.</li>
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
        title="Vous êtes protégé à 100%"
        description="Chaque séjour est couvert par une assurance jusqu'à 500 000€. une empreinte bancaire (caution jusqu'à 300€) protège des petites dégradations, et vous validez chaque réservation. Vous gardez le contrôle total."
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
          a: "Pour chaque nuit louée : 60% reviennent au locataire, 40% au propriétaire. Kokyage prélève ensuite 3% de commission sur chaque part pour financer la plateforme, la modération, l'assurance et le support client."
        },
        {
          q: "Que se passe-t-il si le propriétaire refuse ?",
          a: "Le propriétaire est libre de refuser ou d'accepter la demande de sous-location. Sans son accord, le logement ne peut pas être publié sur Kokyage. Le locataire ne peut donc pas sous-louer via notre plateforme."
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
          a: "Triple protection : 1) Empreinte bancaire du voyageur (caution jusqu'à 300€), 2) Assurance automatique couvrant jusqu'à X00 000€, 3) Responsabilité du locataire principal qui reste votre garant conformément à la loi."
        },
        {
          q: "Dois-je gérer les voyageurs ?",
          a: "Non, jamais. Le locataire principal reste votre unique interlocuteur et l'unique responsable du logement. C'est lui qui gère la relation avec les voyageurs."
        },
        {
          q: "Comment je reçois mes revenus ?",
          a: "Kokyage vous verse votre part (40% - 3% de commission) automatiquement chaque mois par virement bancaire. Tout est transparent et tracé dans votre espace personnel."
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
          a: "Vous êtes couvert par l'assurance Kokyage. En cas de dégradation mineure, l'empreinte bancaire du voyageur (jusqu'à 300€) est utilisée. Pour les dommages plus importants, l'assurance prend le relais jusqu'à X00 000€."
        },
        {
          q: "Puis-je choisir qui loue mon logement ?",
          a: "Oui ! Vous validez chaque réservation et pouvez consulter le profil des voyageurs (avis, vérifications). Vous gardez le contrôle total."
        },
        {
          q: "Combien de temps puis-je sous-louer ?",
          a: "Autant que vous le souhaitez pendant vos absences, dans le respect des limites légales (maximum 120 jours par an en résidence principale dans certaines villes)."
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
          q: "Suis-je assuré pendant mon séjour ?",
          a: "Oui, une assurance dédiée est automatiquement incluse dans votre réservation (environ 2€/nuit). Elle couvre les dommages matériels et votre responsabilité civile."
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
    {
      category: "Fiscalité",
      questions: [
        {
          q: "Comment déclarer mes revenus en tant que propriétaire ?",
          a: "Les revenus perçus via Kokyage sont des revenus fonciers. Vous devez les déclarer dans la catégorie 'revenus fonciers' (formulaire 2044 ou 2042). Si vos revenus locatifs sont inférieurs à 15 000 €/an, vous bénéficiez du régime micro-foncier avec un abattement forfaitaire de 30%. Au-delà, ou sur option, vous pouvez choisir le régime réel pour déduire vos charges réelles (travaux, intérêts d'emprunt, taxe foncière, etc.). Kokyage vous fournit un récapitulatif annuel pour faciliter votre déclaration."
        },
        {
          q: "Et pour les locataires qui sous-louent ?",
          a: "Les revenus de sous-location sont considérés comme des Bénéfices Industriels et Commerciaux (BIC) pour la location meublée, ou des revenus fonciers pour la location nue. Pour rester exonéré d'impôts, vous devez respecter le principe de non-lucratité : le loyer facturé au voyageur ne doit pas dépasser le loyer que vous payez à votre propriétaire. Si vous facturez plus, l'excédent est imposable. Kokyage vous aide à paramétrer votre loyer pour respecter facilement cette règle."
        },
        {
          q: "Qu'en est-il de la taxe de séjour ?",
          a: "La taxe de séjour est une taxe locale collectée auprès des voyageurs et reversée à la commune. Kokyage collecte automatiquement cette taxe lors de chaque réservation (montant variable selon la commune, entre 0,20 € et 4,50 € par nuit et par personne) et se charge de la reverser aux autorités locales. Vous n'avez aucune démarche à effectuer !"
        },
        {
          q: "Dois-je payer des cotisations sociales ?",
          a: "Pour les propriétaires : les revenus fonciers sont soumis aux prélèvements sociaux (17,2%) mais pas aux cotisations sociales classiques. Pour les locataires : si vos revenus de sous-location dépassent certains seuils et que vous êtes en location meublée professionnelle (LMP), vous pouvez être soumis aux cotisations sociales. Dans la majorité des cas (location meublée non professionnelle - LMNP), seuls les prélèvements sociaux s'appliquent. Nous vous recommandons de consulter un expert-comptable pour votre situation spécifique."
        },
        {
          q: "Où puis-je trouver mes justificatifs fiscaux ?",
          a: "Tous vos justificatifs (récapitulatifs annuels, détails des revenus, taxe de séjour collectée, etc.) sont disponibles dans votre espace personnel Kokyage, section 'Comptabilité' ou 'Documents fiscaux'. Vous recevrez également un email récapitulatif en janvier de chaque année pour faciliter votre déclaration d'impôts."
        }
      ]
    },
    {
      category: "Sécurité & Assurance",
      questions: [
        {
          q: "Qu'est-ce que l'empreinte bancaire ?",
          a: "C'est l'équivalent d'une caution sans blocage de fonds. Une autorisation de prélèvement jusqu'à 300€ est enregistrée. En cas de dégradation validée par nos modérateurs, le montant peut être prélevé pour couvrir les réparations."
        },
        {
          q: "L'assurance couvre quoi exactement ?",
          a: "L'assurance couvre les dommages matériels (dégradations, vols, incendies...), la responsabilité civile du voyageur et du locataire, jusqu'à X00 000€. Elle ne couvre pas les objets de valeur non déclarés ni les dommages intentionnels."
        },
        {
          q: "Comment signaler un problème ?",
          a: "Vous pouvez contacter notre support 24h/24 depuis votre espace personnel. En cas de problème grave, nos modérateurs interviennent immédiatement pour médiation et application des garanties."
        }
      ]
    }
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
                    maxHeight: isOpen ? '500px' : '0',
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
