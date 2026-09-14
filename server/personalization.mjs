import {
  listPersonalizationEventsByVisitor,
  listRecentPersonalizationEventsByVisitors,
  listRecentPersonalizationProfiles,
  upsertPersonalizationProfile
} from './db.mjs';

const PROFILE_MODEL = 'hybrid-v1';
const EVENT_HALF_LIFE_DAYS = 14;
const MAX_SIMILAR_VISITORS = 6;
const MIN_SIMILARITY_SCORE = 0.12;

const ACTION_WEIGHT_BY_KEY = {
  'page:view': 0.35,
  'category:view': 1.4,
  'product:click': 2.2,
  'product:view': 4.8,
  'news:click': 1.7,
  'news:view': 3.1,
  'quote_request:submit': 8.5
};

const CATEGORY_TERMS = {
  Rice: ['rice', 'st24', 'st25', 'jasmine', 'grain', 'paddy'],
  Coffee: ['coffee', 'robusta', 'arabica', 'bean', 'caffeine'],
  Cashew: ['cashew', 'kernel', 'kernels', 'nut'],
  Agriculture: ['agriculture', 'agricultural', 'farm', 'commodity', 'produce']
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeText = (value) => String(value ?? '').trim();

const addScore = (map, key, amount) => {
  const normalizedKey = normalizeText(key);
  if (!normalizedKey || !Number.isFinite(amount) || amount <= 0) {
    return;
  }

  map.set(normalizedKey, (map.get(normalizedKey) || 0) + amount);
};

const toSortedEntries = (map, limit = 6, minimumScore = 0.18) =>
  Array.from(map.entries())
    .filter(([, score]) => Number.isFinite(score) && score >= minimumScore)
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([key, score]) => ({
      key,
      score: Number(score.toFixed(3))
    }));

const toMap = (entries = []) =>
  new Map(
    (Array.isArray(entries) ? entries : [])
      .map((entry) => [normalizeText(entry?.key), Number(entry?.score)])
      .filter(([key, score]) => key && Number.isFinite(score) && score > 0)
  );

const cosineSimilarity = (leftEntries = [], rightEntries = []) => {
  const leftMap = toMap(leftEntries);
  const rightMap = toMap(rightEntries);
  if (leftMap.size === 0 || rightMap.size === 0) {
    return 0;
  }

  let numerator = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (const score of leftMap.values()) {
    leftMagnitude += score ** 2;
  }

  for (const score of rightMap.values()) {
    rightMagnitude += score ** 2;
  }

  for (const [key, score] of leftMap.entries()) {
    numerator += score * (rightMap.get(key) || 0);
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return numerator / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
};

const getAgeInDays = (value) => {
  const timestamp = Date.parse(String(value ?? ''));
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60 * 24));
};

const getDecayFactor = (createdAt) => {
  const ageInDays = getAgeInDays(createdAt);
  if (ageInDays === null) {
    return 1;
  }

  return 0.5 ** (ageInDays / EVENT_HALF_LIFE_DAYS);
};

const getDefaultEventWeight = ({ entityType, action }) =>
  ACTION_WEIGHT_BY_KEY[`${normalizeText(entityType)}:${normalizeText(action)}`] || 1;

const buildProfileSummary = (profile) => {
  const topCategory = profile.topCategories[0]?.key;
  const topSubCategory = profile.topSubCategories[0]?.key;
  const topNewsCategory = profile.topNewsCategories[0]?.key;

  if (topCategory && topSubCategory) {
    return `Strongest signal: ${topCategory} / ${topSubCategory}.`;
  }

  if (topCategory) {
    return `Strongest signal: ${topCategory}.`;
  }

  if (topNewsCategory) {
    return `Reading pattern leans toward ${topNewsCategory}.`;
  }

  return 'The recommender is still learning from this device.';
};

const buildProfileSegment = (profile) => {
  const topCategory = profile.topCategories[0]?.key;
  const topNewsCategory = profile.topNewsCategories[0]?.key;
  const topProduct = profile.topProducts[0]?.score || 0;
  const topNews = profile.topNews[0]?.score || 0;

  if (topCategory && topProduct >= 3) {
    return `${topCategory} sourcing intent`;
  }

  if (topNewsCategory && topNews >= 2.5) {
    return `${topNewsCategory} reader`;
  }

  if (topCategory) {
    return `${topCategory} explorer`;
  }

  return 'New visitor';
};

