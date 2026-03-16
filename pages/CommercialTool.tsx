import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BarChart,
  Calendar,
  Download,
  Globe,
  Info,
  Mail,
  MapPin,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

interface YieldData {
  year: string;
  volume: number;
}

interface RegionTranslation {
  name: string;
  short: string;
  desc: string;
  profile: Record<string, string>;
}

interface Region {
  id: string;
  name: string;
  x: number;
  y: number;
  image: string;
  short: string;
  desc: string;
  profile: Record<string, string>;
  seasonMonths: number[];
  specsheet: string;
  contact: string;
  historicalYield: YieldData[];
  projection: {
    target: number;
    current: number;
  };
  translations?: {
    zh?: RegionTranslation;
  };
}

const FM_REGIONS: Region[] = [
  {
    id: 'sonla',
    name: 'Son La (Northwest)',
    x: 32,
    y: 15,
    image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=70',
    short: 'Northwest Arabica origin with bright acidity and floral notes.',
    desc: 'Cooler highland climate supports aromatic Arabica lots suitable for specialty and single-origin programs.',
    profile: {
      Characteristics: 'Aromatic, bright acidity, clean finish',
      Varieties: 'Arabica (Catimor, Typica selections)',
      Certifications: 'Available upon request',
      'Harvest Season': 'Oct - Dec',
      'Annual Volume': '~ 45,000 tons',
      Processing: 'Washed, Honey',
      Traceability: 'Farmer ID, plot mapping'
    },
    seasonMonths: [10, 11, 12],
    specsheet: '#',
    contact: '/contact',
    historicalYield: [
      { year: '2022', volume: 38000 },
      { year: '2023', volume: 42000 },
      { year: '2024', volume: 45000 }
    ],
    projection: { target: 50000, current: 45500 },
    translations: {
      zh: {
        name: '山罗省（越南西北）',
        short: '越南西北部阿拉比卡产区，酸质明亮，带有花香调性。',
        desc: '凉爽高地气候适合香气型阿拉比卡，适用于精品和单一产地项目。',
        profile: {
          特征: '香气明显、酸质明亮、尾韵干净',
          品种: '阿拉比卡（Catimor、Typica 选系）',
          认证: '可按需提供',
          采收季: '10 月 - 12 月',
          年产量: '约 45,000 吨',
          处理方式: '水洗、蜜处理',
          可追溯性: '农户编号、地块映射'
        }
      }
    }
  },
  {
    id: 'quangtri',
    name: 'Quang Tri (Central)',
    x: 52,
    y: 38,
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=70',
    short: 'Emerging origin with diverse micro-lots.',
    desc: 'Developing supply with potential for differentiated programs; suitable for both commercial and specialty lots.',
    profile: {
      Characteristics: 'Balanced profile; flexible lot selection',
      Varieties: 'Arabica & Robusta',
      Certifications: 'Project-based',
      'Harvest Season': 'Nov - Jan',
      'Annual Volume': '~ 12,000 tons',
      Processing: 'Natural, Washed',
      Traceability: 'Supplier onboarding, lot codes'
    },
    seasonMonths: [11, 12, 1],
    specsheet: '#',
    contact: '/contact',
    historicalYield: [
      { year: '2022', volume: 8000 },
      { year: '2023', volume: 10500 },
      { year: '2024', volume: 12000 }
    ],
    projection: { target: 18000, current: 12200 },
    translations: {
      zh: {
        name: '广治省（中部）',
        short: '新兴产区，拥有更多可区分的小批次潜力。',
        desc: '供应正在成长，适合商业级与精品级并行开发。',
        profile: {
          特征: '风味平衡，批次选择灵活',
          品种: '阿拉比卡与罗布斯塔',
          认证: '按项目配置',
          采收季: '11 月 - 1 月',
          年产量: '约 12,000 吨',
          处理方式: '日晒、水洗',
          可追溯性: '供应商准入、批次编码'
        }
      }
    }
  },
  {
    id: 'gialai',
    name: 'Gia Lai (Central Highlands)',
    x: 65,
    y: 65,
    image: 'https://images.unsplash.com/photo-1621351183012-e2f0c9d2cf03?auto=format&fit=crop&w=1200&q=70',
    short: 'Basalt soil highlands producing consistent export-grade Robusta.',
    desc: 'Stable supply for bulk export contracts; lot selection available for quality tiers and processing preferences.',
    profile: {
      Characteristics: 'Strong body, cocoa notes, consistent cup',
      Varieties: 'Robusta',
      Certifications: '4C / Rainforest Alliance',
      'Harvest Season': 'Nov - Jan',
      'Annual Volume': '~ 180,000 tons',
      Processing: 'Natural, Honey',
      Traceability: 'Farmer profiles, batch QR'
    },
    seasonMonths: [11, 12, 1],
    specsheet: '#',
    contact: '/contact',
    historicalYield: [
      { year: '2022', volume: 165000 },
      { year: '2023', volume: 172000 },
      { year: '2024', volume: 180000 }
    ],
    projection: { target: 200000, current: 184000 },
    translations: {
      zh: {
        name: '嘉莱省（西原）',
        short: '玄武岩高地，稳定产出出口级罗布斯塔。',
        desc: '适合大宗出口合同，也支持不同质量层级与处理偏好的批次选择。',
        profile: {
          特征: '醇厚、可可调性、杯测稳定',
          品种: '罗布斯塔',
          认证: '4C / 雨林联盟',
          采收季: '11 月 - 1 月',
          年产量: '约 180,000 吨',
          处理方式: '日晒、蜜处理',
          可追溯性: '农户档案、批次二维码'
        }
      }
    }
  },
  {
    id: 'daklak',
    name: 'Dak Lak (Central Highlands)',
    x: 62,
    y: 75,
    image: 'https://images.unsplash.com/photo-1599634871932-7f9b64d0cfc6?auto=format&fit=crop&w=1200&q=70',
    short: "Vietnam's largest Robusta sourcing hub.",
    desc: "The country's flagship origin for export-grade Robusta with scalable supply and structured QC options.",
    profile: {
      Characteristics: 'Full body, chocolate/nutty notes',
      Varieties: 'Robusta',
      Certifications: '4C / Rainforest Alliance / UTZ',
      'Harvest Season': 'Nov - Feb',
      'Annual Volume': '> 420,000 tons',
      Processing: 'Natural, Washed',
      Traceability: 'Farm GPS mapping, lot segregation'
    },
    seasonMonths: [11, 12, 1, 2],
    specsheet: '#',
    contact: '/contact',
    historicalYield: [
      { year: '2022', volume: 395000 },
      { year: '2023', volume: 410000 },
      { year: '2024', volume: 420000 }
    ],
    projection: { target: 450000, current: 428000 },
    translations: {
      zh: {
        name: '得乐省（西原）',
        short: '越南最大的罗布斯塔采购核心区。',
        desc: '越南出口级罗布斯塔旗舰产地，具备大规模供应与结构化质控能力。',
        profile: {
          特征: '醇厚、巧克力与坚果风味',
          品种: '罗布斯塔',
          认证: '4C / 雨林联盟 / UTZ',
          采收季: '11 月 - 2 月',
          年产量: '> 420,000 吨',
          处理方式: '日晒、水洗',
          可追溯性: '农场 GPS 标注、批次隔离'
        }
      }
    }
  },
  {
    id: 'lamdong',
    name: 'Lam Dong (Cau Dat)',
    x: 68,
    y: 84,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=70',
    short: 'Premium Arabica origin for specialty roasters.',
    desc: 'High-altitude Arabica suitable for single-origin and specialty contracts; strong differentiation by micro-lots.',
    profile: {
      Characteristics: 'Floral aroma, citrus acidity, clean sweetness',
      Varieties: 'Arabica (Typica, Bourbon, Catimor)',
      Certifications: 'Organic / Rainforest Alliance',
      'Harvest Season': 'Oct - Dec',
      'Annual Volume': '~ 55,000 tons',
      Processing: 'Washed, Honey',
      Traceability: 'Single-farm lots, cupping scores'
    },
    seasonMonths: [10, 11, 12],
    specsheet: '#',
    contact: '/contact',
    historicalYield: [
      { year: '2022', volume: 48000 },
      { year: '2023', volume: 52000 },
      { year: '2024', volume: 55000 }
    ],
    projection: { target: 65000, current: 58000 },
    translations: {
      zh: {
        name: '林同省（Cau Dat）',
        short: '面向精品烘焙市场的高端阿拉比卡产区。',
        desc: '高海拔阿拉比卡适合单一产地与精品合同，微批次差异化优势明显。',
        profile: {
          特征: '花香、柑橘酸质、甜感干净',
          品种: '阿拉比卡（Typica、Bourbon、Catimor）',
          认证: '有机 / 雨林联盟',
          采收季: '10 月 - 12 月',
          年产量: '约 55,000 吨',
          处理方式: '水洗、蜜处理',
          可追溯性: '单庄园批次、杯测评分'
        }
      }
    }
  }
];

