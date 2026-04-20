
export type CategoryType = 'Rice' | 'Coffee' | 'Cashew' | 'Agriculture' | 'Pepper';

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

export type PersonalizationEntityType = 'page' | 'category' | 'product' | 'news' | 'quote_request';
export type PersonalizationAction = 'view' | 'click' | 'submit';

export interface PersonalizationTrackPayload {
  entityType: PersonalizationEntityType;
  action: PersonalizationAction;
  itemId?: string;
  route?: string;
  category?: CategoryType;
  subCategory?: string;
  newsCategory?: NewsCategory;
  locale?: SupportedLocale;
  metadata?: Record<string, string | number | boolean | null | undefined>;
  weight?: number;
}

export interface PersonalizationScoreEntry {
  key: string;
  score: number;
}

export interface PersonalizationProfile {
  visitorId: string;
  model: string;
  isPersonalized: boolean;
  signalCount: number;
  segment: string;
  summary: string;
  topCategories: PersonalizationScoreEntry[];
  topSubCategories: PersonalizationScoreEntry[];
  topNewsCategories: PersonalizationScoreEntry[];
  topProducts: PersonalizationScoreEntry[];
  topNews: PersonalizationScoreEntry[];
  topRoutes: PersonalizationScoreEntry[];
  lastActiveAt?: string;
}

export interface PersonalizedRecommendations {
  visitorId: string;
  profile: PersonalizationProfile;
  products: Product[];
  news: NewsItem[];
}

export interface RfqAttachment {
  publicUrl: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface RfqRequestItemInput {
  productId: string;
  productName?: string;
  targetSpecs?: string;
}

export interface RfqRequestPayload {
  fullName: string;
  email: string;
  companyName?: string;
  phoneWhatsapp?: string;
  destinationPort: string;
  incoterm: string;
  monthlyVolume: string;
  packaging?: string;
  paymentTerms?: string;
  certificationNeeded?: string;
  timeline?: string;
  message: string;
  attachments?: RfqAttachment[];
  items: RfqRequestItemInput[];
}

export interface ProvinceMapProduct {
  name: string;
  location: string;
  zoneCount: number;
  rating?: number | null;
  category?: string;
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
