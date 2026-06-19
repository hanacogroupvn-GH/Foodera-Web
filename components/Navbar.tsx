
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, Mail, Phone, BarChart3, Globe, Search, ArrowRight, FileText, Download } from 'lucide-react';
import { Product, SupportedLocale } from '../types';
const Logo = '/logo-era.png';
import { useData } from '../context/DataContext';
import { useLocale } from '../context/LocaleContext';
import { getCategoryLabel, localizeProduct } from '../lib/contentLocalization';
import { appRoutes } from '../lib/routes';

const LazySearchOverlay = lazy(() => import('./SearchOverlay'));

const MEGA_MENU_SECTIONS: Array<{ category: Product['category'] }> = [
  { category: 'Rice' },
  { category: 'Coffee' },
  { category: 'Cashew' },
  { category: 'Pepper' }
];

const buildSectionSubtitle = (items: Product[], locale: SupportedLocale) => {
  if (locale === 'zh') {
    return `${items.length} 个在售出口 SKU`;
  }
  if (locale === 'vi') {
    return `${items.length} SKU đang hoạt động`;
  }

  return `${items.length} active SKU${items.length === 1 ? '' : 's'}`;
};

interface MegaMenuGroup {
  name: string;
  path: string;
  products: Product[];
}

interface MegaMenuItem {
  name: string;
  path: string;
  sub: string;
}

