export function OwnerConsentAgreement({ ownerName = 'Le Propriétaire', tenantName = 'Nom du locataire principal', fullAddress = '' }) {
  return (
    <div style={{ color: '#334155' }}>
      <div style={{ fontWeight: 800, fontSize: 18, textAlign: 'center', marginBottom: 12 }}>
        ACCORD DE CONSENTEMENT DU PROPRIÉTAIRE
      </div>
      <div style={{ height: 1, background: '#E2E8F0', margin: '8px 0 16px' }} />

      <div style={{ fontWeight: 700, marginTop: 8 }}>Entre</div>
      <p style={{ marginTop: 4 }}>{ownerName}, ci-après dénommé « le Propriétaire ».</p>

      <div style={{ fontWeight: 700, marginTop: 12 }}>Et</div>
      <p style={{ marginTop: 4 }}>{tenantName}, demeurant à [Adresse complète], titulaire du bail pour le logement situé {fullAddress}, ci-après dénommé « le Locataire Principal ».</p>

      <div style={{ fontWeight: 700, marginTop: 16 }}>Article 1 – Objet</div>
      <p style={{ marginTop: 4 }}>Le Propriétaire autorise expressément le Locataire Principal à sous-louer temporairement à des tiers pour l’utilisation du bien susmentionné, dans les conditions prévues aux articles suivants.</p>

      <div style={{ fontWeight: 700, marginTop: 16 }}>Article 2 – Conditions de mise à disposition</div>
      <p style={{ marginTop: 4 }}>Le Locataire Principal s’engage à :</p>
      <div style={{ paddingLeft: 14 }}>
        <p>1. Ne pas sous-louer le logement plus de cent vingt (120) nuitées par année civile, conformément à la réglementation applicable ;</p>
        <p>2. Recourir exclusivement à la plateforme Kokyage.com pour toute mise à disposition du logement, sauf accord écrit préalable du Propriétaire ;</p>
        <p>3. Assurer la conformité des mises à disposition avec les réglementations locales en vigueur ;</p>
        <p>4. Maintenir le logement en bon état d’usage pendant toute la durée de l’occupation par un tiers, et assumer l’entière responsabilité des éventuelles dégradations causées par les occupants.</p>
      </div>

      <div style={{ fontWeight: 700, marginTop: 16 }}>Article 3 – Responsabilité et assurances</div>
      <p style={{ marginTop: 4 }}>Le Locataire Principal s’engage à :</p>
      <div style={{ paddingLeft: 14 }}>
        <p>• Souscrire une assurance habitation couvrant les risques liés à l’occupation temporaire du logement par des tiers ;</p>
        <p>• Fournir une attestation d’assurance au Propriétaire sur simple demande ;</p>
        <p>• Respecter l’ensemble des obligations légales, notamment celles relatives à la sécurité, à la tranquillité du voisinage et à la protection des biens.</p>
      </div>

      <div style={{ fontWeight: 700, marginTop: 16 }}>Article 4 – Durée et résiliation</div>
      <p style={{ marginTop: 4 }}>Le présent accord est conclu pour une durée indéterminée à compter de la signature.</p>
      <p>Il peut être résilié à tout moment par le Propriétaire, via la plateforme Kokyage.com, moyennant un préavis de trente (30) jours.</p>
      <p>L’accord reste valable tant que le Locataire Principal demeure titulaire du bail du logement susmentionné.</p>
      <p>En cas de résiliation, Kokyage.com se réserve le droit d’annuler toutes les réservations en cours dont la date de fin excède le délai de préavis, à compter de la réception de ladite résiliation.</p>
      <p>En cas de non-respect des CGU, Kokyage.com se réserve le droit d’annuler toutes les réservations sans préavis ainsi que de clôturer l’annonce.</p>
      <p>Cette disposition vise à garantir une exécution loyale des engagements envers les voyageurs, tout en respectant la volonté du Propriétaire.</p>

      <div style={{ fontWeight: 700, marginTop: 16 }}>Article 5 – Clause de non-transfert</div>
      <p style={{ marginTop: 4 }}>Le présent accord est strictement personnel au Locataire Principal et ne peut être cédé à un tiers, même en cas de transfert du bail.</p>

      <div style={{ fontWeight: 700, marginTop: 16 }}>Article 6 – Information du propriétaire</div>
      <p style={{ marginTop: 4 }}>Reconnaît avoir été pleinement informé du fonctionnement de la plateforme Kokyage.com et des conditions de sous-location. Il déclare donner son accord en toute connaissance de cause.</p>
    </div>
  );
}
