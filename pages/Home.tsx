
import React from 'react';
import HeroSlider from '../components/HeroSlider';
import SectionHeading from '../components/SectionHeading';
import ProductCard from '../components/ProductCard';
import Counter from '../components/Counter';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Factory, Zap, Package, Scale, Globe, BadgeCheck, Anchor, CreditCard, CheckCircle, ArrowRight } from 'lucide-react';
import { getNewsPath } from '../lib/newsSeo';

const Home: React.FC = () => {
  const { products, news } = useData();
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="animate-in fade-in duration-700">
      <HeroSlider />

      {/* 1. Value Propositions */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              { icon: ShieldCheck, title: "Certified Quality", desc: "HACCP, ISO 22000, and FDA compliant processing facilities." },
              { icon: Truck, title: "Global Logistics", desc: "Strategic partnerships with major shipping lines for 30+ countries." },
              { icon: Factory, title: "Direct Sourcing", desc: "Vertical integration from central highlands to packaging plants." },
              { icon: Zap, title: "Fast Execution", desc: "Streamlined export documentation and rapid response timelines." }
            ].map((adv, i) => (
              <div key={i} className="flex flex-col items-center text-center p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="w-16 h-16 bg-foodmax-forest text-white rounded-2xl flex items-center justify-center mb-8 group-hover:bg-foodmax-lime group-hover:text-foodmax-forest transition-colors shadow-lg">
                  <adv.icon size={30} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-4 tracking-tight">{adv.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Featured Products */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeading 
            title="Our Premium Export Lines" 
            subtitle="High-quality agricultural commodities, meticulously processed for the most demanding international markets."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {featuredProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="text-center">
            <Link to="/products" className="inline-flex items-center gap-2 px-10 py-4 bg-foodmax-forest text-white font-black rounded-2xl hover:bg-foodmax-lime hover:text-foodmax-forest transition-all hover:-translate-y-1 shadow-xl shadow-foodmax-forest/20 text-xs uppercase tracking-widest">
              View All Product Categories
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Operational Architecture */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading 
            title="Operational Architecture" 
            subtitle="Commercial rigor and technical compliance defining the Foodmax export methodology."
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-10 rounded-[2.5rem] bg-foodmax-forest text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-foodmax-lime/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-foodmax-lime text-foodmax-forest rounded-xl"><BadgeCheck size={24} /></div>
                <h4 className="text-xl font-black uppercase tracking-tighter">Quality Standards</h4>
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-8 font-medium">
                Our "Zero-Defect" protocol integrates ISO 22000 & HACCP standards into every processing stage. We provide multi-layer lab verification for every batch.
              </p>
              <ul className="space-y-3 mb-10">
                <li className="flex items-center gap-2 text-xs font-bold text-foodmax-lime uppercase tracking-widest"><CheckCircle size={14}/> SGS / Vinacontrol Alignment</li>
                <li className="flex items-center gap-2 text-xs font-bold text-foodmax-lime uppercase tracking-widest"><CheckCircle size={14}/> Phytosanitary Purity</li>
                <li className="flex items-center gap-2 text-xs font-bold text-foodmax-lime uppercase tracking-widest"><CheckCircle size={14}/> Sensory Profile Calibration</li>
              </ul>
              <Link to="/operations#quality" className="text-[10px] font-black uppercase tracking-[0.2em] text-foodmax-lime hover:text-white transition-colors">Technical Specs PDF →</Link>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-gray-50 border border-gray-100 group">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-foodmax-forest text-white rounded-xl"><Anchor size={24} /></div>
                <h4 className="text-xl font-black uppercase tracking-tighter text-gray-900">Global Logistics</h4>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">
                Strategically located near Ho Chi Minh and Hai Phong port hubs, ensuring rapid kinetic movement and prioritized vessel space allocation.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Key Ports</p>
                  <p className="text-xs font-black text-gray-900">Cat Lai / Cai Mep</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Fleet</p>
                  <p className="text-xs font-black text-gray-900">Multi-Carrier Sync</p>
                </div>
              </div>
              <Link to="/operations#logistics" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-foodmax-forest transition-colors">Route Intelligence →</Link>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-gray-50 border border-gray-100 group">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-foodmax-forest text-white rounded-xl"><Package size={24} /></div>
                <h4 className="text-xl font-black uppercase tracking-tighter text-gray-900">Packaging Specs</h4>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">
                Engineered for atmospheric protection and long-haul integrity. We offer industrial bulk and boutique retail-ready configurations.
              </p>
              <div className="flex flex-wrap gap-2 mb-10">
                {['25kg PP Bags', '50kg PP Bags', '1MT Jumbo', 'Vacuum Seal', 'Jute 60kg'].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-white border border-gray-200 text-[9px] font-black text-gray-500 uppercase tracking-widest rounded-lg">{tag}</span>
                ))}
              </div>
              <Link to="/operations#packaging" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-foodmax-forest transition-colors">Packaging Manual →</Link>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-foodmax-forest text-white relative group">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-foodmax-lime text-foodmax-forest rounded-xl"><CreditCard size={24} /></div>
                <h4 className="text-xl font-black uppercase tracking-tighter">Terms of Trade</h4>
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-8 font-medium">
                Transparent commercial frameworks anchored in Incoterms 2020. Risk-mitigated settlement instruments for global trust.
              </p>
              <div className="space-y-4 mb-10">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Pricing Model</span>
                  <span className="text-xs font-black">FOB / CIF / CFR</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Payment</span>
                  <span className="text-xs font-black">L/C at Sight / T/T</span>
                </div>
              </div>
              <Link to="/operations#terms" className="text-[10px] font-black uppercase tracking-[0.2em] text-foodmax-lime hover:text-white transition-colors">Trade Framework →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Stats with Animated Counters */}
      <section className="py-24 bg-foodmax-forest text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { target: 500, suffix: "K+", label: "MT Tons Exported" },
              { target: 45, suffix: "+", label: "Target Countries" },
              { target: 15, suffix: "+", label: "Years Excellence" },
              { target: 100, suffix: "%", label: "Traceability" }
            ].map((stat, i) => (
              <div key={i} className="group">
                <p className="text-4xl md:text-6xl font-black mb-2 text-foodmax-lime group-hover:scale-105 transition-transform drop-shadow-sm">
                  <Counter target={stat.target} suffix={stat.suffix} />
                </p>
                <p className="text-white/60 text-xs font-black uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. News & Insights */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading 
            title="Global Market Insights" 
            subtitle="Expert perspectives on Vietnamese agriculture and global commodity trends."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {news.map(item => (
              <div key={item.id} className="group cursor-pointer bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 hover:border-foodmax-forest/30 transition-all hover:shadow-2xl">
                <div className="aspect-video overflow-hidden relative">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 bg-foodmax-forest px-3 py-1 rounded-lg text-[10px] font-black text-foodmax-lime uppercase tracking-widest shadow-lg">{item.date}</div>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-black text-gray-900 mb-4 group-hover:text-foodmax-forest transition-colors leading-tight">{item.title}</h3>
                  <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed">{item.excerpt}</p>
                  <Link to={getNewsPath(item)} className="inline-flex items-center gap-2 text-sm font-black text-foodmax-forest hover:text-foodmax-lime transition-colors">Read Article</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-white relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#006838 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="bg-gray-50 rounded-[4rem] p-12 md:p-24 text-center border border-gray-100 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-foodmax-lime/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-foodmax-lime/20 transition-colors duration-1000"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-foodmax-forest/5 rounded-full -ml-32 -mb-32 blur-3xl group-hover:bg-foodmax-forest/10 transition-colors duration-1000"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-7xl font-black text-gray-900 mb-8 tracking-tighter leading-tight">
                Ready to scale your <span className="text-foodmax-forest">supply chain?</span>
              </h2>
              <p className="text-xl text-gray-500 mb-12 font-medium leading-relaxed">
                Connect with our export desk for tailored trade solutions, logistics optimization, and bulk volume contracts.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link 
                  to="/contact" 
                  className="px-14 py-6 bg-foodmax-forest text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-foodmax-lime hover:text-foodmax-forest transition-all shadow-2xl shadow-foodmax-forest/20 hover:scale-105 active:scale-95 flex items-center gap-3"
                >
                  Connect with Export Sales <ArrowRight size={18} />
                </Link>
                <Link 
                  to="/products" 
                  className="px-14 py-6 bg-white border-2 border-gray-200 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:border-foodmax-forest hover:text-foodmax-forest transition-all"
                >
                  Browse Catalog
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
