import { CategoryType, Product } from '../types';

type ProductCategoryInput = {
  category?: string | null;
  subCategory?: string | null;
  id?: string | null;
  name?: string | null;
  filters?: Product['filters'];
  sub_category?: string | null;
};

export const PRODUCT_CATEGORIES: CategoryType[] = ['Rice', 'Coffee', 'Cashew', 'Agriculture', 'Pepper'];

export const normalizeProductCategorySlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_/]+/g, '-');

export const findProductCategoryBySlug = (slug?: string | null): CategoryType | undefined => {
  if (!slug) {
    return undefined;
  }

  const normalizedSlug = normalizeProductCategorySlug(slug);
  return PRODUCT_CATEGORIES.find((category) => normalizeProductCategorySlug(category) === normalizedSlug);
};

const hasCashewSignal = (value?: string | null): boolean =>
  typeof value === 'string' && value.toLowerCase().includes('cashew');

export const normalizeProductCategory = (input: ProductCategoryInput): CategoryType => {
  const category = (input.category || '').trim().toLowerCase();
  const isLegacyCashew =
    hasCashewSignal(input.subCategory) ||
    hasCashewSignal(input.sub_category) ||
    hasCashewSignal(input.id) ||
    hasCashewSignal(input.name) ||
    hasCashewSignal(input.filters?.type);

  if (category.includes('rice')) return 'Rice';
  if (category.includes('coffee')) return 'Coffee';
  if (category.includes('cashew')) return 'Cashew';
  if (category.includes('agri') && isLegacyCashew) return 'Cashew';
  if (category.includes('agri')) return 'Agriculture';
  if (category.includes('pepper')) return 'Pepper';
  if (isLegacyCashew) return 'Cashew';
  return 'Rice';
};
