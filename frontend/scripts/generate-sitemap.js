// scripts/generate-sitemap.js
//
// Generates frontend/public/sitemap.xml from:
//   1) the static public routes below (kept in sync with App.tsx)
//   2) live product data pulled from GET /api/products
//
// Run manually:   node scripts/generate-sitemap.js
// Or wire it into your build: "prebuild": "node scripts/generate-sitemap.js"
//
// IMPORTANT: your app uses HashRouter, so real URLs look like
//   https://plugwalk.co/#/categories/tops
// Google's crawler does execute JS, but hash-fragment routing is still a
// known SEO weak point for SPAs — Google may not reliably treat each
// #/route as a distinct indexable page. This script generates the URLs
// as your site actually serves them, but for the best long-term SEO result
// consider migrating to BrowserRouter (with server rendering or a static
// prerender step). Flagging this so it's a known tradeoff, not a surprise.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_URL = process.env.SITE_URL || 'https://plugwalk.co';
const API_URL = process.env.VITE_API_URL || process.env.API_URL || 'https://api.plugwalk.co';

// ── Static, public-facing routes ─────────────────────────────────────────────
// Deliberately excludes anything auth-gated or admin-only (cart, checkout,
// orders, wishlist, reviews, profile/*, admin/*, login, register,
// forgot/reset-password, verify-email) — those have no SEO value and
// shouldn't be indexed.
const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/members-club', priority: '0.6', changefreq: 'monthly' },

  // Categories
  { path: '/categories/tops', priority: '0.8', changefreq: 'daily' },
  { path: '/categories/bottoms', priority: '0.8', changefreq: 'daily' },
  { path: '/categories/outwear', priority: '0.8', changefreq: 'daily' },
  { path: '/categories/heels', priority: '0.8', changefreq: 'daily' },
  { path: '/categories/accessories', priority: '0.8', changefreq: 'daily' },
  { path: '/categories/bags', priority: '0.8', changefreq: 'daily' },
  { path: '/categories/footwear', priority: '0.8', changefreq: 'daily' },
  { path: '/categories/sets', priority: '0.8', changefreq: 'daily' },
  { path: '/categories/headgear', priority: '0.8', changefreq: 'daily' },
  { path: '/categories/hoodies-and-jackets', priority: '0.8', changefreq: 'daily' },
  { path: '/categories/new-arrivals', priority: '0.9', changefreq: 'daily' },
  { path: '/categories/best-sellers', priority: '0.9', changefreq: 'daily' },

  // Support
  { path: '/track-order', priority: '0.3', changefreq: 'monthly' },
  { path: '/returns', priority: '0.3', changefreq: 'monthly' },
  { path: '/delivery', priority: '0.3', changefreq: 'monthly' },
  { path: '/size-guide', priority: '0.3', changefreq: 'monthly' },
  { path: '/faqs', priority: '0.3', changefreq: 'monthly' },
  { path: '/contact', priority: '0.4', changefreq: 'monthly' },

  // Company
  { path: '/about', priority: '0.4', changefreq: 'monthly' },
  { path: '/careers', priority: '0.3', changefreq: 'monthly' },
  { path: '/press', priority: '0.3', changefreq: 'monthly' },

  // Legal
  { path: '/privacy', priority: '0.2', changefreq: 'yearly' },
  { path: '/terms', priority: '0.2', changefreq: 'yearly' },
  { path: '/cookies', priority: '0.2', changefreq: 'yearly' },
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

async function fetchProducts() {
  try {
    const { data } = await axios.get(`${API_URL}/api/products`);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('⚠️  Could not fetch products from', API_URL, '-', err.message);
    console.error('   Continuing with static routes only.');
    return [];
  }
}

async function generateSitemap() {
  const now = new Date().toISOString();
  const products = await fetchProducts();

  const staticEntries = staticRoutes.map((r) =>
    urlEntry(`${BASE_URL}/#${r.path}`, now, r.changefreq, r.priority)
  );

  const productEntries = products.map((p) => {
    const lastmodSource = p.updated_at || p.created_at || now;
    const lastmod = new Date(lastmodSource).toISOString();
    return urlEntry(`${BASE_URL}/#/product/${p.id}`, lastmod, 'weekly', '0.7');
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...productEntries].join('\n')}
</urlset>
`;

  const outPath = path.join(__dirname, '..', 'frontend', 'public', 'sitemap.xml');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, xml, 'utf8');
  console.log(
    `✓ Sitemap written to ${outPath} — ${staticRoutes.length} static pages, ${products.length} products.`
  );
}

generateSitemap();