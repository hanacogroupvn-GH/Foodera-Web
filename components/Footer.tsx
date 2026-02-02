
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe, Facebook, Linkedin, Instagram, Shield } from 'lucide-react';

const Footer: React.FC = () => {
  const BrandLogo = ({ isLight = false }) => (
    <div className="flex flex-col mb-6">
      <div className="flex items-end relative">
        <div className="flex items-center">
          <span className="text-2xl font-[900] tracking-tight leading-none" style={{ color: isLight ? '#ffffff' : '#006838' }}>
            F
            <span className="relative inline-flex flex-col items-center">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                <div className="w-2 h-3.5 bg-[#8cc63f] rounded-[100%_100%_0_0] rotate-[-25deg] origin-bottom shadow-sm"></div>
                <div className="w-1.5 h-3 bg-[#8cc63f] rounded-[100%_100%_0_0] rotate-[25deg] origin-bottom -translate-x-1 shadow-sm opacity-90"></div>
              </span>
              o
            </span>
            od
          </span>
          <span className="text-2xl font-[900] tracking-tight leading-none" style={{ color: '#8cc63f' }}>
            max
          </span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-foodmax-lime tracking-[0.1em] mt-1 uppercase">GOOD FOOD - GLOBAL TRUST</span>
    </div>
  );

  return (
    <footer className="bg-foodmax-forest text-white/70 pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <Link to="/">
              <BrandLogo isLight />
            </Link>
            <p className="text-sm leading-relaxed mb-8 text-white/60">
              Foodmax is a premier Vietnamese exporter delivering high-grade agricultural products. We bridge the gap between local farming excellence and global market demands.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center hover:bg-foodmax-lime hover:text-foodmax-forest transition-all"><Facebook size={20} /></a>
              <a href="#" className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center hover:bg-foodmax-lime hover:text-foodmax-forest transition-all"><Linkedin size={20} /></a>
              <a href="#" className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center hover:bg-foodmax-lime hover:text-foodmax-forest transition-all"><Instagram size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-8">Quick Links</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to="/about" className="hover:text-foodmax-lime transition-colors">Our Legacy</Link></li>
              <li><Link to="/products/rice" className="hover:text-foodmax-lime transition-colors">Rice Portfolios</Link></li>
              <li><Link to="/products/coffee" className="hover:text-foodmax-lime transition-colors">Coffee Portfolios</Link></li>
              <li><Link to="/products/agriculture" className="hover:text-foodmax-lime transition-colors">Agri-Products</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-8">Compliance</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to="/operations#quality" className="hover:text-foodmax-lime transition-colors">Quality Standards</Link></li>
              <li><Link to="/operations#logistics" className="hover:text-foodmax-lime transition-colors">Global Logistics</Link></li>
              <li><Link to="/operations#packaging" className="hover:text-foodmax-lime transition-colors">Packaging Specs</Link></li>
              <li><Link to="/operations#terms" className="hover:text-foodmax-lime transition-colors">Terms of Trade</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-8">Head Office</h4>
            <ul className="space-y-5 text-sm font-medium">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-foodmax-lime flex-shrink-0" />
                <span className="text-white/80">17 Dinh Tien Hoang, Tan Dinh Ward, District 1, Ho Chi Minh City, Vietnam</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="text-foodmax-lime flex-shrink-0" />
                <span className="text-white/80">+84 964 791 902</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} className="text-foodmax-lime flex-shrink-0" />
                <a href="mailto:export@foodmax.vn,support@foodmax.vn" className="text-white/80 hover:text-foodmax-lime transition-colors">export@foodmax.vn</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">&copy; {new Date().getFullYear()} Foodmax Agriculture Export Co., Ltd. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/login" className="flex items-center gap-2 text-[10px] font-black text-white/20 hover:text-foodmax-lime transition-colors uppercase tracking-widest">
              <Shield size={12} /> Staff Portal Access
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
