import {
  CategoryType,
  NewsCategory,
  NewsItem,
  Product,
  SupportedLocale
} from '../types';

const CATEGORY_LABELS: Record<SupportedLocale, Record<CategoryType, string>> = {
  en: {
    Rice: 'Rice',
    Coffee: 'Coffee',
    Cashew: 'Cashew',
    Agriculture: 'Agriculture'
  },
  zh: {
    Rice: '大米',
    Coffee: '咖啡',
    Cashew: '腰果',
    Agriculture: '农产品'
  }
};

const NEWS_CATEGORY_LABELS: Record<SupportedLocale, Record<NewsCategory, string>> = {
  en: {
    'Market Insights': 'Market Insights',
    'Company Updates': 'Company Updates',
    Sustainability: 'Sustainability',
    Events: 'Events'
  },
  zh: {
    'Market Insights': '市场洞察',
    'Company Updates': '公司动态',
    Sustainability: '可持续发展',
    Events: '活动'
  }
};

const FILTER_VALUE_LABELS: Partial<Record<SupportedLocale, Record<string, string>>> = {
  zh: {
    'Long Grain': '长粒',
    Fragrant: '香米',
    Arabica: '阿拉比卡',
    Robusta: '罗布斯塔',
    Cashew: '腰果',
    '5%': '5%碎米',
    Long: '长粒',
    Standard: '标准',
    Soft: '软质',
    Premium: '优选',
    Luxury: '高端',
    Specialty: '精品',
    'Fully Washed': '全水洗',
    Dried: '干燥',
    'Wet Polished': '湿抛光',
    'Semi Washed': '半水洗',
    Cleaned: '净选',
    'Dry Processed': '日晒',
    'White-Label / OEM Supply': '白牌 / OEM供应'
  }
};

const renderLocalizedFilterValue = (value: string, locale: SupportedLocale): string => {
  if (locale === 'en') {
    return value;
  }
  return FILTER_VALUE_LABELS[locale]?.[value] || value;
};

export const localizeProduct = (product: Product, locale: SupportedLocale): Product => {
  if (locale === 'en' || !product.translations?.zh) {
    return product;
  }

  const translation = product.translations.zh;
  return {
    ...product,
    name: translation.name || product.name,
    subCategory: translation.subCategory || product.subCategory,
    description: translation.description || product.description,
    shortDescription: translation.shortDescription || product.shortDescription,
    specifications: translation.specifications || product.specifications
  };
};

export const localizeNewsItem = (item: NewsItem, locale: SupportedLocale): NewsItem => {
  if (locale === 'en' || !item.translations?.zh) {
    return item;
  }

  const translation = item.translations.zh;
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
  renderLocalizedFilterValue(value, locale);

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
