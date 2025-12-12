import { getAllPosts, getCategories } from '@/lib/markdown';
import Header from '@/app/_components/Header';
import Footer from '@/app/_components/Footer';
import BlogClient from './BlogClient';

export const metadata = {
  title: 'Blog Kokyage | Guides et conseils location',
  description: 'Guides pratiques, conseils juridiques et astuces pour réussir vos locations courte et longue durée.',
};

export default function BlogPage() {
  const allPosts = getAllPosts();
  const categories = getCategories();

  return (
    <>
      <Header />
      <BlogClient allPosts={allPosts} categories={categories} />
      <Footer />
    </>
  );
}
