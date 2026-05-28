/**
 * repair-source-mojibake.mjs
 * Repairs Windows-1252 mojibake in TypeScript source files.
 * The file was saved with Chinese UTF-8 bytes misinterpreted as Windows-1252.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Windows-1252 → Unicode mapping for the 0x80–0x9F range (the tricky part)
const WIN1252_MAP = {
  0x80: 0x20AC, 0x81: 0x0081, 0x82: 0x201A, 0x83: 0x0192,
  0x84: 0x201E, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021,
  0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039,
  0x8C: 0x0152, 0x8D: 0x008D, 0x8E: 0x017D, 0x8F: 0x008F,
  0x90: 0x0090, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C,
  0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A,
  0x9C: 0x0153, 0x9D: 0x009D, 0x9E: 0x017E, 0x9F: 0x0178,
};
// Reverse: Unicode → byte for 0x80-0x9F
const UNICODE_TO_WIN1252 = Object.fromEntries(
  Object.entries(WIN1252_MAP).map(([byte, cp]) => [cp, Number(byte)])
);

/**
 * Convert a Unicode code point back to its Windows-1252 byte value.
 * For U+00A0–U+00FF these map directly (same as Latin-1).
 * For U+0000–U+007F these map directly.
 * For the special 0x80–0x9F range, use the reverse map.
 */
const cpToWin1252Byte = (cp) => {
  if (cp <= 0x7F) return cp;        // ASCII unchanged
  if (cp >= 0xA0 && cp <= 0xFF) return cp; // Latin-1 supplement
  const b = UNICODE_TO_WIN1252[cp];
  return b !== undefined ? b : null; // null = not encodable in win1252
};

const MOJIBAKE_WIN1252_CODES = new Set(Object.values(WIN1252_MAP));
const LATIN_EXT_RANGE = (cp) => cp >= 0x00A0 && cp <= 0x00FF;

const looksLikeMojibake = (str) => {
  if (str.length < 2) return false;
  let suspicious = 0;
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (MOJIBAKE_WIN1252_CODES.has(cp) || LATIN_EXT_RANGE(cp)) suspicious++;
  }
  return suspicious >= 2 && suspicious / str.length > 0.4;
};

const decodeWin1252AsUtf8 = (str) => {
  const bytes = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    const b = cpToWin1252Byte(cp);
    if (b === null) return null; // can't decode
    bytes.push(b);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    return null;
  }
};

const repairString = (str) => {
  if (!looksLikeMojibake(str)) return str;
  const decoded = decodeWin1252AsUtf8(str);
  if (!decoded || decoded === str) return str;
  // Verify decoded result has CJK characters
  if (/[\u3400-\u9fff]/.test(decoded)) return decoded;
  return str;
};

// Repair string literals inside a source file
const repairFile = (source) => {
  let repairCount = 0;
  const result = source.replace(/'([^'\n\\]*)'/g, (match, inner) => {
    if (!looksLikeMojibake(inner)) return match;
    const repaired = repairString(inner);
    if (repaired !== inner) {
      repairCount++;
      console.log(`  Before: ${inner.substring(0, 40)}`);
      console.log(`  After:  ${repaired.substring(0, 40)}`);
      return `'${repaired}'`;
    }
    return match;
  });
  return { result, repairCount };
};

const files = [
  'pages/CommercialTool.tsx',
];

for (const filePath of files) {
  const abs = resolve('d:/FoodMax/foodera-website', filePath);
  console.log(`\nProcessing: ${filePath}`);
  const source = await readFile(abs, 'utf8');
  const { result, repairCount } = repairFile(source);
  if (repairCount > 0) {
    await writeFile(abs, result, 'utf8');
    console.log(`✅ Repaired ${repairCount} strings`);
  } else {
    console.log(`⚪ No repairable mojibake found`);
  }
}

console.log('\nDone!');
