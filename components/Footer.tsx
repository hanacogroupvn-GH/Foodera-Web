
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Linkedin, Shield } from 'lucide-react';
const Logo = '/logo-footer-white.png';

const WhatsAppIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.436 9.884-9.885 9.884m8.412-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.86 11.86 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.481-8.413" />
  </svg>
);

const WeChatIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3 5.55a.59.59 0 01.213.665l-.39 1.48a1.2 1.2 0 00-.038.213c0 .162.13.294.29.294a.3.3 0 00.15-.05l1.92-1.107a.86.86 0 01.71-.09 9.99 9.99 0 002.836.408c.256 0 .51-.012.76-.033a5.34 5.34 0 01-.176-1.354c0-3.638 3.53-6.588 7.885-6.588.256 0 .509.011.759.032C17.415 4.549 13.399 2.188 8.69 2.188zM5.785 6.591a1.031 1.031 0 110 2.062 1.031 1.031 0 010-2.062zm5.813 0a1.031 1.031 0 110 2.062 1.031 1.031 0 010-2.062zM17.115 9.83c-3.756 0-6.802 2.548-6.802 5.692 0 3.145 3.046 5.693 6.802 5.693a8.6 8.6 0 002.436-.351.74.74 0 01.61.076l1.581.911a.26.26 0 00.129.043c.137 0 .249-.111.249-.25a1 1 0 00-.033-.183l-.323-1.221a.5.5 0 01.181-.57C23.02 18.34 24 16.702 24 14.923c0-3.144-3.376-5.692-6.885-5.693zm-2.396 3.42a.858.858 0 110 1.717.858.858 0 010-1.717zm4.792 0a.858.858 0 110 1.717.858.858 0 010-1.717z" />
  </svg>
);
import { useLocale } from '../context/LocaleContext';
import { appRoutes } from '../lib/routes';
import { preserveVietnamesePlaceNamesDeep } from '../lib/preserveVietnamesePlaceNames';

