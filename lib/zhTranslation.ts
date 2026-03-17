import { NewsTranslation, ProductTranslation } from '../types';
import { hasSupabaseEnv, supabase } from './supabaseClient';

const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
const DEFAULT_OLLAMA_MODEL = 'qwen2.5:7b';
const CMS_TRANSLATE_FUNCTION = 'cms-translate-zh';

const ollamaBaseUrl = import.meta.env.VITE_OLLAMA_BASE_URL?.trim() || DEFAULT_OLLAMA_BASE_URL;
const ollamaApiKey = import.meta.env.VITE_OLLAMA_API_KEY?.trim();
const ollamaModel = import.meta.env.VITE_OLLAMA_MODEL?.trim() || DEFAULT_OLLAMA_MODEL;

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

  return normalized;
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

  return normalized;
};

const buildNewsPrompt = (source: { title: string; excerpt: string; content: string[] }) => `
You are translating B2B agri-export editorial content from English to Simplified Chinese.

Rules:
- Return valid JSON only.
- Do not wrap the response in markdown or code fences.
- Do not add new facts or rewrite the structure.
- Preserve dates, product names, grades, numbers, units, and named standards exactly.
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

const invokeCmsTranslateFunction = async <TTranslation>(
  kind: 'news' | 'product',
  source: Record<string, unknown>
) => {
  const { data, error } = await supabase.functions.invoke(CMS_TRANSLATE_FUNCTION, {
    body: {
      kind,
      source
    }
  });

  if (error) {
    throw new Error(error.message || 'Failed to reach the CMS translation service.');
  }

  const translation = (data as { translation?: unknown } | null)?.translation;
  if (!translation || typeof translation !== 'object' || Array.isArray(translation)) {
    throw new Error('The CMS translation service returned an invalid payload.');
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

export const canTranslateCmsContent = hasSupabaseEnv || Boolean(ollamaBaseUrl && ollamaModel);

export const translateNewsToChinese = async (source: {
  title: string;
  excerpt: string;
  content: string[];
}): Promise<NewsTranslation> => {
  const translated = hasSupabaseEnv
    ? sanitizeNewsTranslation(await invokeCmsTranslateFunction<NewsTranslation>('news', source))
    : sanitizeNewsTranslation(extractJson(await translateWithOllama(buildNewsPrompt(source))));

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
  const translated = hasSupabaseEnv
    ? sanitizeProductTranslation(await invokeCmsTranslateFunction<ProductTranslation>('product', source))
    : sanitizeProductTranslation(extractJson(await translateWithOllama(buildProductPrompt(source))));

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
