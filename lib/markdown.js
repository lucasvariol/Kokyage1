import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import slug from 'remark-slug';

const postsDirectory = path.join(process.cwd(), 'content/blog');

// Récupérer tous les articles du blog
export function getAllPosts() {
  // Créer le dossier s'il n'existe pas
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.md') && fileName !== 'README.md')
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      // Calculer le temps de lecture
      const wordsPerMinute = 200;
      const wordCount = content.trim().split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / wordsPerMinute);

      return {
        slug,
        title: data.title || 'Sans titre',
        description: data.description || '',
        date: data.date || new Date().toISOString(),
        author: data.author || 'Kokyage',
        category: data.category || 'Guide',
        keywords: data.keywords || [],
        image: data.image || '/images/blog/default.jpg',
        readingTime,
        ...data,
      };
    });

  // Trier par date décroissante
  return allPostsData.sort((a, b) => {
    if (new Date(a.date) < new Date(b.date)) {
      return 1;
    } else {
      return -1;
    }
  });
}

// Récupérer un article par slug
export async function getPostBySlug(slug) {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  // Convertir markdown en HTML avec IDs sur les headings
  const processedContent = await remark()
    .use(slug)
    .use(html, { sanitize: false })
    .process(content);
  const contentHtml = processedContent.toString();

  // Calculer le temps de lecture
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);

  // Extraire les headings pour table des matières
  const headings = content.match(/^##\s+(.+)$/gm)?.map((heading) => {
    const text = heading.replace(/^##\s+/, '');
    const id = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return { text, id };
  }) || [];

  return {
    slug,
    title: data.title || 'Sans titre',
    description: data.description || '',
    date: data.date || new Date().toISOString(),
    author: data.author || 'Kokyage',
    category: data.category || 'Guide',
    keywords: data.keywords || [],
    image: data.image || '/images/blog/default.jpg',
    readingTime,
    contentHtml,
    headings,
    ...data,
  };
}

// Récupérer les catégories uniques
export function getCategories() {
  const posts = getAllPosts();
  const categories = [...new Set(posts.map((post) => post.category))];
  return categories.sort();
}

// Récupérer les articles par catégorie
export function getPostsByCategory(category) {
  const allPosts = getAllPosts();
  return allPosts.filter((post) => post.category === category);
}

// Récupérer les articles connexes
export function getRelatedPosts(currentSlug, category, limit = 3) {
  const allPosts = getAllPosts();
  return allPosts
    .filter((post) => post.slug !== currentSlug && post.category === category)
    .slice(0, limit);
}
