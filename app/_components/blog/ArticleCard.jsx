'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function ArticleCard({ post }) {
  const formattedDate = new Date(post.date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="article-card">
      <Link href={`/blog/${post.slug}`} className="article-card-link">
        <div className="article-card-image">
          <Image
            src={post.image}
            alt={post.title}
            width={400}
            height={250}
            style={{ objectFit: 'cover' }}
          />
          <span className="article-category">{post.category}</span>
        </div>
        <div className="article-card-content">
          <h2 className="article-card-title">{post.title}</h2>
          <p className="article-card-description">{post.description}</p>
          <div className="article-card-meta">
            <span className="article-date">📅 {formattedDate}</span>
            <span className="article-reading-time">⏱️ {post.readingTime} min</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
