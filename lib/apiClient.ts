import {
  NewsItem,
  PersonalizedRecommendations,
  PersonalizationTrackPayload,
  Product,
  ProductCategory,
  ProvinceMapProfile,
  ProvinceMapSuggestionResult,
  RfqAttachment,
  RfqRequestPayload
} from '../types';

export type AdminSessionUser = {
  email: string;
};

export type BackendMode = 'turso' | 'local' | 'fallback';

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  bodyType?: 'json' | 'form';
};

const buildRequestInit = (options: ApiRequestOptions = {}): RequestInit => {
  const { body, bodyType = 'json', ...rest } = options;
  const headers = new Headers(options.headers || {});
  const init: RequestInit = {
    ...rest,
    credentials: 'include',
    headers
  };

  if (body !== undefined) {
    if (bodyType === 'form') {
      const formBody = new URLSearchParams();

      if (body instanceof URLSearchParams) {
        init.body = body.toString();
      } else if (body && typeof body === 'object' && !Array.isArray(body)) {
        for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
          if (value === undefined || value === null) {
            continue;
          }

          formBody.set(key, String(value));
        }

        init.body = formBody.toString();
      } else {
        throw new Error('Form request body must be a plain object or URLSearchParams.');
      }

      headers.set('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
    } else {
      headers.set('Content-Type', 'application/json');
      init.body = JSON.stringify(body);
    }
  }

  return init;
};

const parseResponsePayload = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
};

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const response = await fetch(path, buildRequestInit(options));
  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    const message =
      (typeof payload === 'object' && payload && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : null) ||
      (typeof payload === 'object' && payload && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : null) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
};

export const api = {
  getContent: () =>
    apiRequest<{ backend: BackendMode; products: Product[]; news: NewsItem[]; categories?: ProductCategory[] }>('/api/content'),
  getPersonalizedRecommendations: (options?: { productLimit?: number; newsLimit?: number }) => {
    const searchParams = new URLSearchParams();

    if (options?.productLimit) {
      searchParams.set('productLimit', String(options.productLimit));
    }

    if (options?.newsLimit) {
      searchParams.set('newsLimit', String(options.newsLimit));
    }

    const query = searchParams.toString();
    return apiRequest<PersonalizedRecommendations>(
      `/api/personalization/recommendations${query ? `?${query}` : ''}`
    );
  },
  trackPersonalizationEvent: (payload: PersonalizationTrackPayload) =>
    apiRequest<{ ok: true } & PersonalizedRecommendations>('/api/personalization/events', {
      method: 'POST',
      body: payload,
      keepalive: true
    }),
  getProvinceMapProfiles: () =>
    apiRequest<{ profiles: ProvinceMapProfile[] }>('/api/map-profiles'),
  getSession: () =>
    apiRequest<{
      isAuthenticated: boolean;
      isAdmin: boolean;
      user: AdminSessionUser | null;
    }>('/api/auth/session'),
  login: (email: string, password: string) =>
    apiRequest<{ ok: true; user: AdminSessionUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      bodyType: 'form'
    }),
  logout: () =>
    apiRequest<{ ok: true }>('/api/auth/logout', {
      method: 'POST'
    }),
  submitContactInquiry: (payload: {
    companyName: string;
    fullName: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) =>
    apiRequest<{ ok: true }>('/api/contact-inquiries', {
      method: 'POST',
      body: payload
    }),
  uploadRfqAttachment: (payload: {
    dataUrl: string;
    contentType: string;
    fileName: string;
  }) =>
    apiRequest<{ ok: true; attachment: RfqAttachment }>('/api/rfq/uploads', {
      method: 'POST',
      body: payload
    }),
  submitQuotationRequest: (payload: RfqRequestPayload) =>
    apiRequest<{ ok: true }>('/api/quotation-requests', {
      method: 'POST',
      body: payload
    }),
  importContent: (payload: { products: Product[]; news: NewsItem[] }) =>
    apiRequest<{ ok: true; products: Product[]; news: NewsItem[] }>('/api/admin/import', {
      method: 'POST',
      body: payload
    }),
  upsertProduct: (product: Product, oldId?: string) =>
    apiRequest<{ ok: true; product: Product }>('/api/admin/products/upsert', {
      method: 'POST',
      body: { product, oldId }
    }),
  deleteProduct: (id: string) =>
    apiRequest<{ ok: true }>(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }),
  upsertNews: (item: NewsItem) =>
    apiRequest<{ ok: true; item: NewsItem }>('/api/admin/news/upsert', {
      method: 'POST',
      body: { item }
    }),
  deleteNews: (id: string) =>
    apiRequest<{ ok: true }>(`/api/admin/news/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }),
  upsertProvinceMapProfile: (profile: ProvinceMapProfile) =>
    apiRequest<{ ok: true; profile: ProvinceMapProfile }>('/api/admin/map-profiles/upsert', {
      method: 'POST',
      body: { profile }
    }),
  deleteProvinceMapProfile: (provinceId: string) =>
    apiRequest<{ ok: true }>(`/api/admin/map-profiles/${encodeURIComponent(provinceId)}`, {
      method: 'DELETE'
    }),
  suggestProvinceMapProfile: (payload: {
    provinceId: string;
    provinceName: string;
    provinceType: string;
    regionLabel: string;
    categoryScope?: 'auto' | 'Rice' | 'Coffee' | 'Cashew' | 'Pepper' | 'Agriculture';
  }) =>
    apiRequest<{ ok: true } & ProvinceMapSuggestionResult>('/api/admin/map-profiles/ai-suggest', {
      method: 'POST',
      body: payload
    }),
  uploadCmsImage: (payload: {
    dataUrl: string;
    contentType: string;
    fileName: string;
    folderSegments: string[];
  }) =>
    apiRequest<{ ok: true; publicUrl: string }>('/api/admin/uploads/images', {
      method: 'POST',
      body: payload
    }),
  translateCmsPrompt: (prompt: string) =>
    apiRequest<{ translation: unknown }>('/api/admin/translate', {
      method: 'POST',
      body: { prompt }
    }),
  // Product Categories
  upsertCategory: (category: ProductCategory) =>
    apiRequest<{ ok: true; category: ProductCategory }>('/api/admin/categories/upsert', {
      method: 'POST',
      body: { category }
    }),
  deleteCategory: (id: string) =>
    apiRequest<{ ok: true }>(`/api/admin/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
};
