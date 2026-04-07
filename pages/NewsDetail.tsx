import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Printer, Clock, CalendarDays, ChevronRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getNewsPath, getNewsSlug, normalizeNewsSlug } from '../lib/newsSeo';
import AppShellLoader from '../components/AppShellLoader';
import { useLocale } from '../context/LocaleContext';
import { usePersonalization } from '../context/PersonalizationContext';
import { formatDisplayDate, getNewsCategoryLabel, localizeNewsItem } from '../lib/contentLocalization';
import { appRoutes } from '../lib/routes';

type ContentBlock =
  | { type: 'heading'; text: string; id: string }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'paragraph'; text: string };

const stripSectionPrefix = (value: string) => {
  return value.replace(/^(section|chapter|part)\s*\d+\s*[:\-]?\s*/i, '').trim();
};

const slugify = (value: string, fallbackIndex: number) => {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  return slug || `section-${fallbackIndex + 1}`;
};

const toSafeImageUrl = (value: string): string | null => {
  try {
    const nextUrl = new URL(value.trim());
    if (nextUrl.protocol === 'http:' || nextUrl.protocol === 'https:') {
      return nextUrl.toString();
    }
  } catch {
    // Ignore invalid URL and render as normal paragraph.
  }

  return null;
};

const IMAGE_MARKER_REGEX = /\[\[IMAGE:([\s\S]*?)\]\]/i;

const parseImagePayload = (
  payload: string,
  defaultImageAlt: string
): { src: string; alt: string; caption?: string } | null => {
  const normalizedPayload = payload
    .replace(/\r?\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^['"`]+|['"`]+$/g, '')
    .trim();
  if (!normalizedPayload) return null;

  const segments = normalizedPayload.split('|').map((part) => part.trim());
  const safeUrl = toSafeImageUrl(segments[0] || '');
  if (!safeUrl) return null;

  const alt = segments[1] || defaultImageAlt;
  const caption = segments[2] || undefined;
  return { src: safeUrl, alt, caption };
};

const extractInlineImageMarker = (
  value: string,
  defaultImageAlt: string
): { before: string; image: { src: string; alt: string; caption?: string }; after: string } | null => {
  const match = value.match(IMAGE_MARKER_REGEX);
  if (!match) return null;

  const markerStart = match.index ?? 0;
  const markerText = match[0];
  const before = value.slice(0, markerStart).trim();
  const after = value.slice(markerStart + markerText.length).trim();

  const parsed = parseImagePayload(match[1] || '', defaultImageAlt);
  if (!parsed) return null;

  return {
    before,
    image: parsed,
    after
  };
};

const createContentBlocks = (paragraphs: string[], defaultImageAlt: string): ContentBlock[] => {
  const blocks: ContentBlock[] = [];

  paragraphs.forEach((raw, index) => {
    const text = raw.trim();
    if (!text) return;

    // Marker syntax: [[IMAGE:https://...|Alt text|Optional caption]]
    const parsedMarker = extractInlineImageMarker(text, defaultImageAlt);
    if (parsedMarker) {
      if (parsedMarker.before) {
        blocks.push({ type: 'paragraph', text: parsedMarker.before });
      }

      blocks.push({
        type: 'image',
        src: parsedMarker.image.src,
        alt: parsedMarker.image.alt,
        caption: parsedMarker.image.caption
      });

      if (parsedMarker.after) {
        blocks.push({ type: 'paragraph', text: parsedMarker.after });
      }
      return;
    }

    const numberedLabelWithBodyMatch = text.match(
      /^(\d{1,2})\s*[\.\)\-]?\s*([\p{L}\p{N}\s&/.-]{2,60})\s*[:：]\s+(.+)$/u
    );
    if (numberedLabelWithBodyMatch) {
      const label = `${numberedLabelWithBodyMatch[1]} ${numberedLabelWithBodyMatch[2].trim()}`;
      blocks.push({
        type: 'heading',
        text: label,
        id: slugify(label, index)
      });
      blocks.push({ type: 'paragraph', text: numberedLabelWithBodyMatch[3].trim() });
      return;
    }

    const numberedStandaloneHeadingMatch = text.match(
      /^(\d{1,2})\s*[\.\)\-]?\s*([\p{L}\p{N}\s&/.-]{2,60})$/u
    );
    if (numberedStandaloneHeadingMatch) {
      const headingText = `${numberedStandaloneHeadingMatch[1]} ${numberedStandaloneHeadingMatch[2].trim()}`;
      blocks.push({
        type: 'heading',
        text: headingText,
        id: slugify(headingText, index)
      });
      return;
    }

    const localizedSectionMatch = text.match(/^第\s*\d+\s*(部分|章|节)\s*[:：\-]?\s*(.*)$/u);
    if (localizedSectionMatch) {
      const headingText = localizedSectionMatch[2]?.trim() || text.trim();
      blocks.push({
        type: 'heading',
        text: headingText,
        id: slugify(headingText, index)
      });
      return;
    }

    const sectionMatch = text.match(/^(section|chapter|part)\s*\d+\s*[:\-]?\s*(.*)$/i);
    if (sectionMatch) {
      const headingText = stripSectionPrefix(text);
      blocks.push({
        type: 'heading',
        text: headingText || `Section ${index + 1}`,
        id: slugify(headingText || `section-${index + 1}`, index)
      });
      return;
    }

    const conclusionMatch = text.match(/^(conclusion|key takeaways|outlook|结论|关键要点|展望)\s*[:：\-]?\s*(.*)$/iu);
    if (conclusionMatch) {
      const headingText = conclusionMatch[1];
      const remainder = conclusionMatch[2]?.trim();
      blocks.push({
        type: 'heading',
        text: headingText.charAt(0).toUpperCase() + headingText.slice(1),
        id: slugify(headingText, index)
      });
      if (remainder) {
        blocks.push({ type: 'paragraph', text: remainder });
      }
      return;
    }

    const shortLabelMatch = text.match(/^([\p{L}\p{N}\s&/.-]{2,40})\s*[:：]\s+(.+)$/u);
    if (shortLabelMatch) {
      blocks.push({
        type: 'heading',
        text: shortLabelMatch[1].trim(),
        id: slugify(shortLabelMatch[1], index)
      });
      blocks.push({ type: 'paragraph', text: shortLabelMatch[2].trim() });
      return;
    }

    if (text.endsWith(':') && text.split(/\s+/).length <= 8) {
      const headingText = text.slice(0, -1).trim();
      blocks.push({ type: 'heading', text: headingText, id: slugify(headingText, index) });
      return;
    }

    const looksLikeStandaloneHeading =
      index > 0 &&
      text.length <= 72 &&
      text.split(/\s+/).length <= 10 &&
      !/[.!?]$/.test(text);

    if (looksLikeStandaloneHeading) {
      blocks.push({ type: 'heading', text, id: slugify(text, index) });
      return;
    }

    blocks.push({ type: 'paragraph', text });
  });

  return blocks;
};

