import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_PROVIDER = 'auto';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_OPENAI_MODEL = 'gpt-5-mini';
const DEFAULT_SQL_OUTPUT = path.join('supabase', 'generated', 'backfill_zh_translations.generated.sql');
const DEFAULT_CACHE_OUTPUT = path.join('supabase', 'generated', 'backfill_zh_cache.json');
const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const PAGE_SIZE = 200;
const PRODUCT_TEXT_FIELDS = ['name', 'subCategory', 'shortDescription', 'description'];
const NEWS_TEXT_FIELDS = ['title', 'excerpt'];
const OLLAMA_MODEL_PREFERENCES = ['qwen3.5', 'qwen3', 'glm-4.6', 'deepseek-v3.1', 'qwen2.5', 'qwen2.5:7b', 'qwen2.5:7b-instruct', 'qwen2.5:14b', 'llama3.1', 'gemma3', 'gpt-oss'];
const OPENAI_PRODUCT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    subCategory: { type: 'string' },
    shortDescription: { type: 'string' },
    description: { type: 'string' },
    specifications: {
      type: 'object',
      additionalProperties: { type: 'string' }
    }
  }
};
const OPENAI_NEWS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    excerpt: { type: 'string' },
    content: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

const readTextFileIfExists = async (filePath) => {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
};

const loadLocalEnv = async () => {
  for (const fileName of ['.env.local', '.env']) {
    const contents = await readTextFileIfExists(path.resolve(process.cwd(), fileName));
    if (!contents) continue;

    contents.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex < 0) return;

      const key = trimmed.slice(0, separatorIndex).trim();
      if (!key || process.env[key]) return;

      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    });
  }
};

const readEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return '';
};

const printHelp = () => {
  console.log(`
Foodmax zh translation backfill

Usage:
  node scripts/backfill-zh-translations-cli.mjs [options]

Options:
  --provider <auto|gemini|ollama|openai>  Translation provider. Default: AI_PROVIDER or ${DEFAULT_PROVIDER}
  --table <products|news|all>             Choose which table to process. Default: all
  --write <sql|supabase>                  Output SQL file or write directly to Supabase. Default: sql
  --output <path>                         SQL output path when --write sql is used.
  --model <name>                          Generic model override for the selected provider(s).
  --base-url <url>                        Override provider base URL for ollama/openai.
  --cache-file <path>                     Translation cache path. Default: ${DEFAULT_CACHE_OUTPUT}
  --no-cache                              Disable translation cache.
  --limit <number>                        Process only the first N records needing translation.
  --overwrite                             Regenerate zh fields even when translations.zh already exists.
  --dry-run                               Show what would be translated without writing SQL or DB changes.
  --help                                  Show this help message.

Environment:
  VITE_SUPABASE_URL                       Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY               Recommended for direct database writes
  VITE_SUPABASE_ANON_KEY                  Read fallback if service role key is not available
  AI_PROVIDER                             auto, gemini, ollama, or openai
  AI_MODEL                                Generic model override for any provider
  GEMINI_MODEL                            Gemini-specific model override
  OLLAMA_MODEL                            Ollama-specific model override
  OPENAI_MODEL                            OpenAI GPT model override
  GEMINI_API_KEY                          Preferred Gemini key
  GOOGLE_API_KEY                          Alternate Gemini key name
  VITE_GEMINI_API_KEY                     Frontend Gemini key fallback
  OLLAMA_BASE_URL                         Default: ${DEFAULT_OLLAMA_BASE_URL}
  OPENAI_BASE_URL                         Default: ${DEFAULT_OPENAI_BASE_URL}
  OPENAI_API_KEY                          Key for OpenAI Responses API
`);
};

