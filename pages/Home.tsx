import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Truck,
  Factory,
  Zap,
  Image as ImageIcon,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import HeroSlider from "../components/HeroSlider";
import ExportReachMap from "../components/ExportReachMap";
import SectionHeading from "../components/SectionHeading";
import ProductCard from "../components/ProductCard";
import Counter from "../components/Counter";
import AppShellLoader from "../components/AppShellLoader";
import { useData } from "../context/DataContext";
import { getNewsPath } from "../lib/newsSeo";
import { useLocale } from "../context/LocaleContext";
import { getCategoryLabel, localizeNewsItem } from "../lib/contentLocalization";
import { appRoutes } from "../lib/routes";
import { preserveVietnamesePlaceNamesDeep } from "../lib/preserveVietnamesePlaceNames";
import { useDocumentMeta, BASE_URL } from "../lib/useDocumentMeta";

// Add new partner logos here — drop the image file into public/media/partners/
// and add a matching entry below. Keep the list to ~20 so the grid stays
// readable; this is a curated selection, not the full partner roster.
const PARTNER_LOGOS: { src: string; name: string }[] = [
  { src: "/media/partners/partner-badia.webp", name: "Badia" },
  { src: "/media/partners/partner-calvo.webp", name: "Calvo" },
  { src: "/media/partners/partner-chovi.webp", name: "Chovi" },
  { src: "/media/partners/partner-crown.webp", name: "Crown" },
  { src: "/media/partners/partner-sandhurst.webp", name: "Sandhurst" },
  { src: "/media/partners/partner-kericho-gold.webp", name: "Kericho Gold" },
  {
    src: "/media/partners/partner-california-figs.webp",
    name: "California Figs",
  },
  { src: "/media/partners/partner-arabian-mills.webp", name: "Arabian Mills" },
  {
    src: "/media/partners/partner-al-ahmadiya-dates.webp",
    name: "Al Ahmadiya Dates",
  },
  { src: "/media/partners/partner-abbar.webp", name: "Abbar" },
  { src: "/media/partners/partner-qatar-pafki.webp", name: "Qatar Pafki" },
  {
    src: "/media/partners/partner-al-shamal.webp",
    name: "Al Shamal Food Factory",
  },
  { src: "/media/partners/partner-baidar.webp", name: "Baidar" },
  { src: "/media/partners/partner-cofftea.webp", name: "Cofftea" },
  { src: "/media/partners/partner-agolives.webp", name: "agOlives" },
  { src: "/media/partners/partner-delikatessa.webp", name: "Delikatessa" },
  { src: "/media/partners/partner-chic-and-basic.webp", name: "Chic & Basic" },
  {
    src: "/media/partners/partner-royal-pasta-factory.webp",
    name: "Royal Pasta Factory",
  },
  { src: "/media/partners/partner-desly.webp", name: "Desly" },
  {
    src: "/media/partners/partner-colorado-dept-agriculture.webp",
    name: "Colorado Department of Agriculture",
  },
  {
    src: "/media/partners/partner-gazdinstvo-nedeljkov.webp",
    name: "Gazdinstvo Nedeljkov",
  },
  { src: "/media/partners/partner-evergreen-tea.webp", name: "Evergreen Tea" },
  { src: "/media/partners/partner-carter-pecan.webp", name: "Carter Pecan" },
  {
    src: "/media/partners/partner-xunta-de-galicia.webp",
    name: "Xunta de Galicia",
  },
];

const enCopy = {
  loader: "Loading catalog and market insights...",
  whyChooseUsTitle: "Why Choose Us",
  whyChooseUsSubtitle: "Your success is our commitment.",
  advantages: [
    {
      icon: ShieldCheck,
      title: "Certified Quality",
      desc: "HACCP, ISO 22000, and FDA compliant processing facilities.",
    },
    {
      icon: Truck,
      title: "Global Logistics",
      desc: "Strategic partnerships with major shipping lines for 30+ countries.",
    },
    {
      icon: Factory,
      title: "Direct Sourcing",
      desc: "Vertical integration from central highlands to packaging plants.",
    },
    {
      icon: Zap,
      title: "Fast Execution",
      desc: "Streamlined export documentation and rapid response timelines.",
    },
  ],
  categoriesTitle: "Product Categories",
  categoriesSubtitle:
    "We offer a diverse range of premium Vietnamese products, delivering quality, reliability, and value to customers worldwide.",
  privateLabelLabel: "Private Label Service",
  exportLinesTitle: "Our Premium Export Lines",
  exportLinesSubtitle:
    "High-quality agricultural commodities, meticulously processed for the most demanding international markets.",
  viewAllCategories: "View All Product Categories",
  stats: [
    { target: 500, suffix: "K+", label: "MT Tons Exported" },
    { target: 30, suffix: "+", label: "Target Countries" },
    { target: 1000, suffix: "+", label: "Local FarmS Connected" },
    { target: 100, suffix: "%", label: "Traceability" },
  ],
  partnersTitle: "Trusted By Our Partners",
  partnersSubtitle:
    "Working alongside leading food companies and distributors across global markets.",
  insightsTitle: "News",
  insightsSubtitle:
    "Expert perspectives on Vietnamese agriculture and global commodity trends.",
  readArticle: "Read Article",
};

