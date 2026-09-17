import React, { useState, useEffect, useMemo } from 'react';
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
  TrendingDown,
  CalendarPlus,
  Copy
} from 'lucide-react';

const ExportStats: React.FC = () => {
  const [stats, setStats] = useState<ExportStatItem[]>(() => defaultStatsData as unknown as ExportStatItem[]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExportStatItem | null>(null);
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('all');

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

  const availablePeriods = useMemo(() => {
    const periods = Array.from(new Set(stats.map((s) => s.reportingPeriod).filter(Boolean)));
    return periods.sort((a, b) => {
      const [mA, yA] = a.split('/').map(Number);
      const [mB, yB] = b.split('/').map(Number);
      if (yA !== yB) return (yB || 0) - (yA || 0);
      return (mB || 0) - (mA || 0);
    });
  }, [stats]);

  const filteredStats = useMemo(() => {
    if (selectedPeriodFilter === 'all') return stats;
    return stats.filter((s) => s.reportingPeriod === selectedPeriodFilter);
  }, [stats, selectedPeriodFilter]);

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

  const defaultNextPeriod = useMemo(() => {
    if (availablePeriods.length === 0) return '08/2026';
    const latest = availablePeriods[0];
    const [mStr, yStr] = latest.split('/');
    const m = parseInt(mStr, 10);
    const y = parseInt(yStr, 10);
    if (!isNaN(m) && !isNaN(y)) {
      if (m === 12) {
        return `01/${y + 1}`;
      }
      const nextM = m + 1;
      return `${nextM < 10 ? `0${nextM}` : nextM}/${y}`;
    }
    return '08/2026';
  }, [availablePeriods]);

  // Init New Month Modal State
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [newPeriodInput, setNewPeriodInput] = useState('');
  const [baselinePeriod, setBaselinePeriod] = useState('');
  const [initMode, setInitMode] = useState<'template' | 'blank'>('template');
  const [isInitializing, setIsInitializing] = useState(false);

  const handleOpenInitModal = () => {
    setNewPeriodInput(defaultNextPeriod);
    setBaselinePeriod(availablePeriods[0] || '07/2026');
    setInitMode('template');
    setIsInitModalOpen(true);
  };

  const handleInitNewMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    const period = newPeriodInput.trim();
    if (!/^\d{1,2}\/\d{4}$/.test(period)) {
      toast.error('Kỳ báo cáo không đúng định dạng MM/YYYY (Ví dụ: 08/2026)');
      return;
    }

    const [mPart, yPart] = period.split('/');
    const mNum = parseInt(mPart, 10);
    if (mNum < 1 || mNum > 12) {
      toast.error('Tháng phải từ 01 đến 12');
      return;
    }
    const formattedPeriod = `${mNum < 10 ? `0${mNum}` : mNum}/${yPart}`;

    // Check if period already exists
    const existingForPeriod = stats.filter((s) => s.reportingPeriod === formattedPeriod);
    if (existingForPeriod.length > 0) {
      if (!window.confirm(`Kỳ ${formattedPeriod} đã có ${existingForPeriod.length} mặt hàng. Bạn có muốn ghi đè/tạo lại không?`)) {
        return;
      }
    }

    setIsInitializing(true);
    try {
      let sourceItems = stats.filter((s) => s.reportingPeriod === baselinePeriod);
      if (sourceItems.length === 0) {
        sourceItems = stats.slice(0, 7);
      }

      const periodSafe = formattedPeriod.replace(/[^a-zA-Z0-9]/g, '-');

      for (const item of sourceItems) {
        const code = item.commodityCode || item.commodityNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const newItem: ExportStatItem = {
          id: `${code}-${periodSafe}`,
          commodityCode: code,
          commodityNameEn: item.commodityNameEn,
          commodityNameVi: item.commodityNameVi,
          commodityNameZh: item.commodityNameZh,
          category: item.category,
          unit: item.unit,
          reportingPeriod: formattedPeriod,
          monthVolume: initMode === 'template' ? item.monthVolume : (item.unit === 'USD' ? null : 0),
          monthValueUsd: initMode === 'template' ? item.monthValueUsd : 0,
          yearVolume: initMode === 'template' ? item.yearVolume : (item.unit === 'USD' ? null : 0),
          yearValueUsd: initMode === 'template' ? item.yearValueUsd : 0,
          momGrowthPercent: undefined,
          yoyGrowthPercent: undefined,
          sortOrder: item.sortOrder,
          isActive: true,
          notes: `Tổng cục Hải quan - Tháng ${formattedPeriod}`
        };
        await api.upsertExportStat(newItem);
      }

      toast.success(`Đã khởi tạo thành công kỳ ${formattedPeriod} với ${sourceItems.length} mặt hàng!`);
      setIsInitModalOpen(false);
      await loadData();
      setSelectedPeriodFilter(formattedPeriod);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi khởi tạo kỳ mới');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDeletePeriod = async (periodToDelete: string) => {
    const itemsToDelete = stats.filter((s) => s.reportingPeriod === periodToDelete);
    if (itemsToDelete.length === 0) return;
    if (!window.confirm(`Bạn có chắc muốn xoá toàn bộ ${itemsToDelete.length} mặt hàng của kỳ "${periodToDelete}"?`)) {
      return;
    }

    try {
      for (const item of itemsToDelete) {
        await api.deleteExportStat(item.id);
      }
      toast.success(`Đã xoá kỳ ${periodToDelete}`);
      setSelectedPeriodFilter('all');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi xoá kỳ');
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    const defaultPeriod = selectedPeriodFilter !== 'all'
      ? selectedPeriodFilter
      : availablePeriods[0] || '07/2026';
    setFormData({
      id: `stat-${Date.now()}`,
      commodityCode: '',
      commodityNameEn: '',
      commodityNameVi: '',
      commodityNameZh: '',
      category: 'Agriculture',
      unit: 'Ton',
      reportingPeriod: defaultPeriod,
      monthVolume: undefined,
      monthValueUsd: 0,
      yearVolume: undefined,
      yearValueUsd: 0,
      momGrowthPercent: undefined,
      yoyGrowthPercent: undefined,
      sortOrder: filteredStats.length + 1,
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

    const code = (formData.commodityCode || formData.commodityNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
    const period = formData.reportingPeriod || '07/2026';
    const periodSafe = period.replace(/[^a-zA-Z0-9]/g, '-');
    const autoId = `${code}-${periodSafe}`;
    const finalId = editingItem ? editingItem.id : (formData.id && !formData.id.startsWith('stat-') ? formData.id : autoId);

    const payload: ExportStatItem = {
      id: finalId,
      commodityCode: code,
      commodityNameEn: formData.commodityNameEn,
      commodityNameVi: formData.commodityNameVi,
      commodityNameZh: formData.commodityNameZh || undefined,
      category: formData.category || 'Agriculture',
      unit: formData.unit === 'USD' ? 'USD' : 'Ton',
      reportingPeriod: period,
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
              onClick={handleOpenInitModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 text-white text-xs font-black hover:bg-emerald-800 transition-all shadow-md shadow-emerald-900/15"
            >
              <CalendarPlus size={15} />
              Khởi tạo Tháng Mới
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
          <div className="p-6 border-b border-foodera-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-foodera-forest">
                Danh sách Số liệu Nông sản ({filteredStats.length} mặt hàng)
              </h3>
              <p className="text-xs text-foodera-stone-500 mt-0.5">
                Quản lý số liệu xuất khẩu theo từng kỳ tháng/năm
              </p>
            </div>

            {/* Filter by Period Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-foodera-stone-100/80 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedPeriodFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedPeriodFilter === 'all'
                    ? 'bg-foodera-forest text-white shadow-sm'
                    : 'text-foodera-stone-600 hover:text-foodera-forest'
                }`}
              >
                Tất cả ({stats.length})
              </button>
              {availablePeriods.map((p) => {
                const count = stats.filter((s) => s.reportingPeriod === p).length;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPeriodFilter(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedPeriodFilter === p
                        ? 'bg-foodera-forest text-white shadow-sm'
                        : 'text-foodera-stone-600 hover:text-foodera-forest'
                    }`}
                  >
                    <span>Kỳ {p}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                        selectedPeriodFilter === p ? 'bg-white/20 text-white' : 'bg-white text-foodera-stone-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
              {selectedPeriodFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleDeletePeriod(selectedPeriodFilter)}
                  className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-all border border-rose-200/60 ml-2 flex items-center gap-1"
                  title="Xoá tất cả mặt hàng thuộc kỳ này"
                >
                  <Trash2 size={12} />
                  Xoá kỳ {selectedPeriodFilter}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-foodera-stone-50 text-foodera-stone-600 font-bold border-b border-foodera-stone-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Tên Nông sản</th>
                  <th className="py-3.5 px-4">Kỳ</th>
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
                {filteredStats.map((item, index) => (
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
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60">
                        {item.reportingPeriod || '07/2026'}
                      </span>
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
                      Kỳ báo cáo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="existing-periods-list"
                      value={formData.reportingPeriod || '07/2026'}
                      onChange={(e) => setFormData({ ...formData, reportingPeriod: e.target.value })}
                      placeholder="VD: 08/2026 hoặc 07/2026"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-foodera-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-foodera-forest/20 font-bold text-foodera-forest"
                    />
                    <datalist id="existing-periods-list">
                      {availablePeriods.map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                    <span className="text-[10px] text-foodera-stone-400 mt-1 block">
                      Định dạng MM/YYYY (VD: 08/2026)
                    </span>
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

        {/* Initialize New Month Modal */}
        {isInitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foodera-forest/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-foodera-stone-200">
              <div className="flex items-center justify-between pb-4 border-b border-foodera-stone-100 mb-6">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-wider mb-1">
                    <CalendarPlus size={15} />
                    <span>Thiết lập dữ liệu định kỳ</span>
                  </div>
                  <h2 className="text-xl font-black text-foodera-forest">
                    Khởi tạo Kỳ Báo Cáo Mới
                  </h2>
                  <p className="text-xs text-foodera-stone-500 mt-1">
                    Tự động tạo 7 nhóm mặt hàng nông sản chính theo chuẩn Tổng cục Hải quan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInitModalOpen(false)}
                  className="p-2 rounded-xl text-foodera-stone-400 hover:text-foodera-stone-600 hover:bg-foodera-stone-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleInitNewMonth} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-foodera-stone-700 mb-1.5">
                    Kỳ báo cáo mới (MM/YYYY) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newPeriodInput}
                      onChange={(e) => setNewPeriodInput(e.target.value)}
                      placeholder="Ví dụ: 08/2026 hoặc 09/2026"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-foodera-stone-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setNewPeriodInput(defaultNextPeriod)}
                      className="px-3 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100/70"
                    >
                      Kỳ gợi ý ({defaultNextPeriod})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foodera-stone-700 mb-1.5">
                    Sao chép cấu trúc 7 mặt hàng từ kỳ:
                  </label>
                  <select
                    value={baselinePeriod}
                    onChange={(e) => setBaselinePeriod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-foodera-stone-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {availablePeriods.map((p) => (
                      <option key={p} value={p}>
                        Kỳ {p} ({stats.filter((s) => s.reportingPeriod === p).length} mặt hàng)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foodera-stone-700 mb-1.5">
                    Chế độ dữ liệu ban đầu:
                  </label>
                  <div className="space-y-2 bg-foodera-stone-50 p-3 rounded-2xl border border-foodera-stone-200/70">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="initMode"
                        value="template"
                        checked={initMode === 'template'}
                        onChange={() => setInitMode('template')}
                        className="mt-0.5 text-emerald-700 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-foodera-stone-800">
                          Sao chép số liệu kỳ trước làm mẫu (Khuyên dùng)
                        </div>
                        <div className="text-[11px] text-foodera-stone-500 leading-tight">
                          Giữ số liệu của kỳ gốc để bạn chỉ cần cập nhật phần tăng/giảm thay vì nhập từ đầu.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="initMode"
                        value="blank"
                        checked={initMode === 'blank'}
                        onChange={() => setInitMode('blank')}
                        className="mt-0.5 text-emerald-700 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-foodera-stone-800">
                          Khởi tạo số liệu trắng (Bằng 0)
                        </div>
                        <div className="text-[11px] text-foodera-stone-500 leading-tight">
                          Đặt sản lượng và kim ngạch ban đầu về 0, bạn sẽ nhập số liệu mới hoàn toàn.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Preview 7 standard commodities */}
                <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <div className="text-[11px] font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
                    <Copy size={13} />
                    7 mặt hàng tiêu chuẩn sẽ được khởi tạo:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Gạo', 'Cà phê', 'Hạt điều', 'Hồ tiêu', 'Quế & hoa quế', 'Sắn & sản phẩm sắn', 'Rau quả xuất khẩu'].map((name) => (
                      <span key={name} className="px-2 py-0.5 rounded-lg bg-white text-[11px] font-bold text-emerald-950 border border-emerald-200/60 shadow-2xs">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-foodera-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsInitModalOpen(false)}
                    disabled={isInitializing}
                    className="px-5 py-2.5 rounded-xl border border-foodera-stone-200 text-xs font-bold text-foodera-stone-600 hover:bg-foodera-stone-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isInitializing}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-black hover:bg-emerald-800 shadow-md shadow-emerald-900/15 disabled:opacity-50"
                  >
                    {isInitializing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Đang khởi tạo...
                      </>
                    ) : (
                      <>
                        <CalendarPlus size={15} />
                        Khởi tạo Kỳ Báo Cáo
                      </>
                    )}
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
