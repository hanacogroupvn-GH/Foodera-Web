/**
 * repair-mojibake-db.mjs
 * Repairs mojibake (garbled Chinese text) stored in the Turso database.
 * Affects: products.translations, news.translations
 *
 * Usage:
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/repair-mojibake-db.mjs
 *   OR (with .env loaded):
 *   node --env-file=.env scripts/repair-mojibake-db.mjs
 */

import { createClient } from '@libsql/client';

// ─── Mojibake repair logic (mirrors lib/repairMojibake.ts) ──────────────────
const MOJIBAKE_MARKER_REGEX = /[À-ÿ]{2,}/;
const CJK_REGEX = /[\u3400-\u9fff]/g;

const countMatches = (value, pattern) => value.match(pattern)?.length ?? 0;

const decodeLatin1AsUtf8 = (value) => {
  const bytes = Uint8Array.from(Array.from(value).map((ch) => ch.charCodeAt(0) & 0xff));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
};

const scoreDecodedText = (value) =>
  countMatches(value, CJK_REGEX) * 4 - countMatches(value, MOJIBAKE_MARKER_REGEX) * 3;

const repairMojibakeText = (value) => {
  let current = value;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!MOJIBAKE_MARKER_REGEX.test(current)) break;
    let decoded = current;
    try {
      decoded = decodeLatin1AsUtf8(current);
    } catch {
      break;
    }
    if (decoded === current || scoreDecodedText(decoded) < scoreDecodedText(current)) break;
    current = decoded;
  }
  return current;
};

const repairMojibakeDeep = (value) => {
  if (typeof value === 'string') return repairMojibakeText(value);
  if (Array.isArray(value)) return value.map(repairMojibakeDeep);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, repairMojibakeDeep(v)])
    );
  return value;
};

// ─── Database connection ─────────────────────────────────────────────────────
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required.');
  console.error('   Run: node --env-file=.env scripts/repair-mojibake-db.mjs');
  process.exit(1);
}

const client = createClient({ url, authToken });

// ─── Repair helper ────────────────────────────────────────────────────────────
const repairTable = async ({ table, idCol, extraCols = [] }) => {
  console.log(`\n📦 Repairing table: ${table}`);
  const cols = ['translations', ...extraCols].join(', ');
  const rows = (await client.execute(`SELECT ${idCol}, ${cols} FROM ${table}`)).rows;

  let repaired = 0;
  let skipped = 0;

  for (const row of rows) {
    const id = row[idCol];
    const updates = {};

    // Repair translations JSON
    try {
      const raw = typeof row.translations === 'string' ? row.translations : JSON.stringify(row.translations ?? {});
      const parsed = JSON.parse(raw);
      const fixed = repairMojibakeDeep(parsed);
      const fixedStr = JSON.stringify(fixed);
      if (fixedStr !== raw) updates.translations = fixedStr;
    } catch {
      console.warn(`  ⚠ Could not parse translations for ${table}.${id}`);
    }

    // Repair extra text columns
    for (const col of extraCols) {
      const val = row[col];
      if (typeof val === 'string') {
        const fixed = repairMojibakeText(val);
        if (fixed !== val) updates[col] = fixed;
      }
    }

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    const setClauses = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    await client.execute({ sql: `UPDATE ${table} SET ${setClauses} WHERE ${idCol} = ?`, args: values });

    console.log(`  ✅ Fixed ${table} [${id}]: ${Object.keys(updates).join(', ')}`);
    repaired++;
  }

  console.log(`  → ${repaired} repaired, ${skipped} already clean out of ${rows.length} rows.`);
  return repaired;
};

// ─── Main ────────────────────────────────────────────────────────────────────
const main = async () => {
  console.log('🔧 Foodera DB Mojibake Repair Script');
  console.log(`   Database: ${url}`);

  let total = 0;

  total += await repairTable({
    table: 'products',
    idCol: 'id',
    extraCols: ['name', 'description', 'short_description', 'sub_category']
  });

  total += await repairTable({
    table: 'news',
    idCol: 'id',
    extraCols: ['title', 'excerpt', 'content']
  });

  console.log(`\n✨ Done! Total records repaired: ${total}`);
  process.exit(0);
};

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
