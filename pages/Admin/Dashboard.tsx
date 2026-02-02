
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
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
  RefreshCw
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { products, news, exportData, importData, resetToDefaults, isLoading } = useData();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [importStatus, setImportStatus] = useState<{message: string, type: 'success' | 'error' | null}>({message: '', type: null});

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `foodmax-export-${new Date().toISOString().split('T')[0]}.json`;
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
        setImportStatus({ message: 'Data imported successfully!', type: 'success' });
      } else {
        setImportStatus({ message: 'Invalid data format.', type: 'error' });
      }
      setTimeout(() => setImportStatus({ message: '', type: null }), 3000);
    };
    reader.readAsText(file);
  };

  const stats = [
    { label: 'Export Inventory', val: products.length, icon: Package, color: 'bg-blue-500' },
    { label: 'Market Reports', val: news.length, icon: FileText, color: 'bg-purple-500' },
    { label: 'Global Regions', val: '32', icon: Globe, color: 'bg-foodmax-forest' },
    { label: 'System Mode', val: 'Local Offline', icon: Database, color: 'bg-orange-500' }
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-foodmax-forest text-white p-6 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="flex flex-col mb-10 px-4">
          <div className="flex items-center">
            <span className="text-xl font-[900]">Food</span>
            <span className="text-xl font-[900] text-foodmax-lime">max</span>
          </div>
          <span className="text-[8px] font-bold text-white/40 tracking-[0.2em] uppercase">Staff Portal</span>
        </div>

        <nav className="space-y-2 flex-grow">
          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl font-bold text-sm">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link to="/admin/inventory" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold text-sm transition-colors">
            <Package size={18} /> Inventory
          </Link>
          <Link to="/admin/news" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold text-sm transition-colors">
            <FileText size={18} /> Insights
          </Link>
        </nav>

        {/* Branded Logout / Exit Section */}
        <div className="mt-auto pt-8 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] bg-white/5 hover:bg-white/10 transition-all group relative overflow-hidden"
          >
            <div className="relative">
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-black/20 group-hover:scale-105 transition-transform">
                <div className="flex items-center relative">
                  <span className="text-foodmax-forest font-[900] text-xl">F</span>
                  <div className="absolute -top-1.5 -right-1 flex gap-0.5 opacity-80 scale-75">
                    <div className="w-1.5 h-2.5 bg-foodmax-lime rounded-full rotate-[-25deg]"></div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-foodmax-lime rounded-full flex items-center justify-center border-2 border-foodmax-forest shadow-md">
                <LogOut size={10} className="text-foodmax-forest" />
              </div>
            </div>
            <div className="text-left">
               <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Operations Portal</p>
               <div className="flex items-center gap-1">
                 <p className="text-xs font-black text-white group-hover:text-foodmax-lime transition-colors">Exit to Home</p>
                 <ExternalLink size={10} className="text-white/20 group-hover:text-foodmax-lime transition-colors" />
               </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 md:p-12 overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Staff Overview</h1>
            <p className="text-gray-500 text-sm font-medium">Running in Local Storage mode for maximum reliability.</p>
          </div>
          <div className="flex gap-4">
             <button onClick={() => navigate('/admin/inventory')} className="px-6 py-3 bg-foodmax-forest text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
                <Plus size={16} /> New Export
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
                <div className="p-3 bg-foodmax-forest/5 text-foodmax-forest rounded-xl"><Database size={20} /></div>
                <h3 className="text-lg font-black tracking-tight">Data Management</h3>
              </div>
              
              <div className="space-y-4">
                <button 
                  onClick={handleExport}
                  className="w-full py-4 bg-gray-50 text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
                >
                  <Download size={14} /> Export JSON
                </button>
                
                <label className="w-full py-4 bg-gray-50 text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all cursor-pointer">
                  <Upload size={14} /> Import JSON
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
                   <Trash2 size={12} /> Reset to Defaults
                 </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Verified Inventory</h3>
              <Link to="/admin/inventory" className="text-xs font-black text-foodmax-forest hover:text-foodmax-lime flex items-center gap-1 uppercase tracking-widest">Global Catalog <ArrowRight size={14} /></Link>
            </div>
            <div className="space-y-4">
              {products.slice(0, 6).map(p => (
                <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all group">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={p.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt={p.name} />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-black text-gray-900">{p.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.category} / {p.subCategory}</p>
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
