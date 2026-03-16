import { CategoryType, NewsCategory, NewsItem, Product } from '../types';
import { buildUniqueNewsSlug, normalizeNewsSlug } from './newsSeo';
import { normalizeProductCategory } from './productCategories';

type CsvRow = Record<string, string>;

export interface CsvParseResult {
  headers: string[];
  rows: CsvRow[];
}

export interface CsvMapResult<T> {
  items: T[];
  errors: string[];
}

interface MapNewsOptions {
  existingById?: Record<string, string>;
}

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=1200';
const DEFAULT_NEWS_IMAGE =
  'https://images.unsplash.com/photo-1592910129881-892bbe239cc0?auto=format&fit=crop&q=80&w=1200';

const NEWS_CATEGORIES: NewsCategory[] = ['Market Insights', 'Company Updates', 'Sustainability', 'Events'];

const normalizeKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const csvField = (row: CsvRow, aliases: string[]): string => {
  const aliasSet = new Set(aliases.map(normalizeKey));
  for (const [key, raw] of Object.entries(row)) {
    if (!aliasSet.has(normalizeKey(key))) continue;
    const value = raw.trim();
    if (value) return value;
  }
  return '';
};

const parseLooseObject = (raw: string): Record<string, string> => {
  const value = raw.trim();
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>)
          .map(([k, v]) => [k.trim(), String(v ?? '').trim()])
          .filter(([k, v]) => k && v)
      );
    }
  } catch {
    // continue with loose parser
  }

  const output: Record<string, string> = {};
  value
    .split(/\r?\n|[;|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const separator = pair.includes('=') ? '=' : ':';
      const [rawKey, ...rawValParts] = pair.split(separator);
      const key = rawKey?.trim();
      const val = rawValParts.join(separator).trim();
      if (!key || !val) return;
      output[key] = val;
    });

  return output;
};

const parseLooseStringList = (raw: string): string[] => {
  const value = raw.trim();
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item ?? '').trim()).filter(Boolean);
    }
  } catch {
    // continue with loose parser
  }

  const delimiter = value.includes('\n')
    ? /\r?\n+/
    : value.includes('|')
      ? /\|/
      : value.includes(';')
        ? /;/
        : /,/;

  return value.split(delimiter).map((item) => item.trim()).filter(Boolean);
};

const parseContentParagraphs = (raw: string): string[] => {
  const value = raw.trim();
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((part) => String(part ?? '').trim()).filter(Boolean);
    }
    if (parsed && typeof parsed === 'object') {
      return Object.values(parsed as Record<string, unknown>)
        .map((part) => String(part ?? '').trim())
        .filter(Boolean);
    }
  } catch {
    // continue with loose parser
  }

  const blocks = value.includes('||')
    ? value.split('||')
    : value.includes('\n\n')
      ? value.split(/\r?\n\r?\n+/)
      : value.split(/\r?\n+/);

  return blocks.map((part) => part.trim()).filter(Boolean);
};

const parseNewsCategory = (raw: string): NewsCategory => {
  const value = raw.trim().toLowerCase();
  if (value.includes('company')) return 'Company Updates';
  if (value.includes('sustain')) return 'Sustainability';
  if (value.includes('event')) return 'Events';
  return 'Market Insights';
};

const extractPrefixedObject = (row: CsvRow, prefixes: string[]): Record<string, string> => {
  const output: Record<string, string> = {};
  const regex = new RegExp(`^(?:${prefixes.join('|')})[\\s_.:-]+(.+)$`, 'i');

  for (const [column, raw] of Object.entries(row)) {
    const value = raw.trim();
    if (!value) continue;
    const match = column.trim().match(regex);
    if (!match) continue;
    const key = match[1].trim();
    if (!key) continue;
    output[key] = value;
  }

  return output;
};

const extractNumberedContentColumns = (row: CsvRow): string[] =>
  Object.entries(row)
    .filter(([column, raw]) => /^content[\s_.:-]/i.test(column.trim()) && raw.trim())
    .sort(([a], [b]) => {
      const aNum = Number((a.match(/(\d+)/) || [])[1] || Number.NaN);
      const bNum = Number((b.match(/(\d+)/) || [])[1] || Number.NaN);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && aNum !== bNum) return aNum - bNum;
      return a.localeCompare(b);
    })
    .map(([, raw]) => raw.trim());