const Footer: React.FC = () => {
  const { locale, setLocale } = useLocale();
  const rawCopy = locale === 'zh'
    ? {
        quickLinks: '产品系列',
        rice: '大米',
        coffee: '咖啡',
        cashew: '腰果',
        coconut: '椰子',
        pepper: '胡椒',
        durian: '榴莲',
        spices: '香料',
        headOffice: '我们的办公室',
        hqLabel: '总部 · 越南',
        address: '越南胡志明市西贡坊麦廷芝街6号',
        repOfficeLabel: '代表处 · 澳大利亚',
        repOfficeAddress: '269 North Terrace, Adelaide SA 5000, Australia',
        rights: 'VIET NAM FOOD ERA COMPANY LIMITED 保留所有权利。',
        staffPortal: 'CMS 管理后台 / 员工登录'
      }
    : {
        quickLinks: 'Product Portfolios',
        rice: 'Rice',
        coffee: 'Coffee',
        cashew: 'Cashew',
        coconut: 'Coconut',
        pepper: 'Pepper',
        durian: 'Durian',
        spices: 'Spices',
        headOffice: 'Our Offices',
        hqLabel: 'HQ · Vietnam',
        address: 'No. 6 Mac Dinh Chi St, Sai Gon Ward, Ho Chi Minh City, Vietnam',
        repOfficeLabel: 'Rep Office · Australia',
        repOfficeAddress: '269 North Terrace, Adelaide SA 5000, Australia',
        rights: 'VIET NAM FOOD ERA COMPANY LIMITED All Rights Reserved.',
        staffPortal: 'CMS Login / Staff Portal'
      };
  const copy = locale === 'zh' ? preserveVietnamesePlaceNamesDeep(rawCopy) : rawCopy;

  return (
    <footer className="bg-foodera-forest text-white pt-20 pb-10 border-t border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <img
          src="/media/about/rice-paddy.webp"
          alt=""
          className="w-full h-full object-cover opacity-30"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foodera-forest/55 via-foodera-forest/70 to-foodera-forest/85"></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div>
            <Link to={appRoutes.home} className="block mb-6 -mt-24">
              <img src={Logo} alt="FoodEra" className="h-56 w-auto md:h-72 object-contain" loading="lazy" decoding="async" />
            </Link>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/FoodEraVietnam"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-11 h-11 bg-white/15 text-white rounded-xl flex items-center justify-center hover:bg-foodera-lime hover:text-foodera-forest transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://www.linkedin.com/company/fooderavn/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-11 h-11 bg-white/15 text-white rounded-xl flex items-center justify-center hover:bg-foodera-lime hover:text-foodera-forest transition-colors"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="https://wa.me/84935587888"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-11 h-11 bg-white/15 text-white rounded-xl flex items-center justify-center hover:bg-foodera-lime hover:text-foodera-forest transition-colors"
              >
                <WhatsAppIcon size={20} />
              </a>
              <Link
                to={`${appRoutes.contact}#wechat`}
                aria-label="WeChat"
                className="w-11 h-11 bg-white/15 text-white rounded-xl flex items-center justify-center hover:bg-foodera-lime hover:text-foodera-forest transition-colors"
              >
                <WeChatIcon size={20} />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-foodera-lime font-black uppercase text-xs tracking-[0.2em] mb-8">{copy.quickLinks}</h4>
            <div className="grid grid-cols-2 gap-x-8">
              <ul className="space-y-4 text-sm font-medium">
                <li><Link to={appRoutes.productsByCategory('Rice')} className="text-white/80 hover:text-foodera-lime transition-colors">{copy.rice}</Link></li>
                <li><Link to={appRoutes.productsByCategory('Coffee')} className="text-white/80 hover:text-foodera-lime transition-colors">{copy.coffee}</Link></li>
                <li><Link to={appRoutes.productsByCategory('Cashew')} className="text-white/80 hover:text-foodera-lime transition-colors">{copy.cashew}</Link></li>
                <li><Link to={appRoutes.productsByCategory('Coconut')} className="text-white/80 hover:text-foodera-lime transition-colors">{copy.coconut}</Link></li>
              </ul>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link to={appRoutes.productsByCategory('Pepper')} className="text-white/80 hover:text-foodera-lime transition-colors">{copy.pepper}</Link></li>
                <li><Link to={appRoutes.productsByCategory('Durian')} className="text-white/80 hover:text-foodera-lime transition-colors">{copy.durian}</Link></li>
                <li><Link to={appRoutes.productsByCategory('Spices')} className="text-white/80 hover:text-foodera-lime transition-colors">{copy.spices}</Link></li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="text-foodera-lime font-black uppercase text-xs tracking-[0.2em] mb-8">{copy.headOffice}</h4>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3">{copy.hqLabel}</p>
                <ul className="space-y-3 text-sm font-medium">
                  <li className="flex items-start gap-3">
                    <MapPin size={20} className="text-foodera-lime flex-shrink-0" />
                    <span className="text-white/80">{copy.address}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone size={20} className="text-foodera-lime flex-shrink-0" />
                    <span className="text-white/80">+84 964 791 902</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail size={20} className="text-foodera-lime flex-shrink-0" />
                    <a href="mailto:export@foodera.vn?cc=support@foodera.vn" className="text-white/80 hover:text-foodera-lime transition-colors">export@foodera.vn</a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3">{copy.repOfficeLabel}</p>
                <ul className="space-y-3 text-sm font-medium">
                  <li className="flex items-start gap-3">
                    <MapPin size={20} className="text-foodera-lime flex-shrink-0" />
                    <span className="text-white/80">{copy.repOfficeAddress}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">&copy; {new Date().getFullYear()} {copy.rights}</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/60 uppercase tracking-widest">
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`transition-colors ${locale === 'en' ? 'text-foodera-lime font-black' : 'hover:text-white'}`}
              >
                EN
              </button>
              <span>/</span>
              <button
                type="button"
                onClick={() => setLocale('zh')}
                className={`transition-colors ${locale === 'zh' ? 'text-foodera-lime font-black' : 'hover:text-white'}`}
              >
                中文
              </button>
            </div>
            <Link
              to={appRoutes.login}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-foodera-lime hover:text-foodera-forest text-white/90 text-[11px] font-bold uppercase tracking-wider transition-all border border-white/20 shadow-xs"
              title={copy.staffPortal}
            >
              <Shield size={13} className="text-foodera-lime" />
              <span>{copy.staffPortal}</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
