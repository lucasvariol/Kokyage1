
import Header from '../_components/Header';
import Footer from '../_components/Footer';

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <h1>FAQ / Aide</h1>
        <h2>Locataires</h2>
        <ul className="faq-list">
          <li>
            <b>Sous-louer légalement&nbsp;?</b> Oui, accord propriétaire via la plateforme.
          </li>
        </ul>
        <h2>Propriétaires</h2>
        <ul className="faq-list">
          <li>
            <b>Rémunération&nbsp;?</b> 50% des revenus, automatiquement.
          </li>
        </ul>
        <h2>Voyageurs</h2>
        <ul className="faq-list">
          <li>
            <b>Réservation&nbsp;?</b> Inscription puis recherche par dates.
          </li>
        </ul>
      </main>
      <Footer />
    </>
  );
}
