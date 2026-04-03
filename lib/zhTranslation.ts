import { NewsTranslation, ProductTranslation } from '../types';
import { translateProductFilters } from './filterLocalization';
import { api, ApiError } from './apiClient';
import { preserveVietnamesePlaceNamesDeep } from './preserveVietnamesePlaceNames';

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'qwen2.5:7b';

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
  const packaging = sanitizeStringRecord(record.packaging);
  const payment = sanitizeStringRecord(record.payment);
  const filters = sanitizeStringRecord(record.filters);

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
  if (packaging) {
    normalized.packaging = packaging;
  }
  if (payment) {
    normalized.payment = payment;
  }
  if (filters) {
    normalized.filters = filters;
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
  packaging: Record<string, string>;
  payment: Record<string, string>;
  filters: Record<string, string>;
}) => `
You are translating B2B agri-export product catalog content from English to Simplified Chinese.

Rules:
- Return valid JSON only.
- Do not wrap the response in markdown or code fences.
- Do not add new facts.
- Preserve product codes, grades, sizes, percentages, acronyms, units, and numbers exactly.
- Preserve Vietnamese proper nouns and Vietnam location names exactly in Latin script. Never translate them into Chinese characters.
- Translate specification keys into natural Simplified Chinese.
- Keep specification, packaging, payment, and filter values faithful to the source.
- If any source text is already Chinese, keep it as-is.

Target JSON schema:
{
  "name": "string",
  "subCategory": "string",
  "shortDescription": "string",
  "description": "string",
  "specifications": {
    "translated key": "translated or preserved value"
  },
  "packaging": {
    "translated key": "translated or preserved value"
  },
  "payment": {
    "translated key": "translated or preserved value"
  },
  "filters": {
    "same filter key": "translated or preserved value"
  }
}

Fields to translate:
${JSON.stringify(source, null, 2)}
`;

const normalizeOllamaBaseUrl = (baseUrl: string) => baseUrl.replace(/\/$/, '').replace(/\/api$/, '');

const createCmsTranslateError = (message: string, status?: number): CmsTranslateError =>
  Object.assign(new Error(message), status ? { status } : {});

const invokeApiTranslate = async <TTranslation>(prompt: string) => {
  try {
    const { translation } = await api.translateCmsPrompt(prompt);

    if (!translation || typeof translation !== 'object' || Array.isArray(translation)) {
      throw new Error('The CMS translation service returned an invalid payload.');
    }

    return translation as TTranslation;
  } catch (error) {
    if (error instanceof ApiError) {
      throw createCmsTranslateError(error.message, error.status);
    }

    throw error;
  }
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

const canUseBrowserOllamaFallback = () => Boolean(ollamaBaseUrl && ollamaModel) || hasExplicitBrowserOllamaConfig;
const getErrorStatus = (error: unknown) =>
  typeof (error as { status?: unknown })?.status === 'number'
    ? (error as { status?: number }).status
    : undefined;

const shouldFallbackToBrowserOllama = (status?: number) =>
  canUseBrowserOllamaFallback() && (status == null || status === 404 || status >= 500);

export const canTranslateCmsContent = true;

export const translateNewsToChinese = async (source: {
  title: string;
  excerpt: string;
  content: string[];
}): Promise<NewsTranslation> => {
  let translated: NewsTranslation | undefined;
  const prompt = buildNewsPrompt(source);
  const translateInBrowser = async () => sanitizeNewsTranslation(extractJson(await translateWithOllama(prompt)));

  try {
    translated = sanitizeNewsTranslation(await invokeApiTranslate<NewsTranslation>(prompt));
  } catch (error) {
    if (!shouldFallbackToBrowserOllama(getErrorStatus(error))) {
      throw error;
    }

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
  packaging: Record<string, string>;
  payment: Record<string, string>;
  filters: Record<string, string>;
}): Promise<ProductTranslation> => {
  let translated: ProductTranslation | undefined;
  const prompt = buildProductPrompt(source);
  const translateInBrowser = async () => sanitizeProductTranslation(extractJson(await translateWithOllama(prompt)));

  try {
    translated = sanitizeProductTranslation(await invokeApiTranslate<ProductTranslation>(prompt));
  } catch (error) {
    if (!shouldFallbackToBrowserOllama(getErrorStatus(error))) {
      throw error;
    }

    translated = await translateInBrowser();
  }

  if (
    !translated.name &&
    !translated.subCategory &&
    !translated.shortDescription &&
    !translated.description &&
    !translated.specifications &&
    !translated.packaging &&
    !translated.payment &&
    !translated.filters
  ) {
    throw new Error('The translation model returned no usable Chinese content.');
  }

  translated.filters = translateProductFilters(source.filters, 'zh', translated.filters) || translated.filters;

  return translated;
};