const parseProductFilters = (row: CsvRow): Product['filters'] => ({
  ...parseLooseObject(csvField(row, ['filters', 'filter'])),
  ...extractPrefixedObject(row, ['filter', 'filters']),
  ...(csvField(row, ['type', 'filter type']) ? { type: csvField(row, ['type', 'filter type']) } : {}),
  ...(csvField(row, ['broken ratio', 'broken_ratio', 'brokenRatio']) ? { brokenRatio: csvField(row, ['broken ratio', 'broken_ratio', 'brokenRatio']) } : {}),
  ...(csvField(row, ['grain length', 'grain_length', 'grainLength']) ? { grainLength: csvField(row, ['grain length', 'grain_length', 'grainLength']) } : {}),
  ...(csvField(row, ['processing']) ? { processing: csvField(row, ['processing']) } : {}),
  ...(csvField(row, ['grade']) ? { grade: csvField(row, ['grade']) } : {}),
  ...(csvField(row, ['screen size', 'screen_size', 'screenSize']) ? { screenSize: csvField(row, ['screen size', 'screen_size', 'screenSize']) } : {})
});

export const parseCsv = (csvText: string): CsvParseResult => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      cell = '';
      if (row.some((part) => part.trim() !== '') || row.length > 1) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((part) => part.trim() !== '') || row.length > 1) {
    rows.push(row);
  }

  if (!rows.length) return { headers: [], rows: [] };

  const headers = rows[0].map((value, index) => {
    const cleaned = value.replace(/^\uFEFF/, '').trim();
    return cleaned || `column_${index + 1}`;
  });

  const records = rows
    .slice(1)
    .filter((parts) => parts.some((part) => part.trim()))
    .map((parts) => {
      const record: CsvRow = {};
      headers.forEach((header, index) => {
        record[header] = (parts[index] ?? '').trim();
      });
      return record;
    });

  return { headers, rows: records };
};

export const googleSheetToCsvUrl = (rawUrl: string): string => {
  const value = rawUrl.trim();
  if (!value) return value;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return value;
  }

  if (!/docs\.google\.com$/i.test(parsed.hostname)) {
    return value;
  }

  if (parsed.pathname.includes('/export') && parsed.searchParams.get('format') === 'csv') {
    return parsed.toString();
  }
  if (parsed.searchParams.get('output') === 'csv') {
    return parsed.toString();
  }
  if (parsed.pathname.includes('/pub')) {
    parsed.searchParams.set('output', 'csv');
    return parsed.toString();
  }

  const sheetId = (parsed.pathname.match(/\/spreadsheets\/d\/([^/]+)/i) || [])[1];
  if (!sheetId) return value;

  const gidMatch = parsed.hash.match(/gid=(\d+)/i);
  const gid = parsed.searchParams.get('gid') || gidMatch?.[1] || '0';
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
};

export const mapCsvRowsToProducts = (rows: CsvRow[]): CsvMapResult<Product> => {
  const byId = new Map<string, Product>();
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const rowLabel = `Row ${index + 2}`;
    const id = csvField(row, ['id', 'product id', 'sku', 'product sku']).trim();
    if (!id) {
      errors.push(`${rowLabel}: missing product ID.`);
      return;
    }

    const name = csvField(row, ['name', 'product name', 'title']) || id;
    const subCategoryRaw = csvField(row, ['sub category', 'subcategory', 'line']);
    const description = csvField(row, ['description', 'technical portfolio description', 'long description']);
    const shortDescription =
      csvField(row, ['short description', 'short commercial description', 'summary']) || description || name;
    const image = csvField(row, ['image', 'image url', 'cover image']) || DEFAULT_PRODUCT_IMAGE;
    const pdfUrl = csvField(row, ['pdf', 'pdf url', 'product pdf', 'technical datasheet']);
    const gallery = parseLooseStringList(csvField(row, ['gallery', 'gallery urls', 'gallery images']));
    const specifications = {
      ...parseLooseObject(csvField(row, ['specifications', 'specification', 'specs', 'quality matrix'])),
      ...extractPrefixedObject(row, ['spec', 'specification', 'specifications'])
    };
    const filters = parseProductFilters(row);
    const zhSpecifications = parseLooseObject(csvField(row, ['zh specifications', 'zh_specifications', 'zh specs']));
    const zhTranslation = {
      ...(csvField(row, ['zh name', 'zh_name', 'cn name']) ? { name: csvField(row, ['zh name', 'zh_name', 'cn name']) } : {}),
      ...(csvField(row, ['zh sub category', 'zh_sub_category', 'zh_subcategory']) ? { subCategory: csvField(row, ['zh sub category', 'zh_sub_category', 'zh_subcategory']) } : {}),
      ...(csvField(row, ['zh short description', 'zh_short_description']) ? { shortDescription: csvField(row, ['zh short description', 'zh_short_description']) } : {}),
      ...(csvField(row, ['zh description', 'zh long description']) ? { description: csvField(row, ['zh description', 'zh long description']) } : {}),
      ...(Object.keys(zhSpecifications).length > 0 ? { specifications: zhSpecifications } : {})
    };
    const category = normalizeProductCategory({
      category: csvField(row, ['category', 'global category']),
      subCategory: subCategoryRaw,
      id,
      name,
      filters
    });
    const subCategory = subCategoryRaw || category;

    byId.set(id, {
      id,
      name,
      category,
      subCategory,
      description,
      shortDescription,
      image,
      pdfUrl: pdfUrl || undefined,
      gallery: gallery.length ? gallery : undefined,
      specifications,
      filters,
      translations: Object.keys(zhTranslation).length > 0 ? { zh: zhTranslation } : undefined
    });
  });

  return {
    items: Array.from(byId.values()),
    errors
  };
};

