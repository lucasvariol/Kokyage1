
'use client';

export default function Footer(){
  const handleManageCookies = (e) => {
    e.preventDefault();
    localStorage.removeItem('cookieConsent');
    localStorage.removeItem('cookieConsentDate');
    window.location.reload();
  };

  return (
    <footer>
      <p>&copy; 2025 Kokyage</p>
      <nav className="footer-links">
        <a href="/mentions">Mentions légales</a>
        {' | '}
        <a href="/cgu">CGU</a>
        {' | '}
        <a href="/privacy">Politique de confidentialité</a>
        {' | '}
        <a href="#" onClick={handleManageCookies}>Gérer les cookies</a>
      </nav>
    </footer>
  );
}
