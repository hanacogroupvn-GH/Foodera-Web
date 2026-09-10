import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPinned, LogOut } from 'lucide-react';
import { appRoutes } from '../lib/routes';
import { useLocale } from '../context/LocaleContext';

interface AdminSidebarProps {
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onLogout }) => {
  const { locale } = useLocale();
  const location = useLocation();

  const copy = {
    vi: {
      mapContent: 'Nội dung bản đồ',
      staffPortal: 'Trang nhân viên',
      operationsPortal: 'Cổng vận hành',
      exitHome: 'Quay lại Trang chủ',
    },
    en: {
      mapContent: 'Map Content',
      staffPortal: 'Staff Portal',
      operationsPortal: 'Operations Portal',
      exitHome: 'Exit to Home',
    },
    zh: {
      mapContent: '地图内容',
      staffPortal: '员工后台',
      operationsPortal: '运营后台',
      exitHome: '返回首页',
    }
  }[locale] || {
    mapContent: 'Nội dung bản đồ',
    staffPortal: 'Trang nhân viên',
    operationsPortal: 'Cổng vận hành',
    exitHome: 'Quay lại Trang chủ',
  };

  const isSection = (path: string) => location.pathname.startsWith(path);

  const linkBase =
    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors';
  const linkActive = 'bg-white/15 text-white';
  const linkInactive = 'text-white/60 hover:text-white hover:bg-white/8';

  return (
    <aside className="w-60 bg-foodera-forest text-white flex flex-col sticky top-0 h-screen shadow-2xl z-20 flex-shrink-0">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center h-11 mb-1">
          <img
            src="/logo-era.png"
            alt="FoodEra"
            className="h-11 w-auto object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <span className="text-[8px] font-bold text-white/30 tracking-[0.2em] uppercase">
          {copy.staffPortal}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-grow px-4 py-5 space-y-1 overflow-y-auto">
        <Link
          to={appRoutes.adminMapContent}
          className={`${linkBase} ${
            isSection(appRoutes.adminMapContent) ? linkActive : linkInactive
          }`}
        >
          <MapPinned size={17} />
          {copy.mapContent}
        </Link>
      </nav>

      {/* Exit */}
      <div className="px-4 py-5 border-t border-white/10">
        <Link
          to={appRoutes.home}
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group"
        >
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-foodera-forest font-[900] text-base">F</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-foodera-lime rounded-full flex items-center justify-center border-2 border-foodera-forest shadow">
              <LogOut size={8} className="text-foodera-forest" />
            </div>
          </div>
          <div className="text-left min-w-0">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">
              {copy.operationsPortal}
            </p>
            <p className="text-xs font-black text-white group-hover:text-foodera-lime transition-colors truncate">
              {copy.exitHome}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
};
