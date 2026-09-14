/**
 * Readability analysis utilities for SEO content.
 * Implements Flesch Reading Ease adapted for B2B English content.
 */

// ── Transition words (B2B English) ─────────────────────────
export const TRANSITION_WORDS = [
  'additionally','also','besides','furthermore','moreover','likewise',
  'however','nevertheless','nonetheless','although','despite','whereas',
  'therefore','consequently','thus','hence','accordingly',
  'meanwhile','subsequently','finally','firstly','secondly','thirdly',
  'specifically','notably','significantly','importantly',
  'overall','ultimately','essentially',
];

// ── Passive voice regex ────────────────────────────────────
export const PASSIVE_RE =
  /\b(is|are|was|were|been|being|be)\s+(\w+ed|\w+en|made|done|given|taken|shown|known|seen|found|used|called|considered|expected|required|allowed|involved|included|based|produced|reported|designed|developed|built|held|set|kept)\b/gi;

// ── Helpers ────────────────────────────────────────────────
export const splitSentences = (text: string): string[] =>
  text.replace(/\n+/g, '. ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 3);

export const countSyllables = (word: string): number => {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  let count = 0;
  const vowels = 'aeiouy';
  let prev = false;
  for (let i = 0; i < w.length; i++) {
    const v = vowels.includes(w[i]);
    if (v && !prev) count++;
    prev = v;
  }
  if (w.endsWith('e') && count > 1) count--;
  return Math.max(1, count);
};

export const wordCount = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;

// ── Readability result ─────────────────────────────────────
export interface ReadabilityResult {
  score: number;
  level: 'easy' | 'moderate' | 'difficult';
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
  longSentenceCount: number;
  longSentencePercent: number;
  passiveVoicePercent: number;
  transitionWordPercent: number;
}

export const analyzeReadability = (text: string): ReadabilityResult => {
  const sentences = splitSentences(text);
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wc = words.length;

  if (wc < 10 || sentences.length < 1) {
    return {
      score: 0, level: 'difficult',
      avgSentenceLength: 0, avgSyllablesPerWord: 0,
      longSentenceCount: 0, longSentencePercent: 0,
      passiveVoicePercent: 0, transitionWordPercent: 0,
    };
  }

  const totalSyllables = words.reduce((s, w) => s + countSyllables(w), 0);
  const asl = wc / sentences.length;
  const asw = totalSyllables / wc;
  const raw = 206.835 - 1.015 * asl - 84.6 * asw;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const longSentences = sentences.filter(s => wordCount(s) > 40);
  const longPct = (longSentences.length / sentences.length) * 100;

  let passiveCount = 0;
  for (const s of sentences) {
    PASSIVE_RE.lastIndex = 0;
    if (PASSIVE_RE.test(s)) passiveCount++;
  }
  const passivePct = (passiveCount / sentences.length) * 100;

  let transCount = 0;
  for (const s of sentences) {
    const lower = s.toLowerCase();
    if (TRANSITION_WORDS.some(tw => lower.includes(tw))) transCount++;
  }
  const transPct = (transCount / sentences.length) * 100;

  const level: ReadabilityResult['level'] =
    score >= 60 ? 'easy' : score >= 40 ? 'moderate' : 'difficult';

  return {
    score, level,
    avgSentenceLength: Math.round(asl * 10) / 10,
    avgSyllablesPerWord: Math.round(asw * 100) / 100,
    longSentenceCount: longSentences.length,
    longSentencePercent: Math.round(longPct),
    passiveVoicePercent: Math.round(passivePct),
    transitionWordPercent: Math.round(transPct),
  };
};

// ── Content Policy flags ───────────────────────────────────
export interface ContentPolicyFlag {
  id: string;
  label: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  googlePolicyRef?: string;
}

export const checkContentPolicy = (
  title: string,
  excerpt: string,
  content: string,
  existingTitles: string[] = [],
): ContentPolicyFlag[] => {
  const flags: ContentPolicyFlag[] = [];
  const wc = wordCount(content);

  // 1. Thin content
  if (wc > 0 && wc < 300) {
    flags.push({
      id: 'thin-content',
      label: 'Thin Content',
      severity: 'warning',
      message: `Article has only ${wc} words. Google may flag thin content under 300 words.`,
      googlePolicyRef: 'https://developers.google.com/search/docs/essentials/spam-policies#thin-content',
    });
  }

  // 2. Misleading headline (ALL CAPS, excessive punctuation)
  if (/^[A-Z\s!?.,]{10,}$/.test(title)) {
    flags.push({
      id: 'misleading-headline',
      label: 'Clickbait Title',
      severity: 'warning',
      message: 'Title appears to be ALL CAPS. Use proper casing for professional content.',
    });
  }
  const exclamCount = (title.match(/!/g) || []).length;
  if (exclamCount >= 2) {
    flags.push({
      id: 'excessive-punctuation',
      label: 'Excessive Punctuation',
      severity: 'info',
      message: `Title has ${exclamCount} exclamation marks. Keep headlines professional and factual.`,
    });
  }

  // 3. Title/content mismatch (simple heuristic)
  if (title.trim() && content.trim()) {
    const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const contentLower = content.toLowerCase();
    const matched = titleWords.filter(w => contentLower.includes(w));
    if (titleWords.length > 3 && matched.length < titleWords.length * 0.3) {
      flags.push({
        id: 'title-content-mismatch',
        label: 'Title-Content Mismatch',
        severity: 'warning',
        message: 'Title keywords are barely mentioned in the content. Ensure title accurately reflects the article.',
        googlePolicyRef: 'https://developers.google.com/search/docs/essentials/spam-policies#cloaking',
      });
    }
  }

  // 4. Content mostly duplicates excerpt
  if (excerpt.trim() && content.trim()) {
    const excLen = excerpt.trim().length;
    const contLen = content.trim().length;
    if (contLen > 0 && contLen < excLen * 1.5) {
      flags.push({
        id: 'duplicate-excerpt',
        label: 'Duplicate Content',
        severity: 'warning',
        message: 'Article body is nearly identical to the excerpt. Add unique, in-depth analysis.',
      });
    }
  }

  // 5. Auto-generated pattern (repetitive sentence starts)
  const sentences = splitSentences(content);
  if (sentences.length >= 6) {
    const starts = sentences.map(s => s.split(/\s+/).slice(0, 3).join(' ').toLowerCase());
    const freq: Record<string, number> = {};
    for (const st of starts) { freq[st] = (freq[st] || 0) + 1; }
    const maxRepeat = Math.max(...Object.values(freq));
    if (maxRepeat >= Math.ceil(sentences.length * 0.4)) {
      flags.push({
        id: 'repetitive-pattern',
        label: 'Repetitive Pattern',
        severity: 'info',
        message: 'Many sentences start the same way. Vary sentence structure to appear more natural.',
        googlePolicyRef: 'https://developers.google.com/search/docs/essentials/spam-policies#spammy-automatically-generated-content',
      });
    }
  }

  // 6. Doorway content (similar title to existing articles)
  if (title.trim() && existingTitles.length > 0) {
    const tLower = title.toLowerCase();
    for (const existing of existingTitles) {
      const eLower = existing.toLowerCase();
      if (eLower === tLower) continue; // skip exact same (editing)
      // Simple Jaccard on words
      const tWords = new Set(tLower.split(/\s+/).filter(w => w.length > 3));
      const eWords = new Set(eLower.split(/\s+/).filter(w => w.length > 3));
      if (tWords.size < 3) continue;
      const intersection = [...tWords].filter(w => eWords.has(w)).length;
      const similarity = intersection / Math.max(tWords.size, eWords.size);
      if (similarity > 0.7) {
        flags.push({
          id: 'doorway-content',
          label: 'Similar Article Exists',
          severity: 'warning',
          message: `Title is very similar to existing article: "${existing}". Avoid creating duplicate doorway pages.`,
          googlePolicyRef: 'https://developers.google.com/search/docs/essentials/spam-policies#doorways',
        });
        break;
      }
    }
  }

  // 7. Spammy practices — excessive links
  const linkCount = (content.match(/\[.*?\]\(.*?\)|<a\s/gi) || []).length;
  if (wc > 0 && linkCount / (wc / 100) > 5) {
    flags.push({
      id: 'excessive-links',
      label: 'Excessive Links',
      severity: 'warning',
      message: `High link density (${linkCount} links in ${wc} words). This may appear spammy to Google.`,
      googlePolicyRef: 'https://developers.google.com/search/docs/essentials/spam-policies#link-spam',
    });
  }

  return flags;
};

// ── SERP Preview ───────────────────────────────────────────
export interface SerpPreviewData {
  title: string;
  url: string;
  description: string;
}

export const buildSerpPreview = (
  title: string,
  slug: string,
  excerpt: string,
): SerpPreviewData => ({
  title: (title || 'Untitled Article').slice(0, 65) + (title.length > 65 ? '...' : ''),
  url: `foodera.vn/news/${slug || 'article'}`,
  description: (excerpt || '').slice(0, 165) + (excerpt.length > 165 ? '...' : ''),
});
