import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import Header from '../_components/Header';
import Footer from '../_components/Footer';

export const metadata = {
  title: "Conditions Générales d'Utilisation | Kokyage",
  description: "Consultez les Conditions Générales d'Utilisation de Kokyage."
};

function getCGUContent() {
  try {
    const filePath = path.join(process.cwd(), 'content', 'cgu.md');
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return "# Conditions Générales d'Utilisation (CGU)\n\nContenu indisponible. Créez le fichier content/cgu.md.";
  }
}

export default function Page() {
  const content = getCGUContent();
  return (
    <>
      <Header />
      <main style={{
        fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        background: 'linear-gradient(135deg, #F5F1ED 0%, #E8E3DC 100%)',
        minHeight: '100vh'
      }}>
        <section style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px 80px' }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
            padding: '32px'
          }}>
            <article className="markdown-body">
              <ReactMarkdown>{content}</ReactMarkdown>
            </article>
          </div>
        </section>
      </main>
      <Footer />
      <style jsx>{`
        .markdown-body h1 { font-size: 2rem; font-weight: 800; color: #2D3748; margin: 0 0 16px; }
        .markdown-body h2 { font-size: 1.5rem; font-weight: 800; color: #2D3748; margin: 32px 0 12px; }
        .markdown-body h3 { font-size: 1.25rem; font-weight: 700; color: #2D3748; margin: 24px 0 8px; }
        .markdown-body p  { color: #4A5568; line-height: 1.8; margin: 0 0 12px; }
        .markdown-body ul { color: #4A5568; line-height: 1.8; margin: 0 0 12px 20px; }
        .markdown-body li { margin: 6px 0; }
        .markdown-body hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
        .markdown-body blockquote { border-left: 4px solid #E2E8F0; padding: 8px 16px; color: #4A5568; background:#F8FAFC; border-radius: 6px; }
        @media (max-width: 768px) {
          .markdown-body h1 { font-size: 1.6rem; }
          .markdown-body h2 { font-size: 1.25rem; }
        }
      `}</style>
    </>
  );
}
