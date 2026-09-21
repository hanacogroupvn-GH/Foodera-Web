
import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, Mail, Phone, MapPin, Globe, Search, ArrowRight, FileText, Sparkles, Package, Shield } from 'lucide-react';
import { Product, SupportedLocale } from '../types';
const Logo = '/logo-era.png';
import { useData } from '../context/DataContext';
import { useLocale } from '../context/LocaleContext';
import { localizeProduct } from '../lib/contentLocalization';
import { appRoutes } from '../lib/routes';

const LazySearchOverlay = lazy(() => import('./SearchOverlay'));

const MEGA_MENU_SECTIONS: Array<{ category: Product['category'] }> = [
  { category: 'Cashew' },
  { category: 'Pepper' },
  { category: 'Coconut' },
  { category: 'Durian' },
  { category: 'Spices' }
];

// Placeholder SKUs shown for categories that don't have real catalog data yet.
// Remove an entry here once real products exist for that category — the mega
// menu will then automatically switch to showing live catalog items instead.
const MOCK_SUBCATEGORIES: Partial<Record<Product['category'], string[]>> = {
  Coconut: ['Desiccated Coconut', 'Coconut Water'],
  Durian: ['Frozen Durian', 'Durian Puree'],
  Spices: ['Star Anise', 'Cinnamon']
};

