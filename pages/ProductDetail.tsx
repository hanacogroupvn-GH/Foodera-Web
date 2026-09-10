import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Product } from '../types';
import AppShellLoader from '../components/AppShellLoader';
import {
  ArrowLeft,
  FileText,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  X,
  ZoomIn
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useLocale } from '../context/LocaleContext';
import { getCategoryLabel, localizeProduct } from '../lib/contentLocalization';
import { appRoutes } from '../lib/routes';
import { useDocumentMeta, BASE_URL } from '../lib/useDocumentMeta';

const WhatsAppIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.436 9.884-9.885 9.884m8.412-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.86 11.86 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.481-8.413" />
  </svg>
);

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeProducts: products, isLoading } = useData();

  // SSR product data injected by edge function (available immediately, no API needed)
  const ssrProduct = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const ssr = (window as any).__SSR_PRODUCT__ as Product | undefined;
    if (!ssr || !id) return undefined;
    // Only use if it matches the current URL slug/id
    return (ssr.slug === id || ssr.id === id) ? ssr : undefined;
  }, [id]);

  // Find product: API data first, then SSR fallback
  const product = products.find((p) => p.slug === id) || products.find((p) => p.id === id) || ssrProduct;

  // Track whether we're using SSR data (edge function already set correct meta tags)
  const isUsingSSR = Boolean(!products.find((p) => p.slug === id) && !products.find((p) => p.id === id) && ssrProduct && product === ssrProduct);

  // 301 redirect: if URL matches a previousSlug, redirect to current slug
  const redirectTarget = !product
    ? products.find((p) => p.previousSlugs?.includes(id || ''))
    : null;

  useEffect(() => {
    if (redirectTarget) {
      navigate(appRoutes.productBySlug(redirectTarget.slug || redirectTarget.id), { replace: true });
    }
  }, [redirectTarget, navigate]);

  const { locale } = useLocale();
  const localizedProduct = useMemo(() => (product ? localizeProduct(product, locale) : null), [locale, product]);

  const productUrl = product ? `${BASE_URL}${appRoutes.productBySlug(product.slug || product.id)}` : undefined;

  // Skip useDocumentMeta overwrite when using SSR data — edge function already set correct title/meta
  // This prevents React from replacing "Vietnam White Rice..." with generic "Product Detail"
  useDocumentMeta(isUsingSSR ? {
    // Keep edge function's values by not setting anything that would overwrite them
  } : {
    title: product?.seoTitle || localizedProduct?.name || product?.name || (locale === 'zh' ? '产品详情' : 'Product Detail'),
    description: product?.metaDescription || localizedProduct?.shortDescription || product?.shortDescription || (locale === 'zh' ? 'FoodEra 出口产品详细信息与规格。' : 'FoodEra export product details and specifications.'),
    canonicalUrl: product?.canonicalUrl || productUrl,
    ogUrl: productUrl,
    ogImage: product?.image,
  });

  // JSON-LD Product structured data (B2B: no offers/price to avoid Google critical error)
  useEffect(() => {
    if (!product) return;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: localizedProduct?.name || product.name,
      description: localizedProduct?.shortDescription || product.shortDescription || product.description,
      image: product.image ? [product.image] : undefined,
      url: productUrl,
      brand: { '@type': 'Brand', name: 'FoodEra' },
      category: product.category,
      ...(product.originCountry ? { countryOfOrigin: { '@type': 'Country', name: product.originCountry } } : {}),
      manufacturer: {
        '@type': 'Organization',
        name: 'FoodEra (Hanaco Group)',
        url: 'https://foodera.vn'
      }
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'product-jsonld';
    script.textContent = JSON.stringify(jsonLd);
    // Remove old one if exists
    document.getElementById('product-jsonld')?.remove();
    document.head.appendChild(script);
    return () => { document.getElementById('product-jsonld')?.remove(); };
  }, [product, localizedProduct, productUrl]);
  const copy = locale === 'zh'
    ? {
        loader: '正在加载产品详情...',
        notFound: '未找到产品',
        notFoundDesc: '您查找的产品不存在或已被移动。',
        backToProducts: '返回产品列表',
        backToList: '返回列表',
        openProductPdf: '打开产品 PDF',
        related: '相关产品',
        relatedDescPrefix: '探索我们',
        relatedDescSuffix: '系列中的更多出口品种。',
        viewAllPrefix: '查看全部',
        viewAllSuffix: '品类',
        requestQuote: '申请报价',
        chatWhatsapp: '通过 WhatsApp 咨询',
        categoryLabel: '类别',
        morePhotosSoon: '更多照片即将上线',
        quoteEmailBody: '您好 FoodEra 出口团队，\n\n我对该产品感兴趣，希望了解报价与相关信息。\n\n公司名称：\n预计订购量：\n目的港：\n\n谢谢！'
      }
    : {
        loader: 'Loading product details...',
        notFound: 'Product Not Found',
        notFoundDesc: 'The product you are looking for does not exist or has been moved.',
        backToProducts: 'Back to Products',
        backToList: 'Back to List',
        openProductPdf: 'Open Product PDF',
        related: 'Related Commodities',
        relatedDescPrefix: 'Explore additional export varieties within our',
        relatedDescSuffix: 'portfolio.',
        viewAllPrefix: 'View All',
        viewAllSuffix: 'Varieties',
        requestQuote: 'Request Quote',
        chatWhatsapp: 'Chat on WhatsApp',
        categoryLabel: 'Category',
        morePhotosSoon: 'More photos coming soon',
        quoteEmailBody: 'Hello FoodEra Export Team,\n\nI am interested in this product and would like to request a quotation.\n\nCompany name:\nEstimated order volume:\nDestination port:\n\nThank you!'
      };
  const packagingEntries = useMemo(
    () =>
      Object.entries(localizedProduct?.packaging || product?.packaging || {}).filter(
        ([key, value]) => key.trim() && String(value || '').trim()
      ),
    [localizedProduct, product]
  );

  const paymentEntries = useMemo(
    () =>
      Object.entries(localizedProduct?.payment || product?.payment || {}).filter(
        ([key, value]) => key.trim() && String(value || '').trim()
      ),
    [localizedProduct, product]
  );

  // Gallery: main image + any additional gallery images, deduplicated.
  // `null` entries are placeholder slots shown when the product has no extra
  // gallery photos yet, so the slider UI can be previewed before real photos are added.
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const galleryImages = useMemo(() => {
    if (!product) return [] as (string | null)[];
    const normalize = (item: string | { url: string }) => (typeof item === 'string' ? item : item?.url);
    const extra = (product.gallery || []).map(normalize).filter((url): url is string => Boolean(url?.trim()));
    const real = Array.from(new Set([product.image, ...extra].filter(Boolean)));
    return extra.length === 0 ? [...real, null, null, null] : real;
  }, [product]);

  const goToPrevImage = () => setActiveImageIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  const goToNextImage = () => setActiveImageIndex((i) => (i + 1) % galleryImages.length);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?.id]);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') goToPrevImage();
      if (e.key === 'ArrowRight') goToNextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, galleryImages.length]);

  // Single flowing spec list: specifications + appearance + packaging + payment
  const specEntries = useMemo(() => {
    const entries: Array<{ label: string; value: string }> = [];
    if (!product) return entries;

    Object.entries(localizedProduct?.specifications || product.specifications || {}).forEach(([key, value]) => {
      if (String(value ?? '').trim()) entries.push({ label: key, value: String(value) });
    });

    if (product.appearance?.trim()) {
      const appearanceValue = product.appearance
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(', ');
      if (appearanceValue) entries.push({ label: locale === 'zh' ? '外观' : 'Appearance', value: appearanceValue });
    }

    packagingEntries.forEach(([key, value]) => entries.push({ label: key, value: String(value) }));
    paymentEntries.forEach(([key, value]) => entries.push({ label: key, value: String(value) }));

    return entries;
  }, [product, localizedProduct, packagingEntries, paymentEntries, locale]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  }, [product, products]);

  const hasProductPdf = Boolean(product?.pdfUrl?.trim());

  // Early returns MUST be after ALL hooks to avoid React error #310
  if (isLoading && products.length === 0) {
    return <AppShellLoader compact label={copy.loader} />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-4xl font-black text-gray-900 mb-4">{copy.notFound}</h2>
        <p className="text-gray-600 mb-8">{copy.notFoundDesc}</p>
        <Link to={appRoutes.products} className="px-8 py-3 bg-foodera-forest text-white rounded-lg font-bold">
          {copy.backToProducts}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50 border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-foodera-forest transition-colors"
          >
            <ArrowLeft size={16} /> {copy.backToList}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 1 — Product Overview (gallery + info)
          ═══════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-gray-100 shadow-2xl mb-4 bg-gray-50">
              {galleryImages[activeImageIndex] ? (
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  aria-label="View full image"
                  className="group relative block w-full h-full cursor-zoom-in"
                >
                  <img
                    src={galleryImages[activeImageIndex] as string}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="w-11 h-11 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-foodera-forest opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all">
                      <ZoomIn size={20} />
                    </span>
                  </span>
                </button>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-300">
                  <ImageIcon size={48} strokeWidth={1.5} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{copy.morePhotosSoon}</span>
                </div>
              )}

              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={goToPrevImage}
                    aria-label="Previous image"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-foodera-forest hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={goToNextImage}
                    aria-label="Next image"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-foodera-forest hover:bg-white transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {galleryImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImageIndex(i)}
                        aria-label={`Go to image ${i + 1}`}
                        className={`h-2 rounded-full transition-all ${
                          i === activeImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {galleryImages.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    onClick={() => setActiveImageIndex(i)}
                    aria-label={`${product.name} ${i + 1}`}
                    className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 flex items-center justify-center bg-gray-50 transition-all ${
                      i === activeImageIndex ? 'border-foodera-forest shadow-md' : 'border-gray-100 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-gray-300" strokeWidth={1.5} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col animate-in fade-in slide-in-from-right duration-700">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-foodera-forest text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg shadow-sm">
                {getCategoryLabel(product.category, locale)}
              </span>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{localizedProduct?.subCategory || product.subCategory}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 leading-tight tracking-tight">{localizedProduct?.name || product.name}</h1>

            {specEntries.length > 0 && (
              <ul className="mb-10 space-y-1.5">
                {specEntries.map((entry, i) => (
                  <li key={`${entry.label}-${i}`} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-foodera-forest mt-1.5 flex-shrink-0" />
                    <span>
                      <span className="font-black text-gray-900">{entry.label}: </span>
                      {entry.value}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap gap-4 mb-8">
              <a
                href={`mailto:export@foodera.vn?subject=${encodeURIComponent(`RFQ - ${localizedProduct?.name || product.name}`)}&body=${encodeURIComponent(copy.quoteEmailBody)}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-foodera-forest text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-foodera-lime hover:text-foodera-forest transition-all shadow-lg"
              >
                {copy.requestQuote} <ArrowRight size={16} />
              </a>
              <a
                href="https://wa.me/84935587888"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-foodera-forest text-foodera-forest rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                <WhatsAppIcon size={16} /> {copy.chatWhatsapp}
              </a>
              {hasProductPdf && (
                <a
                  href={product.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-4 text-xs font-black text-foodera-forest uppercase tracking-widest hover:text-foodera-lime transition-colors"
                >
                  <FileText size={16} /> {copy.openProductPdf}
                </a>
              )}
            </div>

            <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{copy.categoryLabel}:</span>
              <Link
                to={appRoutes.productsByCategory(product.category)}
                className="px-3 py-1.5 bg-gray-50 text-foodera-forest text-xs font-bold rounded-lg hover:bg-foodera-forest hover:text-white transition-colors"
              >
                {getCategoryLabel(product.category, locale)}
              </Link>
              {(localizedProduct?.subCategory || product.subCategory) && (
                <Link
                  to={appRoutes.productLine(product.category, product.subCategory)}
                  className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg hover:bg-foodera-forest hover:text-white transition-colors"
                >
                  {localizedProduct?.subCategory || product.subCategory}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="bg-white py-24 lg:py-32 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-none">
                  {copy.related}
                </h2>
                <p className="text-lg text-gray-500 font-medium mt-4">
                  {`${copy.relatedDescPrefix} ${getCategoryLabel(product.category, locale)} ${copy.relatedDescSuffix}`}
                </p>
              </div>
              <Link
                to={appRoutes.productsByCategory(product.category)}
                className="inline-flex items-center gap-3 text-xs font-black text-foodera-forest uppercase tracking-[0.2em] group border-b-2 border-transparent hover:border-foodera-lime transition-all pb-1"
              >
                {`${copy.viewAllPrefix} ${getCategoryLabel(product.category, locale)} ${copy.viewAllSuffix}`}{' '}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {isLightboxOpen && galleryImages[activeImageIndex] && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsLightboxOpen(false)}
          />
          <div className="relative max-w-4xl w-full">
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close"
              className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors"
            >
              <X size={28} />
            </button>
            <img
              src={galleryImages[activeImageIndex] as string}
              alt={product.name}
              className="relative w-full max-h-[80vh] object-contain rounded-2xl"
            />
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPrevImage}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-foodera-forest hover:bg-white transition-colors"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={goToNextImage}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-foodera-forest hover:bg-white transition-colors"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetail;
