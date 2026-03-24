export type OperationSection = 'quality' | 'logistics' | 'packaging' | 'terms';

import { normalizeProductCategorySlug } from './productCategories';

export const appRoutes = {
  home: '/',
  login: '/login',
  about: '/about',
  contact: '/contact',
  products: '/product',
  legacyProducts: '/products',
  productBase: '/product/item',
  news: '/news',
  commercialTool: '/commercial-tool',
  operations: '/operations',
  admin: '/admin',
  adminInventory: '/admin/inventory',
  adminNews: '/admin/news',
  productById: (id: string) => `/product/item/${encodeURIComponent(id)}`,
  productsByCategory: (category: string) => `/product/${normalizeProductCategorySlug(category)}`,
  productLine: (category: string, subCategory?: string) => {
    const basePath = `/product/${normalizeProductCategorySlug(category)}`;
    const safeSubCategory = subCategory?.trim();

    if (!safeSubCategory) {
      return basePath;
    }

    return `${basePath}?sub=${encodeURIComponent(safeSubCategory)}`;
  },
  operationsSection: (section: OperationSection) => `/operations#${section}`
} as const;
