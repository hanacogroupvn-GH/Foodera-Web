
export type CategoryType = 'Rice' | 'Coffee' | 'Cashew' | 'Agriculture';

export type NewsCategory = 'Market Insights' | 'Company Updates' | 'Sustainability' | 'Events';

export type SupportedLocale = 'en' | 'zh';
export type ContentLocale = Exclude<SupportedLocale, 'en'>;

export interface ProductFilters {
  [key: string]: string | undefined;
  type?: string;
  brokenRatio?: string;
  grainLength?: string;
  processing?: string;
  grade?: string;
  screenSize?: string;
}

export interface ProductTranslation {
  name?: string;
  subCategory?: string;
  description?: string;
  shortDescription?: string;
  specifications?: Record<string, string>;
  packaging?: Record<string, string>;
  payment?: Record<string, string>;
  filters?: ProductFilters;
}

export interface NewsTranslation {
  title?: string;
  excerpt?: string;
  content?: string[];
}

export interface Product {
  id: string;
  name: string;
  isActive?: boolean;
  category: CategoryType;
  subCategory: string;
  description: string;
  shortDescription: string;
  image: string;
  pdfUrl?: string;
  gallery?: string[];
  specifications: Record<string, string>;
  packaging?: Record<string, string>;
  payment?: Record<string, string>;
  filters: ProductFilters;
  translations?: Partial<Record<ContentLocale, ProductTranslation>>;
}

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  isActive?: boolean;
  date: string;
  category: NewsCategory;
  excerpt: string;
  content: string[];
  image: string;
  translations?: Partial<Record<ContentLocale, NewsTranslation>>;
}

export interface ProvinceMapProduct {
  name: string;
  location: string;
  zoneCount: number;
  rating?: number | null;
}

export interface ProvinceMapProfile {
  provinceId: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  cultivatedAreaHectares: number | null;
  averageOutputMtPerYear: number | null;
  sowingPeriod: string;
  harvestPeriod: string;
  cropsPerYear: number | null;
  characteristics: string;
  varieties: string;
  products: ProvinceMapProduct[];
  updatedAt?: string;
}

export interface ProvinceMapSuggestionSource {
  title: string;
  uri: string;
}

export interface ProvinceMapSuggestionResult {
  profile: ProvinceMapProfile;
  provider: 'gemini' | 'ollama';
  sources: ProvinceMapSuggestionSource[];
}
