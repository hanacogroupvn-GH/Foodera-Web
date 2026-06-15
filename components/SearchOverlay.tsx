import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, FileText, ShoppingBag } from 'lucide-react';
import { Product, NewsItem } from '../types';
import { getNewsPath } from '../lib/newsSeo';
import { useLocale } from '../context/LocaleContext';
import { formatDisplayDate, localizeNewsItem, localizeProduct } from '../lib/contentLocalization';
import { appRoutes } from '../lib/routes';

interface SearchOverlayProps {
  searchOpen: boolean;
  onClose: () => void;
  products: Product[];
  news: NewsItem[];
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ searchOpen, onClose, products, news }) => {
  const { locale } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const copy = locale === 'zh'
    ? {
        searchPlaceholder: '搜索产品、新闻和出口信息...',
        portfolioMatches: '产品匹配',
        marketInsights: '市场洞察',
        noProductsMatch: '没有匹配的产品。',
        noArticlesFound: '没有找到相关文章。',
        keepTyping: '继续输入以查看结果...',
        quickBrowse: '快捷浏览',
        startSearch: '开始搜索',
        startSearchDesc: '输入产品名称、分类或产品线，浏览当前出口目录与市场内容。',
        riceExportPortfolios: '大米出口系列',
        coffeeTradeLines: '咖啡产品线',
        cashewKernelGrades: '腰果等级',
        pepperOriginSeries: '胡椒系列',
        marketAnalysisArchive: '市场分析归档',
      }
    : {
        searchPlaceholder: 'Search products, news, and export insights...',
        portfolioMatches: 'Portfolio Matches',
        marketInsights: 'Market Insights',
        noProductsMatch: 'No products match your query.',
        noArticlesFound: 'No articles found.',
        keepTyping: 'Keep typing to see results...',
        quickBrowse: 'Quick Browse',
        startSearch: 'Start your search',
        startSearchDesc: 'Type a product name, category, or product line to browse the current export catalog and market content.',
        riceExportPortfolios: 'Rice Export Portfolios',
        coffeeTradeLines: 'Coffee Trade Lines',
        cashewKernelGrades: 'Cashew Kernel Grades',
        pepperOriginSeries: 'Pepper Series',
        marketAnalysisArchive: 'Market Analysis Archive',
      };

  const localizedNews = useMemo(() => news.map((item) => localizeNewsItem(item, locale)), [locale, news]);

  const filteredProducts = useMemo(
    () =>
      searchQuery.length > 1
        ? products
            .filter((product) => {
              const localizedProduct = localizeProduct(product, locale);
              const query = searchQuery.toLowerCase();
              return (
                product.name.toLowerCase().includes(query) ||
                product.shortDescription.toLowerCase().includes(query) ||
                product.subCategory.toLowerCase().includes(query) ||
                localizedProduct.name.toLowerCase().includes(query) ||
                localizedProduct.shortDescription.toLowerCase().includes(query) ||
                localizedProduct.subCategory.toLowerCase().includes(query)
              );
            })
            .slice(0, 5)
        : [],
    [locale, products, searchQuery]
  );

  const filteredNews = useMemo(
    () =>
      searchQuery.length > 1
        ? localizedNews
            .filter(
              (item) =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 3)
        : [],
    [localizedNews, searchQuery]
  );

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      document.body.style.overflow = 'hidden';
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [searchOpen, onClose]);

  const handleSearchNavigation = (path: string) => {
    onClose();
    setSearchQuery('');
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white animate-in fade-in duration-300">
      <div className="h-24 flex items-center border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between gap-8">
          <div className="flex items-center gap-4 flex-grow">
            <Search size={28} className="text-foodera-forest" />
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={copy.searchPlaceholder}
              className="w-full text-2xl md:text-3xl font-black text-gray-900 outline-none placeholder:text-gray-200"
            />
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 h-[calc(100vh-6rem)] overflow-y-auto">
        {searchQuery.length > 1 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Product Results */}
            <div className="space-y-10">
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                  <ShoppingBag size={14} className="text-foodera-forest" /> 
                  {copy.portfolioMatches} ({filteredProducts.length})
                </h3>
                <div className="space-y-4">
                  {filteredProducts.map((product) => {
                    const localizedProduct = localizeProduct(product, locale);
                    return (
                    <button 
                      key={product.id} 
                      onClick={() => handleSearchNavigation(appRoutes.productById(product.id))}
                      className="w-full text-left group flex items-center gap-6 p-4 rounded-2xl border border-gray-50 hover:border-foodera-lime/30 hover:bg-foodera-lime/5 transition-all"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={product.image} className="w-full h-full object-cover" alt={localizedProduct.name} />
                      </div>
                      <div className="flex-grow">
                        <span className="text-[9px] font-black text-foodera-forest uppercase tracking-widest">{localizedProduct.subCategory}</span>
                        <h4 className="text-lg font-black text-gray-900 group-hover:text-foodera-forest transition-colors">{localizedProduct.name}</h4>
                        <p className="text-xs text-gray-500 line-clamp-1">{localizedProduct.shortDescription}</p>
                      </div>
                      <ArrowRight size={20} className="text-gray-300 group-hover:text-foodera-forest transition-colors" />
                    </button>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <p className="text-sm text-gray-400 italic">{copy.noProductsMatch}</p>
                  )}
                </div>
              </div>
            </div>

            {/* News Results */}
            <div className="space-y-10">
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                  <FileText size={14} className="text-foodera-forest" /> 
                  {copy.marketInsights} ({filteredNews.length})
                </h3>
                <div className="space-y-6">
                  {filteredNews.map(n => (
                    <button 
                      key={n.id} 
                      onClick={() => handleSearchNavigation(getNewsPath(n))}
                      className="w-full text-left group border-b border-gray-100 pb-6 hover:translate-x-1 transition-transform"
                    >
                      <span className="text-[9px] font-black text-foodera-lime uppercase tracking-widest mb-1 block">{formatDisplayDate(n.date, locale)}</span>
                      <h4 className="text-xl font-black text-gray-900 group-hover:text-foodera-forest transition-colors mb-2">{n.title}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2">{n.excerpt}</p>
                    </button>
                  ))}
                  {filteredNews.length === 0 && (
                    <p className="text-sm text-gray-400 italic">{copy.noArticlesFound}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : searchQuery.length === 1 ? (
          <div className="text-center py-20">
            <p className="text-lg font-medium text-gray-400">{copy.keepTyping}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-10">
            <div>
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">{copy.quickBrowse}</h4>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleSearchNavigation(appRoutes.productsByCategory('Rice'))} className="text-sm text-gray-500 hover:text-foodera-forest text-left">{copy.riceExportPortfolios}</button>
                <button onClick={() => handleSearchNavigation(appRoutes.productsByCategory('Coffee'))} className="text-sm text-gray-500 hover:text-foodera-forest text-left">{copy.coffeeTradeLines}</button>
                <button onClick={() => handleSearchNavigation(appRoutes.productsByCategory('Cashew'))} className="text-sm text-gray-500 hover:text-foodera-forest text-left">{copy.cashewKernelGrades}</button>
                <button onClick={() => handleSearchNavigation(appRoutes.productsByCategory('Pepper'))} className="text-sm text-gray-500 hover:text-foodera-forest text-left">{copy.pepperOriginSeries}</button>
                <button onClick={() => handleSearchNavigation(appRoutes.news)} className="text-sm text-gray-500 hover:text-foodera-forest text-left">{copy.marketAnalysisArchive}</button>
              </div>
            </div>
            <div className="md:col-span-2">
               <div className="bg-gray-50 rounded-[2rem] p-10">
                  <h4 className="text-xl font-black text-gray-900 mb-4">{copy.startSearch}</h4>
                  <p className="text-gray-500 font-medium mb-0">{copy.startSearchDesc}</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
