import fs from 'fs/promises';
import path from 'path';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kokyage.com';
const root = process.cwd();
const appDir = path.join(root, 'app');
const pagesDir = path.join(root, 'pages');
const outDir = path.join(root, 'public');
const outFile = path.join(outDir, 'sitemap.xml');

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

function normalizeRoute(route) {
  if (!route) return '/';
  route = route.replace(/\\/g, '/');
  if (route === '.' || route === '') return '/';
  if (!route.startsWith('/')) route = '/' + route;
  // remove trailing slash except root
  if (route.endsWith('/') && route !== '/') route = route.slice(0, -1);
  return route;
}

async function collectFromDirectory(dir, baseFrom) {
  const urls = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('_')) continue; // skip private/layout dirs
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      urls.push(...await collectFromDirectory(full, baseFrom));
    } else {
      if (/^page\.(js|jsx|ts|tsx)$/.test(entry.name) || /^(index|index)\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        // derive route from the directory that contains the page file
        const relDir = path.relative(baseFrom, path.dirname(full));
        let route = normalizeRoute(relDir);
        // handle root
        if (route === '/') {
          // ok
        }
        // skip dynamic routes (containing [param])
        if (route.includes('[') || route.includes(']')) continue;
        // lastmod from file mtime
        const stat = await fs.stat(full);
        urls.push({ loc: siteUrl.replace(/\/$/, '') + (route === '/' ? '/' : route), lastmod: stat.mtime.toISOString() });
      }
    }
  }
  return urls;
}

(async () => {
  try {
    const allUrls = new Map();

    if (await exists(appDir)) {
      const urls = await collectFromDirectory(appDir, appDir);
      for (const u of urls) allUrls.set(u.loc, u.lastmod);
    }

    if (await exists(pagesDir)) {
      const urls = await collectFromDirectory(pagesDir, pagesDir);
      for (const u of urls) allUrls.set(u.loc, u.lastmod);
    }

    // Ensure root URL exists
    const rootUrl = siteUrl.replace(/\/$/, '') + '/';
    if (!allUrls.has(rootUrl)) allUrls.set(rootUrl, new Date().toISOString());

    const urlEntries = Array.from(allUrls.entries()).map(([loc, lastmod]) => ({ loc, lastmod }));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urlEntries.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`).join('\n') +
      `\n</urlset>`;

    if (!(await exists(outDir))) await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(outFile, xml, 'utf8');

    // write robots.txt
    const robots = `User-agent: *\nAllow: /\nSitemap: ${siteUrl.replace(/\/$/, '')}/sitemap.xml\n`;
    await fs.writeFile(path.join(outDir, 'robots.txt'), robots, 'utf8');

    console.log(`Sitemap generated: ${outFile}`);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    process.exit(1);
  }
})();
