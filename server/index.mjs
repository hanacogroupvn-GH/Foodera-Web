import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

import {
  createDatabaseConnection,
  deleteProvinceMapProfileById,
  deleteNewsById,
  deleteProductById,
  ensureDatabaseSchema,
  findAdminByEmail,
  getContentSnapshot,
  hashPassword,
  importContentSnapshot,
  insertPersonalizationEvent,
  insertContactInquiry,
  insertQuotationRequest,
  listProvinceMapProfiles,
  listPublicNews,
  listProducts,
  updateProductRecord,
  upsertAdminUser,
  upsertProvinceMapProfile,
  upsertNews,
  verifyPassword
} from './db.mjs';
import { loadProjectEnv } from './loadEnv.mjs';
import {
  createNormalizedPersonalizationEvent,
  getRecommendationsForVisitor
} from './personalization.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist');
const publicRoot = path.join(projectRoot, 'public');
const uploadsRoot = path.join(publicRoot, 'uploads', 'cms');
const localSeedContentPath = path.join(projectRoot, 'generated', 'local-seed-content.json');

await loadProjectEnv(projectRoot);

const PORT = Number(process.env.PORT || 8787);
const SESSION_COOKIE = 'foodmax_session';
const VISITOR_COOKIE = 'foodmax_visitor';
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_RFQ_ATTACHMENT_SIZE_BYTES = 15 * 1024 * 1024;
const OLLAMA_DEFAULT_BASE_URL = 'http://localhost:11434';
const OLLAMA_DEFAULT_MODEL = 'qwen2.5:7b';
const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash';
const MAP_AI_SCOPE_VALUES = new Set(['Rice', 'Coffee', 'Cashew', 'Agriculture']);
const PERSONALIZATION_ENTITY_TYPES = new Set(['page', 'category', 'product', 'news', 'quote_request']);
const PERSONALIZATION_ACTIONS = new Set(['view', 'click', 'submit']);

const FILE_EXTENSION_BY_MIME = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/csv': 'csv',
  'text/plain': 'txt'
};

const RFQ_ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const readCookies = (cookieHeader = '') =>
  Object.fromEntries(
    String(cookieHeader)
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separatorIndex = entry.indexOf('=');
        if (separatorIndex === -1) {
          return [entry, ''];
        }

        return [
          decodeURIComponent(entry.slice(0, separatorIndex).trim()),
          decodeURIComponent(entry.slice(separatorIndex + 1).trim())
        ];
      })
  );

const getSessionSecret = () =>
  process.env.SESSION_SECRET?.trim() ||
  process.env.TURSO_AUTH_TOKEN?.trim() ||
  'foodmax-local-session-secret';

const signValue = (value) =>
  crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url');

const createSessionToken = (payload) => {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${signValue(encodedPayload)}`;
};

const readSessionToken = (token) => {
  const [encodedPayload, signature] = String(token ?? '').split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!payload?.email || !payload?.expiresAt || Date.now() > Number(payload.expiresAt)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

const setSessionCookie = (response, email) => {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const token = createSessionToken({
    email: String(email).toLowerCase(),
    expiresAt
  });

  response.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(expiresAt)
  });
};

const clearSessionCookie = (response) => {
  response.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
};

const hashIdentifier = (value) =>
  crypto.createHash('sha256').update(String(value ?? '')).digest('hex');

const normalizeRequestIp = (request) => {
  const forwardedFor = request.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const rawIp =
    String(forwardedValue ?? '')
      .split(',')[0]
      .trim() ||
    String(request.ip ?? '').trim() ||
    String(request.socket?.remoteAddress ?? '').trim() ||
    'unknown';

  return rawIp.replace(/^::ffff:/, '').trim() || 'unknown';
};

const setVisitorCookie = (response, visitorId) => {
  const expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  response.cookie(VISITOR_COOKIE, String(visitorId), {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt
  });
};

const getVisitorContext = (request, response) => {
  const cookies = readCookies(request.headers.cookie);
  const ipHash = hashIdentifier(normalizeRequestIp(request));
  const userAgentHash = hashIdentifier(request.headers['user-agent'] || '');
  let visitorId = String(cookies[VISITOR_COOKIE] ?? '').trim();

  if (!visitorId) {
    visitorId = `v_${hashIdentifier(`${ipHash}:${userAgentHash}`).slice(0, 24)}`;
    setVisitorCookie(response, visitorId);
  }

  return {
    visitorId,
    ipHash,
    userAgentHash
  };
};

const getActiveSnapshot = (snapshot) => ({
  products: Array.isArray(snapshot?.products) ? snapshot.products.filter((item) => item?.isActive !== false) : [],
  news: Array.isArray(snapshot?.news) ? snapshot.news.filter((item) => item?.isActive !== false) : []
});

const getPublicContentSnapshot = async (client) => {
  const [products, news] = await Promise.all([listProducts(client), listPublicNews(client)]);
  return { products, news };
};

const seedLocalDatabaseIfEmpty = async (client) => {
  const snapshot = await getContentSnapshot(client);
  const productCount = Array.isArray(snapshot?.products) ? snapshot.products.length : 0;
  const newsCount = Array.isArray(snapshot?.news) ? snapshot.news.length : 0;

  if (productCount > 0 || newsCount > 0) {
    return false;
  }

  try {
    const rawSeed = await fs.readFile(localSeedContentPath, 'utf8');
    const seedSnapshot = JSON.parse(rawSeed);
    await importContentSnapshot(client, seedSnapshot);
    return true;
  } catch (error) {
    throw new Error(
      `Local database is empty and seed import failed: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  }
};

