/**
 * SEO Analyzer v2 for CMS Insight / News articles.
 *
 * Evaluates a draft article against on-page SEO best practices aligned with
 * Google E-E-A-T, Helpful Content, and Spam policies. Returns a structured
 * report with scores, readability, content-policy flags, and SERP preview.
 */

import {
  analyzeReadability,
  checkContentPolicy,
  buildSerpPreview,
  splitSentences,
  wordCount,
  TRANSITION_WORDS,
  PASSIVE_RE,
  type ReadabilityResult,
  type ContentPolicyFlag,
  type SerpPreviewData,
} from './seoReadability';

// ── Re-exports for consumers ───────────────────────────────
export type { ReadabilityResult, ContentPolicyFlag, SerpPreviewData };
export { analyzeReadability, checkContentPolicy, buildSerpPreview };

// ── Types ──────────────────────────────────────────────────
export type SeoSeverity = 'good' | 'warning' | 'error';

export interface SeoCheckResult {
  id: string;
  label: string;
  severity: SeoSeverity;
  message: string;
  /** 0-100 score for this individual check */
  score: number;
}

export interface SeoReport {
  /** Overall score 0-100 */
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  checks: SeoCheckResult[];
  readability: ReadabilityResult;
  contentPolicy: ContentPolicyFlag[];
  serpPreview: SerpPreviewData;
}

export interface SeoAnalysisInput {
  title: string;
  slug: string;
  excerpt: string;
  /** Joined full-text content (paragraphs joined by newlines) */
  content: string;
  image: string;
  focusKeyword?: string;
  /** Existing article titles for doorway/duplicate detection */
  existingArticleTitles?: string[];
}

// ── Helpers ────────────────────────────────────────────────
const charLen = (t: string) => t.trim().length;

// Normalize: lowercase + collapse non-alphanumeric to space
// Allows slug matching: "vietnamese-jasmine-rice-supplier" ↔ "Vietnamese Jasmine Rice Supplier"
const normalizeForSeo = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const kw = (t: string, k: string) => k ? normalizeForSeo(t).includes(normalizeForSeo(k)) : false;

const grade = (s: number): SeoReport['grade'] =>
  s >= 85 ? 'A' : s >= 70 ? 'B' : s >= 55 ? 'C' : s >= 40 ? 'D' : 'F';

// ── Checks (original 9) ───────────────────────────────────
type CF = (i: SeoAnalysisInput) => SeoCheckResult;

const checkTitleLength: CF = (i) => {
  const l = charLen(i.title);
  if (l === 0) return { id: 'title-length', label: 'Title Length', severity: 'error', score: 0, message: 'Title is empty.' };
  if (l < 30) return { id: 'title-length', label: 'Title Length', severity: 'warning', score: 50, message: `Title too short (${l} chars). Aim for 50-60.` };
  if (l > 70) return { id: 'title-length', label: 'Title Length', severity: 'warning', score: 60, message: `Title too long (${l} chars). Google truncates after ~60.` };
  return { id: 'title-length', label: 'Title Length', severity: 'good', score: 100, message: `Good title length (${l} chars).` };
};

const checkExcerpt: CF = (i) => {
  const l = charLen(i.excerpt);
  if (l === 0) return { id: 'meta-description', label: 'Meta Description', severity: 'error', score: 0, message: 'Meta description is empty.' };
  if (l < 120) return { id: 'meta-description', label: 'Meta Description', severity: 'warning', score: 50, message: `Too short (${l} chars). Aim for 150-160.` };
  if (l > 170) return { id: 'meta-description', label: 'Meta Description', severity: 'warning', score: 65, message: `Too long (${l} chars). Google truncates after ~160.` };
  return { id: 'meta-description', label: 'Meta Description', severity: 'good', score: 100, message: `Good length (${l} chars).` };
};

const checkSlug: CF = (i) => {
  const s = i.slug.trim();
  if (!s) return { id: 'slug-quality', label: 'SEO Slug', severity: 'warning', score: 40, message: 'No custom slug. Auto-generated from title.' };
  const w = s.split('-').filter(Boolean);
  if (w.length > 8) return { id: 'slug-quality', label: 'SEO Slug', severity: 'warning', score: 60, message: `Slug too long (${w.length} words). Keep under 5-6.` };
  if (/[A-Z]/.test(s) || /\s/.test(s)) return { id: 'slug-quality', label: 'SEO Slug', severity: 'warning', score: 50, message: 'Use lowercase with hyphens only.' };
  return { id: 'slug-quality', label: 'SEO Slug', severity: 'good', score: 100, message: 'SEO-friendly slug.' };
};

