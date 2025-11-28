export function OwnerConsentAgreement({ ownerName = 'Le Propriétaire', tenantName = 'Nom du locataire principal', fullAddress = '' }) {
  return (
    <div style={{ color: '#334155', lineHeight: '1.6' }}>
      <div style={{ fontWeight: 800, fontSize: 18, textAlign: 'center', marginBottom: 16 }}>
        ACCORD DE SOUS-LOCATION SUR KOKYAGE.COM
      </div>
      <div style={{ height: 1, background: '#E2E8F0', margin: '8px 0 20px' }} />

      <p style={{ marginTop: 0, marginBottom: 16 }}>
        <strong>{ownerName}</strong>, propriétaire du logement sis <strong>{fullAddress}</strong>, autorise <strong>{tenantName}</strong>, titulaire du bail, à sous-louer temporairement ledit bien sur la plateforme Kokyage.com. Le Propriétaire accorde au Locataire principal la liberté de fixer les dates de sous-location ainsi que le montant des nuitées.
      </p>

      <p style={{ marginBottom: 16 }}>
        Les modalités de location et de partage des revenus sont précisées dans les Conditions Générales d'Utilisation, accessibles <a href="/cgu" target="_blank" style={{ color: '#D79077', fontWeight: 600, textDecoration: 'underline' }}>ici</a>.
      </p>

      <p style={{ marginBottom: 16 }}>
        Le présent accord ne s'applique qu'aux sous-locations publiées via Kokyage.com.
      </p>

      <p style={{ marginBottom: 16 }}>
        Le Propriétaire peut y mettre fin à tout moment depuis la plateforme, sous réserve d'un préavis de quatorze (14) jours.
      </p>

      <p style={{ marginBottom: 16 }}>
        En cas de résiliation, toute réservation dont la date de fin excède le délai de préavis, à compter de la réception de ladite résiliation, sera annulée.
      </p>

      <p style={{ marginBottom: 0 }}>
        À défaut de résiliation, le présent accord demeure en vigueur tant que le Locataire principal reste titulaire du bail du logement.
      </p>
    </div>
  );
}