const parseArgs = (argv) => {
  const options = {
    provider: readEnv('AI_PROVIDER') || DEFAULT_PROVIDER,
    table: 'all',
    write: 'sql',
    output: DEFAULT_SQL_OUTPUT,
    model: readEnv('AI_MODEL'),
    baseUrl: '',
    cacheFile: DEFAULT_CACHE_OUTPUT,
    useCache: true,
    limit: undefined,
    overwrite: false,
    dryRun: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--overwrite') {
      options.overwrite = true;
      continue;
    }
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--no-cache') {
      options.useCache = false;
      continue;
    }
    if (arg === '--provider') {
      options.provider = String(argv[index + 1] || '').trim().toLowerCase();
      index += 1;
      continue;
    }
    if (arg === '--table') {
      options.table = String(argv[index + 1] || '').trim().toLowerCase();
      index += 1;
      continue;
    }
    if (arg === '--write') {
      options.write = String(argv[index + 1] || '').trim().toLowerCase();
      index += 1;
      continue;
    }
    if (arg === '--output') {
      options.output = String(argv[index + 1] || '').trim();
      index += 1;
      continue;
    }
    if (arg === '--model') {
      options.model = String(argv[index + 1] || '').trim();
      index += 1;
      continue;
    }
    if (arg === '--base-url') {
      options.baseUrl = String(argv[index + 1] || '').trim();
      index += 1;
      continue;
    }
    if (arg === '--cache-file') {
      options.cacheFile = String(argv[index + 1] || '').trim();
      index += 1;
      continue;
    }
    if (arg === '--limit') {
      const parsed = Number(argv[index + 1]);
      options.limit = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!['auto', 'gemini', 'ollama', 'openai'].includes(options.provider)) {
    throw new Error(`Invalid --provider value: ${options.provider}`);
  }
  if (!['products', 'news', 'all'].includes(options.table)) {
    throw new Error(`Invalid --table value: ${options.table}`);
  }
  if (!['sql', 'supabase'].includes(options.write)) {
    throw new Error(`Invalid --write value: ${options.write}`);
  }

  return options;
};

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const sanitizeText = (value) => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  return '';
};

const hasText = (value) => sanitizeText(value).length > 0;

const sanitizeTextArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => sanitizeText(entry)).filter(Boolean);
};

