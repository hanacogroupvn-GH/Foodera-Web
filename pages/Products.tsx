
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import SectionHeading from '../components/SectionHeading';
import ProductCard from '../components/ProductCard';
import { Filter, X, ChevronDown, Settings2, ChevronLeft, ChevronRight } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '../lib/productCategories';

const ITEMS_PER_PAGE = 9;

const Products: React.FC = () => {
  const { products } = useData();
  const { category } = useParams<{ category?: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const subCategoryParam = searchParams.get('sub');

  const [filterCategory, setFilterCategory] = useState<string>(category || 'all');
  const [filterSub, setFilterSub] = useState<string>(subCategoryParam || 'all');
  const [filterProcessing, setFilterProcessing] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setFilterCategory(category || 'all');
    setFilterSub(subCategoryParam || 'all');
    setFilterProcessing('all');
  }, [category, subCategoryParam]);

  const handleCategoryChange = (newCat: string) => {
    setFilterCategory(newCat.toLowerCase());
    setFilterSub('all');
    setFilterProcessing('all');
  };

  const filteredProducts = products.filter(p => {
    const catMatch = filterCategory === 'all' || p.category.toLowerCase() === filterCategory.toLowerCase();
    const subMatch = filterSub === 'all' || p.subCategory.toLowerCase() === filterSub.toLowerCase();
    const procMatch = filterProcessing === 'all' || (p.filters.processing && p.filters.processing.toLowerCase() === filterProcessing.toLowerCase());
    return catMatch && subMatch && procMatch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterSub, filterProcessing]);

  const categories = useMemo(
    () => ['All', ...PRODUCT_CATEGORIES.filter((cat) => products.some((product) => product.category === cat))],
    [products]
  );

  const subs = useMemo(
    () =>
      PRODUCT_CATEGORIES.reduce((output, cat) => {
        const lines = Array.from(new Set(products.filter((product) => product.category === cat).map((product) => product.subCategory)))
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

        if (lines.length) {
          output[cat] = lines;
        }

        return output;
      }, {} as Record<string, string[]>),
    [products]
  );

  const activeCategory = PRODUCT_CATEGORIES.find((item) => item.toLowerCase() === filterCategory);
  const activeSubCategories = activeCategory ? subs[activeCategory] || [] : [];

  const processingMethods = {
    'rice': ['Standard', 'Soft', 'Premium', 'Luxury'],
    'coffee': ['Wet Polished', 'Semi Washed', 'Cleaned', 'Fully Washed', 'Dry Processed']
  };

  // Capitalize category for display in the heading
  const displayCategory = filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1);
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

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50 py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading 
            title={filterCategory === 'all' ? 'Our Export Portfolios' : `${displayCategory} Portfolio`}
            subtitle="Premium agricultural commodities processed to the highest global food safety standards."
            centered={false}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col lg:flex-row gap-16">
          <aside className="lg:w-1/4">
            <div className="sticky top-32">
              <div className="flex items-center justify-between lg:hidden mb-6 p-5 bg-gray-50 rounded-2xl border border-gray-200 cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
                <span className="font-black text-gray-900 flex items-center gap-2"><Filter size={18} className="text-foodmax-forest" /> Filters</span>
                {showFilters ? <X size={18} /> : <ChevronDown size={18} />}
              </div>

              <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-12`}>
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 border-b border-gray-100 pb-4">Main Category</h4>
                  <div className="flex flex-wrap lg:flex-col gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`px-5 py-2.5 text-left rounded-xl text-xs font-black transition-all ${
                          filterCategory === cat.toLowerCase() ? 'bg-foodmax-forest text-white shadow-lg' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {(filterCategory !== 'all') && (
                   <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 border-b border-gray-100 pb-4">Product Lines</h4>
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => setFilterSub('all')}
                          className={`text-xs text-left px-3 py-2 rounded-lg transition-all ${filterSub === 'all' ? 'text-foodmax-forest font-black bg-foodmax-forest/5' : 'text-gray-400 hover:text-gray-900'}`}
                        >
                          All Varieties
                        </button>
                        <div className="space-y-1">
                          {activeSubCategories.map(line => (
                            <button
                              key={line}
                              onClick={() => setFilterSub(line.toLowerCase())}
                              className={`block w-full text-xs text-left px-3 py-2 rounded-lg transition-all ${
                                filterSub === line.toLowerCase() ? 'bg-foodmax-forest/5 text-foodmax-forest font-black' : 'text-gray-400 hover:text-gray-700'
                              }`}
                            >
                              {line}
                            </button>
                          ))}
                        </div>
                      </div>
                   </div>
                )}

                {(filterCategory === 'rice' || filterCategory === 'coffee') && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
                      <Settings2 size={12} className="text-foodmax-lime" /> Processing Method
                    </h4>
                    <div className="flex flex-col gap-1">
                       <button 
                          onClick={() => setFilterProcessing('all')}
                          className={`text-xs text-left px-3 py-2 rounded-lg transition-all ${filterProcessing === 'all' ? 'text-foodmax-forest font-black bg-foodmax-forest/5' : 'text-gray-400 hover:text-gray-900'}`}
                        >
                          All Processes
                        </button>
                        {processingMethods[filterCategory as keyof typeof processingMethods].map(method => (
                          <button
                            key={method}
                            onClick={() => setFilterProcessing(method.toLowerCase())}
                            className={`block w-full text-xs text-left px-3 py-2 rounded-lg transition-all ${
                              filterProcessing === method.toLowerCase() ? 'bg-foodmax-forest/5 text-foodmax-forest font-black' : 'text-gray-400 hover:text-gray-700'
                            }`}
                          >
                            {method}
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
                Showing <span className="font-black text-gray-900">{visibleStart}-{visibleEnd}</span> of{' '}
                <span className="font-black text-gray-900">{filteredProducts.length}</span> verified export items
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
                      Page {safeCurrentPage} of {totalPages}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={safeCurrentPage === 1}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-gray-600 transition-all hover:border-foodmax-forest hover:text-foodmax-forest disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft size={14} />
                        Prev
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
                        Next
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-32 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 animate-in fade-in duration-500">
                <X size={48} className="mx-auto mb-6 text-gray-300" />
                <h3 className="text-2xl font-black text-gray-900 mb-2">Segment Empty</h3>
                <p className="text-gray-500 mb-10">We are currently updating our available export stock for these specific criteria.</p>
                <button 
                  onClick={() => { setFilterCategory('all'); setFilterSub('all'); setFilterProcessing('all'); }}
                  className="px-8 py-3 bg-foodmax-forest text-white rounded-xl font-black hover:bg-foodmax-lime hover:text-foodmax-forest transition-colors shadow-lg"
                >
                  Clear All Filters
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
