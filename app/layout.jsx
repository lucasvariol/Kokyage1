import './globals.css';
import CookieBanner from './_components/CookieBanner';

export const metadata = {
  title: 'Kokyage',
  description: 'Plateforme de co-gestion locative'
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
        <CookieBanner />
      </body>
    </html>
  );
}
