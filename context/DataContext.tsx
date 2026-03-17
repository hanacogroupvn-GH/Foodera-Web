import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { NewsItem, NewsTranslation, Product, ProductTranslation } from '../types';
import { hasSupabaseEnv, supabase } from '../lib/supabaseClient';
import { NEWS as fallbackNewsData, PRODUCTS as fallbackProductData } from '../constants';
import { getNewsSlug, normalizeNewsSlug } from '../lib/newsSeo';
import { normalizeProductCategory } from '../lib/productCategories';
import { FALLBACK_NEWS_TRANSLATIONS, FALLBACK_PRODUCT_TRANSLATIONS } from '../lib/fallbackTranslations';
import { getActiveNews, getActiveProducts } from '../lib/contentStatus';

interface DataContextType {
  products: Product[];
  news: NewsItem[];
  activeProducts: Product[];
  activeNews: NewsItem[];
  isLoading: boolean;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product, oldId?: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addNews: (item: NewsItem) => Promise<void>;
  updateNews: (item: NewsItem) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  exportData: () => string;
  importData: (jsonData: string) => Promise<boolean>;
  resetToDefaults: () => Promise<void>;
  refresh: () => Promise<void>;
}


const DataContext = createContext<DataContextType | undefined>(undefined);

const SAMPLE_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

const normalizeStringRecord = (raw: unknown): Record<string, string> | undefined => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return undefined;
  }

  const entries = Object.entries(raw as Record<string, unknown>)
    .map(([key, value]) => [key.trim(), String(value ?? '').trim()] as const)
    .filter(([key, value]) => key && value);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const schemaCapabilities = {
  productsTranslations: true,
  newsTranslations: true
};

const isMissingTranslationsColumnError = (message: string, table: 'products' | 'news') =>
  new RegExp(`could not find the 'translations' column of '${table}' in the schema cache`, 'i').test(message);

const stripTranslationsFromRow = <T extends Record<string, unknown>>(row: T): T => {
  const { translations: _translations, ...rest } = row;
  return rest as T;
};

const stripTranslationsFromPayload = <T extends Record<string, unknown> | Record<string, unknown>[]>(payload: T): T => {
  if (Array.isArray(payload)) {
    return payload.map((item) => stripTranslationsFromRow(item)) as T;
  }

  return stripTranslationsFromRow(payload) as T;
};

const writeWithTranslationsFallback = async <T extends Record<string, unknown> | Record<string, unknown>[]>({
  table,
  payload,
  execute
}: {
  table: 'products' | 'news';
  payload: T;
  execute: (nextPayload: T) => Promise<{ error: { message: string } | null }>;
}) => {
  const supportKey = table === 'products' ? 'productsTranslations' : 'newsTranslations';
  const initialPayload = schemaCapabilities[supportKey] ? payload : stripTranslationsFromPayload(payload);

  let result = await execute(initialPayload as T);
  if (!result.error) {
    return;
  }

  if (!isMissingTranslationsColumnError(result.error.message, table)) {
    throw new Error(result.error.message);
  }

  if (schemaCapabilities[supportKey]) {
    // eslint-disable-next-line no-console
    console.warn(
      `Supabase table "${table}" is missing the "translations" column. Falling back to writes without multilingual fields. Run supabase/migrations/20260316_add_content_translations.sql to persist zh content.`
    );
  }

  schemaCapabilities[supportKey] = false;
  result = await execute(stripTranslationsFromPayload(payload));
  if (result.error) {
    throw new Error(result.error.message);
  }
};

const cloneProductTranslation = (translation: ProductTranslation): ProductTranslation => ({
  ...translation,
  specifications: translation.specifications ? { ...translation.specifications } : undefined
});

const cloneNewsTranslation = (translation: NewsTranslation): NewsTranslation => ({
  ...translation,
  content: translation.content ? [...translation.content] : undefined
});

const cloneProductTranslations = (translations?: Product['translations']): Product['translations'] => {
  if (!translations) return undefined;
  return {
    zh: translations.zh ? cloneProductTranslation(translations.zh) : undefined
  };
};

const cloneNewsTranslations = (translations?: NewsItem['translations']): NewsItem['translations'] => {
  if (!translations) return undefined;
  return {
    zh: translations.zh ? cloneNewsTranslation(translations.zh) : undefined
  };
};

const cloneProduct = (product: Product): Product => ({
  ...product,
  isActive: product.isActive !== false,
  specifications: { ...product.specifications },
  filters: { ...product.filters },
  gallery: product.gallery ? [...product.gallery] : undefined,
  translations: cloneProductTranslations(product.translations)
});

const cloneNewsItem = (item: NewsItem): NewsItem => ({
  ...item,
  isActive: item.isActive !== false,
  content: [...item.content],
  translations: cloneNewsTranslations(item.translations)
});

