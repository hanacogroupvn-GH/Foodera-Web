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

const PRODUCT_IDS = Object.freeze({
  jasmine85: 'RIC-JAS-85-FW',
  om5451: 'RIC-OM5451-FW',
  rice50425: 'RICE-504-25',
  rice5045: 'RICE-504-5',
  rice54515: 'RICE-5451-5',
  calrose5: 'RICE-CALROSE-5',
  dt85: 'RICE-DT8-5',
  jasmine5: 'RICE-JASMINE-5'
});

const PROFILE_DEFINITIONS = [
  {
    provinceId: 'can-tho',
    headline: 'Current rice SKUs aligned with Can Tho traceability records',
    overview:
      "This profile is limited to rice products already stored in the Foodmax database. The mapped catalog lines here are the existing Jasmine, OM5451, DT8, and Calrose SKUs. In your current product copy, the Jasmine lines are positioned as fragrant export rice and the OM5451 line as a stable long-grain white program. Can Tho's official traceability system shows Jasmine 85, Jasmine rice, OM5451, and Dai Thom 8 lots in Co Do district, so those existing project SKUs are attached here without introducing any new product line. The Calrose SKU remains country-level only in the current catalog, so it stays tagged as Vietnam rather than a province-specific claim.",
    productRefs: [
      {
        productId: PRODUCT_IDS.jasmine85,
        location: 'Thanh Hung hamlet, Thanh Phu commune, Co Do district, Can Tho'
      },
      {
        productId: PRODUCT_IDS.jasmine5,
        location: 'Thoi Trung hamlet, Thoi Dong commune, Co Do district, Can Tho'
      },
      {
        productId: PRODUCT_IDS.om5451,
        location: 'Phuoc Loc hamlet, Thanh Phuoc commune, Co Do district, Can Tho'
      },
      {
        productId: PRODUCT_IDS.rice54515,
        location: 'Phuoc Loc hamlet, Thanh Phuoc commune, Co Do district, Can Tho'
      },
      {
        productId: PRODUCT_IDS.dt85,
        location: 'Dong My hamlet, Dong Hiep commune, Co Do district, Can Tho'
      },
      {
        productId: PRODUCT_IDS.calrose5,
        location: 'Vietnam'
      }
    ]
  },
  {
    provinceId: 'an-giang',
    headline: 'Current 504 catalog lines anchored to An Giang rice structure',
    overview:
      "This profile is limited to the existing 504 rice SKUs already stored in the Foodmax database. In your current catalog copy, both 504 lines are positioned as mainstream long-grain white rice programs for value and volume supply. An Giang's official agriculture reporting lists IR50404 among the district's main winter-spring varieties, which makes An Giang the cleanest province-level anchor available in the current map for your existing 504 products.",
    productRefs: [
      {
        productId: PRODUCT_IDS.rice50425,
        location: 'Phu Huu commune, An Phu district, An Giang'
      },
      {
        productId: PRODUCT_IDS.rice5045,
        location: 'Phu Huu commune, An Phu district, An Giang'
      }
    ]
  }
];

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
  const riceProductsById = new Map(
    allProducts
      .filter((item) => String(item?.category ?? '') === 'Rice')
      .map((item) => [String(item.id ?? ''), item])
  );

  for (const productId of Object.values(PRODUCT_IDS)) {
    if (!riceProductsById.has(productId)) {
      throw new Error(`Missing rice product in API content snapshot: ${productId}`);
    }
  }

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

  for (const definition of PROFILE_DEFINITIONS) {
    const products = definition.productRefs.map((item) => {
      const product = riceProductsById.get(item.productId);
      if (!product) {
        throw new Error(`Missing mapped product row: ${item.productId}`);
      }

      return {
        name: String(product.name ?? '').trim(),
        location: item.location,
        zoneCount: 1
      };
    });

    await requestJson(`${apiBaseUrl}/api/admin/map-profiles/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie
      },
      body: JSON.stringify({
        profile: {
          provinceId: definition.provinceId,
          headline: definition.headline,
          overview: definition.overview,
          exportProduceCount: products.length,
          growingZones: products.length,
          products
        }
      })
    });

    console.log(`upserted ${definition.provinceId}`);
  }

  const verification = await requestJson(`${apiBaseUrl}/api/map-profiles`);
  const profiles = Array.isArray(verification.payload?.profiles) ? verification.payload.profiles : [];
  const selectedProfiles = profiles
    .filter((item) => ['can-tho', 'an-giang'].includes(String(item?.provinceId ?? '')))
    .map((item) => ({
      provinceId: item.provinceId,
      exportProduceCount: item.exportProduceCount,
      growingZones: item.growingZones,
      productNames: Array.isArray(item.products) ? item.products.map((product) => product.name) : []
    }));

  console.log(JSON.stringify(selectedProfiles, null, 2));
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
