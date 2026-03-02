import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Product, NewsItem } from '../types';
import { supabase } from '../lib/supabaseClient';

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

const mapNewsFromRow = (row: any): NewsItem => ({
  id: row.id,
  title: row.title,
  date: row.date,
  category: row.category,
  excerpt: row.excerpt,
  content: row.content ?? [],
  image: row.image
});

const mapNewsToRow = (n: NewsItem) => ({
  id: n.id,
  title: n.title,
  date: n.date,
  category: n.category,
  excerpt: n.excerpt,
  content: n.content ?? [],
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
