export type OperationSection = 'quality' | 'logistics' | 'packaging' | 'terms';

const normalizeCategory = (category: string) => encodeURIComponent(category.trim().toLowerCase());

export const appRoutes = {
  home: '/',
  login: '/login',
  about: '/about',
  contact: '/contact',
  products: '/products',
  productBase: '/product',
  news: '/news',
  commercialTool: '/commercial-tool',
  operations: '/operations',
  admin: '/admin',
  adminInventory: '/admin/inventory',
  adminNews: '/admin/news',
  productById: (id: string) => `/product/${encodeURIComponent(id)}`,
  productsByCategory: (category: string) => `/products/${normalizeCategory(category)}`,
  productLine: (category: string, subCategory?: string) => {
    const basePath = `/products/${normalizeCategory(category)}`;
    const safeSubCategory = subCategory?.trim();

    if (!safeSubCategory) {
      return basePath;
    }

    return `${basePath}?sub=${encodeURIComponent(safeSubCategory)}`;
  },
  operationsSection: (section: OperationSection) => `/operations#${section}`
} as const;
