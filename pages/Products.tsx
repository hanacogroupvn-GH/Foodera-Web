
import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import SectionHeading from '../components/SectionHeading';
import ProductCard from '../components/ProductCard';
import { Filter, X, ChevronDown, Settings2 } from 'lucide-react';

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

  useEffect(() => {
    if (category) setFilterCategory(category);
    if (subCategoryParam) setFilterSub(subCategoryParam);
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

  const categories = ['All', 'Rice', 'Coffee', 'Agriculture'];
  
  const subs = {
    'Rice': ['Long Grain White Rice', 'Premium & Fragrant Rice', 'Short & Medium Grain Rice'],
    'Coffee': ['Specialty Coffee', 'Robusta Coffee', 'Arabica Coffee'],
    'Agriculture': ['Spices', 'Cashew Kernels', 'IQF Frozen Fruit']
  };

  const processingMethods = {
    'rice': ['Standard', 'Soft', 'Premium', 'Luxury'],
    'coffee': ['Wet Polished', 'Semi Washed', 'Cleaned', 'Fully Washed', 'Dry Processed']
  };

  // Capitalize category for display in the heading
  const displayCategory = filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1);

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
                        {Object.entries(subs).map(([cat, lines]) => (
                          (filterCategory === cat.toLowerCase()) && (
                            <div key={cat} className="space-y-1">
                              {lines.map(line => (
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
                          )
                        ))}
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
                Displaying <span className="font-black text-gray-900">{filteredProducts.length}</span> verified export items
              </p>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
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
