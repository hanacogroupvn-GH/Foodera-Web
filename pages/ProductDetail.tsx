import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabaseClient';
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

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products } = useData();
  const product = products.find((p) => p.id === id);

  // form states (NEW)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [orderVolume, setOrderVolume] = useState('');
  const [message, setMessage] = useState('');

  const [inquirySent, setInquirySent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-4xl font-black text-gray-900 mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-8">The product you are looking for does not exist or has been moved.</p>
        <Link to="/products" className="px-8 py-3 bg-foodmax-forest text-white rounded-lg font-bold">
          Back to Products
        </Link>
      </div>
    );
  }

  const isCashew = product.subCategory.toLowerCase().includes('cashew') || product.id.includes('cashew');
  const isRice = product.category === 'Rice';
  const isCoffee = product.category === 'Coffee';

  // ✅ SUBMIT TO SUPABASE (NEW)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product?.id) return;

    setSubmitError(null);
    setSending(true);

    try {
      const { error } = await supabase.from('quotation_requests').insert({
        product_id: product.id,
        full_name: fullName.trim(),
        email: email.trim(),
        company_name: companyName.trim() || 'N/A',
        order_volume: orderVolume.trim() || null,
        message: message.trim()
      });

      if (error) throw error;

      setInquirySent(true);

      // clear inputs
      setFullName('');
      setEmail('');
      setCompanyName('');
      setOrderVolume('');
      setMessage('');

      setTimeout(() => setInquirySent(false), 5000);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit inquiry');
    } finally {
      setSending(false);
    }
  };

  const galleryImages = product.gallery && product.gallery.length > 0
    ? product.gallery
    : isRice
    ? [
        "https://images.unsplash.com/photo-1536304953491-a1312952467d?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=600"
      ]
    : isCoffee
    ? [
        "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?auto=format&fit=crop&q=80&w=600"
      ]
    : [
        "https://images.unsplash.com/photo-1590004953392-5aba2e0859c7?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1606755962773-d32330513252?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1606755456206-b25206cde27e?auto=format&fit=crop&q=80&w=600"
      ];

  const originData = useMemo(() => {
    if (isCashew) {
      return {
        title: "Cashew Growing Regions",
        desc: "Vietnam's dominance in cashew exports is anchored in specific southern provinces where red basalt soil creates nutrient-dense kernels.",
        image: "https://images.unsplash.com/photo-1621351183012-e2f0c9d2cf03?auto=format&fit=crop&q=80&w=1200",
        regions: [
          { name: "Binh Phuoc Cluster", desc: "The 'Cashew Capital'. Rich basalt soil results in higher oil content and superior crunch.", tag: "Primary Origin" },
          { name: "Dak Lak Highlands", desc: "Altitude cultivation producing exceptionally firm kernels for premium grades.", tag: "Emerging Supply" }
        ],
        stats: [
          { icon: Sun, label: "Climate", val: "2,500+ Hours Sun" },
          { icon: Droplets, label: "Soil Type", val: "Red Basalt" }
        ],
        usefulInfo: {
          title: "Technical Sizing Standards",
          desc: "Our Cashew grading follows the AFI (Association of Food Industries) standards, utilizing computerized laser sorting to ensure uniform WW180 to WW320 color profiles.",
          points: ["Laser Color Calibration", "Moisture < 5% Control", "Zero Foreign Matter"]
        },
        protocol: {
          title: "Steam Softening Protocol",
          icon: Zap,
          desc: "We utilize low-temperature steam softening to ensure easy shelling without damaging the kernel's natural oils and crispness."
        }
      };
    }
    if (isRice) {
      return {
        title: "Vietnam's Rice Heartland",
        desc: "Vietnam's rice production is centered in the Mekong Delta, a unique agricultural ecosystem providing year-round harvest stability.",
        image: "https://images.unsplash.com/photo-1592910129881-892bbe239cc0?auto=format&fit=crop&q=80&w=1200",
        regions: [
          { name: "Mekong Delta Bowl", desc: "The source of 90% of Vietnam's rice exports. Alluvial soil and river systems enable 3 crops per year.", tag: "Export Core" },
          { name: "Soc Trang & Bac Lieu", desc: "Coastal zones specialized in premium fragrant varieties like ST24 and ST25.", tag: "Fragrant Hub" }
        ],
        stats: [
          { icon: Waves, label: "Hydrology", val: "Mekong Network" },
          { icon: Droplets, label: "Soil", val: "Rich Alluvium" }
        ],
        usefulInfo: {
          title: "Mekong Logistics Sync",
          desc: "Foodmax integrates with river barge logistics, allowing 1,000MT lots to move directly from processing plants to international container ports with zero land-transit friction.",
          points: ["Direct River-to-Port", "Real-time Batch Tracking", "FOB/CIF Transparency"]
        },
        protocol: {
          title: "Hydro-Drying Protocol",
          icon: Droplets,
          desc: "Every grain is dried through a controlled multi-stage thermal cycle to ensure moisture levels never exceed 14.0% for long-haul shipping."
        }
      };
    }
    if (isCoffee) {
      return {
        title: "Coffee Cultivation Belts",
        desc: "Vietnam is the world's Robusta powerhouse. Our sourcing strategy covers both high-volume Robusta and specialty high-altitude Arabica.",
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1200",
        regions: [
          { name: "Dak Lak Plateau", desc: "The world's Robusta capital. Volcanic soil and specific seasons create deep cocoa profiles.", tag: "Robusta Base" },
          { name: "Lam Dong Highlands", desc: "Home to Cau Dat, Vietnam's premier Arabica origin with elevations exceeding 1,500m.", tag: "Specialty Zone" }
        ],
        stats: [
          { icon: Mountain, label: "Altitude", val: "500m - 1,600m" },
          { icon: Activity, label: "Soil", val: "Volcanic/Basalt" }
        ],
        usefulInfo: {
          title: "Density & Screen Sizing",
          desc: "Foodmax employs gravity separation tables to ensure S16 and S18 lots have high bean density, resulting in superior roaster heat transfer and uniform color.",
          points: ["Gravity Separation", "SCA Cupping Calibration", "Defect < 1% Specialty"]
        },
        protocol: {
          title: "Fermentation Control",
          icon: Coffee,
          desc: "Our washed lots undergo 24-36 hour controlled fermentation in temperature-monitored tanks to maximize citric acidity and clarity."
        }
      };
    }
    return null;
  }, [isCashew, isRice, isCoffee]);

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gray-50 border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-foodmax-forest transition-colors"
          >
            <ArrowLeft size={16} /> BACK TO LIST
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="aspect-[4/3] rounded-[2rem] overflow-hidden border border-gray-100 shadow-2xl">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {galleryImages.map((src, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 group cursor-pointer">
                  <img
                    src={src}
                    alt={`detail-${i}`}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 hover:scale-110"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col animate-in fade-in slide-in-from-right duration-700">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-foodmax-forest text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg shadow-sm">
                {product.category}
              </span>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{product.subCategory}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-8 leading-tight tracking-tighter">{product.name}</h1>
            <p className="text-xl text-gray-500 mb-12 leading-relaxed font-medium">{product.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-auto">
              <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-900 mb-6 flex items-center gap-2">
                  <FileText size={16} className="text-foodmax-forest" /> Quality Specs
                </h3>
                <ul className="space-y-4">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <li key={key} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                      <span className="text-gray-400 font-bold">{key}</span>
                      <span className="font-black text-gray-900">{val as any}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-900 mb-6 flex items-center gap-2">
                  <Truck size={16} className="text-foodmax-forest" /> Trade Logistics
                </h3>
                <ul className="space-y-4 text-xs font-bold text-gray-600">
                  <li className="flex items-center gap-3">
                    <CheckCircle size={14} className="text-foodmax-lime" /> Bulk Packaging Available
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={14} className="text-foodmax-lime" /> White-Label / OEM Supply
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={14} className="text-foodmax-lime" /> FOB / CIF / CFR Alignment
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={14} className="text-foodmax-lime" /> Global Port Routing
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {originData && (
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
                    Origin Intelligence
                  </h2>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 tracking-tighter">
                  {originData.title.split(' ')[0]}{' '}
                  <span className="text-foodmax-forest">
                    {originData.title.split(' ').slice(1).join(' ')}
                  </span>
                </h2>
                <p className="text-lg text-gray-500 mb-10 leading-relaxed font-medium">{originData.desc}</p>

                <div className="space-y-6">
                  {originData.regions.map((r, i) => (
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
                    <Database size={24} className="text-foodmax-forest" /> {originData.usefulInfo.title}
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">{originData.usefulInfo.desc}</p>

                  <div className="space-y-3">
                    {originData.usefulInfo.points.map((pt, i) => (
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
                      <originData.protocol.icon size={32} className="text-foodmax-lime" />
                    </div>
                    <h5 className="text-white text-2xl font-black tracking-tight mb-3">{originData.protocol.title}</h5>
                    <p className="text-white/70 text-sm font-medium max-w-sm leading-relaxed">{originData.protocol.desc}</p>
                    <div className="mt-8 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-foodmax-lime" />
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Verified Export Protocol</span>
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
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-none">Related Commodities</h2>
                <p className="text-lg text-gray-500 font-medium mt-4">
                  Explore additional export varieties within our {product.category} portfolio.
                </p>
              </div>
              <Link
                to={`/products/${product.category.toLowerCase()}`}
                className="inline-flex items-center gap-3 text-xs font-black text-foodmax-forest uppercase tracking-[0.2em] group border-b-2 border-transparent hover:border-foodmax-lime transition-all pb-1"
              >
                View All {product.category} Varieties <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-10 tracking-tight">Request Export Quotation</h2>

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
                      placeholder="Your Name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-foodmax-forest outline-none text-sm font-medium placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <input
                      type="email"
                      placeholder="Business Email"
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
                      placeholder="Company Name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-foodmax-forest outline-none text-sm font-medium placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Order Volume (MT)"
                      value={orderVolume}
                      onChange={(e) => setOrderVolume(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-foodmax-forest outline-none text-sm font-medium placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={5}
                    placeholder="Specific requirements or questions..."
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
                      <CheckCircle size={20} /> INQUIRY SUBMITTED SUCCESSFULLY
                    </>
                  ) : (
                    <>
                      <Send size={18} /> {sending ? 'SENDING...' : 'SEND INQUIRY TO EXPORT DEPT'}
                    </>
                  )}
                </button>

                <p className="text-[10px] text-gray-400 text-center uppercase tracking-[0.3em] font-black mt-8">
                  STANDARD RESPONSE TIME: 12-24 BUSINESS HOURS
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
