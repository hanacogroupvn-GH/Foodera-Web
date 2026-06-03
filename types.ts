
export type CategoryType = string;

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export type NewsCategory = 'Product' | 'Logistics' | 'Market Insight';

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

export interface GalleryImage {
  url: string;
  alt?: string;
  caption?: string;
  sortOrder?: number;
}

export type ProductStatus = 'draft' | 'published' | 'archived';

export interface Product {
  id: string;
  slug?: string;
  name: string;
  isActive?: boolean;
  status?: ProductStatus;
  category: CategoryType;
  subCategory: string;
  description: string;
  shortDescription: string;
  image: string;
  imageAlt?: string;
  pdfUrl?: string;
  gallery?: (string | GalleryImage)[];
  specifications: Record<string, string>;
  packaging?: Record<string, string>;
  payment?: Record<string, string>;
  filters: ProductFilters;
  translations?: Partial<Record<ContentLocale, ProductTranslation>>;
  // SEO fields
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  canonicalUrl?: string;
  // B2B export fields
  moq?: string;
  originCountry?: string;
  certifications?: string[];
  incoterms?: string[];
  destinationMarkets?: string[];
  packagingOptions?: string[];
  leadTime?: string;
  samplePolicy?: string;
  /** Previous slugs for 301 redirect when slug changes */
  previousSlugs?: string[];
  /** Product appearance description (e.g. color, grain shape, texture) */
  appearance?: string;
  /** Pin order for featured display (1-9), null if not pinned */
  pinOrder?: number | null;
}

export type NewsRelatedProductLinkType = 'product' | 'category';

export interface NewsRelatedProduct {
  /** 'product' links to a specific product page; 'category' links to a category listing */
  type: NewsRelatedProductLinkType;
  /** Product ID — used when type = 'product' */
  productId?: string;
  /** Category name (e.g. 'Rice', 'Coffee') — used when type = 'category' */
  category?: string;
  /** Optional custom display label. Falls back to product name / category name */
  label?: string;
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
  /** Rich HTML content from Tiptap editor — takes priority over content[] for rendering */
  contentHtml?: string;
  image: string;
  imageAlt?: string;
  scheduledAt?: string;
  /** Custom <title> tag for SEO (falls back to title if not set) */
  seoTitle?: string;
  /** Meta description for SEO (falls back to excerpt/first paragraph if not set) */
  metaDescription?: string;
  /** Focus keyword for SEO analyzer scoring */
  focusKeyword?: string;
  secondaryKeywords?: string[];
  translations?: Partial<Record<ContentLocale, NewsTranslation>>;
  /** Internal product links shown in the article sidebar */
  relatedProducts?: NewsRelatedProduct[];
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