export const buildPersonalizationProfile = ({
  visitorId,
  ipHash = '',
  userAgentHash = '',
  events = []
}) => {
  const categoryScores = new Map();
  const subCategoryScores = new Map();
  const newsCategoryScores = new Map();
  const productScores = new Map();
  const newsScores = new Map();
  const seenRoutes = new Map();
  const seenProducts = new Set();
  const seenNews = new Set();
  let signalCount = 0;
  let lastActiveAt = '';

  for (const event of events) {
    const weightedScore = Math.max(0, Number(event?.weight ?? 0) * getDecayFactor(event?.createdAt));
    if (weightedScore <= 0.05) {
      continue;
    }

    if (!lastActiveAt && event?.createdAt) {
      lastActiveAt = String(event.createdAt);
    }

    let hasMeaningfulSignal = false;

    if (event?.category) {
      addScore(categoryScores, event.category, weightedScore);
      hasMeaningfulSignal = true;
    }

    if (event?.subCategory) {
      addScore(subCategoryScores, event.subCategory, weightedScore * 1.15);
      hasMeaningfulSignal = true;
    }

    if (event?.newsCategory) {
      addScore(newsCategoryScores, event.newsCategory, weightedScore * 1.05);
      hasMeaningfulSignal = true;
    }

    if (event?.entityType === 'product' && event?.itemId) {
      addScore(productScores, event.itemId, weightedScore * (event?.action === 'view' ? 1.5 : 1));
      seenProducts.add(String(event.itemId));
      hasMeaningfulSignal = true;
    }

    if (event?.entityType === 'news' && event?.itemId) {
      addScore(newsScores, event.itemId, weightedScore * (event?.action === 'view' ? 1.35 : 1));
      seenNews.add(String(event.itemId));
      hasMeaningfulSignal = true;
    }

    if (event?.route) {
      addScore(seenRoutes, event.route, weightedScore);
    }

    if (hasMeaningfulSignal) {
      signalCount += 1;
    }
  }

  const profile = {
    visitorId: normalizeText(visitorId),
    model: PROFILE_MODEL,
    isPersonalized: signalCount > 0,
    signalCount,
    topCategories: toSortedEntries(categoryScores, 4),
    topSubCategories: toSortedEntries(subCategoryScores, 6),
    topNewsCategories: toSortedEntries(newsCategoryScores, 4),
    topProducts: toSortedEntries(productScores, 8),
    topNews: toSortedEntries(newsScores, 8),
    topRoutes: toSortedEntries(seenRoutes, 5),
    seenProductIds: Array.from(seenProducts),
    seenNewsIds: Array.from(seenNews),
    lastActiveAt: lastActiveAt || undefined,
    ipHash: normalizeText(ipHash),
    userAgentHash: normalizeText(userAgentHash)
  };

  profile.segment = buildProfileSegment(profile);
  profile.summary = buildProfileSummary(profile);
  return profile;
};

const getProfileSimilarity = (currentProfile, candidateProfile) => {
  const weightedSimilarity =
    cosineSimilarity(currentProfile?.topCategories, candidateProfile?.topCategories) * 0.9 +
    cosineSimilarity(currentProfile?.topSubCategories, candidateProfile?.topSubCategories) * 1.1 +
    cosineSimilarity(currentProfile?.topNewsCategories, candidateProfile?.topNewsCategories) * 0.8 +
    cosineSimilarity(currentProfile?.topProducts, candidateProfile?.topProducts) * 1.2 +
    cosineSimilarity(currentProfile?.topNews, candidateProfile?.topNews) * 0.9;

  return weightedSimilarity / 4.9;
};

const pickSimilarVisitors = (currentProfile, storedProfiles = []) =>
  (Array.isArray(storedProfiles) ? storedProfiles : [])
    .map((entry) => {
      const candidateProfile = entry?.profile ?? {};
      return {
        visitorId: String(entry?.visitorId ?? ''),
        similarity: getProfileSimilarity(currentProfile, candidateProfile)
      };
    })
    .filter((entry) => entry.visitorId && entry.similarity >= MIN_SIMILARITY_SCORE)
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, MAX_SIMILAR_VISITORS);

