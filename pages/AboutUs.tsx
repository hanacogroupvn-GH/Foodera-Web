import React from 'react';
import { ShieldCheck, Globe, Handshake, Leaf, Wheat, Coffee } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { useDocumentMeta, BASE_URL } from '../lib/useDocumentMeta';
import { preserveVietnamesePlaceNamesDeep } from '../lib/preserveVietnamesePlaceNames';

const enCopy = {
  heroTitle: 'About Foodmax',
  heroDesc:
    'Foodmax is dedicated to elevating Vietnamese agricultural products to the global marketplace. With deep respect for Vietnam’s farming traditions and a forward-looking mindset, we connect international buyers with reliable origin supply.',
  heroAlt: 'Coffee beans',
  foundationEyebrow: 'Our Foundation',
  foundationTitle: 'Sustainable Value Across the Supply Chain',
  foundationTextOne:
    'Founded with the vision of creating sustainable value across the supply chain, Foodmax works hand in hand with reputable growers, cooperatives, and processing facilities throughout Vietnam.',
  foundationTextTwo:
    'From sourcing and quality control to logistics, we carefully oversee each step to ensure our products consistently meet international expectations while also contributing value back to farming communities.',
  foundationAlt: 'Vietnamese agriculture',
  productsEyebrow: 'Core Products',
  productsTitle: 'Vietnam’s Most Sought-After Exports',
  productsDesc:
    'Each product is selected not only for commercial relevance, but for its ability to represent Vietnam’s agricultural strength and distinctive flavor profiles.',
  productCards: [
    {
      title: 'Premium Rice',
      desc: 'Carefully selected varieties with consistent grain quality and aroma.'
    },
    {
      title: 'Coffee Beans',
      desc: 'High-grade beans with balanced profiles and export-ready consistency.'
    },
    {
      title: 'Coconut Milk',
      desc: 'Rich, creamy formulations produced to international food standards.'
    },
    {
      title: 'Black & White Pepper',
      desc: 'Aromatic, clean, and carefully processed to preserve flavor.'
    },
    {
      title: 'Cashew Kernels',
      desc: 'High-grade kernels with strict quality control and uniform grading.'
    },
    {
      title: 'Global Market Fit',
      desc: 'Specifications tailored for importers, distributors, and manufacturers.'
    }
  ],
  commitmentEyebrow: 'Our Commitment',
  commitmentTitle: 'Partnerships Built on Transparency',
  commitmentTextOne:
    'At Foodmax, we believe strong partnerships are built on transparency, consistency, and mutual growth. Whether serving importers, distributors, or food manufacturers, we approach each collaboration with professionalism and long-term intent.',
  commitmentTextTwo:
    'By combining local expertise with global standards, our mission is simple: deliver dependable agricultural solutions while sharing the true essence of Vietnam with customers around the world.',
  principlesEyebrow: 'Core Principles',
  principles: [
    {
      title: 'Quality Without Compromise',
      desc: 'Consistent standards from farm to shipment.'
    },
    {
      title: 'Service With Integrity',
      desc: 'Responsible sourcing and responsive support.'
    },
    {
      title: 'Partnerships That Last',
      desc: 'Mutual growth with a long-term focus.'
    }
  ],
  closingEyebrow: 'Looking Forward',
  closingTitle: 'Sharing Vietnam’s Essence With The World',
  closingDesc:
    'As we continue to grow, Foodmax remains guided by three core principles: quality without compromise, service with integrity, and partnerships that last.'
};

const zhCopy = {
  heroTitle: '关于 Foodmax',
  heroDesc:
    'Foodmax 致力于把越南优质农产品带向全球市场。我们尊重越南农业传统，同时以国际化视角连接全球采购商与值得信赖的原产地供应。',
  heroAlt: '咖啡豆',
  foundationEyebrow: '我们的基础',
  foundationTitle: '贯穿供应链的可持续价值',
  foundationTextOne:
    'Foodmax 以构建供应链长期价值为愿景，与越南各地可靠的种植者、合作社和加工工厂协同合作。',
  foundationTextTwo:
    '从采购、质量控制到物流交付，我们对每个环节保持严格把关，确保产品持续符合国际市场的高标准要求，并让农业社区也从长期合作中获益。',
  foundationAlt: '越南农业',
  productsEyebrow: '核心产品',
  productsTitle: '越南最受欢迎的出口品类',
  productsDesc: '我们选择每一项产品，不只看商业价值，也看它是否足以代表越南农业的风味、稳定性与竞争力。',
  productCards: [
    {
      title: '优质大米',
      desc: '精选稻种，兼顾稳定粒型、香气与出口一致性。'
    },
    {
      title: '咖啡豆',
      desc: '覆盖商业级与精品级批次，风味平衡，便于国际采购。'
    },
    {
      title: '椰奶制品',
      desc: '符合国际食品标准的浓郁配方，适合餐饮与工业应用。'
    },
    {
      title: '黑胡椒与白胡椒',
      desc: '香气纯净，处理规范，能够稳定保留辛香表现。'
    },
    {
      title: '腰果仁',
      desc: '高等级选品，等级统一，质量控制严格。'
    },
    {
      title: '全球市场适配',
      desc: '可根据进口商、分销商和食品制造商需求定制规格。'
    }
  ],
  commitmentEyebrow: '我们的承诺',
  commitmentTitle: '建立在透明度上的长期合作',
  commitmentTextOne:
    'Foodmax 相信优秀合作关系来自透明、稳定和共同成长。无论客户是进口商、分销商还是食品制造商，我们都以长期合作视角推进每一个项目。',
  commitmentTextTwo:
    '通过把本地经验与国际标准结合，我们的目标很明确：持续输出可靠的农业供应解决方案，并让全球客户感受到越南农产品真正的价值。',
  principlesEyebrow: '核心原则',
  principles: [
    {
      title: '质量不妥协',
      desc: '从农场到装运的每一个节点都保持一致标准。'
    },
    {
      title: '服务有诚信',
      desc: '坚持负责任采购，并提供响应快速的客户支持。'
    },
    {
      title: '合作可持续',
      desc: '以长期增长和互利关系为导向。'
    }
  ],
  closingEyebrow: '展望未来',
  closingTitle: '把越南的真实风味带向世界',
  closingDesc:
    '在持续成长过程中，Foodmax 仍然坚持三项原则：质量不妥协、服务有诚信、合作可持续。'
};

