import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Product, NewsItem } from '../types';
import { supabase } from '../lib/supabaseClient';
import { NEWS as fallbackNewsData } from '../constants';
import { getNewsSlug, normalizeNewsSlug } from '../lib/newsSeo';

interface DataContextType {
  products: Product[];
  news: NewsItem[];
  isLoading: boolean;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product, oldId?: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addNews: (item: NewsItem) => Promise<void>;
  updateNews: (item: NewsItem) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  exportData: () => string;
  importData: (jsonData: string) => Promise<boolean>;

  // ✅ CHỈ KHAI BÁO
  resetToDefaults: () => Promise<void>;
  refresh: () => Promise<void>;
}


const DataContext = createContext<DataContextType | undefined>(undefined);

const SAMPLE_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

const mapProductFromRow = (row: any): Product => ({
  id: row.id,
  name: row.name,
  category: row.category,
  subCategory: row.sub_category,
  description: row.description,
  shortDescription: row.short_description,
  image: row.image,
  pdfUrl: row.pdf_url && row.pdf_url !== SAMPLE_PDF_URL ? row.pdf_url : undefined,
  gallery: row.gallery ?? undefined,
  specifications: row.specifications ?? {},
  filters: row.filters ?? {}
});

const mapProductToRow = (p: Product) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  sub_category: p.subCategory,
  description: p.description,
  short_description: p.shortDescription,
  image: p.image,
  pdf_url: p.pdfUrl?.trim() ? p.pdfUrl.trim() : null,
  gallery: p.gallery ?? null,
  specifications: p.specifications ?? {},
  filters: p.filters ?? {}
});

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
    date: row.date ?? fallback?.date ?? '',
    category: (row.category ?? fallback?.category ?? 'Market Insights') as NewsItem['category'],
    excerpt: row.excerpt ?? fallback?.excerpt ?? '',
    content: normalized.length > 0 ? normalized : normalizeNewsContent(fallback?.content ?? []),
    image: row.image ?? fallback?.image ?? ''
  };
};

const mapNewsToRow = (n: NewsItem) => ({
  id: n.id,
  slug: getNewsSlug(n),
  title: n.title,
  date: n.date,
  category: n.category,
  excerpt: n.excerpt,
  content: normalizeNewsContent(n.content),
  image: n.image
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);

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

    const nextProducts = (pData ?? []).map(mapProductFromRow);
    const nextNews = (nData ?? []).map(mapNewsFromRow);

    setProducts(nextProducts);
    setNews(nextNews);


    setIsLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addProduct = async (p: Product) => {
    const { error } = await supabase.from('products').insert(mapProductToRow(p));
    if (error) throw new Error(error.message);
    setProducts((prev) => [...prev, p]);
  };

  const updateProduct = async (p: Product, oldId?: string) => {
    const targetId = oldId || p.id;

    // If ID changes, delete old then insert new
    if (oldId && oldId !== p.id) {
      const { error: delErr } = await supabase.from('products').delete().eq('id', oldId);
      if (delErr) throw new Error(delErr.message);
      const { error: insErr } = await supabase.from('products').insert(mapProductToRow(p));
      if (insErr) throw new Error(insErr.message);

      setProducts((prev) => prev.map((x) => (x.id === oldId ? p : x)));
      return;
    }

    const { error } = await supabase.from('products').upsert(mapProductToRow(p), { onConflict: 'id' });
    if (error) throw new Error(error.message);
    setProducts((prev) => prev.map((x) => (x.id === targetId ? p : x)));
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setProducts((prev) => prev.filter((x) => x.id !== id));
  };

  const addNews = async (item: NewsItem) => {
    const { error } = await supabase.from('news').insert(mapNewsToRow(item));
    if (error) throw new Error(error.message);
    setNews((prev) => [item, ...prev]);
  };

  const updateNews = async (item: NewsItem) => {
    const { error } = await supabase.from('news').upsert(mapNewsToRow(item), { onConflict: 'id' });
    if (error) throw new Error(error.message);
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
        const { error } = await supabase.from('products').upsert(p.map(mapProductToRow), { onConflict: 'id' });
        if (error) throw new Error(error.message);
      }

      if (n.length) {
        const { error } = await supabase.from('news').upsert(n.map(mapNewsToRow), { onConflict: 'id' });
        if (error) throw new Error(error.message);
      }

      await refresh();
      return true;
    } catch {
      return false;
    }
  };

  const resetToDefaults = async () => {
  await supabase.from('products').delete().neq('id', '');
  await supabase.from('news').delete().neq('id', '');
  await refresh();
};


  const value = useMemo(
    () => ({
      products,
      news,
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
    [products, news, isLoading]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