const sanitizeStringRecord = (value) => {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const entries = Object.entries(value)
    .map(([key, recordValue]) => [sanitizeText(key), sanitizeText(recordValue)])
    .filter(([key, recordValue]) => key && recordValue);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const normalizeTranslationsContainer = (value) => (isPlainObject(value) ? { ...value } : {});

const normalizeProductZh = (value) => {
  if (!isPlainObject(value)) {
    return {};
  }

  const normalized = {};
  PRODUCT_TEXT_FIELDS.forEach((field) => {
    const text = sanitizeText(value[field]);
    if (text) {
      normalized[field] = text;
    }
  });

  const specifications = sanitizeStringRecord(value.specifications);
  if (specifications) {
    normalized.specifications = specifications;
  }

  return normalized;
};

const normalizeNewsZh = (value) => {
  if (!isPlainObject(value)) {
    return {};
  }

  const normalized = {};
  NEWS_TEXT_FIELDS.forEach((field) => {
    const text = sanitizeText(value[field]);
    if (text) {
      normalized[field] = text;
    }
  });

  const content = sanitizeTextArray(value.content);
  if (content.length > 0) {
    normalized.content = content;
  }

  return normalized;
};

const getMissingProductSource = (row, overwrite) => {
  const existingZh = normalizeProductZh(row?.translations?.zh);
  const source = {};

  PRODUCT_TEXT_FIELDS.forEach((field) => {
    const englishValue = sanitizeText(row[field]);
    if (!englishValue) return;
    if (!overwrite && hasText(existingZh[field])) return;
    source[field] = englishValue;
  });

  const specifications = sanitizeStringRecord(row.specifications);
  if (specifications && (overwrite || !sanitizeStringRecord(existingZh.specifications))) {
    source.specifications = specifications;
  }

  return Object.keys(source).length > 0 ? source : null;
};

const getMissingNewsSource = (row, overwrite) => {
  const existingZh = normalizeNewsZh(row?.translations?.zh);
  const source = {};

  NEWS_TEXT_FIELDS.forEach((field) => {
    const englishValue = sanitizeText(row[field]);
    if (!englishValue) return;
    if (!overwrite && hasText(existingZh[field])) return;
    source[field] = englishValue;
  });

  const content = sanitizeTextArray(row.content);
  if (content.length > 0 && (overwrite || sanitizeTextArray(existingZh.content).length === 0)) {
    source.content = content;
  }

  return Object.keys(source).length > 0 ? source : null;
};

const sanitizeProductTranslation = (value) => {
  if (!isPlainObject(value)) {
    return {};
  }

  const normalized = {};
  PRODUCT_TEXT_FIELDS.forEach((field) => {
    const text = sanitizeText(value[field]);
    if (text) {
      normalized[field] = text;
    }
  });

  const specifications = sanitizeStringRecord(value.specifications);
  if (specifications) {
    normalized.specifications = specifications;
  }

  return normalized;
};

const sanitizeNewsTranslation = (value) => {
  if (!isPlainObject(value)) {
    return {};
  }

  const normalized = {};
  NEWS_TEXT_FIELDS.forEach((field) => {
    const text = sanitizeText(value[field]);
    if (text) {
      normalized[field] = text;
    }
  });

  const content = sanitizeTextArray(value.content);
  if (content.length > 0) {
    normalized.content = content;
  }

  return normalized;
};

const mergeProductZh = (existingZh, generatedZh) => {
  const merged = {};

  PRODUCT_TEXT_FIELDS.forEach((field) => {
    const text = sanitizeText(existingZh[field]) || sanitizeText(generatedZh[field]);
    if (text) {
      merged[field] = text;
    }
  });

  const existingSpecifications = sanitizeStringRecord(existingZh.specifications);
  const generatedSpecifications = sanitizeStringRecord(generatedZh.specifications);
  if (existingSpecifications || generatedSpecifications) {
    merged.specifications = existingSpecifications || generatedSpecifications;
  }

  return merged;
};

const mergeNewsZh = (existingZh, generatedZh) => {
  const merged = {};

  NEWS_TEXT_FIELDS.forEach((field) => {
    const text = sanitizeText(existingZh[field]) || sanitizeText(generatedZh[field]);
    if (text) {
      merged[field] = text;
    }
  });

  const existingContent = sanitizeTextArray(existingZh.content);
  const generatedContent = sanitizeTextArray(generatedZh.content);
  if (existingContent.length > 0 || generatedContent.length > 0) {
    merged.content = existingContent.length > 0 ? existingContent : generatedContent;
  }

  return merged;
};

const buildProductPrompt = (row, source) => `
You are translating B2B agri-export catalog data from English to Simplified Chinese.

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

Context:
${JSON.stringify({ id: row.id, category: row.category }, null, 2)}

Fields to translate:
${JSON.stringify(source, null, 2)}
`;

const buildNewsPrompt = (row, source) => `
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

Context:
${JSON.stringify({ id: row.id, slug: row.slug, category: row.category, date: row.date }, null, 2)}

Fields to translate:
${JSON.stringify(source, null, 2)}
`;

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const extractJson = (text) => {
  const trimmed = sanitizeText(text);
  if (!trimmed) {
    throw new Error('The model returned an empty response.');
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
    throw new Error('Model response was not valid JSON.');
  }
};

const throwIfHttpError = async (response) => {
  if (response.ok) {
    return;
  }

  const body = await response.text();
  throw new Error(`${response.status} ${response.statusText}: ${body}`);
};

const fetchJsonWithTimeout = async (url, init = {}, timeoutMs = 2500) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    await throwIfHttpError(response);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const extractResponseOutputText = (payload) => {
  const directText = sanitizeText(payload?.output_text);
  if (directText) {
    return directText;
  }

  if (!Array.isArray(payload?.output)) {
    return '';
  }

  const chunks = [];
  payload.output.forEach((item) => {
    if (!Array.isArray(item?.content)) {
      return;
    }

    item.content.forEach((content) => {
      const text = sanitizeText(content?.text || content?.output_text);
      if (text) {
        chunks.push(text);
      }
    });
  });

  return chunks.join('\n').trim();
};

const normalizeOllamaBaseUrl = (baseUrl) => baseUrl.replace(/\/$/, '').replace(/\/api$/, '');

const getOllamaHeaders = () => {
  const apiKey = readEnv('OLLAMA_API_KEY');
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
};

const discoverOllamaModels = async (baseUrl) => {
  try {
    const payload = await fetchJsonWithTimeout(`${baseUrl.replace(/\/$/, '')}/api/tags`);
    const models = Array.isArray(payload?.models)
      ? payload.models.map((model) => sanitizeText(model?.name)).filter(Boolean)
      : [];

    return {
      reachable: true,
      models
    };
  } catch {
    return {
      reachable: false,
      models: []
    };
  }
};

const choosePreferredOllamaModel = (models) => {
  if (!Array.isArray(models) || models.length === 0) {
    return '';
  }

  for (const preferred of OLLAMA_MODEL_PREFERENCES) {
    const match = models.find((model) => model.toLowerCase().includes(preferred.toLowerCase()));
    if (match) {
      return match;
    }
  }

  return models[0] || '';
};

const getProviderSpecificModel = (provider, options, discoveredOllamaModels) => {
  if (options.model) {
    return options.model;
  }
  if (provider === 'gemini') {
    return readEnv('AI_MODEL', 'GEMINI_MODEL') || DEFAULT_GEMINI_MODEL;
  }
  if (provider === 'ollama') {
    return readEnv('AI_MODEL', 'OLLAMA_MODEL') || choosePreferredOllamaModel(discoveredOllamaModels);
  }
  return readEnv('AI_MODEL', 'OPENAI_MODEL') || DEFAULT_OPENAI_MODEL;
};

const getProviderBaseUrl = (provider, options) => {
  if (provider === 'ollama') {
    return options.baseUrl || readEnv('OLLAMA_BASE_URL') || (readEnv('OLLAMA_API_KEY') ? 'https://ollama.com' : DEFAULT_OLLAMA_BASE_URL);
  }
  if (provider === 'openai') {
    return options.baseUrl || readEnv('OPENAI_BASE_URL') || DEFAULT_OPENAI_BASE_URL;
  }
  return '';
};

const resolveProviderPlan = async (options) => {
  const plan = [];
  const requestedProviders = options.provider === 'auto'
    ? ['ollama', 'openai', 'gemini']
    : [options.provider];

  const ollamaBaseUrl = getProviderBaseUrl('ollama', options);
  const ollamaDiscovery = requestedProviders.includes('ollama')
    ? await discoverOllamaModels(ollamaBaseUrl)
    : { reachable: false, models: [] };

  for (const provider of requestedProviders) {
    if (provider === 'ollama') {
      if (!ollamaDiscovery.reachable) {
        continue;
      }

      const model = getProviderSpecificModel('ollama', options, ollamaDiscovery.models);
      if (!model) {
        continue;
      }

      plan.push({
        provider: 'ollama',
        model,
        baseUrl: ollamaBaseUrl
      });
      continue;
    }

    if (provider === 'openai') {
      if (!readEnv('OPENAI_API_KEY', 'AI_API_KEY')) {
        continue;
      }

      const model = getProviderSpecificModel('openai', options, []);
      if (!model) {
        continue;
      }

      plan.push({
        provider: 'openai',
        model,
        baseUrl: getProviderBaseUrl('openai', options)
      });
      continue;
    }

    if (!readEnv('GEMINI_API_KEY', 'GOOGLE_API_KEY', 'VITE_GEMINI_API_KEY')) {
      continue;
    }

    plan.push({
      provider: 'gemini',
      model: getProviderSpecificModel('gemini', options, []),
      baseUrl: ''
    });
  }

  if (plan.length === 0) {
    throw new Error('No usable AI provider found. Install Ollama or configure OPENAI_API_KEY / GEMINI_API_KEY.');
  }

  return plan;
};

const getRetryDelayMs = (error, attempt) => {
  const message = sanitizeText(error?.message || error);
  if (/insufficient_quota/i.test(message)) {
    return 0;
  }
  if (/429|RESOURCE_EXHAUSTED|rate limit|quota/i.test(message)) {
    return 2000 * 2 ** (attempt - 1);
  }
  if (/5\d\d|fetch failed|timeout|ECONNRESET|network/i.test(message)) {
    return 1000 * attempt;
  }
  return 500;
};

const shouldRetryError = (error) => {
  const message = sanitizeText(error?.message || error);
  if (/insufficient_quota/i.test(message)) {
    return false;
  }
  return /429|RESOURCE_EXHAUSTED|rate limit|quota|5\d\d|fetch failed|timeout|ECONNRESET|network/i.test(message);
};

const loadCache = async (cacheFile) => {
  const raw = await readTextFileIfExists(path.resolve(process.cwd(), cacheFile));
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return isPlainObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const persistCache = async (cacheFile, cache) => {
  const absolutePath = path.resolve(process.cwd(), cacheFile);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, JSON.stringify(cache, null, 2), 'utf8');
};

const buildCacheKey = (provider, model, prompt) =>
  crypto.createHash('sha256').update(`${provider}\n${model}\n${prompt}`).digest('hex');

const translateWithGemini = async ({ model, prompt }) => {
  const apiKey = readEnv('GEMINI_API_KEY', 'GOOGLE_API_KEY', 'VITE_GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Set GEMINI_API_KEY, GOOGLE_API_KEY, or VITE_GEMINI_API_KEY.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.1
    }
  });

  return response.text || '';
};

