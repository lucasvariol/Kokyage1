import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import Header from '../_components/Header';
import Footer from '../_components/Footer';

export const metadata = {
  title: 'Conditions Générales d’Utilisation | Kokyage',
  description: 'Consultez les Conditions Générales d’Utilisation de Kokyage.'
};

function getCGUContent() {
  try {
    const filePath = path.join(process.cwd(), 'content', 'cgu.md');
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return '# Conditions Générales d’Utilisation (CGU)\n\nContenu indisponible. Créez le fichier content/cgu.md.';
  }
}

export default function Page() {
  const content = getCGUContent();
  return (
    <>
      <Header />
      <main style={{
        fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        background: 'linear-gradient(135deg, #F5F1ED 0%, #E8E3DC 100%)',
        minHeight: '100vh'
      }}>
        <section style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px 80px' }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
            padding: '32px'
          }}>
            <article className="markdown-body">
              <ReactMarkdown>{content}</ReactMarkdown>
            </article>
          </div>
        </section>
      </main>
      <Footer />
      <style jsx>{`
        .markdown-body h1 { font-size: 2rem; font-weight: 800; color: #2D3748; margin: 0 0 16px; }
        .markdown-body h2 { font-size: 1.5rem; font-weight: 800; color: #2D3748; margin: 32px 0 12px; }
        .markdown-body h3 { font-size: 1.25rem; font-weight: 700; color: #2D3748; margin: 24px 0 8px; }
        .markdown-body p  { color: #4A5568; line-height: 1.8; margin: 0 0 12px; }
        .markdown-body ul { color: #4A5568; line-height: 1.8; margin: 0 0 12px 20px; }
        .markdown-body li { margin: 6px 0; }
        .markdown-body hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
        .markdown-body blockquote { border-left: 4px solid #E2E8F0; padding: 8px 16px; color: #4A5568; background:#F8FAFC; border-radius: 6px; }
        @media (max-width: 768px) {
          .markdown-body h1 { font-size: 1.6rem; }
          .markdown-body h2 { font-size: 1.25rem; }
        }
      `}</style>
    </>
  );
}
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