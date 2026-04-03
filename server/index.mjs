import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

import {
  createTursoConnection,
  deleteProvinceMapProfileById,
  deleteNewsById,
  deleteProductById,
  ensureDatabaseSchema,
  findAdminByEmail,
  getContentSnapshot,
  hashPassword,
  importContentSnapshot,
  insertContactInquiry,
  insertQuotationRequest,
  listProvinceMapProfiles,
  updateProductRecord,
  upsertAdminUser,
  upsertProvinceMapProfile,
  upsertNews,
  verifyPassword
} from './db.mjs';
import { loadProjectEnv } from './loadEnv.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist');
const publicRoot = path.join(projectRoot, 'public');
const uploadsRoot = path.join(publicRoot, 'uploads', 'cms');

await loadProjectEnv(projectRoot);

const PORT = Number(process.env.PORT || 8787);
const SESSION_COOKIE = 'foodmax_session';
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const OLLAMA_DEFAULT_BASE_URL = 'http://localhost:11434';
const OLLAMA_DEFAULT_MODEL = 'qwen2.5:7b';
const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash';
const MAP_AI_SCOPE_VALUES = new Set(['Rice', 'Coffee', 'Cashew', 'Agriculture']);

const IMAGE_EXTENSION_BY_MIME = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp'
};

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
  if (contentType && IMAGE_EXTENSION_BY_MIME[contentType]) {
    return IMAGE_EXTENSION_BY_MIME[contentType];
  }

  const rawExtension = path.extname(String(fileName ?? '')).replace('.', '').toLowerCase();
  return rawExtension.replace(/[^a-z0-9]/g, '') || 'bin';
};

const parseDataUrl = (value) => {
  const match = String(value ?? '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image payload.');
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64')
  };
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

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: false, limit: '25mb' }));

const db = createTursoConnection(process.env);
await ensureDatabaseSchema(db);
await ensureBootstrapAdmin(db);

app.locals.db = db;

app.get('/api/health', async (_request, response) => {
  response.json({
    ok: true,
    backend: 'turso'
  });
});

app.get('/api/content', async (request, response) => {
  try {
    const snapshot = await getContentSnapshot(request.app.locals.db);
    response.json({
      backend: 'turso',
      ...snapshot
    });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load content.' });
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
    const email = String(request.body?.email ?? '').trim().toLowerCase();
    const password = String(request.body?.password ?? '');

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

app.use((error, _request, response, _next) => {
  response.status(500).json({
    error: error instanceof Error ? error.message : 'Unexpected server error.'
  });
});

app.listen(PORT, 'localhost', () => {
  // eslint-disable-next-line no-console
  console.log(`Foodmax Turso API listening on http://localhost:${PORT}`);
});