const zhCopy = {
  loader: "正在加载目录与市场洞察...",
  whyChooseUsTitle: "为什么选择我们",
  whyChooseUsSubtitle: "您的成功是我们的承诺。",
  advantages: [
    {
      icon: ShieldCheck,
      title: "认证品质",
      desc: "加工设施符合 HACCP、ISO 22000 与 FDA 标准。",
    },
    {
      icon: Truck,
      title: "全球物流",
      desc: "与主要船公司建立合作，覆盖 30+ 国家。",
    },
    {
      icon: Factory,
      title: "直接采购",
      desc: "从中部高原原料到包装工厂实现垂直整合。",
    },
    {
      icon: Zap,
      title: "快速执行",
      desc: "出口单证流程高效，响应周期更短。",
    },
  ],
  categoriesTitle: "产品类别",
  categoriesSubtitle:
    "我们提供多样化的优质越南产品，为全球客户带来品质、可靠性与价值。",
  privateLabelLabel: "定制品牌服务",
  exportLinesTitle: "我们的优质出口产品线",
  exportLinesSubtitle: "面向高要求国际市场的高品质农产品。",
  viewAllCategories: "查看全部产品分类",
  stats: [
    { target: 500, suffix: "K+", label: "出口吨数" },
    { target: 45, suffix: "+", label: "目标国家" },
    { target: 15, suffix: "+", label: "运营年限" },
    { target: 100, suffix: "%", label: "可追溯性" },
  ],
  partnersTitle: "我们的合作伙伴",
  partnersSubtitle: "与全球领先的食品企业与经销商携手合作。",
  insightsTitle: "新闻",
  insightsSubtitle: "关于越南农业与全球大宗商品趋势的专业观察。",
  readArticle: "阅读文章",
};

// Product categories shown site-wide (mega menu, product portfolio).
const PRODUCT_CATEGORIES: Array<{
  category: string;
  image: string;
  trending?: boolean;
}> = [
  {
    category: "Rice",
    image: "/media/products/rice-jasmine-5-plate-optimized.jpg",
  },
  {
    category: "Coffee",
    image: "/media/products/cof-rob-g1-s18-cl-optimized.webp",
  },
  {
    category: "Cashew",
    image: "/media/products/cashew-ww240-plate-optimized.jpg",
  },
  {
    category: "Pepper",
    image: "/media/products/bp-faq-550-plate-optimized.jpg",
  },
  {
    category: "Coconut",
    image: "/media/products/coconut-thumb-01-single.jpg",
    trending: true,
  },
  {
    category: "Durian",
    image: "/media/products/durian-whole-frozen-05-frozen.jpg",
  },
  {
    category: "Spices",
    image: "/media/products/spices-star-anise-spring-01.jpg",
  },
  { category: "Private Label Service", image: "" },
];