const VietnamMapSVG: React.FC = () => (
  <svg viewBox="0 0 400 800" className="h-full w-full drop-shadow-2xl overflow-visible">
    <path
      d="M110,60 L130,55 L160,45 L190,55 L210,80 L205,110 L180,130 L160,150 L185,180 L210,210 L220,250 L230,280 L240,320 L245,360 L260,400 L280,440 L295,480 L305,520 L310,560 L315,600 L305,640 L280,680 L250,710 L210,730 L180,720 L150,705 L120,700 L100,685 L120,660 L150,650 L180,630 L170,600 L140,580 L130,550 L135,510 L150,480 L175,440 L195,400 L200,360 L180,330 L150,310 L130,280 L120,250 L115,210 L100,180 L80,150 L75,120 L85,90 Z"
      fill="url(#mapGradient)"
      stroke="white"
      strokeWidth="1.5"
      className="transition-all duration-700 hover:stroke-foodmax-lime"
    />
    <defs>
      <linearGradient id="mapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#006838" />
        <stop offset="100%" stopColor="#003d21" />
      </linearGradient>
    </defs>
  </svg>
);

const localizeRegion = (region: Region, locale: 'en' | 'zh') => {
  if (locale === 'zh' && region.translations?.zh) {
    return {
      ...region,
      name: region.translations.zh.name,
      short: region.translations.zh.short,
      desc: region.translations.zh.desc,
      profile: region.translations.zh.profile
    };
  }

  return region;
};

