import { createClient } from '@libsql/client/web';
import crypto from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SCHEMA_STATEMENTS = [
  `
    create table if not exists products (
      id text primary key,
      name text not null,
      is_active integer not null default 1,
      category text not null,
      sub_category text not null,
      description text not null,
      short_description text not null,
      image text not null,
      pdf_url text,
      gallery text,
      specifications text not null default '{}',
      packaging text not null default '{}',
      payment text not null default '{}',
      filters text not null default '{}',
      translations text not null default '{}',
      created_at text not null default CURRENT_TIMESTAMP,
      updated_at text not null default CURRENT_TIMESTAMP
    )
  `,
  'create index if not exists idx_products_category on products(category)',
  `
    create table if not exists news (
      id text primary key,
      slug text not null unique,
      title text not null,
      is_active integer not null default 1,
      date text not null,
      category text not null,
      excerpt text not null,
      content text not null default '[]',
      image text not null,
      image_alt text,
      scheduled_at text,
      translations text not null default '{}',
      created_at text not null default CURRENT_TIMESTAMP,
      updated_at text not null default CURRENT_TIMESTAMP
    )
  `,
  'create index if not exists idx_news_date on news(date desc)',
  `
    create table if not exists careers (
      id text primary key,
      title text not null,
      department text not null default '',
      location text not null default '',
      type text not null default 'Full-time',
      description text not null default '',
      requirements text not null default '[]',
      is_active integer not null default 1,
      created_at text not null default CURRENT_TIMESTAMP,
      updated_at text not null default CURRENT_TIMESTAMP
    )
  `,
  `
    create table if not exists admin_users (
      id integer primary key autoincrement,
      email text not null unique,
      password_hash text not null,
      created_at text not null default CURRENT_TIMESTAMP,
      updated_at text not null default CURRENT_TIMESTAMP
    )
  `,
  `
    create table if not exists contact_inquiries (
      id integer primary key autoincrement,
      company_name text not null,
      full_name text not null,
      email text not null,
      phone_whatsapp text,
      subject text not null,
      message text not null,
      created_at text not null default CURRENT_TIMESTAMP
    )
  `,
  `
    create table if not exists quotation_requests (
      id integer primary key autoincrement,
      product_id text not null,
      full_name text not null,
      email text not null,
      company_name text,
      phone_whatsapp text,
      destination_port text not null default '',
      incoterm text not null default '',
      order_volume text,
      packaging text,
      payment_terms text,
      certification_needed text,
      timeline text,
      message text not null,
      items_count integer not null default 1,
      attachments_json text not null default '[]',
      created_at text not null default CURRENT_TIMESTAMP
    )
  `,
  `
    create table if not exists quotation_request_items (
      id integer primary key autoincrement,
      quotation_request_id integer not null,
      product_id text not null,
      product_name text not null default '',
      target_specs text,
      created_at text not null default CURRENT_TIMESTAMP
    )
  `,
  `
    create table if not exists province_map_profiles (
      province_id text primary key,
      headline text not null default '',
      overview text not null default '',
      export_produce_count integer not null default 0,
      growing_zones integer not null default 0,
      gps_latitude real,
      gps_longitude real,
      cultivated_area_hectares real,
      average_output_mt_per_year real,
      sowing_period text not null default '',
      harvest_period text not null default '',
      crops_per_year real,
      characteristics text not null default '',
      varieties text not null default '',
      products text not null default '[]',
      created_at text not null default CURRENT_TIMESTAMP,
      updated_at text not null default CURRENT_TIMESTAMP
    )
  `,
  `
    create table if not exists personalization_events (
      id text primary key,
      visitor_id text not null,
      ip_hash text not null,
      user_agent_hash text,
      entity_type text not null,
      action text not null,
      item_id text,
      route text,
      category text,
      sub_category text,
      news_category text,
      locale text,
      weight real not null default 1,
      metadata text not null default '{}',
      created_at text not null default CURRENT_TIMESTAMP
    )
  `,
  'create index if not exists idx_personalization_events_visitor on personalization_events(visitor_id, created_at desc)',
  'create index if not exists idx_personalization_events_entity on personalization_events(entity_type, item_id, created_at desc)',
  `
    create table if not exists personalization_profiles (
      visitor_id text primary key,
      ip_hash text not null default '',
      user_agent_hash text not null default '',
      segment text not null default '',
      summary text not null default '',
      profile_json text not null default '{}',
      last_active_at text,
      updated_at text not null default CURRENT_TIMESTAMP
    )
  `,
  `
    create table if not exists product_categories (
      id text primary key,
      name text not null,
      slug text not null,
      sort_order integer not null default 0,
      is_active integer not null default 1,
      created_at text not null default CURRENT_TIMESTAMP,
      updated_at text not null default CURRENT_TIMESTAMP
    )
  `
];

const DEFAULT_PASSWORD_BYTES = 64;

const parseJsonColumn = (value, fallback) => {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const stringifyJsonColumn = (value, fallback) => JSON.stringify(value ?? fallback);

const normalizeNullableNumber = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeTextColumn = (value) => String(value ?? '').trim();
const normalizeNonNegativeInteger = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.round(parsed));
};

const NEWS_MIGRATION_COLUMNS = [
  ['scheduled_at', 'text'],
  ['image_alt', 'text'],
  ['related_products', 'text'],
  ['content_html', 'text'],
  ['seo_title', 'text'],
  ['meta_description', 'text'],
  ['focus_keyword', 'text'],
  ['secondary_keywords', 'text']
];

const PRODUCT_MIGRATION_COLUMNS = [
  ['slug', 'text'],
  ['seo_title', 'text'],
  ['meta_description', 'text'],
  ['focus_keyword', 'text'],
  ['secondary_keywords', 'text'],
  ['image_alt', 'text'],
  ['canonical_url', 'text'],
  ['status', "text not null default 'published'"],
  ['moq', 'text'],
  ['origin_country', 'text'],
  ['certifications', 'text'],
  ['incoterms', 'text'],
  ['destination_markets', 'text'],
  ['packaging_options', 'text'],
  ['lead_time', 'text'],
  ['sample_policy', 'text'],
  ['previous_slugs', 'text'],
  ['appearance', 'text'],
  ['pin_order', 'integer']
];