const translateWithOllama = async ({ model, prompt, baseUrl }) => {
  const endpoint = `${normalizeOllamaBaseUrl(baseUrl)}/api/generate`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getOllamaHeaders()
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.1
      }
    })
  });

  await throwIfHttpError(response);
  const payload = await response.json();
  return payload.response || '';
};

const translateWithOpenAI = async ({ model, prompt, baseUrl, schemaName, schema }) => {
  const apiKey = readEnv('OPENAI_API_KEY', 'AI_API_KEY');
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY or AI_API_KEY for the openai provider.');
  }

  const endpoint = `${baseUrl.replace(/\/$/, '')}/responses`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      store: false,
      instructions: 'Return only a valid JSON object that satisfies the provided schema. Do not use markdown fences.',
      input: prompt,
      text: {
        format: {
          type: 'json_schema',
          name: schemaName,
          schema,
          strict: false
        }
      }
    })
  });

  await throwIfHttpError(response);
  const payload = await response.json();
  return extractResponseOutputText(payload);
};

const runProviderRequest = async (config, request) => {
  if (config.provider === 'gemini') {
    return translateWithGemini({ model: config.model, prompt: request.prompt });
  }
  if (config.provider === 'ollama') {
    return translateWithOllama({ model: config.model, prompt: request.prompt, baseUrl: config.baseUrl });
  }
  return translateWithOpenAI({
    model: config.model,
    prompt: request.prompt,
    baseUrl: config.baseUrl,
    schemaName: request.schemaName,
    schema: request.schema
  });
};