export const mapCsvRowsToNews = (rows: CsvRow[], options: MapNewsOptions = {}): CsvMapResult<NewsItem> => {
  const existingById = options.existingById ?? {};
  const takenSlugs = new Set(
    Object.values(existingById)
      .map((slug) => normalizeNewsSlug(slug))
      .filter(Boolean)
  );
  const byId = new Map<string, NewsItem>();
  const errors: string[] = [];
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  rows.forEach((row, index) => {
    const rowLabel = `Row ${index + 2}`;
    const id =
      csvField(row, ['id', 'news id', 'article id', 'post id']) ||
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `news-${Date.now()}-${index + 1}`);
    const title = csvField(row, ['title', 'headline', 'name']);
    if (!title) {
      errors.push(`${rowLabel}: missing title.`);
      return;
    }

    const currentSlug = existingById[id];
    if (currentSlug) {
      takenSlugs.delete(normalizeNewsSlug(currentSlug));
    }

    const requestedSlug = csvField(row, ['slug', 'seo slug', 'canonical slug']);
    const generatedSlug = buildUniqueNewsSlug(requestedSlug || title, takenSlugs, currentSlug);
    takenSlugs.add(normalizeNewsSlug(generatedSlug));

    const categoryRaw = csvField(row, ['category', 'intelligence category']);
    const category = categoryRaw ? parseNewsCategory(categoryRaw) : NEWS_CATEGORIES[0];
    const excerpt = csvField(row, ['excerpt', 'summary', 'short summary']);
    const mainContent = parseContentParagraphs(csvField(row, ['content', 'full article content', 'article']));
    const zhMainContent = parseContentParagraphs(csvField(row, ['zh content', 'zh_content', 'cn content']));
    const extraSections = extractNumberedContentColumns(row).flatMap(parseContentParagraphs);
    const zhExtraSections = Object.entries(row)
      .filter(([column, raw]) => /^zh[_\s.-]*content[\s_.:-]/i.test(column.trim()) && raw.trim())
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([, raw]) => parseContentParagraphs(raw));
    const content = Array.from(new Set([...mainContent, ...extraSections]));
    const zhContent = Array.from(new Set([...zhMainContent, ...zhExtraSections]));
    const date = csvField(row, ['date', 'release date', 'publish date']) || today;
    const image = csvField(row, ['image', 'image url', 'cover image']) || DEFAULT_NEWS_IMAGE;
    const zhTranslation = {
      ...(csvField(row, ['zh title', 'zh_title', 'cn title']) ? { title: csvField(row, ['zh title', 'zh_title', 'cn title']) } : {}),
      ...(csvField(row, ['zh excerpt', 'zh_excerpt', 'cn excerpt']) ? { excerpt: csvField(row, ['zh excerpt', 'zh_excerpt', 'cn excerpt']) } : {}),
      ...(zhContent.length > 0 ? { content: zhContent } : {})
    };

    byId.set(id, {
      id,
      slug: generatedSlug,
      title,
      category,
      date,
      excerpt: excerpt || content[0] || title,
      content: content.length ? content : [excerpt || title],
      image,
      translations: Object.keys(zhTranslation).length > 0 ? { zh: zhTranslation } : undefined
    });
  });

  return {
    items: Array.from(byId.values()),
    errors
  };
};
