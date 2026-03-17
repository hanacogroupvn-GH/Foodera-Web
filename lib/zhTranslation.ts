import { NewsTranslation, ProductTranslation } from '../types';
import { hasSupabaseEnv, supabase } from './supabaseClient';
import { preserveVietnamesePlaceNamesDeep } from './preserveVietnamesePlaceNames';

const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
const DEFAULT_OLLAMA_MODEL = 'qwen2.5:7b';
const CMS_TRANSLATE_FUNCTION = 'cms-translate-zh';
const DEV_CMS_TRANSLATE_PATH = '/__cms_translate_ollama';

const configuredOllamaBaseUrl = import.meta.env.VITE_OLLAMA_BASE_URL?.trim();
const configuredOllamaApiKey = import.meta.env.VITE_OLLAMA_API_KEY?.trim();
const configuredOllamaModel = import.meta.env.VITE_OLLAMA_MODEL?.trim();
const ollamaBaseUrl = configuredOllamaBaseUrl || DEFAULT_OLLAMA_BASE_URL;
const ollamaApiKey = import.meta.env.VITE_OLLAMA_API_KEY?.trim();
const ollamaModel = configuredOllamaModel || DEFAULT_OLLAMA_MODEL;
const hasExplicitBrowserOllamaConfig = Boolean(
  configuredOllamaBaseUrl || configuredOllamaApiKey || configuredOllamaModel
);

type CmsTranslateError = Error & {
  status?: number;
};

const sanitizeText = (value: unknown) => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  return '';
};

const sanitizeTextArray = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => sanitizeText(entry)).filter(Boolean);
};

const sanitizeStringRecord = (value: unknown): Record<string, string> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, entryValue]) => [sanitizeText(key), sanitizeText(entryValue)] as const)
    .filter(([key, entryValue]) => key && entryValue);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const extractJson = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('The translation model returned an empty response.');
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('The translation model did not return valid JSON.');
  }
};

const sanitizeNewsTranslation = (value: unknown): NewsTranslation => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;
  const normalized: NewsTranslation = {};
  const title = sanitizeText(record.title);
  const excerpt = sanitizeText(record.excerpt);
  const content = sanitizeTextArray(record.content);

  if (title) {
    normalized.title = title;
  }
  if (excerpt) {
    normalized.excerpt = excerpt;
  }
  if (content.length > 0) {
    normalized.content = content;
  }

  return preserveVietnamesePlaceNamesDeep(normalized);
};

const sanitizeProductTranslation = (value: unknown): ProductTranslation => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;
  const normalized: ProductTranslation = {};
  const name = sanitizeText(record.name);
  const subCategory = sanitizeText(record.subCategory);
  const shortDescription = sanitizeText(record.shortDescription);
  const description = sanitizeText(record.description);
  const specifications = sanitizeStringRecord(record.specifications);

  if (name) {
    normalized.name = name;
  }
  if (subCategory) {
    normalized.subCategory = subCategory;
  }
  if (shortDescription) {
    normalized.shortDescription = shortDescription;
  }
  if (description) {
    normalized.description = description;
  }
  if (specifications) {
    normalized.specifications = specifications;
  }

  return preserveVietnamesePlaceNamesDeep(normalized);
};

const buildNewsPrompt = (source: { title: string; excerpt: string; content: string[] }) => `
You are translating B2B agri-export editorial content from English to Simplified Chinese.

Rules:
- Return valid JSON only.
- Do not wrap the response in markdown or code fences.
- Do not add new facts or rewrite the structure.
- Preserve dates, product names, grades, numbers, units, and named standards exactly.
- Preserve Vietnamese proper nouns and Vietnam location names exactly in Latin script. Never translate them into Chinese characters.
- Preserve any token of the form [[IMAGE:...]] exactly as written.
- Keep the content array order exactly the same as the source.
- If any source text is already Chinese, keep it as-is.

Target JSON schema:
{
  "title": "string",
  "excerpt": "string",
  "content": ["paragraph 1", "paragraph 2"]
}

Fields to translate:
${JSON.stringify(source, null, 2)}
`;