const mergeProductTranslations = (
  primary?: Product['translations'],
  fallback?: Product['translations']
): Product['translations'] => {
  const primaryZh = primary?.zh;
  const fallbackZh = fallback?.zh;

  if (!primaryZh && !fallbackZh) {
    return undefined;
  }

  const mergedZh: ProductTranslation = {
    ...(fallbackZh || {}),
    ...(primaryZh || {}),
    specifications: primaryZh?.specifications || fallbackZh?.specifications
  };

  if (!mergedZh.specifications) {
    delete mergedZh.specifications;
  }

  return Object.keys(mergedZh).length > 0 ? { zh: mergedZh } : undefined;
};

const mergeNewsTranslations = (
  primary?: NewsItem['translations'],
  fallback?: NewsItem['translations']
): NewsItem['translations'] => {
  const primaryZh = primary?.zh;
  const fallbackZh = fallback?.zh;

  if (!primaryZh && !fallbackZh) {
    return undefined;
  }

  const mergedZh: NewsTranslation = {
    ...(fallbackZh || {}),
    ...(primaryZh || {}),
    content: primaryZh?.content || fallbackZh?.content
  };

  if (!mergedZh.content) {
    delete mergedZh.content;
  }

  return Object.keys(mergedZh).length > 0 ? { zh: mergedZh } : undefined;
};

const normalizeProductTranslations = (raw: unknown): Product['translations'] => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return undefined;
  }

  const zhRaw = (raw as Record<string, unknown>).zh;
  if (!zhRaw || typeof zhRaw !== 'object' || Array.isArray(zhRaw)) {
    return undefined;
  }

  const zhRecord = zhRaw as Record<string, unknown>;
  const zh: ProductTranslation = {
    ...(typeof zhRecord.name === 'string' ? { name: zhRecord.name.trim() } : {}),
    ...(typeof zhRecord.subCategory === 'string' ? { subCategory: zhRecord.subCategory.trim() } : {}),
    ...(typeof zhRecord.description === 'string' ? { description: zhRecord.description.trim() } : {}),
    ...(typeof zhRecord.shortDescription === 'string'
      ? { shortDescription: zhRecord.shortDescription.trim() }
      : {}),
    ...(normalizeStringRecord(zhRecord.specifications)
      ? { specifications: normalizeStringRecord(zhRecord.specifications) }
      : {})
  };

  return Object.keys(zh).length > 0 ? { zh } : undefined;
};

const fallbackProductsById = new Map(fallbackProductData.map((product) => [product.id, product]));

const mapProductFromRow = (row: any): Product => {
  const rowId = row?.id != null ? String(row.id) : '';
  const fallback = fallbackProductsById.get(rowId);
  const fallbackTranslations =
    fallback?.translations || (FALLBACK_PRODUCT_TRANSLATIONS[rowId] ? { zh: FALLBACK_PRODUCT_TRANSLATIONS[rowId] } : undefined);

  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active !== false,
    category: normalizeProductCategory(row),
    subCategory: row.sub_category,
    description: row.description,
    shortDescription: row.short_description,
    image: row.image,
    pdfUrl: row.pdf_url && row.pdf_url !== SAMPLE_PDF_URL ? row.pdf_url : undefined,
    gallery: row.gallery ?? undefined,
    specifications: row.specifications ?? {},
    filters: row.filters ?? {},
    translations: mergeProductTranslations(normalizeProductTranslations(row.translations), fallbackTranslations)
  };
};

const mapProductToRow = (p: Product) => ({
  id: p.id,
  name: p.name,
  is_active: p.isActive !== false,
  category: normalizeProductCategory(p),
  sub_category: p.subCategory,
  description: p.description,
  short_description: p.shortDescription,
  image: p.image,
  pdf_url: p.pdfUrl?.trim() ? p.pdfUrl.trim() : null,
  gallery: p.gallery ?? null,
  specifications: p.specifications ?? {},
  filters: p.filters ?? {},
  translations: normalizeProductTranslations(p.translations) ?? {}
});

const sortProductsById = (items: Product[]): Product[] =>
  [...items].sort((a, b) => a.id.localeCompare(b.id));

const getFallbackProducts = () =>
  sortProductsById(
    fallbackProductData.map((product) =>
      cloneProduct({
        ...product,
        translations: product.translations || (FALLBACK_PRODUCT_TRANSLATIONS[product.id] ? { zh: FALLBACK_PRODUCT_TRANSLATIONS[product.id] } : undefined)
      })
    )
  );
const getFallbackNews = () =>
  fallbackNewsData.map((item) =>
    cloneNewsItem({
      ...item,
      translations: item.translations || (FALLBACK_NEWS_TRANSLATIONS[item.id] ? { zh: FALLBACK_NEWS_TRANSLATIONS[item.id] } : undefined)
    })
  );

