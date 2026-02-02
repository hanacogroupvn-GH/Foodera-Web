
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Filter, Calendar, ArrowUpDown } from 'lucide-react';
import { useData } from '../context/DataContext';
import { NewsCategory } from '../types';

const News: React.FC = () => {
  const { news } = useData();
  const [activeCategory, setActiveCategory] = useState<NewsCategory | 'All'>('All');
  const [activeYear, setActiveYear] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const categories: (NewsCategory | 'All')[] = ['All', 'Market Insights', 'Company Updates', 'Sustainability', 'Events'];
  const years = ['All', '2024', '2023'];

  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const categoryMatch = activeCategory === 'All' || item.category === activeCategory;
      const yearMatch = activeYear === 'All' || item.date.includes(activeYear);
      return categoryMatch && yearMatch;
    }).sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [news, activeCategory, activeYear, sortOrder]);

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="bg-gray-50 border-b border-gray-100 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-[900] text-gray-900 mb-6 tracking-tight">News & Insights</h1>
            <p className="text-xl text-gray-500 leading-relaxed font-medium">
              Professional perspectives on global agricultural trends, trade activities, and Foodmax corporate developments.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-[136px] z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">Category:</span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    activeCategory === cat 
                      ? 'bg-foodmax-forest text-white border-foodmax-forest shadow-lg' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-foodmax-forest hover:text-foodmax-forest'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Calendar size={12} /> Year:
                </span>
                <select 
                  value={activeYear}
                  onChange={(e) => setActiveYear(e.target.value)}
                  className="text-xs font-bold text-gray-700 bg-transparent outline-none cursor-pointer"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="h-6 w-px bg-gray-200"></div>

              <button 
                onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-foodmax-forest transition-colors"
              >
                <ArrowUpDown size={14} />
                {sortOrder === 'newest' ? 'Latest First' : 'Oldest First'}
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
                  to={`/news/${item.id}`}
                  className="group block"
                >
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100 mb-8 border border-gray-100 shadow-sm group-hover:shadow-xl transition-all duration-500">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[10px] font-black text-foodmax-forest uppercase tracking-widest px-2 py-1 bg-foodmax-forest/5 rounded">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {item.date}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-foodmax-forest transition-colors leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2 font-medium">
                      {item.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-black text-foodmax-forest uppercase tracking-widest group-hover:gap-2 transition-all">
                      Read Full Insight <ChevronRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-40 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <h3 className="text-2xl font-black text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500 mb-8">Adjust your filters to see more articles.</p>
              <button 
                onClick={() => { setActiveCategory('All'); setActiveYear('All'); }}
                className="px-8 py-3 bg-foodmax-forest text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Subscription Block */}
      <section className="py-24 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-6">Global Market Reports</h2>
          <p className="text-gray-500 mb-10 font-medium">Subscribe to receive our proprietary monthly analysis on Vietnamese agriculture directly in your inbox.</p>
          <form className="flex flex-col sm:flex-row gap-4">
            <input 
              type="email" 
              placeholder="Business Email" 
              className="flex-grow px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-foodmax-forest/20 focus:border-foodmax-forest transition-all"
            />
            <button className="px-10 py-4 bg-foodmax-forest text-white font-black rounded-xl hover:bg-foodmax-lime hover:text-foodmax-forest transition-all shadow-lg uppercase text-xs tracking-widest">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default News;
