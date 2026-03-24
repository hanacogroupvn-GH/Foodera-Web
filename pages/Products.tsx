
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import SectionHeading from '../components/SectionHeading';
import ProductCard from '../components/ProductCard';
import AppShellLoader from '../components/AppShellLoader';
import { Filter, X, ChevronDown, Settings2, ChevronLeft, ChevronRight } from 'lucide-react';
import { findProductCategoryBySlug, normalizeProductCategorySlug, PRODUCT_CATEGORIES } from '../lib/productCategories';
import { useLocale } from '../context/LocaleContext';
import { getCategoryLabel, getLocalizedFilterValue, localizeProduct } from '../lib/contentLocalization';
import { appRoutes } from '../lib/routes';

const ITEMS_PER_PAGE = 9;

interface ProductsProps {
  categorySlug?: string;
}

const Products: React.FC<ProductsProps> = ({ categorySlug }) => {
  const { activeProducts: products, isLoading } = useData();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const { category } = useParams<{ category?: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const subCategoryParam = searchParams.get('sub');
  const activeCategory = findProductCategoryBySlug(categorySlug || category);
  const filterCategory = activeCategory ? normalizeProductCategorySlug(activeCategory) : 'all';
  const filterSub = (subCategoryParam || 'all').toLowerCase();
  const [filterProcessing, setFilterProcessing] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const copy = locale === 'zh'
    ? {
        loader: '正在加载产品目录...',
        all: '全部',
        titleAll: '我们的出口产品目录',
        titlePortfolioSuffix: '产品系列',
        subtitle: '面向国际市场的高品质农产品，严格按照全球食品安全标准处理。',
        mainCategory: '主分类',
        productLines: '产品线',
        allVarieties: '全部品类',
        filters: '筛选',
        processingMethod: '加工方式',
        allProcesses: '全部工艺',
        showing: '当前显示',
        verifiedItems: '个已验证出口产品',
        page: '页',
        of: '/',
        prev: '上一页',
        next: '下一页',
        emptyTitle: '当前分组暂无产品',
        emptyDesc: '我们正在更新符合这些条件的出口库存。',
        clearAllFilters: '清除所有筛选'
      }
    : {
        loader: 'Loading product portfolios...',
        all: 'All',
        titleAll: 'Our Export Portfolios',
        titlePortfolioSuffix: 'Portfolio',
        subtitle: 'Premium agricultural commodities processed to the highest global food safety standards.',
        mainCategory: 'Main Category',
        productLines: 'Product Lines',
        allVarieties: 'All Varieties',
        filters: 'Filters',
        processingMethod: 'Processing Method',
        allProcesses: 'All Processes',
        showing: 'Showing',
        verifiedItems: 'verified export items',
        page: 'Page',
        of: 'of',
        prev: 'Prev',
        next: 'Next',
        emptyTitle: 'Segment Empty',
        emptyDesc: 'We are currently updating our available export stock for these specific criteria.',
        clearAllFilters: 'Clear All Filters'
      };

  useEffect(() => {
    setFilterProcessing('all');
  }, [filterCategory, filterSub]);

  const handleCategoryChange = (newCat: string) => {
    if (newCat === copy.all) {
      navigate(appRoutes.products);
      setShowFilters(false);
      return;
    }

    navigate(appRoutes.productsByCategory(newCat));
    setShowFilters(false);
  };

  const handleSubCategoryChange = (newSub: string) => {
    if (!activeCategory) {
      return;
    }

    navigate(newSub === 'all' ? appRoutes.productsByCategory(activeCategory) : appRoutes.productLine(activeCategory, newSub));
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    navigate(appRoutes.products);
    setFilterProcessing('all');
    setShowFilters(false);
  };

  const filteredProducts = products.filter(p => {
    const catMatch = !activeCategory || p.category === activeCategory;
    const subMatch = filterSub === 'all' || p.subCategory.toLowerCase() === filterSub.toLowerCase();
    const procMatch = filterProcessing === 'all' || (p.filters.processing && p.filters.processing.toLowerCase() === filterProcessing.toLowerCase());
    return catMatch && subMatch && procMatch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterSub, filterProcessing]);

  const categories = useMemo(
    () => [copy.all, ...PRODUCT_CATEGORIES.filter((cat) => products.some((product) => product.category === cat))],
    [copy.all, products]
  );

  const subs = useMemo(
    () =>
      PRODUCT_CATEGORIES.reduce((output, cat) => {
        const lines: string[] = Array.from(
          new Set<string>(products.filter((product) => product.category === cat).map((product) => product.subCategory))
        )
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

        if (lines.length) {
          output[cat] = lines;
        }

        return output;
      }, {} as Record<string, string[]>),
    [products]
  );

  const activeSubCategories = activeCategory ? subs[activeCategory] || [] : [];
  const activeCategoryKey = activeCategory ? normalizeProductCategorySlug(activeCategory) : 'all';

  const processingMethods = {
    'rice': ['Standard', 'Soft', 'Premium', 'Luxury'],
    'coffee': ['Wet Polished', 'Semi Washed', 'Cleaned', 'Fully Washed', 'Dry Processed']
  };

  // Capitalize category for display in the heading
  const displayCategory = (() => {
    return activeCategory ? getCategoryLabel(activeCategory, locale) : filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1);
  })();
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  const pageStart = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(pageStart, pageStart + ITEMS_PER_PAGE);
  const visibleStart = filteredProducts.length === 0 ? 0 : pageStart + 1;
  const visibleEnd = Math.min(pageStart + paginatedProducts.length, filteredProducts.length);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (isLoading && products.length === 0) {
    return <AppShellLoader compact label={copy.loader} />;
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50 py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading 
            title={filterCategory === 'all' ? copy.titleAll : `${displayCategory} ${copy.titlePortfolioSuffix}`}
            subtitle={copy.subtitle}
            centered={false}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col lg:flex-row gap-16">
          <aside className="lg:w-1/4">
            <div className="sticky top-32">
              <div className="flex items-center justify-between lg:hidden mb-6 p-5 bg-gray-50 rounded-2xl border border-gray-200 cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
                <span className="font-black text-gray-900 flex items-center gap-2"><Filter size={18} className="text-foodmax-forest" /> {copy.filters}</span>
                {showFilters ? <X size={18} /> : <ChevronDown size={18} />}
              </div>

              <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-12`}>
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 border-b border-gray-100 pb-4">{copy.mainCategory}</h4>
                  <div className="flex flex-wrap lg:flex-col gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`px-5 py-2.5 text-left rounded-xl text-xs font-black transition-all ${
                          (cat === copy.all ? filterCategory === 'all' : filterCategory === normalizeProductCategorySlug(cat))
                            ? 'bg-foodmax-forest text-white shadow-lg'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {cat === copy.all ? copy.all : getCategoryLabel(cat as any, locale)}
                      </button>
                    ))}
                  </div>
                </div>

                        {(filterCategory !== 'all') && (
                   <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 border-b border-gray-100 pb-4">{copy.productLines}</h4>
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => handleSubCategoryChange('all')}
                          className={`text-xs text-left px-3 py-2 rounded-lg transition-all ${filterSub === 'all' ? 'text-foodmax-forest font-black bg-foodmax-forest/5' : 'text-gray-400 hover:text-gray-900'}`}
                        >
                          {copy.allVarieties}
                        </button>
                        <div className="space-y-1">
                          {activeSubCategories.map(line => (
                            <button
                              key={line}
                              onClick={() => handleSubCategoryChange(line)}
                              className={`block w-full text-xs text-left px-3 py-2 rounded-lg transition-all ${
                                filterSub === line.toLowerCase() ? 'bg-foodmax-forest/5 text-foodmax-forest font-black' : 'text-gray-400 hover:text-gray-700'
                              }`}
                            >
                              {localizeProduct({
                                id: '__preview__',
                                name: '',
                                category: activeCategory || 'Rice',
                                subCategory: line,
                                description: '',
                                shortDescription: '',
                                image: '',
                                specifications: {},
                                filters: {}
                              }, locale).subCategory}
                            </button>
                          ))}
                        </div>
                      </div>
                   </div>
                )}

                {(activeCategoryKey === 'rice' || activeCategoryKey === 'coffee') && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
                      <Settings2 size={12} className="text-foodmax-lime" /> {copy.processingMethod}
                    </h4>
                    <div className="flex flex-col gap-1">
                       <button 
                          onClick={() => setFilterProcessing('all')}
                          className={`text-xs text-left px-3 py-2 rounded-lg transition-all ${filterProcessing === 'all' ? 'text-foodmax-forest font-black bg-foodmax-forest/5' : 'text-gray-400 hover:text-gray-900'}`}
                        >
                          {copy.allProcesses}
                        </button>
                        {processingMethods[activeCategoryKey as keyof typeof processingMethods].map(method => (
                          <button
                            key={method}
                            onClick={() => setFilterProcessing(method.toLowerCase())}
                            className={`block w-full text-xs text-left px-3 py-2 rounded-lg transition-all ${
                              filterProcessing === method.toLowerCase() ? 'bg-foodmax-forest/5 text-foodmax-forest font-black' : 'text-gray-400 hover:text-gray-700'
                            }`}
                          >
                            {getLocalizedFilterValue(method, locale)}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <main className="lg:w-3/4">
            <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-500">
                {copy.showing} <span className="font-black text-gray-900">{visibleStart}-{visibleEnd}</span> {copy.of}{' '}
                <span className="font-black text-gray-900">{filteredProducts.length}</span> {copy.verifiedItems}
              </p>
            </div>

            {filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {paginatedProducts.map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-t border-gray-100 pt-8">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                      {copy.page} {safeCurrentPage} {copy.of} {totalPages}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={safeCurrentPage === 1}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-gray-600 transition-all hover:border-foodmax-forest hover:text-foodmax-forest disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft size={14} />
                        {copy.prev}
                      </button>
                      {pageNumbers.map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-11 min-w-11 rounded-xl px-4 text-xs font-black transition-all ${
                            safeCurrentPage === page
                              ? 'bg-foodmax-forest text-white shadow-lg'
                              : 'border border-gray-200 text-gray-600 hover:border-foodmax-forest hover:text-foodmax-forest'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={safeCurrentPage === totalPages}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-gray-600 transition-all hover:border-foodmax-forest hover:text-foodmax-forest disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {copy.next}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-32 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 animate-in fade-in duration-500">
                <X size={48} className="mx-auto mb-6 text-gray-300" />
                <h3 className="text-2xl font-black text-gray-900 mb-2">{copy.emptyTitle}</h3>
                <p className="text-gray-500 mb-10">{copy.emptyDesc}</p>
                <button 
                  onClick={handleClearFilters}
                  className="px-8 py-3 bg-foodmax-forest text-white rounded-xl font-black hover:bg-foodmax-lime hover:text-foodmax-forest transition-colors shadow-lg"
                >
                  {copy.clearAllFilters}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;
