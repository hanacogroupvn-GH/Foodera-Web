import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const DEFAULT_API_BASE_URL = 'http://localhost:8787';

const parseEnvFile = async (filePath) => {
  const raw = await fs.readFile(filePath, 'utf8');
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separatorIndex = line.indexOf('=');
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();
        return [key, value];
      })
  );
};

const requestJson = async (url, init = {}) => {
  const response = await fetch(url, init);
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      typeof payload === 'string'
        ? payload
        : String(payload?.error ?? payload?.message ?? `${response.status} ${response.statusText}`);
    throw new Error(errorMessage);
  }

  return {
    payload,
    headers: response.headers
  };
};

const toProductEntry = (product, location) => ({
  name: String(product?.name ?? '').trim(),
  location: String(location ?? '').trim(),
  zoneCount: 1
});

const sortByName = (items) =>
  [...items].sort((left, right) => String(left?.name ?? '').localeCompare(String(right?.name ?? '')));

const buildProfileDefinitions = (products) => {
  const arabica = sortByName(products.filter((item) => item.category === 'Coffee' && item.subCategory === 'Arabica Coffee'));
  const robusta = sortByName(products.filter((item) => item.category === 'Coffee' && item.subCategory === 'Robusta Coffee'));
  const cashew = sortByName(products.filter((item) => item.category === 'Cashew'));
  const watermelon = sortByName(products.filter((item) => item.id === 'AGR-FZW-WMLN-D20-FW'));

  if (arabica.length === 0) {
    throw new Error('Missing Arabica coffee products in API content snapshot.');
  }

  if (robusta.length === 0) {
    throw new Error('Missing Robusta coffee products in API content snapshot.');
  }

  if (cashew.length === 0) {
    throw new Error('Missing cashew products in API content snapshot.');
  }

  if (watermelon.length !== 1) {
    throw new Error('Expected exactly one Frozen Diced Watermelon product in API content snapshot.');
  }

  return [
    {
      provinceId: 'son-la',
      headline: 'Existing Arabica SKUs anchored to Son La highland supply',
      overview:
        "This profile is limited to the Arabica coffee SKUs already stored in the Foodmax database. In your current catalog, both Arabica lines are fully washed Grade 1 programs differentiated by screen size. Son La's official portal describes the province as Vietnam's Arabica coffee capital, with more than 24,300 hectares and roughly half of the national Arabica area in 2025. That makes Son La the cleanest province-level anchor in the current map for the existing Arabica SKUs without introducing any extra coffee line.",
      exportProduceCount: arabica.length,
      growingZones: 1,
      products: arabica.map((product) => toProductEntry(product, 'Son La'))
    },
    {
      provinceId: 'dak-lak',
      headline: 'Existing Robusta programs anchored to Dak Lak export coffee',
      overview:
        "This profile is limited to the Robusta coffee SKUs already stored in the Foodmax database. In your current catalog, the Robusta lines cover cleaned, wet polished, and 2% black and broken programs across Screen 16, Screen 18, and a Grade 2 Screen 13 option. Dak Lak's official portal identifies coffee as the province's leading export crop with average output around 400,000 tons, and Buon Ma Thuot is presented as the homeland of the world's best Robusta coffee beans. That makes Dak Lak the strongest province-level anchor for the existing Robusta SKUs in your catalog.",
      exportProduceCount: robusta.length,
      growingZones: 1,
      products: robusta.map((product) => toProductEntry(product, 'Buon Ma Thuot, Dak Lak'))
    },
    {
      provinceId: 'dong-nai',
      headline: 'Existing cashew kernel catalog anchored to Dong Nai processing',
      overview:
        "This profile is limited to the cashew kernel SKUs already stored in the Foodmax database. Your current catalog covers whole, scorched, testa, split, piece, and roasted salted cashew lines. Dong Nai's official portal lists cashew among the province's four main agricultural exports, with more than 33.9 thousand hectares of cashew and a processing base of 50 establishments plus hundreds of processing households. Within the current 34-province map, Dong Nai is a defensible anchor for the existing cashew catalog without creating any new SKU.",
      exportProduceCount: cashew.length,
      growingZones: 1,
      products: cashew.map((product) => toProductEntry(product, 'Dong Nai'))
    },
    {
      provinceId: 'gia-lai',
      headline: 'Existing frozen watermelon SKU anchored to Gia Lai crop supply',
      overview:
        "This profile is limited to the Frozen Diced Watermelon SKU already stored in the Foodmax database. The current product copy positions it as IQF diced watermelon made from ripe Vietnamese fruit for food manufacturing and horeca use. Bao Gia Lai reported on March 26, 2026 that Gia Lai had nearly 2,500 hectares of watermelon in the 2025-2026 winter-spring crop, with provincial authorities actively supporting consumption. Within the current map, Gia Lai is the cleanest province-level anchor available for your existing watermelon item without introducing any extra fruit SKU.",
      exportProduceCount: watermelon.length,
      growingZones: 1,
      products: watermelon.map((product) => toProductEntry(product, 'Gia Lai'))
    }
  ];
};

const run = async () => {
  const envFilePath = path.join(repoRoot, '.env');
  const env = await parseEnvFile(envFilePath);
  const apiBaseUrl = String(env.FOODMAX_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
  const adminEmail = String(env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const adminPassword = String(env.ADMIN_PASSWORD || env.ADMIN_BOOTSTRAP_PASSWORD || '').trim();

  if (!adminEmail || !adminPassword) {
    throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env');
  }

  const contentResponse = await requestJson(`${apiBaseUrl}/api/content`);
  const allProducts = Array.isArray(contentResponse.payload?.products) ? contentResponse.payload.products : [];
  const profileDefinitions = buildProfileDefinitions(allProducts);

  const loginResponse = await requestJson(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword
    })
  });

  const cookie = loginResponse.headers.get('set-cookie');
  if (!cookie) {
    throw new Error('Login succeeded without a session cookie.');
  }

  for (const profile of profileDefinitions) {
    await requestJson(`${apiBaseUrl}/api/admin/map-profiles/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie
      },
      body: JSON.stringify({ profile })
    });

    console.log(`upserted ${profile.provinceId} (${profile.products.length} products)`);
  }

  const verification = await requestJson(`${apiBaseUrl}/api/map-profiles`);
  const profiles = Array.isArray(verification.payload?.profiles) ? verification.payload.profiles : [];
  const selectedProfiles = profiles
    .filter((item) => ['son-la', 'dak-lak', 'dong-nai', 'gia-lai'].includes(String(item?.provinceId ?? '')))
    .map((item) => ({
      provinceId: item.provinceId,
      exportProduceCount: item.exportProduceCount,
      growingZones: item.growingZones,
      productNames: Array.isArray(item.products) ? item.products.map((product) => product.name) : []
    }))
    .sort((left, right) => String(left.provinceId).localeCompare(String(right.provinceId)));

  console.log(JSON.stringify(selectedProfiles, null, 2));
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
