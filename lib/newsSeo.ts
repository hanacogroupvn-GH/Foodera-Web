import { NewsItem } from '../types';

type NewsPathSource = Pick<NewsItem, 'id' | 'title'> & Partial<Pick<NewsItem, 'slug'>>;

const stripDiacritics = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'd');

export const normalizeNewsSlug = (value: string): string => {
  const slug = stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug;
};

export const getNewsSlug = (item: NewsPathSource): string => {
  const explicitSlug = normalizeNewsSlug(item.slug ?? '');
  if (explicitSlug) return explicitSlug;

  const titleSlug = normalizeNewsSlug(item.title ?? '');
  if (titleSlug) return titleSlug;

  const idSlug = normalizeNewsSlug(item.id ?? '');
  return idSlug || 'news-item';
};

export const getNewsPath = (item: NewsPathSource): string => {
  const safeSlug = encodeURIComponent(getNewsSlug(item));
  return `/news/${safeSlug}`;
};

export const buildUniqueNewsSlug = (
  title: string,
  existingSlugs: Iterable<string>,
  currentSlug?: string
): string => {
  const current = normalizeNewsSlug(currentSlug ?? '');
  const taken = new Set(
    Array.from(existingSlugs)
      .map((slug) => normalizeNewsSlug(slug))
      .filter((slug) => slug && slug !== current)
  );

  const base = normalizeNewsSlug(title) || 'news-item';
  if (!taken.has(base)) return base;

  let index = 2;
  while (taken.has(`${base}-${index}`)) {
    index += 1;
  }

  return `${base}-${index}`;
};