const Home: React.FC = () => {
  const { activeProducts, activeNews, isLoading } = useData();
  const { locale } = useLocale();
  const featuredProducts = [...activeProducts]
    .sort((a, b) => {
      const aPinned = a.pinOrder != null;
      const bPinned = b.pinOrder != null;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      if (aPinned && bPinned) return (a.pinOrder ?? 0) - (b.pinOrder ?? 0);
      return 0;
    })
    .slice(0, 4);
  const featuredNews = activeNews
    .slice(0, 4)
    .map((item) => localizeNewsItem(item, locale));

  useDocumentMeta({
    title: locale === "zh" ? "首页" : "FoodEra Official Site",
    description:
      locale === "zh"
        ? "FoodEra 专注越南优质大米、咖啡与腰果出口，服务全球30+国家进口商。HACCP & ISO 22000 认证。"
        : "Premium rice, specialty coffee & cashew kernels from Vietnam. HACCP & ISO 22000 certified. Serving importers in 30+ countries.",
    canonicalUrl: BASE_URL + "/",
    ogUrl: BASE_URL + "/",
    ogImage: BASE_URL + "/og-image.png",
  });

  const rawCopy = locale === "zh" ? zhCopy : enCopy;
  const copy =
    locale === "zh" ? preserveVietnamesePlaceNamesDeep(rawCopy) : rawCopy;

  if (isLoading && activeProducts.length === 0 && activeNews.length === 0) {
    return <AppShellLoader compact label={copy.loader} />;
  }

  return (
    <div className="animate-in fade-in duration-700">
      <HeroSlider />

      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title={copy.categoriesTitle}
            subtitle={copy.categoriesSubtitle}
          />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {PRODUCT_CATEGORIES.map((item) => {
              const isPrivateLabel = item.category === "Private Label Service";
              const label = isPrivateLabel
                ? copy.privateLabelLabel
                : getCategoryLabel(item.category, locale);

              return (
                <Link
                  key={item.category}
                  to={
                    isPrivateLabel
                      ? appRoutes.contact
                      : appRoutes.productsByCategory(item.category)
                  }
                  className="group flex flex-col items-center text-center"
                >
                  <div className="relative mb-5 h-36 w-36 transition-transform duration-300 ease-out group-hover:-translate-y-1 sm:h-40 sm:w-40 lg:h-48 lg:w-48">
                    <div className="h-full w-full overflow-hidden rounded-full border-4 border-white shadow-lg ring-2 ring-gray-100 transition-shadow duration-300 group-hover:shadow-xl">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={label}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : isPrivateLabel ? (
                        <div className="flex h-full w-full items-center justify-center bg-foodera-lime/10">
                          <Sparkles
                            size={48}
                            className="text-foodera-forest"
                            strokeWidth={1.5}
                          />
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-50">
                          <ImageIcon
                            size={52}
                            className="text-gray-300"
                            strokeWidth={1.5}
                          />
                        </div>
                      )}
                    </div>
                    {item.trending && (
                      <div className="absolute -top-1 -right-1 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-foodera-lime text-foodera-forest shadow-lg ring-4 ring-white animate-pulse">
                        <TrendingUp size={18} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-gray-900 transition-colors group-hover:text-foodera-forest">
                    {label}
                  </h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title={copy.whyChooseUsTitle}
            subtitle={copy.whyChooseUsSubtitle}
          />
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {copy.advantages.map((advantage, index) => (
              <div
                key={advantage.title}
                className="group flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-gray-50 shadow-lg ring-2 ring-gray-100 transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:bg-foodera-forest group-hover:shadow-2xl group-hover:shadow-foodera-lime/30 group-hover:ring-4 group-hover:ring-foodera-lime">
                    <advantage.icon
                      size={38}
                      className="text-foodera-forest transition-colors duration-500 group-hover:text-white"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-foodera-lime text-xs font-black text-foodera-forest shadow-md ring-4 ring-white">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </div>
                <h3 className="mb-3 text-lg font-black tracking-tight text-gray-900">
                  {advantage.title}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-gray-500">
                  {advantage.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      <section className="relative overflow-hidden bg-foodera-forest py-24 text-white">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-12 text-center md:grid-cols-4">
            {copy.stats.map((stat) => (
              <div key={stat.label} className="group">
                <p className="mb-2 text-4xl font-black text-foodera-lime drop-shadow-sm transition-transform group-hover:scale-105 md:text-6xl">
                  <Counter target={stat.target} suffix={stat.suffix} />
                </p>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ExportReachMap />

      <section className="relative overflow-hidden bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title={copy.partnersTitle}
            subtitle={copy.partnersSubtitle}
          />
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm md:p-14">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {PARTNER_LOGOS.map((partner) => (
                <div
                  key={partner.src}
                  className="group flex h-28 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-foodera-forest/30 hover:shadow-md"
                >
                  <img
                    src={partner.src}
                    alt={partner.name}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title={copy.insightsTitle}
            subtitle={copy.insightsSubtitle}
          />
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
                </div>
                <div className="p-6">
                  <h3 className="mb-4 text-xl font-black leading-tight text-gray-900 transition-colors group-hover:text-foodera-forest">
                    {item.title}
                  </h3>
                  <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-gray-500">
                    {item.excerpt}
                  </p>
                  <Link
                    to={getNewsPath(item)}
                    className="inline-flex items-center gap-2 text-sm font-black text-foodera-forest transition-colors hover:text-foodera-lime"
                  >
                    {copy.readArticle}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
