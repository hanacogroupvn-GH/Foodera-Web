import { createClient } from '@libsql/client';
import crypto from 'node:crypto';

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
      translations text not null default '{}',
      created_at text not null default CURRENT_TIMESTAMP,
      updated_at text not null default CURRENT_TIMESTAMP
    )
  `,
  'create index if not exists idx_news_date on news(date desc)',
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
      order_volume text,
      message text not null,
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

export const ensureDatabaseSchema = async (client) => {
  for (const statement of SCHEMA_STATEMENTS) {
    await client.execute(statement);
  }

  const provinceMapProfileColumns = await client.execute('pragma table_info(province_map_profiles)');
  const existingColumnNames = new Set(provinceMapProfileColumns.rows.map((row) => String(row.name ?? '').trim()));

  for (const [columnName, columnDefinition] of PROVINCE_MAP_PROFILE_COLUMNS) {
    if (existingColumnNames.has(columnName)) {
      continue;
    }

    await client.execute(`alter table province_map_profiles add column ${columnName} ${columnDefinition}`);
  }
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
  name: String(row.name ?? ''),
  isActive: Number(row.is_active ?? 1) !== 0,
  category: String(row.category ?? ''),
  subCategory: String(row.sub_category ?? ''),
  description: String(row.description ?? ''),
  shortDescription: String(row.short_description ?? ''),
  image: String(row.image ?? ''),
  pdfUrl: row.pdf_url ? String(row.pdf_url) : undefined,
  gallery: parseJsonColumn(row.gallery, undefined),
  specifications: parseJsonColumn(row.specifications, {}),
  packaging: parseJsonColumn(row.packaging, {}),
  payment: parseJsonColumn(row.payment, {}),
  filters: parseJsonColumn(row.filters, {}),
  translations: parseJsonColumn(row.translations, undefined)
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
  image: String(row.image ?? ''),
  translations: parseJsonColumn(row.translations, undefined)
});

const mapProvinceMapProfileRow = (row) => ({
  provinceId: String(row.province_id ?? ''),
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

export const listProducts = async (client) => {
  const result = await client.execute('select * from products order by id asc');
  return result.rows.map(mapProductRow);
};

export const listNews = async (client) => {
  const result = await client.execute('select * from news order by date desc, id desc');
  return result.rows.map(mapNewsRow);
};

export const getContentSnapshot = async (client) => {
  const [products, news] = await Promise.all([listProducts(client), listNews(client)]);
  return { products, news };
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
  await client.execute({
    sql: `
      insert into products (
        id, name, is_active, category, sub_category, description, short_description, image,
        pdf_url, gallery, specifications, packaging, payment, filters, translations, created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      on conflict(id) do update set
        name = excluded.name,
        is_active = excluded.is_active,
        category = excluded.category,
        sub_category = excluded.sub_category,
        description = excluded.description,
        short_description = excluded.short_description,
        image = excluded.image,
        pdf_url = excluded.pdf_url,
        gallery = excluded.gallery,
        specifications = excluded.specifications,
        packaging = excluded.packaging,
        payment = excluded.payment,
        filters = excluded.filters,
        translations = excluded.translations,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [
      String(product.id ?? ''),
      String(product.name ?? ''),
      product.isActive === false ? 0 : 1,
      String(product.category ?? ''),
      String(product.subCategory ?? ''),
      String(product.description ?? ''),
      String(product.shortDescription ?? ''),
      String(product.image ?? ''),
      product.pdfUrl?.trim() ? product.pdfUrl.trim() : null,
      stringifyJsonColumn(product.gallery, null),
      stringifyJsonColumn(product.specifications, {}),
      stringifyJsonColumn(product.packaging, {}),
      stringifyJsonColumn(product.payment, {}),
      stringifyJsonColumn(product.filters, {}),
      stringifyJsonColumn(product.translations, {})
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

export const upsertNews = async (client, item) => {
  const slug = await generateUniqueNewsSlug(client, item.slug, item.title, item.id);

  await client.execute({
    sql: `
      insert into news (
        id, slug, title, is_active, date, category, excerpt, content, image, translations, created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      on conflict(id) do update set
        slug = excluded.slug,
        title = excluded.title,
        is_active = excluded.is_active,
        date = excluded.date,
        category = excluded.category,
        excerpt = excluded.excerpt,
        content = excluded.content,
        image = excluded.image,
        translations = excluded.translations,
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
      stringifyJsonColumn(item.translations, {})
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
  await client.execute({
    sql: `
      insert into quotation_requests (
        product_id, full_name, email, company_name, order_volume, message
      ) values (?, ?, ?, ?, ?, ?)
    `,
    args: [
      String(inquiry.productId ?? ''),
      String(inquiry.fullName ?? ''),
      String(inquiry.email ?? ''),
      inquiry.companyName ? String(inquiry.companyName) : null,
      inquiry.orderVolume ? String(inquiry.orderVolume) : null,
      String(inquiry.message ?? '')
    ]
  });
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