const slugifyPathSegment = (value, fallback = 'item') =>
  String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;

const sanitizeUploadSegments = (segments = []) => {
  const safeSegments = Array.isArray(segments) ? segments.filter(Boolean) : [];
  return (safeSegments.length > 0 ? safeSegments : ['uploads']).map((segment, index) =>
    slugifyPathSegment(segment, index === 0 ? 'uploads' : 'item')
  );
};

const getFileExtension = (fileName, contentType) => {
  if (contentType && FILE_EXTENSION_BY_MIME[contentType]) {
    return FILE_EXTENSION_BY_MIME[contentType];
  }

  const rawExtension = path.extname(String(fileName ?? '')).replace('.', '').toLowerCase();
  return rawExtension.replace(/[^a-z0-9]/g, '') || 'bin';
};

const parseDataUrl = (value) => {
  const match = String(value ?? '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid file payload.');
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64')
  };
};

const createRfqUploadFolderSegments = () => {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return ['rfq', `${year}-${month}`];
};

const extractPromptTranslation = (text) => {
  const trimmed = String(text ?? '').trim();
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

const extractGroundedSources = (response) => {
  const chunks = Array.isArray(response?.candidates?.[0]?.groundingMetadata?.groundingChunks)
    ? response.candidates[0].groundingMetadata.groundingChunks
    : [];

  const seen = new Set();
  const sources = [];

  for (const chunk of chunks) {
    const title = String(chunk?.web?.title ?? '').trim();
    const uri = String(chunk?.web?.uri ?? '').trim();
    if (!title || !uri || seen.has(uri)) {
      continue;
    }

    seen.add(uri);
    sources.push({ title, uri });
  }

  return sources;
};

const callOllama = async (prompt) => {
  const baseUrl = (process.env.OLLAMA_BASE_URL || OLLAMA_DEFAULT_BASE_URL).replace(/\/$/, '').replace(/\/api$/, '');
  const model = process.env.OLLAMA_MODEL || OLLAMA_DEFAULT_MODEL;
  const apiKey = process.env.OLLAMA_API_KEY?.trim();

  const response = await fetch(`${baseUrl}/api/generate`, {
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

  if (!response.ok) {
    let detail = '';
    try {
      const payload = await response.json();
      detail = String(payload?.error ?? '').trim();
    } catch {
      detail = '';
    }

    throw new Error(detail || `Ollama request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  return extractPromptTranslation(payload?.response);
};

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY or VITE_GEMINI_API_KEY for grounded AI suggestions.');
  }

  const model = process.env.GEMINI_MODEL?.trim() || GEMINI_DEFAULT_MODEL;
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      temperature: 0.1,
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    payload: extractPromptTranslation(response?.text),
    sources: extractGroundedSources(response)
  };
};

const chooseMapAiProvider = () => {
  const preferred = String(process.env.AI_PROVIDER || 'auto').trim().toLowerCase();
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY?.trim() || process.env.VITE_GEMINI_API_KEY?.trim());

  if (preferred === 'gemini') {
    return 'gemini';
  }

  if (preferred === 'ollama') {
    return 'ollama';
  }

  if (preferred === 'auto') {
    return hasGeminiKey ? 'gemini' : 'ollama';
  }

  return hasGeminiKey ? 'gemini' : 'ollama';
};

const callMapProfileAgent = async (prompt) => {
  const provider = chooseMapAiProvider();

  if (provider === 'gemini') {
    try {
      const result = await callGemini(prompt);
      return {
        provider: 'gemini',
        payload: result.payload,
        sources: result.sources
      };
    } catch (error) {
      if (String(process.env.AI_PROVIDER || 'auto').trim().toLowerCase() !== 'auto') {
        throw error;
      }
    }
  }

  return {
    provider: 'ollama',
    payload: await callOllama(prompt),
    sources: []
  };
};

const normalizeMapAiScope = (value) => {
  const trimmed = String(value ?? '').trim();
  return MAP_AI_SCOPE_VALUES.has(trimmed) ? trimmed : 'auto';
};

const buildMapProfileSuggestionPrompt = ({
  provinceId,
  provinceName,
  provinceType,
  regionLabel,
  categoryScope,
  currentProfile,
  otherProfiles,
  scopedProducts
}) => {
  const catalogPayload = scopedProducts.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    subCategory: product.subCategory,
    shortDescription: product.shortDescription,
    description: product.description,
    specifications: product.specifications,
    filters: product.filters
  }));

  const mappedProfileSummary = otherProfiles
    .filter((profile) => profile.provinceId !== provinceId && Array.isArray(profile.products) && profile.products.length > 0)
    .map((profile) => ({
      provinceId: profile.provinceId,
      products: profile.products.map((item) => item.name)
    }));

  return `
You are the Foodmax map-content drafting agent for the CMS.

Return one JSON object only. No markdown. No explanation outside JSON.

Required JSON shape:
{
  "gpsLatitude": number | null,
  "gpsLongitude": number | null,
  "cultivatedAreaHectares": number | null,
  "averageOutputMtPerYear": number | null,
  "sowingPeriod": string,
  "harvestPeriod": string,
  "cropsPerYear": number | null,
  "characteristics": string,
  "varieties": string,
  "products": [
    {
      "name": string,
      "location": string,
      "zoneCount": number
    }
  ]
}

Rules:
- You may only use product names from the provided catalog payload.
- Never invent a new product, variant, or SKU.
- Keep all text in English.
- The GPS values should be province-level coordinates when reasonably available.
- cultivatedAreaHectares and averageOutputMtPerYear must be numeric when you are confident, otherwise return null.
- sowingPeriod and harvestPeriod should be concise ranges or month windows.
- cropsPerYear should be numeric when known, otherwise null.
- characteristics should be a short paragraph or 2 concise sentences.
- varieties should be a concise comma-separated list.
- If a product has no reliable district-level detail, keep the location at province or city level only.
- Prefer products not already mapped to another province, unless the current province profile already uses them.
- If the scope is "auto", choose the strongest province-product fit from the provided catalog and the province context.
- If the scope is a category, stay inside that category only.
- If confidence is low, return fewer products rather than guessing.
- Do not add ratings.

Selected province:
${JSON.stringify({ provinceId, provinceName, provinceType, regionLabel }, null, 2)}

Selected product scope:
${JSON.stringify({ categoryScope }, null, 2)}

Current saved profile for this province:
${JSON.stringify(
    currentProfile
      ? {
          gpsLatitude: currentProfile.gpsLatitude,
          gpsLongitude: currentProfile.gpsLongitude,
          cultivatedAreaHectares: currentProfile.cultivatedAreaHectares,
          averageOutputMtPerYear: currentProfile.averageOutputMtPerYear,
          sowingPeriod: currentProfile.sowingPeriod,
          harvestPeriod: currentProfile.harvestPeriod,
          cropsPerYear: currentProfile.cropsPerYear,
          characteristics: currentProfile.characteristics,
          varieties: currentProfile.varieties,
          products: currentProfile.products
        }
      : null,
    null,
    2
  )}

Products already mapped in other provinces:
${JSON.stringify(mappedProfileSummary, null, 2)}

Allowed catalog products:
${JSON.stringify(catalogPayload, null, 2)}
`.trim();
};

const sanitizeSuggestedMapProfile = ({ provinceId, provinceName, draft, scopedProducts, anchoredProducts = [] }) => {
  const productNameByLower = new Map(
    scopedProducts.map((product) => [String(product.name ?? '').trim().toLowerCase(), String(product.name ?? '').trim()])
  );
  const aiProductsByLower = new Map(
    (Array.isArray(draft?.products) ? draft.products : []).map((item) => [
      String(item?.name ?? '').trim().toLowerCase(),
      item
    ])
  );

  const normalizedProducts = [];
  const safeAnchoredProducts = Array.isArray(anchoredProducts) ? anchoredProducts : [];

  if (safeAnchoredProducts.length > 0) {
    for (const anchoredProduct of safeAnchoredProducts) {
      const normalizedName = String(anchoredProduct?.name ?? '').trim();
      if (!normalizedName) {
        continue;
      }

      const aiOverride = aiProductsByLower.get(normalizedName.toLowerCase());
      normalizedProducts.push({
        name: normalizedName,
        location: String(aiOverride?.location ?? anchoredProduct?.location ?? '').trim() || provinceName,
        zoneCount: Math.max(
          1,
          Math.round(Number(aiOverride?.zoneCount ?? anchoredProduct?.zoneCount ?? 1))
        ) || 1
      });
    }
  } else {
    const seenNames = new Set();

    for (const item of Array.isArray(draft?.products) ? draft.products : []) {
      const requestedName = String(item?.name ?? '').trim().toLowerCase();
      const matchedName = productNameByLower.get(requestedName);

      if (!matchedName || seenNames.has(matchedName)) {
        continue;
      }

      seenNames.add(matchedName);
      normalizedProducts.push({
        name: matchedName,
        location: String(item?.location ?? '').trim() || provinceName,
        zoneCount: Math.max(1, Math.round(Number(item?.zoneCount ?? 1))) || 1
      });
    }
  }

  return {
    provinceId,
    gpsLatitude: Number.isFinite(Number(draft?.gpsLatitude)) ? Number(draft.gpsLatitude) : null,
    gpsLongitude: Number.isFinite(Number(draft?.gpsLongitude)) ? Number(draft.gpsLongitude) : null,
    cultivatedAreaHectares: Number.isFinite(Number(draft?.cultivatedAreaHectares))
      ? Number(draft.cultivatedAreaHectares)
      : null,
    averageOutputMtPerYear: Number.isFinite(Number(draft?.averageOutputMtPerYear))
      ? Number(draft.averageOutputMtPerYear)
      : null,
    sowingPeriod: String(draft?.sowingPeriod ?? '').trim(),
    harvestPeriod: String(draft?.harvestPeriod ?? '').trim(),
    cropsPerYear: Number.isFinite(Number(draft?.cropsPerYear)) ? Number(draft.cropsPerYear) : null,
    characteristics: String(draft?.characteristics ?? '').trim(),
    varieties: String(draft?.varieties ?? '').trim(),
    products: normalizedProducts
  };
};

const ensureBootstrapAdmin = async (client) => {
  const bootstrapEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const bootstrapPassword = process.env.ADMIN_PASSWORD?.trim() || process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();

  if (!bootstrapEmail || !bootstrapPassword) {
    return;
  }

  await upsertAdminUser(client, {
    email: bootstrapEmail,
    passwordHash: hashPassword(bootstrapPassword)
  });
};

const getRequestSession = (request) => {
  const cookies = readCookies(request.headers.cookie);
  return readSessionToken(cookies[SESSION_COOKIE]);
};

const isSerializedBufferLike = (value) =>
  Boolean(value && typeof value === 'object' && value.type === 'Buffer' && Array.isArray(value.data));

const decodeBufferLikeBody = (value) => {
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8');
  }

  if (isSerializedBufferLike(value)) {
    return Buffer.from(value.data).toString('utf8');
  }

  return null;
};

const normalizeServerlessRequestBody = (request, _response, next) => {
  const decodedBody = decodeBufferLikeBody(request.body);
  if (decodedBody === null) {
    next();
    return;
  }

  request.rawBody = request.rawBody || decodedBody;

  const contentType = String(request.headers['content-type'] || '').toLowerCase();

  if (contentType.includes('application/json')) {
    try {
      request.body = JSON.parse(decodedBody);
    } catch {
      request.body = {};
    }
    next();
    return;
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    request.body = Object.fromEntries(new URLSearchParams(decodedBody).entries());
    next();
    return;
  }

  request.body = decodedBody;
  next();
};

const getStringValue = (value) => {
  if (Array.isArray(value)) {
    return getStringValue(value[0]);
  }

  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
};

const parseCredentialPayload = (value) => {
  const decodedBufferBody = decodeBufferLikeBody(value);
  if (decodedBufferBody !== null) {
    return parseCredentialPayload(decodedBufferBody);
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  const raw = getStringValue(value).trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fall through to x-www-form-urlencoded parsing.
  }

  const params = new URLSearchParams(raw);
  if ([...params.keys()].length === 0) {
    return null;
  }

  return Object.fromEntries(params.entries());
};

const getLoginCredentials = (request) => {
  const parsedBody = parseCredentialPayload(request.body) || parseCredentialPayload(request.rawBody);
  const email = getStringValue(parsedBody?.email).trim().toLowerCase();
  const password = getStringValue(parsedBody?.password);

  return {
    email,
    password
  };
};

const getPersonalizedContentForRequest = async (request, response, options = {}) => {
  const visitorContext = request.visitorContext || getVisitorContext(request, response);
  const snapshot = await getContentSnapshot(request.app.locals.db);
  const activeSnapshot = getActiveSnapshot(snapshot);

  return getRecommendationsForVisitor({
    client: request.app.locals.db,
    visitorId: visitorContext.visitorId,
    ipHash: visitorContext.ipHash,
    userAgentHash: visitorContext.userAgentHash,
    products: activeSnapshot.products,
    news: activeSnapshot.news,
    productLimit: Number(options?.productLimit) || 4,
    newsLimit: Number(options?.newsLimit) || 3
  });
};

const requireAdmin = async (request, response, next) => {
  const session = getRequestSession(request);
  if (!session?.email) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const adminUser = await findAdminByEmail(request.app.locals.db, session.email);
  if (!adminUser) {
    clearSessionCookie(response);
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  request.adminUser = adminUser;
  next();
};

const APP_CACHE = new Map();

export const createApp = async ({ serveStatic = true, enableLocalUploads = serveStatic } = {}) => {
  const cacheKey = JSON.stringify({ serveStatic, enableLocalUploads });
  if (APP_CACHE.has(cacheKey)) {
    return APP_CACHE.get(cacheKey);
  }

  const appPromise = (async () => {
    const app = express();
    const captureRawRequestBody = (request, _response, buffer) => {
      if (buffer?.length) {
        request.rawBody = buffer.toString('utf8');
      }
    };

    app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));
    app.use(express.json({ limit: '25mb', verify: captureRawRequestBody }));
    app.use(express.urlencoded({ extended: false, limit: '25mb', verify: captureRawRequestBody }));
    app.use(normalizeServerlessRequestBody);

    const globalRateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, 
      max: 200, 
      standardHeaders: true, 
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' }
    });
    
    const eventsRateLimiter = rateLimit({
      windowMs: 1 * 60 * 1000, 
      max: 60, 
      standardHeaders: true, 
      legacyHeaders: false,
      message: { error: 'Too many events submitted, please slow down.' }
    });
    
    app.use('/api/', globalRateLimiter);
    app.use('/api/personalization/events', eventsRateLimiter);

    app.use((request, _response, next) => {
      const functionPrefix = '/.netlify/functions/api';
      if (
        request.url === functionPrefix ||
        request.url.startsWith(`${functionPrefix}/`) ||
        request.url.startsWith(`${functionPrefix}?`)
      ) {
        const normalizedPath = request.url.slice(functionPrefix.length) || '';
        request.url = `/api${normalizedPath}`;
      }
      next();
    });
    app.use((request, response, next) => {
      request.visitorContext = getVisitorContext(request, response);
      next();
    });

    let db = null;
    let databaseConfig = {
      mode: 'unavailable',
      provider: 'none',
      localPath: null
    };
    let startupError = null;

    try {
      const connection = createDatabaseConnection(process.env, {
        projectRoot,
        allowLocalFallback: !Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME)
      });
      db = connection.client;
      databaseConfig = connection.config;
      await ensureDatabaseSchema(db);
      if (databaseConfig.mode === 'local') {
        await seedLocalDatabaseIfEmpty(db);
      }
      await ensureBootstrapAdmin(db);
    } catch (error) {
      startupError = error instanceof Error ? error : new Error('Failed to initialize the database connection.');
    }

    app.locals.db = db;
    app.locals.backendMode = startupError ? 'unavailable' : databaseConfig.mode;
    app.locals.backendError = startupError?.message || null;
    app.locals.databaseConfig = databaseConfig;

    app.get('/api/health', async (_request, response) => {
      response.status(startupError ? 500 : 200).json({
        ok: !startupError,
        backend: app.locals.backendMode,
        database: {
          provider: databaseConfig.provider,
          localPath:
            databaseConfig.mode === 'local' && databaseConfig.localPath
              ? path.relative(projectRoot, databaseConfig.localPath)
              : undefined
        },
        error: startupError?.message || undefined
      });
    });

    app.use((request, response, next) => {
      if (!request.path.startsWith('/api') || request.path === '/api/health') {
        next();
        return;
      }

      if (!request.app.locals.db) {
        response.status(503).json({
          error: request.app.locals.backendError || 'Backend database is unavailable.',
          backend: request.app.locals.backendMode
        });
        return;
      }

      next();
    });

    app.get('/api/content', async (request, response) => {
      try {
        // Authenticated admins see ALL content (including scheduled articles);
        // public visitors only see published content.
        const session = getRequestSession(request);
        const isAdmin = session?.email
          ? Boolean(await findAdminByEmail(request.app.locals.db, session.email))
          : false;

        const snapshot = isAdmin
          ? await getContentSnapshot(request.app.locals.db)
          : await getPublicContentSnapshot(request.app.locals.db);

        response.json({
          backend: request.app.locals.backendMode,
          ...snapshot
        });
      } catch (error) {
        response.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load content.' });
      }
    });

    app.get('/api/personalization/recommendations', async (request, response) => {
      try {
        const productLimit = Math.max(1, Math.min(8, Number(request.query?.productLimit) || 4));
        const newsLimit = Math.max(1, Math.min(6, Number(request.query?.newsLimit) || 3));
        const recommendations = await getPersonalizedContentForRequest(request, response, {
          productLimit,
          newsLimit
        });

        response.json(recommendations);
      } catch (error) {
        response.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to load personalized recommendations.'
        });
      }
    });

    app.post('/api/personalization/events', async (request, response) => {
      try {
        const event = createNormalizedPersonalizationEvent(request.body ?? {});

        if (!PERSONALIZATION_ENTITY_TYPES.has(event.entityType)) {
          response.status(400).json({ error: 'Unsupported personalization entity type.' });
          return;
        }

        if (!PERSONALIZATION_ACTIONS.has(event.action)) {
          response.status(400).json({ error: 'Unsupported personalization action.' });
          return;
        }

        const visitorContext = request.visitorContext || getVisitorContext(request, response);
        await insertPersonalizationEvent(request.app.locals.db, {
          ...event,
          visitorId: visitorContext.visitorId,
          ipHash: visitorContext.ipHash,
          userAgentHash: visitorContext.userAgentHash
        });

        const recommendations = await getPersonalizedContentForRequest(request, response);
        response.status(201).json({
          ok: true,
          ...recommendations
        });
      } catch (error) {
        response.status(400).json({
          error: error instanceof Error ? error.message : 'Failed to record personalization event.'
        });
      }
    });

    app.get('/api/map-profiles', async (request, response) => {
      try {
        const profiles = await listProvinceMapProfiles(request.app.locals.db);
        response.json({ profiles });
      } catch (error) {
        response.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load map profiles.' });
      }
    });

    app.get('/api/auth/session', async (request, response) => {
      try {
        const session = getRequestSession(request);
        if (!session?.email) {
          response.json({ isAuthenticated: false, isAdmin: false, user: null });
          return;
        }

        const adminUser = await findAdminByEmail(request.app.locals.db, session.email);
        if (!adminUser) {
          clearSessionCookie(response);
          response.json({ isAuthenticated: false, isAdmin: false, user: null });
          return;
        }

        response.json({
          isAuthenticated: true,
          isAdmin: true,
          user: {
            email: adminUser.email
          }
        });
      } catch (error) {
        response.status(500).json({ error: error instanceof Error ? error.message : 'Failed to read session.' });
      }
    });

    app.post('/api/auth/login', async (request, response) => {
      try {
        const { email, password } = getLoginCredentials(request);

        if (!email || !password) {
          response.status(400).json({ error: 'Email and password are required.' });
          return;
        }

        const adminUser = await findAdminByEmail(request.app.locals.db, email);
        if (!adminUser || !verifyPassword(password, adminUser.passwordHash)) {
          response.status(401).json({ error: 'Invalid email or password.' });
          return;
        }

        setSessionCookie(response, adminUser.email);
        response.json({
          ok: true,
          user: {
            email: adminUser.email
          }
        });
      } catch (error) {
        response.status(500).json({ error: error instanceof Error ? error.message : 'Login failed.' });
      }
    });

    app.post('/api/auth/logout', async (_request, response) => {
      clearSessionCookie(response);
      response.json({ ok: true });
    });

    app.post('/api/contact-inquiries', async (request, response) => {
      try {
        await insertContactInquiry(request.app.locals.db, request.body ?? {});
        response.status(201).json({ ok: true });
      } catch (error) {
        response.status(400).json({ error: error instanceof Error ? error.message : 'Failed to submit inquiry.' });
      }
    });

    app.post('/api/rfq/uploads', async (request, response) => {
      try {
        if (!enableLocalUploads) {
          response.status(501).json({
            error: 'Local RFQ file uploads are disabled in the serverless runtime. Use object storage for production.'
          });
          return;
        }

        const { dataUrl, contentType, fileName } = request.body ?? {};
        const { buffer, mimeType } = parseDataUrl(dataUrl);
        const resolvedContentType = String(contentType || mimeType || '').trim().toLowerCase();

        if (!RFQ_ALLOWED_CONTENT_TYPES.has(resolvedContentType)) {
          throw new Error('Unsupported RFQ attachment type.');
        }

        if (buffer.length > MAX_RFQ_ATTACHMENT_SIZE_BYTES) {
          throw new Error('RFQ attachment size must be 15MB or smaller.');
        }

        const safeSegments = createRfqUploadFolderSegments();
        const extension = getFileExtension(fileName, resolvedContentType);
        const absoluteDir = path.join(uploadsRoot, ...safeSegments);

        await fs.mkdir(absoluteDir, { recursive: true });

        const savedFileName = `${crypto.randomUUID()}.${extension}`;
        await fs.writeFile(path.join(absoluteDir, savedFileName), buffer);

        response.status(201).json({
          ok: true,
          attachment: {
            publicUrl: `/uploads/cms/${safeSegments.join('/')}/${savedFileName}`,
            fileName: String(fileName ?? savedFileName).trim() || savedFileName,
            contentType: resolvedContentType,
            sizeBytes: buffer.length
          }
        });
      } catch (error) {
        response.status(400).json({ error: error instanceof Error ? error.message : 'RFQ attachment upload failed.' });
      }
    });

    app.post('/api/quotation-requests', async (request, response) => {
      try {
        await insertQuotationRequest(request.app.locals.db, request.body ?? {});
        response.status(201).json({ ok: true });
      } catch (error) {
        response.status(400).json({ error: error instanceof Error ? error.message : 'Failed to submit quotation request.' });
      }
    });

    app.post('/api/admin/import', requireAdmin, async (request, response) => {
      try {
        await importContentSnapshot(request.app.locals.db, request.body ?? {});
        const snapshot = await getContentSnapshot(request.app.locals.db);
        response.json({
          ok: true,
          ...snapshot
        });
      } catch (error) {
        response.status(400).json({ error: error instanceof Error ? error.message : 'Import failed.' });
      }
    });

    app.post('/api/admin/products/upsert', requireAdmin, async (request, response) => {
      try {
        const product = request.body?.product;
        const oldId = request.body?.oldId;
        const savedProduct = await updateProductRecord(request.app.locals.db, product, oldId);
        response.json({ ok: true, product: savedProduct });
      } catch (error) {
        response.status(400).json({ error: error instanceof Error ? error.message : 'Failed to save product.' });
      }
    });

    app.delete('/api/admin/products/:id', requireAdmin, async (request, response) => {
      try {
        await deleteProductById(request.app.locals.db, request.params.id);
        response.json({ ok: true });
      } catch (error) {
        response.status(400).json({ error: error instanceof Error ? error.message : 'Failed to delete product.' });
      }
    });

    app.post('/api/admin/news/upsert', requireAdmin, async (request, response) => {
      try {
        const item = request.body?.item;
        const savedNews = await upsertNews(request.app.locals.db, item);
        response.json({ ok: true, item: savedNews });
      } catch (error) {
        response.status(400).json({ error: error instanceof Error ? error.message : 'Failed to save article.' });
      }
    });

    app.delete('/api/admin/news/:id', requireAdmin, async (request, response) => {
      try {
        await deleteNewsById(request.app.locals.db, request.params.id);
        response.json({ ok: true });
      } catch (error) {
        response.status(400).json({ error: error instanceof Error ? error.message : 'Failed to delete article.' });
      }
    });

    app.post('/api/admin/map-profiles/upsert', requireAdmin, async (request, response) => {
      try {
        const profile = request.body?.profile;
        const savedProfile = await upsertProvinceMapProfile(request.app.locals.db, profile);
        response.json({ ok: true, profile: savedProfile });
      } catch (error) {
        response.status(400).json({ error: error instanceof Error ? error.message : 'Failed to save map profile.' });
      }
    });

    app.delete('/api/admin/map-profiles/:provinceId', requireAdmin, async (request, response) => {
      try {
        await deleteProvinceMapProfileById(request.app.locals.db, request.params.provinceId);
        response.json({ ok: true });
      } catch (error) {
        response.status(400).json({ error: error instanceof Error ? error.message : 'Failed to reset map profile.' });
      }
    });

    app.post('/api/admin/map-profiles/ai-suggest', requireAdmin, async (request, response) => {
      try {
        const provinceId = String(request.body?.provinceId ?? '').trim();
        const provinceName = String(request.body?.provinceName ?? '').trim();
        const provinceType = String(request.body?.provinceType ?? '').trim() || 'Province';
        const regionLabel = String(request.body?.regionLabel ?? '').trim();
        const categoryScope = normalizeMapAiScope(request.body?.categoryScope);

        if (!provinceId || !provinceName || !regionLabel) {
          response.status(400).json({ error: 'Province context is required for AI suggestions.' });
          return;
        }

        const snapshot = await getContentSnapshot(request.app.locals.db);
        const allProducts = Array.isArray(snapshot?.products) ? snapshot.products.filter((item) => item?.isActive !== false) : [];
        const existingProfiles = await listProvinceMapProfiles(request.app.locals.db);
        const currentProfile =
          existingProfiles.find((item) => String(item?.provinceId ?? '') === provinceId) ?? null;
        const baseScopedProducts =
          categoryScope === 'auto' ? allProducts : allProducts.filter((item) => String(item?.category ?? '') === categoryScope);
        const currentProfileProductNames = new Set(
          Array.isArray(currentProfile?.products)
            ? currentProfile.products.map((item) => String(item?.name ?? '').trim().toLowerCase()).filter(Boolean)
            : []
        );
        const scopedProducts =
          categoryScope === 'auto' && currentProfileProductNames.size > 0
            ? baseScopedProducts.filter((item) => currentProfileProductNames.has(String(item?.name ?? '').trim().toLowerCase()))
            : baseScopedProducts;

        if (scopedProducts.length === 0) {
          response.status(400).json({ error: 'No active products are available for the selected AI scope.' });
          return;
        }

        const prompt = buildMapProfileSuggestionPrompt({
          provinceId,
          provinceName,
          provinceType,
          regionLabel,
          categoryScope,
          currentProfile,
          otherProfiles: existingProfiles,
          scopedProducts
        });

        const aiResult = await callMapProfileAgent(prompt);
        const profile = sanitizeSuggestedMapProfile({
          provinceId,
          provinceName,
          draft: aiResult.payload,
          scopedProducts,
          anchoredProducts: categoryScope === 'auto' && Array.isArray(currentProfile?.products) ? currentProfile.products : []
        });

        response.json({
          ok: true,
          profile,
          provider: aiResult.provider,
          sources: aiResult.sources
        });
      } catch (error) {
        response.status(400).json({ error: error instanceof Error ? error.message : 'Failed to generate AI map suggestion.' });
      }
    });

    app.post('/api/admin/uploads/images', requireAdmin, async (request, response) => {
      try {
        if (!enableLocalUploads) {
          response.status(501).json({
            error: 'Local image uploads are disabled in the serverless runtime. Use external object storage instead.'
          });
          return;
        }

        const { dataUrl, contentType, fileName, folderSegments } = request.body ?? {};
        const { buffer, mimeType } = parseDataUrl(dataUrl);
        const resolvedContentType = String(contentType || mimeType || '').trim();

        if (!resolvedContentType.startsWith('image/')) {
          throw new Error('Please choose a valid image file.');
        }

        if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
          throw new Error('Image size must be 10MB or smaller.');
        }

        const safeSegments = sanitizeUploadSegments(folderSegments);
        const extension = getFileExtension(fileName, resolvedContentType);
        const fileId = crypto.randomUUID();
        const relativeDir = path.join(...safeSegments);
        const absoluteDir = path.join(uploadsRoot, relativeDir);

        await fs.mkdir(absoluteDir, { recursive: true });

        const savedFileName = `${fileId}.${extension}`;
        await fs.writeFile(path.join(absoluteDir, savedFileName), buffer);

        response.status(201).json({
          ok: true,
          publicUrl: `/uploads/cms/${safeSegments.join('/')}/${savedFileName}`
        });
      } catch (error) {
        response.status(400).json({ error: error instanceof Error ? error.message : 'Image upload failed.' });
      }
    });

    app.post('/api/admin/translate', requireAdmin, async (request, response) => {
      try {
        const prompt = String(request.body?.prompt ?? '').trim();
        if (!prompt) {
          response.status(400).json({ error: 'Prompt is required.' });
          return;
        }

        const translation = await callOllama(prompt);
        response.json({ translation });
      } catch (error) {
        response.status(400).json({ error: error instanceof Error ? error.message : 'Translation failed.' });
      }
    });

    app.get('/sitemap.xml', async (request, response) => {
      try {
        const { rows: products } = await db.execute('SELECT id, category FROM products ORDER BY id ASC');
        const { rows: news } = await db.execute('SELECT id, slug, title, date FROM news ORDER BY date DESC, _rowid_ DESC');
        
        const stripDiacritics = (val) => val.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd').replace(/\u0110/g, 'd');
        const normalizeNewsSlug = (val) => stripDiacritics(val).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
        const getNewsSlug = (item) => {
          const explicitSlug = normalizeNewsSlug(item.slug || '');
          if (explicitSlug) return explicitSlug;
          const titleSlug = normalizeNewsSlug(item.title || '');
          if (titleSlug) return titleSlug;
          const idSlug = normalizeNewsSlug(item.id || '');
          return idSlug || 'news-item';
        };

        const baseUrl = 'https://foodmax.vn';
        
        const staticRoutes = [
          { url: '/', priority: '1.0', changefreq: 'weekly' },
          { url: '/product', priority: '0.9', changefreq: 'weekly' },
          { url: '/about', priority: '0.7', changefreq: 'monthly' },
          { url: '/news', priority: '0.7', changefreq: 'weekly' },
          { url: '/operations', priority: '0.6', changefreq: 'monthly' },
          { url: '/contact', priority: '0.6', changefreq: 'monthly' },
          { url: '/interactive-map', priority: '0.5', changefreq: 'monthly' }
        ];

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        for (const route of staticRoutes) {
          xml += `  <url>\n    <loc>${baseUrl}${route.url}</loc>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>\n`;
        }

        for (const product of products) {
          xml += `  <url>\n    <loc>${baseUrl}/product/item/${encodeURIComponent(product.id)}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        }

        for (const item of news) {
          const slug = encodeURIComponent(getNewsSlug(item));
          let dateStr = '';
          try {
             if (item.date) {
               const d = new Date(item.date);
               if (!isNaN(d.valueOf())) {
                 dateStr = d.toISOString().split('T')[0];
               }
             }
          } catch {}
          
          xml += `  <url>\n    <loc>${baseUrl}/news/${slug}</loc>\n`;
          if (dateStr) {
            xml += `    <lastmod>${dateStr}</lastmod>\n`;
          }
          xml += `    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        }

        xml += '</urlset>';
        
        response.header('Content-Type', 'application/xml');
        response.send(xml);
      } catch (error) {
        console.error('Sitemap Error:', error);
        response.status(500).end();
      }
    });

    if (serveStatic) {
      app.use(express.static(publicRoot, { index: false }));
      if (existsSync(distRoot)) {
        app.use(express.static(distRoot, { index: false }));
      }

      app.get(/.*/, async (request, response, next) => {
        if (request.path.startsWith('/api')) {
          next();
          return;
        }

        const indexPath = path.join(distRoot, 'index.html');
        if (!existsSync(indexPath)) {
          response.status(404).send('Build output not found. Run npm run build first.');
          return;
        }

        response.sendFile(indexPath);
      });
    }

    app.use((error, _request, response, _next) => {
      response.status(500).json({
        error: error instanceof Error ? error.message : 'Unexpected server error.'
      });
    });

    return app;
  })();

  APP_CACHE.set(cacheKey, appPromise);
  return appPromise;
};

const isDirectExecution = process.argv[1] ? path.resolve(process.argv[1]) === __filename : false;

if (isDirectExecution) {
  const app = await createApp({ serveStatic: true, enableLocalUploads: true });
  app.listen(PORT, 'localhost', () => {
    // eslint-disable-next-line no-console
    console.log(`Foodmax Turso API listening on http://localhost:${PORT}`);
  });
}
