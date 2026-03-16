
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Mail, Phone, BarChart3, Globe, Search, ArrowRight, FileText, ShoppingBag, Download, Sun, Moon } from 'lucide-react';
import { PRODUCTS, NEWS } from '../constants';
import { Product, NewsItem } from '../types';
import Logo from '../Logo.png';
import { getNewsPath } from '../lib/newsSeo';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Search results logic
  const filteredProducts = searchQuery.length > 1 
    ? PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subCategory.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const filteredNews = searchQuery.length > 1
    ? NEWS.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isSearchOpen]);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const handleSearchNavigation = (path: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const handleThemeToggle = () => {
    const nextIsDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', nextIsDark);
    localStorage.setItem('theme', nextIsDark ? 'dark' : 'light');
    setIsDarkMode(nextIsDark);
  };

  const BrandLogo = () => (
    <img
      src={Logo}
      alt="Foodmax"
      className="h-44 w-auto md:h-48 object-contain"
      loading="lazy"
      decoding="async"
    />
  );

  return (
    <>
      <nav className="bg-white sticky top-0 z-50 shadow-sm">
        {/* 1. TOP UTILITY BAR */}
        <div className="bg-gray-50 border-b border-gray-100 py-2.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <a href="mailto:export@foodmax.vn,support@foodmax.vn" className="flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:text-foodmax-forest transition-colors uppercase tracking-wider">
                <Mail size={14} className="text-foodmax-lime" />
                <span className="hidden sm:inline">export@foodmax.vn</span>
              </a>
              <a href="tel:+84964791902" className="flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:text-foodmax-forest transition-colors uppercase tracking-wider">
                <Phone size={14} className="text-foodmax-lime" />
                <span className="hidden sm:inline">+84 964 791 902</span>
              </a>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link to="/commercial-tool" className="flex items-center gap-2 text-[11px] font-black text-foodmax-forest hover:text-foodmax-lime transition-all uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                <BarChart3 size={14} />
                Commercial Tool
              </Link>
              <button
                onClick={handleThemeToggle}
                className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-foodmax-forest transition-colors uppercase tracking-widest"
                aria-label="Toggle dark mode"
                title="Toggle dark mode"
              >
                {isDarkMode ? <Sun size={14} className="text-foodmax-lime" /> : <Moon size={14} className="text-foodmax-forest" />}
                {isDarkMode ? 'Light' : 'Dark'}
              </button>
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Globe size={12} />
                EN
              </div>
            </div>
          </div>
        </div>

        {/* 2. MAIN NAV BAR */}
        <div className="bg-white border-b border-gray-100 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20">
              <div className="flex items-center">
                <Link to="/" className="flex-shrink-0 flex items-center">
                  <BrandLogo />
                </Link>
              </div>

              {/* Desktop Nav */}
              <div className="hidden lg:flex items-center space-x-10">
                <div 
                  className="h-full flex items-center"
                  onMouseEnter={() => setIsMegaMenuOpen(true)}
                  onMouseLeave={() => setIsMegaMenuOpen(false)}
                >
                  <Link 
                    to="/products"
                    onClick={() => setIsMegaMenuOpen(false)}
                    className={`flex items-center text-xs font-black transition-colors tracking-[0.2em] uppercase py-8 ${isMegaMenuOpen ? 'text-foodmax-forest' : 'text-gray-700 hover:text-foodmax-forest'}`}
                  >
                    Products <ChevronDown size={14} className={`ml-1 transition-transform duration-300 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
                  </Link>

                  {/* FULL WIDTH MEGA MENU */}
                  {isMegaMenuOpen && (
                    <div className="absolute top-full left-0 w-full bg-white shadow-[0_40px_60px_-15px_rgba(0,0,0,0.1)] border-t border-gray-100 animate-in slide-in-from-top-2 duration-300 z-[100]">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="grid grid-cols-12 gap-12">
                          {/* Column 1: Rice */}
                          <div className="col-span-3">
                            <h3 className="text-[10px] font-black text-foodmax-forest uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-foodmax-lime"></div>
                              Rice Portfolios
                            </h3>
                            <ul className="space-y-4">
                              {[
                                { name: 'Long Grain White Rice', sub: '5%, 10%, 15%, 25% Broken' },
                                { name: 'Premium & Fragrant Rice', sub: 'Jasmine, ST24, ST25, Nang Hoa' },
                                { name: 'Short & Medium Grain Rice', sub: 'Japonica, Round Rice, Calrose' },
                                { name: 'Glutinous & Specialty', sub: 'Sticky Rice, Brown Rice, Organic' }
                              ].map((item, idx) => (
                                <li key={idx} className="group/item">
                                  <Link 
                                    to={`/products/rice?sub=${encodeURIComponent(item.name)}`} 
                                    className="block"
                                    onClick={() => setIsMegaMenuOpen(false)}
                                  >
                                    <p className="text-sm font-black text-gray-900 group-hover/item:text-foodmax-forest transition-colors">{item.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.sub}</p>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Column 2: Coffee */}
                          <div className="col-span-3 border-l border-gray-100 pl-12">
                            <h3 className="text-[10px] font-black text-foodmax-forest uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-foodmax-lime"></div>
                              Coffee Exports
                            </h3>
                            <ul className="space-y-4">
                              {[
                                { name: 'Robusta Coffee', sub: 'Grade 1, S16, S18, Wet Polished' },
                                { name: 'Arabica Coffee', sub: 'High-Altitude Catimor, Typica' },
                                { name: 'Specialty & Micro-lots', sub: 'Cau Dat, Son La Origins' },
                                { name: 'Instant & Blends', sub: 'Spray Dried, Freeze Dried' }
                              ].map((item, idx) => (
                                <li key={idx} className="group/item">
                                  <Link 
                                    to={`/products/coffee?sub=${encodeURIComponent(item.name)}`} 
                                    className="block"
                                    onClick={() => setIsMegaMenuOpen(false)}
                                  >
                                    <p className="text-sm font-black text-gray-900 group-hover/item:text-foodmax-forest transition-colors">{item.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.sub}</p>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Column 3: Cashew */}
                          <div className="col-span-3 border-l border-gray-100 pl-12">
                            <h3 className="text-[10px] font-black text-foodmax-forest uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-foodmax-lime"></div>
                              Cashew Exports
                            </h3>
                            <ul className="space-y-4">
                              {[
                                { name: 'Cashew Kernels', sub: 'WW180, WW240, WW320, WS, LBW', path: `/products/cashew?sub=${encodeURIComponent('Cashew Kernels')}` },
                                { name: 'Whole White Grades', sub: 'Premium whole kernels for retail and gifting', path: '/products/cashew' },
                                { name: 'Industrial Grades', sub: 'WS and LBW for confectionery and foodservice', path: '/products/cashew' }
                              ].map((item, idx) => (
                                <li key={idx} className="group/item">
                                  <Link 
                                    to={item.path}
                                    className="block"
                                    onClick={() => setIsMegaMenuOpen(false)}
                                  >
                                    <p className="text-sm font-black text-gray-900 group-hover/item:text-foodmax-forest transition-colors">{item.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.sub}</p>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Column 4: Featured Portfolio (Visual) */}
                          <div className="col-span-3 pl-4">
                            <div className="bg-gray-50 rounded-[2rem] p-8 h-full flex flex-col relative overflow-hidden group/featured">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-foodmax-forest/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover/featured:bg-foodmax-lime/10 transition-colors duration-700"></div>
                              
                              <div className="relative z-10 flex flex-col h-full">
                                <span className="text-[10px] font-black text-foodmax-forest uppercase tracking-[0.3em] mb-4 block">Seasonal Spotlight</span>
                                <h4 className="text-xl font-black text-gray-900 leading-tight mb-4">Vietnam Premium <br /><span className="text-foodmax-forest">ST25 Fragrant Rice</span></h4>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8 flex-grow">
                                  Voted World's Best Rice. Now accepting bulk export contracts for the 2024/25 harvest season.
                                </p>
                                
                                <div className="space-y-3">
                                  <Link 
                                    to="/product/rice-st25" 
                                    className="flex items-center justify-between w-full p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-foodmax-forest transition-all"
                                    onClick={() => setIsMegaMenuOpen(false)}
                                  >
                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Full Technical Specs</span>
                                    <ArrowRight size={14} className="text-foodmax-forest" />
                                  </Link>
                                  <Link 
                                    to="/contact" 
                                    className="flex items-center justify-between w-full p-4 bg-foodmax-forest text-white rounded-xl shadow-lg hover:bg-foodmax-lime hover:text-foodmax-forest transition-all"
                                    onClick={() => setIsMegaMenuOpen(false)}
                                  >
                                    <span className="text-[10px] font-black uppercase tracking-widest">Request Quote</span>
                                    <Download size={14} />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mega Menu Footer */}
                        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-10">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-foodmax-forest"><Globe size={18} /></div>
                                <div>
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Global Logistics</p>
                                  <p className="text-[11px] font-bold text-gray-900 uppercase">Shipping to 30+ Countries</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-foodmax-forest"><FileText size={18} /></div>
                                <div>
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">QC Protocol</p>
                                  <p className="text-[11px] font-bold text-gray-900 uppercase">ISO 22000 & HACCP Certified</p>
                                </div>
                             </div>
                          </div>
                          <Link to="/products" className="group flex items-center gap-3 text-xs font-black text-foodmax-forest uppercase tracking-[0.2em] hover:text-foodmax-lime transition-colors" onClick={() => setIsMegaMenuOpen(false)}>
                            Explore Full Export Catalog <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/news" className="text-xs font-black text-gray-700 hover:text-foodmax-forest tracking-[0.2em] uppercase">News</Link>
                <Link to="/about" className="text-xs font-black text-gray-700 hover:text-foodmax-forest tracking-[0.2em] uppercase">About Us</Link>
                
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleThemeToggle}
                  className="text-gray-500 hover:text-foodmax-forest transition-colors p-2 rounded-full hover:bg-gray-50"
                  aria-label="Toggle dark mode"
                  title="Toggle dark mode"
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="text-gray-500 hover:text-foodmax-forest transition-colors p-2 rounded-full hover:bg-gray-50"
                >
                    <Search size={20} />
                  </button>
                  <Link to="/contact" className="px-7 py-3 bg-foodmax-forest text-white rounded-xl text-xs font-black hover:bg-foodmax-lime hover:text-foodmax-forest transition-all shadow-lg active:scale-95 tracking-[0.2em] uppercase">
                    Contact
                  </Link>
                </div>
              </div>

              {/* Mobile Menu Toggles */}
              <div className="lg:hidden flex items-center space-x-4">
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="text-gray-500 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Search size={22} />
                </button>
                <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div className="lg:hidden bg-white fixed inset-0 z-[100] overflow-y-auto animate-in fade-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-12">
                <BrandLogo />
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500"><X size={32} /></button>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-1 gap-4 bg-gray-50 p-6 rounded-3xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Direct Trading Desk</p>
                  <a href="mailto:export@foodmax.vn,support@foodmax.vn" className="flex items-center gap-3 text-lg font-black text-gray-900">
                    <Mail className="text-foodmax-forest" size={20} /> export@foodmax.vn
                  </a>
                  <a href="tel:+84964791902" className="flex items-center gap-3 text-lg font-black text-gray-900">
                    <Phone className="text-foodmax-forest" size={20} /> +84 964 791 902
                  </a>
                  <Link to="/commercial-tool" className="flex items-center gap-3 text-lg font-black text-foodmax-forest mt-4" onClick={() => setIsOpen(false)}>
                    <BarChart3 size={20} /> Commercial Tool
                  </Link>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Main Menu</p>
                  <Link to="/products" className="block text-3xl font-black text-gray-900 border-b border-gray-100 pb-4" onClick={() => setIsOpen(false)}>Products</Link>
                  <Link to="/news" className="block text-3xl font-black text-gray-900 border-b border-gray-100 pb-4" onClick={() => setIsOpen(false)}>News</Link>
                  <Link to="/about" className="block text-3xl font-black text-gray-900 border-b border-gray-100 pb-4" onClick={() => setIsOpen(false)}>About Us</Link>
                  <Link to="/contact" className="block w-full py-5 bg-foodmax-forest text-white text-center rounded-2xl text-xl font-black tracking-widest uppercase shadow-xl mt-10" onClick={() => setIsOpen(false)}>
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* GLOBAL SEARCH OVERLAY */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] bg-white animate-in fade-in duration-300">
          <div className="h-24 flex items-center border-b border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between gap-8">
              <div className="flex items-center gap-4 flex-grow">
                <Search size={28} className="text-foodmax-forest" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, news, and export insights..."
                  className="w-full text-2xl md:text-3xl font-black text-gray-900 outline-none placeholder:text-gray-200"
                />
              </div>
              <button 
                onClick={() => setIsSearchOpen(false)}
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
                      <ShoppingBag size={14} className="text-foodmax-forest" /> 
                      Portfolio Matches ({filteredProducts.length})
                    </h3>
                    <div className="space-y-4">
                      {filteredProducts.map(p => (
                        <button 
                          key={p.id} 
                          onClick={() => handleSearchNavigation(`/product/${p.id}`)}
                          className="w-full text-left group flex items-center gap-6 p-4 rounded-2xl border border-gray-50 hover:border-foodmax-lime/30 hover:bg-foodmax-lime/5 transition-all"
                        >
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                          </div>
                          <div className="flex-grow">
                            <span className="text-[9px] font-black text-foodmax-forest uppercase tracking-widest">{p.subCategory}</span>
                            <h4 className="text-lg font-black text-gray-900 group-hover:text-foodmax-forest transition-colors">{p.name}</h4>
                            <p className="text-xs text-gray-500 line-clamp-1">{p.shortDescription}</p>
                          </div>
                          <ArrowRight size={20} className="text-gray-300 group-hover:text-foodmax-forest transition-colors" />
                        </button>
                      ))}
                      {filteredProducts.length === 0 && (
                        <p className="text-sm text-gray-400 italic">No products match your query.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* News Results */}
                <div className="space-y-10">
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                      <FileText size={14} className="text-foodmax-forest" /> 
                      Market Insights ({filteredNews.length})
                    </h3>
                    <div className="space-y-6">
                      {filteredNews.map(n => (
                        <button 
                          key={n.id} 
                          onClick={() => handleSearchNavigation(getNewsPath(n))}
                          className="w-full text-left group border-b border-gray-100 pb-6 hover:translate-x-1 transition-transform"
                        >
                          <span className="text-[9px] font-black text-foodmax-lime uppercase tracking-widest mb-1 block">{n.date}</span>
                          <h4 className="text-xl font-black text-gray-900 group-hover:text-foodmax-forest transition-colors mb-2">{n.title}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2">{n.excerpt}</p>
                        </button>
                      ))}
                      {filteredNews.length === 0 && (
                        <p className="text-sm text-gray-400 italic">No articles found.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : searchQuery.length === 1 ? (
              <div className="text-center py-20">
                <p className="text-lg font-medium text-gray-400">Keep typing to see results...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-10">
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">Quick Browse</h4>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => handleSearchNavigation('/products/rice')} className="text-sm text-gray-500 hover:text-foodmax-forest text-left">Rice Export Portfolios</button>
                    <button onClick={() => handleSearchNavigation('/products/coffee')} className="text-sm text-gray-500 hover:text-foodmax-forest text-left">Coffee Trade Lines</button>
                    <button onClick={() => handleSearchNavigation('/products/cashew')} className="text-sm text-gray-500 hover:text-foodmax-forest text-left">Cashew Kernel Grades</button>
                    <button onClick={() => handleSearchNavigation('/news')} className="text-sm text-gray-500 hover:text-foodmax-forest text-left">Market Analysis Archive</button>
                  </div>
                </div>
                <div className="md:col-span-2">
                   <div className="bg-gray-50 rounded-[2rem] p-10">
                      <h4 className="text-xl font-black text-gray-900 mb-4">Start your search</h4>
                      <p className="text-gray-500 font-medium mb-0">Looking for a specific grade of Robusta or the latest ST25 rice specs? Type a variety name or category to browse our internal export database.</p>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
