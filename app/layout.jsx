import './globals.css';
import CookieBanner from './_components/CookieBanner';

export const metadata = {
  title: 'Kokyage - Sous-location Légale | Partagez vos Revenus Locatifs avec votre Propriétaire',
  description: 'Sous-louez légalement votre logement pendant vos vacances. Partage de revenus 60/40 avec votre propriétaire. Airbnb légal, location courte durée autorisée, accord propriétaire en ligne.',
  keywords: 'sous-location légale, sous louer appartement, location courte durée, Airbnb légal, partage revenus locatifs, accord propriétaire, sous location vacances, louer son appartement, revenus complémentaires, location saisonnière, sous-location autorisée',
  authors: [{ name: 'Kokyage' }],
  openGraph: {
    title: 'Kokyage - Sous-location Légale avec Partage de Revenus',
    description: 'Sous-louez votre logement pendant vos absences. 60% pour vous, 40% pour votre propriétaire. 100% légal avec accord électronique. Location courte durée autorisée.',
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
    title: 'Kokyage - Sous-location Légale avec Partage de Revenus',
    description: 'Sous-louez votre logement pendant vos absences. 60% pour vous, 40% pour votre propriétaire. 100% légal.',
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
  verification: {
    google: 'votre-code-google-search-console', // À remplacer par votre code
  },
  alternates: {
    canonical: 'https://kokyage.com',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" type="image/png" sizes="128x128" href="/favicon.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        {children}
        {/* <CookieBanner /> */}
      </body>
    </html>
  );
}
