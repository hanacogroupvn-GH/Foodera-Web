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
  gallery: '/gallery',
  commercialTool: '/interactive-map',
  legacyCommercialTool: '/commercial-tool',
  admin: '/admin',
  adminDashboard: '/admin/dashboard',
  adminInventory: '/admin/inventory',
  adminNews: '/admin/news',
  adminCareers: '/admin/careers',
  adminExportStats: '/admin/export-stats',
  adminMapContent: '/admin/interactive-map',
  productById: (id: string) => `/product/item/${encodeURIComponent(id)}`,
  productBySlug: (slugOrId: string) => `/product/item/${encodeURIComponent(slugOrId)}`,
  productsByCategory: (category: string) => `/product/${normalizeProductCategorySlug(category)}`,
  productLine: (category: string, subCategory?: string) => {
    const basePath = `/product/${normalizeProductCategorySlug(category)}`;
    const safeSubCategory = subCategory?.trim();

    if (!safeSubCategory) {
      return basePath;
    }

    return `${basePath}?sub=${encodeURIComponent(safeSubCategory)}`;
  }
} as const;
