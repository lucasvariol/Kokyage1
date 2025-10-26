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
            animation: 'float 8s ease-in-out infinite',
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
            animation: 'float 6s ease-in-out infinite reverse',
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
              <span style={{ fontSize: '2rem' }}>📋</span>
            </div>
            
            <h1 style={{ 
              fontSize: 'clamp(2rem, 4vw, 2.75rem)', 
              fontWeight: 800, 
              marginBottom: '12px',
              letterSpacing: '-0.02em',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}>
              Conditions Générales d'Utilisation
            </h1>
            
            <p style={{ 
              fontSize: '1.1rem',
              opacity: 0.95,
              lineHeight: 1.6,
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Dernière mise à jour : 21 octobre 2025
            </p>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              33% { transform: translateY(-15px) rotate(3deg); }
              66% { transform: translateY(-8px) rotate(-2deg); }
            }
          `}} />
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
              background: 'linear-gradient(90deg, #D79077, #4ECDC4, #FFD700)',
              borderRadius: '28px 28px 0 0'
            }}></div>

            <div style={{ 
              color: '#1F2937', 
              lineHeight: 1.8,
              fontSize: '1rem'
            }}>
              {/* Introduction */}
              <div style={{ marginBottom: '48px' }}>
                <p style={{ 
                  fontSize: '1.1rem', 
                  color: '#4B5563',
                  marginBottom: '24px',
                  paddingLeft: '20px',
                  borderLeft: '4px solid #4ECDC4'
                }}>
                  Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation de la plateforme Kokyage.com (ci-après « la Plateforme »), exploitée par Kokyage.
                </p>
              </div>

              {/* Article 1 */}
              <article style={{ marginBottom: '56px' }}>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  color: '#111827',
                  marginBottom: '16px',
                  letterSpacing: '-0.01em'
                }}>
                  Article 1 — Objet de la plateforme
                </h2>
                <p style={{ marginBottom: '16px' }}>
                  Kokyage est une plateforme de mise en relation entre propriétaires immobiliers (« Hôtes ») et locataires à la recherche d'un logement temporaire (« Voyageurs »).
                </p>
                <p>
                  La Plateforme permet aux Hôtes de proposer leurs biens immobiliers à la location et aux Voyageurs de réserver ces logements pour une période déterminée.
                </p>
              </article>

              {/* Article 2 */}
              <article style={{ marginBottom: '56px' }}>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  color: '#111827',
                  marginBottom: '16px',
                  letterSpacing: '-0.01em'
                }}>
                  Article 2 — Acceptation des CGU
                </h2>
                <p style={{ marginBottom: '16px' }}>
                  L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser la Plateforme.
                </p>
                <p>
                  En créant un compte ou en utilisant nos services, vous déclarez avoir lu, compris et accepté les présentes CGU ainsi que notre Politique de Confidentialité.
                </p>
              </article>

              {/* Article 3 */}
              <article style={{ marginBottom: '56px' }}>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  color: '#111827',
                  marginBottom: '16px',
                  letterSpacing: '-0.01em'
                }}>
                  Article 3 — Inscription et compte utilisateur
                </h2>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', marginTop: '24px', color: '#374151' }}>
                  3.1 Création de compte
                </h3>
                <p style={{ marginBottom: '16px' }}>
                  Pour accéder à certaines fonctionnalités de la Plateforme, vous devez créer un compte utilisateur en fournissant des informations exactes, complètes et à jour.
                </p>
                
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', marginTop: '24px', color: '#374151' }}>
                  3.2 Sécurité du compte
                </h3>
                <p style={{ marginBottom: '16px' }}>
                  Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toutes les activités réalisées depuis votre compte. Vous devez nous informer immédiatement en cas d'utilisation non autorisée de votre compte.
                </p>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', marginTop: '24px', color: '#374151' }}>
                  3.3 Conditions d'éligibilité
                </h3>
                <p>
                  Vous devez être âgé d'au moins 18 ans pour créer un compte et utiliser nos services. En vous inscrivant, vous garantissez avoir la capacité juridique de contracter.
                </p>
              </article>

              {/* Article 4 */}
              <article style={{ marginBottom: '56px' }}>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  color: '#111827',
                  marginBottom: '16px',
                  letterSpacing: '-0.01em'
                }}>
                  Article 4 — Obligations des utilisateurs
                </h2>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', marginTop: '24px', color: '#374151' }}>
                  4.1 Comportement
                </h3>
                <p style={{ marginBottom: '16px' }}>
                  Vous vous engagez à utiliser la Plateforme de manière responsable, légale et respectueuse envers les autres utilisateurs.
                </p>
                
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', marginTop: '24px', color: '#374151' }}>
                  4.2 Interdictions
                </h3>
                <div style={{
                  background: '#FEF3C7',
                  padding: '20px',
                  borderRadius: '12px',
                  borderLeft: '4px solid #F59E0B',
                  marginBottom: '16px'
                }}>
                  <p style={{ margin: 0, color: '#78350F' }}>
                    Il est strictement interdit de : publier du contenu illégal, frauduleux ou trompeur ; usurper l'identité d'une autre personne ; violer les droits de propriété intellectuelle ; tenter d'accéder de manière non autorisée à la Plateforme ou à ses systèmes.
                  </p>
                </div>
              </article>

              {/* Article 5 */}
              <article style={{ marginBottom: '48px' }}>
                <div style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '16px'
                }}>
                  Article 5
                </div>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '20px'
                }}>
                  Réservations et paiements
                </h2>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', marginTop: '24px', color: '#374151' }}>
                  5.1 Processus de réservation
                </h3>
                <p style={{ marginBottom: '16px' }}>
                  Les Voyageurs peuvent effectuer des réservations via la Plateforme. Chaque réservation est soumise à l'acceptation de l'Hôte et au paiement du montant dû.
                </p>
                
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', marginTop: '24px', color: '#374151' }}>
                  5.2 Paiement sécurisé
                </h3>
                <p style={{ marginBottom: '16px' }}>
                  Les paiements sont traités de manière sécurisée via notre prestataire Stripe. Kokyage ne stocke pas vos données bancaires complètes.
                </p>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', marginTop: '24px', color: '#374151' }}>
                  5.3 Frais de service
                </h3>
                <p>
                  Kokyage prélève une commission sur chaque réservation. Les frais applicables sont clairement affichés avant la confirmation de la réservation.
                </p>
              </article>

              {/* Article 6 */}
              <article style={{ marginBottom: '48px' }}>
                <div style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '16px'
                }}>
                  Article 6
                </div>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '20px'
                }}>
                  Annulation et remboursement
                </h2>
                <p style={{ marginBottom: '16px' }}>
                  Les conditions d'annulation et de remboursement sont définies par chaque Hôte et indiquées dans l'annonce du logement. En effectuant une réservation, vous acceptez la politique d'annulation applicable.
                </p>
                <p>
                  En cas de circonstances exceptionnelles, Kokyage se réserve le droit d'appliquer des conditions d'annulation spécifiques pour protéger les intérêts des Voyageurs et des Hôtes.
                </p>
              </article>

              {/* Article 7 */}
              <article style={{ marginBottom: '48px' }}>
                <div style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '16px'
                }}>
                  Article 7
                </div>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '20px'
                }}>
                  Responsabilité
                </h2>
                <p style={{ marginBottom: '16px' }}>
                  Kokyage agit en tant qu'intermédiaire entre Hôtes et Voyageurs. La Plateforme ne saurait être tenue responsable des dommages résultant de l'utilisation des logements réservés ou des relations entre utilisateurs.
                </p>
                <p>
                  Nous nous efforçons de maintenir la Plateforme accessible et fonctionnelle, mais ne garantissons pas une disponibilité ininterrompue ou exempte d'erreurs.
                </p>
              </article>

              {/* Article 8 */}
              <article style={{ marginBottom: '48px' }}>
                <div style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '16px'
                }}>
                  Article 8
                </div>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '20px'
                }}>
                  Protection des données personnelles
                </h2>
                <p style={{ marginBottom: '16px' }}>
                  La collecte et le traitement de vos données personnelles sont régis par notre Politique de Confidentialité, accessible sur la Plateforme.
                </p>
                <p>
                  Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données personnelles.
                </p>
              </article>

              {/* Article 9 */}
              <article style={{ marginBottom: '48px' }}>
                <div style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #14B8A6, #0D9488)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '16px'
                }}>
                  Article 9
                </div>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '20px'
                }}>
                  Modification des CGU
                </h2>
                <p>
                  Kokyage se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur la Plateforme. Votre utilisation continue de la Plateforme après une modification constitue votre acceptation des nouvelles CGU.
                </p>
              </article>

              {/* Article 10 */}
              <article style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #A855F7, #9333EA)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '16px'
                }}>
                  Article 10
                </div>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '20px'
                }}>
                  Droit applicable et juridiction
                </h2>
                <p style={{ marginBottom: '16px' }}>
                  Les présentes CGU sont régies par le droit français. Tout litige relatif à leur interprétation ou leur exécution sera soumis aux tribunaux compétents français.
                </p>
              </article>

              {/* Contact Section */}
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
                  Pour toute question concernant ces CGU, vous pouvez nous contacter :
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