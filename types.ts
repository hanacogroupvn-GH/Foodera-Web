
export type CategoryType = 'Rice' | 'Coffee' | 'Cashew' | 'Agriculture';

export type NewsCategory = 'Market Insights' | 'Company Updates' | 'Sustainability' | 'Events';

export type SupportedLocale = 'en' | 'zh';
export type ContentLocale = Exclude<SupportedLocale, 'en'>;

export interface ProductTranslation {
  name?: string;
  subCategory?: string;
  description?: string;
  shortDescription?: string;
  specifications?: Record<string, string>;
}

export interface NewsTranslation {
  title?: string;
  excerpt?: string;
  content?: string[];
}

export interface Product {
  id: string;
  name: string;
  category: CategoryType;
  subCategory: string;
  description: string;
  shortDescription: string;
  image: string;
  pdfUrl?: string;
  gallery?: string[];
  specifications: Record<string, string>;
  filters: {
    type?: string;
    brokenRatio?: string;
    grainLength?: string;
    processing?: string;
    grade?: string;
    screenSize?: string;
  };
  translations?: Partial<Record<ContentLocale, ProductTranslation>>;
}

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  date: string;
  category: NewsCategory;
  excerpt: string;
  content: string[];
  image: string;
  translations?: Partial<Record<ContentLocale, NewsTranslation>>;
}
