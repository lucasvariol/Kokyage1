
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
              <span style={{ fontSize: '2rem' }}>🔒</span>
            </div>
            
            <h1 style={{ 
              fontSize: 'clamp(2rem, 4vw, 2.75rem)', 
              fontWeight: 800, 
              marginBottom: '12px',
              letterSpacing: '-0.02em',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}>
              Politique de Confidentialité
            </h1>
            
            <p style={{ 
              fontSize: '1.1rem',
              opacity: 0.95,
              lineHeight: 1.6,
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Protection et respect de vos données personnelles
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
              {/* Introduction */}
              <div style={{ 
                marginBottom: '48px',
                padding: '24px',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.05))',
                borderRadius: '12px',
                borderLeft: '4px solid #8B5CF6'
              }}>
                <p style={{ color: '#4B5563', margin: 0 }}>
                  Chez Kokyage, nous nous engageons à protéger votre vie privée et vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations conformément au Règlement Général sur la Protection des Données (RGPD).
                </p>
              </div>

              {/* Responsable du traitement */}
              <article style={{ marginBottom: '48px' }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  Responsable du traitement des données
                </h2>
                <p style={{ marginBottom: '12px', color: '#4B5563' }}>
                  Le responsable du traitement de vos données personnelles est :
                </p>
                <div style={{ 
                  background: '#F9FAFB', 
                  padding: '20px', 
                  borderRadius: '12px',
                  marginTop: '16px'
                }}>
                  <p style={{ margin: 0, color: '#1F2937' }}>
                    <strong>Kokyage</strong><br />
                    Email : <a href="mailto:contact@kokyage.com" style={{ color: '#4ECDC4', textDecoration: 'none', fontWeight: 600 }}>contact@kokyage.com</a>
                  </p>
                </div>
              </article>

              {/* Données collectées */}
              <article style={{ marginBottom: '48px' }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  Données personnelles collectées
                </h2>
                <p style={{ marginBottom: '20px', color: '#4B5563' }}>
                  Nous collectons les données suivantes lors de votre utilisation de notre plateforme :
                </p>

                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 700, 
                    color: '#374151',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ color: '#4ECDC4' }}>•</span> Données d'inscription
                  </h3>
                  <ul style={{ color: '#4B5563', paddingLeft: '28px', lineHeight: 1.8 }}>
                    <li>Nom et prénom</li>
                    <li>Adresse email</li>
                    <li>Numéro de téléphone</li>
                    <li>Mot de passe (crypté)</li>
                  </ul>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 700, 
                    color: '#374151',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ color: '#8B5CF6' }}>•</span> Données de réservation
                  </h3>
                  <ul style={{ color: '#4B5563', paddingLeft: '28px', lineHeight: 1.8 }}>
                    <li>Dates de séjour</li>
                    <li>Nombre de voyageurs</li>
                    <li>Informations de paiement (traitées via Stripe)</li>
                  </ul>
                </div>

                <div>
                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 700, 
                    color: '#374151',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ color: '#3B82F6' }}>•</span> Données de navigation
                  </h3>
                  <ul style={{ color: '#4B5563', paddingLeft: '28px', lineHeight: 1.8 }}>
                    <li>Adresse IP</li>
                    <li>Type de navigateur</li>
                    <li>Pages visitées</li>
                    <li>Cookies (voir section dédiée)</li>
                  </ul>
                </div>
              </article>

              {/* Finalités */}
              <article style={{ marginBottom: '48px' }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  Utilisation de vos données
                </h2>
                <p style={{ marginBottom: '16px', color: '#4B5563' }}>
                  Vos données personnelles sont collectées et traitées pour les finalités suivantes :
                </p>
                <ul style={{ color: '#4B5563', paddingLeft: '28px', lineHeight: 2 }}>
                  <li>Créer et gérer votre compte utilisateur</li>
                  <li>Traiter vos réservations et paiements</li>
                  <li>Permettre la communication entre hôtes et voyageurs</li>
                  <li>Vous envoyer des notifications importantes (confirmations, rappels)</li>
                  <li>Améliorer nos services et votre expérience utilisateur</li>
                  <li>Assurer la sécurité et prévenir les fraudes</li>
                  <li>Respecter nos obligations légales et réglementaires</li>
                </ul>
              </article>

              {/* Durée de conservation */}
              <article style={{ marginBottom: '48px' }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  Durée de conservation
                </h2>
                <p style={{ marginBottom: '16px', color: '#4B5563' }}>
                  Nous conservons vos données personnelles pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées :
                </p>
                <div style={{ 
                  background: '#F9FAFB', 
                  padding: '20px', 
                  borderRadius: '12px',
                  marginTop: '16px'
                }}>
                  <ul style={{ color: '#4B5563', margin: 0, paddingLeft: '28px', lineHeight: 2 }}>
                    <li>Données de compte : pendant toute la durée de votre inscription + 3 ans après la fermeture</li>
                    <li>Données de réservation : 10 ans pour répondre aux obligations comptables</li>
                    <li>Cookies : 13 mois maximum</li>
                  </ul>
                </div>
              </article>

              {/* Vos droits */}
              <article style={{ marginBottom: '48px' }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  Vos droits RGPD
                </h2>
                <p style={{ marginBottom: '20px', color: '#4B5563' }}>
                  Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
                </p>

                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(78,205,196,0.05), transparent)',
                    padding: '20px',
                    borderRadius: '12px',
                    borderLeft: '4px solid #4ECDC4'
                  }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>
                      Droit d'accès
                    </h3>
                    <p style={{ color: '#4B5563', margin: 0 }}>
                      Vous pouvez demander l'accès à vos données personnelles.
                    </p>
                  </div>

                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.05), transparent)',
                    padding: '20px',
                    borderRadius: '12px',
                    borderLeft: '4px solid #8B5CF6'
                  }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>
                      Droit de rectification
                    </h3>
                    <p style={{ color: '#4B5563', margin: 0 }}>
                      Vous pouvez demander la correction de données inexactes ou incomplètes.
                    </p>
                  </div>

                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.05), transparent)',
                    padding: '20px',
                    borderRadius: '12px',
                    borderLeft: '4px solid #3B82F6'
                  }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>
                      Droit à l'effacement
                    </h3>
                    <p style={{ color: '#4B5563', margin: 0 }}>
                      Vous pouvez demander la suppression de vos données (sous réserve de nos obligations légales).
                    </p>
                  </div>

                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(236,72,153,0.05), transparent)',
                    padding: '20px',
                    borderRadius: '12px',
                    borderLeft: '4px solid #EC4899'
                  }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>
                      Droit à la portabilité
                    </h3>
                    <p style={{ color: '#4B5563', margin: 0 }}>
                      Vous pouvez recevoir vos données dans un format structuré et lisible.
                    </p>
                  </div>

                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.05), transparent)',
                    padding: '20px',
                    borderRadius: '12px',
                    borderLeft: '4px solid #F59E0B'
                  }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>
                      Droit d'opposition
                    </h3>
                    <p style={{ color: '#4B5563', margin: 0 }}>
                      Vous pouvez vous opposer au traitement de vos données à des fins de marketing direct.
                    </p>
                  </div>
                </div>

                <p style={{ marginTop: '20px', color: '#4B5563', fontStyle: 'italic' }}>
                  Pour exercer vos droits, contactez-nous à <a href="mailto:contact@kokyage.com" style={{ color: '#4ECDC4', textDecoration: 'none', fontWeight: 600 }}>contact@kokyage.com</a>
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
                  Cookies et technologies similaires
                </h2>
                <p style={{ marginBottom: '16px', color: '#4B5563' }}>
                  Notre site utilise des cookies pour améliorer votre expérience et assurer le bon fonctionnement de nos services.
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                    Cookies essentiels
                  </h3>
                  <p style={{ color: '#4B5563', margin: 0 }}>
                    Nécessaires au fonctionnement du site (authentification, session). Ils ne peuvent pas être désactivés.
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                    Cookies analytiques
                  </h3>
                  <p style={{ color: '#4B5563', margin: 0 }}>
                    Nous permettent de comprendre comment les visiteurs utilisent notre site pour l'améliorer.
                  </p>
                </div>

                <p style={{ color: '#4B5563', marginTop: '20px' }}>
                  Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
                </p>
              </article>

              {/* Sécurité */}
              <article style={{ marginBottom: '48px' }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  Sécurité de vos données
                </h2>
                <p style={{ marginBottom: '16px', color: '#4B5563' }}>
                  Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles :
                </p>
                <ul style={{ color: '#4B5563', paddingLeft: '28px', lineHeight: 2 }}>
                  <li>Chiffrement des données sensibles (SSL/TLS)</li>
                  <li>Authentification sécurisée avec Supabase</li>
                  <li>Paiements sécurisés via Stripe (certifié PCI-DSS)</li>
                  <li>Accès limité aux données personnelles</li>
                  <li>Sauvegardes régulières</li>
                  <li>Surveillance continue des accès</li>
                </ul>
              </article>

              {/* Partage */}
              <article style={{ marginBottom: '48px' }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  Partage de vos données
                </h2>
                <p style={{ marginBottom: '16px', color: '#4B5563' }}>
                  Nous ne vendons jamais vos données personnelles. Nous pouvons les partager uniquement avec :
                </p>
                <ul style={{ color: '#4B5563', paddingLeft: '28px', lineHeight: 2 }}>
                  <li><strong>Stripe</strong> : pour le traitement sécurisé des paiements</li>
                  <li><strong>Supabase</strong> : pour l'hébergement et la gestion de la base de données</li>
                  <li><strong>Vercel</strong> : pour l'hébergement du site web</li>
                  <li><strong>Autorités légales</strong> : si requis par la loi</li>
                </ul>
                <p style={{ marginTop: '16px', color: '#4B5563' }}>
                  Ces partenaires sont contractuellement tenus de protéger vos données et de les utiliser uniquement aux fins spécifiées.
                </p>
              </article>

              {/* Modifications */}
              <article style={{ marginBottom: '48px' }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  color: '#1F2937',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  Modifications de la politique
                </h2>
                <p style={{ color: '#4B5563' }}>
                  Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. En cas de modification substantielle, nous vous en informerons par email ou via une notification sur le site. La date de dernière mise à jour est indiquée en haut de cette page.
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
                  Questions sur vos données ?
                </h3>
                <p style={{ marginBottom: '12px', color: '#4B5563' }}>
                  Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits :
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
