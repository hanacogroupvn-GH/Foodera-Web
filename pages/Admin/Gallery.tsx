import React, { useState, useEffect, useRef } from 'react';
import { GalleryCategory, GalleryPhotoItem } from '../../types';
import { api } from '../../lib/apiClient';
import { AdminSidebar } from '../../components/AdminSidebar';
import { CMS_IMAGE_INPUT_ACCEPT, uploadCmsImage } from '../../lib/storageUploads';
import defaultGalleryData from '../../data/gallery.json';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Images,
  Upload,
  X,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  Tag,
  Link2,
  Layers,
  UploadCloud,
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';

interface BatchItem {
  id: string;
  file?: File;
  previewUrl: string;
  uploadedUrl?: string;
  caption: string;
  alt: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

const CATEGORY_MAP: Record<GalleryCategory, { labelVi: string; labelEn: string; color: string }> = {
  activities: {
    labelVi: 'Hoạt động nội bộ',
    labelEn: 'Company Activities',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'trade-fairs': {
    labelVi: 'Hội chợ & Triển lãm',
    labelEn: 'Trade Fairs',
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'farm-visits': {
    labelVi: 'Khảo sát nông trại',
    labelEn: 'Farm Visits',
    color: 'bg-amber-50 text-amber-700 border-amber-200'
  }
};

const PRESET_ALBUMS = [
  { id: '', title: '-- Không phân bộ ảnh (Độc lập) --' },
  { id: 'durian-farm-visit', title: 'Khảo sát Vùng trồng Sầu riêng Xuất khẩu' },
  { id: 'coffee-farm-visit', title: 'Khảo sát Vùng nguyên liệu Cà phê Robusta' }
];

const AdminGallery: React.FC = () => {
  const [photos, setPhotos] = useState<GalleryPhotoItem[]>(() => defaultGalleryData as unknown as GalleryPhotoItem[]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhotoItem | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<GalleryCategory | 'all'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Batch Upload State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchCategory, setBatchCategory] = useState<GalleryCategory>('activities');
  const [batchAlbum, setBatchAlbum] = useState<string>('');
  const [batchAlbumTitle, setBatchAlbumTitle] = useState<string>('');
  const [batchCommonCaption, setBatchCommonCaption] = useState('');
  const [batchStartOrder, setBatchStartOrder] = useState<number>(1);
  const [batchIsActive, setBatchIsActive] = useState<boolean>(true);
  const [isBatchSaving, setIsBatchSaving] = useState<boolean>(false);
  const [isBatchUploading, setIsBatchUploading] = useState<boolean>(false);
  const [batchInputMode, setBatchInputMode] = useState<'files' | 'urls'>('files');
  const [pastedUrlsText, setPastedUrlsText] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<GalleryPhotoItem>>({
    src: '',
    alt: '',
    caption: '',
    category: 'activities',
    album: '',
    albumTitle: '',
    sortOrder: 1,
    isActive: true
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getGallery();
      if (res.photos && res.photos.length > 0) {
        setPhotos(res.photos);
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
    setEditingPhoto(null);
    setFormData({
      id: `gallery-${Date.now()}`,
      src: '',
      alt: '',
      caption: '',
      category: activeCategoryTab !== 'all' ? activeCategoryTab : 'activities',
      album: '',
      albumTitle: '',
      sortOrder: photos.length + 1,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (photo: GalleryPhotoItem) => {
    setEditingPhoto(photo);
    setFormData({ ...photo });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Đang tải ảnh lên Cloudinary...');
    try {
      const uploadedUrl = await uploadCmsImage(file, ['gallery']);
      setFormData((prev) => ({
        ...prev,
        src: uploadedUrl,
        alt: prev.alt || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      }));
      toast.success('Tải ảnh thành công!', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tải ảnh thất bại', { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.src || !formData.src.trim()) {
      toast.error('Vui lòng tải ảnh lên hoặc nhập URL hình ảnh.');
      return;
    }

    setIsSaving(true);
    try {
      const photoToSave: Partial<GalleryPhotoItem> = {
        ...formData,
        id: formData.id || `gallery-${Date.now()}`,
        src: formData.src.trim(),
        alt: (formData.alt || formData.caption || 'FoodEra Gallery').trim(),
        caption: formData.caption?.trim() || undefined,
        category: formData.category || 'activities',
        album: formData.album?.trim() || undefined,
        albumTitle: formData.albumTitle?.trim() || undefined,
        sortOrder: Number(formData.sortOrder) || 0,
        isActive: formData.isActive !== false
      };

      const res = await api.upsertGalleryPhoto(photoToSave);
      if (res.ok && res.photo) {
        toast.success(editingPhoto ? 'Đã cập nhật ảnh!' : 'Đã thêm ảnh vào thư viện!');
        setIsModalOpen(false);
        await loadData();
      } else {
        throw new Error('Không thể lưu ảnh');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu ảnh.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await api.deleteGalleryPhoto(id);
      if (res.ok) {
        toast.success('Đã xóa ảnh khỏi thư viện!');
        setDeleteConfirmId(null);
        await loadData();
      } else {
        throw new Error('Không thể xóa ảnh');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi xóa ảnh.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Batch Upload Handlers ────────────────────────────────────
  const handleOpenBatchModal = () => {
    setBatchItems([]);
    setBatchCategory(activeCategoryTab !== 'all' ? activeCategoryTab : 'activities');
    setBatchAlbum('');
    setBatchAlbumTitle('');
    setBatchCommonCaption('');
    setBatchStartOrder(photos.length + 1);
    setBatchIsActive(true);
    setPastedUrlsText('');
    setBatchInputMode('files');
    setIsBatchModalOpen(true);
  };

  const processBatchUpload = async (itemsToUpload: BatchItem[]) => {
    setIsBatchUploading(true);
    const CONCURRENCY = 3;
    let nextIndex = 0;

    const runWorker = async () => {
      while (nextIndex < itemsToUpload.length) {
        const current = itemsToUpload[nextIndex++];
        if (!current || current.status === 'success' || !current.file) continue;

        setBatchItems((prev) =>
          prev.map((it) => (it.id === current.id ? { ...it, status: 'uploading' } : it))
        );

        try {
          const uploadedUrl = await uploadCmsImage(current.file, ['gallery']);
          setBatchItems((prev) =>
            prev.map((it) =>
              it.id === current.id
                ? { ...it, uploadedUrl, status: 'success', errorMessage: undefined }
                : it
            )
          );
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Lỗi khi tải ảnh';
          setBatchItems((prev) =>
            prev.map((it) =>
              it.id === current.id ? { ...it, status: 'error', errorMessage: errMsg } : it
            )
          );
        }
      }
    };

    const workerCount = Math.min(CONCURRENCY, itemsToUpload.length);
    const workers = Array.from({ length: workerCount }, () => runWorker());
    await Promise.all(workers);
    setIsBatchUploading(false);
  };

  const addFilesToBatch = (selectedFiles: FileList | File[]) => {
    const validFiles = Array.from(selectedFiles).filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) {
      toast.error('Vui lòng chọn các file định dạng hình ảnh (PNG, JPG, WebP...).');
      return;
    }

    const currentCount = batchItems.length;
    const newItems: BatchItem[] = validFiles.map((file, idx) => {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const totalIdx = currentCount + idx + 1;
      const initialCaption = batchCommonCaption.trim()
        ? `${batchCommonCaption.trim()} - Ảnh ${totalIdx}`
        : cleanName;
      return {
        id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        caption: initialCaption,
        alt: cleanName,
        status: 'pending'
      };
    });

    setBatchItems((prev) => [...prev, ...newItems]);
    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = '';
    }

    void processBatchUpload(newItems);
  };

  const handleRetryItem = (item: BatchItem) => {
    if (!item.file) return;
    setBatchItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, status: 'pending', errorMessage: undefined } : it))
    );
    void processBatchUpload([item]);
  };

  const handleRemoveBatchItem = (id: string) => {
    setBatchItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleApplyCommonCaption = () => {
    if (!batchCommonCaption.trim()) {
      toast.error('Vui lòng nhập chú thích chung trước.');
      return;
    }
    const prefix = batchCommonCaption.trim();
    setBatchItems((prev) =>
      prev.map((item, idx) => ({
        ...item,
        caption: prev.length > 1 ? `${prefix} - Ảnh ${idx + 1}` : prefix,
        alt: item.alt || prefix
      }))
    );
    toast.success('Đã áp dụng chú thích cho tất cả ảnh!');
  };

  const handleAddPastedUrls = () => {
    const urls = pastedUrlsText
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http://') || u.startsWith('https://'));

    if (urls.length === 0) {
      toast.error('Không tìm thấy link ảnh hợp lệ. Mỗi link phải bắt đầu bằng http:// hoặc https://.');
      return;
    }

    const currentCount = batchItems.length;
    const newItems: BatchItem[] = urls.map((url, idx) => {
      const totalIdx = currentCount + idx + 1;
      const initialCaption = batchCommonCaption.trim()
        ? `${batchCommonCaption.trim()} - Ảnh ${totalIdx}`
        : `Ảnh thư viện ${totalIdx}`;
      return {
        id: `batch-url-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        previewUrl: url,
        uploadedUrl: url,
        caption: initialCaption,
        alt: initialCaption,
        status: 'success'
      };
    });

    setBatchItems((prev) => [...prev, ...newItems]);
    setPastedUrlsText('');
    setBatchInputMode('files');
    toast.success(`Đã thêm ${newItems.length} link ảnh!`);
  };

  const handleSaveBatch = async () => {
    const validItems = batchItems.filter((it) => it.status === 'success' && it.uploadedUrl);
    if (validItems.length === 0) {
      toast.error('Chưa có ảnh nào tải lên thành công để lưu.');
      return;
    }

    const pendingCount = batchItems.filter((it) => it.status === 'uploading' || it.status === 'pending').length;
    if (pendingCount > 0) {
      toast.error(`Còn ${pendingCount} ảnh đang xử lý tải lên. Vui lòng đợi hoàn tất.`);
      return;
    }

    setIsBatchSaving(true);
    const toastId = toast.loading(`Đang lưu ${validItems.length} ảnh vào thư viện...`);
    try {
      const startOrder = Number(batchStartOrder) || 1;
      const photosToSave: Partial<GalleryPhotoItem>[] = validItems.map((item, idx) => ({
        id: `gallery-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        src: item.uploadedUrl!,
        caption: item.caption.trim() || undefined,
        alt: item.alt.trim() || item.caption.trim() || 'FoodEra Gallery',
        category: batchCategory,
        album: batchAlbum.trim() || undefined,
        albumTitle: batchAlbumTitle.trim() || undefined,
        sortOrder: startOrder + idx,
        isActive: batchIsActive
      }));

      const res = await api.upsertGalleryPhotosBatch(photosToSave);
      if (res.ok) {
        toast.success(`Đã thêm thành công ${photosToSave.length} ảnh vào thư viện!`, { id: toastId });
        setIsBatchModalOpen(false);
        setBatchItems([]);
        await loadData();
      } else {
        throw new Error('Lỗi từ hệ thống khi lưu danh sách ảnh.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu bộ ảnh.', { id: toastId });
    } finally {
      setIsBatchSaving(false);
    }
  };

  const filteredPhotos = photos.filter((photo) => {
    if (activeCategoryTab === 'all') return true;
    return photo.category === activeCategoryTab;
  });

  const successBatchCount = batchItems.filter((it) => it.status === 'success').length;
  const uploadingBatchCount = batchItems.filter((it) => it.status === 'uploading' || it.status === 'pending').length;
  const errorBatchCount = batchItems.filter((it) => it.status === 'error').length;

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <AdminSidebar onLogout={() => {}} />

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-foodera-forest/10 text-foodera-forest rounded-xl">
                <Images size={20} />
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                Quản lý Thư viện Ảnh (Gallery)
              </h1>
            </div>
            <p className="text-sm text-gray-500">
              Thêm, sắp xếp và quản lý ảnh công ty, sự kiện hội chợ và các chuyến thăm nông trại.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-foodera-forest transition-colors shadow-sm disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={17} className={isLoading ? 'animate-spin text-foodera-forest' : ''} />
            </button>
            <button
              type="button"
              onClick={handleOpenBatchModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all hover:shadow-md"
            >
              <Layers size={18} />
              Thêm bộ nhiều ảnh
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-foodera-forest hover:bg-foodera-forest/90 text-white text-sm font-bold rounded-xl shadow-sm transition-all hover:shadow-md"
            >
              <Plus size={18} />
              Thêm 1 ảnh
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveCategoryTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategoryTab === 'all'
                ? 'bg-foodera-forest text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tất cả ({photos.length})
          </button>
          {(['activities', 'trade-fairs', 'farm-visits'] as GalleryCategory[]).map((cat) => {
            const count = photos.filter((p) => p.category === cat).length;
            const info = CATEGORY_MAP[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryTab(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeCategoryTab === cat
                    ? 'bg-foodera-forest text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{info.labelVi}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    activeCategoryTab === cat ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Photos Grid */}
        {isLoading && photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
            <Loader2 className="animate-spin text-foodera-forest mb-3" size={32} />
            <p className="text-sm font-medium text-gray-500">Đang tải ảnh từ hệ thống...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-foodera-forest flex items-center justify-center mb-4">
              <Images size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Chưa có ảnh nào trong mục này</h3>
            <p className="text-sm text-gray-500 max-w-md mb-6">
              Bạn có thể tải lên toàn bộ một album ảnh cùng lúc hoặc thêm từng ảnh đơn lẻ.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleOpenBatchModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-all"
              >
                <Layers size={16} />
                Thêm bộ nhiều ảnh
              </button>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-foodera-forest text-white text-sm font-bold rounded-xl shadow-sm hover:bg-foodera-forest/90 transition-all"
              >
                <Plus size={16} />
                Thêm 1 ảnh
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredPhotos.map((photo) => {
              const catInfo = CATEGORY_MAP[photo.category] || CATEGORY_MAP.activities;
              return (
                <div
                  key={photo.id}
                  className={`group bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col ${
                    photo.isActive ? 'border-gray-100' : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  {/* Image Container */}
                  <div className="relative aspect-video bg-gray-100 overflow-hidden">
                    <img
                      src={photo.src}
                      alt={photo.alt || photo.caption || ''}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1.5 max-w-[80%]">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${catInfo.color}`}
                      >
                        {catInfo.labelVi}
                      </span>
                      {photo.albumTitle && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-sm truncate max-w-[130px]"
                          title={photo.albumTitle}
                        >
                          📁 {photo.albumTitle}
                        </span>
                      )}
                      {!photo.isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 shadow-sm">
                          Ẩn
                        </span>
                      )}
                    </div>

                    {/* Sort Order Badge */}
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm shadow-sm">
                        #{photo.sortOrder}
                      </span>
                    </div>

                    {/* Overlay Action Buttons */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(photo)}
                        className="p-2.5 bg-white text-gray-800 rounded-xl hover:bg-foodera-forest hover:text-white transition-colors shadow-md"
                        title="Chỉnh sửa ảnh"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(photo.id)}
                        className="p-2.5 bg-white text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors shadow-md"
                        title="Xóa ảnh"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1" title={photo.caption || photo.alt}>
                        {photo.caption || photo.alt || 'Không có chú thích'}
                      </h4>
                      {photo.caption && photo.alt && photo.alt !== photo.caption && (
                        <p className="text-xs text-gray-400 line-clamp-1" title={photo.alt}>
                          Alt: {photo.alt}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1 truncate max-w-[160px]" title={photo.src}>
                        <Link2 size={12} className="flex-shrink-0 text-gray-400" />
                        <span className="truncate">{photo.src}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(photo)}
                        className="text-foodera-forest font-bold hover:underline flex-shrink-0 text-[11px]"
                      >
                        Sửa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── BATCH UPLOAD MODAL ──────────────────────────────────── */}
        {isBatchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                    <Layers size={20} />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">
                      Thêm bộ nhiều ảnh vào Thư viện
                    </h3>
                    <p className="text-xs text-gray-500">
                      Chọn nhiều ảnh cùng lúc, ảnh sẽ tự động nén WebP và tải lên Cloudinary.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* 1. Batch Settings */}
                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Danh mục <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={batchCategory}
                        onChange={(e) => setBatchCategory(e.target.value as GalleryCategory)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white font-medium focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest"
                      >
                        <option value="activities">Hoạt động nội bộ</option>
                        <option value="trade-fairs">Hội chợ & Triển lãm</option>
                        <option value="farm-visits">Khảo sát nông trại</option>
                      </select>
                    </div>

                    {/* Starting Sort Order */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Thứ tự bắt đầu
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={batchStartOrder}
                        onChange={(e) => setBatchStartOrder(Number(e.target.value) || 1)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest"
                      />
                    </div>

                    {/* Active toggle */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Trạng thái hiển thị
                      </label>
                      <label className="flex items-center gap-2.5 h-[38px] px-3 bg-white border border-gray-200 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={batchIsActive}
                          onChange={(e) => setBatchIsActive(e.target.checked)}
                          className="w-4 h-4 text-foodera-forest rounded focus:ring-foodera-forest"
                        />
                        <span className="text-xs font-bold text-gray-700">Hiển thị trên website ngay</span>
                      </label>
                    </div>
                  </div>

                  {/* Album Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200/60">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Bộ ảnh / Album (Tùy chọn)
                      </label>
                      <select
                        value={PRESET_ALBUMS.some((a) => a.id === batchAlbum) ? batchAlbum : (batchAlbum ? 'custom' : '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'custom') {
                            setBatchAlbum('custom-album');
                          } else {
                            setBatchAlbum(val);
                            const found = PRESET_ALBUMS.find((a) => a.id === val);
                            if (found && val) {
                              setBatchAlbumTitle(found.title);
                            } else if (!val) {
                              setBatchAlbumTitle('');
                            }
                          }
                        }}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white font-medium focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest"
                      >
                        {PRESET_ALBUMS.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title}
                          </option>
                        ))}
                        <option value="custom">Nhập mã bộ ảnh tùy chỉnh...</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Tên bộ ảnh hiển thị (Album Title)
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Khảo sát Vùng nguyên liệu Cà phê..."
                        value={batchAlbumTitle}
                        onChange={(e) => setBatchAlbumTitle(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest"
                      />
                    </div>
                  </div>

                  {/* Common Caption Generator */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Chú thích chung cho bộ ảnh (Tùy chọn)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="VD: Hội chợ Gulfood Dubai 2026..."
                        value={batchCommonCaption}
                        onChange={(e) => setBatchCommonCaption(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCommonCaption}
                        disabled={batchItems.length === 0}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 flex-shrink-0"
                      >
                        <Sparkles size={14} className="text-amber-600" />
                        Áp dụng cho tất cả ({batchItems.length})
                      </button>
                    </div>
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      Khi bấm áp dụng, hệ thống sẽ tự động đặt tên theo mẫu: "[Chú thích] - Ảnh 1, 2, 3..."
                    </span>
                  </div>
                </div>

                {/* 2. Source Selection Tabs */}
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <button
                    type="button"
                    onClick={() => setBatchInputMode('files')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      batchInputMode === 'files'
                        ? 'bg-foodera-forest text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <UploadCloud size={14} />
                    Tải nhiều ảnh từ máy tính
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchInputMode('urls')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      batchInputMode === 'urls'
                        ? 'bg-foodera-forest text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <Link2 size={14} />
                    Dán danh sách link URL
                  </button>
                </div>

                {/* File Dropzone */}
                {batchInputMode === 'files' && (
                  <div>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(true);
                      }}
                      onDragLeave={() => setIsDraggingOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(false);
                        if (e.dataTransfer.files) {
                          addFilesToBatch(e.dataTransfer.files);
                        }
                      }}
                      onClick={() => batchFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                        isDraggingOver
                          ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]'
                          : 'border-gray-200 hover:border-emerald-500 bg-gray-50/40 hover:bg-emerald-50/20'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                        <UploadCloud size={24} />
                      </div>
                      <h4 className="text-sm font-bold text-gray-800 mb-1">
                        Kéo thả nhiều ảnh vào đây hoặc nhấn để duyệt file
                      </h4>
                      <p className="text-xs text-gray-400">
                        Chọn cùng lúc nhiều file ảnh (JPG, PNG, WebP, AVIF). Hệ thống nén tự động sang WebP tối ưu.
                      </p>
                    </div>

                    <input
                      ref={batchFileInputRef}
                      type="file"
                      multiple
                      accept={CMS_IMAGE_INPUT_ACCEPT}
                      onChange={(e) => {
                        if (e.target.files) addFilesToBatch(e.target.files);
                      }}
                      className="hidden"
                    />
                  </div>
                )}

                {/* URL Paste Mode */}
                {batchInputMode === 'urls' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Dán danh sách link ảnh (Mỗi link một dòng)
                      </label>
                      <textarea
                        rows={4}
                        placeholder="https://res.cloudinary.com/.../photo1.jpg&#10;https://res.cloudinary.com/.../photo2.jpg"
                        value={pastedUrlsText}
                        onChange={(e) => setPastedUrlsText(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-gray-200 focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPastedUrls}
                      className="px-4 py-2 bg-foodera-forest text-white text-xs font-bold rounded-xl hover:bg-foodera-forest/90 transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      Thêm vào danh sách bộ ảnh
                    </button>
                  </div>
                )}

                {/* 3. Items Queue Summary & Grid */}
                {batchItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-xs font-bold">
                        <span className="text-gray-700">Tổng cộng: {batchItems.length} ảnh</span>
                        <span className="text-emerald-600 flex items-center gap-1">
                          <Check size={13} /> {successBatchCount} đã xong
                        </span>
                        {uploadingBatchCount > 0 && (
                          <span className="text-blue-600 flex items-center gap-1">
                            <Loader2 size={13} className="animate-spin" /> {uploadingBatchCount} đang nén & tải...
                          </span>
                        )}
                        {errorBatchCount > 0 && (
                          <span className="text-red-600 flex items-center gap-1">
                            <AlertCircle size={13} /> {errorBatchCount} lỗi
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => batchFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Plus size={13} /> Thêm ảnh khác
                        </button>
                        <button
                          type="button"
                          onClick={() => setBatchItems([])}
                          className="px-3 py-1.5 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors"
                        >
                          Xóa danh sách
                        </button>
                      </div>
                    </div>

                    {/* Batch Items Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[360px] overflow-y-auto p-1">
                      {batchItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-2 relative group"
                        >
                          {/* Image preview with status badges */}
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                            <img
                              src={item.previewUrl}
                              alt={item.caption || 'Preview'}
                              className="w-full h-full object-cover"
                            />

                            {/* Status Overlay */}
                            <div className="absolute top-1.5 left-1.5">
                              {item.status === 'uploading' && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/90 text-white text-[10px] font-bold backdrop-blur-sm shadow-sm animate-pulse">
                                  <Loader2 size={11} className="animate-spin" /> Đang tải...
                                </span>
                              )}
                              {item.status === 'pending' && (
                                <span className="px-2 py-0.5 rounded-full bg-gray-800/80 text-white text-[10px] font-bold backdrop-blur-sm shadow-sm">
                                  Chờ tải
                                </span>
                              )}
                              {item.status === 'success' && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-bold backdrop-blur-sm shadow-sm">
                                  <Check size={11} /> Sẵn sàng
                                </span>
                              )}
                              {item.status === 'error' && (
                                <button
                                  type="button"
                                  onClick={() => handleRetryItem(item)}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold shadow-sm hover:bg-red-700"
                                >
                                  <RotateCcw size={11} /> Thử lại
                                </button>
                              )}
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveBatchItem(item.id)}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors shadow-sm"
                              title="Xóa ảnh này khỏi bộ"
                            >
                              <X size={12} />
                            </button>

                            {/* Index */}
                            <div className="absolute bottom-1.5 right-1.5">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white">
                                #{idx + 1}
                              </span>
                            </div>
                          </div>

                          {/* Editable caption & alt text */}
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              placeholder="Chú thích ảnh..."
                              value={item.caption}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBatchItems((prev) =>
                                  prev.map((it) => (it.id === item.id ? { ...it, caption: val } : it))
                                );
                              }}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-foodera-forest font-medium"
                            />
                            <input
                              type="text"
                              placeholder="Alt text SEO..."
                              value={item.alt}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBatchItems((prev) =>
                                  prev.map((it) => (it.id === item.id ? { ...it, alt: val } : it))
                                );
                              }}
                              className="w-full px-2.5 py-1 text-[11px] text-gray-500 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-foodera-forest"
                            />
                          </div>

                          {item.errorMessage && (
                            <p className="text-[10px] text-red-600 truncate" title={item.errorMessage}>
                              {item.errorMessage}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="text-xs text-gray-500">
                  {successBatchCount > 0 ? (
                    <span>
                      Sẽ lưu <strong className="text-emerald-700">{successBatchCount}</strong> ảnh vào danh mục{' '}
                      <strong>{CATEGORY_MAP[batchCategory]?.labelVi}</strong>.
                    </span>
                  ) : (
                    <span>Hãy chọn ảnh để bắt đầu tải lên.</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBatch}
                    disabled={successBatchCount === 0 || isBatchSaving || isBatchUploading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-foodera-forest text-white text-xs font-bold hover:bg-foodera-forest/90 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isBatchSaving ? (
                      <>
                        <Loader2 className="animate-spin" size={15} />
                        Đang lưu dữ liệu...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        Lưu {successBatchCount > 0 ? `${successBatchCount} ảnh` : 'bộ ảnh'} vào thư viện
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-foodera-forest/10 text-foodera-forest rounded-xl">
                    <Images size={18} />
                  </span>
                  <h3 className="text-lg font-black text-gray-900">
                    {editingPhoto ? 'Chỉnh sửa ảnh Gallery' : 'Thêm ảnh mới vào Gallery'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
                {/* Image Upload Area */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Hình ảnh <span className="text-red-500">*</span>
                  </label>

                  <div className="space-y-3">
                    {/* Preview or Upload Dropzone */}
                    {formData.src ? (
                      <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video flex items-center justify-center group">
                        <img
                          src={formData.src}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 rounded-xl bg-white text-gray-800 text-xs font-bold hover:bg-gray-100 shadow-md flex items-center gap-1.5"
                          >
                            <Upload size={14} /> Thay ảnh khác
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, src: '' }))}
                            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md flex items-center gap-1.5"
                          >
                            <X size={14} /> Xóa ảnh
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 hover:border-foodera-forest bg-gray-50/50 hover:bg-emerald-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all"
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center py-4">
                            <Loader2 className="animate-spin text-foodera-forest mb-2" size={28} />
                            <p className="text-sm font-bold text-gray-700">Đang nén và tải ảnh lên Cloudinary...</p>
                            <p className="text-xs text-gray-400 mt-1">Ảnh sẽ tự động tối ưu hóa sang định dạng WebP</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-4">
                            <div className="w-12 h-12 rounded-full bg-foodera-forest/10 text-foodera-forest flex items-center justify-center mb-3">
                              <Upload size={22} />
                            </div>
                            <p className="text-sm font-bold text-gray-800">
                              Nhấn để chọn ảnh từ máy tính hoặc kéo thả vào đây
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Hỗ trợ PNG, JPG, WebP, AVIF lên đến 10MB (tự động nén WebP)
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={CMS_IMAGE_INPUT_ACCEPT}
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {/* Direct URL input fallback */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Link2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Hoặc dán URL hình ảnh trực tiếp (https://...)"
                          value={formData.src || ''}
                          onChange={(e) => setFormData((p) => ({ ...p, src: e.target.value }))}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Caption / Title */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Chú thích ảnh (Caption)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Kiểm tra mẫu Cashew Nut WW320..."
                    value={formData.caption || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, caption: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest bg-white"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Hiển thị ở góc dưới ảnh và trong chế độ phóng to Lightbox.
                  </span>
                </div>

                {/* Alt Text (SEO) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Văn bản thay thế (Alt Text - SEO)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: FoodEra team reviewing export products"
                    value={formData.alt || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, alt: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest bg-white"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Mô tả nội dung bức ảnh cho công cụ tìm kiếm Google và thiết bị trợ thính.
                  </span>
                </div>

                {/* Category & Sort Order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Danh mục <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category || 'activities'}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, category: e.target.value as GalleryCategory }))
                      }
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest bg-white font-medium"
                    >
                      <option value="activities">Hoạt động nội bộ (activities)</option>
                      <option value="trade-fairs">Hội chợ & Triển lãm (trade-fairs)</option>
                      <option value="farm-visits">Khảo sát nông trại (farm-visits)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Thứ tự hiển thị
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.sortOrder ?? 0}
                      onChange={(e) => setFormData((p) => ({ ...p, sortOrder: Number(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest bg-white"
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      Số nhỏ hơn sẽ xếp trước.
                    </span>
                  </div>
                </div>

                {/* Album (Set) Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Bộ ảnh / Album (Tùy chọn)
                    </label>
                    <select
                      value={PRESET_ALBUMS.some((a) => a.id === formData.album) ? formData.album : (formData.album ? 'custom' : '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setFormData((p) => ({ ...p, album: 'custom-album' }));
                        } else {
                          const found = PRESET_ALBUMS.find((a) => a.id === val);
                          setFormData((p) => ({
                            ...p,
                            album: val,
                            albumTitle: found && val ? found.title : (!val ? '' : p.albumTitle)
                          }));
                        }
                      }}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest bg-white font-medium"
                    >
                      {PRESET_ALBUMS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title}
                        </option>
                      ))}
                      <option value="custom">Nhập mã bộ ảnh tùy chỉnh...</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Tên bộ ảnh (Album Title)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Khảo sát Vùng trồng Sầu riêng..."
                      value={formData.albumTitle || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, albumTitle: e.target.value }))}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-foodera-forest/20 focus:border-foodera-forest bg-white"
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      Giúp nhóm các ảnh liên quan thành một bộ ảnh trên trang Gallery.
                    </span>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-sm font-bold text-gray-800 block">Hiển thị trên website</span>
                    <span className="text-xs text-gray-400">
                      Bật để khách truy cập có thể nhìn thấy ảnh này trên trang Gallery
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive !== false}
                      onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foodera-forest"></div>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-foodera-forest text-white text-sm font-bold hover:bg-foodera-forest/90 transition-all shadow-sm disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        {editingPhoto ? 'Cập nhật ảnh' : 'Lưu vào thư viện'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Xác nhận xóa ảnh?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Bức ảnh này sẽ bị xóa khỏi thư viện và không còn hiển thị trên trang Gallery. Thao tác này không thể hoàn tác.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Xác nhận xóa
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminGallery;