const CONTENT_KEY_PRIORITY = [
  'intro',
  'lead',
  'summary',
  'overview',
  'title',
  'heading',
  'subtitle',
  'text',
  'body',
  'content',
  'description',
  'section',
  'sections',
  'conclusion',
  'outro'
];

const pushTextParts = (value: string, output: string[]) => {
  const trimmed = value.trim();
  if (!trimmed) return;

  // Keep IMAGE marker in one piece even when source text contains line breaks.
  if (/\[\[IMAGE:[\s\S]*?\]\]/i.test(trimmed)) {
    const compact = trimmed.replace(/\r?\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
    if (output[output.length - 1] !== compact) {
      output.push(compact);
    }
    return;
  }

  trimmed
    .split(/\r?\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      if (output[output.length - 1] !== part) {
        output.push(part);
      }
    });
};

const collectTextParts = (raw: unknown, output: string[]) => {
  if (typeof raw === 'string') {
    pushTextParts(raw, output);
    return;
  }

  if (typeof raw === 'number' || typeof raw === 'boolean') {
    pushTextParts(String(raw), output);
    return;
  }

  if (Array.isArray(raw)) {
    raw.forEach((item) => collectTextParts(item, output));
    return;
  }

  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    const keys = Object.keys(record);
    const orderedKeys = [
      ...CONTENT_KEY_PRIORITY.filter((key) => Object.prototype.hasOwnProperty.call(record, key)),
      ...keys.filter((key) => !CONTENT_KEY_PRIORITY.includes(key))
    ];

    orderedKeys.forEach((key) => {
      collectTextParts(record[key], output);
    });
  }
};

const normalizeNewsContent = (raw: unknown): string[] => {
  if (raw == null) {
    return [];
  }

  let source: unknown = raw;
  if (typeof raw === 'string') {
    const value = raw.trim();
    if (!value) return [];

    try {
      source = JSON.parse(value);
    } catch {
      source = value;
    }
  }

  const output: string[] = [];
  collectTextParts(source, output);
  return output;
};

const normalizeNewsTranslations = (raw: unknown): NewsItem['translations'] => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return undefined;
  }

  const zhRaw = (raw as Record<string, unknown>).zh;
  if (!zhRaw || typeof zhRaw !== 'object' || Array.isArray(zhRaw)) {
    return undefined;
  }

  const zhRecord = zhRaw as Record<string, unknown>;
  const zh: NewsTranslation = {
    ...(typeof zhRecord.title === 'string' ? { title: zhRecord.title.trim() } : {}),
    ...(typeof zhRecord.excerpt === 'string' ? { excerpt: zhRecord.excerpt.trim() } : {})
  };

  const translatedContent = normalizeNewsContent(zhRecord.content);
  if (translatedContent.length > 0) {
    zh.content = translatedContent;
  }

  return Object.keys(zh).length > 0 ? { zh } : undefined;
};

const fallbackNewsById = new Map(fallbackNewsData.map((item) => [item.id, item]));
const fallbackNewsBySlug = new Map(
  fallbackNewsData.map((item) => [normalizeNewsSlug(item.slug), item])
);

const mapNewsFromRow = (row: any): NewsItem => {
  const rowId = row?.id != null ? String(row.id) : '';
  const rowSlug = row?.slug != null ? normalizeNewsSlug(String(row.slug)) : '';
  const fallback = fallbackNewsById.get(rowId) || (rowSlug ? fallbackNewsBySlug.get(rowSlug) : undefined);
  const normalized = normalizeNewsContent(row.content);
  const title = row.title ?? fallback?.title ?? '';
  const id = rowId || fallback?.id || '';

  return {
    id,
    slug: getNewsSlug({ id, title, slug: rowSlug || fallback?.slug }),
    title,
    isActive: row.is_active !== false,
    date: row.date ?? fallback?.date ?? '',
    category: (row.category ?? fallback?.category ?? 'Market Insights') as NewsItem['category'],
    excerpt: row.excerpt ?? fallback?.excerpt ?? '',
    content: normalized.length > 0 ? normalized : normalizeNewsContent(fallback?.content ?? []),
    image: row.image ?? fallback?.image ?? '',
    translations: mergeNewsTranslations(
      normalizeNewsTranslations(row.translations),
      fallback?.translations || (FALLBACK_NEWS_TRANSLATIONS[rowId] ? { zh: FALLBACK_NEWS_TRANSLATIONS[rowId] } : undefined)
    )
  };
};