const buildCollaborativeSignals = (events = [], similarityByVisitorId = new Map()) => {
  const productScores = new Map();
  const newsScores = new Map();

  for (const event of events) {
    const similarity = similarityByVisitorId.get(String(event?.visitorId ?? ''));
    if (!Number.isFinite(similarity) || similarity <= 0) {
      continue;
    }

    const weightedScore = Math.max(0, Number(event?.weight ?? 0) * getDecayFactor(event?.createdAt) * similarity);
    if (weightedScore <= 0.05 || !event?.itemId) {
      continue;
    }

    if (event?.entityType === 'product') {
      addScore(productScores, event.itemId, weightedScore * 1.15);
    }

    if (event?.entityType === 'news') {
      addScore(newsScores, event.itemId, weightedScore * 1.1);
    }
  }

  return { productScores, newsScores };
};

const buildTextHaystack = (item) =>
  `${normalizeText(item?.title)} ${normalizeText(item?.excerpt)} ${Array.isArray(item?.content) ? item.content.join(' ') : ''}`.toLowerCase();

const getNewsContentAffinity = (item, profile) => {
  const haystack = buildTextHaystack(item);
  if (!haystack) {
    return 0;
  }

  let score = 0;

  for (const categoryEntry of profile.topCategories.slice(0, 3)) {
    const categoryTerms = CATEGORY_TERMS[categoryEntry.key] || [String(categoryEntry.key).toLowerCase()];
    if (categoryTerms.some((term) => haystack.includes(String(term).toLowerCase()))) {
      score += categoryEntry.score * 0.45;
    }
  }

  for (const subCategoryEntry of profile.topSubCategories.slice(0, 3)) {
    if (haystack.includes(String(subCategoryEntry.key).toLowerCase())) {
      score += subCategoryEntry.score * 0.55;
    }
  }

  return score;
};

const buildProductCandidates = ({ products, profile, collaborativeSignals, limit = 4 }) => {
  const directProductScores = toMap(profile.topProducts);
  const categoryScores = toMap(profile.topCategories);
  const subCategoryScores = toMap(profile.topSubCategories);
  const seenProductIds = new Set(profile.seenProductIds || []);

  return (Array.isArray(products) ? products : [])
    .map((product, index) => {
      const directScore = directProductScores.get(String(product.id)) || 0;
      const categoryScore = categoryScores.get(String(product.category)) || 0;
      const subCategoryScore = subCategoryScores.get(String(product.subCategory)) || 0;
      const collaborativeScore = collaborativeSignals.productScores.get(String(product.id)) || 0;
      const explorationBoost = profile.topCategories[0]?.key === product.category ? 0.55 : 0;
      const repeatPenalty = seenProductIds.has(String(product.id)) ? Math.min(1.35, directScore * 0.18) : 0;
      const score =
        0.15 +
        directScore * 1.45 +
        categoryScore * 0.85 +
        subCategoryScore * 1.1 +
        collaborativeScore * 1.15 +
        explorationBoost -
        repeatPenalty;

      return { product, index, score };
    })
    .sort((left, right) => (right.score === left.score ? left.index - right.index : right.score - left.score))
    .slice(0, limit)
    .map((entry) => entry.product);
};

const buildNewsCandidates = ({ news, profile, collaborativeSignals, limit = 3 }) => {
  const directNewsScores = toMap(profile.topNews);
  const newsCategoryScores = toMap(profile.topNewsCategories);
  const seenNewsIds = new Set(profile.seenNewsIds || []);

  return (Array.isArray(news) ? news : [])
    .map((item, index) => {
      const directScore = directNewsScores.get(String(item.id)) || 0;
      const categoryScore = newsCategoryScores.get(String(item.category)) || 0;
      const collaborativeScore = collaborativeSignals.newsScores.get(String(item.id)) || 0;
      const contentAffinity = getNewsContentAffinity(item, profile);
      const ageInDays = getAgeInDays(item?.date);
      const freshnessBoost = ageInDays === null ? 0.25 : clamp(1 - ageInDays / 120, 0, 1) * 0.7;
      const repeatPenalty = seenNewsIds.has(String(item.id)) ? Math.min(0.95, directScore * 0.12) : 0;
      const score =
        0.2 +
        directScore * 1.35 +
        categoryScore * 1.1 +
        collaborativeScore * 1.15 +
        contentAffinity +
        freshnessBoost -
        repeatPenalty;

      return { item, index, score };
    })
    .sort((left, right) => (right.score === left.score ? left.index - right.index : right.score - left.score))
    .slice(0, limit)
    .map((entry) => entry.item);
};

