import { CategoryType, Product, ProductCategory } from '../types';

type ProductCategoryInput = {
  category?: string | null;
  subCategory?: string | null;
  id?: string | null;
  name?: string | null;
  filters?: Product['filters'];
  sub_category?: string | null;
};

// Hardcoded fallback — used when DB categories are not yet loaded
export const DEFAULT_PRODUCT_CATEGORIES: CategoryType[] = ['Rice', 'Coffee', 'Cashew', 'Agriculture', 'Pepper'];

// PRODUCT_CATEGORIES is now mutable: populated from DB via setDynamicCategories()
let _dynamicCategories: CategoryType[] | null = null;

export const setDynamicCategories = (categories: ProductCategory[]) => {
  _dynamicCategories = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => c.name);
};

export const getDynamicCategories = (): CategoryType[] =>
  _dynamicCategories && _dynamicCategories.length > 0
    ? _dynamicCategories
    : DEFAULT_PRODUCT_CATEGORIES;

// Legacy export for backward compatibility — just calls getDynamicCategories()
export const PRODUCT_CATEGORIES = DEFAULT_PRODUCT_CATEGORIES;

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
  return getDynamicCategories().find((category) => normalizeProductCategorySlug(category) === normalizedSlug);
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

  // Try matching against dynamic categories first
  const categories = getDynamicCategories();
  const directMatch = categories.find((c) => c.toLowerCase() === category);
  if (directMatch) return directMatch;

  // Legacy fallback matching
  if (category.includes('rice')) return 'Rice';
  if (category.includes('coffee')) return 'Coffee';
  if (category.includes('cashew')) return 'Cashew';
  if (category.includes('agri') && isLegacyCashew) return 'Cashew';
  if (category.includes('agri')) return 'Agriculture';
  if (category.includes('pepper')) return 'Pepper';
  if (isLegacyCashew) return 'Cashew';
  return categories[0] || 'Rice';
};