const Navbar: React.FC = () => {
  const { activeProducts: products, activeNews: news } = useData();
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);


  const copy = locale === 'zh'
    ? {
        products: '产品',
        news: '新闻',
        about: '关于我们',
        contact: '联系',
        commercialTool: '互动地图',
        themeDark: '深色',
        themeLight: '浅色',
        productGroupsEmpty: '目录中有产品后，这里会自动显示分组。',
        catalogHighlight: '精选目录',
        currentCatalogUpdating: '当前目录正在更新',
        addProductsHint: '在库存后台添加产品后，这张精选卡片会自动更新。',
        viewProductDetails: '查看产品详情',
        browseFullCatalog: '浏览完整目录',
        requestQuote: '申请报价',
        globalLogistics: '全球物流',
        shippingToCountries: '覆盖 30+ 个国家',
        qcProtocol: '质控协议',
        certified: 'ISO 22000 与 HACCP 认证',
        exploreFullCatalog: '查看完整出口目录',
        directTradingDesk: '直接贸易窗口',
        mainMenu: '主菜单',
        contactUs: '联系我们',
        sectionTitles: {
          Rice: '大米产品线',
          Coffee: '咖啡出口',
          Cashew: '腰果出口',
          Pepper: '胡椒产地系列'
        }
      }
    : {
        products: 'Products',
        news: 'News',
        about: 'About Us',
        contact: 'Contact',
        commercialTool: 'Interactive Map',
        themeDark: 'Dark',
        themeLight: 'Light',
        productGroupsEmpty: 'Product groups will appear here as soon as items are available in the current catalog.',
        catalogHighlight: 'Catalog Highlight',
        currentCatalogUpdating: 'Current catalog is updating',
        addProductsHint: 'Add products in the inventory panel to populate this featured card automatically.',
        viewProductDetails: 'View Product Details',
        browseFullCatalog: 'Browse Full Catalog',
        requestQuote: 'Request Quote',
        globalLogistics: 'Global Logistics',
        shippingToCountries: 'Shipping to 30+ Countries',
        qcProtocol: 'QC Protocol',
        certified: 'ISO 22000 & HACCP Certified',
        exploreFullCatalog: 'Explore Full Export Catalog',
        directTradingDesk: 'Direct Trading Desk',
        mainMenu: 'Main Menu',
        contactUs: 'Contact Us',
        sectionTitles: {
          Rice: 'Rice Portfolios',
          Coffee: 'Coffee Exports',
          Cashew: 'Cashew Exports',
          Pepper: 'Pepper Origins'
        }
      };



  const megaMenuSections = useMemo(
    () =>
      MEGA_MENU_SECTIONS.map((section) => {
        const groupedItems = new Map<string, MegaMenuGroup>();

        products.forEach((product) => {
          if (product.category !== section.category || !product.subCategory.trim()) {
            return;
          }

          const key = product.subCategory.trim().toLowerCase();
          const existing = groupedItems.get(key);
          if (existing) {
            existing.products.push(product);
            return;
          }

          groupedItems.set(key, {
            name: localizeProduct(product, locale).subCategory.trim(),
            path: appRoutes.productLine(section.category, product.subCategory),
            products: [product]
          });
        });

        const items: MegaMenuItem[] = Array.from(groupedItems.values()).map((item) => ({
          name: item.name,
          path: item.path,
          sub: buildSectionSubtitle(item.products, locale)
        }));

        return {
          ...section,
          title: copy.sectionTitles[section.category],
          items
        };
      }).filter((section) => section.items.length > 0),
    [copy.sectionTitles, locale, products]
  );

  const featuredProduct = useMemo(() => {
    if (products.length === 0) {
      return null;
    }

    return products.find((product) => product.pdfUrl?.trim()) ?? products[0];
  }, [products]);
  const featuredProductDisplay = useMemo(
    () => (featuredProduct ? localizeProduct(featuredProduct, locale) : null),
    [featuredProduct, locale]
  );





  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    setIsDarkMode(false);
  }, []);

  const handleThemeToggle = () => {};

  return (
    <>
      <nav className="bg-white sticky top-0 z-50 shadow-sm">
        {/* 1. TOP UTILITY BAR */}
        <div className="bg-gray-50 border-b border-gray-100 py-2.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <a href="mailto:export@foodera.vn?cc=support@foodera.vn" className="flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:text-foodera-forest transition-colors uppercase tracking-wider">
                <Mail size={14} className="text-foodera-lime" />
                <span className="hidden sm:inline">export@foodera.vn</span>
              </a>
              <a href="tel:+84964791902" className="flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:text-foodera-forest transition-colors uppercase tracking-wider">
                <Phone size={14} className="text-foodera-lime" />
                <span className="hidden sm:inline">+84 964 791 902</span>
              </a>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link to={appRoutes.commercialTool} className="flex items-center gap-2 text-[11px] font-black text-foodera-forest hover:text-foodera-lime transition-all uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                <BarChart3 size={14} />
                {copy.commercialTool}
              </Link>
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Globe size={12} />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLocale('en')}
                    className={`transition-colors ${locale === 'en' ? 'text-foodera-forest' : 'hover:text-foodera-forest'}`}
                  >
                    EN
                  </button>
                  <span>/</span>
                  <button
                    type="button"
                    onClick={() => setLocale('zh')}
                    className={`transition-colors ${locale === 'zh' ? 'text-foodera-forest' : 'hover:text-foodera-forest'}`}
                  >
                    中文
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MAIN NAV BAR */}
        <div className="bg-white border-b border-gray-100 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20">
              <div className="flex items-center">
                <Link to={appRoutes.home} className="flex-shrink-0 flex items-center">
                  <img src={Logo} alt="FoodEra" className="w-[166px] md:w-[282px] h-auto object-contain" />
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
                    to={appRoutes.products}
                    onClick={() => setIsMegaMenuOpen(false)}
                    className={`flex items-center text-xs font-black transition-colors tracking-[0.2em] uppercase py-8 ${isMegaMenuOpen ? 'text-foodera-forest' : 'text-gray-700 hover:text-foodera-forest'}`}
                  >
                    {copy.products} <ChevronDown size={14} className={`ml-1 transition-transform duration-300 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
                  </Link>

                  {/* FULL WIDTH MEGA MENU */}
                  {isMegaMenuOpen && (
                    <div className="absolute top-full left-0 w-full bg-white shadow-[0_40px_60px_-15px_rgba(0,0,0,0.1)] border-t border-gray-100 animate-in slide-in-from-top-2 duration-300 z-[100]">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="grid grid-cols-12 gap-12">
                          {megaMenuSections.length > 0 ? (
                            megaMenuSections.map((section, index) => (
                              <div key={section.category} className={`col-span-3 ${index > 0 ? 'border-l border-gray-100 pl-12' : ''}`}>
                                <h3 className="text-[10px] font-black text-foodera-forest uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-foodera-lime"></div>
                                  {section.title}
                                </h3>
                                <ul className="space-y-4">
                                  {section.items.map((item) => (
                                    <li key={item.path} className="group/item">
                                      <Link
                                        to={item.path}
                                        className="block"
                                        onClick={() => setIsMegaMenuOpen(false)}
                                      >
                                        <p className="text-sm font-black text-gray-900 group-hover/item:text-foodera-forest transition-colors">
                                          {item.name}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                          {item.sub}
                                        </p>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-9 flex items-center rounded-[2rem] border border-dashed border-gray-200 bg-gray-50 px-8 py-12">
                              <p className="text-sm font-bold text-gray-500">
                                {copy.productGroupsEmpty}
                              </p>
                            </div>
                          )}

                          {/* Column 4: Featured Portfolio (Visual) */}
                          <div className="col-span-3 pl-4">
                            <div className="bg-gray-50 rounded-[2rem] p-8 h-full flex flex-col relative overflow-hidden group/featured">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-foodera-forest/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover/featured:bg-foodera-lime/10 transition-colors duration-700"></div>
                              
                              <div className="relative z-10 flex flex-col h-full">
                                <span className="text-[10px] font-black text-foodera-forest uppercase tracking-[0.3em] mb-4 block">
                                  {copy.catalogHighlight}
                                </span>
                                {featuredProductDisplay ? (
                                  <>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.28em] mb-3">
                                      {getCategoryLabel(featuredProduct.category, locale)} / {featuredProductDisplay.subCategory}
                                    </p>
                                    <h4 className="text-xl font-black text-gray-900 leading-tight mb-4">
                                      {featuredProductDisplay.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8 flex-grow">
                                      {featuredProductDisplay.shortDescription}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <h4 className="text-xl font-black text-gray-900 leading-tight mb-4">
                                      {copy.currentCatalogUpdating}
                                    </h4>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8 flex-grow">
                                      {copy.addProductsHint}
                                    </p>
                                  </>
                                )}
                                
                                <div className="space-y-3">
                                  {featuredProduct ? (
                                    <Link
                                      to={appRoutes.productById(featuredProduct.id)}
                                      className="flex items-center justify-between w-full p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-foodera-forest transition-all"
                                      onClick={() => setIsMegaMenuOpen(false)}
                                    >
                                      <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                                        {copy.viewProductDetails}
                                      </span>
                                      <ArrowRight size={14} className="text-foodera-forest" />
                                    </Link>
                                  ) : (
                                    <Link
                                      to={appRoutes.products}
                                      className="flex items-center justify-between w-full p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-foodera-forest transition-all"
                                      onClick={() => setIsMegaMenuOpen(false)}
                                    >
                                      <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                                        {copy.browseFullCatalog}
                                      </span>
                                      <ArrowRight size={14} className="text-foodera-forest" />
                                    </Link>
                                  )}
                                  <Link 
                                    to={appRoutes.contact} 
                                    className="flex items-center justify-between w-full p-4 bg-foodera-forest text-white rounded-xl shadow-lg hover:bg-foodera-lime hover:text-foodera-forest transition-all"
                                    onClick={() => setIsMegaMenuOpen(false)}
                                  >
                                    <span className="text-[10px] font-black uppercase tracking-widest">{copy.requestQuote}</span>
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
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-foodera-forest"><Globe size={18} /></div>
                                <div>
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{copy.globalLogistics}</p>
                                  <p className="text-[11px] font-bold text-gray-900 uppercase">{copy.shippingToCountries}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-foodera-forest"><FileText size={18} /></div>
                                <div>
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{copy.qcProtocol}</p>
                                  <p className="text-[11px] font-bold text-gray-900 uppercase">{copy.certified}</p>
                                </div>
                             </div>
                          </div>
                          <Link to={appRoutes.products} className="group flex items-center gap-3 text-xs font-black text-foodera-forest uppercase tracking-[0.2em] hover:text-foodera-lime transition-colors" onClick={() => setIsMegaMenuOpen(false)}>
                            {copy.exploreFullCatalog} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Link to={appRoutes.news} className="text-xs font-black text-gray-700 hover:text-foodera-forest tracking-[0.2em] uppercase">{copy.news}</Link>
                <Link to={appRoutes.about} className="text-xs font-black text-gray-700 hover:text-foodera-forest tracking-[0.2em] uppercase">{copy.about}</Link>
                <Link to={appRoutes.careers} className="text-xs font-black text-gray-700 hover:text-foodera-forest tracking-[0.2em] uppercase">{locale === 'zh' ? '招聘' : 'Careers'}</Link>
                
              <div className="flex items-center space-x-6">
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="text-gray-500 hover:text-foodera-forest transition-colors p-2 rounded-full hover:bg-gray-50"
                >
                    <Search size={20} />
                  </button>
                  <Link to={appRoutes.contact} className="px-7 py-3 bg-foodera-forest text-white rounded-xl text-xs font-black hover:bg-foodera-lime hover:text-foodera-forest transition-all shadow-lg active:scale-95 tracking-[0.2em] uppercase">
                    {copy.contact}
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
                <img src={Logo} alt="FoodEra" className="w-[166px] h-auto object-contain" />
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500"><X size={32} /></button>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-1 gap-4 bg-gray-50 p-6 rounded-3xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">
                    {locale === 'zh' ? '直贸窗口' : 'Direct Trading Desk'}
                  </p>
                  <a href="mailto:export@foodera.vn?cc=support@foodera.vn" className="flex items-center gap-3 text-lg font-black text-gray-900">
                    <Mail className="text-foodera-forest" size={20} /> export@foodera.vn
                  </a>
                  <a href="tel:+84964791902" className="flex items-center gap-3 text-lg font-black text-gray-900">
                    <Phone className="text-foodera-forest" size={20} /> +84 964 791 902
                  </a>
                  <Link to={appRoutes.commercialTool} className="flex items-center gap-3 text-lg font-black text-foodera-forest mt-4" onClick={() => setIsOpen(false)}>
                    <BarChart3 size={20} /> {copy.commercialTool}
                  </Link>
                  <div className="flex items-center gap-3 text-sm font-black text-gray-500 mt-4">
                    <Globe size={18} className="text-foodera-forest" />
                    <button
                      type="button"
                      onClick={() => setLocale('en')}
                      className={locale === 'en' ? 'text-foodera-forest' : ''}
                    >
                      EN
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => setLocale('zh')}
                      className={locale === 'zh' ? 'text-foodera-forest' : ''}
                    >
                      中文
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">{copy.mainMenu}</p>
                  <Link to={appRoutes.products} className="block text-3xl font-black text-gray-900 border-b border-gray-100 pb-4" onClick={() => setIsOpen(false)}>{copy.products}</Link>
                  <Link to={appRoutes.news} className="block text-3xl font-black text-gray-900 border-b border-gray-100 pb-4" onClick={() => setIsOpen(false)}>{copy.news}</Link>
                  <Link to={appRoutes.about} className="block text-3xl font-black text-gray-900 border-b border-gray-100 pb-4" onClick={() => setIsOpen(false)}>{copy.about}</Link>
                  <Link to={appRoutes.careers} className="block text-3xl font-black text-gray-900 border-b border-gray-100 pb-4" onClick={() => setIsOpen(false)}>{locale === 'zh' ? '招聘' : 'Careers'}</Link>
                  <Link to={appRoutes.contact} className="block w-full py-5 bg-foodera-forest text-white text-center rounded-2xl text-xl font-black tracking-widest uppercase shadow-xl mt-10" onClick={() => setIsOpen(false)}>
                    {copy.contactUs}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* GLOBAL SEARCH OVERLAY — lazy-loaded */}
      {isSearchOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-[200] bg-white" />}>
          <LazySearchOverlay
            searchOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            products={products}
            news={news}
          />
        </Suspense>
      )}
    </>
  );
};

export default Navbar;
