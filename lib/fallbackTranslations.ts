import { NewsItem, Product } from '../types';

// Hard-coded fallback translations have been removed.
// All translations are now managed through the backend CMS.
// These empty records ensure the app compiles without errors when no fallback data exists.

export const FALLBACK_PRODUCT_TRANSLATIONS: Record<string, NonNullable<Product['translations']>['zh']> = {};

export const FALLBACK_NEWS_TRANSLATIONS: Record<string, NonNullable<NewsItem['translations']>['zh']> = {};
