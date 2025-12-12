import Header from '../_components/Header';
import Footer from '../_components/Footer';

export default function Page() {
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
          background: 'linear-gradient(135deg, #77d4d7ff 0%, #4547c9ff 50%, #3323c7ff 100%)', 
          padding: '100px 24px 80px', 
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
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%',
            filter: 'blur(1px)'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '20%',
            right: '10%',
            width: '120px',
            height: '120px',
            background: 'rgba(78, 205, 196, 0.12)',
            borderRadius: '50%',
            filter: 'blur(1px)'
          }}></div>

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '70px',
              height: '70px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '20px',
              marginBottom: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <span style={{ fontSize: '2rem' }}>⚖️</span>
            </div>
            
            <h1 style={{ 
              fontSize: 'clamp(2rem, 4vw, 2.75rem)', 
              fontWeight: 800, 
              marginBottom: '12px',
              letterSpacing: '-0.02em',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}>
              Mentions Légales
            </h1>
            
            <p style={{ 
              fontSize: '1.1rem',
              opacity: 0.95,
              lineHeight: 1.6,
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Informations légales et éditeur du site
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section style={{ padding: '0 24px 80px', transform: 'translateY(-40px)' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.98)', 
            backdropFilter: 'blur(30px)',
            borderRadius: '28px', 
            boxShadow: '0 30px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.3)',
            maxWidth: '900px',
            margin: '0 auto',
            padding: '60px',
            position: 'relative'
          }}>
            {/* Gradient accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #4ECDC4, #8B5CF6, #3B82F6)',
              borderRadius: '28px 28px 0 0'
            }}></div>

            <div style={{ 
              color: '#1F2937', 
              lineHeight: 1.8,
              fontSize: '1rem'
            }}>
              {/* Éditeur */}
              <article style={{ marginBottom: '48px' }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  Éditeur du site
                </h2>
                <div style={{ 
                  background: '#F9FAFB', 
                  padding: '24px', 
                  borderRadius: '12px',
                  borderLeft: '4px solid #4ECDC4'
                }}>
                  <p style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#374151' }}>Raison sociale :</strong> Kokyage
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#374151' }}>Forme juridique :</strong> [À compléter]
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#374151' }}>Capital social :</strong> [À compléter]
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#374151' }}>Siège social :</strong> [Adresse à compléter]
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#374151' }}>SIRET :</strong> [Numéro à compléter]
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#374151' }}>Numéro de TVA :</strong> [Numéro à compléter]
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#374151' }}>Email :</strong> <a href="mailto:contact@kokyage.com" style={{ color: '#4ECDC4', textDecoration: 'none', fontWeight: 600 }}>contact@kokyage.com</a>
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong style={{ color: '#374151' }}>Directeur de la publication :</strong> [Nom à compléter]
                  </p>
                </div>
              </article>

              {/* Hébergement */}
              <article style={{ marginBottom: '48px' }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  Hébergement
                </h2>
                <div style={{ 
                  background: '#F9FAFB', 
                  padding: '24px', 
                  borderRadius: '12px',
                  borderLeft: '4px solid #8B5CF6'
                }}>
                  <p style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#374151' }}>Hébergeur :</strong> Vercel Inc.
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#374151' }}>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong style={{ color: '#374151' }}>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: '#8B5CF6', textDecoration: 'none', fontWeight: 600 }}>vercel.com</a>
                  </p>
                </div>
              </article>

              {/* Propriété intellectuelle */}
              <article style={{ marginBottom: '48px' }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  Propriété intellectuelle
                </h2>
                <p style={{ marginBottom: '16px', color: '#4B5563' }}>
                  L'ensemble du contenu présent sur le site Kokyage.com (textes, images, logos, graphismes, vidéos, etc.) est protégé par les lois relatives à la propriété intellectuelle.
                </p>
                <p style={{ marginBottom: '16px', color: '#4B5563' }}>
                  Toute reproduction, distribution, modification, adaptation, retransmission ou publication de ces différents éléments est strictement interdite sans l'accord écrit de Kokyage.
                </p>
                <p style={{ color: '#4B5563' }}>
                  Le non-respect de cette interdiction constitue une contrefaçon pouvant engager la responsabilité civile et pénale du contrefacteur.
                </p>
              </article>

              {/* Données personnelles */}
              <article style={{ marginBottom: '48px' }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  Protection des données personnelles
                </h2>
                <p style={{ marginBottom: '16px', color: '#4B5563' }}>
                  Kokyage accorde une grande importance à la protection de vos données personnelles. La collecte et le traitement de vos données sont effectués dans le respect du Règlement Général sur la Protection des Données (RGPD).
                </p>
                <p style={{ color: '#4B5563' }}>
                  Pour en savoir plus sur la manière dont nous collectons, utilisons et protégeons vos données, veuillez consulter notre <a href="/privacy" style={{ color: '#4ECDC4', textDecoration: 'none', fontWeight: 600 }}>Politique de Confidentialité</a>.
                </p>
              </article>

              {/* Cookies */}
              <article style={{ marginBottom: '48px' }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  Cookies
                </h2>
                <p style={{ marginBottom: '16px', color: '#4B5563' }}>
                  Le site Kokyage.com utilise des cookies pour améliorer votre expérience de navigation et assurer le bon fonctionnement de certaines fonctionnalités.
                </p>
                <p style={{ color: '#4B5563' }}>
                  Vous pouvez paramétrer votre navigateur pour refuser les cookies, mais cela peut limiter certaines fonctionnalités du site.
                </p>
              </article>

              {/* Contact */}
              <div style={{
                marginTop: '60px',
                padding: '32px',
                background: 'linear-gradient(135deg, rgba(78,205,196,0.1), rgba(68,181,168,0.05))',
                borderRadius: '16px',
                border: '2px solid rgba(78,205,196,0.2)'
              }}>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '1.75rem' }}>📧</span>
                  Nous contacter
                </h3>
                <p style={{ marginBottom: '12px', color: '#4B5563' }}>
                  Pour toute question concernant les mentions légales :
                </p>
                <p style={{ margin: 0, color: '#1F2937', fontWeight: 600 }}>
                  Email : <a href="mailto:contact@kokyage.com" style={{ color: '#4ECDC4', textDecoration: 'none' }}>contact@kokyage.com</a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}