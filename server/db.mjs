import { createClient } from '@libsql/client/web';
import crypto from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SCHEMA_STATEMENTS = [
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

export const createDatabaseConnection = async (
  env = process.env,
  options = {}
) => {
  const config = resolveDatabaseConfig(env, options);

  if (config.localPath) {
    mkdirSync(path.dirname(config.localPath), { recursive: true });
  }

  // The `/web` client only understands http(s)/wss/libsql URLs, not `file:`.
  // Local SQLite mode needs the Node client instead; it's only reached in
  // local Node development, never in the serverless/Turso path.
  const createLocalClient =
    config.mode === 'local'
      ? (await import('@libsql/client')).createClient
      : createClient;

  return {
    client: createLocalClient({
      url: config.url,
      authToken: config.authToken
    }),
    config
  };
};

export const ensureDatabaseSchema = async (client) => {
  for (const statement of SCHEMA_STATEMENTS) {
    await client.execute(statement);
  }

  await client.execute('drop table if exists careers');

  const quotationRequestColumns = await client.execute('pragma table_info(quotation_requests)');
  const existingQuotationRequestColumns = new Set(quotationRequestColumns.rows.map((row) => String(row.name ?? '').trim()));

  for (const [columnName, columnDefinition] of QUOTATION_REQUEST_COLUMNS) {
    if (existingQuotationRequestColumns.has(columnName)) {
      continue;
    }

    await client.execute(`alter table quotation_requests add column ${columnName} ${columnDefinition}`);
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

