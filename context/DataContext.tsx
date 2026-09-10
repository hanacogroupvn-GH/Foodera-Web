import React, { createContext, useContext, useMemo } from 'react';
import { NewsCategory, NewsItem, Product, ProductCategory } from '../types';
import productsData from '../data/products.json';
import newsData from '../data/news.json';
import categoriesData from '../data/categories.json';
import { getActiveNews, getActiveProducts } from '../lib/contentStatus';
import { setDynamicCategories } from '../lib/productCategories';

const VALID_NEWS_CATEGORIES: NewsCategory[] = ['Product', 'Logistics', 'Market Insight'];

// data/news.json is hand-edited — guard against a typo'd `category` value
// silently making an article disappear from every News page cluster.
const normalizeNewsCategory = (item: NewsItem): NewsItem => ({
  ...item,
  category: VALID_NEWS_CATEGORIES.includes(item.category) ? item.category : 'Market Insight'
});

const products = productsData as unknown as Product[];
const news = (newsData as unknown as NewsItem[]).map(normalizeNewsCategory);
const categories = categoriesData as unknown as ProductCategory[];

// Category-derived UI (mega menu, filters) reads from this module-level
// singleton, so it only needs to be populated once at startup.
setDynamicCategories(categories);

interface DataContextType {
  products: Product[];
  news: NewsItem[];
  categories: ProductCategory[];
  activeProducts: Product[];
  activeNews: NewsItem[];
  // Content is bundled statically and available synchronously, but kept in
  // the interface so pages that guard on it (initial loading screens)
  // don't need to change.
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const activeProducts = getActiveProducts(products);
const activeNews = getActiveNews(news);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo<DataContextType>(
    () => ({
      products,
      news,
      categories,
      activeProducts,
      activeNews,
      isLoading: false
    }),
    []
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