const PROVINCE_MAP_PROFILE_COLUMNS = [
  ['gps_latitude', 'real'],
  ['gps_longitude', 'real'],
  ['cultivated_area_hectares', 'real'],
  ['average_output_mt_per_year', 'real'],
  ["sowing_period", "text not null default ''"],
  ["harvest_period", "text not null default ''"],
  ['crops_per_year', 'real'],
  ["characteristics", "text not null default ''"],
  ["varieties", "text not null default ''"]
];

const QUOTATION_REQUEST_COLUMNS = [
  ["phone_whatsapp", 'text'],
  ["destination_port", "text not null default ''"],
  ["incoterm", "text not null default ''"],
  ['packaging', 'text'],
  ['payment_terms', 'text'],
  ['certification_needed', 'text'],
  ['timeline', 'text'],
  ['items_count', 'integer not null default 1'],
  ["attachments_json", "text not null default '[]'"]
];

const DEFAULT_LOCAL_DATABASE_PATH = path.join('tmp', 'foodmax-local.db');

const normalizeDatabaseMode = (value) => {
  const normalized = String(value ?? 'auto').trim().toLowerCase();
  return normalized === 'turso' || normalized === 'local' ? normalized : 'auto';
};

const isTruthy = (value) => ['1', 'true', 'yes', 'on'].includes(String(value ?? '').trim().toLowerCase());

const resolveDatabaseEnv = (env = process.env) => ({
  requestedMode: normalizeDatabaseMode(env.DATABASE_MODE),
  tursoUrl: String(env.TURSO_DATABASE_URL || env.LIBSQL_URL || '').trim(),
  tursoAuthToken: String(env.TURSO_AUTH_TOKEN || env.LIBSQL_AUTH_TOKEN || '').trim(),
  localDatabasePath: String(env.LOCAL_DATABASE_PATH || '').trim(),
  allowLocalDatabase: isTruthy(env.ALLOW_LOCAL_DATABASE),
  isServerlessRuntime: Boolean(env.NETLIFY || env.AWS_LAMBDA_FUNCTION_NAME)
});

const resolveLocalDatabasePath = (projectRoot, configuredPath = '') => {
  const targetPath = configuredPath || DEFAULT_LOCAL_DATABASE_PATH;
  return path.isAbsolute(targetPath) ? targetPath : path.resolve(projectRoot, targetPath);
};

export const resolveDatabaseConfig = (
  env = process.env,
  { projectRoot = process.cwd(), allowLocalFallback = false } = {}
) => {
  const databaseEnv = resolveDatabaseEnv(env);
  const hasTursoConfig = Boolean(databaseEnv.tursoUrl && databaseEnv.tursoAuthToken);
  const canUseLocalDatabase =
    databaseEnv.requestedMode === 'local' ||
    databaseEnv.allowLocalDatabase ||
    allowLocalFallback;

  if (databaseEnv.requestedMode === 'turso') {
    if (!hasTursoConfig) {
      throw new Error('DATABASE_MODE=turso requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
    }

    return {
      mode: 'turso',
      provider: 'turso',
      url: databaseEnv.tursoUrl,
      authToken: databaseEnv.tursoAuthToken,
      localPath: null
    };
  }

  if (hasTursoConfig) {
    return {
      mode: 'turso',
      provider: 'turso',
      url: databaseEnv.tursoUrl,
      authToken: databaseEnv.tursoAuthToken,
      localPath: null
    };
  }

  if (canUseLocalDatabase) {
    const localPath = resolveLocalDatabasePath(projectRoot, databaseEnv.localDatabasePath);
    return {
      mode: 'local',
      provider: 'sqlite',
      url: pathToFileURL(localPath).href,
      authToken: undefined,
      localPath
    };
  }

  if (databaseEnv.isServerlessRuntime) {
    throw new Error(
      'Missing Turso configuration in the serverless runtime. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in production.'
    );
  }

  throw new Error(
    'Missing Turso configuration. For local development, set DATABASE_MODE=local or configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.'
  );
};

export const createDatabaseConnection = (
  env = process.env,
  options = {}
) => {
  const config = resolveDatabaseConfig(env, options);

  if (config.localPath) {
    mkdirSync(path.dirname(config.localPath), { recursive: true });
  }

  return {
    client: createClient({
      url: config.url,
      authToken: config.authToken
    }),
    config
  };
};

export const createTursoConnection = (env = process.env) => {
  const url = env.TURSO_DATABASE_URL?.trim();
  const authToken = env.TURSO_AUTH_TOKEN?.trim();

  if (!url || !authToken) {
    throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN.');
  }

  return createClient({
    url,
    authToken
  });
};

// ── Product Categories (must be before ensureDatabaseSchema) ──

const DEFAULT_CATEGORIES = [
  { id: 'rice', name: 'Rice', slug: 'rice', sort_order: 0 },
  { id: 'coffee', name: 'Coffee', slug: 'coffee', sort_order: 1 },
  { id: 'cashew', name: 'Cashew', slug: 'cashew', sort_order: 2 },
  { id: 'agriculture', name: 'Agriculture', slug: 'agriculture', sort_order: 3 },
  { id: 'pepper', name: 'Pepper', slug: 'pepper', sort_order: 4 }
];

export const seedDefaultCategories = async (client) => {
  const existing = await client.execute('select count(*) as cnt from product_categories');
  if (Number(existing.rows[0]?.cnt ?? 0) > 0) return;

  for (const cat of DEFAULT_CATEGORIES) {
    await client.execute({
      sql: `insert or ignore into product_categories (id, name, slug, sort_order) values (?, ?, ?, ?)`,
      args: [cat.id, cat.name, cat.slug, cat.sort_order]
    });
  }
};

export const ensureDatabaseSchema = async (client) => {
  for (const statement of SCHEMA_STATEMENTS) {
    await client.execute(statement);
  }

  const quotationRequestColumns = await client.execute('pragma table_info(quotation_requests)');
  const existingQuotationRequestColumns = new Set(quotationRequestColumns.rows.map((row) => String(row.name ?? '').trim()));

  for (const [columnName, columnDefinition] of QUOTATION_REQUEST_COLUMNS) {
    if (existingQuotationRequestColumns.has(columnName)) {
      continue;
    }

    await client.execute(`alter table quotation_requests add column ${columnName} ${columnDefinition}`);
  }

  // Migrate news table for scheduled publishing
  const newsColumns = await client.execute('pragma table_info(news)');
  const existingNewsColumnNames = new Set(newsColumns.rows.map((row) => String(row.name ?? '').trim()));

  for (const [columnName, columnDefinition] of NEWS_MIGRATION_COLUMNS) {
    if (existingNewsColumnNames.has(columnName)) {
      continue;
    }

    await client.execute(`alter table news add column ${columnName} ${columnDefinition}`);
  }

  // Migrate products table for SEO + B2B fields
  const productColumns = await client.execute('pragma table_info(products)');
  const existingProductColumnNames = new Set(productColumns.rows.map((row) => String(row.name ?? '').trim()));

  for (const [columnName, columnDefinition] of PRODUCT_MIGRATION_COLUMNS) {
    if (existingProductColumnNames.has(columnName)) {
      continue;
    }

    await client.execute(`alter table products add column ${columnName} ${columnDefinition}`);
  }

  const provinceMapProfileColumns = await client.execute('pragma table_info(province_map_profiles)');
  const existingColumnNames = new Set(provinceMapProfileColumns.rows.map((row) => String(row.name ?? '').trim()));

  for (const [columnName, columnDefinition] of PROVINCE_MAP_PROFILE_COLUMNS) {
    if (existingColumnNames.has(columnName)) {
      continue;
    }

    await client.execute(`alter table province_map_profiles add column ${columnName} ${columnDefinition}`);
  }

  // Seed default product categories if table is empty
  await seedDefaultCategories(client);
};

export const slugify = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'news-item';

export const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const derived = crypto.scryptSync(password, salt, DEFAULT_PASSWORD_BYTES).toString('hex');
  return `${salt}:${derived}`;
};

