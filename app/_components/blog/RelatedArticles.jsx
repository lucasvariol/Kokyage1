import Link from 'next/link';
import Image from 'next/image';

export default function RelatedArticles({ posts }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="related-articles">
      <h2>Articles connexes</h2>
      <div className="related-articles-grid">
        {posts.map((post) => {
          const formattedDate = new Date(post.date).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          return (
            <article key={post.slug} className="related-article-card">
              <Link href={`/blog/${post.slug}`}>
                <div className="related-article-image">
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={300}
                    height={180}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="related-article-content">
                  <span className="related-article-category">{post.category}</span>
                  <h3>{post.title}</h3>
                  <span className="related-article-date">{formattedDate}</span>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
