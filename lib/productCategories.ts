import { CategoryType, Product } from '../types';

type ProductCategoryInput = Partial<
  Pick<Product, 'category' | 'subCategory' | 'id' | 'name' | 'filters'>
> & {
  sub_category?: string | null;
};

export const PRODUCT_CATEGORIES: CategoryType[] = ['Rice', 'Coffee', 'Cashew', 'Agriculture'];

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
  if (isLegacyCashew) return 'Cashew';
  return 'Rice';
};
