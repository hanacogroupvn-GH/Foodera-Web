// Netlify Edge Function: inject news/article-specific SEO meta + body content into index.html
// This runs at the CDN edge, modifying HTML before it reaches the browser/Googlebot.
// Mirrors the product seo-inject.js pattern but for /news/:slug pages.

const API_ORIGIN = 'https://foodera.vn';
const BASE_URL = 'https://foodera.vn';

// Strip diacritics and normalize to URL-friendly slug (must match server/frontend logic)
const stripDiacritics = (str) =>
  (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'd');

const normalizeNewsSlug = (str) =>
  stripDiacritics(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const getNewsSlug = (item) => {
  const explicitSlug = normalizeNewsSlug(item.slug || '');
  if (explicitSlug) return explicitSlug;
  const titleSlug = normalizeNewsSlug(item.title || '');
  if (titleSlug) return titleSlug;
  const idSlug = normalizeNewsSlug(item.id || '');
  return idSlug || 'news-item';
};

export default async function handler(request, context) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Only intercept news detail pages (/news/:slug), not /news or /news/
  const newsMatch = pathname.match(/^\/news\/([^/]+)$/);
  if (!newsMatch) {
    return context.next();
  }

  // Skip admin/login paths that might match
  const slugOrId = decodeURIComponent(newsMatch[1]);
  if (!slugOrId || slugOrId === 'undefined') {
    return context.next();
  }

  // Get the original HTML response (index.html from SPA fallback)
  const response = await context.next();
  const html = await response.text();

  // Fetch news data from the API
  let article = null;
  try {
    const apiRes = await fetch(`${API_ORIGIN}/api/content`, {
      headers: { 'Accept': 'application/json' }
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      const allNews = data.news || [];
      // Match by slug (exact or generated from title/id), same logic as frontend
      article = allNews.find((item) => {
        const itemSlug = getNewsSlug(item);
        return itemSlug === slugOrId;
      });
      // Fallback: try matching by id directly
      if (!article) {
        article = allNews.find((item) => item.id === slugOrId);
      }
    }
  } catch (err) {
    console.error('News SEO inject: API fetch failed', err);
    return new Response(html, { status: response.status, headers: response.headers });
  }

  if (!article) {
    return new Response(html, { status: response.status, headers: response.headers });
  }

  // Escape HTML entities
  const esc = (str) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  // Build SEO values
  const title = article.seoTitle || article.title || 'News Article';
  const description = article.metaDescription || article.excerpt || '';
  const articleSlug = getNewsSlug(article);
  const canonicalUrl = `${BASE_URL}/news/${encodeURIComponent(articleSlug)}`;
  const ogImage = article.image || `${BASE_URL}/og-image.png`;
  const publishDate = article.date || article.createdAt || '';

  // Build JSON-LD (Article schema)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || '',
    image: article.image ? [article.image] : undefined,
    url: canonicalUrl,
    ...(publishDate ? { datePublished: publishDate } : {}),
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
    author: {
      '@type': 'Organization',
      name: 'FoodEra',
      url: BASE_URL
    },
    publisher: {
      '@type': 'Organization',
      name: 'FoodEra (Hanaco Group)',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/og-image.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    }
  };

  // Build the SEO head block
  const seoHead = `
    <!-- SEO Inject: News Article -->
    <title>${esc(title)} - FoodEra</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${esc(canonicalUrl)}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${esc(canonicalUrl)}" />
    <meta property="og:image" content="${esc(ogImage)}" />
    ${publishDate ? `<meta property="article:published_time" content="${esc(publishDate)}" />` : ''}
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(ogImage)}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <!-- /SEO Inject -->
  `;

  // Extract plain text from content for server-rendered body
  let bodyText = '';
  if (article.contentHtml) {
    // Strip HTML tags for a plain text preview
    bodyText = article.contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  } else if (article.excerpt) {
    bodyText = article.excerpt;
  }

  // Build server-rendered article body content (will be replaced by React)
  const bodyContent = `
    <div id="ssr-news" style="max-width:900px;margin:0 auto;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      <nav style="margin-bottom:24px"><a href="/news" style="color:#2d5a27;font-weight:bold;text-decoration:none">&larr; Back to News</a></nav>
      ${article.image ? `<img src="${esc(article.image)}" alt="${esc(article.imageAlt || article.title)}" style="width:100%;border-radius:16px;aspect-ratio:16/9;object-fit:cover;margin-bottom:24px" loading="eager" />` : ''}
      ${article.category ? `<span style="display:inline-block;padding:4px 12px;background:#2d5a27;color:white;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;border-radius:6px;margin-bottom:16px">${esc(article.category)}</span>` : ''}
      <h1 style="font-size:36px;font-weight:900;color:#111;margin:16px 0;line-height:1.2">${esc(article.title)}</h1>
      ${publishDate ? `<time style="font-size:14px;color:#888;display:block;margin-bottom:24px">${esc(publishDate)}</time>` : ''}
      ${article.excerpt ? `<p style="font-size:18px;color:#555;line-height:1.7;margin-bottom:24px;font-style:italic">${esc(article.excerpt)}</p>` : ''}
      ${bodyText ? `<div style="font-size:16px;color:#333;line-height:1.8">${esc(bodyText.slice(0, 2000))}</div>` : ''}
      <section style="margin-top:48px;padding:32px;background:#f9fafb;border-radius:16px">
        <h2 style="font-size:24px;font-weight:800;color:#111;margin-bottom:8px">Explore Our Products</h2>
        <p style="color:#666;margin-bottom:16px">Discover FoodEra's premium Vietnamese agricultural products for global export.</p>
        <a href="/product" style="display:inline-block;padding:12px 24px;background:#2d5a27;color:white;font-weight:bold;border-radius:8px;text-decoration:none">View Products</a>
      </section>
    </div>
  `;

  // Apply modifications to HTML
  let modifiedHtml = html;

  // Remove ALL generic head tags to prevent duplicates with our article-specific ones
  modifiedHtml = modifiedHtml.replace(/<title>FoodEra Official Site<\/title>/, '');
  modifiedHtml = modifiedHtml.replace(/<meta name="description" content="FoodEra is a leading[^"]*" \/>/, '');
  // Remove all generic OG tags
  modifiedHtml = modifiedHtml.replace(/<meta property="og:type" content="website" \/>/, '');
  modifiedHtml = modifiedHtml.replace(/<meta property="og:url" content="https:\/\/foodera\.vn\/" \/>/, '');
  modifiedHtml = modifiedHtml.replace(/<meta property="og:title" content="FoodEra Official Site" \/>/, '');
  modifiedHtml = modifiedHtml.replace(/<meta property="og:description" content="Premium rice[^"]*" \/>/, '');
  modifiedHtml = modifiedHtml.replace(/<meta property="og:image" content="https:\/\/foodera\.vn\/og-image\.png" \/>/, '');
  // Remove all generic Twitter tags
  modifiedHtml = modifiedHtml.replace(/<meta name="twitter:title" content="FoodEra Official Site" \/>/, '');
  modifiedHtml = modifiedHtml.replace(/<meta name="twitter:description" content="Premium rice[^"]*" \/>/, '');
  modifiedHtml = modifiedHtml.replace(/<meta name="twitter:image" content="https:\/\/foodera\.vn\/og-image\.png" \/>/, '');

  // Inject SEO head block
  modifiedHtml = modifiedHtml.replace(
    '<meta charset="UTF-8" />',
    `<meta charset="UTF-8" />\n${seoHead}`
  );

  // Inject inline article data so React has it immediately (no API wait)
  const ssrDataScript = `<script>window.__SSR_NEWS__=${JSON.stringify(article)};window.__SSR_NEWS_SLUG__=${JSON.stringify(slugOrId)};</script>`;

  // Inject server-rendered article content into <div id="root">
  // React will replace this when it mounts, but Googlebot sees real content immediately
  modifiedHtml = modifiedHtml.replace(
    '<div id="root"></div>',
    `${ssrDataScript}\n<div id="root">${bodyContent}</div>`
  );

  return new Response(modifiedHtml, {
    status: response.status,
    headers: response.headers
  });
}

export const config = {
  path: '/news/*'
};
