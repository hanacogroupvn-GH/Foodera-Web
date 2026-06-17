
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { getCategoryLabel, localizeProduct } from '../../lib/contentLocalization';
import { appRoutes } from '../../lib/routes';
import { repairMojibakeDeep } from '../../lib/repairMojibake';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Users, 
  LogOut, 
  Plus, 
  ArrowRight,
  Globe,
  Database,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Trash2,
  ExternalLink,
  Settings,
  RefreshCw,
  MapPinned
} from 'lucide-react';
import { AdminSidebar } from '../../components/AdminSidebar';

const AdminDashboard: React.FC = () => {
  const { products, news, exportData, importData, resetToDefaults, backendMode } = useData();
  const { logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const navigate = useNavigate();
  const isTursoMode = backendMode === 'turso';
  const isLocalBackendMode = backendMode === 'local';
  
  const [importStatus, setImportStatus] = useState<{message: string, type: 'success' | 'error' | null}>({message: '', type: null});
  const rawCopy =
    locale === 'vi'
      ? {
          staffPortal: 'Trang nhân viên',
          dashboard: 'Tổng quan',
          inventory: 'Sản phẩm',
          insights: 'SEO',
          managePosts: 'Quản lý bài đăng',
          createPost: 'Tạo bài viết',
          mapContent: 'Nội dung bản đồ',
          operationsPortal: 'Cổng vận hành',
          exitHome: 'Quay lại Trang chủ',
          pageTitle: 'Tổng quan Hệ thống',
          pageDesc: 'Trạng thái máy chủ được phát hiện tự động.',
          newExport: 'Thêm sản phẩm',
          stats: ['Kho hàng xuất khẩu', 'Báo cáo thị trường', 'Vùng toàn cầu', 'Chế độ hệ thống'],
          localOffline: 'Chế độ',
          dataManagement: 'Quản lý dữ liệu',
          exportJson: 'Xuất dữ liệu JSON',
          importJson: 'Nhập dữ liệu JSON',
          importSuccess: 'Nhập dữ liệu thành công!',
          importError: 'Định dạng dữ liệu không hợp lệ.',
          resetDefaults: 'Đặt lại dữ liệu mặc định',
          verifiedInventory: 'Kho hàng đã xác minh',
          globalCatalog: 'Danh mục toàn cầu',
          cmsLanguage: 'Ngôn ngữ CMS'
        }
      : locale === 'zh'
      ? {
          staffPortal: '员工后台',
          dashboard: '总览',
          inventory: 'Product',
          insights: 'SEO',
          managePosts: 'Quản lý bài đăng',
          createPost: 'Tạo bài viết',
          mapContent: '地图内容',
          operationsPortal: '运营后台',
          exitHome: '返回首页',
          pageTitle: '后台概览',
          pageDesc: '当前运行于本地存储模式，以获得更高稳定性。',
          newExport: '新增产品',
          stats: ['出口库存', '市场报告', '全球区域', '系统模式'],
          localOffline: '本地离线',
          dataManagement: '数据管理',
          exportJson: '导出 JSON',
          importJson: '导入 JSON',
          importSuccess: '数据导入成功！',
          importError: '数据格式无效。',
          resetDefaults: '恢复默认数据',
          verifiedInventory: '已验证库存',
          globalCatalog: '全球目录',
          cmsLanguage: 'CMS 语言'
        }
      : {
          staffPortal: 'Staff Portal',
          dashboard: 'Dashboard',
          inventory: 'Product',
          insights: 'SEO',
          managePosts: 'Manage',
          createPost: 'Create',
          mapContent: 'Map Content',
          operationsPortal: 'Operations Portal',
          exitHome: 'Exit to Home',
          pageTitle: 'Staff Overview',
          pageDesc: 'Backend status is detected automatically.',
          newExport: 'New Export',
          stats: ['Export Inventory', 'Market Reports', 'Global Regions', 'System Mode'],
          localOffline: 'Mode',
          dataManagement: 'Data Management',
          exportJson: 'Export JSON',
          importJson: 'Import JSON',
          importSuccess: 'Data imported successfully!',
          importError: 'Invalid data format.',
          resetDefaults: 'Reset to Defaults',
          verifiedInventory: 'Verified Inventory',
          globalCatalog: 'Global Catalog',
          cmsLanguage: 'CMS Language'
        };
  const baseCopy = locale === 'zh' ? repairMojibakeDeep(rawCopy) : rawCopy;
  const computedCopy = {
    ...baseCopy,
    pageDesc:
      locale === 'vi'
        ? isTursoMode
          ? 'Đã kết nối cơ sở dữ liệu đám mây Turso và quy trình CMS.'
          : 'Cơ sở dữ liệu đám mây Turso chưa sẵn sàng, đang chạy ở chế độ dự phòng.'
        : locale === 'zh'
        ? isTursoMode
          ? '已连接 Turso 云端内容库与 CMS 工作流。'
          : 'Turso 后端暂未就绪，当前使用内置回退数据。'
        : isTursoMode
        ? 'Connected to Turso for live CMS data and content workflows.'
        : 'Turso is unavailable, so the CMS is running in bundled fallback mode.',
    localOffline:
      locale === 'vi'
        ? isTursoMode
          ? 'Đám mây Turso'
          : 'Chế độ dự phòng'
        : locale === 'zh'
        ? isTursoMode
          ? 'Turso 云端'
          : '回退模式'
        : isTursoMode
        ? 'Turso Cloud'
        : 'Fallback Mode'
  };

  const copy = { ...computedCopy };

  if (isLocalBackendMode) {
    copy.pageDesc =
      locale === 'vi'
        ? 'Đang chạy CMS trên cơ sở dữ liệu SQLite cục bộ để phát triển.'
        : locale === 'zh'
        ? '当前使用本地 SQLite 内容库运行 CMS，适用于本地开发与验证。'
        : 'Running the CMS on a local SQLite database for development.';
    copy.localOffline = locale === 'vi' ? 'SQLite cục bộ' : locale === 'zh' ? '本地 SQLite' : 'Local SQLite';
  }

  const handleLogout = () => {
    logout();
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `foodera-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await importData(content);
      if (success) {
        setImportStatus({ message: copy.importSuccess, type: 'success' });
      } else {
        setImportStatus({ message: copy.importError, type: 'error' });
      }
      setTimeout(() => setImportStatus({ message: '', type: null }), 3000);
    };
    reader.readAsText(file);
  };

  const stats = [
    { label: copy.stats[0], val: products.length, icon: Package, color: 'bg-blue-500' },
    { label: copy.stats[1], val: news.length, icon: FileText, color: 'bg-purple-500' },
    { label: copy.stats[2], val: '32', icon: Globe, color: 'bg-foodera-forest' },
    { label: copy.stats[3], val: copy.localOffline, icon: Database, color: isTursoMode ? 'bg-foodera-forest' : 'bg-orange-500' }
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <AdminSidebar onLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-grow p-8 md:p-12 overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{copy.pageTitle}</h1>
            <p className="text-gray-500 text-sm font-medium">{copy.pageDesc}</p>
          </div>
          <div className="flex gap-4 items-center">
             <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                <span>{copy.cmsLanguage}</span>
                <button type="button" onClick={() => setLocale('vi')} className={locale === 'vi' ? 'text-foodera-forest' : ''}>
                  VIE
                </button>
                <span>/</span>
                <button type="button" onClick={() => setLocale('en')} className={locale === 'en' ? 'text-foodera-forest' : ''}>
                  EN
                </button>
                <span>/</span>
                <button type="button" onClick={() => setLocale('zh')} className={locale === 'zh' ? 'text-foodera-forest' : ''}>
                  CN
                </button>
             </div>
             <button
               onClick={() => navigate(appRoutes.adminMapContent)}
               className="px-6 py-3 border border-foodera-forest/15 bg-white text-foodera-forest rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm hover:border-foodera-forest hover:bg-foodera-forest hover:text-white transition-all"
             >
                <MapPinned size={16} /> {copy.mapContent}
             </button>
             <button onClick={() => navigate(appRoutes.adminInventory)} className="px-6 py-3 bg-foodera-forest text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
                <Plus size={16} /> {copy.newExport}
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-200">
              <div className={`w-12 h-12 ${stat.color} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                <stat.icon size={24} />
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900">{stat.val}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            {/* Backup Card */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-foodera-forest/5 text-foodera-forest rounded-xl"><Database size={20} /></div>
                <h3 className="text-lg font-black tracking-tight">{copy.dataManagement}</h3>
              </div>
              
              <div className="space-y-4">
                <button 
                  onClick={handleExport}
                  className="w-full py-4 bg-gray-50 text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
                >
                  <Download size={14} /> {copy.exportJson}
                </button>
                
                <label className="w-full py-4 bg-gray-50 text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all cursor-pointer">
                  <Upload size={14} /> {copy.importJson}
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>

                {importStatus.type && (
                  <div className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${importStatus.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {importStatus.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                    {importStatus.message}
                  </div>
                )}
              </div>

              <div className="mt-8 border-t border-gray-50 pt-6">
                 <button 
                   onClick={resetToDefaults}
                   className="w-full py-2 text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                 >
                   <Trash2 size={12} /> {copy.resetDefaults}
                 </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{copy.verifiedInventory}</h3>
              <Link to={appRoutes.adminInventory} className="text-xs font-black text-foodera-forest hover:text-foodera-lime flex items-center gap-1 uppercase tracking-widest">{copy.globalCatalog} <ArrowRight size={14} /></Link>
            </div>
            <div className="space-y-4">
              {products.slice(0, 6).map(p => (
                <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all group">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={p.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt={localizeProduct(p, locale).name} />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-black text-gray-900">{localizeProduct(p, locale).name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {getCategoryLabel(p.category, locale)} / {localizeProduct(p, locale).subCategory}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Simplified icon component helper since X was used in previously provided snippets
const X = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default AdminDashboard;
