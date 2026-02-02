
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Mail, Info, MapPin, Calendar, Globe, Zap, TrendingUp, BarChart, Activity } from 'lucide-react';

interface YieldData {
  year: string;
  volume: number; // in Metric Tons
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
}

const FM_REGIONS: Region[] = [
  {
    id: "sonla",
    name: "Son La (Northwest)",
    x: 32, y: 15,
    image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=70",
    short: "Northwest Arabica origin with bright acidity and floral notes.",
    desc: "Cooler highland climate supports aromatic Arabica lots suitable for specialty and single-origin programs.",
    profile: {
      "Characteristics": "Aromatic, bright acidity, clean finish",
      "Varieties": "Arabica (Catimor, Typica selections)",
      "Certifications": "Available upon request",
      "Harvest Season": "Oct – Dec",
      "Annual Volume": "~ 45,000 tons",
      "Processing": "Washed, Honey",
      "Traceability": "Farmer ID, plot mapping"
    },
    seasonMonths: [10, 11, 12],
    specsheet: "#",
    contact: "/contact",
    historicalYield: [
      { year: '2022', volume: 38000 },
      { year: '2023', volume: 42000 },
      { year: '2024', volume: 45000 },
    ],
    projection: { target: 50000, current: 45500 }
  },
  {
    id: "quangtri",
    name: "Quang Tri (Central)",
    x: 52, y: 38,
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=70",
    short: "Emerging origin with diverse micro-lots.",
    desc: "Developing supply with potential for differentiated programs; suitable for both commercial and specialty lots.",
    profile: {
      "Characteristics": "Balanced profile; flexible lot selection",
      "Varieties": "Arabica & Robusta",
      "Certifications": "Project-based",
      "Harvest Season": "Nov – Jan",
      "Annual Volume": "~ 12,000 tons",
      "Processing": "Natural, Washed",
      "Traceability": "Supplier onboarding, lot codes"
    },
    seasonMonths: [11, 12, 1],
    specsheet: "#",
    contact: "/contact",
    historicalYield: [
      { year: '2022', volume: 8000 },
      { year: '2023', volume: 10500 },
      { year: '2024', volume: 12000 },
    ],
    projection: { target: 18000, current: 12200 }
  },
  {
    id: "gialai",
    name: "Gia Lai (Central Highlands)",
    x: 65, y: 65,
    image: "https://images.unsplash.com/photo-1621351183012-e2f0c9d2cf03?auto=format&fit=crop&w=1200&q=70",
    short: "Basalt soil highlands producing consistent export-grade Robusta.",
    desc: "Stable supply for bulk export contracts; lot selection available for quality tiers and processing preferences.",
    profile: {
      "Characteristics": "Strong body, cocoa notes, consistent cup",
      "Varieties": "Robusta",
      "Certifications": "4C / Rainforest Alliance",
      "Harvest Season": "Nov – Jan",
      "Annual Volume": "~ 180,000 tons",
      "Processing": "Natural, Honey",
      "Traceability": "Farmer profiles, batch QR"
    },
    seasonMonths: [11, 12, 1],
    specsheet: "#",
    contact: "/contact",
    historicalYield: [
      { year: '2022', volume: 165000 },
      { year: '2023', volume: 172000 },
      { year: '2024', volume: 180000 },
    ],
    projection: { target: 200000, current: 184000 }
  },
  {
    id: "daklak",
    name: "Dak Lak (Central Highlands)",
    x: 62, y: 75,
    image: "https://images.unsplash.com/photo-1599634871932-7f9b64d0cfc6?auto=format&fit=crop&w=1200&q=70",
    short: "Vietnam’s largest Robusta sourcing hub.",
    desc: "The country’s flagship origin for export-grade Robusta with scalable supply and structured QC options.",
    profile: {
      "Characteristics": "Full body, chocolate/nutty notes",
      "Varieties": "Robusta",
      "Certifications": "4C / Rainforest Alliance / UTZ",
      "Harvest Season": "Nov – Feb",
      "Annual Volume": "> 420,000 tons",
      "Processing": "Natural, Washed",
      "Traceability": "Farm GPS mapping, lot segregation"
    },
    seasonMonths: [11, 12, 1, 2],
    specsheet: "#",
    contact: "/contact",
    historicalYield: [
      { year: '2022', volume: 395000 },
      { year: '2023', volume: 410000 },
      { year: '2024', volume: 420000 },
    ],
    projection: { target: 450000, current: 428000 }
  },
  {
    id: "lamdong",
    name: "Lam Dong (Cau Dat)",
    x: 68, y: 84,
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=70",
    short: "Premium Arabica origin for specialty roasters.",
    desc: "High-altitude Arabica suitable for single-origin and specialty contracts; strong differentiation by micro-lots.",
    profile: {
      "Characteristics": "Floral aroma, citrus acidity, clean sweetness",
      "Varieties": "Arabica (Typica, Bourbon, Catimor)",
      "Certifications": "Organic / Rainforest Alliance",
      "Harvest Season": "Oct – Dec",
      "Annual Volume": "~ 55,000 tons",
      "Processing": "Washed, Honey",
      "Traceability": "Single-farm lots, cupping scores"
    },
    seasonMonths: [10, 11, 12],
    specsheet: "#",
    contact: "/contact",
    historicalYield: [
      { year: '2022', volume: 48000 },
      { year: '2023', volume: 52000 },
      { year: '2024', volume: 55000 },
    ],
    projection: { target: 65000, current: 58000 }
  }
];

