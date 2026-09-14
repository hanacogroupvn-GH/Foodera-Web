import React, { useState, useEffect } from 'react';
import { ExportStatItem } from '../../types';
import { api } from '../../lib/apiClient';
import { AdminSidebar } from '../../components/AdminSidebar';
import AgriExportLineChart from '../../components/AgriExportLineChart';
import defaultStatsData from '../../data/export-stats.json';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Scale,
  DollarSign,
  Calendar,
  Save,
  X,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const ExportStats: React.FC = () => {
  const [stats, setStats] = useState<ExportStatItem[]>(() => defaultStatsData as unknown as ExportStatItem[]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExportStatItem | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ExportStatItem>>({
    commodityCode: '',
    commodityNameEn: '',
    commodityNameVi: '',
    commodityNameZh: '',
    category: 'Agriculture',
    unit: 'Ton',
    reportingPeriod: '07/2026',
    monthVolume: undefined,
    monthValueUsd: 0,
    yearVolume: undefined,
    yearValueUsd: 0,
    momGrowthPercent: undefined,
    yoyGrowthPercent: undefined,
    sortOrder: 1,
    isActive: true,
    notes: ''
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getExportStats();
      if (res.stats && res.stats.length > 0) {
        setStats(res.stats);
      }
    } catch {
      // Keep static defaults on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      id: `stat-${Date.now()}`,
      commodityCode: '',
      commodityNameEn: '',
      commodityNameVi: '',
      commodityNameZh: '',
      category: 'Agriculture',
      unit: 'Ton',
      reportingPeriod: '07/2026',
      monthVolume: undefined,
      monthValueUsd: 0,
      yearVolume: undefined,
      yearValueUsd: 0,
      momGrowthPercent: undefined,
      yoyGrowthPercent: undefined,
      sortOrder: stats.length + 1,
      isActive: true,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ExportStatItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.commodityNameEn || !formData.commodityNameVi) {
      toast.error('Vui lòng nhập tên nông sản (tiếng Anh và tiếng Việt)');
      return;
    }

    const payload: ExportStatItem = {
      id: editingItem ? editingItem.id : (formData.id || `stat-${Date.now()}`),
      commodityCode: formData.commodityCode || formData.commodityNameEn.toLowerCase().replace(/\s+/g, '-'),
      commodityNameEn: formData.commodityNameEn,
      commodityNameVi: formData.commodityNameVi,
      commodityNameZh: formData.commodityNameZh || undefined,
      category: formData.category || 'Agriculture',
      unit: formData.unit === 'USD' ? 'USD' : 'Ton',
      reportingPeriod: formData.reportingPeriod || '07/2026',
      monthVolume: formData.monthVolume ? Number(formData.monthVolume) : undefined,
      monthValueUsd: Number(formData.monthValueUsd || 0),
      yearVolume: formData.yearVolume ? Number(formData.yearVolume) : undefined,
      yearValueUsd: Number(formData.yearValueUsd || 0),
      momGrowthPercent: formData.momGrowthPercent !== undefined ? Number(formData.momGrowthPercent) : undefined,
      yoyGrowthPercent: formData.yoyGrowthPercent !== undefined ? Number(formData.yoyGrowthPercent) : undefined,
      sortOrder: Number(formData.sortOrder ?? stats.length + 1),
      isActive: formData.isActive !== false,
      notes: formData.notes || undefined
    };

    try {
      await api.upsertExportStat(payload);
      toast.success(editingItem ? 'Đã cập nhật số liệu nông sản' : 'Đã thêm mới số liệu nông sản');
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu số liệu');
    }
  };

  const handleDelete = async (item: ExportStatItem) => {
    if (!window.confirm(`Bạn có chắc muốn xoá "${item.commodityNameVi}" khỏi biểu đồ?`)) {
      return;
    }

    try {
      await api.deleteExportStat(item.id);
      toast.success('Đã xoá số liệu');
      setStats((prev) => prev.filter((s) => s.id !== item.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi xoá');
    }
  };

  return (
    <div className="flex min-h-screen bg-foodera-stone-50 font-sans">
      <AdminSidebar onLogout={() => {}} />

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto space-y-8 min-w-0">
        {/* Top Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-foodera-stone-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-foodera-forest text-xs font-black uppercase tracking-wider mb-1">
              <FileSpreadsheet size={16} className="text-foodera-lime" />
              <span>CMS Thống kê Thị trường</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-foodera-forest">
              Quản trị Biểu đồ Sản lượng Xuất khẩu
            </h1>
            <p className="text-sm text-foodera-stone-500 mt-1">
              Cập nhật số liệu sản lượng (Tháng & Năm) của các mặt hàng nông sản từ Tổng cục Hải quan
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-foodera-stone-200 bg-foodera-stone-50 text-foodera-forest text-xs font-bold hover:bg-white transition-all"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Làm mới
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-foodera-forest text-white text-xs font-black hover:bg-foodera-forest/90 transition-all shadow-md shadow-foodera-forest/20"
            >
              <Plus size={15} />
              Thêm Nông sản Mới
            </button>
          </div>
        </div>

        {/* Live Preview of Chart */}
        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-foodera-forest">
              Xem trước Biểu đồ Trực tiếp (Live Chart Preview)
            </h2>
            <span className="text-xs text-foodera-stone-500">
              Thay đổi số liệu bên dưới sẽ cập nhật ngay vào biểu đồ này
            </span>
          </div>
          <AgriExportLineChart data={stats} />
        </div>

        {/* Data Management Table */}
        <div className="bg-white rounded-3xl border border-foodera-stone-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-foodera-stone-100 flex items-center justify-between">
            <h3 className="text-lg font-black text-foodera-forest">
              Danh sách Số liệu Nông sản ({stats.length} mặt hàng)
            </h3>
            <span className="text-xs font-semibold px-3 py-1 bg-foodera-lime/20 text-foodera-forest rounded-full">
              Kỳ báo cáo: 07/2026
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-foodera-stone-50 text-foodera-stone-600 font-bold border-b border-foodera-stone-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Tên Nông sản</th>
                  <th className="py-3.5 px-4">Đơn vị</th>
                  <th className="py-3.5 px-4">Sản lượng Tháng</th>
                  <th className="py-3.5 px-4">Kim ngạch Tháng</th>
                  <th className="py-3.5 px-4">Sản lượng Năm</th>
                  <th className="py-3.5 px-4">Kim ngạch Năm</th>
                  <th className="py-3.5 px-4">MoM / YoY</th>
                  <th className="py-3.5 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foodera-stone-100">
                {stats.map((item, index) => (
                  <tr key={item.id} className="hover:bg-foodera-stone-50/60 transition-colors">
                    <td className="py-4 px-4 font-bold text-foodera-stone-400">
                      {item.sortOrder || index + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-foodera-forest text-sm">
                        {item.commodityNameVi}
                      </div>
                      <div className="text-[11px] text-foodera-stone-500 font-medium">
                        {item.commodityNameEn} {item.commodityNameZh ? `• ${item.commodityNameZh}` : ''}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-foodera-stone-100 font-bold text-foodera-stone-700">
                        {item.unit}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-emerald-800">
                      {item.monthVolume != null ? `${item.monthVolume.toLocaleString()} Tấn` : '—'}
                    </td>
                    <td className="py-4 px-4 font-bold text-foodera-forest">
                      ${(item.monthValueUsd / 1e6).toFixed(1)}M USD
                    </td>
                    <td className="py-4 px-4 font-black text-emerald-950">
                      {item.yearVolume != null ? `${item.yearVolume.toLocaleString()} Tấn` : '—'}
                    </td>
                    <td className="py-4 px-4 font-black text-foodera-forest">
                      ${(item.yearValueUsd / 1e6).toFixed(1)}M USD
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        {item.momGrowthPercent != null && (
                          <div
                            className={`font-bold flex items-center gap-1 ${
                              item.momGrowthPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {item.momGrowthPercent >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            MoM: {item.momGrowthPercent}%
                          </div>
                        )}
                        {item.yoyGrowthPercent != null && (
                          <div
                            className={`font-bold flex items-center gap-1 ${
                              item.yoyGrowthPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {item.yoyGrowthPercent >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            YoY: {item.yoyGrowthPercent}%
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-xl hover:bg-foodera-stone-200/60 text-foodera-stone-600 hover:text-foodera-forest transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors"
                          title="Xoá"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Form for Add / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8">
              <div className="flex items-center justify-between pb-4 border-b border-foodera-stone-100">
                <h3 className="text-xl font-black text-foodera-forest">
                  {editingItem ? 'Chỉnh sửa Số liệu Nông sản' : 'Thêm Mặt hàng Nông sản Mới'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-2xl hover:bg-foodera-stone-100 text-foodera-stone-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foodera-stone-700 mb-1">
                      Tên tiếng Việt *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.commodityNameVi || ''}
                      onChange={(e) => setFormData({ ...formData, commodityNameVi: e.target.value })}
                      placeholder="Ví dụ: Gạo ST25, Cà phê Robusta..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-foodera-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-foodera-forest/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foodera-stone-700 mb-1">
                      Tên tiếng Anh *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.commodityNameEn || ''}
                      onChange={(e) => setFormData({ ...formData, commodityNameEn: e.target.value })}
                      placeholder="Ví dụ: Rice, Coffee..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-foodera-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-foodera-forest/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foodera-stone-700 mb-1">
                      Tên tiếng Trung (Zh)
                    </label>
                    <input
                      type="text"
                      value={formData.commodityNameZh || ''}
                      onChange={(e) => setFormData({ ...formData, commodityNameZh: e.target.value })}
                      placeholder="Ví dụ: 大米, 咖啡..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-foodera-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-foodera-forest/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foodera-stone-700 mb-1">
                      Đơn vị tính
                    </label>
                    <select
                      value={formData.unit || 'Ton'}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'Ton' | 'USD' })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-foodera-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-foodera-forest/20"
                    >
                      <option value="Ton">Tấn (Ton)</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foodera-stone-700 mb-1">
                      Kỳ báo cáo
                    </label>
                    <input
                      type="text"
                      value={formData.reportingPeriod || '07/2026'}
                      onChange={(e) => setFormData({ ...formData, reportingPeriod: e.target.value })}
                      placeholder="07/2026"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-foodera-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-foodera-forest/20"
                    />
                  </div>
                </div>

                {/* Values Month & Year */}
                <div className="p-4 bg-foodera-stone-50 rounded-2xl border border-foodera-stone-200/70 space-y-4">
                  <div className="text-xs font-black text-foodera-forest uppercase tracking-wider">
                    Số liệu Tháng & Lũy kế Năm
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-foodera-stone-700 mb-1">
                        Sản lượng Tháng (Tấn)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.monthVolume ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            monthVolume: e.target.value ? Number(e.target.value) : undefined
                          })
                        }
                        placeholder="Ví dụ: 471814"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-foodera-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-foodera-forest/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foodera-stone-700 mb-1">
                        Kim ngạch Tháng (USD) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={formData.monthValueUsd ?? ''}
                        onChange={(e) =>
                          setFormData({ ...formData, monthValueUsd: Number(e.target.value) })
                        }
                        placeholder="Ví dụ: 241109140"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-foodera-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-foodera-forest/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-foodera-stone-700 mb-1">
                        Sản lượng Lũy kế Năm (Tấn)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.yearVolume ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            yearVolume: e.target.value ? Number(e.target.value) : undefined
                          })
                        }
                        placeholder="Ví dụ: 5496364"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-foodera-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-foodera-forest/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foodera-stone-700 mb-1">
                        Kim ngạch Lũy kế Năm (USD) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={formData.yearValueUsd ?? ''}
                        onChange={(e) =>
                          setFormData({ ...formData, yearValueUsd: Number(e.target.value) })
                        }
                        placeholder="Ví dụ: 2623568274"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-foodera-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-foodera-forest/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Growth Rates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foodera-stone-700 mb-1">
                      Tăng trưởng MoM (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.momGrowthPercent ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          momGrowthPercent: e.target.value ? Number(e.target.value) : undefined
                        })
                      }
                      placeholder="Ví dụ: -35.8"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-foodera-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-foodera-forest/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foodera-stone-700 mb-1">
                      Tăng trưởng YoY (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.yoyGrowthPercent ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          yoyGrowthPercent: e.target.value ? Number(e.target.value) : undefined
                        })
                      }
                      placeholder="Ví dụ: -7.1"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-foodera-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-foodera-forest/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foodera-stone-700 mb-1">
                      Thứ tự hiển thị
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder ?? 1}
                      onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-foodera-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-foodera-forest/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-foodera-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-foodera-stone-200 text-xs font-bold text-foodera-stone-600 hover:bg-foodera-stone-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-foodera-forest text-white text-xs font-black hover:bg-foodera-forest/90 shadow-md shadow-foodera-forest/20"
                  >
                    <Save size={15} />
                    Lưu Số liệu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ExportStats;
