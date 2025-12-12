import { getPostBySlug, getAllPosts, getRelatedPosts } from '@/lib/markdown';
import { notFound } from 'next/navigation';
import Header from '@/app/_components/Header';
import Footer from '@/app/_components/Footer';
import ArticleContent from './ArticleContent';

export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: 'Article non trouvé' };
  
  return {
    title: `${post.title} | Blog Kokyage`,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author }],
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function ArticlePage({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();
  
  const relatedPosts = getRelatedPosts(post.slug, post.category, 3);
  const currentUrl = `https://kokyage.com/blog/${post.slug}`;
  
  return (
    <>
      <Header />
      <ArticleContent post={post} relatedPosts={relatedPosts} currentUrl={currentUrl} />
      <Footer />
    </>
  );
}