const checkContentLength: CF = (i) => {
  const w = wordCount(i.content);
  if (w === 0) return { id: 'content-length', label: 'Content Length', severity: 'error', score: 0, message: 'Content is empty.' };
  if (w < 100) return { id: 'content-length', label: 'Content Length', severity: 'error', score: 20, message: `Too short (${w} words). Need 300+.` };
  if (w < 300) return { id: 'content-length', label: 'Content Length', severity: 'warning', score: 50, message: `Short (${w} words). Aim for 600-1500.` };
  if (w < 600) return { id: 'content-length', label: 'Content Length', severity: 'good', score: 75, message: `Acceptable (${w} words). More = better SEO.` };
  return { id: 'content-length', label: 'Content Length', severity: 'good', score: 100, message: `Great length (${w} words).` };
};

const checkImage: CF = (i) => {
  if (!i.image.trim()) return { id: 'featured-image', label: 'Featured Image', severity: 'error', score: 0, message: 'No featured image. Images boost CTR.' };
  return { id: 'featured-image', label: 'Featured Image', severity: 'good', score: 100, message: 'Featured image set.' };
};

const checkFocusKw: CF = (i) => {
  const k = (i.focusKeyword || '').trim();
  if (!k) return { id: 'focus-keyword', label: 'Focus Keyword', severity: 'warning', score: 30, message: 'No focus keyword set.' };
  const hits = [kw(i.title, k), kw(i.excerpt, k), kw(i.slug, k), kw(i.content, k)].filter(Boolean).length;
  if (hits === 4) return { id: 'focus-keyword', label: 'Focus Keyword', severity: 'good', score: 100, message: `"${k}" in title, excerpt, slug & content. Excellent!` };
  const m: string[] = [];
  if (!kw(i.title, k)) m.push('title');
  if (!kw(i.excerpt, k)) m.push('excerpt');
  if (!kw(i.slug, k)) m.push('slug');
  if (!kw(i.content, k)) m.push('content');
  return { id: 'focus-keyword', label: 'Focus Keyword', severity: hits >= 2 ? 'warning' : 'error', score: Math.round((hits / 4) * 100), message: `"${k}" missing in: ${m.join(', ')}.` };
};

const checkDensity: CF = (i) => {
  const k = (i.focusKeyword || '').trim().toLowerCase();
  if (!k) return { id: 'keyword-density', label: 'Keyword Density', severity: 'warning', score: 0, message: 'No focus keyword — cannot analyze.' };
  const c = i.content.toLowerCase();
  const w = wordCount(c);
  if (w === 0) return { id: 'keyword-density', label: 'Keyword Density', severity: 'error', score: 0, message: 'Content is empty.' };
  let n = 0, p = 0;
  while (true) { const idx = c.indexOf(k, p); if (idx === -1) break; n++; p = idx + k.length; }
  const d = (n / w) * 100;
  if (n === 0) return { id: 'keyword-density', label: 'Keyword Density', severity: 'error', score: 10, message: `"${i.focusKeyword}" not in content.` };
  if (d < 0.5) return { id: 'keyword-density', label: 'Keyword Density', severity: 'warning', score: 50, message: `Low (${d.toFixed(1)}%, ${n}×). Aim 1-2.5%.` };
  if (d > 3) return { id: 'keyword-density', label: 'Keyword Density', severity: 'warning', score: 55, message: `Too high (${d.toFixed(1)}%, ${n}×). Avoid stuffing.` };
  return { id: 'keyword-density', label: 'Keyword Density', severity: 'good', score: 100, message: `Good density (${d.toFixed(1)}%, ${n}×).` };
};

const checkParaStructure: CF = (i) => {
  const p = i.content.split('\n').map(s => s.trim()).filter(Boolean);
  if (p.length === 0) return { id: 'paragraph-structure', label: 'Paragraphs', severity: 'error', score: 0, message: 'No paragraphs.' };
  if (p.length === 1) return { id: 'paragraph-structure', label: 'Paragraphs', severity: 'warning', score: 40, message: 'Only 1 paragraph. Break into shorter blocks.' };
  if (p.length < 3) return { id: 'paragraph-structure', label: 'Paragraphs', severity: 'warning', score: 60, message: `${p.length} paragraphs. Aim for 3-5+.` };
  const long = p.filter(x => wordCount(x) > 200);
  if (long.length) return { id: 'paragraph-structure', label: 'Paragraphs', severity: 'warning', score: 70, message: `${long.length} paragraph(s) > 200 words.` };
  return { id: 'paragraph-structure', label: 'Paragraphs', severity: 'good', score: 100, message: `Good (${p.length} paragraphs).` };
};

