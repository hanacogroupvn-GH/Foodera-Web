import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const DEFAULT_OLLAMA_MODEL = 'qwen2.5:7b';

const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim() || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')?.trim() || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim() || '';
const ollamaBaseUrl = Deno.env.get('OLLAMA_BASE_URL')?.trim() || '';
const ollamaModel = Deno.env.get('OLLAMA_MODEL')?.trim() || DEFAULT_OLLAMA_MODEL;
const ollamaApiKey = Deno.env.get('OLLAMA_API_KEY')?.trim();

type NewsTranslation = {
  title?: string;
  excerpt?: string;
  content?: string[];
};

type ProductTranslation = {
  name?: string;
  subCategory?: string;
  shortDescription?: string;
  description?: string;
  specifications?: Record<string, string>;
};

type NewsSource = {
  title: string;
  excerpt: string;
  content: string[];
};

type ProductSource = {
  name: string;
  subCategory: string;
  shortDescription: string;
  description: string;
  specifications: Record<string, string>;
};

type TranslationRequestBody =
  | {
      kind: 'news';
      source: NewsSource;
    }
  | {
      kind: 'product';
      source: ProductSource;
    };

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders
  });

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

const buildNewsPrompt = (source: NewsSource) => `
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

const buildProductPrompt = (source: ProductSource) => `
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
    throw new Error(`Unable to reach Ollama at ${endpoint}.`);
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

const translateNewsToChinese = async (source: NewsSource): Promise<NewsTranslation> => {
  const parsed = extractJson(await translateWithOllama(buildNewsPrompt(source)));
  const translated = sanitizeNewsTranslation(parsed);

  if (!translated.title && !translated.excerpt && (!translated.content || translated.content.length === 0)) {
    throw new Error('The translation model returned no usable Chinese content.');
  }

  return translated;
};

const translateProductToChinese = async (source: ProductSource): Promise<ProductTranslation> => {
  const parsed = extractJson(await translateWithOllama(buildProductPrompt(source)));
  const translated = sanitizeProductTranslation(parsed);

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

const parseRequestBody = (raw: unknown): TranslationRequestBody => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid translation request body.');
  }

  const record = raw as Record<string, unknown>;
  if (record.kind === 'news') {
    return {
      kind: 'news',
      source: {
        title: sanitizeText((record.source as Record<string, unknown> | undefined)?.title),
        excerpt: sanitizeText((record.source as Record<string, unknown> | undefined)?.excerpt),
        content: sanitizeTextArray((record.source as Record<string, unknown> | undefined)?.content)
      }
    };
  }

  if (record.kind === 'product') {
    return {
      kind: 'product',
      source: {
        name: sanitizeText((record.source as Record<string, unknown> | undefined)?.name),
        subCategory: sanitizeText((record.source as Record<string, unknown> | undefined)?.subCategory),
        shortDescription: sanitizeText((record.source as Record<string, unknown> | undefined)?.shortDescription),
        description: sanitizeText((record.source as Record<string, unknown> | undefined)?.description),
        specifications: sanitizeStringRecord((record.source as Record<string, unknown> | undefined)?.specifications) || {}
      }
    };
  }

  throw new Error('Unsupported translation request kind.');
};

const requireEnv = () => {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error('Supabase function secrets are missing.');
  }
  if (!ollamaBaseUrl || !ollamaModel) {
    throw new Error('Ollama function secrets are missing.');
  }
};

const getAdminUserId = async (authHeader: string) => {
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader
      }
    }
  });

  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser();

  if (userError || !user) {
    throw new Error('Invalid or expired session.');
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: adminRow, error: adminError } = await adminClient
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (adminError) {
    throw new Error('Failed to verify admin access.');
  }

  if (!adminRow) {
    throw new Error('This account is not allowed to use CMS translation.');
  }

  return user.id;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    requireEnv();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse(401, { error: 'Missing Authorization header.' });
    }

    await getAdminUserId(authHeader);

    const body = parseRequestBody(await request.json());
    const translation =
      body.kind === 'news'
        ? await translateNewsToChinese(body.source)
        : await translateProductToChinese(body.source);

    return jsonResponse(200, {
      provider: 'ollama-edge-function',
      translation
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown translation error.';
    const status =
      /Authorization|session/i.test(message) ? 401 :
      /allowed to use CMS translation|admin/i.test(message) ? 403 :
      /request body|Unsupported translation request kind/i.test(message) ? 400 :
      500;

    return jsonResponse(status, { error: message });
  }
});
