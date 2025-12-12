import './globals.css';
import CookieBanner from './_components/CookieBanner';
import { GoogleAnalytics } from './_components/GoogleAnalytics';

export const metadata = {
  title: 'Kokyage - Sous-louez pendant vos vacances',
  description: 'Sous-louez votre logement pendant vos vacances avec Kokyage. Partagez les revenus avec votre propriétaire.',
  keywords: 'sous-location légale, sous louer appartement, location courte durée, Airbnb, légal, partage revenus locatifs, accord propriétaire, sous location vacances, louer son appartement, revenus complémentaires, location saisonnière, sous-location autorisée, comment sous louer son appartement, puis je sous louer mon appartement, sous location avec accord propriétaire, gagner argent avec son logement, louer appartement vacances, location meublée courte durée, airbnb avec accord bailleur, sous louer légalement, revenus passifs immobilier, location saisonnière légale, sous location bail, autorisation sous location, partage revenus location, plateforme sous-location, sous louer pendant vacances, rentabiliser son logement, loi alur sous-location, sous location réglementée, contrat sous-location, location temporaire appartement, logement courte durée Paris Lyon Marseille Bordeaux Nice Toulouse Nantes, kokyage, cokyage, coquillage',
  authors: [{ name: 'Kokyage' }],
  openGraph: {
    title: 'Kokyage - Sous-louez pendant vos vacances',
    description: 'Sous-louez votre logement pendant vos vacances avec Kokyage. Partagez les revenus avec votre propriétaire.',
    url: 'https://kokyage.com',
    siteName: 'Kokyage',
    images: [
      {
        url: '/favicon.png',
        width: 128,
        height: 128,
        alt: 'Kokyage',
      }
    ],
    locale: 'fr_FR', 
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kokyage - Sous-louez pendant vos vacances',
    description: 'Sous-louez votre logement pendant vos vacances avec Kokyage. Partagez les revenus avec votre propriétaire.',
    images: ['/favicon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: 'https://kokyage.com',
  },
};

export default function RootLayout({ children }) {
  // Données structurées JSON-LD pour les sitelinks Google
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Kokyage.com",
    "url": "https://kokyage.com",
    "description": "Sous-louez votre logement pendant vos vacances avec Kokyage. Partagez les revenus avec votre propriétaire.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://kokyage.com/logements?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "hasPart": [
      {
        "@type": "WebPage",
        "name": "Trouver un Logement",
        "description": "Partez dans une aventure authentique chez l'habitant.",
        "url": "https://kokyage.com/je-recherche-un-logement"
      },
      {
        "@type": "WebPage",
        "name": "Sous-louer mon Logement",
        "description": "Gagnez des revenus complémentaires en sous-louant votre logement en partageant les revenus avec votre propriétaire.",
        "url": "https://kokyage.com/sous-louer"
      },
      {
        "@type": "WebPage",
        "name": "Comment ça Marche",
        "description": "Découvrez le fonctionnement de Kokyage : partage de revenus 60/40, accord propriétaire en ligne, 100% légal.",
        "url": "https://kokyage.com/fonctionnement"
      }
    ]
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kokyage",
    "url": "https://kokyage.com",
    "logo": "https://kokyage.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "contact@kokyage.com",
      "contactType": "Customer Service",
      "availableLanguage": "French"
    },
    "sameAs": [
      "https://www.facebook.com/kokyage",
      "https://www.instagram.com/kokyage",
      "https://www.linkedin.com/company/kokyage"
    ]
  };

  return (
    <html lang="fr">
      <head>
        <link rel="icon" type="image/png" sizes="128x128" href="/favicon.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        
        {/* Données structurées pour Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
      </head>
      <body>
        <GoogleAnalytics />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
