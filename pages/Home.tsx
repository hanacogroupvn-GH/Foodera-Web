import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  Factory,
  Zap,
  Package,
  BadgeCheck,
  Anchor,
  CreditCard,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import HeroSlider from '../components/HeroSlider';
import SectionHeading from '../components/SectionHeading';
import ProductCard from '../components/ProductCard';
import Counter from '../components/Counter';
import AppShellLoader from '../components/AppShellLoader';
import { useData } from '../context/DataContext';
import { usePersonalization } from '../context/PersonalizationContext';
import { getNewsPath } from '../lib/newsSeo';
import { useLocale } from '../context/LocaleContext';
import { formatDisplayDate, localizeNewsItem } from '../lib/contentLocalization';
import { appRoutes } from '../lib/routes';
import { preserveVietnamesePlaceNamesDeep } from '../lib/preserveVietnamesePlaceNames';
import { useDocumentMeta, BASE_URL } from '../lib/useDocumentMeta';

const enCopy = {
  loader: 'Loading catalog and market insights...',
  advantages: [
    {
      icon: ShieldCheck,
      title: 'Certified Quality',
      desc: 'HACCP, ISO 22000, and FDA compliant processing facilities.'
    },
    {
      icon: Truck,
      title: 'Global Logistics',
      desc: 'Strategic partnerships with major shipping lines for 30+ countries.'
    },
    {
      icon: Factory,
      title: 'Direct Sourcing',
      desc: 'Vertical integration from central highlands to packaging plants.'
    },
    {
      icon: Zap,
      title: 'Fast Execution',
      desc: 'Streamlined export documentation and rapid response timelines.'
    }
  ],
  exportLinesTitle: 'Our Premium Export Lines',
  exportLinesSubtitle: 'High-quality agricultural commodities, meticulously processed for the most demanding international markets.',
  viewAllCategories: 'View All Product Categories',
  operationsTitle: 'Operational Architecture',
  operationsSubtitle: 'Commercial rigor and technical compliance defining the FoodEra export methodology.',
  qualityStandards: 'Quality Standards',
  qualityDesc: 'Our "Zero-Defect" protocol integrates ISO 22000 and HACCP standards into every processing stage. We provide multi-layer lab verification for every batch.',
  qualityList: ['SGS / Vinacontrol Alignment', 'Phytosanitary Purity', 'Sensory Profile Calibration'],
  technicalSpecs: 'Technical Specs PDF ->',
  logisticsTitle: 'Global Logistics',
  logisticsDesc: 'Strategically located near Ho Chi Minh and Hai Phong port hubs, ensuring rapid kinetic movement and prioritized vessel space allocation.',
  keyPorts: 'Key Ports',
  fleet: 'Fleet',
  multiCarrier: 'Multi-Carrier Sync',
  routeIntel: 'Route Intelligence ->',
  packagingTitle: 'Packaging Specs',
  packagingDesc: 'Engineered for atmospheric protection and long-haul integrity. We offer industrial bulk and boutique retail-ready configurations.',
  packagingTags: ['25kg PP Bags', '50kg PP Bags', '1MT Jumbo', 'Vacuum Seal', 'Jute 60kg'],
  packagingManual: 'Packaging Manual ->',
  tradeTitle: 'Terms of Trade',
  tradeDesc: 'Transparent commercial frameworks anchored in Incoterms 2020. Risk-mitigated settlement instruments for global trust.',
  pricingModel: 'Pricing Model',
  payment: 'Payment',
  tradeFramework: 'Trade Framework ->',
  stats: [
    { target: 500, suffix: 'K+', label: 'MT Tons Exported' },
    { target: 45, suffix: '+', label: 'Target Countries' },
    { target: 15, suffix: '+', label: 'Years Excellence' },
    { target: 100, suffix: '%', label: 'Traceability' }
  ],
  insightsTitle: 'Global Market Insights',
  insightsSubtitle: 'Expert perspectives on Vietnamese agriculture and global commodity trends.',
  readArticle: 'Read Article',
  ctaPrefix: 'Ready to scale your',
  ctaHighlight: 'supply chain',
  ctaSuffix: '?',
  ctaDesc: 'Connect with our export desk for tailored trade solutions, logistics optimization, and bulk volume contracts.',
  connectSales: 'Connect with Export Sales',
  browseCatalog: 'Browse Catalog'
};