const mapNewsToRow = (n: NewsItem) => ({
  id: n.id,
  slug: getNewsSlug(n),
  title: n.title,
  is_active: n.isActive !== false,
  date: n.date,
  category: n.category,
  excerpt: n.excerpt,
  content: normalizeNewsContent(n.content),
  image: n.image,
  translations: normalizeNewsTranslations(n.translations) ?? {}
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const activeProducts = useMemo(() => getActiveProducts(products), [products]);
  const activeNews = useMemo(() => getActiveNews(news), [news]);

  const refresh = async () => {
    setIsLoading(true);

    if (!hasSupabaseEnv) {
      setProducts(getFallbackProducts());
      setNews(getFallbackNews());
      setIsLoading(false);
      return;
    }

    try {
      const [{ data: pData, error: pErr }, { data: nData, error: nErr }] = await Promise.all([
        supabase.from('products').select('*').order('id', { ascending: true }),
        supabase.from('news').select('*').order('date', { ascending: false })
      ]);

      if (pErr) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load products:', pErr.message);
      }
      if (nErr) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load news:', nErr.message);
      }

      setProducts(pErr ? getFallbackProducts() : (pData ?? []).map(mapProductFromRow));
      setNews(nErr ? getFallbackNews() : (nData ?? []).map(mapNewsFromRow));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Falling back to bundled data after refresh failure:', error);
      setProducts(getFallbackProducts());
      setNews(getFallbackNews());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addProduct = async (p: Product) => {
    await writeWithTranslationsFallback({
      table: 'products',
      payload: mapProductToRow(p),
      execute: async (payload) => await supabase.from('products').insert(payload)
    });
    setProducts((prev) => sortProductsById([...prev, p]));
  };

  const updateProduct = async (p: Product, oldId?: string) => {
    const targetId = oldId || p.id;

    // If ID changes, upsert the new row first so an intentional replacement does not fail on duplicate IDs.
    if (oldId && oldId !== p.id) {
      await writeWithTranslationsFallback({
        table: 'products',
        payload: mapProductToRow(p),
        execute: async (payload) => await supabase.from('products').upsert(payload, { onConflict: 'id' })
      });
      const { error: delErr } = await supabase.from('products').delete().eq('id', oldId);
      if (delErr) throw new Error(delErr.message);

      setProducts((prev) => sortProductsById([...prev.filter((x) => x.id !== oldId && x.id !== p.id), p]));
      return;
    }

    await writeWithTranslationsFallback({
      table: 'products',
      payload: mapProductToRow(p),
      execute: async (payload) => await supabase.from('products').upsert(payload, { onConflict: 'id' })
    });
    setProducts((prev) => {
      const next = prev.some((x) => x.id === targetId)
        ? prev.map((x) => (x.id === targetId ? p : x))
        : [...prev, p];
      return sortProductsById(next);
    });
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setProducts((prev) => prev.filter((x) => x.id !== id));
  };

  const addNews = async (item: NewsItem) => {
    await writeWithTranslationsFallback({
      table: 'news',
      payload: mapNewsToRow(item),
      execute: async (payload) => await supabase.from('news').insert(payload)
    });
    setNews((prev) => [item, ...prev]);
  };

  const updateNews = async (item: NewsItem) => {
    await writeWithTranslationsFallback({
      table: 'news',
      payload: mapNewsToRow(item),
      execute: async (payload) => await supabase.from('news').upsert(payload, { onConflict: 'id' })
    });
    setNews((prev) => prev.map((x) => (x.id === item.id ? item : x)));
  };

  const deleteNews = async (id: string) => {
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setNews((prev) => prev.filter((x) => x.id !== id));
  };

  const exportData = () => JSON.stringify({ products, news }, null, 2);

  const importData = async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      const p: Product[] = Array.isArray(parsed.products) ? parsed.products : [];
      const n: NewsItem[] = Array.isArray(parsed.news) ? parsed.news : [];

      if (p.length) {
        await writeWithTranslationsFallback({
          table: 'products',
          payload: p.map(mapProductToRow),
          execute: async (payload) => await supabase.from('products').upsert(payload, { onConflict: 'id' })
        });
      }

      if (n.length) {
        await writeWithTranslationsFallback({
          table: 'news',
          payload: n.map(mapNewsToRow),
          execute: async (payload) => await supabase.from('news').upsert(payload, { onConflict: 'id' })
        });
      }

      await refresh();
      return true;
    } catch {
      return false;
    }
  };

  const resetToDefaults = async () => {
    if (!hasSupabaseEnv) {
      setProducts(getFallbackProducts());
      setNews(getFallbackNews());
      setIsLoading(false);
      return;
    }

    await supabase.from('products').delete().neq('id', '');
    await supabase.from('news').delete().neq('id', '');
    await refresh();
  };


  const value = useMemo(
    () => ({
      products,
      news,
      activeProducts,
      activeNews,
      isLoading,
      addProduct,
      updateProduct,
      deleteProduct,
      addNews,
      updateNews,
      deleteNews,
      exportData,
      importData,
      resetToDefaults,
      refresh
    }),
    [products, news, activeProducts, activeNews, isLoading]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};


