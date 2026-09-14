
import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CareerItem } from '../../types';
import { JD_FILE_INPUT_ACCEPT, uploadCareerJdFile } from '../../lib/storageUploads';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Loader2,
  AlertCircle,
  Briefcase,
  MapPin,
  Clock,
  Building2,
  CheckCircle,
  ChevronLeft,
  FileUp,
  FileText,
  Download,
  ExternalLink,
} from 'lucide-react';
import { AdminSidebar } from '../../components/AdminSidebar';

type ListViewTab = 'all' | 'active' | 'inactive';

const JOB_TYPE_OPTIONS = [
  'Toàn thời gian',
  'Bán thời gian',
  'Thực tập',
  'Full-time',
  'Part-time',
  'Internship',
];

/** Slugify Vietnamese-friendly title into a URL-safe ID */
const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || `career-${Date.now()}`;

const emptyFormData: Omit<CareerItem, 'id'> = {
  title: '',
  department: '',
  location: '',
  type: 'Toàn thời gian',
  description: '',
  requirements: [],
  isActive: true,
  jdFileUrl: '',
  jdFileName: '',
};

const AdminCareers: React.FC = () => {
  // ── Context ──────────────────────────────────────
  const { careers = [], addCareer, updateCareer, deleteCareer } = useData() as any;
  const { logout } = useAuth();

  // ── State ────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [listTab, setListTab] = useState<ListViewTab>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CareerItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState<Omit<CareerItem, 'id'>>(emptyFormData);
  const [requirementsString, setRequirementsString] = useState('');

  // JD file upload state
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [isUploadingJd, setIsUploadingJd] = useState(false);
  const jdInputRef = useRef<HTMLInputElement>(null);

  // ── Derived Data ─────────────────────────────────
  const allFilteredCareers = (careers as CareerItem[]).filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activeCareers = allFilteredCareers.filter((c) => c.isActive !== false);
  const inactiveCareers = allFilteredCareers.filter((c) => c.isActive === false);
  const filteredCareers =
    listTab === 'active'
      ? activeCareers
      : listTab === 'inactive'
        ? inactiveCareers
        : allFilteredCareers;

  // ── Handlers ─────────────────────────────────────
  const handleExit = () => {
    logout();
  };

  const openForm = (item?: CareerItem) => {
    setSaveError(null);
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        department: item.department,
        location: item.location,
        type: item.type,
        description: item.description,
        requirements: item.requirements,
        isActive: item.isActive,
        jdFileUrl: item.jdFileUrl || '',
        jdFileName: item.jdFileName || '',
      });
      setRequirementsString((item.requirements || []).join('\n'));
      setJdFile(null);
    } else {
      setEditingItem(null);
      setFormData({ ...emptyFormData });
      setRequirementsString('');
      setJdFile(null);
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setSaveError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    const requirements = requirementsString
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    setTimeout(async () => {
      try {
        // Upload JD file first if a new file was selected
        let jdFileUrl = formData.jdFileUrl || '';
        let jdFileName = formData.jdFileName || '';

        if (jdFile) {
          setIsUploadingJd(true);
          try {
            const uploadResult = await uploadCareerJdFile(jdFile);
            jdFileUrl = uploadResult.publicUrl;
            jdFileName = uploadResult.fileName;
          } finally {
            setIsUploadingJd(false);
          }
        }

        const payload: CareerItem = {
          id: editingItem?.id || slugify(formData.title),
          title: formData.title.trim(),
          department: formData.department.trim(),
          location: formData.location.trim(),
          type: formData.type,
          description: formData.description.trim(),
          requirements,
          isActive: formData.isActive,
          jdFileUrl,
          jdFileName,
        };

        if (editingItem) {
          await updateCareer(payload);
        } else {
          await addCareer(payload);
        }
        closeForm();
      } catch (err: any) {
        setSaveError(err?.message || 'Không thể lưu. Vui lòng thử lại.');
      } finally {
        setIsSaving(false);
      }
    }, 400);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa vị trí "${title}"?`)) {
      deleteCareer(id);
    }
  };

  const updateField = <K extends keyof Omit<CareerItem, 'id'>>(key: K, value: Omit<CareerItem, 'id'>[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // ── Render ───────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <AdminSidebar onLogout={handleExit} />

      {/* ─── LIST VIEW ────────────────────────────── */}
      {!isFormOpen && (
        <main className="flex-grow p-8 md:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                    Quản lí Tuyển dụng
                  </h1>
                  <span className="px-3 py-1 bg-foodera-forest/10 text-foodera-forest text-xs font-black rounded-xl">
                    {(careers as CareerItem[]).length}
                  </span>
                </div>
                <p className="text-gray-500 font-medium mt-1">
                  Quản lý các vị trí tuyển dụng và tin đăng tuyển.
                </p>
              </div>
              <button
                onClick={() => openForm()}
                className="px-8 py-4 bg-foodera-forest text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl hover:bg-foodera-lime hover:text-foodera-forest transition-all"
              >
                <Plus size={20} /> Tạo vị trí mới
              </button>
            </div>

            {/* Tab Filters */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {(
                [
                  { key: 'all' as const, label: 'Tất cả', count: allFilteredCareers.length },
                  { key: 'active' as const, label: 'Đang tuyển', count: activeCareers.length },
                  { key: 'inactive' as const, label: 'Đã đóng', count: inactiveCareers.length },
                ] as const
              ).map((tab) => {
                const isTabActive = listTab === tab.key;
                const isInactive = tab.key === 'inactive';
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setListTab(tab.key)}
                    className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border ${
                      isTabActive
                        ? isInactive
                          ? 'bg-gray-700 text-white border-gray-700 shadow-lg'
                          : 'bg-foodera-forest text-white border-foodera-forest shadow-lg shadow-foodera-forest/20'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-foodera-forest/30 hover:text-foodera-forest'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        tab.key === 'active'
                          ? isTabActive
                            ? 'bg-foodera-lime'
                            : 'bg-green-400'
                          : tab.key === 'inactive'
                            ? 'bg-gray-400'
                            : isTabActive
                              ? 'bg-white/60'
                              : 'bg-gray-300'
                      }`}
                    />
                    {tab.label}
                    <span
                      className={`ml-1 px-2 py-0.5 rounded-lg text-[9px] font-black ${
                        isTabActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên vị trí..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-foodera-forest/10 border-none text-sm font-medium"
                />
              </div>
            </div>

            {/* Career Cards Grid */}
            {filteredCareers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCareers.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group relative"
                  >
                    {/* Status Dot */}
                    <div className="absolute top-5 right-5 flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          item.isActive !== false ? 'bg-green-400' : 'bg-gray-300'
                        }`}
                      />
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        {item.isActive !== false ? 'Đang tuyển' : 'Đã đóng'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-black text-gray-900 leading-tight pr-24 mb-4 line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Meta badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {item.department && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-foodera-forest/5 text-foodera-forest text-[9px] font-black uppercase tracking-widest rounded-lg">
                          <Building2 size={10} />
                          {item.department}
                        </span>
                      )}
                      {item.location && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-lg">
                          <MapPin size={10} />
                          {item.location}
                        </span>
                      )}
                      {item.type && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-lg">
                          <Clock size={10} />
                          {item.type}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-5 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* JD File Badge */}
                    {item.jdFileUrl && (
                      <div className="mb-4">
                        <a
                          href={item.jdFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-100 transition-colors"
                          title={item.jdFileName || 'JD File'}
                        >
                          <FileText size={11} />
                          JD: {item.jdFileName ? (item.jdFileName.length > 20 ? item.jdFileName.slice(0, 20) + '...' : item.jdFileName) : 'Xem tệp'}
                          <ExternalLink size={9} />
                        </a>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => openForm(item)}
                        className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-foodera-forest hover:text-white transition-all shadow-sm"
                        title="Chỉnh sửa"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <AlertCircle size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-black uppercase text-xs tracking-widest">
                  Không tìm thấy vị trí tuyển dụng nào
                </p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ─── CREATE / EDIT FORM VIEW ──────────────── */}
      {isFormOpen && (
        <main className="flex-grow flex flex-col overflow-hidden bg-white">
          {/* Form Header */}
          <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-foodera-forest text-white">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={closeForm}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  {editingItem ? 'Chỉnh sửa vị trí' : 'Tạo vị trí tuyển dụng'}
                </h2>
                <p className="text-foodera-lime/60 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Careers Management
                </p>
              </div>
            </div>
            <button onClick={closeForm} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="flex-grow overflow-y-auto">
            <div className="max-w-3xl mx-auto p-10 space-y-8">
              {/* Save Error */}
              {saveError && (
                <div className="px-4 py-3 rounded-xl text-sm font-semibold bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {saveError}
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 block">
                  Tên vị trí *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="VD: Trưởng phòng Kinh doanh Xuất khẩu"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest outline-none transition-all font-bold"
                />
              </div>

              {/* Department + Location (2-column) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 block">
                    Phòng ban
                  </label>
                  <div className="relative">
                    <Building2
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                      size={15}
                    />
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => updateField('department', e.target.value)}
                      placeholder="VD: Kinh doanh"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 block">
                    Địa điểm
                  </label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                      size={15}
                    />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => updateField('location', e.target.value)}
                      placeholder="VD: Hồ Chí Minh"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Type + isActive (2-column) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 block">
                    Loại hình
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => updateField('type', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest outline-none transition-all cursor-pointer font-bold"
                  >
                    {JOB_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 block">
                    Trạng thái
                  </label>
                  <button
                    type="button"
                    onClick={() => updateField('isActive', !formData.isActive)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      formData.isActive
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    <span className="text-sm font-bold">
                      {formData.isActive ? 'Đang tuyển' : 'Đã đóng'}
                    </span>
                    {/* Toggle Switch */}
                    <div
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        formData.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          formData.isActive ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 block">
                  Mô tả công việc
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Mô tả chi tiết về vị trí tuyển dụng, trách nhiệm và quyền lợi..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              {/* JD File Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 block">
                  Tệp JD (Job Description)
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    (formData.jdFileUrl || jdFile)
                      ? 'border-foodera-forest/30 bg-foodera-forest/5'
                      : 'border-gray-200 bg-gray-50 hover:border-foodera-forest/20 hover:bg-gray-100'
                  }`}
                >
                  <input
                    ref={jdInputRef}
                    type="file"
                    accept={JD_FILE_INPUT_ACCEPT}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && file.size > 15 * 1024 * 1024) {
                        alert('Tệp JD phải nhỏ hơn 15MB.');
                        return;
                      }
                      setJdFile(file);
                      // Clear the previous uploaded URL when a new file is picked
                      if (file) {
                        updateField('jdFileUrl', '');
                        updateField('jdFileName', '');
                      }
                    }}
                    className="hidden"
                    id="jd-file-input"
                  />

                  {/* Show uploaded file info */}
                  {(jdFile || formData.jdFileUrl) ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-foodera-forest/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText size={20} className="text-foodera-forest" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {jdFile ? jdFile.name : (formData.jdFileName || 'Tệp JD')}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {jdFile
                              ? `${(jdFile.size / 1024).toFixed(1)} KB — Sẵn sàng upload`
                              : 'Đã upload thành công'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {formData.jdFileUrl && !jdFile && (
                          <a
                            href={formData.jdFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white text-foodera-forest rounded-lg hover:bg-foodera-forest hover:text-white transition-all shadow-sm border border-gray-200"
                            title="Xem tệp JD"
                          >
                            <Download size={14} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setJdFile(null);
                            updateField('jdFileUrl', '');
                            updateField('jdFileName', '');
                            if (jdInputRef.current) jdInputRef.current.value = '';
                          }}
                          className="p-2 bg-white text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm border border-gray-200"
                          title="Xóa tệp JD"
                        >
                          <X size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => jdInputRef.current?.click()}
                          className="p-2 bg-white text-gray-500 rounded-lg hover:bg-foodera-forest hover:text-white transition-all shadow-sm border border-gray-200"
                          title="Thay đổi tệp"
                        >
                          <FileUp size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => jdInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 w-full py-2"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <FileUp size={24} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-600">Chọn tệp JD từ máy tính</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">
                          PDF, DOC, DOCX, XLS, XLSX, CSV, TXT hoặc ảnh — tối đa 15MB
                        </p>
                      </div>
                    </button>
                  )}

                  {isUploadingJd && (
                    <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                      <div className="flex items-center gap-2 text-foodera-forest font-bold text-sm">
                        <Loader2 size={18} className="animate-spin" />
                        Đang tải tệp JD...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 block">
                  Yêu cầu ứng viên
                </label>
                <textarea
                  rows={4}
                  value={requirementsString}
                  onChange={(e) => setRequirementsString(e.target.value)}
                  placeholder={'Mỗi dòng là một yêu cầu:\nTốt nghiệp Đại học\nKinh nghiệm 2 năm\nThành thạo tiếng Anh'}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest outline-none transition-all resize-none leading-relaxed"
                />
                <p className="text-[10px] text-gray-400 font-medium">
                  Mỗi dòng sẽ tạo thành một yêu cầu riêng biệt.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSaving || !formData.title.trim()}
                  className="px-8 py-4 bg-foodera-forest text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl hover:bg-foodera-lime hover:text-foodera-forest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> {editingItem ? 'Cập nhật' : 'Tạo mới'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 py-4 bg-white text-gray-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </form>
        </main>
      )}
    </div>
  );
};

export default AdminCareers;
