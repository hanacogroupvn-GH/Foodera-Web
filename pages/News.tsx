
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Filter, Calendar, ArrowUpDown } from 'lucide-react';
import { useData } from '../context/DataContext';
import { NewsCategory } from '../types';
import { getNewsPath } from '../lib/newsSeo';
import AppShellLoader from '../components/AppShellLoader';
import { useLocale } from '../context/LocaleContext';
import { usePersonalization } from '../context/PersonalizationContext';
import { formatDisplayDate, getNewsCategoryLabel, localizeNewsItem } from '../lib/contentLocalization';
import { useDocumentMeta, BASE_URL } from '../lib/useDocumentMeta';

const extractYear = (value: string) => {
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    return String(new Date(parsed).getFullYear());
  }

  const fallbackMatch = value.match(/\b(20\d{2})\b/);
  return fallbackMatch?.[1] || null;
};

const News: React.FC = () => {
  const { activeNews: news, isLoading } = useData();
  const { locale } = useLocale();
  const { trackEvent } = usePersonalization();

  useDocumentMeta({
    title: locale === 'zh' ? '新闻与洞察' : 'News & Insights',
    description: locale === 'zh'
      ? '关于全球农产品趋势、贸易动态与 FoodEra 企业进展的专业市场分析与行业洞察。'
      : 'Professional perspectives on global agricultural trends, trade activities, and FoodEra corporate developments.',
    canonicalUrl: `${BASE_URL}/news`,
    ogUrl: `${BASE_URL}/news`,
  });
  const [activeCategory, setActiveCategory] = useState<NewsCategory | 'All'>('All');
  const [activeYear, setActiveYear] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const copy = locale === 'zh'
    ? {
        all: '全部',
        title: '新闻与洞察',
        subtitle: '关于全球农产品趋势、贸易动态与 FoodEra 企业进展的专业观点。',
        category: '分类：',
        year: '年份：',
        latestFirst: '最新优先',
        oldestFirst: '最早优先',
        readFull: '阅读完整文章',
        noResults: '未找到结果',
        noResultsDesc: '调整筛选条件以查看更多文章。',
        clearAllFilters: '清除所有筛选',
        reports: '全球市场报告',
        reportsDesc: '订阅我们的月度分析，直接接收越南农业市场洞察。',
        businessEmail: '商务邮箱',
        subscribe: '订阅',
        loader: '正在加载市场洞察...'
      }
    : {
        all: 'All',
        title: 'News & Insights',
        subtitle: 'Professional perspectives on global agricultural trends, trade activities, and FoodEra corporate developments.',
        category: 'Category:',
        year: 'Year:',
        latestFirst: 'Latest First',
        oldestFirst: 'Oldest First',
        readFull: 'Read Full Insight',
        noResults: 'No results found',
        noResultsDesc: 'Adjust your filters to see more articles.',
        clearAllFilters: 'Clear All Filters',
        reports: 'Global Market Reports',
        reportsDesc: 'Subscribe to receive our proprietary monthly analysis on Vietnamese agriculture directly in your inbox.',
        businessEmail: 'Business Email',
        subscribe: 'Subscribe',
        loader: 'Loading market insights...'
      };

  const localizedNews = useMemo(() => news.map((item) => localizeNewsItem(item, locale)), [locale, news]);

  const categories: (NewsCategory | 'All')[] = ['All', 'Market Insights', 'Company Updates', 'Sustainability', 'Events'];
  const years = useMemo(() => {
    const availableYears = Array.from(
      new Set(localizedNews.map((item) => extractYear(item.date)).filter((year): year is string => Boolean(year)))
    ).sort((left, right) => Number(right) - Number(left));

    return ['All', ...availableYears];
  }, [localizedNews]);

  const filteredNews = useMemo(() => {
    return localizedNews.filter(item => {
      const categoryMatch = activeCategory === 'All' || item.category === activeCategory;
      const yearMatch = activeYear === 'All' || extractYear(item.date) === activeYear;
      return categoryMatch && yearMatch;
    }).sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [activeCategory, activeYear, copy.all, localizedNews, sortOrder]);

  React.useEffect(() => {
    if (activeCategory === 'All' && activeYear === 'All') {
      return;
    }

    void trackEvent(
      {
        entityType: 'category',
        action: 'view',
        newsCategory: activeCategory === 'All' ? undefined : activeCategory,
        locale,
        metadata: {
          year: activeYear === 'All' ? undefined : activeYear,
          sortOrder
        }
      },
      {
        dedupeKey: `news-category:${activeCategory}:${activeYear}:${sortOrder}`,
        dedupeTtlMs: 1600
      }
    );
  }, [activeCategory, activeYear, locale, sortOrder, trackEvent]);

  if (isLoading && news.length === 0) {
    return <AppShellLoader compact label={copy.loader} />;
  }

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="bg-gray-50 border-b border-gray-100 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-[900] text-gray-900 mb-6 tracking-tight">{copy.title}</h1>
            <p className="text-xl text-gray-500 leading-relaxed font-medium">
              {copy.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-[136px] z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">{copy.category}</span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    activeCategory === cat 
                      ? 'bg-foodera-forest text-white border-foodera-forest shadow-lg' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-foodera-forest hover:text-foodera-forest'
                  }`}
                >
                  {cat === 'All' ? copy.all : getNewsCategoryLabel(cat as NewsCategory, locale)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Calendar size={12} /> {copy.year}
                </span>
                <select 
                  value={activeYear}
                  onChange={(e) => setActiveYear(e.target.value)}
                  className="text-xs font-bold text-gray-700 bg-transparent outline-none cursor-pointer"
                >
                  {years.map(y => <option key={y} value={y}>{y === 'All' ? copy.all : y}</option>)}
                </select>
              </div>

              <div className="h-6 w-px bg-gray-200"></div>

              <button 
                onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-foodera-forest transition-colors"
              >
                <ArrowUpDown size={14} />
                {sortOrder === 'newest' ? copy.latestFirst : copy.oldestFirst}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {filteredNews.map((item) => (
                <Link
                  key={item.id}
                  to={getNewsPath(item)}
                  onClick={() => {
                    void trackEvent(
                      {
                        entityType: 'news',
                        action: 'click',
                        itemId: item.id,
                        newsCategory: item.category,
                        locale,
                        metadata: {
                          surface: 'news_archive'
                        }
                      },
                      {
                        dedupeKey: `news-click:${item.id}:archive`,
                        dedupeTtlMs: 1200
                      }
                    );
                  }}
                  className="group block h-full"
                >
                  <div className="h-full flex flex-col">
                    <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100 mb-8 border border-gray-100 shadow-sm group-hover:shadow-xl transition-all duration-500">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[10px] font-black text-foodera-forest uppercase tracking-widest px-2 py-1 bg-foodera-forest/5 rounded">
                        {getNewsCategoryLabel(item.category, locale)}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {formatDisplayDate(item.date, locale)}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-foodera-forest transition-colors leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3 font-medium text-justify [text-align:justify] [text-justify:inter-word] flex-1">
                      {item.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-black text-foodera-forest uppercase tracking-widest group-hover:gap-2 transition-all">
                      {copy.readFull} <ChevronRight size={14} />
                    </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-40 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <h3 className="text-2xl font-black text-gray-900 mb-2">{copy.noResults}</h3>
              <p className="text-gray-500 mb-8">{copy.noResultsDesc}</p>
              <button 
                onClick={() => { setActiveCategory('All'); setActiveYear('All'); }}
                className="px-8 py-3 bg-foodera-forest text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg"
              >
                {copy.clearAllFilters}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Subscription Block */}
      <section className="py-24 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-6">{copy.reports}</h2>
          <p className="text-gray-500 mb-10 font-medium">{copy.reportsDesc}</p>
          <form className="flex flex-col sm:flex-row gap-4">
            <input 
              type="email" 
              placeholder={copy.businessEmail} 
              className="flex-grow px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest transition-all"
            />
            <button className="px-10 py-4 bg-foodera-forest text-white font-black rounded-xl hover:bg-foodera-lime hover:text-foodera-forest transition-all shadow-lg uppercase text-xs tracking-widest">
              {copy.subscribe}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default News;