const buildSectionSubtitle = (items: Product[], locale: SupportedLocale) => {
  if (locale === 'zh') {
    return `${items.length} 个在售出口 SKU`;
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
  isMock?: boolean;
  image?: string;
  imageAlt?: string;
}

const Navbar: React.FC = () => {
  const { activeProducts: products, activeNews: news } = useData();
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  const copy = locale === 'zh'
    ? {
        rice: '大米',
        coffee: '咖啡',
        otherProducts: '其他产品',
        news: '新闻',
        gallery: '活动相册',
        about: '关于我们',
        contact: '联系',
        commercialTool: '互动地图',
        productGroupsEmpty: '目录中有产品后，这里会自动显示分组。',
        globalLogistics: '全球物流',
        shippingToCountries: '覆盖 30+ 个国家',
        qcProtocol: '质控协议',
        certified: 'ISO 22000 与 HACCP 认证',
        exploreFullCatalog: '查看完整出口目录',
        directTradingDesk: '直接贸易窗口',
        mainMenu: '主菜单',
        contactUs: '联系我们',
        searchPlaceholder: '搜索...',
        sectionTitles: {
          Cashew: '腰果出口',
          Pepper: '胡椒产地系列',
          Coconut: '椰子产品',
          Durian: '榴莲产品',
          Spices: '香料'
        },
        comingSoon: '即将上线',
        privateLabelTitle: '定制品牌服务',
        privateLabelDesc: '专属包装、配方与品牌定制，打造您自己的产品线。',
        privateLabelCta: '了解更多',
        privateLabelBadge: '热门',
        cmsLogin: 'CMS 登录'
      }
    : {
        rice: 'Rice',
        coffee: 'Coffee',
        otherProducts: 'Other Products',
        news: 'News',
        gallery: 'Gallery',
        about: 'About Us',
        contact: 'Contact',
        commercialTool: 'Interactive Map',
        productGroupsEmpty: 'Product groups will appear here as soon as items are available in the current catalog.',
        globalLogistics: 'Global Logistics',
        shippingToCountries: 'Shipping to 30+ Countries',
        qcProtocol: 'QC Protocol',
        certified: 'ISO 22000 & HACCP Certified',
        exploreFullCatalog: 'Explore Full Export Catalog',
        directTradingDesk: 'Direct Trading Desk',
        mainMenu: 'Main Menu',
        contactUs: 'Contact Us',
        searchPlaceholder: 'Search...',
        sectionTitles: {
          Cashew: 'Cashew Exports',
          Pepper: 'Pepper Origins',
          Coconut: 'Coconut Products',
          Durian: 'Durian Products',
          Spices: 'Spices'
        },
        comingSoon: 'Coming Soon',
        privateLabelTitle: 'Private Label Service',
        privateLabelDesc: 'Custom packaging, formulation, and branding to build your own product line.',
        privateLabelCta: 'Learn More',
        privateLabelBadge: 'Popular',
        cmsLogin: 'CMS Login'
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

        let items: MegaMenuItem[] = Array.from(groupedItems.values()).map((item) => ({
          name: item.name,
          path: item.path,
          sub: buildSectionSubtitle(item.products, locale),
          image: item.products[0]?.image,
          imageAlt: item.products[0]?.imageAlt || item.name
        }));

        // No real catalog data yet for this category — show placeholder SKUs
        // so the section is still visible in the menu until real products are added.
        if (items.length === 0 && MOCK_SUBCATEGORIES[section.category]) {
          items = MOCK_SUBCATEGORIES[section.category]!.map((subCategory) => ({
            name: subCategory,
            path: appRoutes.productLine(section.category, subCategory),
            sub: copy.comingSoon,
            isMock: true
          }));
        }

        return {
          ...section,
          title: copy.sectionTitles[section.category],
          items
        };
      }).filter((section) => section.items.length > 0),
    [copy.sectionTitles, copy.comingSoon, locale, products]
  );






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
            
            <div className="flex items-center space-x-3 sm:space-x-5">
              <Link to={appRoutes.commercialTool} className="flex items-center gap-2 text-[11px] font-black text-foodera-forest hover:text-foodera-lime transition-all uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                <MapPin size={14} />
                {copy.commercialTool}
              </Link>
              <Link to={appRoutes.login} className="flex items-center gap-1.5 text-[11px] font-black text-foodera-forest hover:bg-foodera-forest hover:text-white transition-all uppercase tracking-widest bg-foodera-forest/10 px-3 py-1 rounded-full border border-foodera-forest/25 shadow-xs" title={copy.cmsLogin}>
                <Shield size={12} />
                <span>{copy.cmsLogin}</span>
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
                  <img src={Logo} alt="FoodEra" className="h-9 md:h-12 w-auto object-contain" />
                </Link>
              </div>

              {/* Desktop Nav */}
              <div className="hidden lg:flex items-center space-x-6 xl:space-x-9">
                <Link to={appRoutes.about} className="whitespace-nowrap text-xs font-black text-gray-700 hover:text-foodera-forest tracking-[0.2em] uppercase">{copy.about}</Link>
                <Link to={appRoutes.productsByCategory('Rice')} className="whitespace-nowrap text-xs font-black text-gray-700 hover:text-foodera-forest tracking-[0.2em] uppercase">{copy.rice}</Link>
                <Link to={appRoutes.productsByCategory('Coffee')} className="whitespace-nowrap text-xs font-black text-gray-700 hover:text-foodera-forest tracking-[0.2em] uppercase">{copy.coffee}</Link>

                <div
                  className="h-full flex items-center"
                  onMouseEnter={() => setIsMegaMenuOpen(true)}
                  onMouseLeave={() => setIsMegaMenuOpen(false)}
                >
                  <Link
                    to={appRoutes.products}
                    onClick={() => setIsMegaMenuOpen(false)}
                    className={`flex items-center whitespace-nowrap text-xs font-black transition-colors tracking-[0.2em] uppercase py-8 ${isMegaMenuOpen ? 'text-foodera-forest' : 'text-gray-700 hover:text-foodera-forest'}`}
                  >
                    {copy.otherProducts} <ChevronDown size={14} className={`ml-1 transition-transform duration-300 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
                  </Link>

                  {/* FULL WIDTH MEGA MENU */}
                  {isMegaMenuOpen && (
                    <div className="absolute top-full left-0 w-full bg-white shadow-[0_40px_60px_-15px_rgba(0,0,0,0.1)] border-t border-gray-100 animate-in slide-in-from-top-2 duration-300 z-[100]">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div>
                          {/* Private Label Service — highlighted */}
                          <Link
                            to={appRoutes.contact}
                            onClick={() => setIsMegaMenuOpen(false)}
                            className="group/pl flex items-center justify-between gap-6 mb-10 p-6 rounded-2xl bg-foodera-lime/10 border border-foodera-lime/40 hover:border-foodera-lime transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-xl bg-foodera-forest text-white flex items-center justify-center flex-shrink-0">
                                <Sparkles size={18} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-black text-gray-900">{copy.privateLabelTitle}</h4>
                                  <span className="px-2 py-0.5 bg-foodera-forest text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                                    {copy.privateLabelBadge}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 font-medium">{copy.privateLabelDesc}</p>
                              </div>
                            </div>
                            <ArrowRight size={18} className="text-foodera-forest group-hover/pl:translate-x-1 transition-transform flex-shrink-0" />
                          </Link>

                          {megaMenuSections.length > 0 ? (
                            <div className="grid grid-cols-5 gap-8">
                              {megaMenuSections.map((section, index) => (
                                <div key={section.category} className={index > 0 ? 'border-l border-gray-100 pl-8' : ''}>
                                  <h3 className="text-[10px] font-black text-foodera-forest uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-foodera-lime"></div>
                                    {section.title}
                                  </h3>
                                  <ul className="space-y-4">
                                    {section.items.map((item) => (
                                      <li key={item.path} className="group/item">
                                        <Link
                                          to={item.path}
                                          className="flex items-center gap-3"
                                          onClick={() => setIsMegaMenuOpen(false)}
                                        >
                                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                                            <Package size={16} className="text-gray-300" />
                                            {item.image && (
                                              <img
                                                src={item.image}
                                                alt={item.imageAlt}
                                                loading="lazy"
                                                className="absolute inset-0 w-full h-full object-cover"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                              />
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <p className={`text-sm font-black transition-colors truncate ${item.isMock ? 'text-gray-500' : 'text-gray-900 group-hover/item:text-foodera-forest'}`}>
                                              {item.name}
                                            </p>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate ${item.isMock ? 'text-gray-300 italic' : 'text-gray-400'}`}>
                                              {item.sub}
                                            </p>
                                          </div>
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center rounded-[2rem] border border-dashed border-gray-200 bg-gray-50 px-8 py-12">
                              <p className="text-sm font-bold text-gray-500">
                                {copy.productGroupsEmpty}
                              </p>
                            </div>
                          )}
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

                <Link to={appRoutes.news} className="whitespace-nowrap text-xs font-black text-gray-700 hover:text-foodera-forest tracking-[0.2em] uppercase">{copy.news}</Link>
                <Link to={appRoutes.gallery} className="whitespace-nowrap text-xs font-black text-gray-700 hover:text-foodera-forest tracking-[0.2em] uppercase">{copy.gallery}</Link>

                <div className="flex items-center space-x-3 xl:space-x-4">
                  <Link to={appRoutes.contact} className="px-6 py-2.5 bg-foodera-forest text-white rounded-xl text-xs font-black hover:bg-foodera-lime hover:text-foodera-forest transition-all shadow-md active:scale-95 tracking-[0.2em] uppercase">
                    {copy.contact}
                  </Link>
                  <Link
                    to={appRoutes.login}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-gray-700 hover:text-foodera-forest hover:bg-foodera-forest/5 transition-all border border-gray-200 tracking-wider uppercase"
                    title={copy.cmsLogin}
                  >
                    <Shield size={13} className="text-foodera-forest" />
                    <span>CMS</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    aria-label={copy.searchPlaceholder}
                    className="w-10 h-10 rounded-xl bg-foodera-lime/15 text-foodera-forest flex items-center justify-center hover:bg-foodera-lime/30 transition-colors flex-shrink-0"
                  >
                    <Search size={18} />
                  </button>
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
                    <MapPin size={20} /> {copy.commercialTool}
                  </Link>
                  <Link to={appRoutes.login} className="flex items-center gap-3 text-lg font-black text-gray-700 hover:text-foodera-forest mt-3" onClick={() => setIsOpen(false)}>
                    <Shield size={20} className="text-foodera-forest" /> {copy.cmsLogin}
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
                  <Link to={appRoutes.about} className="block text-3xl font-black text-gray-900 border-b border-gray-100 pb-4" onClick={() => setIsOpen(false)}>{copy.about}</Link>
                  <Link to={appRoutes.productsByCategory('Rice')} className="block text-3xl font-black text-gray-900 border-b border-gray-100 pb-4" onClick={() => setIsOpen(false)}>{copy.rice}</Link>
                  <Link to={appRoutes.productsByCategory('Coffee')} className="block text-3xl font-black text-gray-900 border-b border-gray-100 pb-4" onClick={() => setIsOpen(false)}>{copy.coffee}</Link>
                  <Link to={appRoutes.products} className="block text-3xl font-black text-gray-900 border-b border-gray-100 pb-4" onClick={() => setIsOpen(false)}>{copy.otherProducts}</Link>
                  <Link to={appRoutes.news} className="block text-3xl font-black text-gray-900 border-b border-gray-100 pb-4" onClick={() => setIsOpen(false)}>{copy.news}</Link>
                  <Link to={appRoutes.gallery} className="block text-3xl font-black text-gray-900 border-b border-gray-100 pb-4" onClick={() => setIsOpen(false)}>{copy.gallery}</Link>
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
            onClose={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
            products={products}
            news={news}
            initialQuery={searchQuery}
          />
        </Suspense>
      )}
    </>
  );
};

export default Navbar;
