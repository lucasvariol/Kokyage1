import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

const OWNER_CONSENT_MD = `
# ACCORD DE SOUS-LOCATION SUR KOKYAGE.COM

**{ownerName}**, propriétaire du logement sis **{fullAddress}**, autorise **{tenantName}**, titulaire du bail, à sous-louer temporairement ledit bien sur la plateforme Kokyage.com. Le Propriétaire accorde au Locataire principal la liberté de fixer les dates de sous-location ainsi que le montant des nuitées.

Les modalités de location et de partage des revenus sont précisées dans les Conditions Générales d'Utilisation, accessibles [ici](/cgu).

Le présent accord ne s'applique qu'aux sous-locations publiées via Kokyage.com.

Le Propriétaire peut y mettre fin à tout moment depuis la plateforme, sous réserve d'un préavis de quatorze (14) jours.

En cas de résiliation, toute réservation dont la date de fin excède le délai de préavis, à compter de la réception de ladite résiliation, sera annulée.

À défaut de résiliation, le présent accord demeure en vigueur tant que le Locataire principal reste titulaire du bail du logement.
`;

/**
 * Génère le texte brut de l'accord pour sauvegarde en DB
 */
export function getOwnerConsentText({ ownerName = 'Le Propriétaire', tenantName = 'Nom du locataire principal', fullAddress = '' }) {
  return OWNER_CONSENT_MD
    .replace('{ownerName}', ownerName)
    .replace('{tenantName}', tenantName)
    .replace('{fullAddress}', fullAddress)
    .trim();
}

const customComponents = {
  h1: ({node, ...props}) => (
    <>
      <h1 style={{fontSize: 18, fontWeight: 800, textAlign: 'center', margin: '0 0 16px', color: '#334155'}} {...props} />
      <div style={{ height: 1, background: '#E2E8F0', margin: '8px 0 20px' }} />
    </>
  ),
  p: ({node, ...props}) => <p style={{color: '#334155', lineHeight: 1.6, margin: '0 0 16px'}} {...props} />,
  strong: ({node, ...props}) => <strong style={{fontWeight: 700}} {...props} />,
  a: ({node, ...props}) => <a style={{color: '#D79077', fontWeight: 600, textDecoration: 'underline'}} target="_blank" {...props} />
};

export function OwnerConsentAgreement({ ownerName = 'Le Propriétaire', tenantName = 'Nom du locataire principal', fullAddress = '' }) {
  const content = getOwnerConsentText({ ownerName, tenantName, fullAddress });

  return (
    <div style={{ color: '#334155', lineHeight: '1.6' }}>
      <ReactMarkdown 
        components={customComponents}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
