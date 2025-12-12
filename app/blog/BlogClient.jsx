'use client';

import { useState } from 'react';
import ArticleCard from '@/app/_components/blog/ArticleCard';

export default function BlogClient({ allPosts, categories }) {
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  
  const filteredPosts = selectedCategory === 'Tous' 
    ? allPosts 
    : allPosts.filter(post => post.category === selectedCategory);

  return (
    <main className="blog-page">
      <section className="blog-hero">
        <div className="container">
          <h1>Blog Kokyage</h1>
          <p>Guides pratiques, conseils juridiques et astuces pour réussir vos locations</p>
        </div>
      </section>

      <section className="blog-content">
        <div className="container">
          {/* Filtres */}
          <div className="blog-filters">
            <button
              className={`filter-btn ${selectedCategory === 'Tous' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('Tous')}
            >
              Tous les articles ({allPosts.length})
            </button>
            {categories.map((category) => {
              const count = allPosts.filter(p => p.category === category).length;
              return (
                <button
                  key={category}
                  className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>

          {/* Liste d'articles */}
          {filteredPosts.length === 0 ? (
            <div className="no-posts">
              <p>Aucun article disponible pour le moment.</p>
              <p>Revenez bientôt pour découvrir nos guides et conseils !</p>
            </div>
          ) : (
            <div className="blog-grid">
              {filteredPosts.map((post) => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .blog-hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 80px 20px;
          text-align: center;
        }

        .blog-hero h1 {
          font-size: 3rem;
          margin-bottom: 20px;
          font-weight: 700;
        }

        .blog-hero p {
          font-size: 1.2rem;
          opacity: 0.95;
          max-width: 700px;
          margin: 0 auto;
        }

        .blog-content {
          padding: 60px 20px;
        }

        .blog-filters {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 40px;
          justify-content: center;
        }

        .filter-btn {
          padding: 10px 20px;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 25px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .filter-btn:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 30px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .no-posts {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .no-posts p {
          font-size: 1.1rem;
          margin-bottom: 10px;
        }

        @media (max-width: 768px) {
          .blog-hero {
            padding: 50px 15px;
          }

          .blog-hero h1 {
            font-size: 1.8rem;
          }

          .blog-hero p {
            font-size: 0.95rem;
            padding: 0 10px;
          }

          .blog-content {
            padding: 40px 15px;
          }

          .blog-filters {
            gap: 8px;
            margin-bottom: 30px;
          }

          .filter-btn {
            padding: 8px 14px;
            font-size: 0.85rem;
          }

          .blog-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .no-posts {
            padding: 40px 15px;
          }

          .no-posts p {
            font-size: 1rem;
          }
        }

        :global(.article-card) {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        :global(.article-card:hover) {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }

        :global(.article-card-link) {
          text-decoration: none;
          color: inherit;
        }

        :global(.article-card-image) {
          position: relative;
          width: 100%;
          height: 220px;
          overflow: hidden;
        }

        :global(.article-card-image img) {
          width: 100%;
          height: 100%;
          transition: transform 0.3s ease;
        }

        :global(.article-card:hover .article-card-image img) {
          transform: scale(1.05);
        }

        :global(.article-category) {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(102, 126, 234, 0.95);
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        :global(.article-card-content) {
          padding: 24px;
        }

        @media (max-width: 768px) {
          :global(.article-card-content) {
            padding: 18px;
          }
        }

        :global(.article-card-title) {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 12px;
          line-height: 1.4;
          color: #1a202c;
        }

        @media (max-width: 768px) {
          :global(.article-card-title) {
            font-size: 1.2rem;
            margin-bottom: 10px;
          }
        }

        :global(.article-card-description) {
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 16px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          :global(.article-card-description) {
            font-size: 0.9rem;
            margin-bottom: 12px;
          }
        }

        :global(.article-card-meta) {
          display: flex;
          gap: 16px;
          font-size: 0.9rem;
          color: #718096;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
        }

        @media (max-width: 768px) {
          :global(.article-card-meta) {
            font-size: 0.8rem;
            gap: 12px;
          }
        }
      `}</style>
    </main>
  );
}