const toIsoDate = (value: string): string | null => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
};

const estimateReadTime = (paragraphs: string[]) => {
  const words = paragraphs
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 220));
};

const clearManagedSeoTags = () => {
  document.head
    .querySelectorAll('[data-news-seo="managed"]')
    .forEach((node) => node.parentNode?.removeChild(node));
};

const appendMetaTag = (attribute: 'name' | 'property', key: string, content: string) => {
  const tag = document.createElement('meta');
  tag.setAttribute(attribute, key);
  tag.setAttribute('content', content);
  tag.setAttribute('data-news-seo', 'managed');
  document.head.appendChild(tag);
};

const appendLinkTag = (rel: string, href: string) => {
  const tag = document.createElement('link');
  tag.setAttribute('rel', rel);
  tag.setAttribute('href', href);
  tag.setAttribute('data-news-seo', 'managed');
  document.head.appendChild(tag);
};

const appendJsonLd = (payload: Record<string, unknown>) => {
  const tag = document.createElement('script');
  tag.type = 'application/ld+json';
  tag.setAttribute('data-news-seo', 'managed');
  tag.text = JSON.stringify(payload);
  document.head.appendChild(tag);
};

const decodeRouteSegment = (value?: string): string => {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const NewsDetail: React.FC = () => {
  const { slug: rawSlug, legacyId: rawLegacyId, legacySlug: rawLegacySlug } = useParams<{
    slug?: string;
    legacyId?: string;
    legacySlug?: string;
  }>();
  const navigate = useNavigate();
  const { activeNews: news, isLoading } = useData();
  const { locale } = useLocale();
  const { personalizedNews, hasPersonalizedContent, trackEvent } = usePersonalization();
  const primarySegment = useMemo(() => decodeRouteSegment(rawSlug), [rawSlug]);
  const legacyId = useMemo(() => decodeRouteSegment(rawLegacyId), [rawLegacyId]);
  const routeSlugSource = useMemo(
    () => decodeRouteSegment(rawLegacySlug || rawSlug),
    [rawLegacySlug, rawSlug]
  );
  const routeSlug = useMemo(() => normalizeNewsSlug(routeSlugSource), [routeSlugSource]);
  const article = useMemo(() => {
    if (legacyId) {
      const byLegacyId = news.find((item) => item.id === legacyId);
      if (byLegacyId) return byLegacyId;
    }

    if (routeSlug) {
      const bySlug = news.find((item) => getNewsSlug(item) === routeSlug);
      if (bySlug) return bySlug;
    }

    if (primarySegment) {
      return news.find((item) => item.id === primarySegment);
    }

    return undefined;
  }, [legacyId, news, primarySegment, routeSlug]);
  const [isImageBroken, setIsImageBroken] = useState(false);
  const localizedArticle = useMemo(() => (article ? localizeNewsItem(article, locale) : undefined), [article, locale]);
  const localizedNews = useMemo(() => news.map((item) => localizeNewsItem(item, locale)), [locale, news]);
  const copy = locale === 'zh'
    ? {
        loader: '正在加载文章...',
        notFound: '未找到文章',
        returnArchive: '返回新闻归档',
        backToInsights: '返回洞察列表',
        minRead: '分钟阅读',
        marketIntel: 'Foodmax 市场情报',
        onThisPage: '本页目录',
        continuousBrief: '这篇文章以单篇连续简报形式呈现。',
        discussInsight: '咨询这篇洞察',
        relatedInsights: '相关文章'
      }
    : {
        loader: 'Loading article...',
        notFound: 'Insight Not Found',
        returnArchive: 'Return to Archive',
        backToInsights: 'Back to Insights',
        minRead: 'Min Read',
        marketIntel: 'Foodmax Market Intelligence',
        onThisPage: 'On This Page',
        continuousBrief: 'This article is presented as a single continuous brief.',
        discussInsight: 'Discuss this insight',
        relatedInsights: 'Related Insights'
      };
  const personalizedRelatedNews = useMemo(
    () => (article ? personalizedNews.filter((item) => item.id !== article.id).slice(0, 3) : []),
    [article, personalizedNews]
  );
  const relatedNews = useMemo(() => {
    if (hasPersonalizedContent && personalizedRelatedNews.length > 0) {
      return personalizedRelatedNews;
    }

    return localizedNews.filter((item) => item.id !== article?.id).slice(0, 3);
  }, [article?.id, hasPersonalizedContent, localizedNews, personalizedRelatedNews]);
  const isUsingPersonalizedRelatedNews = hasPersonalizedContent && personalizedRelatedNews.length > 0;

  const paragraphs = useMemo(() => {
    if (!localizedArticle) return [];

    const content = Array.isArray(localizedArticle.content)
      ? localizedArticle.content
          .map((paragraph) => (typeof paragraph === 'string' ? paragraph.trim() : ''))
          .filter(Boolean)
      : [];

    if (!content.length && localizedArticle.excerpt?.trim()) {
      return [localizedArticle.excerpt.trim()];
    }

    if (localizedArticle.excerpt?.trim()) {
      const excerpt = localizedArticle.excerpt.trim();
      const firstParagraph = content[0]?.trim().toLowerCase();
      if (firstParagraph !== excerpt.toLowerCase()) {
        return [excerpt, ...content];
      }
    }

    return content;
  }, [localizedArticle]);

  const blocks = useMemo(
    () => createContentBlocks(paragraphs, localizedArticle?.title || article?.title || 'Foodmax article image'),
    [article?.title, localizedArticle?.title, paragraphs]
  );
  const displayBlocks = useMemo(() => {
    const imageSignatures = new Set<string>();
    return blocks.filter((block) => {
      if (block.type !== 'image') return true;

      const signature = `${block.src}__${block.alt || ''}__${block.caption || ''}`;
      if (imageSignatures.has(signature)) return false;
      imageSignatures.add(signature);
      return true;
    });
  }, [blocks]);
  const headingBlocks = useMemo(() => displayBlocks.filter((block) => block.type === 'heading'), [displayBlocks]);
  const readingMinutes = useMemo(() => estimateReadTime(paragraphs), [paragraphs]);
  const publishedIso = article ? toIsoDate(article.date) : null;
  const canonicalPath = article ? getNewsPath(article) : '';
  const canonicalUrl = typeof window !== 'undefined' && canonicalPath ? `${window.location.origin}${canonicalPath}` : '';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [legacyId, rawLegacySlug, rawSlug, routeSlug]);

  useEffect(() => {
    if (!article || !canonicalPath) return;
    const expectedSlug = getNewsSlug(article);
    const isCanonical = !legacyId && routeSlug === expectedSlug;
    if (!isCanonical && window.location.pathname !== canonicalPath) {
      navigate(canonicalPath, { replace: true });
    }
  }, [article, canonicalPath, legacyId, navigate, routeSlug]);

  useEffect(() => {
    setIsImageBroken(false);
  }, [article?.id, article?.image]);

  useEffect(() => {
    if (!article) {
      return;
    }

    void trackEvent(
      {
        entityType: 'news',
        action: 'view',
        itemId: article.id,
        newsCategory: article.category,
        locale,
        metadata: {
          surface: 'news_detail'
        }
      },
      {
        dedupeKey: `news-view:${article.id}`,
        dedupeTtlMs: 2500
      }
    );
  }, [article, locale, trackEvent]);

  useEffect(() => {
    if (!article) return;

    const previousTitle = document.title;
    const seoTitle = localizedArticle?.title || article.title;
    const title = `${seoTitle} | ${locale === 'zh' ? 'Foodmax 资讯' : 'Foodmax News'}`;
    const description = (localizedArticle?.excerpt || paragraphs[0] || '').trim().slice(0, 160);

    document.title = title;
    clearManagedSeoTags();

    if (description) {
      appendMetaTag('name', 'description', description);
      appendMetaTag('property', 'og:description', description);
      appendMetaTag('name', 'twitter:description', description);
    }

    appendMetaTag('property', 'og:type', 'article');
    appendMetaTag('property', 'og:title', title);
    appendMetaTag('name', 'twitter:card', 'summary_large_image');
    appendMetaTag('name', 'twitter:title', title);

    if (article.image) {
      appendMetaTag('property', 'og:image', article.image);
      appendMetaTag('name', 'twitter:image', article.image);
    }

    if (canonicalUrl) {
      appendMetaTag('property', 'og:url', canonicalUrl);
      appendLinkTag('canonical', canonicalUrl);
    }

    appendJsonLd({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: seoTitle,
      description,
      image: article.image ? [article.image] : undefined,
      datePublished: publishedIso || undefined,
      dateModified: publishedIso || undefined,
      mainEntityOfPage: canonicalUrl || undefined,
      articleBody: paragraphs.join('\n\n'),
      author: {
        '@type': 'Organization',
        name: 'Foodmax Trade Desk'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Foodmax'
      }
    });

    return () => {
      clearManagedSeoTags();
      document.title = previousTitle;
    };
  }, [article, canonicalUrl, locale, localizedArticle, paragraphs, publishedIso]);

  const handleShare = async () => {
    if (!article) return;

    const url = canonicalUrl || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: localizedArticle?.title || article.title,
          text: localizedArticle?.excerpt || article.excerpt,
          url
        });
        return;
      } catch {
        // Fall back to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Ignore if clipboard is blocked.
    }
  };

  if (isLoading && news.length === 0) {
    return <AppShellLoader compact label={copy.loader} />;
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-black text-gray-900 mb-4">{copy.notFound}</h1>
        <button onClick={() => navigate(appRoutes.news)} className="px-8 py-3 bg-foodmax-forest text-white rounded-xl font-bold">
          {copy.returnArchive}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-white animate-in fade-in duration-500">
      <div className="bg-white/85 backdrop-blur border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-4">
          <Link to={appRoutes.news} className="inline-flex items-center gap-2 text-xs font-black text-gray-500 hover:text-foodmax-forest transition-colors uppercase tracking-widest">
            <ArrowLeft size={14} />
            {copy.backToInsights}
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-foodmax-forest transition-colors rounded-lg hover:bg-gray-50"
              aria-label={locale === 'zh' ? '分享文章' : 'Share article'}
            >
              <Share2 size={18} />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-foodmax-forest transition-colors rounded-lg hover:bg-gray-50"
              onClick={() => window.print()}
              aria-label={locale === 'zh' ? '打印文章' : 'Print article'}
            >
              <Printer size={18} />
            </button>
          </div>
        </div>
      </div>

      <article className="py-10 md:py-14" itemScope itemType="https://schema.org/NewsArticle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-foodmax-forest/10 text-foodmax-forest text-[10px] font-black uppercase tracking-widest rounded-full">
                {getNewsCategoryLabel(article.category, locale)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400">
                <Clock size={14} />
                {readingMinutes} {copy.minRead}
              </span>
              <span className="text-xs font-bold text-gray-300">&bull;</span>
              <time
                dateTime={publishedIso || undefined}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest"
                itemProp="datePublished"
              >
                <CalendarDays size={14} />
                {formatDisplayDate(article.date, locale)}
              </time>
            </div>

            <h1 className="text-4xl md:text-6xl font-[900] text-gray-900 mb-6 leading-[1.08] tracking-tight" itemProp="headline">
              {localizedArticle?.title || article.title}
            </h1>

            {localizedArticle?.excerpt?.trim() && (
              <p
                className="text-lg md:text-2xl text-gray-600 leading-relaxed mb-10 font-medium max-w-3xl text-justify [text-align:justify] [text-justify:inter-word]"
                itemProp="description"
              >
                {localizedArticle?.excerpt}
              </p>
            )}
          </div>

          <figure className="w-full overflow-hidden rounded-3xl mb-14 border border-gray-100 shadow-xl bg-white">
            {!isImageBroken && article.image ? (
              <img
                src={article.image}
                alt={localizedArticle?.title || article.title}
                className="w-full h-[260px] md:h-[460px] object-cover"
                itemProp="image"
                loading="eager"
                onError={() => setIsImageBroken(true)}
              />
            ) : (
              <div className="w-full h-[260px] md:h-[460px] bg-gradient-to-br from-foodmax-forest to-foodmax-lime p-8 flex items-end">
                <p className="text-white text-2xl md:text-4xl font-black leading-tight max-w-3xl">{localizedArticle?.title || article.title}</p>
              </div>
            )}
            <figcaption className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">
              {copy.marketIntel}
            </figcaption>
          </figure>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-12">
            <section className="min-w-0">
              <div className="space-y-7" itemProp="articleBody">
                {displayBlocks.map((block, idx) =>
                  block.type === 'heading' ? (
                    <h2 key={`${block.id}-${idx}`} id={block.id} className="text-2xl md:text-3xl font-black text-gray-900 pt-4">
                      {block.text}
                    </h2>
                  ) : block.type === 'image' ? (
                    <figure key={`image-${idx}`} className="my-12 w-full max-w-3xl mx-auto rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-md">
                      <img
                        src={block.src}
                        alt={block.alt}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      {block.caption && (
                        <figcaption className="px-4 py-3 text-xs font-medium text-gray-500 border-t border-gray-100 text-center">
                          {block.caption}
                        </figcaption>
                      )}
                    </figure>
                  ) : (
                    <p
                      key={`paragraph-${idx}`}
                      className="text-lg md:text-[1.32rem] text-gray-700 leading-relaxed font-medium text-justify [text-align:justify] [text-justify:inter-word]"
                    >
                      {block.text}
                    </p>
                  )
                )}
              </div>
            </section>

            <aside className="lg:sticky lg:top-24 h-fit bg-gray-50 rounded-2xl border border-gray-100 p-6">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{copy.onThisPage}</h2>
              <div className="space-y-3">
                {headingBlocks.length > 0 ? (
                  headingBlocks.slice(0, 7).map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className="flex items-start gap-2 text-sm font-bold text-gray-600 hover:text-foodmax-forest transition-colors leading-snug"
                    >
                      <ChevronRight size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{heading.text}</span>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 font-medium">{copy.continuousBrief}</p>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link
                  to={appRoutes.contact}
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-foodmax-forest text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-foodmax-lime hover:text-foodmax-forest transition-all shadow-lg"
                >
                  {copy.discussInsight}
                </Link>
              </div>
            </aside>
          </div>

          <div className="sr-only" itemProp="author" itemScope itemType="https://schema.org/Organization">
            <span itemProp="name">Foodmax Trade Desk</span>
          </div>
        </div>
      </article>

      <section className="bg-gray-50 py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 mb-10 uppercase tracking-widest">
            {isUsingPersonalizedRelatedNews
              ? locale === 'zh'
                ? 'ä¸ºæ­¤è®¾å¤‡æŽ¨èçš„èµ„è®¯'
                : 'Recommended Insights for This Device'
              : copy.relatedInsights}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {relatedNews.map((related) => (
                <Link
                  key={related.id}
                  to={getNewsPath(related)}
                  className="group block"
                  onClick={() => {
                    void trackEvent(
                      {
                        entityType: 'news',
                        action: 'click',
                        itemId: related.id,
                        newsCategory: related.category,
                        locale,
                        metadata: {
                          surface: 'news_related'
                        }
                      },
                      {
                        dedupeKey: `news-click:${related.id}:related`,
                        dedupeTtlMs: 1200
                      }
                    );
                  }}
                >
                  <article className="h-full rounded-2xl border border-gray-100 bg-white p-3 shadow-sm group-hover:shadow-xl transition-all">
                    <div className="aspect-[16/9] rounded-xl overflow-hidden mb-5 border border-gray-100">
                      <img
                        src={related.image}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-foodmax-forest transition-colors leading-tight mb-2">
                      {related.title}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium line-clamp-2">{related.excerpt}</p>
                  </article>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewsDetail;