const translateWithProviderPlan = async ({ providerPlan, prompt, schemaName, schema, label, sanitizer, cache, cacheFile, useCache }) => {
  const providerErrors = [];

  for (const config of providerPlan) {
    const cacheKey = buildCacheKey(config.provider, config.model, `${schemaName || ''}\n${prompt}`);

    if (useCache && cache[cacheKey]?.result) {
      const cached = sanitizer(cache[cacheKey].result);
      if (Object.keys(cached).length > 0) {
        console.log(`Using cached translation for ${label} via ${config.provider}/${config.model}`);
        return cached;
      }
    }

    let lastError = null;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const text = await runProviderRequest(config, { prompt, schemaName, schema });
        const parsed = extractJson(text);
        const sanitized = sanitizer(parsed);

        if (useCache) {
          cache[cacheKey] = {
            provider: config.provider,
            model: config.model,
            updatedAt: new Date().toISOString(),
            result: sanitized
          };
          await persistCache(cacheFile, cache);
        }

        return sanitized;
      } catch (error) {
        lastError = error;
        const retryable = shouldRetryError(error);
        const suffix = attempt < 3 && retryable ? ` Retrying ${label}...` : '';
        console.warn(`Failed ${label} via ${config.provider}/${config.model} on attempt ${attempt}: ${error.message}.${suffix}`);

        if (!retryable || attempt === 3) {
          break;
        }

        await sleep(getRetryDelayMs(error, attempt));
      }
    }

    providerErrors.push(`${config.provider}/${config.model}: ${lastError?.message || 'Unknown error'}`);
  }

  throw new Error(providerErrors.join(' | '));
};

