import {
  CategoryType,
  NewsCategory,
  NewsItem,
  Product,
  SupportedLocale
} from '../types';
import { translateFilterValue, translateProductFilters } from './filterLocalization';
import { preserveVietnamesePlaceNamesDeep } from './preserveVietnamesePlaceNames';

const CATEGORY_LABELS: Record<SupportedLocale, Record<CategoryType, string>> = {
  en: {
    Rice: 'Rice',
    Coffee: 'Coffee',
    Cashew: 'Cashew',
    Agriculture: 'Agriculture',
    Pepper: 'Pepper'
  },
  zh: {
    Rice: '\u5927\u7c73',
    Coffee: '\u5496\u5561',
    Cashew: '\u8170\u679c',
    Agriculture: '\u519c\u4ea7\u54c1',
    Pepper: '\u80e1\u6912'
  }
};

const NEWS_CATEGORY_LABELS: Record<SupportedLocale, Record<NewsCategory, string>> = {
  en: {
    'Product': 'Product',
    'Logistics': 'Logistics',
    'Market Insight': 'Market Insight',
  },
  zh: {
    'Product': '\u4ea7\u54c1',
    'Logistics': '\u7269\u6d41',
    'Market Insight': '\u5e02\u573a\u6d1e\u5bdf',
  }
};

const hasRecordEntries = (record?: Record<string, string>) => Boolean(record && Object.keys(record).length > 0);
const hasFilterEntries = (record?: Record<string, string>) =>
  Boolean(record && Object.values(record).some((value) => String(value || '').trim()));

export const localizeProduct = (product: Product, locale: SupportedLocale): Product => {
  if (locale === 'en' || !product.translations?.zh) {
    return product;
  }

  const translation = preserveVietnamesePlaceNamesDeep(product.translations.zh);

  return {
    ...product,
    name: translation.name || product.name,
    subCategory: translation.subCategory || product.subCategory,
    description: translation.description || product.description,
    shortDescription: translation.shortDescription || product.shortDescription,
    specifications: hasRecordEntries(translation.specifications) ? translation.specifications : product.specifications,
    packaging: hasRecordEntries(translation.packaging) ? translation.packaging : product.packaging,
    payment: hasRecordEntries(translation.payment) ? translation.payment : product.payment,
    filters: hasFilterEntries(translation.filters)
      ? translateProductFilters(product.filters, 'zh', translation.filters) || product.filters
      : product.filters
  };
};

export const localizeNewsItem = (item: NewsItem, locale: SupportedLocale): NewsItem => {
  if (locale === 'en' || !item.translations?.zh) {
    return item;
  }

  const translation = preserveVietnamesePlaceNamesDeep(item.translations.zh);

  return {
    ...item,
    title: translation.title || item.title,
    excerpt: translation.excerpt || item.excerpt,
    content: translation.content || item.content
  };
};

export const getCategoryLabel = (category: CategoryType, locale: SupportedLocale): string =>
  CATEGORY_LABELS[locale][category];

export const getNewsCategoryLabel = (category: NewsCategory, locale: SupportedLocale): string =>
  NEWS_CATEGORY_LABELS[locale][category];

export const getLocalizedFilterValue = (value: string, locale: SupportedLocale): string =>
  translateFilterValue(value, locale);

export const formatDisplayDate = (rawDate: string, locale: SupportedLocale): string => {
  if (locale === 'en') {
    return rawDate;
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return rawDate;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(parsed);
};