const CommercialTool: React.FC = () => {
  const { locale } = useLocale();
  const [selectedRegion, setSelectedRegion] = useState<Region>(FM_REGIONS.find((region) => region.id === 'daklak') || FM_REGIONS[0]);
  const [hoveredRegion, setHoveredRegion] = useState<Region | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'stats'>('profile');

  const copy =
    locale === 'zh'
      ? {
          badge: '原产地情报门户',
          titleStart: '越南原产地',
          titleAccent: '情报地图',
          subtitle: '为国际农产品买家准备的区域化数据视图，可查看主要供应集群的产量、采收周期与可采购能力。',
          mapVersion: '越南商业地图 v2.5',
          activeHub: '活跃节点',
          futureCluster: '未来集群',
          sourcingNode: '采购节点',
          geodata: '区域地理数据',
          geodataValue: 'WGS 84 / UTM 48N',
          analyticalFocus: '分析焦点',
          profileTab: '区域概况',
          statsTab: '产量情报',
          clusterSpecs: '集群规格',
          seasonalActivity: '季节活动',
          yieldHistory: '历史产量表现（吨）',
          supplyForecast: '第三季度供应预测',
          inProgress: '进行中',
          fulfillmentCapacity: '履约能力',
          targetVolume: '目标产量',
          stockPurity: '纯净度',
          requestQuote: '申请报价',
          technicalDossier: '技术资料包',
          strategicSupport: '战略贸易支持',
          strategicDesc: '获取本地化市场判断与多年度产量趋势，支持长期合同规划。',
          consultDesk: '咨询贸易团队',
          months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
        }
      : {
          badge: 'Origin Intelligence Portal',
          titleStart: 'Vietnam Origin',
          titleAccent: 'Intelligence Map',
          subtitle:
            'Spatial and commercial sourcing data built for international agri-commodity buyers. Explore yield patterns, harvest cycles, and supply readiness across key clusters.',
          mapVersion: 'Vietnam Commercial Map v2.5',
          activeHub: 'Active Hub',
          futureCluster: 'Future Cluster',
          sourcingNode: 'Sourcing Node',
          geodata: 'Regional Geodata',
          geodataValue: 'WGS 84 / UTM zone 48N',
          analyticalFocus: 'Analytical Focus',
          profileTab: 'Regional Profile',
          statsTab: 'Yield Intelligence',
          clusterSpecs: 'Cluster Specifications',
          seasonalActivity: 'Seasonal Activity',
          yieldHistory: 'Historical Yield Performance (MT)',
          supplyForecast: 'Q3 Supply Forecast',
          inProgress: 'In Progress',
          fulfillmentCapacity: 'Fulfillment Capacity',
          targetVolume: 'Target Volume',
          stockPurity: 'Stock Purity',
          requestQuote: 'Request Quote',
          technicalDossier: 'Technical Dossier',
          strategicSupport: 'Strategic Trade Support',
          strategicDesc: 'Access localized market intelligence and multi-year production trends for long-term contract planning.',
          consultDesk: 'Consult with Trade Desk',
          months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        };

  const displayedRegion = useMemo(() => localizeRegion(selectedRegion, locale), [locale, selectedRegion]);
  const maxYield = Math.max(...selectedRegion.historicalYield.map((yieldPoint) => yieldPoint.volume));
  const hasSpecsheet = selectedRegion.specsheet.trim() !== '#';

  return (
    <div className="min-h-screen animate-in fade-in bg-[#f9fbf9] pb-20 duration-700">
      <div className="relative mb-12 overflow-hidden border-b border-gray-100 bg-white py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(#006838 1px, transparent 1px), linear-gradient(90deg, #006838 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-4">
            <div className="rounded-xl bg-foodmax-forest p-2.5 text-white shadow-lg shadow-foodmax-forest/20">
              <Zap size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foodmax-forest">{copy.badge}</span>
          </div>
          <h1 className="mb-4 text-4xl font-black leading-none tracking-tighter text-gray-900 md:text-6xl">
            {copy.titleStart} <span className="text-foodmax-forest">{copy.titleAccent}</span>
          </h1>
          <p className="max-w-3xl text-lg font-medium leading-relaxed text-gray-500">{copy.subtitle}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          <div className="group relative overflow-hidden rounded-[3.5rem] border border-gray-100 bg-white p-10 shadow-2xl lg:col-span-7">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{ backgroundImage: 'radial-gradient(#006838 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />

            <div className="relative z-10 mb-10 flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-foodmax-lime" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{copy.mapVersion}</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-foodmax-lime ring-4 ring-foodmax-lime/10" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{copy.activeHub}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full border-2 border-gray-300" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{copy.futureCluster}</span>
                </div>
              </div>
            </div>

            <div className="relative flex h-[750px] w-full items-center justify-center rounded-[2.5rem] border border-gray-50 bg-gradient-to-b from-[#fdfdfd] to-[#f7f9f7] p-12">
              <div className="relative h-full w-auto aspect-[1/2] scale-110 md:scale-100">
                <VietnamMapSVG />

                {FM_REGIONS.map((region) => {
                  const regionView = localizeRegion(region, locale);
                  return (
                    <div key={region.id} className="absolute z-20" style={{ left: `${region.x}%`, top: `${region.y}%` }}>
                      <button
                        type="button"
                        aria-label={regionView.name}
                        onClick={() => setSelectedRegion(region)}
                        onMouseEnter={() => setHoveredRegion(region)}
                        onMouseLeave={() => setHoveredRegion(null)}
                        className={`group/pin relative flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                          selectedRegion.id === region.id
                            ? 'scale-125 border-white bg-foodmax-lime shadow-[0_0_20px_rgba(140,198,63,0.6)]'
                            : 'border-foodmax-forest/20 bg-white shadow-lg hover:scale-110 hover:border-foodmax-lime'
                        }`}
                      >
                        <div
                          className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
                            selectedRegion.id === region.id
                              ? 'bg-foodmax-forest'
                              : 'bg-foodmax-forest/30 group-hover/pin:bg-foodmax-lime'
                          }`}
                        />

                        {selectedRegion.id === region.id && (
                          <span className="absolute inset-0 rounded-full bg-foodmax-lime opacity-30 animate-ping" />
                        )}
                      </button>

                      {(hoveredRegion?.id === region.id || selectedRegion.id === region.id) && (
                        <div className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-[calc(100%+16px)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="whitespace-nowrap rounded-2xl border border-white/10 bg-gray-900 px-5 py-3 shadow-2xl">
                            <div className="mb-1 flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-foodmax-lime" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-foodmax-lime">{copy.sourcingNode}</p>
                            </div>
                            <p className="text-sm font-black text-white">{regionView.name}</p>
                            <div className="absolute bottom-[-6px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-white/10 bg-gray-900" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="absolute bottom-8 left-10 flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foodmax-forest/40">{copy.geodata}</p>
                <p className="text-xs font-bold text-gray-400">{copy.geodataValue}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="flex h-full flex-col overflow-hidden rounded-[3.5rem] border border-gray-100 bg-white shadow-2xl">
              <div className="group relative h-72 overflow-hidden">
                <img
                  src={selectedRegion.image}
                  className="h-full w-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                  alt={displayedRegion.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/30 to-transparent" />
                <div className="absolute bottom-10 left-10">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.4em] text-foodmax-lime">
                    {copy.analyticalFocus}
                  </span>
                  <h3 className="text-3xl font-black tracking-tight text-white">{displayedRegion.name}</h3>
                  <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-white/75">{displayedRegion.short}</p>
                </div>
              </div>

              <div className="flex border-b border-gray-100 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`flex flex-1 items-center justify-center gap-3 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === 'profile' ? 'bg-white text-foodmax-forest' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <MapPin size={16} className={activeTab === 'profile' ? 'text-foodmax-lime' : ''} /> {copy.profileTab}
                </button>
                <div className="w-px bg-gray-200" />
                <button
                  type="button"
                  onClick={() => setActiveTab('stats')}
                  className={`flex flex-1 items-center justify-center gap-3 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === 'stats' ? 'bg-white text-foodmax-forest' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <TrendingUp size={16} className={activeTab === 'stats' ? 'text-foodmax-lime' : ''} /> {copy.statsTab}
                </button>
              </div>

              <div className="flex-grow bg-white p-12">
                {activeTab === 'profile' ? (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="mb-10 rounded-3xl border-l-4 border-foodmax-forest bg-gray-50 p-6">
                      <p className="text-sm font-medium italic leading-relaxed text-gray-500">"{displayedRegion.desc}"</p>
                    </div>

                    <div className="mb-12 space-y-6">
                      <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                        <Info size={14} className="text-foodmax-forest" /> {copy.clusterSpecs}
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        {Object.entries(displayedRegion.profile).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between border-b border-gray-50 pb-4 text-sm">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{key}</span>
                            <span className="text-right font-black text-gray-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-12">
                      <h4 className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                        <Calendar size={14} className="text-foodmax-forest" /> {copy.seasonalActivity}
                      </h4>
                      <div className="grid grid-cols-6 gap-3">
                        {copy.months.map((month, index) => {
                          const isActive = selectedRegion.seasonMonths.includes(index + 1);
                          return (
                            <div
                              key={`${month}-${index}`}
                              className={`rounded-2xl py-3 text-center text-[10px] font-black tracking-widest transition-all ${
                                isActive
                                  ? 'bg-foodmax-forest text-white shadow-xl shadow-foodmax-forest/20'
                                  : 'border border-gray-100 bg-gray-50 text-gray-300'
                              }`}
                            >
                              {month}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="mb-12">
                      <h4 className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                        <BarChart size={14} className="text-foodmax-forest" /> {copy.yieldHistory}
                      </h4>
                      <div className="flex h-56 items-end justify-between gap-5 px-6">
                        {selectedRegion.historicalYield.map((yieldPoint) => (
                          <div key={yieldPoint.year} className="group/bar flex flex-1 flex-col items-center">
                            <div className="relative flex h-full w-full items-end justify-center">
                              <div
                                className="relative w-full max-w-[44px] overflow-hidden rounded-2xl bg-gray-100 transition-all duration-500 group-hover/bar:bg-foodmax-lime"
                                style={{ height: `${(yieldPoint.volume / maxYield) * 100}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-foodmax-forest/10 to-transparent" />
                                <span className="absolute left-1/2 top-[-32px] -translate-x-1/2 whitespace-nowrap rounded bg-white px-2 py-1 text-[11px] font-black text-gray-900 opacity-0 shadow-sm transition-all duration-300 group-hover/bar:opacity-100">
                                  {yieldPoint.volume.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <span className="mt-5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                              {yieldPoint.year}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="relative mb-12 overflow-hidden rounded-[2.5rem] bg-gray-900 p-10 text-white shadow-2xl">
                      <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-foodmax-lime/20 blur-3xl" />
                      <div className="relative z-10">
                        <div className="mb-8 flex items-center justify-between">
                          <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-foodmax-lime">
                            <Activity size={14} /> {copy.supplyForecast}
                          </h4>
                          <span className="rounded-full border border-foodmax-lime/30 bg-foodmax-forest px-3 py-1 text-[9px] font-black uppercase tracking-widest text-foodmax-lime">
                            {copy.inProgress}
                          </span>
                        </div>

                        <div className="mb-6">
                          <div className="mb-3 flex justify-between text-[11px] font-black">
                            <span className="uppercase tracking-widest text-white/40">{copy.fulfillmentCapacity}</span>
                            <span className="text-foodmax-lime">
                              {Math.round((selectedRegion.projection.current / selectedRegion.projection.target) * 100)}%
                            </span>
                          </div>
                          <div className="h-4 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 p-1">
                            <div
                              className="h-full rounded-full bg-foodmax-lime shadow-[0_0_15px_rgba(140,198,63,0.5)] transition-all duration-1000"
                              style={{
                                width: `${(selectedRegion.projection.current / selectedRegion.projection.target) * 100}%`
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-10">
                          <div>
                            <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-white/30">{copy.targetVolume}</p>
                            <p className="text-2xl font-black">{selectedRegion.projection.target.toLocaleString()} MT</p>
                          </div>
                          <div>
                            <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-white/30">{copy.stockPurity}</p>
                            <p className="text-2xl font-black text-foodmax-lime">99.8%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Link
                    to={selectedRegion.contact}
                    className="active:scale-95 flex items-center justify-center gap-3 rounded-2xl bg-foodmax-forest py-5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-foodmax-forest/20 transition-all hover:bg-foodmax-lime hover:text-foodmax-forest"
                  >
                    <Mail size={16} /> {copy.requestQuote}
                  </Link>

                  {hasSpecsheet ? (
                    <a
                      href={selectedRegion.specsheet}
                      target="_blank"
                      rel="noreferrer"
                      className="active:scale-95 flex items-center justify-center gap-3 rounded-2xl border-2 border-foodmax-forest/10 bg-white py-5 text-xs font-black uppercase tracking-widest text-foodmax-forest transition-all hover:border-foodmax-forest hover:bg-gray-50"
                    >
                      <Download size={16} /> {copy.technicalDossier}
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex cursor-not-allowed items-center justify-center gap-3 rounded-2xl border-2 border-gray-200 bg-gray-50 py-5 text-xs font-black uppercase tracking-widest text-gray-400"
                    >
                      <Download size={16} /> {copy.technicalDossier}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[2.5rem] bg-foodmax-forest p-12 text-white shadow-2xl">
              <div className="absolute right-0 top-0 -mr-32 -mt-32 h-64 w-64 rounded-full bg-foodmax-lime/10 blur-3xl transition-colors duration-1000 group-hover:bg-foodmax-lime/20" />
              <div className="relative z-10">
                <h4 className="mb-4 text-2xl font-black tracking-tight">{copy.strategicSupport}</h4>
                <p className="mb-10 text-sm font-medium leading-relaxed text-white/60">{copy.strategicDesc}</p>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-foodmax-lime transition-all group-hover:gap-5"
                >
                  {copy.consultDesk} <Globe size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommercialTool;
