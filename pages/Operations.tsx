
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Truck, Package, Scale, FileText, CheckCircle, Globe, Zap, BadgeCheck, Anchor } from 'lucide-react';

const Operations: React.FC = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [hash]);

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-700">
      {/* Header */}
      <section className="bg-gray-50 pt-32 pb-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tighter leading-none">
              Operational <span className="text-foodmax-forest">Compliance</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium leading-relaxed">
              Technical specifications and trade frameworks governing Foodmax international export activities. We ensure commercial rigor from origin to destination.
            </p>
          </div>
        </div>
      </section>

      {/* 1. QUALITY STANDARDS */}
      <section id="quality" className="py-24 border-b border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-foodmax-forest text-white rounded-lg"><ShieldCheck size={20} /></div>
                <h2 className="text-[10px] font-black text-foodmax-forest uppercase tracking-[0.4em]">Section 01 / Quality Standards</h2>
              </div>
              <h3 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">The Architecture of Purity</h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed font-medium">
                At Foodmax, quality is not an inspection—it is a system. Our multi-stage verification process ensures that every metric, from moisture content to sensory profile, meets the strict requirements of international food safety and specialty markets.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: "ISO 22000 & HACCP", desc: "Global standards integrated into every processing plant and warehouse." },
                  { title: "SGS / Vinacontrol Alignment", desc: "Optional third-party independent analysis for every export container." },
                  { title: "Sensory Calibration", desc: "In-house Q-Graders and Rice Technicians calibrate batches for consistency." },
                  { title: "Phytosanitary Rigor", desc: "Rigorous pest and contaminant control protocols for long-haul shipping." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl border border-gray-100 hover:border-foodmax-lime/30 bg-white transition-all shadow-sm">
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
               <div className="absolute top-0 right-0 w-64 h-64 bg-foodmax-forest/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
               <h4 className="text-xl font-black mb-6 flex items-center gap-2">
                 <Zap size={20} className="text-foodmax-lime" /> Batch Sovereignty
               </h4>
               <p className="text-white/70 mb-8 leading-relaxed font-medium">
                 Every lot is assigned a unique Foodmax Tracking ID, allowing for full upstream visibility from the specific farm cluster to the final packing line.
               </p>
               <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10">
                 <div>
                   <p className="text-3xl font-black text-foodmax-lime">0.01%</p>
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Admixture Tolerance</p>
                 </div>
                 <div>
                   <p className="text-3xl font-black text-foodmax-lime">100%</p>
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Lab-Verified Batches</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. GLOBAL LOGISTICS */}
      <section id="logistics" className="py-24 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-2 bg-foodmax-forest text-white rounded-lg"><Truck size={20} /></div>
              <h2 className="text-[10px] font-black text-foodmax-forest uppercase tracking-[0.4em]">Section 02 / Global Logistics</h2>
            </div>
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Kinetic Supply Chain Management</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-200">
              <Anchor size={32} className="text-foodmax-forest mb-6" />
              <h4 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Strategic Port Hubs</h4>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Direct access to Cat Lai (HCM), Cai Mep (Vung Tau), and Hai Phong ports ensures minimal domestic transit time and rapid vessel loading.
              </p>
            </div>
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-200">
              <Globe size={32} className="text-foodmax-forest mb-6" />
              <h4 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Multi-Carrier Network</h4>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Service contracts with major shipping lines (Maersk, ONE, COSCO) provide priority space allocation even during peak global demand.
              </p>
            </div>
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-200">
              <FileText size={32} className="text-foodmax-forest mb-6" />
              <h4 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Doc-Flow Efficiency</h4>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Expert handling of Bill of Lading, Certificates of Origin (Form A, B, D, E, AK), and Customs Clearance to prevent port demurrage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PACKAGING SPECS */}
      <section id="packaging" className="py-24 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200" 
                className="rounded-[3rem] shadow-2xl grayscale hover:grayscale-0 transition-all duration-1000" 
                alt="Packaging" 
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-foodmax-forest text-white rounded-lg"><Package size={20} /></div>
                <h2 className="text-[10px] font-black text-foodmax-forest uppercase tracking-[0.4em]">Section 03 / Packaging Specs</h2>
              </div>
              <h3 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">Atmospheric Protection</h3>
              <p className="text-lg text-gray-600 mb-10 leading-relaxed font-medium">
                Our packaging engineering protects commodity integrity against humidity, oxidation, and transit stress. We offer flexible solutions ranging from industrial bulk to boutique retail finishes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Export Bulk</h5>
                  <ul className="space-y-2 text-sm text-gray-900 font-bold">
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-foodmax-lime" /> 25kg / 50kg PP Bags</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-foodmax-lime" /> 1MT Jumbo Bags</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-foodmax-lime" /> 60kg Jute (Coffee)</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Retail & Specialty</h5>
                  <ul className="space-y-2 text-sm text-gray-900 font-bold">
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-foodmax-lime" /> Vacuum Sealing</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-foodmax-lime" /> Multi-Wall Kraft</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-foodmax-lime" /> Private Label Branding</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TERMS OF TRADE */}
      <section id="terms" className="py-24 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#8cc63f 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-foodmax-lime text-foodmax-forest rounded-lg"><Scale size={20} /></div>
              <h2 className="text-[10px] font-black text-foodmax-lime uppercase tracking-[0.4em]">Section 04 / Terms of Trade</h2>
            </div>
            <h3 className="text-4xl md:text-5xl font-black mb-10 tracking-tight">Commercial Rigor & Trust</h3>
            <p className="text-xl text-white/60 mb-12 leading-relaxed font-medium">
              We operate under a transparent commercial framework designed to minimize risk for international buyers. All contracts are anchored in Incoterms 2020 standards and globally recognized payment instruments.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-white/10 pt-10">
              <div className="space-y-6">
                <h5 className="text-xs font-black text-foodmax-lime uppercase tracking-widest">Incoterms 2020 Support</h5>
                <div className="flex flex-wrap gap-3">
                  {['FOB', 'CIF', 'CFR', 'DDP'].map(term => (
                    <span key={term} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-black">{term}</span>
                  ))}
                </div>
                <p className="text-sm text-white/40 leading-relaxed">
                  Primary export pricing is structured on FOB (Free On Board) or CIF (Cost, Insurance, and Freight) terms to ensure clarity in risk transfer.
                </p>
              </div>
              <div className="space-y-6">
                <h5 className="text-xs font-black text-foodmax-lime uppercase tracking-widest">Settlement Instruments</h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-white/40 uppercase text-[10px] tracking-widest">Instrument 01</span>
                    <span className="font-black">L/C at Sight (Irrevocable)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-white/40 uppercase text-[10px] tracking-widest">Instrument 02</span>
                    <span className="font-black">T/T (30% Advance / 70% B/L)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-white/40 uppercase text-[10px] tracking-widest">Currency</span>
                    <span className="font-black">USD / EUR / VND</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h4 className="text-2xl font-black text-gray-900 mb-6">Need a formal technical dossier?</h4>
          <p className="text-gray-500 mb-10 font-medium">Download our complete export manual including detailed analysis of processing capacities and logistics lead times.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-10 py-4 bg-foodmax-forest text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-foodmax-lime hover:text-foodmax-forest transition-all shadow-xl">
              Request Technical PDF
            </button>
            <a href="mailto:export@foodmax.vn" className="px-10 py-4 border-2 border-foodmax-forest text-foodmax-forest rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">
              Email Trade Desk
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Operations;
