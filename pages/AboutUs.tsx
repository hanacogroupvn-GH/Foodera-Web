
import React from 'react';
import Logo from '../Logo.png';
import { ShieldCheck, Globe, Handshake, Leaf, Wheat, Coffee, Users } from 'lucide-react';

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
      {/* 1. HERO */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 border-b border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-[900] text-gray-900 mb-8 tracking-tight leading-tight">
                About Foodmax
              </h1>
              <div className="h-1 w-24 bg-foodmax-lime mb-8"></div>
              <p className="text-lg md:text-2xl text-gray-600 font-medium leading-relaxed">
                Foodmax is dedicated to elevating Vietnamese agricultural products to the global marketplace. With deep respect for
                Vietnam’s farming traditions and a forward-looking mindset, we connect international buyers with ingredients that
                embody quality, reliability, and natural excellence.
              </p>
            </div>
            <div className="lg:pl-8">
              <div className="aspect-[4/5] bg-gray-100 rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
                <img
                  src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=1200"
                  alt="Coffee beans"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gray-50 -z-0 hidden lg:block"></div>
      </section>

      {/* 2. STORY & SUPPLY CHAIN */}
      <section className="py-20 md:py-24 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/5] bg-gray-100 rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
                <img
                  src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&q=80&w=1200"
                  alt="Vietnamese agriculture"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6">Our Foundation</h2>
              <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 tracking-tight">
                Sustainable Value Across the Supply Chain
              </h3>
              <p className="text-base md:text-lg text-gray-600 mb-6 leading-relaxed font-medium">
                Founded with the vision of creating sustainable value across the supply chain, Foodmax works hand in hand with
                reputable growers, cooperatives, and processing facilities throughout Vietnam.
              </p>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed font-medium">
                We carefully oversee every step — from sourcing and quality control to logistics — ensuring that our products
                consistently meet the expectations of today’s competitive international markets. Our commitment goes beyond trade;
                we aim to contribute positively to farming communities while promoting responsible and sustainable agricultural practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE OFFERINGS */}
      <section className="py-20 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6">Core Products</h2>
            <h3 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
              Vietnam’s Most Sought-After Exports
            </h3>
            <p className="text-base md:text-lg text-gray-500 mt-4 max-w-3xl mx-auto font-medium">
              Each product is chosen not only for its commercial value but for its ability to represent the distinctive flavors
              and agricultural strength of Vietnam.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-foodmax-forest/5 rounded-xl flex items-center justify-center text-foodmax-forest mb-5">
                <Wheat size={22} />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-2">Premium Rice</h4>
              <p className="text-sm text-gray-500 font-medium">Carefully selected varieties with consistent grain quality and aroma.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-foodmax-forest/5 rounded-xl flex items-center justify-center text-foodmax-forest mb-5">
                <Coffee size={22} />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-2">Coffee Beans</h4>
              <p className="text-sm text-gray-500 font-medium">High-grade beans with balanced profiles and export-ready consistency.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-foodmax-forest/5 rounded-xl flex items-center justify-center text-foodmax-forest mb-5">
                <Leaf size={22} />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-2">Coconut Milk</h4>
              <p className="text-sm text-gray-500 font-medium">Rich, creamy coconut milk made to international food standards.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-foodmax-forest/5 rounded-xl flex items-center justify-center text-foodmax-forest mb-5">
                <Leaf size={22} />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-2">Black & White Pepper</h4>
              <p className="text-sm text-gray-500 font-medium">Aromatic, clean, and carefully processed to preserve flavor.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-foodmax-forest/5 rounded-xl flex items-center justify-center text-foodmax-forest mb-5">
                <Leaf size={22} />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-2">Cashew Kernels</h4>
              <p className="text-sm text-gray-500 font-medium">High-grade kernels with strict quality control and uniform grading.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-foodmax-forest/5 rounded-xl flex items-center justify-center text-foodmax-forest mb-5">
                <Globe size={22} />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-2">Global Market Fit</h4>
              <p className="text-sm text-gray-500 font-medium">Specifications tailored for importers, distributors, and manufacturers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TEAM MEMBERS */}
      <section className="py-20 md:py-24 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 flex items-center justify-center gap-2">
              <Users size={14} className="text-foodmax-lime" /> Key Members
            </h2>
            <h3 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">The Export Leadership Team</h3>
            <p className="text-base md:text-lg text-gray-500 mt-4 max-w-2xl mx-auto font-medium">
              Meet the strategic architects driving Vietnam's agricultural excellence to the world stage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-[2rem] overflow-hidden border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
              >
                <div className="aspect-[4/5] overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-700">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foodmax-forest/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-7">
                  <h4 className="text-2xl font-black text-gray-900 mb-1 group-hover:text-foodmax-forest transition-colors">{member.name}</h4>
                  <p className="text-xs font-black text-foodmax-forest uppercase tracking-[0.2em] mb-3">{member.title}</p>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-3 group-hover:text-gray-700 transition-colors">
                    {member.highlight}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PARTNERSHIP & PRINCIPLES */}
      <section className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6">Our Commitment</h2>
              <h3 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
                Partnerships Built on Transparency
              </h3>
              <p className="text-base md:text-lg text-gray-600 mb-6 leading-relaxed font-medium">
                At Foodmax, we believe that strong partnerships are built on transparency, consistency, and mutual growth.
                Whether serving importers, distributors, or food manufacturers, we approach every collaboration with professionalism
                and long-term commitment.
              </p>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed font-medium">
                By combining local expertise with global standards, our mission is simple: to deliver dependable agricultural
                solutions while sharing the true essence of Vietnam with customers around the world.
              </p>
            </div>
            <div className="bg-foodmax-forest rounded-[2.5rem] p-10 md:p-12 text-white relative overflow-hidden">
              <h4 className="text-[10px] font-black text-foodmax-lime uppercase tracking-[0.4em] mb-6">Core Principles</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <ShieldCheck size={20} className="text-foodmax-lime" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest">Quality Without Compromise</p>
                    <p className="text-xs text-white/70 mt-1">Consistent standards from farm to shipment.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <Leaf size={20} className="text-foodmax-lime" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest">Service With Integrity</p>
                    <p className="text-xs text-white/70 mt-1">Responsible sourcing and responsive support.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <Handshake size={20} className="text-foodmax-lime" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest">Partnerships That Last</p>
                    <p className="text-xs text-white/70 mt-1">Mutual growth with long-term focus.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CLOSING */}
      <section className="py-24 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-8">Looking Forward</h2>
          <h3 className="text-3xl md:text-5xl font-black text-gray-900 mb-8 tracking-tight">
            Sharing Vietnam’s Essence With The World
          </h3>
          <p className="text-lg text-gray-500 mb-10 font-medium leading-relaxed">
            As we continue to grow, Foodmax remains guided by three core principles — quality without compromise, service with
            integrity, and partnerships that last.
          </p>
          <div className="pt-10 border-t border-gray-100 mt-10"></div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