const fetchAllRows = async (supabase, table, orderColumn, ascending) => {
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderColumn, { ascending })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to load ${table}: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    rows.push(...data);

    if (data.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return rows;
};

const sqlQuote = (value) => String(value).replace(/'/g, "''");

const buildSql = (updates) => {
  const lines = [
    '-- Auto-generated zh translation backfill.',
    `-- Generated at ${new Date().toISOString()}.`,
    'begin;'
  ];

  updates.forEach((update) => {
    const patchJson = sqlQuote(JSON.stringify({ zh: update.zh }));
    const id = sqlQuote(update.id);
    lines.push('');
    lines.push(`update public.${update.table}`);
    lines.push(`set translations = coalesce(translations, '{}'::jsonb) || '${patchJson}'::jsonb`);
    lines.push(`where id = '${id}';`);
  });

  lines.push('');
  lines.push('commit;');
  lines.push('');

  return lines.join('\n');
};

const writeSqlFile = async (outputPath, sql) => {
  const absolutePath = path.resolve(process.cwd(), outputPath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, sql, 'utf8');
  return absolutePath;
};

const createWorkItems = (rows, table, overwrite) => {
  const items = [];

  rows.forEach((row) => {
    const source = table === 'products'
      ? getMissingProductSource(row, overwrite)
      : getMissingNewsSource(row, overwrite);

    if (!source) {
      return;
    }

    items.push({
      table,
      row,
      source,
      existingZh: table === 'products'
        ? normalizeProductZh(row?.translations?.zh)
        : normalizeNewsZh(row?.translations?.zh)
    });
  });

  return items;
};

const summarizeCounts = (items) => {
  const counts = { products: 0, news: 0 };
  items.forEach((item) => {
    counts[item.table] += 1;
  });
  return counts;
};

const applyUpdatesToSupabase = async (supabase, updates) => {
  for (const update of updates) {
    const { error } = await supabase
      .from(update.table)
      .update({ translations: update.fullTranslations })
      .eq('id', update.id);

    if (error) {
      throw new Error(`Failed to update ${update.table}:${update.id}: ${error.message}`);
    }
  }
};

const main = async () => {
  await loadLocalEnv();
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const supabaseUrl = readEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const supabaseKey = readEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_KEY', 'VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY.');
  }

  if (options.write === 'supabase' && !readEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_KEY')) {
    console.warn('Direct Supabase writes are safest with SUPABASE_SERVICE_ROLE_KEY. Falling back to anon key may fail because of RLS.');
  }

  const providerPlan = await resolveProviderPlan(options);
  const cache = options.useCache ? await loadCache(options.cacheFile) : {};

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const workItems = [];

  if (options.table === 'products' || options.table === 'all') {
    const rows = await fetchAllRows(supabase, 'products', 'id', true);
    workItems.push(...createWorkItems(rows, 'products', options.overwrite));
  }

  if (options.table === 'news' || options.table === 'all') {
    const rows = await fetchAllRows(supabase, 'news', 'date', false);
    workItems.push(...createWorkItems(rows, 'news', options.overwrite));
  }

  const filteredItems = typeof options.limit === 'number' ? workItems.slice(0, options.limit) : workItems;
  const counts = summarizeCounts(filteredItems);
  console.log(`Records needing zh backfill: ${filteredItems.length} (${counts.products} products, ${counts.news} news).`);

  if (filteredItems.length === 0) {
    console.log('Nothing to translate.');
    return;
  }

  console.log(`Provider plan: ${providerPlan.map((config) => `${config.provider}/${config.model}`).join(' -> ')}`);
  if (options.useCache) {
    console.log(`Cache file: ${path.resolve(process.cwd(), options.cacheFile)}`);
  }

  const updates = [];
  const errors = [];

  for (const [index, item] of filteredItems.entries()) {
    const label = `${item.table}:${item.row.id}`;
    console.log(`[${index + 1}/${filteredItems.length}] Translating ${label}`);

    try {
      const translated = item.table === 'products'
        ? await translateWithProviderPlan({
            providerPlan,
            prompt: buildProductPrompt(item.row, item.source),
            schemaName: 'foodmax_product_translation',
            schema: OPENAI_PRODUCT_SCHEMA,
            sanitizer: sanitizeProductTranslation,
            label,
            cache,
            cacheFile: options.cacheFile,
            useCache: options.useCache
          })
        : await translateWithProviderPlan({
            providerPlan,
            prompt: buildNewsPrompt(item.row, item.source),
            schemaName: 'foodmax_news_translation',
            schema: OPENAI_NEWS_SCHEMA,
            sanitizer: sanitizeNewsTranslation,
            label,
            cache,
            cacheFile: options.cacheFile,
            useCache: options.useCache
          });

      const mergedZh = item.table === 'products'
        ? mergeProductZh(item.existingZh, translated)
        : mergeNewsZh(item.existingZh, translated);

      if (JSON.stringify(mergedZh) === JSON.stringify(item.existingZh)) {
        console.log(`Skipping ${label}: no new zh content returned.`);
        continue;
      }

      const existingTranslations = normalizeTranslationsContainer(item.row.translations);
      updates.push({
        table: item.table,
        id: item.row.id,
        zh: mergedZh,
        fullTranslations: {
          ...existingTranslations,
          zh: mergedZh
        }
      });
    } catch (error) {
      errors.push({ label, message: error.message });
      console.error(`Failed ${label}: ${error.message}`);
    }
  }

  console.log(`Prepared ${updates.length} update(s).`);

  if (errors.length > 0) {
    console.log(`Encountered ${errors.length} translation error(s).`);
    errors.forEach((error) => {
      console.log(`- ${error.label}: ${error.message}`);
    });
  }

  if (options.dryRun) {
    console.log('Dry run complete. No SQL file or database changes were written.');
    if (errors.length > 0) {
      process.exitCode = 1;
    }
    return;
  }

  if (options.write === 'sql') {
    const sql = buildSql(updates);
    const absoluteOutput = await writeSqlFile(options.output, sql);
    console.log(`SQL backfill written to ${absoluteOutput}`);
  } else if (updates.length > 0) {
    await applyUpdatesToSupabase(supabase, updates);
    console.log(`Applied ${updates.length} zh translation update(s) directly to Supabase.`);
  }

  if (errors.length > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});