const buildFallbackRecommendations = ({ products, news, productLimit = 4, newsLimit = 3 }) => ({
  products: (Array.isArray(products) ? products : []).slice(0, productLimit),
  news: [...(Array.isArray(news) ? news : [])]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, newsLimit)
});

const sanitizeProfileForStorage = (profile) => ({
  model: profile.model,
  isPersonalized: profile.isPersonalized,
  signalCount: profile.signalCount,
  segment: profile.segment,
  summary: profile.summary,
  topCategories: profile.topCategories,
  topSubCategories: profile.topSubCategories,
  topNewsCategories: profile.topNewsCategories,
  topProducts: profile.topProducts,
  topNews: profile.topNews,
  topRoutes: profile.topRoutes,
  lastActiveAt: profile.lastActiveAt
});

export const persistPersonalizationProfile = async ({
  client,
  visitorId,
  ipHash = '',
  userAgentHash = '',
  events = []
}) => {
  const profile = buildPersonalizationProfile({
    visitorId,
    ipHash,
    userAgentHash,
    events
  });

  await upsertPersonalizationProfile(client, {
    visitorId,
    ipHash,
    userAgentHash,
    segment: profile.segment,
    summary: profile.summary,
    profile: sanitizeProfileForStorage(profile),
    lastActiveAt: profile.lastActiveAt
  });

  return profile;
};

export const getRecommendationsForVisitor = async ({
  client,
  visitorId,
  ipHash = '',
  userAgentHash = '',
  products = [],
  news = [],
  productLimit = 4,
  newsLimit = 3
}) => {
  const visitorEvents = await listPersonalizationEventsByVisitor(client, visitorId, 250);
  const profile = await persistPersonalizationProfile({
    client,
    visitorId,
    ipHash,
    userAgentHash,
    events: visitorEvents
  });

  if (!profile.isPersonalized) {
    const fallback = buildFallbackRecommendations({
      products,
      news,
      productLimit,
      newsLimit
    });

    return {
      visitorId,
      profile,
      products: fallback.products,
      news: fallback.news
    };
  }

  const storedProfiles = await listRecentPersonalizationProfiles(client, {
    excludeVisitorId: visitorId,
    limit: 60
  });
  const similarVisitors = pickSimilarVisitors(profile, storedProfiles);
  const similarityByVisitorId = new Map(similarVisitors.map((entry) => [entry.visitorId, entry.similarity]));
  const collaborativeEvents = await listRecentPersonalizationEventsByVisitors(
    client,
    similarVisitors.map((entry) => entry.visitorId),
    600
  );
  const collaborativeSignals = buildCollaborativeSignals(collaborativeEvents, similarityByVisitorId);

  return {
    visitorId,
    profile,
    products: buildProductCandidates({
      products,
      profile,
      collaborativeSignals,
      limit: productLimit
    }),
    news: buildNewsCandidates({
      news,
      profile,
      collaborativeSignals,
      limit: newsLimit
    })
  };
};

export const createNormalizedPersonalizationEvent = (payload = {}) => {
  const entityType = normalizeText(payload.entityType || 'page');
  const action = normalizeText(payload.action || 'view');

  return {
    entityType,
    action,
    itemId: normalizeText(payload.itemId) || undefined,
    route: normalizeText(payload.route) || undefined,
    category: normalizeText(payload.category) || undefined,
    subCategory: normalizeText(payload.subCategory) || undefined,
    newsCategory: normalizeText(payload.newsCategory) || undefined,
    locale: normalizeText(payload.locale) || undefined,
    metadata: typeof payload.metadata === 'object' && payload.metadata ? payload.metadata : {},
    weight: Number.isFinite(Number(payload.weight))
      ? Number(payload.weight)
      : getDefaultEventWeight({ entityType, action })
  };
};