const checkLinks: CF = (i) => {
  // Detect:
  // 1. HTML <a href="..."> (nếu content chưa qua htmlToSeoText)
  // 2. Markdown [text](url)
  // 3. "text (url)" — format xuất ra bởi htmlToSeoText
  const n = (i.content.match(/\[.*?\]\(.*?\)|<a\s[^>]*href|(https?:\/\/[^\s)\]]+)/gi) || []).length;
  if (n === 0) return { id: 'internal-links', label: 'Internal Links', severity: 'warning', score: 40, message: 'No links. Add internal links to products/articles.' };
  return { id: 'internal-links', label: 'Internal Links', severity: 'good', score: 100, message: `${n} link(s) found.` };
};

// ── New checks (8 additional) ──────────────────────────────
const checkHeadingStructure: CF = (i) => {
  const lines = i.content.split('\n').map(l => l.trim()).filter(Boolean);
  const hPat = /^\d{1,2}\s*[.)\-]?\s*[\p{L}\p{N}\s&/.-]{2,60}$/u;
  const h = lines.filter(l => hPat.test(l));
  if (h.length === 0) return { id: 'heading-structure', label: 'Heading Structure', severity: 'warning', score: 40, message: 'No headings. Add numbered sections (e.g. "1. Overview").' };
  if (h.length === 1) return { id: 'heading-structure', label: 'Heading Structure', severity: 'warning', score: 65, message: 'Only 1 heading. Use 2-5 to divide content.' };
  if (h.length > 10) return { id: 'heading-structure', label: 'Heading Structure', severity: 'warning', score: 70, message: `Too many headings (${h.length}). 3-7 is ideal.` };
  return { id: 'heading-structure', label: 'Heading Structure', severity: 'good', score: 100, message: `Good structure (${h.length} headings).` };
};

const checkImageAlt: CF = (i) => {
  const markers = i.content.match(/\[\[IMAGE:([\s\S]*?)\]\]/gi) || [];
  if (markers.length === 0) return { id: 'image-alt-text', label: 'Image Alt Text', severity: 'good', score: 80, message: 'No inline images. Consider adding images.' };
  let missing = 0;
  for (const m of markers) {
    const inner = m.replace(/^\[\[IMAGE:/i, '').replace(/\]\]$/, '');
    const parts = inner.split('|').map(p => p.trim());
    if (!parts[1] || parts[1].length < 3 || parts[1].toLowerCase() === 'alt text') missing++;
  }
  if (missing > 0) return { id: 'image-alt-text', label: 'Image Alt Text', severity: 'warning', score: 50, message: `${missing} image(s) missing alt text.` };
  return { id: 'image-alt-text', label: 'Image Alt Text', severity: 'good', score: 100, message: `All ${markers.length} image(s) have alt text.` };
};

const checkKwFirstPara: CF = (i) => {
  const k = (i.focusKeyword || '').trim();
  if (!k) return { id: 'keyword-first-para', label: 'Keyword in Intro', severity: 'warning', score: 0, message: 'No keyword — skipped.' };
  const first = i.content.split('\n').map(l => l.trim()).filter(Boolean)[0] || '';
  const words100 = first.split(/\s+/).slice(0, 100).join(' ');
  if (kw(words100, k)) return { id: 'keyword-first-para', label: 'Keyword in Intro', severity: 'good', score: 100, message: 'Keyword in first 100 words. Excellent!' };
  return { id: 'keyword-first-para', label: 'Keyword in Intro', severity: 'warning', score: 40, message: `"${k}" not in first 100 words. Place it early.` };
};

const checkTransition: CF = (i) => {
  const sents = splitSentences(i.content);
  if (sents.length < 3) return { id: 'transition-words', label: 'Transition Words', severity: 'warning', score: 50, message: 'Too short to analyze.' };
  let n = 0;
  for (const s of sents) { const lo = s.toLowerCase(); if (TRANSITION_WORDS.some(tw => lo.includes(tw))) n++; }
  const pct = (n / sents.length) * 100;
  if (pct < 15) return { id: 'transition-words', label: 'Transition Words', severity: 'warning', score: 45, message: `Only ${pct.toFixed(0)}%. Aim for 30%+ for better flow.` };
  if (pct < 30) return { id: 'transition-words', label: 'Transition Words', severity: 'warning', score: 70, message: `${pct.toFixed(0)}% — good, more would help.` };
  return { id: 'transition-words', label: 'Transition Words', severity: 'good', score: 100, message: `${pct.toFixed(0)}% — excellent readability!` };
};

