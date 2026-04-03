import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import AppShellLoader from '../components/AppShellLoader';
import { api } from '../lib/apiClient';
import {
  ArrowLeft,
  CheckCircle,
  Truck,
  FileText,
  Send,
  ArrowRight,
  MapPin,
  Sun,
  Droplets,
  ShieldCheck,
  Activity,
  Waves,
  Mountain,
  Zap,
  Coffee,
  Database
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useLocale } from '../context/LocaleContext';
import { getCategoryLabel, localizeProduct } from '../lib/contentLocalization';
import { appRoutes } from '../lib/routes';
import { preserveVietnamesePlaceNamesDeep } from '../lib/preserveVietnamesePlaceNames';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeProducts: products, isLoading } = useData();
  const product = products.find((p) => p.id === id);
  const { locale } = useLocale();
  const localizedProduct = useMemo(() => (product ? localizeProduct(product, locale) : null), [locale, product]);
  const copy = locale === 'zh'
    ? {
        loader: '正在加载产品详情...',
        notFound: '未找到产品',
        notFoundDesc: '您查找的产品不存在或已被移动。',
        backToProducts: '返回产品列表',
        backToList: '返回列表',
        qualitySpecs: '质量规格',
        tradeLogistics: '包装与贸易条款',
        packagingSection: '包装与装运',
        paymentSection: '付款与交付',
        noTradeLogistics: '具体物流与贸易条款将在正式报价中确认。',
        productPdf: '产品 PDF',
        productPdfDesc: '查看该产品的技术资料、规格文件或认证文件。',
        openProductPdf: '打开产品 PDF',
        related: '相关产品',
        relatedDescPrefix: '探索我们',
        relatedDescSuffix: '系列中的更多出口品种。',
        viewAllPrefix: '查看全部',
        viewAllSuffix: '品类',
        requestQuotation: '申请出口报价',
        yourName: '您的姓名',
        businessEmail: '商务邮箱',
        companyName: '公司名称',
        orderVolume: '订单量（吨）',
        messagePlaceholder: '请填写具体需求或问题...',
        inquirySubmitted: '询价提交成功',
        sending: '发送中...',
        sendInquiry: '发送给出口部门',
        responseTime: '标准回复时间：12-24 个工作小时',
        quotationUnavailable: '由于 CMS 后端未就绪，暂时无法提交报价请求。'
      }
    : {
        loader: 'Loading product details...',
        notFound: 'Product Not Found',
        notFoundDesc: 'The product you are looking for does not exist or has been moved.',
        backToProducts: 'Back to Products',
        backToList: 'Back to List',
        qualitySpecs: 'Quality Specs',
        tradeLogistics: 'Packaging & Trade Terms',
        packagingSection: 'Packaging & Loading',
        paymentSection: 'Payment & Delivery',
        noTradeLogistics: 'Final logistics and trade terms will be confirmed in the quotation.',
        productPdf: 'Product PDF',
        productPdfDesc: 'Access the technical datasheet, specifications, or certifications for this product.',
        openProductPdf: 'Open Product PDF',
        related: 'Related Commodities',
        relatedDescPrefix: 'Explore additional export varieties within our',
        relatedDescSuffix: 'portfolio.',
        viewAllPrefix: 'View All',
        viewAllSuffix: 'Varieties',
        requestQuotation: 'Request Export Quotation',
        yourName: 'Your Name',
        businessEmail: 'Business Email',
        companyName: 'Company Name',
        orderVolume: 'Order Volume (MT)',
        messagePlaceholder: 'Specific requirements or questions...',
        inquirySubmitted: 'Inquiry Submitted Successfully',
        sending: 'SENDING...',
        sendInquiry: 'Send Inquiry to Export Dept',
        responseTime: 'Standard Response Time: 12-24 Business Hours',
        quotationUnavailable: 'Quotation requests are temporarily unavailable because the CMS backend is not ready.'
      };

  // form states (NEW)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [orderVolume, setOrderVolume] = useState('');
  const [message, setMessage] = useState('');

  const [inquirySent, setInquirySent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const packagingEntries = useMemo(
    () =>
      Object.entries(localizedProduct?.packaging || product?.packaging || {}).filter(
        ([key, value]) => key.trim() && String(value || '').trim()
      ),
    [localizedProduct, product]
  );

  const paymentEntries = useMemo(
    () =>
      Object.entries(localizedProduct?.payment || product?.payment || {}).filter(
        ([key, value]) => key.trim() && String(value || '').trim()
      ),
    [localizedProduct, product]
  );

  // Animation States
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const regionSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!regionSectionRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsSectionVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(regionSectionRef.current);
    return () => observer.disconnect();
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product, products]);

  if (isLoading && products.length === 0) {
    return <AppShellLoader compact label={copy.loader} />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-4xl font-black text-gray-900 mb-4">{copy.notFound}</h2>
        <p className="text-gray-600 mb-8">{copy.notFoundDesc}</p>
        <Link to={appRoutes.products} className="px-8 py-3 bg-foodmax-forest text-white rounded-lg font-bold">
          {copy.backToProducts}
        </Link>
      </div>
    );
  }

  const isCashew = product.category === 'Cashew' || product.subCategory.toLowerCase().includes('cashew') || product.id.includes('cashew');
  const isRice = product.category === 'Rice';
  const isCoffee = product.category === 'Coffee';
  const hasProductPdf = Boolean(product.pdfUrl?.trim());

  // Submit quotation requests through the app backend.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product?.id) return;

    setSubmitError(null);
    setSending(true);

    try {
      await api.submitQuotationRequest({
        productId: product.id,
        fullName: fullName.trim(),
        email: email.trim(),
        companyName: companyName.trim() || undefined,
        orderVolume: orderVolume.trim() || undefined,
        message: message.trim()
      });

      setInquirySent(true);

      // clear inputs
      setFullName('');
      setEmail('');
      setCompanyName('');
      setOrderVolume('');
      setMessage('');

      setTimeout(() => setInquirySent(false), 5000);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : locale === 'zh' ? '提交询价失败' : 'Failed to submit inquiry'
      );
    } finally {
      setSending(false);
    }
  };

  const originData = useMemo(() => {
    if (isCashew) {
      return locale === 'zh'
        ? {
            title: '腰果 产区分布',
            desc: '越南腰果出口优势主要来自南部重点产区，红色玄武岩土壤让果仁具备更高油脂含量与更佳口感。',
            image: 'https://images.unsplash.com/photo-1621351183012-e2f0c9d2cf03?auto=format&fit=crop&q=80&w=1200',
            regions: [
              { name: '平福集群', desc: '被称为“腰果之都”，高养分土壤带来更优的油脂含量与酥脆度。', tag: '核心产区' },
              { name: '得乐高地', desc: '高海拔种植环境有利于形成更紧实的高等级果仁。', tag: '增量供应' }
            ],
            stats: [
              { icon: Sun, label: '气候', val: '2,500+ 小时日照' },
              { icon: Droplets, label: '土壤类型', val: '红色玄武岩' }
            ],
            usefulInfo: {
              title: '分级尺寸标准',
              desc: 'Foodmax 腰果分级遵循 AFI 标准，并通过激光分选确保 WW180 到 WW320 的等级与颜色一致性。',
              points: ['激光颜色校准', '水分 < 5%', '零异物控制']
            },
            protocol: {
              title: '蒸汽软化工艺',
              icon: Zap,
              desc: '采用低温蒸汽软化，便于剥壳，同时尽可能保留果仁天然油脂和脆感。'
            }
          }
        : {
            title: 'Cashew Growing Regions',
            desc: "Vietnam's dominance in cashew exports is anchored in specific southern provinces where red basalt soil creates nutrient-dense kernels.",
            image: 'https://images.unsplash.com/photo-1621351183012-e2f0c9d2cf03?auto=format&fit=crop&q=80&w=1200',
            regions: [
              { name: 'Binh Phuoc Cluster', desc: "The 'Cashew Capital'. Rich basalt soil results in higher oil content and superior crunch.", tag: 'Primary Origin' },
              { name: 'Dak Lak Highlands', desc: 'Altitude cultivation producing exceptionally firm kernels for premium grades.', tag: 'Emerging Supply' }
            ],
            stats: [
              { icon: Sun, label: 'Climate', val: '2,500+ Hours Sun' },
              { icon: Droplets, label: 'Soil Type', val: 'Red Basalt' }
            ],
            usefulInfo: {
              title: 'Technical Sizing Standards',
              desc: 'Our Cashew grading follows the AFI (Association of Food Industries) standards, utilizing computerized laser sorting to ensure uniform WW180 to WW320 color profiles.',
              points: ['Laser Color Calibration', 'Moisture < 5% Control', 'Zero Foreign Matter']
            },
            protocol: {
              title: 'Steam Softening Protocol',
              icon: Zap,
              desc: "We utilize low-temperature steam softening to ensure easy shelling without damaging the kernel's natural oils and crispness."
            }
          };
    }
    if (isRice) {
      return locale === 'zh'
        ? {
            title: '越南 水稻核心产区',
            desc: '越南水稻生产以湄公河三角洲为核心，这一独特农业生态系统支持全年稳定采收。',
            image: 'https://images.unsplash.com/photo-1592910129881-892bbe239cc0?auto=format&fit=crop&q=80&w=1200',
            regions: [
              { name: '湄公河三角洲', desc: '贡献越南约 90% 的大米出口量，冲积土与河网系统支持一年三熟。', tag: '出口核心' },
              { name: '朔庄与薄辽', desc: '沿海区域专注于 ST24、ST25 等高端香米品种。', tag: '香米中心' }
            ],
            stats: [
              { icon: Waves, label: '水文', val: '湄公河水网' },
              { icon: Droplets, label: '土壤', val: '肥沃冲积土' }
            ],
            usefulInfo: {
              title: '湄公河物流协同',
              desc: 'Foodmax 将内河驳船运输与港口物流衔接，使 1,000 吨级批次可从加工厂直接进入国际集装箱港口。',
              points: ['河港直连', '实时批次追踪', 'FOB/CIF 透明']
            },
            protocol: {
              title: '分段控温干燥工艺',
              icon: Droplets,
              desc: '每一批谷粒都经过多阶段受控干燥，确保长途海运前水分稳定不高于 14.0%。'
            }
          }
        : {
            title: "Vietnam's Rice Heartland",
            desc: "Vietnam's rice production is centered in the Mekong Delta, a unique agricultural ecosystem providing year-round harvest stability.",
            image: 'https://images.unsplash.com/photo-1592910129881-892bbe239cc0?auto=format&fit=crop&q=80&w=1200',
            regions: [
              { name: 'Mekong Delta Bowl', desc: "The source of 90% of Vietnam's rice exports. Alluvial soil and river systems enable 3 crops per year.", tag: 'Export Core' },
              { name: 'Soc Trang & Bac Lieu', desc: 'Coastal zones specialized in premium fragrant varieties like ST24 and ST25.', tag: 'Fragrant Hub' }
            ],
            stats: [
              { icon: Waves, label: 'Hydrology', val: 'Mekong Network' },
              { icon: Droplets, label: 'Soil', val: 'Rich Alluvium' }
            ],
            usefulInfo: {
              title: 'Mekong Logistics Sync',
              desc: 'Foodmax integrates with river barge logistics, allowing 1,000MT lots to move directly from processing plants to international container ports with zero land-transit friction.',
              points: ['Direct River-to-Port', 'Real-time Batch Tracking', 'FOB/CIF Transparency']
            },
            protocol: {
              title: 'Hydro-Drying Protocol',
              icon: Droplets,
              desc: 'Every grain is dried through a controlled multi-stage thermal cycle to ensure moisture levels never exceed 14.0% for long-haul shipping.'
            }
          };
    }
    if (isCoffee) {
      return locale === 'zh'
        ? {
            title: '咖啡 种植带',
            desc: '越南是全球罗布斯塔强国。我们的采购策略同时覆盖高产量罗布斯塔与高海拔精品阿拉比卡。',
            image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1200',
            regions: [
              { name: '得乐高原', desc: '全球知名罗布斯塔核心区，火山土壤与季节节律形成深层可可调性。', tag: '罗布斯塔基地' },
              { name: '林同高地', desc: '拥有 Cau Dat 产区，是越南代表性的高海拔阿拉比卡来源地。', tag: '精品产区' }
            ],
            stats: [
              { icon: Mountain, label: '海拔', val: '500m - 1,600m' },
              { icon: Activity, label: '土壤', val: '火山 / 玄武岩' }
            ],
            usefulInfo: {
              title: '密度与筛网规格',
              desc: 'Foodmax 通过重力分选确保 S16 与 S18 批次豆密度更高，从而提升烘焙受热均匀性与成色一致性。',
              points: ['重力分选', 'SCA 杯测校准', '精品缺陷率 < 1%']
            },
            protocol: {
              title: '发酵控制',
              icon: Coffee,
              desc: '水洗批次经过 24-36 小时控温发酵，以提升柑橘酸质与杯感清晰度。'
            }
          }
        : {
            title: 'Coffee Cultivation Belts',
            desc: "Vietnam is the world's Robusta powerhouse. Our sourcing strategy covers both high-volume Robusta and specialty high-altitude Arabica.",
            image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1200',
            regions: [
              { name: 'Dak Lak Plateau', desc: "The world's Robusta capital. Volcanic soil and specific seasons create deep cocoa profiles.", tag: 'Robusta Base' },
              { name: 'Lam Dong Highlands', desc: "Home to Cau Dat, Vietnam's premier Arabica origin with elevations exceeding 1,500m.", tag: 'Specialty Zone' }
            ],
            stats: [
              { icon: Mountain, label: 'Altitude', val: '500m - 1,600m' },
              { icon: Activity, label: 'Soil', val: 'Volcanic/Basalt' }
            ],
            usefulInfo: {
              title: 'Density & Screen Sizing',
              desc: 'Foodmax employs gravity separation tables to ensure S16 and S18 lots have high bean density, resulting in superior roaster heat transfer and uniform color.',
              points: ['Gravity Separation', 'SCA Cupping Calibration', 'Defect < 1% Specialty']
            },
            protocol: {
              title: 'Fermentation Control',
              icon: Coffee,
              desc: 'Our washed lots undergo 24-36 hour controlled fermentation in temperature-monitored tanks to maximize citric acidity and clarity.'
            }
          };
    }
    return null;
  }, [isCashew, isCoffee, isRice, locale]);
  const displayOriginData = useMemo(
    () => (locale === 'zh' && originData ? preserveVietnamesePlaceNamesDeep(originData) : originData),
    [locale, originData]
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50 border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-foodmax-forest transition-colors"
          >
            <ArrowLeft size={16} /> {copy.backToList}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <div className="aspect-[4/3] rounded-[2rem] overflow-hidden border border-gray-100 shadow-2xl">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex flex-col animate-in fade-in slide-in-from-right duration-700">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-foodmax-forest text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg shadow-sm">
                {getCategoryLabel(product.category, locale)}
              </span>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{localizedProduct?.subCategory || product.subCategory}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-8 leading-tight tracking-tighter">{localizedProduct?.name || product.name}</h1>
            <p className="text-xl text-gray-500 mb-12 leading-relaxed font-medium">{localizedProduct?.description || product.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-auto">
              <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-900 mb-6 flex items-center gap-2">
                  <FileText size={16} className="text-foodmax-forest" /> {copy.qualitySpecs}
                </h3>
                <ul className="space-y-4">
                  {Object.entries(localizedProduct?.specifications || product.specifications).map(([key, val]) => (
                    <li key={key} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                      <span className="text-gray-400 font-bold">{key}</span>
                      <span className="font-black text-gray-900">{val as any}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-900 mb-6 flex items-center gap-2">
                  <Truck size={16} className="text-foodmax-forest" /> {copy.tradeLogistics}
                </h3>
                <div className="space-y-6">
                  {packagingEntries.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.28em] text-foodmax-forest mb-3">
                        {copy.packagingSection}
                      </h4>
                      <ul className="space-y-3 text-xs text-gray-600">
                        {packagingEntries.map(([key, value]) => (
                          <li key={key} className="flex items-start gap-3 border-b border-gray-100 pb-3">
                            <CheckCircle size={14} className="text-foodmax-lime mt-0.5 shrink-0" />
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">{key}</p>
                              <p className="font-bold leading-relaxed text-gray-700">{value as string}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {paymentEntries.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.28em] text-foodmax-forest mb-3">
                        {copy.paymentSection}
                      </h4>
                      <ul className="space-y-3 text-xs text-gray-600">
                        {paymentEntries.map(([key, value]) => (
                          <li key={key} className="flex items-start gap-3 border-b border-gray-100 pb-3">
                            <CheckCircle size={14} className="text-foodmax-lime mt-0.5 shrink-0" />
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">{key}</p>
                              <p className="font-bold leading-relaxed text-gray-700">{value as string}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {packagingEntries.length === 0 && paymentEntries.length === 0 && (
                    <p className="text-sm text-gray-500 leading-relaxed">{copy.noTradeLogistics}</p>
                  )}
                </div>
              </div>
              {hasProductPdf && (
                <div className="md:col-span-2 bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                  <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-900 mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-foodmax-forest" /> {copy.productPdf}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium mb-6">
                    {copy.productPdfDesc}
                  </p>
                  <a
                    href={product.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-foodmax-forest text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-foodmax-lime hover:text-foodmax-forest transition-all"
                  >
                    {copy.openProductPdf} <ArrowRight size={16} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {displayOriginData && (
        <section
          ref={regionSectionRef}
          className="bg-gray-50 py-24 lg:py-32 border-t border-b border-gray-100 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-1/3 h-full bg-foodmax-forest/5 -z-0 skew-x-12 transform origin-top-right"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div
                className={`transition-all duration-1000 transform ${
                  isSectionVisible ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'
                }`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-foodmax-forest text-white rounded-lg shadow-lg">
                    <MapPin size={20} />
                  </div>
                  <h2 className="text-[10px] font-black text-foodmax-forest uppercase tracking-[0.4em]">
                    {locale === 'zh' ? '原产地情报' : 'Origin Intelligence'}
                  </h2>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 tracking-tighter">
                  {displayOriginData.title.split(' ')[0]}{' '}
                  <span className="text-foodmax-forest">
                    {displayOriginData.title.split(' ').slice(1).join(' ')}
                  </span>
                </h2>
                <p className="text-lg text-gray-500 mb-10 leading-relaxed font-medium">{displayOriginData.desc}</p>

                <div className="space-y-6">
                  {displayOriginData.regions.map((r, i) => (
                    <div
                      key={i}
                      style={{ transitionDelay: `${i * 200}ms` }}
                      className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-foodmax-lime/30 transition-all group transform ${
                        isSectionVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-black text-gray-900 group-hover:text-foodmax-forest transition-colors">
                          {r.name}
                        </h4>
                        <span className="text-[8px] font-black text-foodmax-forest bg-foodmax-forest/5 px-2 py-1 rounded uppercase tracking-widest">
                          {r.tag}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed font-medium">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`grid grid-cols-1 gap-6 transition-all duration-1000 transform ${
                  isSectionVisible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'
                }`}
              >
                <div className="bg-white p-10 rounded-[3rem] text-gray-900 shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 border border-gray-100">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-foodmax-forest/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                  <h4 className="text-2xl font-black mb-4 flex items-center gap-3">
                    <Database size={24} className="text-foodmax-forest" /> {displayOriginData.usefulInfo.title}
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">{displayOriginData.usefulInfo.desc}</p>

                  <div className="space-y-3">
                    {displayOriginData.usefulInfo.points.map((pt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle size={16} className="text-foodmax-lime" />
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative aspect-video rounded-[3rem] overflow-hidden shadow-2xl group border-4 border-white flex items-center justify-center bg-foodmax-forest">
                  <div className="absolute inset-0 bg-gradient-to-br from-foodmax-forest via-foodmax-forest to-[#004d2a]"></div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-foodmax-lime/10 rounded-full -mr-32 -mt-32 blur-[80px]"></div>

                  <div className="relative z-10 p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform">
                      <displayOriginData.protocol.icon size={32} className="text-foodmax-lime" />
                    </div>
                    <h5 className="text-white text-2xl font-black tracking-tight mb-3">{displayOriginData.protocol.title}</h5>
                    <p className="text-white/70 text-sm font-medium max-w-sm leading-relaxed">{displayOriginData.protocol.desc}</p>
                    <div className="mt-8 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-foodmax-lime" />
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                        {locale === 'zh' ? '已验证出口工艺' : 'Verified Export Protocol'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section className="bg-white py-24 lg:py-32 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-none">{copy.related}</h2>
                <p className="text-lg text-gray-500 font-medium mt-4">
                  {copy.relatedDescPrefix} {getCategoryLabel(product.category, locale)} {copy.relatedDescSuffix}
                </p>
              </div>
              <Link
                to={appRoutes.productsByCategory(product.category)}
                className="inline-flex items-center gap-3 text-xs font-black text-foodmax-forest uppercase tracking-[0.2em] group border-b-2 border-transparent hover:border-foodmax-lime transition-all pb-1"
              >
                {copy.viewAllPrefix} {getCategoryLabel(product.category, locale)} {copy.viewAllSuffix} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white py-24 lg:py-32 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white border-2 border-foodmax-forest p-10 md:p-16 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gray-50 rounded-full -mr-20 -mt-20 group-hover:bg-foodmax-forest/5 transition-colors duration-700"></div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-10 tracking-tight">{copy.requestQuotation}</h2>

              {/* NEW: error display */}
              {submitError && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={copy.yourName}
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-foodmax-forest outline-none text-sm font-medium placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <input
                      type="email"
                      placeholder={copy.businessEmail}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-foodmax-forest outline-none text-sm font-medium placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={copy.companyName}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-foodmax-forest outline-none text-sm font-medium placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={copy.orderVolume}
                      value={orderVolume}
                      onChange={(e) => setOrderVolume(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-foodmax-forest outline-none text-sm font-medium placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={5}
                    placeholder={copy.messagePlaceholder}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-foodmax-forest outline-none text-sm font-medium placeholder:text-gray-400 resize-none"
                  ></textarea>
                </div>

                <button
                  disabled={sending || inquirySent}
                  className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${
                    inquirySent
                      ? 'bg-green-500 text-white'
                      : 'bg-foodmax-forest text-white hover:bg-foodmax-forest/90 active:scale-[0.98]'
                  } ${sending ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                  {inquirySent ? (
                    <>
                      <CheckCircle size={20} /> {copy.inquirySubmitted}
                    </>
                  ) : (
                    <>
                      <Send size={18} /> {sending ? copy.sending : copy.sendInquiry}
                    </>
                  )}
                </button>

                <p className="text-[10px] text-gray-400 text-center uppercase tracking-[0.3em] font-black mt-8">
                  {copy.responseTime}
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetail;
