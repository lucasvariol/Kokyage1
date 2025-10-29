import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import Header from '../_components/Header';
import Footer from '../_components/Footer';

export const metadata = {
  title: "Politique de Confidentialité | Kokyage",
  description: "Consultez la Politique de Confidentialité de Kokyage."
};

function getPrivacyContent() {
  try {
    const filePath = path.join(process.cwd(), 'content', 'privacy.md');
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return "# Politique de Confidentialité\n\nContenu indisponible. Créez le fichier content/privacy.md.";
  }
}

const customComponents = {
  h1: ({node, ...props}) => <h1 style={{fontSize: '2rem', fontWeight: 800, color: '#2D3748', margin: '0 0 16px'}} {...props} />,
  h2: ({node, ...props}) => <h2 style={{fontSize: '1.5rem', fontWeight: 800, color: '#2D3748', margin: '32px 0 12px'}} {...props} />,
  h3: ({node, ...props}) => <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#2D3748', margin: '24px 0 8px'}} {...props} />,
  p: ({node, ...props}) => <p style={{color: '#4A5568', lineHeight: 1.8, margin: '0 0 12px'}} {...props} />,
  ul: ({node, ...props}) => <ul style={{color: '#4A5568', lineHeight: 1.8, margin: '0 0 12px 20px'}} {...props} />,
  li: ({node, ...props}) => <li style={{margin: '6px 0'}} {...props} />,
  hr: ({node, ...props}) => <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '24px 0'}} {...props} />,
  blockquote: ({node, ...props}) => <blockquote style={{borderLeft: '4px solid #E2E8F0', padding: '8px 16px', color: '#4A5568', background: '#F8FAFC', borderRadius: '6px'}} {...props} />
};

export default function Page() {
  const content = getPrivacyContent();
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
            <ReactMarkdown components={customComponents}>{content}</ReactMarkdown>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
