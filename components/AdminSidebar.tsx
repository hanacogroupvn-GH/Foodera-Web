import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FileText,
  MapPinned,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
} from 'lucide-react';
import { appRoutes } from '../lib/routes';

interface AdminSidebarProps {
  onLogout: () => void;
  /** Called when "Tạo bài viết" is clicked under Product */
  onOpenInventoryForm?: () => void;
  /** Called when "Quản lí bài đăng" is clicked under Product (closes form) */
  onCloseInventoryForm?: () => void;
  /** Called when "Tạo bài viết" is clicked under SEO */
  onOpenNewsForm?: () => void;
  /** Called when "Quản lí bài đăng" is clicked under SEO (closes form) */
  onCloseNewsForm?: () => void;
  /** True when the Inventory create/edit form is currently open */
  isInventoryFormOpen?: boolean;
  /** True when the News create/edit form is currently open */
  isNewsFormOpen?: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  onLogout,
  onOpenInventoryForm,
  onCloseInventoryForm,
  onOpenNewsForm,
  onCloseNewsForm,
  isInventoryFormOpen = false,
  isNewsFormOpen = false,
}) => {
  const location = useLocation();
  const [productOpen, setProductOpen] = useState(
    location.pathname.startsWith(appRoutes.adminInventory)
  );
  const [seoOpen, setSeoOpen] = useState(
    location.pathname.startsWith(appRoutes.adminNews)
  );

  const isActive = (path: string) => location.pathname === path;
  const isSection = (path: string) => location.pathname.startsWith(path);

  const linkBase =
    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors';
  const linkActive = 'bg-white/15 text-white';
  const linkInactive = 'text-white/60 hover:text-white hover:bg-white/8';
  const subLinkBase =
    'flex items-center gap-2.5 pl-11 pr-4 py-2 rounded-xl text-xs font-semibold transition-colors';
  const subLinkActive = 'text-white bg-white/10';
  const subLinkInactive = 'text-white/40 hover:text-white hover:bg-white/5';

  return (
    <aside className="w-60 bg-foodera-forest text-white flex flex-col sticky top-0 h-screen shadow-2xl z-20 flex-shrink-0">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-1">
          <span className="text-lg font-[900]">Food</span>
          <span className="text-lg font-[900] text-foodera-lime">era</span>
        </div>
        <span className="text-[8px] font-bold text-white/30 tracking-[0.2em] uppercase">
          Staff Portal
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-grow px-4 py-5 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <Link
          to={appRoutes.admin}
          className={`${linkBase} ${isActive(appRoutes.admin) ? linkActive : linkInactive}`}
        >
          <LayoutDashboard size={17} />
          Dashboard
        </Link>

        {/* Product */}
        <div>
          <button
            type="button"
            onClick={() => setProductOpen((v) => !v)}
            className={`w-full ${linkBase} justify-between ${
              isSection(appRoutes.adminInventory) ? linkActive : linkInactive
            }`}
          >
            <span className="flex items-center gap-3">
              <Package size={17} />
              Product
            </span>
            {productOpen ? (
              <ChevronDown size={13} className="opacity-60" />
            ) : (
              <ChevronRight size={13} className="opacity-60" />
            )}
          </button>
          {productOpen && (
            <div className="mt-1 space-y-0.5">
              {/* Quản lí bài đăng */}
              {isSection(appRoutes.adminInventory) ? (
                // Same page: only close form if it's open; otherwise just show active style
                isInventoryFormOpen && onCloseInventoryForm ? (
                  <button
                    type="button"
                    onClick={onCloseInventoryForm}
                    className={`w-full ${subLinkBase} ${subLinkInactive}`}
                  >
                    <List size={13} />
                    Quản lí bài đăng
                  </button>
                ) : (
                  <span className={`${subLinkBase} ${subLinkActive} cursor-default`}>
                    <List size={13} />
                    Quản lí bài đăng
                  </span>
                )
              ) : (
                <Link
                  to={appRoutes.adminInventory}
                  className={`${subLinkBase} ${subLinkInactive}`}
                >
                  <List size={13} />
                  Quản lí bài đăng
                </Link>
              )}

              {/* Tạo bài viết */}
              {isSection(appRoutes.adminInventory) && onOpenInventoryForm ? (
                <button
                  type="button"
                  onClick={onOpenInventoryForm}
                  className={`w-full ${subLinkBase} ${
                    isInventoryFormOpen ? subLinkActive : subLinkInactive
                  }`}
                >
                  <Plus size={13} />
                  Tạo bài viết
                </button>
              ) : (
                <Link
                  to={`${appRoutes.adminInventory}#create`}
                  className={`${subLinkBase} ${subLinkInactive}`}
                >
                  <Plus size={13} />
                  Tạo bài viết
                </Link>
              )}
            </div>
          )}
        </div>

        {/* SEO (News/Insights) */}
        <div>
          <button
            type="button"
            onClick={() => setSeoOpen((v) => !v)}
            className={`w-full ${linkBase} justify-between ${
              isSection(appRoutes.adminNews) ? linkActive : linkInactive
            }`}
          >
            <span className="flex items-center gap-3">
              <FileText size={17} />
              SEO
            </span>
            {seoOpen ? (
              <ChevronDown size={13} className="opacity-60" />
            ) : (
              <ChevronRight size={13} className="opacity-60" />
            )}
          </button>
          {seoOpen && (
            <div className="mt-1 space-y-0.5">
              {/* Quản lí bài đăng */}
              {isSection(appRoutes.adminNews) ? (
                // Same page: only close form if it's open; otherwise just show active style
                isNewsFormOpen && onCloseNewsForm ? (
                  <button
                    type="button"
                    onClick={onCloseNewsForm}
                    className={`w-full ${subLinkBase} ${subLinkInactive}`}
                  >
                    <List size={13} />
                    Quản lí bài đăng
                  </button>
                ) : (
                  <span className={`${subLinkBase} ${subLinkActive} cursor-default`}>
                    <List size={13} />
                    Quản lí bài đăng
                  </span>
                )
              ) : (
                <Link
                  to={appRoutes.adminNews}
                  className={`${subLinkBase} ${subLinkInactive}`}
                >
                  <List size={13} />
                  Quản lí bài đăng
                </Link>
              )}

              {/* Tạo bài viết */}
              {isSection(appRoutes.adminNews) && onOpenNewsForm ? (
                <button
                  type="button"
                  onClick={onOpenNewsForm}
                  className={`w-full ${subLinkBase} ${
                    isNewsFormOpen ? subLinkActive : subLinkInactive
                  }`}
                >
                  <Plus size={13} />
                  Tạo bài viết
                </button>
              ) : (
                <Link
                  to={`${appRoutes.adminNews}#create`}
                  className={`${subLinkBase} ${subLinkInactive}`}
                >
                  <Plus size={13} />
                  Tạo bài viết
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Map Content */}
        <Link
          to={appRoutes.adminMapContent}
          className={`${linkBase} ${
            isSection(appRoutes.adminMapContent) ? linkActive : linkInactive
          }`}
        >
          <MapPinned size={17} />
          Map Content
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
              Operations Portal
            </p>
            <p className="text-xs font-black text-white group-hover:text-foodera-lime transition-colors truncate">
              Exit to Home
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
};
