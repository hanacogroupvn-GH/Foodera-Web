// Netlify Edge Function: inject product-specific SEO meta + body content into index.html
// This runs at the CDN edge, modifying HTML before it reaches the browser/Googlebot.
// Fixes Google "Soft 404" for SPA product pages by providing real rendered content.

const API_ORIGIN = 'https://foodera.vn';
const BASE_URL = 'https://foodera.vn';

export default async function handler(request, context) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Only intercept product detail pages
  const productMatch = pathname.match(/^\/product\/item\/([^/]+)$/);
  if (!productMatch) {
    return context.next();
  }

  const slugOrId = decodeURIComponent(productMatch[1]);

  // Get the original HTML response (index.html from SPA fallback)
  const response = await context.next();
  const html = await response.text();

  // Fetch product data from the API
  let product = null;
  try {
    const apiRes = await fetch(`${API_ORIGIN}/api/content`, {
      headers: { 'Accept': 'application/json' }
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      const products = data.products || [];
      product = products.find(p => p.slug === slugOrId) || products.find(p => p.id === slugOrId);
    }
  } catch (err) {
    console.error('SEO inject: API fetch failed', err);
    return new Response(html, { status: response.status, headers: response.headers });
  }

  if (!product) {
    return new Response(html, { status: response.status, headers: response.headers });
  }

  // Escape HTML entities
  const esc = (str) => (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Build SEO values
  const title = product.seoTitle || product.name || 'Product Detail';
  const description = product.metaDescription || product.shortDescription || product.description || '';
  const canonicalUrl = product.canonicalUrl || `${BASE_URL}/product/item/${product.slug || product.id}`;
  const ogImage = product.image || `${BASE_URL}/og-image.png`;

  // Build JSON-LD (B2B model: no offers/price to avoid Google critical error)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description || '',
    image: product.image ? [product.image] : undefined,
    url: canonicalUrl,
    brand: { '@type': 'Brand', name: 'FoodEra' },
    category: product.category,
    ...(product.originCountry ? { countryOfOrigin: { '@type': 'Country', name: product.originCountry } } : {}),
    manufacturer: { '@type': 'Organization', name: 'FoodEra (Hanaco Group)', url: BASE_URL }
  };

  // Build the SEO head block
  const seoHead = `
    <!-- SEO Inject: Product -->
    <title>${esc(title)} - FoodEra</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${esc(canonicalUrl)}" />
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${esc(canonicalUrl)}" />
    <meta property="og:image" content="${esc(ogImage)}" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(ogImage)}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <!-- /SEO Inject -->
  `;

  // Build specifications table HTML
  const specs = product.specifications || {};
  const specRows = Object.entries(specs)
    .filter(([k, v]) => k.trim() && String(v || '').trim())
    .map(([k, v]) => `<tr><td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #eee">${esc(k)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee">${esc(String(v))}</td></tr>`)
    .join('\n');

  // Build server-rendered product body content (will be replaced by React)
  const bodyContent = `
    <div id="ssr-product" style="max-width:1200px;margin:0 auto;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      <nav style="margin-bottom:24px"><a href="/products" style="color:#2d5a27;font-weight:bold;text-decoration:none">&larr; Back to Products</a></nav>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start">
        <div>
          ${product.image ? `<img src="${esc(product.image)}" alt="${esc(product.imageAlt || product.name)}" style="width:100%;border-radius:16px;aspect-ratio:4/3;object-fit:cover" loading="eager" />` : ''}
        </div>
        <div>
          <span style="display:inline-block;padding:4px 12px;background:#2d5a27;color:white;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;border-radius:6px;margin-bottom:16px">${esc(product.category)}</span>
          ${product.subCategory ? `<span style="display:inline-block;margin-left:8px;font-size:12px;color:#888;font-weight:bold;text-transform:uppercase;letter-spacing:1px">${esc(product.subCategory)}</span>` : ''}
          <h1 style="font-size:36px;font-weight:900;color:#111;margin:16px 0;line-height:1.1">${esc(product.name)}</h1>
          <p style="font-size:18px;color:#666;line-height:1.6;margin-bottom:24px">${esc(product.description || product.shortDescription || '')}</p>
          ${product.moq ? `<p style="font-size:14px;color:#444"><strong>MOQ:</strong> ${esc(product.moq)}</p>` : ''}
          ${product.originCountry ? `<p style="font-size:14px;color:#444"><strong>Origin:</strong> ${esc(product.originCountry)}</p>` : ''}
          ${product.leadTime ? `<p style="font-size:14px;color:#444"><strong>Lead Time:</strong> ${esc(product.leadTime)}</p>` : ''}
        </div>
      </div>
      ${specRows ? `
        <section style="margin-top:48px">
          <h2 style="font-size:24px;font-weight:800;color:#111;margin-bottom:16px">Quality Specifications</h2>
          <table style="width:100%;border-collapse:collapse;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
            ${specRows}
          </table>
        </section>
      ` : ''}
      <section style="margin-top:48px;padding:32px;background:#f9fafb;border-radius:16px">
        <h2 style="font-size:24px;font-weight:800;color:#111;margin-bottom:8px">Request Export Quotation</h2>
        <p style="color:#666;margin-bottom:16px">Contact FoodEra's export department for pricing, specifications, and logistics for ${esc(product.name)}.</p>
        <a href="/contact" style="display:inline-block;padding:12px 24px;background:#2d5a27;color:white;font-weight:bold;border-radius:8px;text-decoration:none">Contact Export Team</a>
      </section>
    </div>
  `;

  // Apply modifications to HTML
  let modifiedHtml = html;

  // Remove ALL generic head tags to prevent duplicates with our product-specific ones
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

  // Inject inline product data so React has it immediately (no API wait)
  const ssrDataScript = `<script>window.__SSR_PRODUCT__=${JSON.stringify(product)};window.__SSR_PRODUCT_SLUG__=${JSON.stringify(slugOrId)};</script>`;

  // Inject server-rendered product content into <div id="root">
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
  path: '/product/item/*'
};