export const verifyPassword = (password, storedHash) => {
  const [salt, expectedHash] = String(storedHash ?? '').split(':');
  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = crypto.scryptSync(password, salt, DEFAULT_PASSWORD_BYTES).toString('hex');
  const actualBuffer = Buffer.from(actualHash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
};

const mapProductRow = (row) => ({
  id: String(row.id ?? ''),
  slug: row.slug ? String(row.slug) : undefined,
  name: String(row.name ?? ''),
  isActive: Number(row.is_active ?? 1) !== 0,
  status: row.status ? String(row.status) : undefined,
  category: String(row.category ?? ''),
  subCategory: String(row.sub_category ?? ''),
  description: String(row.description ?? ''),
  shortDescription: String(row.short_description ?? ''),
  image: String(row.image ?? ''),
  imageAlt: row.image_alt ? String(row.image_alt) : undefined,
  pdfUrl: row.pdf_url ? String(row.pdf_url) : undefined,
  gallery: parseJsonColumn(row.gallery, undefined),
  specifications: parseJsonColumn(row.specifications, {}),
  packaging: parseJsonColumn(row.packaging, {}),
  payment: parseJsonColumn(row.payment, {}),
  filters: parseJsonColumn(row.filters, {}),
  translations: parseJsonColumn(row.translations, undefined),
  // SEO fields
  seoTitle: row.seo_title ? String(row.seo_title) : undefined,
  metaDescription: row.meta_description ? String(row.meta_description) : undefined,
  focusKeyword: row.focus_keyword ? String(row.focus_keyword) : undefined,
  secondaryKeywords: parseJsonColumn(row.secondary_keywords, undefined),
  canonicalUrl: row.canonical_url ? String(row.canonical_url) : undefined,
  // B2B fields
  moq: row.moq ? String(row.moq) : undefined,
  originCountry: row.origin_country ? String(row.origin_country) : undefined,
  certifications: parseJsonColumn(row.certifications, undefined),
  incoterms: parseJsonColumn(row.incoterms, undefined),
  destinationMarkets: parseJsonColumn(row.destination_markets, undefined),
  packagingOptions: parseJsonColumn(row.packaging_options, undefined),
  leadTime: row.lead_time ? String(row.lead_time) : undefined,
  samplePolicy: row.sample_policy ? String(row.sample_policy) : undefined,
  previousSlugs: parseJsonColumn(row.previous_slugs, undefined),
  appearance: row.appearance ? String(row.appearance) : undefined,
  pinOrder: row.pin_order != null ? Number(row.pin_order) : null
});

const mapNewsRow = (row) => ({
  id: String(row.id ?? ''),
  slug: String(row.slug ?? ''),
  title: String(row.title ?? ''),
  isActive: Number(row.is_active ?? 1) !== 0,
  date: String(row.date ?? ''),
  category: String(row.category ?? ''),
  excerpt: String(row.excerpt ?? ''),
  content: parseJsonColumn(row.content, []),
  contentHtml: row.content_html ? String(row.content_html) : undefined,
  image: String(row.image ?? ''),
  imageAlt: row.image_alt ? String(row.image_alt) : undefined,
  scheduledAt: row.scheduled_at ? String(row.scheduled_at) : undefined,
  seoTitle: row.seo_title ? String(row.seo_title) : undefined,
  metaDescription: row.meta_description ? String(row.meta_description) : undefined,
  focusKeyword: row.focus_keyword ? String(row.focus_keyword) : undefined,
  secondaryKeywords: parseJsonColumn(row.secondary_keywords, undefined),
  translations: parseJsonColumn(row.translations, undefined),
  relatedProducts: parseJsonColumn(row.related_products, undefined)
});

const mapCareerRow = (row) => ({
  id: String(row.id ?? ''),
  title: String(row.title ?? ''),
  department: String(row.department ?? ''),
  location: String(row.location ?? ''),
  type: String(row.type ?? 'Full-time'),
  description: String(row.description ?? ''),
  requirements: parseJsonColumn(row.requirements, []),
  isActive: Number(row.is_active ?? 1) !== 0,
  createdAt: row.created_at ? String(row.created_at) : undefined,
  updatedAt: row.updated_at ? String(row.updated_at) : undefined
});

const mapProvinceMapProfileRow = (row) => ({
  provinceId: String(row.province_id ?? ''),
  headline: String(row.headline ?? ''),
  overview: String(row.overview ?? ''),
  exportProduceCount: Number(row.export_produce_count ?? 0),
  growingZones: Number(row.growing_zones ?? 0),
  gpsLatitude: normalizeNullableNumber(row.gps_latitude),
  gpsLongitude: normalizeNullableNumber(row.gps_longitude),
  cultivatedAreaHectares: normalizeNullableNumber(row.cultivated_area_hectares),
  averageOutputMtPerYear: normalizeNullableNumber(row.average_output_mt_per_year),
  sowingPeriod: String(row.sowing_period ?? ''),
  harvestPeriod: String(row.harvest_period ?? ''),
  cropsPerYear: normalizeNullableNumber(row.crops_per_year),
  characteristics: String(row.characteristics ?? ''),
  varieties: String(row.varieties ?? ''),
  products: parseJsonColumn(row.products, []),
  updatedAt: row.updated_at ? String(row.updated_at) : undefined
});

const mapPersonalizationEventRow = (row) => ({
  id: String(row.id ?? ''),
  visitorId: String(row.visitor_id ?? ''),
  ipHash: String(row.ip_hash ?? ''),
  userAgentHash: row.user_agent_hash ? String(row.user_agent_hash) : '',
  entityType: String(row.entity_type ?? ''),
  action: String(row.action ?? ''),
  itemId: row.item_id ? String(row.item_id) : undefined,
  route: row.route ? String(row.route) : undefined,
  category: row.category ? String(row.category) : undefined,
  subCategory: row.sub_category ? String(row.sub_category) : undefined,
  newsCategory: row.news_category ? String(row.news_category) : undefined,
  locale: row.locale ? String(row.locale) : undefined,
  weight: Number(row.weight ?? 1) || 1,
  metadata: parseJsonColumn(row.metadata, {}),
  createdAt: row.created_at ? String(row.created_at) : undefined
});

const mapPersonalizationProfileRow = (row) => ({
  visitorId: String(row.visitor_id ?? ''),
  ipHash: String(row.ip_hash ?? ''),
  userAgentHash: String(row.user_agent_hash ?? ''),
  segment: String(row.segment ?? ''),
  summary: String(row.summary ?? ''),
  profile: parseJsonColumn(row.profile_json, {}),
  lastActiveAt: row.last_active_at ? String(row.last_active_at) : undefined,
  updatedAt: row.updated_at ? String(row.updated_at) : undefined
});

export const listProducts = async (client) => {
  const result = await client.execute('select * from products order by (pin_order is not null) desc, pin_order asc, id asc');
  return result.rows.map(mapProductRow);
};

export const listNews = async (client) => {
  const result = await client.execute('select * from news order by date desc, id desc');
  return result.rows.map(mapNewsRow);
};

export const listPublicNews = async (client) => {
  const result = await client.execute({
    sql: `select * from news
          where is_active = 1
            and (scheduled_at is null or scheduled_at <= datetime('now'))
          order by date desc, id desc`,
    args: []
  });
  return result.rows.map(mapNewsRow);
};

export const listCareers = async (client) => {
  const result = await client.execute('select * from careers order by created_at desc, id desc');
  return result.rows.map(mapCareerRow);
};

export const listActiveCareers = async (client) => {
  const result = await client.execute({
    sql: 'select * from careers where is_active = 1 order by created_at desc, id desc',
    args: []
  });
  return result.rows.map(mapCareerRow);
};

export const getContentSnapshot = async (client) => {
  const [products, news, categories, careers] = await Promise.all([listProducts(client), listNews(client), listCategories(client), listCareers(client)]);
  return { products, news, categories, careers };
};

export const generateUniqueNewsSlug = async (client, requestedSlug, title, id) => {
  const base = slugify(requestedSlug || title || id || 'news-item');
  let candidate = base;
  let suffix = 2;

  while (true) {
    const result = await client.execute({
      sql: 'select id from news where slug = ? and id != ? limit 1',
      args: [candidate, String(id ?? '')]
    });

    if (result.rows.length === 0) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

export const upsertProduct = async (client, product) => {
  // Auto-generate slug from product name if not provided
  const productSlug = product.slug?.trim() || slugify(product.name || product.id || 'product');

  // Merge previousSlugs: if slug changed, append old slug to history
  let mergedPreviousSlugs = Array.isArray(product.previousSlugs) ? [...product.previousSlugs] : [];
  // Check if current row exists and slug is changing
  try {
    const existingRow = await client.execute({ sql: 'select slug, previous_slugs from products where id = ? limit 1', args: [String(product.id ?? '')] });
    if (existingRow.rows.length > 0) {
      const oldSlug = existingRow.rows[0].slug ? String(existingRow.rows[0].slug) : null;
      const oldPrevious = parseJsonColumn(existingRow.rows[0].previous_slugs, []);
      if (Array.isArray(oldPrevious)) mergedPreviousSlugs = [...new Set([...oldPrevious, ...mergedPreviousSlugs])];
      if (oldSlug && oldSlug !== productSlug && !mergedPreviousSlugs.includes(oldSlug)) {
        mergedPreviousSlugs.push(oldSlug);
      }
    }
  } catch { /* first insert — no existing row */ }

  await client.execute({
    sql: `
      insert into products (
        id, slug, name, is_active, status, category, sub_category, description, short_description, image, image_alt,
        pdf_url, gallery, specifications, packaging, payment, filters, translations,
        seo_title, meta_description, focus_keyword, secondary_keywords, canonical_url,
        moq, origin_country, certifications, incoterms, destination_markets, packaging_options, lead_time, sample_policy,
        previous_slugs, appearance, pin_order, created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      on conflict(id) do update set
        slug = excluded.slug,
        name = excluded.name,
        is_active = excluded.is_active,
        status = excluded.status,
        category = excluded.category,
        sub_category = excluded.sub_category,
        description = excluded.description,
        short_description = excluded.short_description,
        image = excluded.image,
        image_alt = excluded.image_alt,
        pdf_url = excluded.pdf_url,
        gallery = excluded.gallery,
        specifications = excluded.specifications,
        packaging = excluded.packaging,
        payment = excluded.payment,
        filters = excluded.filters,
        translations = excluded.translations,
        seo_title = excluded.seo_title,
        meta_description = excluded.meta_description,
        focus_keyword = excluded.focus_keyword,
        secondary_keywords = excluded.secondary_keywords,
        canonical_url = excluded.canonical_url,
        moq = excluded.moq,
        origin_country = excluded.origin_country,
        certifications = excluded.certifications,
        incoterms = excluded.incoterms,
        destination_markets = excluded.destination_markets,
        packaging_options = excluded.packaging_options,
        lead_time = excluded.lead_time,
        sample_policy = excluded.sample_policy,
        previous_slugs = excluded.previous_slugs,
        appearance = excluded.appearance,
        pin_order = excluded.pin_order,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [
      String(product.id ?? ''),
      productSlug,
      String(product.name ?? ''),
      product.isActive === false ? 0 : 1,
      product.status || 'published',
      String(product.category ?? ''),
      String(product.subCategory ?? ''),
      String(product.description ?? ''),
      String(product.shortDescription ?? ''),
      String(product.image ?? ''),
      product.imageAlt?.trim() || null,
      product.pdfUrl?.trim() ? product.pdfUrl.trim() : null,
      stringifyJsonColumn(product.gallery, null),
      stringifyJsonColumn(product.specifications, {}),
      stringifyJsonColumn(product.packaging, {}),
      stringifyJsonColumn(product.payment, {}),
      stringifyJsonColumn(product.filters, {}),
      stringifyJsonColumn(product.translations, {}),
      product.seoTitle?.trim() || null,
      product.metaDescription?.trim() || null,
      product.focusKeyword?.trim() || null,
      stringifyJsonColumn(Array.isArray(product.secondaryKeywords) && product.secondaryKeywords.length > 0 ? product.secondaryKeywords : null, null),
      product.canonicalUrl?.trim() || null,
      product.moq?.trim() || null,
      product.originCountry?.trim() || null,
      stringifyJsonColumn(product.certifications, null),
      stringifyJsonColumn(product.incoterms, null),
      stringifyJsonColumn(product.destinationMarkets, null),
      stringifyJsonColumn(product.packagingOptions, null),
      product.leadTime?.trim() || null,
      product.samplePolicy?.trim() || null,
      stringifyJsonColumn(mergedPreviousSlugs.length > 0 ? mergedPreviousSlugs : null, null),
      product.appearance?.trim() || null,
      product.pinOrder != null ? Number(product.pinOrder) : null
    ]
  });

  const result = await client.execute({
    sql: 'select * from products where id = ? limit 1',
    args: [String(product.id ?? '')]
  });

  return mapProductRow(result.rows[0]);
};

export const updateProductRecord = async (client, product, oldId) => {
  const savedProduct = await upsertProduct(client, product);

  if (oldId && oldId !== product.id) {
    await client.execute({
      sql: 'delete from products where id = ?',
      args: [String(oldId)]
    });
  }

  return savedProduct;
};

export const deleteProductById = async (client, id) => {
  await client.execute({
    sql: 'delete from products where id = ?',
    args: [String(id)]
  });
};

// ── Product Categories (CRUD) ──────────────────────────────

const mapCategoryRow = (row) => ({
  id: String(row.id ?? ''),
  name: String(row.name ?? ''),
  slug: String(row.slug ?? ''),
  sortOrder: Number(row.sort_order ?? 0),
  isActive: Number(row.is_active ?? 1) !== 0
});

export const listCategories = async (client) => {
  const result = await client.execute('select * from product_categories order by sort_order asc, name asc');
  return result.rows.map(mapCategoryRow);
};

export const upsertCategory = async (client, category) => {
  const catSlug = category.slug?.trim() || slugify(category.name || category.id || 'category');
  await client.execute({
    sql: `
      insert into product_categories (id, name, slug, sort_order, is_active, updated_at)
      values (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      on conflict(id) do update set
        name = excluded.name,
        slug = excluded.slug,
        sort_order = excluded.sort_order,
        is_active = excluded.is_active,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [
      String(category.id ?? ''),
      String(category.name ?? ''),
      catSlug,
      Number(category.sortOrder ?? 0),
      category.isActive === false ? 0 : 1
    ]
  });

  const result = await client.execute({
    sql: 'select * from product_categories where id = ? limit 1',
    args: [String(category.id ?? '')]
  });

  return mapCategoryRow(result.rows[0]);
};

export const deleteCategoryById = async (client, id) => {
  await client.execute({
    sql: 'delete from product_categories where id = ?',
    args: [String(id)]
  });
};

export const upsertNews = async (client, item) => {
  const slug = await generateUniqueNewsSlug(client, item.slug, item.title, item.id);
  const scheduledAt = item.scheduledAt ? String(item.scheduledAt).trim() : null;
  const imageAlt = item.imageAlt ? String(item.imageAlt).trim() : null;
  const contentHtml = item.contentHtml ? String(item.contentHtml) : null;
  const seoTitle = item.seoTitle ? String(item.seoTitle).trim() : null;
  const metaDescription = item.metaDescription ? String(item.metaDescription).trim() : null;
  const focusKeyword = item.focusKeyword ? String(item.focusKeyword).trim() : null;
  const secondaryKeywords = Array.isArray(item.secondaryKeywords) && item.secondaryKeywords.length > 0
    ? stringifyJsonColumn(item.secondaryKeywords, null)
    : null;
  const relatedProducts = Array.isArray(item.relatedProducts) && item.relatedProducts.length > 0
    ? stringifyJsonColumn(item.relatedProducts, null)
    : null;

  await client.execute({
    sql: `
      insert into news (
        id, slug, title, is_active, date, category, excerpt, content, image, image_alt,
        scheduled_at, translations, related_products,
        content_html, seo_title, meta_description, focus_keyword, secondary_keywords,
        created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      on conflict(id) do update set
        slug = excluded.slug,
        title = excluded.title,
        is_active = excluded.is_active,
        date = excluded.date,
        category = excluded.category,
        excerpt = excluded.excerpt,
        content = excluded.content,
        image = excluded.image,
        image_alt = excluded.image_alt,
        scheduled_at = excluded.scheduled_at,
        translations = excluded.translations,
        related_products = excluded.related_products,
        content_html = excluded.content_html,
        seo_title = excluded.seo_title,
        meta_description = excluded.meta_description,
        focus_keyword = excluded.focus_keyword,
        secondary_keywords = excluded.secondary_keywords,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [
      String(item.id ?? ''),
      slug,
      String(item.title ?? ''),
      item.isActive === false ? 0 : 1,
      String(item.date ?? ''),
      String(item.category ?? ''),
      String(item.excerpt ?? ''),
      stringifyJsonColumn(item.content, []),
      String(item.image ?? ''),
      imageAlt,
      scheduledAt,
      stringifyJsonColumn(item.translations, {}),
      relatedProducts,
      contentHtml,
      seoTitle,
      metaDescription,
      focusKeyword,
      secondaryKeywords
    ]
  });

  const result = await client.execute({
    sql: 'select * from news where id = ? limit 1',
    args: [String(item.id ?? '')]
  });

  return mapNewsRow(result.rows[0]);
};

export const deleteNewsById = async (client, id) => {
  await client.execute({
    sql: 'delete from news where id = ?',
    args: [String(id)]
  });
};

export const upsertCareer = async (client, item) => {
  const id = String(item.id ?? '').trim() || `career-${Date.now()}`;

  await client.execute({
    sql: `
      insert into careers (
        id, title, department, location, type, description, requirements, is_active,
        created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      on conflict(id) do update set
        title = excluded.title,
        department = excluded.department,
        location = excluded.location,
        type = excluded.type,
        description = excluded.description,
        requirements = excluded.requirements,
        is_active = excluded.is_active,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [
      id,
      String(item.title ?? ''),
      String(item.department ?? ''),
      String(item.location ?? ''),
      String(item.type ?? 'Full-time'),
      String(item.description ?? ''),
      JSON.stringify(Array.isArray(item.requirements) ? item.requirements : []),
      item.isActive === false ? 0 : 1
    ]
  });

  const result = await client.execute({
    sql: 'select * from careers where id = ? limit 1',
    args: [id]
  });

  return mapCareerRow(result.rows[0]);
};

export const deleteCareerById = async (client, id) => {
  await client.execute({
    sql: 'delete from careers where id = ?',
    args: [String(id)]
  });
};

export const importContentSnapshot = async (client, snapshot) => {
  const products = Array.isArray(snapshot?.products) ? snapshot.products : [];
  const news = Array.isArray(snapshot?.news) ? snapshot.news : [];

  for (const product of products) {
    await upsertProduct(client, product);
  }

  for (const item of news) {
    await upsertNews(client, item);
  }
};

export const insertContactInquiry = async (client, inquiry) => {
  await client.execute({
    sql: `
      insert into contact_inquiries (
        company_name, full_name, email, phone_whatsapp, subject, message
      ) values (?, ?, ?, ?, ?, ?)
    `,
    args: [
      String(inquiry.companyName ?? ''),
      String(inquiry.fullName ?? ''),
      String(inquiry.email ?? ''),
      inquiry.phone ? String(inquiry.phone) : null,
      String(inquiry.subject ?? ''),
      String(inquiry.message ?? '')
    ]
  });
};

export const insertQuotationRequest = async (client, inquiry) => {
  const normalizedItems = Array.from(
    new Map(
      (
        Array.isArray(inquiry?.items) && inquiry.items.length > 0
          ? inquiry.items
          : inquiry?.productId
            ? [
                {
                  productId: inquiry.productId,
                  productName: inquiry.productName,
                  targetSpecs: inquiry.targetSpecs
                }
              ]
            : []
      )
        .map((item) => ({
          productId: String(item?.productId ?? '').trim(),
          productName: String(item?.productName ?? '').trim(),
          targetSpecs: String(item?.targetSpecs ?? '').trim()
        }))
        .filter((item) => item.productId)
        .map((item) => [item.productId, item])
    ).values()
  );

  if (!String(inquiry?.fullName ?? '').trim()) {
    throw new Error('Full name is required.');
  }

  if (!String(inquiry?.email ?? '').trim()) {
    throw new Error('Email is required.');
  }

  if (normalizedItems.length === 0) {
    throw new Error('At least one product is required for an RFQ.');
  }

  if (!String(inquiry?.destinationPort ?? '').trim()) {
    throw new Error('Destination port is required.');
  }

  if (!String(inquiry?.incoterm ?? '').trim()) {
    throw new Error('Incoterm is required.');
  }

  if (!String(inquiry?.monthlyVolume ?? inquiry?.orderVolume ?? '').trim()) {
    throw new Error('Monthly volume is required.');
  }

  if (!String(inquiry?.message ?? '').trim()) {
    throw new Error('Message is required.');
  }

  const attachments = Array.isArray(inquiry?.attachments)
    ? inquiry.attachments
        .map((item) => ({
          publicUrl: String(item?.publicUrl ?? '').trim(),
          fileName: String(item?.fileName ?? '').trim(),
          contentType: String(item?.contentType ?? '').trim(),
          sizeBytes: Number(item?.sizeBytes ?? 0) || 0
        }))
        .filter((item) => item.publicUrl && item.fileName)
    : [];

  const primaryProductId = normalizedItems[0]?.productId || '';
  await client.execute({
    sql: `
      insert into quotation_requests (
        product_id, full_name, email, company_name, phone_whatsapp, destination_port, incoterm,
        order_volume, packaging, payment_terms, certification_needed, timeline, message,
        items_count, attachments_json
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      primaryProductId,
      String(inquiry.fullName ?? '').trim(),
      String(inquiry.email ?? '').trim(),
      inquiry.companyName ? String(inquiry.companyName).trim() : null,
      inquiry.phoneWhatsapp ? String(inquiry.phoneWhatsapp).trim() : null,
      String(inquiry.destinationPort ?? '').trim(),
      String(inquiry.incoterm ?? '').trim(),
      String(inquiry.monthlyVolume ?? inquiry.orderVolume ?? '').trim(),
      inquiry.packaging ? String(inquiry.packaging).trim() : null,
      inquiry.paymentTerms ? String(inquiry.paymentTerms).trim() : null,
      inquiry.certificationNeeded ? String(inquiry.certificationNeeded).trim() : null,
      inquiry.timeline ? String(inquiry.timeline).trim() : null,
      String(inquiry.message ?? '').trim(),
      normalizedItems.length,
      stringifyJsonColumn(attachments, [])
    ]
  });

  const requestIdResult = await client.execute('select last_insert_rowid() as id');
  const requestId = Number(requestIdResult.rows[0]?.id ?? 0);

  for (const item of normalizedItems) {
    await client.execute({
      sql: `
        insert into quotation_request_items (
          quotation_request_id, product_id, product_name, target_specs
        ) values (?, ?, ?, ?)
      `,
      args: [requestId, item.productId, item.productName || item.productId, item.targetSpecs || null]
    });
  }
};

export const findAdminByEmail = async (client, email) => {
  const result = await client.execute({
    sql: 'select * from admin_users where lower(email) = lower(?) limit 1',
    args: [String(email ?? '')]
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: Number(row.id),
    email: String(row.email ?? ''),
    passwordHash: String(row.password_hash ?? '')
  };
};

export const upsertAdminUser = async (client, admin) => {
  await client.execute({
    sql: `
      insert into admin_users (email, password_hash, created_at, updated_at)
      values (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      on conflict(email) do update set
        password_hash = excluded.password_hash,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [String(admin.email ?? '').toLowerCase(), String(admin.passwordHash ?? '')]
  });
};

export const listProvinceMapProfiles = async (client) => {
  const result = await client.execute('select * from province_map_profiles order by province_id asc');
  return result.rows.map(mapProvinceMapProfileRow);
};

export const upsertProvinceMapProfile = async (client, profile) => {
  const provinceId = String(profile?.provinceId ?? '').trim();
  const existingResult = provinceId
    ? await client.execute({
        sql: `
          select headline, overview, export_produce_count, growing_zones
          from province_map_profiles
          where province_id = ?
          limit 1
        `,
        args: [provinceId]
      })
    : { rows: [] };
  const existingRow = existingResult.rows[0] ?? {};
  const normalizedProfile = {
    provinceId,
    headline: normalizeTextColumn(profile?.headline ?? existingRow.headline),
    overview: normalizeTextColumn(profile?.overview ?? existingRow.overview),
    exportProduceCount: normalizeNonNegativeInteger(
      profile?.exportProduceCount ?? existingRow.export_produce_count,
      0
    ),
    growingZones: normalizeNonNegativeInteger(profile?.growingZones ?? existingRow.growing_zones, 0),
    gpsLatitude: normalizeNullableNumber(profile?.gpsLatitude),
    gpsLongitude: normalizeNullableNumber(profile?.gpsLongitude),
    cultivatedAreaHectares: normalizeNullableNumber(profile?.cultivatedAreaHectares),
    averageOutputMtPerYear: normalizeNullableNumber(profile?.averageOutputMtPerYear),
    sowingPeriod: normalizeTextColumn(profile?.sowingPeriod),
    harvestPeriod: normalizeTextColumn(profile?.harvestPeriod),
    cropsPerYear: normalizeNullableNumber(profile?.cropsPerYear),
    characteristics: normalizeTextColumn(profile?.characteristics),
    varieties: normalizeTextColumn(profile?.varieties),
    products: Array.isArray(profile?.products) ? profile.products : []
  };

  await client.execute({
    sql: `
      insert into province_map_profiles (
        province_id, headline, overview, export_produce_count, growing_zones, gps_latitude, gps_longitude,
        cultivated_area_hectares, average_output_mt_per_year, sowing_period, harvest_period, crops_per_year,
        characteristics, varieties, products, created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      on conflict(province_id) do update set
        headline = excluded.headline,
        overview = excluded.overview,
        export_produce_count = excluded.export_produce_count,
        growing_zones = excluded.growing_zones,
        gps_latitude = excluded.gps_latitude,
        gps_longitude = excluded.gps_longitude,
        cultivated_area_hectares = excluded.cultivated_area_hectares,
        average_output_mt_per_year = excluded.average_output_mt_per_year,
        sowing_period = excluded.sowing_period,
        harvest_period = excluded.harvest_period,
        crops_per_year = excluded.crops_per_year,
        characteristics = excluded.characteristics,
        varieties = excluded.varieties,
        products = excluded.products,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [
      normalizedProfile.provinceId,
      normalizedProfile.headline,
      normalizedProfile.overview,
      normalizedProfile.exportProduceCount,
      normalizedProfile.growingZones,
      normalizedProfile.gpsLatitude,
      normalizedProfile.gpsLongitude,
      normalizedProfile.cultivatedAreaHectares,
      normalizedProfile.averageOutputMtPerYear,
      normalizedProfile.sowingPeriod,
      normalizedProfile.harvestPeriod,
      normalizedProfile.cropsPerYear,
      normalizedProfile.characteristics,
      normalizedProfile.varieties,
      stringifyJsonColumn(normalizedProfile.products, [])
    ]
  });

  const result = await client.execute({
    sql: 'select * from province_map_profiles where province_id = ? limit 1',
    args: [normalizedProfile.provinceId]
  });

  return mapProvinceMapProfileRow(result.rows[0]);
};

export const deleteProvinceMapProfileById = async (client, provinceId) => {
  await client.execute({
    sql: 'delete from province_map_profiles where province_id = ?',
    args: [String(provinceId ?? '')]
  });
};

export const insertPersonalizationEvent = async (client, event) => {
  const normalizedEvent = {
    id: String(event?.id ?? crypto.randomUUID()),
    visitorId: String(event?.visitorId ?? '').trim(),
    ipHash: String(event?.ipHash ?? '').trim(),
    userAgentHash: String(event?.userAgentHash ?? '').trim(),
    entityType: String(event?.entityType ?? '').trim(),
    action: String(event?.action ?? '').trim(),
    itemId: event?.itemId ? String(event.itemId).trim() : null,
    route: event?.route ? String(event.route).trim() : null,
    category: event?.category ? String(event.category).trim() : null,
    subCategory: event?.subCategory ? String(event.subCategory).trim() : null,
    newsCategory: event?.newsCategory ? String(event.newsCategory).trim() : null,
    locale: event?.locale ? String(event.locale).trim() : null,
    weight: Number.isFinite(Number(event?.weight)) ? Number(event.weight) : 1,
    metadata: stringifyJsonColumn(event?.metadata, {})
  };

  await client.execute({
    sql: `
      insert into personalization_events (
        id, visitor_id, ip_hash, user_agent_hash, entity_type, action, item_id, route,
        category, sub_category, news_category, locale, weight, metadata, created_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    args: [
      normalizedEvent.id,
      normalizedEvent.visitorId,
      normalizedEvent.ipHash,
      normalizedEvent.userAgentHash || null,
      normalizedEvent.entityType,
      normalizedEvent.action,
      normalizedEvent.itemId,
      normalizedEvent.route,
      normalizedEvent.category,
      normalizedEvent.subCategory,
      normalizedEvent.newsCategory,
      normalizedEvent.locale,
      normalizedEvent.weight,
      normalizedEvent.metadata
    ]
  });

  const result = await client.execute({
    sql: 'select * from personalization_events where id = ? limit 1',
    args: [normalizedEvent.id]
  });

  return mapPersonalizationEventRow(result.rows[0]);
};

export const listPersonalizationEventsByVisitor = async (client, visitorId, limit = 250) => {
  const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 250));
  const result = await client.execute({
    sql: `
      select *
      from personalization_events
      where visitor_id = ?
        and created_at >= datetime('now', '-90 days')
      order by created_at desc, id desc
      limit ${safeLimit}
    `,
    args: [String(visitorId ?? '').trim()]
  });

  return result.rows.map(mapPersonalizationEventRow);
};

export const listRecentPersonalizationProfiles = async (client, options = {}) => {
  const excludeVisitorId = String(options?.excludeVisitorId ?? '').trim();
  const safeLimit = Math.max(1, Math.min(200, Number(options?.limit) || 60));
  const hasExclusion = Boolean(excludeVisitorId);
  const result = await client.execute({
    sql: `
      select *
      from personalization_profiles
      ${hasExclusion ? 'where visitor_id != ?' : ''}
      order by updated_at desc, visitor_id asc
      limit ${safeLimit}
    `,
    args: hasExclusion ? [excludeVisitorId] : []
  });

  return result.rows.map(mapPersonalizationProfileRow);
};

export const listRecentPersonalizationEventsByVisitors = async (client, visitorIds, limit = 500) => {
  const safeVisitorIds = Array.from(
    new Set((Array.isArray(visitorIds) ? visitorIds : []).map((value) => String(value ?? '').trim()).filter(Boolean))
  );
  if (safeVisitorIds.length === 0) {
    return [];
  }

  const safeLimit = Math.max(1, Math.min(2000, Number(limit) || 500));
  const placeholders = safeVisitorIds.map(() => '?').join(', ');
  const result = await client.execute({
    sql: `
      select *
      from personalization_events
      where visitor_id in (${placeholders})
        and created_at >= datetime('now', '-90 days')
      order by created_at desc, id desc
      limit ${safeLimit}
    `,
    args: safeVisitorIds
  });

  return result.rows.map(mapPersonalizationEventRow);
};

export const findPersonalizationProfileByVisitor = async (client, visitorId) => {
  const result = await client.execute({
    sql: `
      select *
      from personalization_profiles
      where visitor_id = ?
      limit 1
    `,
    args: [String(visitorId ?? '').trim()]
  });

  if (result.rows.length === 0) {
    return null;
  }

  return mapPersonalizationProfileRow(result.rows[0]);
};

export const upsertPersonalizationProfile = async (client, payload) => {
  const normalizedPayload = {
    visitorId: String(payload?.visitorId ?? '').trim(),
    ipHash: String(payload?.ipHash ?? '').trim(),
    userAgentHash: String(payload?.userAgentHash ?? '').trim(),
    segment: String(payload?.segment ?? '').trim(),
    summary: String(payload?.summary ?? '').trim(),
    profile: stringifyJsonColumn(payload?.profile, {}),
    lastActiveAt: payload?.lastActiveAt ? String(payload.lastActiveAt).trim() : null
  };

  await client.execute({
    sql: `
      insert into personalization_profiles (
        visitor_id, ip_hash, user_agent_hash, segment, summary, profile_json, last_active_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      on conflict(visitor_id) do update set
        ip_hash = excluded.ip_hash,
        user_agent_hash = excluded.user_agent_hash,
        segment = excluded.segment,
        summary = excluded.summary,
        profile_json = excluded.profile_json,
        last_active_at = excluded.last_active_at,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [
      normalizedPayload.visitorId,
      normalizedPayload.ipHash,
      normalizedPayload.userAgentHash,
      normalizedPayload.segment,
      normalizedPayload.summary,
      normalizedPayload.profile,
      normalizedPayload.lastActiveAt
    ]
  });

  return findPersonalizationProfileByVisitor(client, normalizedPayload.visitorId);
};
