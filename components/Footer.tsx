
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe, Facebook, Linkedin, Instagram, Shield } from 'lucide-react';
import Logo from '../Logo.png';

const Footer: React.FC = () => {
  const BrandLogo = () => (
    <div className="bg-white rounded-2xl px-4 py-2 shadow-sm mb-6 inline-flex">
      <img
        src={Logo}
        alt="Foodmax"
        className="h-44 w-auto md:h-48 object-contain"
        loading="lazy"
        decoding="async"
      />
    </div>
  );

  return (
    <footer className="bg-foodmax-forest text-white/70 pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <Link to="/">
              <BrandLogo />
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