const buildProductPrompt = (source: {
  name: string;
  subCategory: string;
  shortDescription: string;
  description: string;
  specifications: Record<string, string>;
}) => `
You are translating B2B agri-export product catalog content from English to Simplified Chinese.

Rules:
- Return valid JSON only.
- Do not wrap the response in markdown or code fences.
- Do not add new facts.
- Preserve product codes, grades, sizes, percentages, acronyms, units, and numbers exactly.
- Preserve Vietnamese proper nouns and Vietnam location names exactly in Latin script. Never translate them into Chinese characters.
- Translate specification keys into natural Simplified Chinese.
- Keep specification values faithful to the source.
- If any source text is already Chinese, keep it as-is.

Target JSON schema:
{
  "name": "string",
  "subCategory": "string",
  "shortDescription": "string",
  "description": "string",
  "specifications": {
    "translated key": "translated or preserved value"
  }
}

Fields to translate:
${JSON.stringify(source, null, 2)}
`;

const normalizeOllamaBaseUrl = (baseUrl: string) => baseUrl.replace(/\/$/, '').replace(/\/api$/, '');

const createCmsTranslateError = (message: string, status?: number): CmsTranslateError =>
  Object.assign(new Error(message), status ? { status } : {});

const isRetryableFunctionAuthError = ({ message, status }: { message: string; status?: number }) =>
  status === 401 && /invalid jwt|expired session|invalid or expired session|authorization|session/i.test(message);

const refreshCmsSession = async () => {
  if (!hasSupabaseEnv) {
    return false;
  }

  try {
    const { data, error } = await supabase.auth.refreshSession();
    return Boolean(data.session && !error);
  } catch {
    return false;
  }
};

const readFunctionErrorDetail = async (error: unknown): Promise<{ message: string; status?: number }> => {
  let status: number | undefined;
  let message = '';

  if (error && typeof error === 'object') {
    const response = (error as { context?: unknown }).context;
    if (response instanceof Response) {
      status = response.status;

      try {
        const payload = (await response.clone().json()) as { error?: unknown; message?: unknown };
        message = sanitizeText(payload.error) || sanitizeText(payload.message);
      } catch {
        try {
          message = sanitizeText(await response.clone().text());
        } catch {
          message = '';
        }
      }
    }

    if (!message) {
      message = sanitizeText((error as { message?: unknown }).message);
    }

    if (status == null && typeof (error as { status?: unknown }).status === 'number') {
      status = (error as { status?: number }).status;
    }
  }

  return {
    message: message || 'Failed to reach the CMS translation service.',
    status
  };
};

const invokeCmsTranslateFunction = async <TTranslation>(
  kind: 'news' | 'product',
  source: Record<string, unknown>,
  hasRetriedAuth = false
) => {
  const { data, error } = await supabase.functions.invoke(CMS_TRANSLATE_FUNCTION, {
    body: {
      kind,
      source
    }
  });

  if (error) {
    const detail = await readFunctionErrorDetail(error);

    if (!hasRetriedAuth && isRetryableFunctionAuthError(detail) && (await refreshCmsSession())) {
      return invokeCmsTranslateFunction<TTranslation>(kind, source, true);
    }

    throw createCmsTranslateError(detail.message, detail.status);
  }

  const translation = (data as { translation?: unknown } | null)?.translation;
  if (!translation || typeof translation !== 'object' || Array.isArray(translation)) {
    throw new Error('The CMS translation service returned an invalid payload.');
  }

  return translation as TTranslation;
};