const zhCopy = {
  loader: '正在加载目录与市场洞察...',
  advantages: [
    {
      icon: ShieldCheck,
      title: '认证品质',
      desc: '加工设施符合 HACCP、ISO 22000 与 FDA 标准。'
    },
    {
      icon: Truck,
      title: '全球物流',
      desc: '与主要船公司建立合作，覆盖 30+ 国家。'
    },
    {
      icon: Factory,
      title: '直接采购',
      desc: '从中部高原原料到包装工厂实现垂直整合。'
    },
    {
      icon: Zap,
      title: '快速执行',
      desc: '出口单证流程高效，响应周期更短。'
    }
  ],
  exportLinesTitle: '我们的优质出口产品线',
  exportLinesSubtitle: '面向高要求国际市场的高品质农产品。',
  viewAllCategories: '查看全部产品分类',
  operationsTitle: '运营体系架构',
  operationsSubtitle: 'FoodEra 出口方法论中的商业严谨性与技术合规。',
  qualityStandards: '质量标准',
  qualityDesc: '我们的“零缺陷”协议把 ISO 22000 与 HACCP 标准嵌入每个加工环节，并为每批货提供多层实验室验证。',
  qualityList: ['SGS / Vinacontrol 对齐', '植物检疫纯度', '感官杯型校准'],
  technicalSpecs: '技术规格 PDF ->',
  logisticsTitle: '全球物流',
  logisticsDesc: '靠近胡志明市与海防主要港口，确保装运调度快速、舱位优先。',
  keyPorts: '关键港口',
  fleet: '运力网络',
  multiCarrier: '多承运人协同',
  routeIntel: '航线情报 ->',
  packagingTitle: '包装规格',
  packagingDesc: '为防潮、防氧化与长途运输完整性而设计，支持工业散装与精品零售包装。',
  packagingTags: ['25kg PP 袋', '50kg PP 袋', '1MT 吨包', '真空包装', '60kg 麻袋'],
  packagingManual: '包装手册 ->',
  tradeTitle: '贸易条款',
  tradeDesc: '以 Incoterms 2020 为基础的透明商业框架，帮助全球合作伙伴降低风险。',
  pricingModel: '定价模式',
  payment: '付款方式',
  tradeFramework: '贸易框架 ->',
  stats: [
    { target: 500, suffix: 'K+', label: '出口吨数' },
    { target: 45, suffix: '+', label: '目标国家' },
    { target: 15, suffix: '+', label: '运营年限' },
    { target: 100, suffix: '%', label: '可追溯性' }
  ],
  insightsTitle: '全球市场洞察',
  insightsSubtitle: '关于越南农业与全球大宗商品趋势的专业观察。',
  readArticle: '阅读文章',
  ctaPrefix: '准备好扩展您的',
  ctaHighlight: '供应链',
  ctaSuffix: '了吗？',
  ctaDesc: '联系我们的出口团队，获取定制贸易方案、物流优化和大宗合同支持。',
  connectSales: '联系出口销售',
  browseCatalog: '浏览目录'
};

