/**
 * Génère le texte complet de l'accord de consentement pour archivage juridique
 */
export function generateOwnerConsentText({ ownerName, tenantName, fullAddress }) {
  const acceptanceDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
ACCORD DE CONSENTEMENT DU PROPRIÉTAIRE
Version 1.0 - Accepté le ${acceptanceDate}

═══════════════════════════════════════════════════════════════

Entre :
${ownerName}, ci-après dénommé « le Propriétaire ».

Et :
${tenantName}, titulaire du bail pour le logement situé ${fullAddress}, ci-après dénommé « le Locataire Principal ».

═══════════════════════════════════════════════════════════════

ARTICLE 1 – OBJET

Le Propriétaire autorise expressément le Locataire Principal à sous-louer temporairement à des tiers pour l'utilisation du bien susmentionné, exclusivement sur Kokyage.com et dans les conditions prévues aux articles suivants.

ARTICLE 2 – CONDITIONS DE MISE À DISPOSITION

Le Locataire Principal s'engage à :

1. Recourir exclusivement à la plateforme Kokyage.com pour toute mise à disposition du logement, sauf accord écrit préalable du Propriétaire ;

2. S'il s'agit de sa résidence principale, ne pas sous-louer le logement plus de cent vingt (120) nuitées par année civile, conformément à la réglementation applicable ;

3. Assurer la conformité des mises à disposition avec les réglementations locales en vigueur ;

4. Maintenir le logement en bon état d'usage pendant toute la durée de l'occupation par un tiers, et assumer l'entière responsabilité des éventuelles dégradations causées par les occupants.

ARTICLE 3 – DURÉE ET RÉSILIATION

Le présent accord est conclu pour une durée indéterminée à compter de la signature.

Il peut être résilié à tout moment par le Propriétaire, via la plateforme Kokyage.com, moyennant un préavis de quatorze (14) jours.

L'accord reste valable tant que le Locataire Principal demeure titulaire du bail du logement susmentionné.

En cas de résiliation, Kokyage.com se réserve le droit d'annuler toutes les réservations en cours dont la date de fin excède le délai de préavis, à compter de la réception de ladite résiliation.

En cas de non-respect des CGU, Kokyage.com se réserve le droit d'annuler toutes les réservations sans préavis ainsi que de clôturer l'annonce.

ARTICLE 4 – CLAUSE DE NON-TRANSFERT

Le présent accord est strictement personnel au Locataire Principal et ne peut être cédé à un tiers, même en cas de transfert du bail.

ARTICLE 5 – INFORMATION DU PROPRIÉTAIRE

Le Propriétaire reconnaît avoir été pleinement informé du fonctionnement de la plateforme Kokyage.com et des conditions de sous-location. Il déclare donner son accord en toute connaissance de cause.

═══════════════════════════════════════════════════════════════

ATTESTATIONS

☑ Le Locataire Principal atteste sur l'honneur que les informations fournies sont exactes et complètes.

☑ Le Locataire Principal atteste avoir l'accord de son propriétaire pour sous-louer ce logement et accepte les termes de l'accord de consentement ci-dessus.

═══════════════════════════════════════════════════════════════

Fait le ${acceptanceDate}
Accepté électroniquement sur Kokyage.com
  `.trim();
}
