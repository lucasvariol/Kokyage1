'use client';

import Link from 'next/link';
import TableOfContents from '@/app/_components/blog/TableOfContents';
import ShareButtons from '@/app/_components/blog/ShareButtons';
import RelatedArticles from '@/app/_components/blog/RelatedArticles';
import './article.css';

export default function ArticleContent({ post, relatedPosts, currentUrl }) {
  const formattedDate = new Date(post.date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="article-page">
      <div className="breadcrumb">
        <div className="container">
          <Link href="/">Accueil</Link>
          <span> / </span>
          <Link href="/blog">Blog</Link>
          <span> / </span>
          <span>{post.category}</span>
        </div>
      </div>

      <article className="article-header">
        <div className="container">
          <span className="article-category-badge">{post.category}</span>
          <h1>{post.title}</h1>
          <p className="article-description">{post.description}</p>
          <div className="article-meta">
            <span> {post.author}</span>
            <span> {formattedDate}</span>
            <span> {post.readingTime} min de lecture</span>
          </div>
        </div>
      </article>

      <div className="article-layout">
        <div className="container">
          <div className="article-content-wrapper">
            <aside className="article-sidebar-left">
              <div className="sticky-toc">
                <TableOfContents headings={post.headings} />
              </div>
            </aside>

            <div className="article-body">
              <div
                className="article-content"
                dangerouslySetInnerHTML={{ __html: post.contentHtml }}
              />

              <div className="article-cta">
                <div className="cta-card">
                  <h3> Prêt à louer votre logement ?</h3>
                  <p>
                    Créez votre annonce gratuitement sur Kokyage et gérez vos réservations en toute simplicité.
                  </p>
                  <Link href="/ajout-logement" className="cta-button">
                    Publier mon annonce
                  </Link>
                </div>
              </div>

              <ShareButtons title={post.title} url={currentUrl} />

              {relatedPosts.length > 0 && <RelatedArticles posts={relatedPosts} />}
            </div>

            <aside className="article-sidebar-right"></aside>
          </div>
        </div>
      </div>
    </main>
  );
}