const checkSentLen: CF = (i) => {
  const sents = splitSentences(i.content);
  if (sents.length < 2) return { id: 'sentence-length', label: 'Sentence Length', severity: 'warning', score: 50, message: 'Not enough sentences.' };
  const long = sents.filter(s => wordCount(s) > 40);
  const pct = (long.length / sents.length) * 100;
  if (pct > 40) return { id: 'sentence-length', label: 'Sentence Length', severity: 'warning', score: 40, message: `${pct.toFixed(0)}% sentences > 40 words. Shorten them.` };
  if (pct > 20) return { id: 'sentence-length', label: 'Sentence Length', severity: 'warning', score: 65, message: `${pct.toFixed(0)}% long sentences. Mix lengths.` };
  return { id: 'sentence-length', label: 'Sentence Length', severity: 'good', score: 100, message: `Well-balanced. ${long.length}/${sents.length} long.` };
};

const checkPassive: CF = (i) => {
  const sents = splitSentences(i.content);
  if (sents.length < 2) return { id: 'passive-voice', label: 'Active Voice', severity: 'good', score: 80, message: 'Not enough text.' };
  let n = 0;
  for (const s of sents) { PASSIVE_RE.lastIndex = 0; if (PASSIVE_RE.test(s)) n++; }
  const pct = (n / sents.length) * 100;
  if (pct > 40) return { id: 'passive-voice', label: 'Active Voice', severity: 'warning', score: 40, message: `${pct.toFixed(0)}% passive. Use active voice.` };
  if (pct > 25) return { id: 'passive-voice', label: 'Active Voice', severity: 'warning', score: 65, message: `${pct.toFixed(0)}% passive. Aim under 20%.` };
  return { id: 'passive-voice', label: 'Active Voice', severity: 'good', score: 100, message: `Good active voice (${pct.toFixed(0)}% passive).` };
};

const checkOutbound: CF = (i) => {
  const urls = (i.content.match(/https?:\/\/[^\s)\]]+/gi) || []) as string[];
  const ext = urls.filter(u => !u.includes('foodera') && !u.includes('foodmax') && !u.includes('localhost'));
  if (ext.length === 0) return { id: 'outbound-links', label: 'Source References', severity: 'warning', score: 50, message: 'No external sources. Add references for E-E-A-T.' };
  if (ext.length >= 2) return { id: 'outbound-links', label: 'Source References', severity: 'good', score: 100, message: `${ext.length} external references. Great credibility!` };
  return { id: 'outbound-links', label: 'Source References', severity: 'good', score: 80, message: '1 external reference. Add 1-2 more.' };
};

const checkOriginality: CF = (i) => {
  const c = i.content.trim(), e = i.excerpt.trim();
  if (!c || !e) return { id: 'content-originality', label: 'Originality', severity: 'warning', score: 50, message: 'Cannot check — missing content or excerpt.' };
  if (c.length < e.length * 1.5) return { id: 'content-originality', label: 'Originality', severity: 'warning', score: 30, message: 'Content mostly repeats excerpt. Add unique analysis.' };
  const sents = splitSentences(c);
  if (sents.length >= 6) {
    const starts = sents.map(s => s.split(/\s+/).slice(0, 3).join(' ').toLowerCase());
    const freq: Record<string, number> = {};
    for (const st of starts) freq[st] = (freq[st] || 0) + 1;
    const max = Math.max(...Object.values(freq));
    if (max >= Math.ceil(sents.length * 0.4))
      return { id: 'content-originality', label: 'Originality', severity: 'warning', score: 55, message: 'Repetitive patterns detected. Vary sentence structure.' };
  }
  return { id: 'content-originality', label: 'Originality', severity: 'good', score: 100, message: 'Content appears original and well-varied.' };
};

// ── Main analysis ──────────────────────────────────────────
const allChecks: CF[] = [
  checkTitleLength, checkExcerpt, checkSlug, checkContentLength,
  checkImage, checkFocusKw, checkDensity, checkParaStructure, checkLinks,
  // v2 checks
  checkHeadingStructure, checkImageAlt, checkKwFirstPara,
  checkTransition, checkSentLen, checkPassive, checkOutbound, checkOriginality,
];

export const analyzeSeo = (
  input: SeoAnalysisInput,
  _locale: 'en' | 'zh' = 'en',
): SeoReport => {
  const checks = allChecks.map(fn => fn(input));
  const total = checks.reduce((s, c) => s + c.score, 0);
  const overallScore = Math.round(total / checks.length);

  return {
    overallScore,
    grade: grade(overallScore),
    checks,
    readability: analyzeReadability(input.content),
    contentPolicy: checkContentPolicy(
      input.title, input.excerpt, input.content,
      input.existingArticleTitles,
    ),
    serpPreview: buildSerpPreview(input.title, input.slug, input.excerpt),
  };
};