const Home: React.FC = () => {
  const { activeProducts, activeNews, isLoading } = useData();
  const { locale } = useLocale();
  const { personalizedProducts, personalizedNews, hasPersonalizedContent, trackEvent } = usePersonalization();
  const featuredProducts = activeProducts.slice(0, 4);
  const featuredNews = activeNews.slice(0, 3).map((item) => localizeNewsItem(item, locale));
  const recommendedProducts = personalizedProducts.slice(0, 4);
  const recommendedNews = personalizedNews.slice(0, 2).map((item) => localizeNewsItem(item, locale));

  useDocumentMeta({
    title: locale === 'zh' ? '首页' : "FoodEra Official Site",
    description: locale === 'zh'
      ? 'FoodEra 专注越南优质大米、咖啡与腰果出口，服务全球30+国家进口商。HACCP & ISO 22000 认证。'
      : "Premium rice, specialty coffee & cashew kernels from Vietnam. HACCP & ISO 22000 certified. Serving importers in 30+ countries.",
    canonicalUrl: BASE_URL + '/',
    ogUrl: BASE_URL + '/',
    ogImage: BASE_URL + '/og-image.png',
  });

  const rawCopy = locale === 'zh' ? zhCopy : enCopy;
  const copy = locale === 'zh' ? preserveVietnamesePlaceNamesDeep(rawCopy) : rawCopy;

  if (isLoading && activeProducts.length === 0 && activeNews.length === 0) {
    return <AppShellLoader compact label={copy.loader} />;
  }

  return (
    <div className="animate-in fade-in duration-700">
      <HeroSlider />

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
            {copy.advantages.map((advantage) => (
              <div
                key={advantage.title}
                className="group flex flex-col items-center rounded-3xl border border-gray-100 bg-gray-50 p-8 text-center transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-foodera-forest text-white shadow-lg transition-colors group-hover:bg-foodera-lime group-hover:text-foodera-forest">
                  <advantage.icon size={30} />
                </div>
                <h3 className="mb-4 text-xl font-black tracking-tight text-gray-900">{advantage.title}</h3>
                <p className="text-sm font-medium leading-relaxed text-gray-600">{advantage.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {hasPersonalizedContent && (recommendedProducts.length > 0 || recommendedNews.length > 0) && (
        <section className="relative overflow-hidden bg-white py-24">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(135deg, #006838 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              title={locale === 'zh' ? '为此设备推荐' : 'Recommended for This Device'}
              subtitle={
                locale === 'zh'
                  ? 'ç»“åˆè¯¥è®¾å¤‡è¿‘æœŸæµè§ˆçš„äº§å“ã€�åˆ†ç±»ä¸Žå¸‚åœºèµ„è®¯ä¿¡å·åŠ¨æ€è°ƒæ•´ã€‚'
                  : 'Updated from recent product views, category exploration, and market-insight reading on this device.'
              }
            />

            {recommendedProducts.length > 0 && (
              <div className="mb-16">
                <p className="mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-foodera-forest">
                  {locale === 'zh' ? '产品推荐' : 'Product Recommendations'}
                </p>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                  {recommendedProducts.map((product) => (
                    <ProductCard key={`recommended-${product.id}`} product={product} />
                  ))}
                </div>
              </div>
            )}

            {recommendedNews.length > 0 && (
              <div>
                <p className="mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-foodera-forest">
                  {locale === 'zh' ? '资讯推荐' : 'Insight Recommendations'}
                </p>
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                  {recommendedNews.map((item) => (
                    <Link
                      key={`recommended-news-${item.id}`}
                      to={getNewsPath(item)}
                      className="group overflow-hidden rounded-3xl border border-gray-100 bg-gray-50 transition-all hover:border-foodera-forest/30 hover:shadow-2xl"
                      onClick={() => {
                        void trackEvent(
                          {
                            entityType: 'news',
                            action: 'click',
                            itemId: item.id,
                            newsCategory: item.category,
                            locale,
                            metadata: {
                              surface: 'home_recommended'
                            }
                          },
                          {
                            dedupeKey: `news-click:${item.id}:home-recommended`,
                            dedupeTtlMs: 1200
                          }
                        );
                      }}
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute top-4 left-4 rounded-lg bg-foodera-forest px-3 py-1 text-[10px] font-black uppercase tracking-widest text-foodera-lime shadow-lg">
                          {formatDisplayDate(item.date, locale)}
                        </div>
                      </div>
                      <div className="p-8">
                        <h3 className="mb-4 text-xl font-black leading-tight text-gray-900 transition-colors group-hover:text-foodera-forest">
                          {item.title}
                        </h3>
                        <p className="line-clamp-3 text-sm leading-relaxed text-gray-500">{item.excerpt}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden bg-gray-50 py-24">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title={copy.exportLinesTitle}
            subtitle={copy.exportLinesSubtitle}
          />
          <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center">
            <Link
              to={appRoutes.products}
              className="inline-flex items-center gap-2 rounded-2xl bg-foodera-forest px-10 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-foodera-forest/20 transition-all hover:-translate-y-1 hover:bg-foodera-lime hover:text-foodera-forest"
            >
              {copy.viewAllCategories}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title={copy.operationsTitle}
            subtitle={copy.operationsSubtitle}
          />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="group relative overflow-hidden rounded-[2.5rem] bg-foodera-forest p-10 text-white">
              <div className="absolute top-0 right-0 h-32 w-32 -mr-16 -mt-16 rounded-full bg-foodera-lime/10 blur-2xl" />
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-xl bg-foodera-lime p-3 text-foodera-forest">
                  <BadgeCheck size={24} />
                </div>
                <h4 className="text-xl font-black uppercase tracking-tighter">{copy.qualityStandards}</h4>
              </div>
              <p className="mb-8 text-sm font-medium leading-relaxed text-white/70">
                {copy.qualityDesc}
              </p>
              <ul className="mb-10 space-y-3">
                {copy.qualityList.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foodera-lime">
                    <CheckCircle size={14} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to={appRoutes.operationsSection('quality')}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-foodera-lime transition-colors hover:text-white"
              >
                {copy.technicalSpecs}
              </Link>
            </div>

            <div className="group rounded-[2.5rem] border border-gray-100 bg-gray-50 p-10">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-xl bg-foodera-forest p-3 text-white">
                  <Anchor size={24} />
                </div>
                <h4 className="text-xl font-black uppercase tracking-tighter text-gray-900">{copy.logisticsTitle}</h4>
              </div>
              <p className="mb-8 text-sm font-medium leading-relaxed text-gray-500">
                {copy.logisticsDesc}
              </p>
              <div className="mb-10 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-gray-400">{copy.keyPorts}</p>
                  <p className="text-xs font-black text-gray-900">Cat Lai / Cai Mep</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-gray-400">{copy.fleet}</p>
                  <p className="text-xs font-black text-gray-900">{copy.multiCarrier}</p>
                </div>
              </div>
              <Link
                to={appRoutes.operationsSection('logistics')}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-foodera-forest"
              >
                {copy.routeIntel}
              </Link>
            </div>

            <div className="group rounded-[2.5rem] border border-gray-100 bg-gray-50 p-10">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-xl bg-foodera-forest p-3 text-white">
                  <Package size={24} />
                </div>
                <h4 className="text-xl font-black uppercase tracking-tighter text-gray-900">{copy.packagingTitle}</h4>
              </div>
              <p className="mb-8 text-sm font-medium leading-relaxed text-gray-500">
                {copy.packagingDesc}
              </p>
              <div className="mb-10 flex flex-wrap gap-2">
                {copy.packagingTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-widest text-gray-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                to={appRoutes.operationsSection('packaging')}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-foodera-forest"
              >
                {copy.packagingManual}
              </Link>
            </div>

            <div className="group relative rounded-[2.5rem] bg-foodera-forest p-10 text-white">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-xl bg-foodera-lime p-3 text-foodera-forest">
                  <CreditCard size={24} />
                </div>
                <h4 className="text-xl font-black uppercase tracking-tighter">{copy.tradeTitle}</h4>
              </div>
              <p className="mb-8 text-sm font-medium leading-relaxed text-white/70">
                {copy.tradeDesc}
              </p>
              <div className="mb-10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{copy.pricingModel}</span>
                  <span className="text-xs font-black">FOB / CIF / CFR</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{copy.payment}</span>
                  <span className="text-xs font-black">L/C at Sight / T/T</span>
                </div>
              </div>
              <Link
                to={appRoutes.operationsSection('terms')}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-foodera-lime transition-colors hover:text-white"
              >
                {copy.tradeFramework}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-foodera-forest py-24 text-white">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-12 text-center md:grid-cols-4">
            {copy.stats.map((stat) => (
              <div key={stat.label} className="group">
                <p className="mb-2 text-4xl font-black text-foodera-lime drop-shadow-sm transition-transform group-hover:scale-105 md:text-6xl">
                  <Counter target={stat.target} suffix={stat.suffix} />
                </p>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title={copy.insightsTitle}
            subtitle={copy.insightsSubtitle}
          />
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {featuredNews.map((item) => (
              <div
                key={item.id}
                className="group cursor-pointer overflow-hidden rounded-3xl border border-gray-100 bg-gray-50 transition-all hover:border-foodera-forest/30 hover:shadow-2xl"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 rounded-lg bg-foodera-forest px-3 py-1 text-[10px] font-black uppercase tracking-widest text-foodera-lime shadow-lg">
                    {formatDisplayDate(item.date, locale)}
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="mb-4 text-xl font-black leading-tight text-gray-900 transition-colors group-hover:text-foodera-forest">
                    {item.title}
                  </h3>
                  <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-gray-500">{item.excerpt}</p>
                  <Link
                    to={getNewsPath(item)}
                    className="inline-flex items-center gap-2 text-sm font-black text-foodera-forest transition-colors hover:text-foodera-lime"
                    onClick={() => {
                      void trackEvent(
                        {
                          entityType: 'news',
                          action: 'click',
                          itemId: item.id,
                          newsCategory: item.category,
                          locale,
                          metadata: {
                            surface: 'home_featured'
                          }
                        },
                        {
                          dedupeKey: `news-click:${item.id}:home-featured`,
                          dedupeTtlMs: 1200
                        }
                      );
                    }}
                  >
                    {copy.readArticle}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-white py-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(#006838 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
        <div className="relative z-10 mx-auto max-w-6xl px-4">
          <div className="group relative overflow-hidden rounded-[4rem] border border-gray-100 bg-gray-50 p-12 text-center shadow-2xl md:p-24">
            <div className="absolute top-0 right-0 h-64 w-64 -mr-32 -mt-32 rounded-full bg-foodera-lime/10 blur-3xl transition-colors duration-1000 group-hover:bg-foodera-lime/20" />
            <div className="absolute bottom-0 left-0 h-64 w-64 -mb-32 -ml-32 rounded-full bg-foodera-forest/5 blur-3xl transition-colors duration-1000 group-hover:bg-foodera-forest/10" />

            <div className="relative z-10 mx-auto max-w-3xl">
              <h2 className="mb-8 text-4xl font-black leading-tight tracking-tighter text-gray-900 md:text-7xl">
                {copy.ctaPrefix} <span className="text-foodera-forest">{copy.ctaHighlight}</span>{copy.ctaSuffix}
              </h2>
              <p className="mb-12 text-xl font-medium leading-relaxed text-gray-500">
                {copy.ctaDesc}
              </p>
              <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                <Link
                  to={appRoutes.contact}
                  className="flex items-center gap-3 rounded-2xl bg-foodera-forest px-14 py-6 text-xs font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-foodera-forest/20 transition-all hover:scale-105 hover:bg-foodera-lime hover:text-foodera-forest active:scale-95"
                >
                  {copy.connectSales} <ArrowRight size={18} />
                </Link>
                <Link
                  to={appRoutes.products}
                  className="rounded-2xl border-2 border-gray-200 bg-white px-14 py-6 text-xs font-black uppercase tracking-[0.3em] text-gray-400 transition-all hover:border-foodera-forest hover:text-foodera-forest"
                >
                  {copy.browseCatalog}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