const VietnamMapSVG: React.FC = () => (
  <svg viewBox="0 0 400 800" className="w-full h-full drop-shadow-2xl overflow-visible">
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
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  </svg>
);

const CommercialTool: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<Region>(FM_REGIONS.find(r => r.id === 'daklak') || FM_REGIONS[0]);
  const [hoveredRegion, setHoveredRegion] = useState<Region | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'stats'>('profile');

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const maxYield = Math.max(...selectedRegion.historicalYield.map(y => y.volume));

  return (
    <div className="bg-[#f9fbf9] min-h-screen pb-20 animate-in fade-in duration-700">
      <div className="bg-white border-b border-gray-100 py-16 mb-12 relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#006838 1px, transparent 1px), linear-gradient(90deg, #006838 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-4 mb-4">
             <div className="bg-foodmax-forest p-2.5 rounded-xl text-white shadow-lg shadow-foodmax-forest/20">
                <Zap size={20} />
             </div>
             <span className="text-[10px] font-black text-foodmax-forest uppercase tracking-[0.4em]">Origin Intelligence Portal</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tighter leading-none">
            Vietnam Origin <span className="text-foodmax-forest">Intelligence Map</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-3xl font-medium leading-relaxed">
            Proprietary spatial data for international agri-commodity buyers. Explore regional yields, harvest cycles, and sourcing availability across our strategic clusters.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* MAP STAGE - Enhanced Styling */}
          <div className="lg:col-span-7 bg-white rounded-[3.5rem] p-10 shadow-2xl border border-gray-100 relative overflow-hidden group">
            {/* Fine Dot Background */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#006838 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            
            <div className="flex items-center justify-between mb-10 px-2 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-foodmax-lime"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vietnam Commercial Map v2.5</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-foodmax-lime ring-4 ring-foodmax-lime/10"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Hub</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-300"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Future Cluster</span>
                </div>
              </div>
            </div>

            <div className="relative h-[750px] w-full bg-gradient-to-b from-[#fdfdfd] to-[#f7f9f7] rounded-[2.5rem] border border-gray-50 flex items-center justify-center p-12">
              <div className="h-full w-auto aspect-[1/2] relative scale-110 md:scale-100">
                 <VietnamMapSVG />
                 
                 {FM_REGIONS.map((region) => (
                  <div 
                    key={region.id}
                    className="absolute z-20"
                    style={{ left: `${region.x}%`, top: `${region.y}%` }}
                  >
                    <button 
                      onClick={() => setSelectedRegion(region)}
                      onMouseEnter={() => setHoveredRegion(region)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      className={`relative w-8 h-8 rounded-full border-2 transition-all duration-500 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center group/pin ${
                        selectedRegion.id === region.id 
                          ? 'bg-foodmax-lime border-white scale-125 shadow-[0_0_20px_rgba(140,198,63,0.6)]' 
                          : 'bg-white border-foodmax-forest/20 hover:border-foodmax-lime hover:scale-110 shadow-lg'
                      }`}
                    >
                       {/* Subtle inner dot */}
                       <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                         selectedRegion.id === region.id ? 'bg-foodmax-forest' : 'bg-foodmax-forest/30 group-hover/pin:bg-foodmax-lime'
                       }`}></div>

                       {/* Pulsing ring for selected pin */}
                       {selectedRegion.id === region.id && (
                         <span className="absolute inset-0 rounded-full bg-foodmax-lime animate-ping opacity-30"></span>
                       )}
                    </button>
                    
                    {(hoveredRegion?.id === region.id || selectedRegion.id === region.id) && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(100%+16px)] z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-gray-900 px-5 py-3 rounded-2xl shadow-2xl border border-white/10 whitespace-nowrap">
                          <div className="flex items-center gap-2 mb-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-foodmax-lime"></div>
                             <p className="text-[10px] font-black text-foodmax-lime uppercase tracking-widest">Sourcing Node</p>
                          </div>
                          <p className="text-sm font-black text-white">{region.name}</p>
                          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45 border-r border-b border-white/10"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="absolute bottom-8 left-10 flex flex-col gap-1">
                 <p className="text-[10px] font-black text-foodmax-forest/40 uppercase tracking-[0.2em]">Regional Geodata</p>
                 <p className="text-xs font-bold text-gray-400">WGS 84 / UTM zone 48N</p>
              </div>
            </div>
          </div>

          {/* INFORMATION PANEL */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border border-gray-100 flex flex-col h-full">
              <div className="h-72 relative overflow-hidden group">
                <img 
                  src={selectedRegion.image} 
                  className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105" 
                  alt={selectedRegion.name} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/30 to-transparent"></div>
                <div className="absolute bottom-10 left-10">
                  <span className="text-[10px] font-black text-foodmax-lime uppercase tracking-[0.4em] mb-2 block">Analytical Focus</span>
                  <h3 className="text-3xl font-black text-white tracking-tight">{selectedRegion.name}</h3>
                </div>
              </div>

              {/* Enhanced Tabs */}
              <div className="flex bg-gray-50 border-b border-gray-100">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === 'profile' ? 'bg-white text-foodmax-forest' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <MapPin size={16} className={activeTab === 'profile' ? 'text-foodmax-lime' : ''} /> Regional Profile
                </button>
                <div className="w-px bg-gray-200"></div>
                <button 
                  onClick={() => setActiveTab('stats')}
                  className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === 'stats' ? 'bg-white text-foodmax-forest' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <TrendingUp size={16} className={activeTab === 'stats' ? 'text-foodmax-lime' : ''} /> Yield Intelligence
                </button>
              </div>

              <div className="p-12 flex-grow bg-white">
                {activeTab === 'profile' ? (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="mb-10 p-6 bg-gray-50 rounded-3xl border-l-4 border-foodmax-forest">
                       <p className="text-sm font-medium text-gray-500 leading-relaxed italic">
                        "{selectedRegion.desc}"
                      </p>
                    </div>

                    <div className="space-y-6 mb-12">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Info size={14} className="text-foodmax-forest" /> Cluster Specifications
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        {Object.entries(selectedRegion.profile).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center text-sm border-b border-gray-50 pb-4">
                            <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">{key}</span>
                            <span className="text-gray-900 font-black text-right">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-12">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <Calendar size={14} className="text-foodmax-forest" /> Seasonal Activity
                      </h4>
                      <div className="grid grid-cols-6 gap-3">
                        {months.map((m, idx) => {
                          const isActive = selectedRegion.seasonMonths.includes(idx + 1);
                          return (
                            <div 
                              key={m} 
                              className={`text-center py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all ${
                                isActive 
                                  ? 'bg-foodmax-forest text-white shadow-xl shadow-foodmax-forest/20' 
                                  : 'bg-gray-50 text-gray-300 border border-gray-100'
                              }`}
                            >
                              {m}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="mb-12">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
                        <BarChart size={14} className="text-foodmax-forest" /> Historical Yield Performance (MT)
                      </h4>
                      <div className="flex items-end justify-between h-56 gap-5 px-6">
                        {selectedRegion.historicalYield.map((y) => (
                          <div key={y.year} className="flex-1 flex flex-col items-center group/bar">
                            <div className="w-full relative flex items-end justify-center h-full">
                              <div 
                                className="w-full max-w-[44px] bg-gray-100 rounded-2xl group-hover/bar:bg-foodmax-lime transition-all duration-500 relative overflow-hidden"
                                style={{ height: `${(y.volume / maxYield) * 100}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-foodmax-forest/10 to-transparent"></div>
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[11px] font-black text-gray-900 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm">
                                  {y.volume.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <span className="mt-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{y.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-12 p-10 bg-gray-900 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-foodmax-lime/20 -mr-16 -mt-16 rounded-full blur-3xl"></div>
                      <div className="flex justify-between items-center mb-8 relative z-10">
                        <h4 className="text-[10px] font-black text-foodmax-lime uppercase tracking-[0.3em] flex items-center gap-2">
                          <Activity size={14} /> Q3 Supply Forecast
                        </h4>
                        <span className="text-[9px] font-black bg-foodmax-forest text-foodmax-lime border border-foodmax-lime/30 px-3 py-1 rounded-full uppercase tracking-widest">In Progress</span>
                      </div>
                      <div className="mb-6 relative z-10">
                        <div className="flex justify-between text-[11px] font-black mb-3">
                          <span className="text-white/40 uppercase tracking-widest">Fulfillment Capacity</span>
                          <span className="text-foodmax-lime">{Math.round((selectedRegion.projection.current / selectedRegion.projection.target) * 100)}%</span>
                        </div>
                        <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                          <div 
                            className="h-full bg-foodmax-lime rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(140,198,63,0.5)]"
                            style={{ width: `${(selectedRegion.projection.current / selectedRegion.projection.target) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-10 mt-8 relative z-10">
                        <div>
                          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5">Target Volume</p>
                          <p className="text-2xl font-black">{selectedRegion.projection.target.toLocaleString()} MT</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5">Stock Purity</p>
                          <p className="text-2xl font-black text-foodmax-lime">99.8%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Link 
                    to="/contact"
                    className="flex items-center justify-center gap-3 py-5 bg-foodmax-forest text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-foodmax-lime hover:text-foodmax-forest transition-all shadow-xl shadow-foodmax-forest/20 active:scale-95"
                  >
                    <Mail size={16} /> Request Quote
                  </Link>
                  <button 
                    className="flex items-center justify-center gap-3 py-5 bg-white text-foodmax-forest border-2 border-foodmax-forest/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-foodmax-forest transition-all hover:bg-gray-50 active:scale-95"
                  >
                    <Download size={16} /> Technical Dossier
                  </button>
                </div>
              </div>
            </div>

            {/* ADVISORY BOX - Refined */}
            <div className="bg-foodmax-forest rounded-[2.5rem] p-12 text-white relative overflow-hidden group shadow-2xl">
               {/* Decorative background element */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-foodmax-lime/10 -mr-32 -mt-32 rounded-full blur-3xl group-hover:bg-foodmax-lime/20 transition-colors duration-1000"></div>
               <div className="relative z-10">
                 <h4 className="text-2xl font-black mb-4 tracking-tight">Strategic Trade Support</h4>
                 <p className="text-sm text-white/60 mb-10 leading-relaxed font-medium">
                   Access localized market intelligence and multi-year production trends for long-term contract planning.
                 </p>
                 <Link to="/contact" className="inline-flex items-center gap-3 text-xs font-black text-foodmax-lime uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
                   Consult with Trade Desk <Globe size={16} />
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
