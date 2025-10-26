
import Header from '../_components/Header';
import Footer from '../_components/Footer';

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <h1>À propos</h1>
        <section>
          <h2>Mission</h2>
          <p>Réinventer le modèle locatif via la co‑gestion légale et sécurisée.</p>
        </section>
        <section>
          <h2>Fondateur</h2>
          <p>Lucas Variol</p>
        </section>
        <section>
          <h2>Presse</h2>
          <p>
            <a href="mailto:presse@kokyage.com">presse@kokyage.com</a>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
