
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe, Facebook, Linkedin, Youtube, Shield } from 'lucide-react';
import Logo from '../Logo-optimized.png';
import { useLocale } from '../context/LocaleContext';
import { appRoutes } from '../lib/routes';
import { preserveVietnamesePlaceNamesDeep } from '../lib/preserveVietnamesePlaceNames';

const Footer: React.FC = () => {
  const { locale } = useLocale();
  const rawCopy = locale === 'zh'
    ? {
        description: 'Foodmax 是一家领先的越南农产品出口商，连接本地农业优势与全球市场需求。',
        quickLinks: '快捷链接',
        legacy: '我们的传承',
        rice: '大米产品线',
        coffee: '咖啡产品线',
        cashew: '腰果产品线',
        compliance: '合规体系',
        quality: '质量标准',
        logistics: '全球物流',
        packaging: '包装规格',
        terms: '贸易条款',
        headOffice: '总部办公室',
        address: '越南胡志明市第一郡新定坊丁先皇街 17 号',
        rights: 'Foodmax Agriculture Export Co., Ltd. 保留所有权利。',
        staffPortal: '员工入口'
      }
    : {
        description: 'Foodmax is a premier Vietnamese exporter delivering high-grade agricultural products. We bridge the gap between local farming excellence and global market demands.',
        quickLinks: 'Quick Links',
        legacy: 'Our Legacy',
        rice: 'Rice Portfolios',
        coffee: 'Coffee Portfolios',
        cashew: 'Cashew Portfolios',
        compliance: 'Compliance',
        quality: 'Quality Standards',
        logistics: 'Global Logistics',
        packaging: 'Packaging Specs',
        terms: 'Terms of Trade',
        headOffice: 'Head Office',
        address: '17 Dinh Tien Hoang, Tan Dinh Ward, District 1, Ho Chi Minh City, Vietnam',
        rights: 'Foodmax Agriculture Export Co., Ltd. All Rights Reserved.',
        staffPortal: 'Staff Portal Access'
      };
  const copy = locale === 'zh' ? preserveVietnamesePlaceNamesDeep(rawCopy) : rawCopy;

  const BrandLogo = () => (
    <div className="mb-6 inline-flex -mt-24">
      <img
        src={Logo}
        alt="Foodmax"
        className="h-56 w-auto md:h-72 object-contain"
        loading="lazy"
        decoding="async"
      />
    </div>
  );

  return (
    <footer className="bg-white text-foodmax-forest pt-20 pb-10 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <Link to={appRoutes.home}>
              <BrandLogo />
            </Link>
            <p className="text-sm leading-relaxed mb-8 text-foodmax-forest/80">
              {copy.description}
            </p>
            <div className="flex space-x-4">
              <span aria-hidden="true" className="w-11 h-11 bg-gray-50 text-foodmax-forest/40 rounded-xl flex items-center justify-center cursor-default"><Facebook size={20} /></span>
              <a href="https://www.linkedin.com/in/hobinhnghia/" target="_blank" rel="noreferrer" className="w-11 h-11 bg-gray-50 text-foodmax-forest rounded-xl flex items-center justify-center hover:bg-foodmax-forest hover:text-white transition-all"><Linkedin size={20} /></a>
              <span aria-hidden="true" className="w-11 h-11 bg-gray-50 text-foodmax-forest/40 rounded-xl flex items-center justify-center cursor-default"><Youtube size={20} /></span>
            </div>
          </div>

          <div>
            <h4 className="text-foodmax-forest font-black uppercase text-xs tracking-[0.2em] mb-8">{copy.quickLinks}</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to={appRoutes.about} className="text-foodmax-forest/80 hover:text-foodmax-lime transition-colors">{copy.legacy}</Link></li>
              <li><Link to={appRoutes.productsByCategory('Rice')} className="text-foodmax-forest/80 hover:text-foodmax-lime transition-colors">{copy.rice}</Link></li>
              <li><Link to={appRoutes.productsByCategory('Coffee')} className="text-foodmax-forest/80 hover:text-foodmax-lime transition-colors">{copy.coffee}</Link></li>
              <li><Link to={appRoutes.productsByCategory('Cashew')} className="text-foodmax-forest/80 hover:text-foodmax-lime transition-colors">{copy.cashew}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-foodmax-forest font-black uppercase text-xs tracking-[0.2em] mb-8">{copy.compliance}</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to={appRoutes.operationsSection('quality')} className="text-foodmax-forest/80 hover:text-foodmax-lime transition-colors">{copy.quality}</Link></li>
              <li><Link to={appRoutes.operationsSection('logistics')} className="text-foodmax-forest/80 hover:text-foodmax-lime transition-colors">{copy.logistics}</Link></li>
              <li><Link to={appRoutes.operationsSection('packaging')} className="text-foodmax-forest/80 hover:text-foodmax-lime transition-colors">{copy.packaging}</Link></li>
              <li><Link to={appRoutes.operationsSection('terms')} className="text-foodmax-forest/80 hover:text-foodmax-lime transition-colors">{copy.terms}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-foodmax-forest font-black uppercase text-xs tracking-[0.2em] mb-8">{copy.headOffice}</h4>
            <ul className="space-y-5 text-sm font-medium">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-foodmax-forest flex-shrink-0" />
                <span className="text-foodmax-forest/80">{copy.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="text-foodmax-forest flex-shrink-0" />
                <span className="text-foodmax-forest/80">+84 964 791 902</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} className="text-foodmax-forest flex-shrink-0" />
                <a href="mailto:export@foodmax.vn?cc=support@foodmax.vn" className="text-foodmax-forest/80 hover:text-foodmax-lime transition-colors">export@foodmax.vn</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold text-foodmax-forest/60 uppercase tracking-widest">&copy; {new Date().getFullYear()} {copy.rights}</p>
          <div className="flex items-center gap-6">
            <Link to={appRoutes.login} className="flex items-center gap-2 text-[10px] font-black text-foodmax-forest/60 hover:text-foodmax-lime transition-colors uppercase tracking-widest">
              <Shield size={12} /> {copy.staffPortal}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