const invokeLocalDevTranslateProxy = async <TTranslation>(
  kind: 'news' | 'product',
  source: Record<string, unknown>
) => {
  let response: Response;

  try {
    response = await fetch(DEV_CMS_TRANSLATE_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        kind,
        source
      })
    });
  } catch {
    throw createCmsTranslateError('Unable to reach the local CMS translation proxy.', 503);
  }

  let payload: { translation?: unknown; error?: unknown; message?: unknown } | null = null;
  try {
    payload = (await response.json()) as { translation?: unknown; error?: unknown; message?: unknown };
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw createCmsTranslateError(
      sanitizeText(payload?.error) ||
        sanitizeText(payload?.message) ||
        `Local CMS translation failed: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  const translation = payload?.translation;
  if (!translation || typeof translation !== 'object' || Array.isArray(translation)) {
    throw new Error('The local CMS translation proxy returned an invalid payload.');
  }

  return translation as TTranslation;
};

const translateWithOllama = async (prompt: string) => {
  const endpoint = `${normalizeOllamaBaseUrl(ollamaBaseUrl)}/api/generate`;
  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ollamaApiKey ? { Authorization: `Bearer ${ollamaApiKey}` } : {})
      },
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.1
        }
      })
    });
  } catch {
    throw new Error(
      `Unable to reach Ollama at ${endpoint}. Start Ollama and verify the base URL, model, and browser access.`
    );
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const payload = (await response.json()) as { error?: string };
      errorDetail = sanitizeText(payload.error);
    } catch {
      errorDetail = '';
    }

    throw new Error(
      errorDetail
        ? `Ollama request failed: ${errorDetail}`
        : `Ollama request failed: ${response.status} ${response.statusText}`
    );
  }

  const payload = (await response.json()) as { response?: string };
  const content = sanitizeText(payload.response);
  if (!content) {
    throw new Error('Ollama returned an empty response.');
  }

  return content;
};

const canUseBrowserOllamaFallback = () => (!hasSupabaseEnv && Boolean(ollamaBaseUrl && ollamaModel)) || hasExplicitBrowserOllamaConfig;
const canUseLocalDevTranslateProxy = () => import.meta.env.DEV;
const getErrorStatus = (error: unknown) =>
  typeof (error as { status?: unknown })?.status === 'number'
    ? (error as { status?: number }).status
    : undefined;

const shouldFallbackToBrowserOllama = (status?: number) =>
  canUseBrowserOllamaFallback() && (status == null || status === 404 || status >= 500);

export const canTranslateCmsContent = hasSupabaseEnv || canUseLocalDevTranslateProxy() || canUseBrowserOllamaFallback();

export const translateNewsToChinese = async (source: {
  title: string;
  excerpt: string;
  content: string[];
}): Promise<NewsTranslation> => {
  let translated: NewsTranslation | undefined;
  const translateInBrowser = async () => sanitizeNewsTranslation(extractJson(await translateWithOllama(buildNewsPrompt(source))));

  if (canUseLocalDevTranslateProxy()) {
    try {
      translated = sanitizeNewsTranslation(await invokeLocalDevTranslateProxy<NewsTranslation>('news', source));
    } catch (devError) {
      if (!hasSupabaseEnv) {
        if (!shouldFallbackToBrowserOllama(getErrorStatus(devError))) {
          throw devError;
        }

        translated = await translateInBrowser();
      }
    }
  }

  if (!translated && hasSupabaseEnv) {
    try {
      translated = sanitizeNewsTranslation(await invokeCmsTranslateFunction<NewsTranslation>('news', source));
    } catch (error) {
      if (!shouldFallbackToBrowserOllama(getErrorStatus(error))) {
        throw error;
      }

      translated = await translateInBrowser();
    }
  }

  if (!translated) {
    translated = await translateInBrowser();
  }

  if (!translated.title && !translated.excerpt && (!translated.content || translated.content.length === 0)) {
    throw new Error('The translation model returned no usable Chinese content.');
  }

  return translated;
};

export const translateProductToChinese = async (source: {
  name: string;
  subCategory: string;
  shortDescription: string;
  description: string;
  specifications: Record<string, string>;
}): Promise<ProductTranslation> => {
  let translated: ProductTranslation | undefined;
  const translateInBrowser = async () =>
    sanitizeProductTranslation(extractJson(await translateWithOllama(buildProductPrompt(source))));

  if (canUseLocalDevTranslateProxy()) {
    try {
      translated = sanitizeProductTranslation(await invokeLocalDevTranslateProxy<ProductTranslation>('product', source));
    } catch (devError) {
      if (!hasSupabaseEnv) {
        if (!shouldFallbackToBrowserOllama(getErrorStatus(devError))) {
          throw devError;
        }

        translated = await translateInBrowser();
      }
    }
  }

  if (!translated && hasSupabaseEnv) {
    try {
      translated = sanitizeProductTranslation(await invokeCmsTranslateFunction<ProductTranslation>('product', source));
    } catch (error) {
      if (!shouldFallbackToBrowserOllama(getErrorStatus(error))) {
        throw error;
      }

      translated = await translateInBrowser();
    }
  }

  if (!translated) {
    translated = await translateInBrowser();
  }

  if (
    !translated.name &&
    !translated.subCategory &&
    !translated.shortDescription &&
    !translated.description &&
    !translated.specifications
  ) {
    throw new Error('The translation model returned no usable Chinese content.');
  }

  return translated;
};
