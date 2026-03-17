import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  Package,
  Scale,
  FileText,
  CheckCircle,
  Globe,
  Zap,
  BadgeCheck,
  Anchor
} from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { appRoutes } from '../lib/routes';
import { preserveVietnamesePlaceNamesDeep } from '../lib/preserveVietnamesePlaceNames';

const Operations: React.FC = () => {
  const { hash } = useLocation();
  const { locale } = useLocale();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [hash]);

  const rawCopy =
    locale === 'zh'
      ? {
          heroTitle: '运营与合规',
          heroAccent: '合规',
          heroDesc: 'Foodmax 国际出口业务所遵循的技术标准与贸易执行框架。我们在原产地到目的港之间维持严格、透明、可验证的运营体系。',
          qualityLabel: '章节 01 / 质量标准',
          qualityTitle: '纯净标准的系统化架构',
          qualityDesc:
            '在 Foodmax，质量不是单次检查，而是一套完整系统。从水分、杂质到感官表现，我们通过多阶段验证流程确保每一批次都满足国际食品安全与专业采购标准。',
          qualityItems: [
            {
              title: 'ISO 22000 与 HACCP',
              desc: '全球食品安全标准已整合进我们的加工工厂与仓储流程。'
            },
            {
              title: 'SGS / Vinacontrol 联动',
              desc: '可按需提供第三方独立检测，覆盖每一个出口货柜。'
            },
            {
              title: '感官校准',
              desc: '内部品控团队与技术人员持续校准批次一致性。'
            },
            {
              title: '植物检疫严控',
              desc: '为长距离航运建立严格的虫害与污染物控制机制。'
            }
          ],
          batchTitle: '批次主权追踪',
          batchDesc: '每一批货物都会分配唯一 Foodmax Tracking ID，支持从农场集群到最终包装线的完整追溯。',
          admixture: '混杂容忍度',
          verifiedBatches: '实验室验证批次',
          logisticsLabel: '章节 02 / 全球物流',
          logisticsTitle: '动态供应链管理',
          logisticsCards: [
            {
              title: '战略港口节点',
              desc: '连接胡志明市 Cat Lai、头顿 Cai Mep 与海防港，缩短内陆运输时间并提升装船效率。'
            },
            {
              title: '多承运人网络',
              desc: '与主要航运公司签订服务协议，即使在旺季也能争取更稳定的舱位配置。'
            },
            {
              title: '单证流效率',
              desc: '熟练处理提单、原产地证书及清关文件，降低滞港与文件差错风险。'
            }
          ],
          packagingLabel: '章节 03 / 包装规格',
          packagingTitle: '为运输环境而设计的保护',
          packagingDesc:
            '我们的包装方案用于抵御湿度、氧化与运输冲击，覆盖工业级散装到精品零售包装的不同场景。',
          packagingAlt: '包装',
          exportBulk: '出口散装',
          retailSpecialty: '零售与精品',
          exportBulkItems: ['25kg / 50kg PP 编织袋', '1MT 吨袋', '60kg 黄麻袋（咖啡）'],
          retailItems: ['真空包装', '多层牛皮纸袋', '自有品牌 / 白牌定制'],
          termsLabel: '章节 04 / 贸易条款',
          termsTitle: '商业严谨与信任机制',
          termsDesc:
            '我们采用透明的商业执行框架，以降低国际买家的交易风险。所有合同均以 Incoterms 2020 和国际认可的结算工具为基础。',
          incotermsTitle: 'Incoterms 2020 支持',
          incotermsDesc: '主要报价通常基于 FOB 或 CIF 条款，以确保风险转移边界清晰。',
          settlementTitle: '结算工具',
          instrumentOne: '工具 01',
          instrumentTwo: '工具 02',
          currency: '币种',
          ctaTitle: '需要正式技术档案吗？',
          ctaDesc: '联系我们获取更完整的技术资料，包括加工能力、检验流程与物流时效说明。',
          requestPdf: '申请技术 PDF',
          emailDesk: '发送邮件给贸易团队'
        }
      : {
          heroTitle: 'Operational',
          heroAccent: 'Compliance',
          heroDesc:
            'Technical standards and trade frameworks governing Foodmax international export activity. We maintain a rigorous, transparent, and verifiable operating model from origin to destination.',
          qualityLabel: 'Section 01 / Quality Standards',
          qualityTitle: 'The Architecture of Purity',
          qualityDesc:
            'At Foodmax, quality is not a single inspection. It is a system. From moisture and admixture to sensory profile, our multi-stage verification process keeps every lot aligned with international food safety and procurement standards.',
          qualityItems: [
            {
              title: 'ISO 22000 & HACCP',
              desc: 'Global standards integrated into every processing plant and warehouse.'
            },
            {
              title: 'SGS / Vinacontrol Alignment',
              desc: 'Optional third-party analysis available for each export container.'
            },
            {
              title: 'Sensory Calibration',
              desc: 'In-house technical teams calibrate batches for consistency.'
            },
            {
              title: 'Phytosanitary Rigor',
              desc: 'Strict pest and contaminant control protocols for long-haul shipping.'
            }
          ],
          batchTitle: 'Batch Sovereignty',
          batchDesc:
            'Every lot is assigned a unique Foodmax Tracking ID, enabling full upstream visibility from farm cluster to final packing line.',
          admixture: 'Admixture Tolerance',
          verifiedBatches: 'Lab-Verified Batches',
          logisticsLabel: 'Section 02 / Global Logistics',
          logisticsTitle: 'Kinetic Supply Chain Management',
          logisticsCards: [
            {
              title: 'Strategic Port Hubs',
              desc: 'Direct access to Cat Lai, Cai Mep, and Hai Phong helps reduce domestic transit time and speed vessel loading.'
            },
            {
              title: 'Multi-Carrier Network',
              desc: 'Carrier agreements support more reliable space allocation, even during peak demand.'
            },
            {
              title: 'Doc-Flow Efficiency',
              desc: 'Experienced handling of bills of lading, COO forms, and customs documents reduces demurrage risk.'
            }
          ],
          packagingLabel: 'Section 03 / Packaging Specs',
          packagingTitle: 'Atmospheric Protection',
          packagingDesc:
            'Our packaging solutions protect product integrity against humidity, oxidation, and transit stress across both bulk and specialty formats.',
          packagingAlt: 'Packaging',
          exportBulk: 'Export Bulk',
          retailSpecialty: 'Retail & Specialty',
          exportBulkItems: ['25kg / 50kg PP Bags', '1MT Jumbo Bags', '60kg Jute (Coffee)'],
          retailItems: ['Vacuum Sealing', 'Multi-Wall Kraft', 'Private Label Branding'],
          termsLabel: 'Section 04 / Terms of Trade',
          termsTitle: 'Commercial Rigor & Trust',
          termsDesc:
            'We operate under a transparent commercial framework designed to reduce risk for international buyers. Contracts are anchored in Incoterms 2020 and globally accepted settlement instruments.',
          incotermsTitle: 'Incoterms 2020 Support',
          incotermsDesc: 'Primary pricing is typically structured on FOB or CIF terms to keep risk transfer clear.',
          settlementTitle: 'Settlement Instruments',
          instrumentOne: 'Instrument 01',
          instrumentTwo: 'Instrument 02',
          currency: 'Currency',
          ctaTitle: 'Need a formal technical dossier?',
          ctaDesc: 'Reach out for a fuller technical pack covering processing capacity, inspection flows, and logistics lead times.',
          requestPdf: 'Request Technical PDF',
          emailDesk: 'Email Trade Desk'
        };
  const copy = locale === 'zh' ? preserveVietnamesePlaceNamesDeep(rawCopy) : rawCopy;

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-700">
      <section className="bg-gray-50 pt-32 pb-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tighter leading-none">
              {copy.heroTitle} <span className="text-foodmax-forest">{copy.heroAccent}</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium leading-relaxed">{copy.heroDesc}</p>
          </div>
        </div>
      </section>

      <section id="quality" className="scroll-mt-40 py-24 border-b border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-foodmax-forest text-white rounded-lg">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-[10px] font-black text-foodmax-forest uppercase tracking-[0.4em]">{copy.qualityLabel}</h2>
              </div>
              <h3 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">{copy.qualityTitle}</h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed font-medium">{copy.qualityDesc}</p>

              <div className="space-y-4">
                {copy.qualityItems.map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-4 p-4 rounded-2xl border border-gray-100 hover:border-foodmax-lime/30 bg-white transition-all shadow-sm"
                  >
                    <BadgeCheck size={20} className="text-foodmax-lime flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-black text-gray-900 text-sm uppercase tracking-wider">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-900 rounded-[3rem] p-12 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-foodmax-forest/20 rounded-full -mr-32 -mt-32 blur-3xl" />
              <h4 className="text-xl font-black mb-6 flex items-center gap-2">
                <Zap size={20} className="text-foodmax-lime" /> {copy.batchTitle}
              </h4>
              <p className="text-white/70 mb-8 leading-relaxed font-medium">{copy.batchDesc}</p>
              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10">
                <div>
                  <p className="text-3xl font-black text-foodmax-lime">0.01%</p>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{copy.admixture}</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-foodmax-lime">100%</p>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{copy.verifiedBatches}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="logistics" className="scroll-mt-40 py-24 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-2 bg-foodmax-forest text-white rounded-lg">
                <Truck size={20} />
              </div>
              <h2 className="text-[10px] font-black text-foodmax-forest uppercase tracking-[0.4em]">{copy.logisticsLabel}</h2>
            </div>
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{copy.logisticsTitle}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[Anchor, Globe, FileText].map((Icon, index) => (
              <div key={copy.logisticsCards[index].title} className="bg-white p-10 rounded-3xl shadow-sm border border-gray-200">
                <Icon size={32} className="text-foodmax-forest mb-6" />
                <h4 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tighter">
                  {copy.logisticsCards[index].title}
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{copy.logisticsCards[index].desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="packaging" className="scroll-mt-40 py-24 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200"
                className="rounded-[3rem] shadow-2xl grayscale hover:grayscale-0 transition-all duration-1000"
                alt={copy.packagingAlt}
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-foodmax-forest text-white rounded-lg">
                  <Package size={20} />
                </div>
                <h2 className="text-[10px] font-black text-foodmax-forest uppercase tracking-[0.4em]">{copy.packagingLabel}</h2>
              </div>
              <h3 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">{copy.packagingTitle}</h3>
              <p className="text-lg text-gray-600 mb-10 leading-relaxed font-medium">{copy.packagingDesc}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{copy.exportBulk}</h5>
                  <ul className="space-y-2 text-sm text-gray-900 font-bold">
                    {copy.exportBulkItems.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-foodmax-lime" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    {copy.retailSpecialty}
                  </h5>
                  <ul className="space-y-2 text-sm text-gray-900 font-bold">
                    {copy.retailItems.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-foodmax-lime" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="terms" className="scroll-mt-40 py-24 bg-gray-900 text-white overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#8cc63f 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-foodmax-lime text-foodmax-forest rounded-lg">
                <Scale size={20} />
              </div>
              <h2 className="text-[10px] font-black text-foodmax-lime uppercase tracking-[0.4em]">{copy.termsLabel}</h2>
            </div>
            <h3 className="text-4xl md:text-5xl font-black mb-10 tracking-tight">{copy.termsTitle}</h3>
            <p className="text-xl text-white/60 mb-12 leading-relaxed font-medium">{copy.termsDesc}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-white/10 pt-10">
              <div className="space-y-6">
                <h5 className="text-xs font-black text-foodmax-lime uppercase tracking-widest">{copy.incotermsTitle}</h5>
                <div className="flex flex-wrap gap-3">
                  {['FOB', 'CIF', 'CFR', 'DDP'].map((term) => (
                    <span
                      key={term}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-black"
                    >
                      {term}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-white/40 leading-relaxed">{copy.incotermsDesc}</p>
              </div>
              <div className="space-y-6">
                <h5 className="text-xs font-black text-foodmax-lime uppercase tracking-widest">{copy.settlementTitle}</h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-white/40 uppercase text-[10px] tracking-widest">{copy.instrumentOne}</span>
                    <span className="font-black">L/C at Sight (Irrevocable)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-white/40 uppercase text-[10px] tracking-widest">{copy.instrumentTwo}</span>
                    <span className="font-black">T/T (30% Advance / 70% B/L)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-white/40 uppercase text-[10px] tracking-widest">{copy.currency}</span>
                    <span className="font-black">USD / EUR / VND</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h4 className="text-2xl font-black text-gray-900 mb-6">{copy.ctaTitle}</h4>
          <p className="text-gray-500 mb-10 font-medium">{copy.ctaDesc}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to={appRoutes.contact} className="px-10 py-4 bg-foodmax-forest text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-foodmax-lime hover:text-foodmax-forest transition-all shadow-xl">
              {copy.requestPdf}
            </Link>
            <a
              href="mailto:export@foodmax.vn"
              className="px-10 py-4 border-2 border-foodmax-forest text-foodmax-forest rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
            >
              {copy.emailDesk}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Operations;
