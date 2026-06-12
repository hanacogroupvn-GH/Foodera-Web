import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CareerItem, NewsItem, NewsTranslation, Product, ProductCategory, ProductTranslation } from '../types';
import { api, BackendMode } from '../lib/apiClient';
import { NEWS as fallbackNewsData, PRODUCTS as fallbackProductData } from '../constants';
import { FALLBACK_NEWS_TRANSLATIONS, FALLBACK_PRODUCT_TRANSLATIONS } from '../lib/fallbackTranslations';
import { getActiveCareers, getActiveNews, getActiveProducts } from '../lib/contentStatus';
import { setDynamicCategories } from '../lib/productCategories';
import { preserveVietnamesePlaceNamesDeep } from '../lib/preserveVietnamesePlaceNames';

interface DataContextType {
  products: Product[];
  news: NewsItem[];
  categories: ProductCategory[];
  careers: CareerItem[];
  activeProducts: Product[];
  activeNews: NewsItem[];
  activeCareers: CareerItem[];
  isLoading: boolean;
  backendMode: BackendMode;
  backendError: string | null;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product, oldId?: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addNews: (item: NewsItem) => Promise<void>;
  updateNews: (item: NewsItem) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  addCareer: (item: CareerItem) => Promise<void>;
  updateCareer: (item: CareerItem) => Promise<void>;
  deleteCareer: (id: string) => Promise<void>;
  upsertCategory: (category: ProductCategory) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  exportData: () => string;
  importData: (jsonData: string) => Promise<boolean>;
  resetToDefaults: () => Promise<void>;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const cloneProductTranslation = (translation: ProductTranslation): ProductTranslation => ({
  ...preserveVietnamesePlaceNamesDeep(translation),
  specifications: translation.specifications ? preserveVietnamesePlaceNamesDeep({ ...translation.specifications }) : undefined,
  packaging: translation.packaging ? preserveVietnamesePlaceNamesDeep({ ...translation.packaging }) : undefined,
  payment: translation.payment ? preserveVietnamesePlaceNamesDeep({ ...translation.payment }) : undefined,
  filters: translation.filters ? preserveVietnamesePlaceNamesDeep({ ...translation.filters }) : undefined
});

const cloneNewsTranslation = (translation: NewsTranslation): NewsTranslation => ({
  ...preserveVietnamesePlaceNamesDeep(translation),
  content: translation.content ? preserveVietnamesePlaceNamesDeep([...translation.content]) : undefined
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
  packaging: product.packaging ? { ...product.packaging } : undefined,
  payment: product.payment ? { ...product.payment } : undefined,
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
    specifications: primaryZh?.specifications || fallbackZh?.specifications,
    packaging: primaryZh?.packaging || fallbackZh?.packaging,
    payment: primaryZh?.payment || fallbackZh?.payment,
    filters: primaryZh?.filters || fallbackZh?.filters
  };

  if (!mergedZh.specifications) delete mergedZh.specifications;
  if (!mergedZh.packaging) delete mergedZh.packaging;
  if (!mergedZh.payment) delete mergedZh.payment;
  if (!mergedZh.filters) delete mergedZh.filters;

  return Object.keys(mergedZh).length > 0 ? preserveVietnamesePlaceNamesDeep({ zh: mergedZh }) : undefined;
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

  if (!mergedZh.content) delete mergedZh.content;

  return Object.keys(mergedZh).length > 0 ? preserveVietnamesePlaceNamesDeep({ zh: mergedZh }) : undefined;
};

const fallbackProductsById = new Map(fallbackProductData.map((product) => [product.id, product]));
const fallbackNewsById = new Map(fallbackNewsData.map((item) => [item.id, item]));

const normalizeProduct = (product: Product): Product => {
  const fallback = fallbackProductsById.get(product.id);
  const fallbackTranslations =
    fallback?.translations || (FALLBACK_PRODUCT_TRANSLATIONS[product.id] ? { zh: FALLBACK_PRODUCT_TRANSLATIONS[product.id] } : undefined);

  return cloneProduct({
    ...product,
    translations: mergeProductTranslations(product.translations, fallbackTranslations)
  });
};

const normalizeNewsItem = (item: NewsItem): NewsItem => {
  const fallback = fallbackNewsById.get(item.id);
  const fallbackTranslations =
    fallback?.translations || (FALLBACK_NEWS_TRANSLATIONS[item.id] ? { zh: FALLBACK_NEWS_TRANSLATIONS[item.id] } : undefined);

  const validCategories = ['Product', 'Logistics', 'Market Insight'];
  const category = validCategories.includes(item.category) ? item.category : 'Market Insight';

  return cloneNewsItem({
    ...item,
    category: category as NewsItem['category'],
    translations: mergeNewsTranslations(item.translations, fallbackTranslations)
  });
};

const getFallbackProducts = () =>
  fallbackProductData.map((product) =>
    normalizeProduct({
      ...product,
      translations: product.translations || (FALLBACK_PRODUCT_TRANSLATIONS[product.id] ? { zh: FALLBACK_PRODUCT_TRANSLATIONS[product.id] } : undefined)
    })
  );

const getFallbackNews = () =>
  fallbackNewsData.map((item) =>
    normalizeNewsItem({
      ...item,
      translations: item.translations || (FALLBACK_NEWS_TRANSLATIONS[item.id] ? { zh: FALLBACK_NEWS_TRANSLATIONS[item.id] } : undefined)
    })
  );

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [careers, setCareers] = useState<CareerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendMode, setBackendMode] = useState<BackendMode>('fallback');
  const [backendError, setBackendError] = useState<string | null>(null);
  const activeProducts = useMemo(() => getActiveProducts(products), [products]);
  const activeNews = useMemo(() => getActiveNews(news), [news]);
  const activeCareers = useMemo(() => getActiveCareers(careers), [careers]);

  const refresh = async () => {
    setIsLoading(true);

    // Retry up to 2 times to handle Netlify Function cold start delays
    const MAX_RETRIES = 2;
    const RETRY_DELAY_MS = 2000;

    let lastError: unknown = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const payload = await api.getContent();
        setProducts((payload.products ?? []).map(normalizeProduct));
        setNews((payload.news ?? []).map(normalizeNewsItem));
        setCategories(payload.categories ?? []);
        setCareers(payload.careers ?? []);
        setDynamicCategories(payload.categories ?? []);
        setBackendMode(payload.backend || 'turso');
        setBackendError(null);
        setIsLoading(false);
        return; // success — exit early
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES) {
          // Wait before retrying (cold start recovery)
          await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    }

    // All retries exhausted — fall back to bundled data
    setProducts(getFallbackProducts());
    setNews(getFallbackNews());
    setBackendMode('fallback');
    setBackendError(lastError instanceof Error ? lastError.message : 'Failed to reach /api/content.');
    setIsLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const addProduct = async (product: Product) => {
    await api.upsertProduct(product);
    await refresh();
  };

  const updateProduct = async (product: Product, oldId?: string) => {
    await api.upsertProduct(product, oldId);
    await refresh();
  };

  const deleteProduct = async (id: string) => {
    await api.deleteProduct(id);
    await refresh();
  };

  const addNews = async (item: NewsItem) => {
    await api.upsertNews(item);
    await refresh();
  };

  const updateNews = async (item: NewsItem) => {
    await api.upsertNews(item);
    await refresh();
  };

  const deleteNews = async (id: string) => {
    await api.deleteNews(id);
    await refresh();
  };

  const addCareer = async (item: CareerItem) => {
    await api.upsertCareer(item);
    await refresh();
  };

  const updateCareer = async (item: CareerItem) => {
    await api.upsertCareer(item);
    await refresh();
  };

  const deleteCareer = async (id: string) => {
    await api.deleteCareer(id);
    await refresh();
  };

  const upsertCategory = async (category: ProductCategory) => {
    await api.upsertCategory(category);
    await refresh();
  };

  const deleteCategory = async (id: string) => {
    await api.deleteCategory(id);
    await refresh();
  };

  const exportData = () => JSON.stringify({ products, news }, null, 2);

  const importData = async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      const importedProducts: Product[] = Array.isArray(parsed.products) ? parsed.products : [];
      const importedNews: NewsItem[] = Array.isArray(parsed.news) ? parsed.news : [];

      await api.importContent({
        products: importedProducts,
        news: importedNews
      });
      await refresh();
      return true;
    } catch {
      return false;
    }
  };

  const resetToDefaults = async () => {
    await api.importContent({
      products: getFallbackProducts(),
      news: getFallbackNews()
    });
    await refresh();
  };

  const value = useMemo(
    () => ({
      products,
      news,
      categories,
      careers,
      activeProducts,
      activeNews,
      activeCareers,
      isLoading,
      backendMode,
      backendError,
      addProduct,
      updateProduct,
      deleteProduct,
      addNews,
      updateNews,
      deleteNews,
      addCareer,
      updateCareer,
      deleteCareer,
      upsertCategory,
      deleteCategory,
      exportData,
      importData,
      resetToDefaults,
      refresh
    }),
    [products, news, categories, careers, activeProducts, activeNews, activeCareers, isLoading, backendMode, backendError]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