const AboutUs: React.FC = () => {
  const { locale } = useLocale();

  useDocumentMeta({
    title: locale === 'zh' ? '关于 Foodmax' : 'About Foodmax',
    description: locale === 'zh'
      ? 'Foodmax 致力于将越南优质农产品（大米、咖啡、腰果）带向全球市场，提供可持续、透明的供应链服务。'
      : 'Foodmax is dedicated to elevating Vietnamese agricultural products to the global marketplace. Premium rice, coffee & cashew with transparent supply chain.',
    canonicalUrl: `${BASE_URL}/about`,
    ogUrl: `${BASE_URL}/about`,
  });

  const rawCopy = locale === 'zh' ? zhCopy : enCopy;
  const copy = locale === 'zh' ? preserveVietnamesePlaceNamesDeep(rawCopy) : rawCopy;

  const productIcons = [Wheat, Coffee, Leaf, Leaf, Leaf, Globe];
  const principleIcons = [ShieldCheck, Leaf, Handshake];

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-700 font-sans">
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 border-b border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-[900] text-gray-900 mb-8 tracking-tight leading-tight">
                {copy.heroTitle}
              </h1>
              <div className="h-1 w-24 bg-foodmax-lime mb-8" />
              <p className="text-lg md:text-2xl text-gray-600 font-medium leading-relaxed">{copy.heroDesc}</p>
            </div>
            <div className="lg:pl-8">
              <div className="aspect-[4/5] bg-gray-100 rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
                <img
                  src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=1200"
                  alt={copy.heroAlt}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gray-50 -z-0 hidden lg:block" />
      </section>

      <section className="py-20 md:py-24 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/5] bg-gray-100 rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
                <img
                  src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&q=80&w=1200"
                  alt={copy.foundationAlt}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6">
                {copy.foundationEyebrow}
              </h2>
              <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 tracking-tight">
                {copy.foundationTitle}
              </h3>
              <p className="text-base md:text-lg text-gray-600 mb-6 leading-relaxed font-medium">
                {copy.foundationTextOne}
              </p>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed font-medium">
                {copy.foundationTextTwo}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6">
              {copy.productsEyebrow}
            </h2>
            <h3 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">{copy.productsTitle}</h3>
            <p className="text-base md:text-lg text-gray-500 mt-4 max-w-3xl mx-auto font-medium">
              {copy.productsDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {copy.productCards.map((card, index) => {
              const Icon = productIcons[index];
              return (
                <div key={card.title} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="w-12 h-12 bg-foodmax-forest/5 rounded-xl flex items-center justify-center text-foodmax-forest mb-5">
                    <Icon size={22} />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 mb-2">{card.title}</h4>
                  <p className="text-sm text-gray-500 font-medium">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6">
                {copy.commitmentEyebrow}
              </h2>
              <h3 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
                {copy.commitmentTitle}
              </h3>
              <p className="text-base md:text-lg text-gray-600 mb-6 leading-relaxed font-medium">
                {copy.commitmentTextOne}
              </p>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed font-medium">
                {copy.commitmentTextTwo}
              </p>
            </div>
            <div className="bg-foodmax-forest rounded-[2.5rem] p-10 md:p-12 text-white relative overflow-hidden">
              <h4 className="text-[10px] font-black text-foodmax-lime uppercase tracking-[0.4em] mb-6">
                {copy.principlesEyebrow}
              </h4>
              <div className="space-y-4">
                {copy.principles.map((principle, index) => {
                  const Icon = principleIcons[index];
                  return (
                    <div
                      key={principle.title}
                      className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4"
                    >
                      <Icon size={20} className="text-foodmax-lime" />
                      <div>
                        <p className="text-sm font-black uppercase tracking-widest">{principle.title}</p>
                        <p className="text-xs text-white/70 mt-1">{principle.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-foodmax-forest text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-[10px] font-black text-white/70 uppercase tracking-[0.4em] mb-8">{copy.closingEyebrow}</h2>
          <h3 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight">{copy.closingTitle}</h3>
          <p className="text-lg text-white/80 mb-10 font-medium leading-relaxed">{copy.closingDesc}</p>
          <div className="pt-10 border-t border-white/15 mt-10" />
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
