import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'qwen2.5:7b';
const DEV_CMS_TRANSLATE_PATH = '/__cms_translate_ollama';

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

const jsonResponse = (res: ServerResponse, status: number, body: Record<string, unknown>) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const readRequestBody = async (req: IncomingMessage) =>
  await new Promise<string>((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });

const translateWithOllama = async (
  prompt: string,
  { baseUrl, model, apiKey }: { baseUrl: string; model: string; apiKey?: string }
) => {
  const endpoint = `${normalizeOllamaBaseUrl(baseUrl)}/api/generate`;
  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
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

const createDevCmsTranslatePlugin = ({
  baseUrl,
  model,
  apiKey
}: {
  baseUrl: string;
  model: string;
  apiKey?: string;
}): Plugin => ({
  name: 'dev-cms-translate-proxy',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const pathname = req.url?.split('?')[0];
      if (pathname !== DEV_CMS_TRANSLATE_PATH) {
        next();
        return;
      }

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      if (req.method !== 'POST') {
        jsonResponse(res, 405, { error: 'Method not allowed.' });
        return;
      }

      try {
        const rawBody = await readRequestBody(req);
        const body = parseRequestBody(rawBody ? JSON.parse(rawBody) : {});
        const translation =
          body.kind === 'news'
            ? sanitizeNewsTranslation(extractJson(await translateWithOllama(buildNewsPrompt(body.source), { baseUrl, model, apiKey })))
            : sanitizeProductTranslation(
                extractJson(await translateWithOllama(buildProductPrompt(body.source), { baseUrl, model, apiKey }))
              );

        if (!Object.keys(translation).length) {
          throw new Error('The translation model returned no usable Chinese content.');
        }

        jsonResponse(res, 200, {
          provider: 'ollama-dev-proxy',
          translation
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown translation error.';
        const status = /request body|Unsupported translation request kind/i.test(message) ? 400 : 502;
        jsonResponse(res, status, { error: message });
      }
    });
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const ollamaBaseUrl = env.OLLAMA_BASE_URL?.trim() || DEFAULT_OLLAMA_BASE_URL;
  const ollamaModel = env.OLLAMA_MODEL?.trim() || DEFAULT_OLLAMA_MODEL;
  const ollamaApiKey = env.OLLAMA_API_KEY?.trim();
  const apiPort = env.PORT?.trim() || '8787';
  const localApiOrigin = `http://localhost:${apiPort}`;

  return {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            // Heavy PDF library — lazy loaded, keep in its own chunk
            if (id.includes('html2pdf') || id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-libs';
            }

            if (id.includes('@google/genai')) {
              return 'genai';
            }

            if (id.includes('lucide-react')) {
              return 'icons';
            }

            // React core — stable, long cache
            if (id.includes('react-dom') || id.includes('react/') || id.includes('react-router')) {
              return 'react-vendor';
            }

            return undefined;
          }
        }
      }
    },
    server: {
      port: 3000,
      host: 'localhost',
      strictPort: true,
      origin: 'http://localhost:3000',
      hmr: {
        host: 'localhost',
        clientPort: 3000,
        protocol: 'ws'
      },
      proxy: {
        '/api': {
          target: localApiOrigin,
          changeOrigin: true
        }
      }
    },
    plugins: [react(), tailwindcss(), createDevCmsTranslatePlugin({ baseUrl: ollamaBaseUrl, model: ollamaModel, apiKey: ollamaApiKey })],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.')
      }
    }
  };
});
