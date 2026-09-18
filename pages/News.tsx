
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight, BookOpen, ArrowRight, Sparkles,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { getNewsPath } from '../lib/newsSeo';
import AppShellLoader from '../components/AppShellLoader';
import { useLocale } from '../context/LocaleContext';
import { formatDisplayDate, localizeNewsItem } from '../lib/contentLocalization';
import { useDocumentMeta, BASE_URL } from '../lib/useDocumentMeta';
import InteractiveMapSection from '../components/InteractiveMapSection';

/* ── component ────────────────────────────────────────────── */
const News: React.FC = () => {
  const { activeNews: news, isLoading } = useData();
  const { locale } = useLocale();
  const [visibleCount, setVisibleCount] = useState(9);

  const pillarTitle = 'The New Era of Vietnamese Agricultural Exports';
  const pillarSubtitle = 'A Comprehensive B2B Sourcing Guide';

  useDocumentMeta({
    title: locale === 'zh'
      ? '越南农产品出口新纪元：全面的B2B采购指南'
      : `${pillarTitle}: ${pillarSubtitle}`,
    description: locale === 'zh'
      ? '深入了解越南农业出口市场的最新趋势、合规要求和采购策略。FoodEra专业市场情报中心。'
      : 'In-depth market intelligence on Vietnamese agricultural exports. Trends, compliance, sourcing strategies, and trade insights for global B2B buyers.',
    canonicalUrl: `${BASE_URL}/news`,
    ogUrl: `${BASE_URL}/news`,
  });

  const copy = locale === 'zh'
    ? {
        readMore: '更多',
        featured: '精选新闻',
        allNews: '全部新闻',
        noArticles: '暂无文章',
        subscribe: '订阅',
        businessEmail: '商务邮箱',
        reports: '获取专业市场报告',
        reportsDesc: '订阅我们的月度分析，直接接收越南农业市场洞察。',
        loader: '正在加载市场洞察...',
        articlesCount: '篇文章',
        loadMore: '加载更多',
      }
    : {
        readMore: 'More',
        featured: 'Featured News',
        allNews: 'All News',
        noArticles: 'No articles yet',
        subscribe: 'Subscribe',
        businessEmail: 'Business Email',
        reports: 'Get Professional Market Reports',
        reportsDesc: 'Subscribe to receive our proprietary monthly analysis on Vietnamese agriculture directly in your inbox.',
        loader: 'Loading market insights...',
        articlesCount: 'articles',
        loadMore: 'Load More',
      };

  const localizedNews = useMemo(() => news.map(item => localizeNewsItem(item, locale)), [locale, news]);

  const sortedByDate = useMemo(() =>
    [...localizedNews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [localizedNews]);

  const featured = sortedByDate[0];
  const restArticles = sortedByDate.slice(1);

  if (isLoading && news.length === 0) {
    return <AppShellLoader compact label={copy.loader} />;
  }

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-500">

      {/* ═══════════════════════════════════════════════════════
          SECTION 1: Pillar Hero
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-foodera-forest to-gray-900 text-white py-16 md:py-20">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-foodera-lime/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-[900] leading-[1.08] tracking-tight mb-3">
              {pillarTitle}
            </h1>
            <p className="text-xl md:text-2xl font-bold text-foodera-lime/90">
              {pillarSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3: Featured Article Spotlight
      ═══════════════════════════════════════════════════════ */}
      {featured && (
        <section className="py-20 bg-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-10">
              <Sparkles size={18} className="text-foodera-forest" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-foodera-forest">{copy.featured}</h2>
            </div>
            <Link
              to={getNewsPath(featured)}
              className="group grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
            >
              <div className="aspect-[16/10] overflow-hidden rounded-3xl border border-gray-200 shadow-lg group-hover:shadow-2xl transition-all duration-500">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {formatDisplayDate(featured.date, locale)}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-[900] text-gray-900 mb-5 leading-snug group-hover:text-foodera-forest transition-colors">
                  {featured.title}
                </h3>
                <p className="text-gray-500 text-base leading-relaxed mb-8 font-medium line-clamp-3">
                  {featured.excerpt}
                </p>
                <span className="inline-flex items-center gap-2 text-xs font-black text-foodera-forest uppercase tracking-widest group-hover:gap-3 transition-all">
                  {copy.readMore} <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 4: All News
      ═══════════════════════════════════════════════════════ */}
      {restArticles.length > 0 && (
        <section className="py-20 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-6 mb-12">
              <h2 className="text-2xl md:text-3xl font-[900] text-gray-900">
                {copy.allNews}
              </h2>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                {restArticles.length} {copy.articlesCount}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {restArticles.slice(0, visibleCount).map(item => (
                <Link
                  key={item.id}
                  to={getNewsPath(item)}
                  className="group block h-full"
                >
                  <article className="h-full flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-500 group-hover:-translate-y-1">
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-col flex-1 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {formatDisplayDate(item.date, locale)}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-gray-900 mb-3 leading-snug group-hover:text-foodera-forest transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-5 font-medium line-clamp-2 flex-1">
                        {item.excerpt}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-foodera-forest uppercase tracking-widest group-hover:gap-2.5 transition-all">
                        {copy.readMore} <ChevronRight size={12} />
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {restArticles.length > visibleCount && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => setVisibleCount(prev => prev + 9)}
                  className="px-8 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:text-foodera-forest hover:border-foodera-forest transition-colors tracking-[0.2em] uppercase shadow-sm hover:shadow-md"
                >
                  {copy.loadMore} (+{restArticles.length - visibleCount})
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {!featured && restArticles.length === 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-16 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">{copy.noArticles}</p>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          Interactive Growing Areas Map (Bên dưới các bài news)
      ═══════════════════════════════════════════════════════ */}
      <InteractiveMapSection />

      {/* ═══════════════════════════════════════════════════════
          SECTION 5: Pillar Summary / Internal Linking
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-foodera-forest to-foodera-forest/90 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <BookOpen size={32} className="mx-auto mb-6 text-foodera-lime" />
          <h2 className="text-3xl md:text-4xl font-[900] mb-6">{copy.reports}</h2>
          <p className="text-white/70 mb-10 font-medium text-lg max-w-2xl mx-auto">{copy.reportsDesc}</p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto" onSubmit={e => e.preventDefault()}>
            <input
              type="email"
              placeholder={copy.businessEmail}
              className="flex-grow px-6 py-4 bg-white/10 border border-white/20 rounded-xl outline-none focus:border-foodera-lime/50 focus:bg-white/15 text-white placeholder-white/40 font-medium transition-all"
            />
            <button className="px-10 py-4 bg-foodera-lime text-foodera-forest font-black rounded-xl hover:bg-white transition-all shadow-lg uppercase text-xs tracking-widest">
              {copy.subscribe}
            </button>
          </form>
        </div>
      </section>

    </div>
  );
};

export default News;
