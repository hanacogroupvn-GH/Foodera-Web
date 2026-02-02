
import React from 'react';
import { Target, ShieldCheck, Globe, Zap, Layers, Navigation, Landmark, Users } from 'lucide-react';

const AboutUs: React.FC = () => {
  const teamMembers = [
    {
      name: "Mr. Ngoc Dao",
      title: "Chairman",
      highlight: "20+ years of leadership in Vietnam's agricultural strategic development and global trade policy architecture.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "Mr. Brian Ho",
      title: "Business Director",
      highlight: "Expert in international market expansion, specializing in B2B partnership structures across ASEAN and Middle East markets.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "Mr. Frederic Gines",
      title: "International Commercial Director",
      highlight: "Extensive background in European commodity trading and global supply chain logistics optimization.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "Ms. Mai Nguyen",
      title: "Commercial Assistant",
      highlight: "Specialist in international trade documentation, ensuring seamless compliance and client relationship excellence.",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "Ms. Tu Phuong",
      title: "Operation Manager",
      highlight: "Directs upstream supply chain operations and factory processing standards to ensure zero-defect export quality.",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400"
    }
  ];

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-700 font-sans">
      {/* 1. OPENING - IDENTITY FIRST */}
      <section className="relative pt-32 pb-24 border-b border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-[900] text-gray-900 mb-8 tracking-tighter leading-[0.9]">
              Heritage of Origin.<br />
              <span className="text-foodmax-forest">Architecture of Trade.</span>
            </h1>
            <div className="h-1 w-24 bg-foodmax-lime mb-10"></div>
            <p className="text-xl md:text-2xl text-gray-500 font-medium leading-relaxed">
              Foodmax was not conceived as a simple brokerage. It was built from a deep respect for Vietnam's land heritage, shaped by rigorous agricultural research and on-the-ground supply development.
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gray-50 -z-0 hidden lg:block"></div>
      </section>

      {/* 2. FROM LAND TO GLOBAL MARKETS */}
      <section className="py-24 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/5] bg-gray-100 rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
                <img src="https://images.unsplash.com/photo-1592910129881-892bbe239cc0?auto=format&fit=crop&q=80&w=1200" alt="Supply Chain" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6">The System</h2>
              <h3 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">An Integrated Supply Ecosystem</h3>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed font-medium">
                Foodmax operates as a multi-layered agricultural supply platform. We do not merely move products; we manage the narrative from the soil to the shipping container.
              </p>
              <div className="space-y-8 mt-12">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-foodmax-forest/5 rounded-xl flex items-center justify-center text-foodmax-forest"><Landmark size={24} /></div>
                  <div>
                    <h4 className="font-black text-gray-900 mb-1 uppercase text-xs tracking-widest">Controlled Sourcing</h4>
                    <p className="text-sm text-gray-500 font-medium">Direct connection with specialized cooperatives and processors ensures upstream stability and quality control at the point of harvest.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-foodmax-forest/5 rounded-xl flex items-center justify-center text-foodmax-forest"><Layers size={24} /></div>
                  <div>
                    <h4 className="font-black text-gray-900 mb-1 uppercase text-xs tracking-widest">Integrated Downstream</h4>
                    <p className="text-sm text-gray-500 font-medium">Full ownership of the export cycle allows for high-precision traceability and custom processing specifications for diverse global markets.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KEY LEADERSHIP SECTION */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 flex items-center justify-center gap-2">
              <Users size={14} className="text-foodmax-lime" /> Key Members
            </h2>
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">The Export Leadership Team</h3>
            <p className="text-lg text-gray-500 mt-4 max-w-2xl mx-auto font-medium">Meet the strategic architects driving Vietnam's agricultural excellence to the world stage.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {teamMembers.map((member, index) => (
              <div key={index} className="group relative bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                <div className="aspect-[4/5] overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-700">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foodmax-forest/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-8">
                  <h4 className="text-2xl font-black text-gray-900 mb-1 group-hover:text-foodmax-forest transition-colors">{member.name}</h4>
                  <p className="text-xs font-black text-foodmax-forest uppercase tracking-[0.2em] mb-4">{member.title}</p>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-3 group-hover:text-gray-700 transition-colors">
                    {member.highlight}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. STRATEGIC CONTEXT - IMPROVED WORLD MAP (ACCURATE REPRESENTATION) */}
      <section className="py-24 lg:py-32 bg-[#0a121e] text-white overflow-hidden relative group">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center">
            <div className="animate-in slide-in-from-left duration-1000">
              <h2 className="text-[10px] font-black text-foodmax-lime uppercase tracking-[0.5em] mb-8">Strategic Context</h2>
              <h3 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter leading-tight">
                Vietnam as the <br />World's Pantry
              </h3>
              <p className="text-lg text-white/50 mb-8 leading-relaxed font-medium">
                With a diverse climate and fertile land, Vietnam sits at the heart of the global food security map. As the world's leading exporter of several key commodities, its role is strategic.
              </p>
              <p className="text-lg text-white/50 mb-12 leading-relaxed font-medium">
                Foodmax acts as the bridge between this local agricultural abundance and an international business mindset. We translate origin-specific complexity into reliable, global-standard supply.
              </p>
              
              <div className="h-px bg-white/10 mb-12 w-full max-w-lg"></div>

              <div className="grid grid-cols-2 gap-10">
                <div>
                  <p className="text-5xl font-black text-foodmax-lime mb-3">30+</p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Global Markets Served</p>
                </div>
                <div>
                  <p className="text-5xl font-black text-foodmax-lime mb-3">100%</p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Export Compliance</p>
                </div>
              </div>
            </div>

            {/* REALISTIC ROTATING GLOBE COLUMN */}
            <div className="relative flex justify-center items-center">
              <div className="w-full max-w-[550px] aspect-square relative flex items-center justify-center">
                
                {/* Orbit Rings */}
                <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_35s_linear_infinite] group-hover:animate-[spin_15s_linear_infinite] transition-all duration-1000">
                   <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-foodmax-lime/40 rounded-full blur-[2px]"></div>
                </div>
                <div className="absolute inset-12 rounded-full border border-white/5 animate-[spin_25s_linear_infinite_reverse] group-hover:animate-[spin_10s_linear_infinite_reverse] transition-all duration-1000"></div>

                {/* THE GLOBE SPHERE */}
                <div className="w-[85%] h-[85%] rounded-full bg-[#1e293b] border border-white/10 relative overflow-hidden flex items-center justify-center shadow-[0_0_120px_rgba(0,0,0,0.8)] group-hover:border-foodmax-lime/20 transition-all duration-700">
                  
                  {/* Accurate World Map - Horizontal Infinite Scrolling */}
                  <style>{`
                    @keyframes globeRotation {
                      0% { transform: translateX(0); }
                      100% { transform: translateX(-50%); }
                    }
                    .animate-globe {
                      animation: globeRotation 60s linear infinite;
                    }
                    .group:hover .animate-globe {
                      animation-duration: 25s;
                    }
                  `}</style>

                  <div className="absolute inset-0 w-[200%] h-full flex animate-globe whitespace-nowrap opacity-40 group-hover:opacity-60 transition-all duration-1000">
                    <div 
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1589519160732-57fc498494f8?auto=format&fit=crop&q=80&w=1200')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'grayscale(1) brightness(1.5) contrast(1.2)'
                      }}
                    ></div>
                    <div 
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1589519160732-57fc498494f8?auto=format&fit=crop&q=80&w=1200')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'grayscale(1) brightness(1.5) contrast(1.2)'
                      }}
                    ></div>
                  </div>

                  {/* Sourcing Points (Fixed on sphere) */}
                  <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="absolute top-[45%] left-[62%] w-3 h-3 bg-foodmax-lime rounded-full shadow-[0_0_15px_#8cc63f] animate-pulse"></div>
                    <div className="absolute top-[55%] left-[18%] w-2 h-2 bg-foodmax-lime rounded-full shadow-[0_0_10px_#8cc63f] animate-pulse delay-500"></div>
                    <div className="absolute top-[40%] left-[82%] w-2 h-2 bg-foodmax-lime rounded-full shadow-[0_0_10px_#8cc63f] animate-pulse delay-1000"></div>
                  </div>

                  {/* 3D Sphere Shading & Highlight */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#0a121e]/80 via-transparent to-white/10 pointer-events-none z-20"></div>
                  <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.7)] pointer-events-none z-20 rounded-full"></div>
                  <div className="absolute top-[15%] left-[15%] w-[40%] h-[40%] bg-white/5 rounded-full blur-3xl pointer-events-none z-20"></div>
                </div>

                {/* Crosshair accents */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-px bg-white/20"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-px bg-white/20"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-12 bg-white/20"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-white/20"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. QUALITY AS A SYSTEM */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6">Mitigation of Risk</h2>
              <h3 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">Quality as a Systemic Design</h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed font-medium">
                In international trade, quality is not a promise; it is a management of risk. We implement independent inspection protocols and rigorous process controls at every junction of the supply chain.
              </p>
              <div className="grid grid-cols-1 gap-4">
                {['HACCP & ISO 22000 Integration', 'Phytosanitary Certification Protocols', 'Third-Party Independent Analysis', 'Internal Batch Traceability Systems'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <ShieldCheck size={20} className="text-foodmax-forest" />
                    <span className="text-sm font-black text-gray-700 uppercase tracking-widest">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 grid grid-cols-2 gap-4">
              <div className="h-64 bg-gray-200 rounded-2xl overflow-hidden shadow-inner">
                <img src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover grayscale" />
              </div>
              <div className="h-64 mt-12 bg-gray-200 rounded-2xl overflow-hidden shadow-inner">
                <img src="https://images.unsplash.com/photo-1536304953491-a1312952467d?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover grayscale" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LOGISTICS IS NOT OPTIONAL */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-foodmax-forest rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
            <div className="max-w-3xl relative z-10">
              <h2 className="text-[10px] font-black text-foodmax-lime uppercase tracking-[0.4em] mb-6">Core Competency</h2>
              <h3 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">The Door-to-Port Mindset</h3>
              <p className="text-lg text-white/80 mb-10 leading-relaxed font-medium">
                Logistics is the final pillar of agricultural integrity. Our expert export desk manages all aspects of documentation and container optimization, significantly reducing operational friction for international buyers.
              </p>
              <div className="flex flex-wrap gap-10">
                <div className="flex items-center gap-2">
                  <Navigation size={20} className="text-foodmax-lime" />
                  <span className="text-xs font-black uppercase tracking-widest">Strategic Port Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={20} className="text-foodmax-lime" />
                  <span className="text-xs font-black uppercase tracking-widest">Global Freight Network</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap size={20} className="text-foodmax-lime" />
                  <span className="text-xs font-black uppercase tracking-widest">Rapid Documentation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. LONG-TERM VISION & CLOSING */}
      <section className="py-32 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-8">Horizon 2030</h2>
          <h3 className="text-4xl md:text-6xl font-black text-gray-900 mb-10 tracking-tighter leading-tight">
            Building a Global Network of<br /> Agricultural Trust.
          </h3>
          <p className="text-xl text-gray-500 mb-12 font-medium leading-relaxed">
            Our vision is defined by long-term cooperation. We grow with our partners, investing in supply chain resilience that ensures stable commodities for decades to come, not just chasing immediate transactions.
          </p>
          <div className="pt-12 border-t border-gray-100 mt-12">
            <p className="text-2xl font-black text-gray-900 tracking-tight">Foodmax</p>
            <p className="text-xs font-black text-foodmax-forest uppercase tracking-[0.3em] mt-2">Good Food. Global Trust.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
