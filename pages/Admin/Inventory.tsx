
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { Product, CategoryType } from '../../types';
import { googleSheetToCsvUrl, mapCsvRowsToProducts, parseCsv } from '../../lib/csvImport';
import { CMS_IMAGE_INPUT_ACCEPT, uploadCmsImage } from '../../lib/storageUploads';
import { PRODUCT_CATEGORIES } from '../../lib/productCategories';
import { getCategoryLabel, localizeProduct } from '../../lib/contentLocalization';
import {
  Package, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  Filter,
  CheckCircle,
  AlertCircle,
  X,
  Image as ImageIcon,
  Save,
  Loader2,
  Trash,
  PlusCircle,
  Hash,
  Tag,
  FileText,
  LogOut,
  Upload,
  Link as LinkIcon
} from 'lucide-react';

const isValidPdfUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return true;

  try {
    const parsed = new URL(trimmed);
    return parsed.pathname.toLowerCase().endsWith('.pdf');
  } catch {
    return false;
  }
};

const INVENTORY_DRAFT_KEY = 'foodmax_admin_inventory_draft_v1';

type InventoryDraft = {
  editingProductId: string | null;
  formData: Partial<Product>;
  newGalleryUrl: string;
};

const readInventoryDraft = (): InventoryDraft | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(INVENTORY_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InventoryDraft;
    if (!parsed || typeof parsed !== 'object' || !parsed.formData) return null;
    return {
      editingProductId: typeof parsed.editingProductId === 'string' ? parsed.editingProductId : null,
      formData: parsed.formData,
      newGalleryUrl: typeof parsed.newGalleryUrl === 'string' ? parsed.newGalleryUrl : ''
    };
  } catch {
    return null;
  }
};

const writeInventoryDraft = (draft: InventoryDraft) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(INVENTORY_DRAFT_KEY, JSON.stringify(draft));
};

const clearInventoryDraft = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(INVENTORY_DRAFT_KEY);
};

const cloneProductTranslations = (product?: Partial<Product>) => ({
  zh: {
    ...(product?.translations?.zh || {}),
    specifications: product?.translations?.zh?.specifications
      ? { ...product.translations.zh.specifications }
      : {}
  }
});

const buildNextProductId = (requestedId: string, existingIds: string[], excludedId?: string): string => {
  const baseId = requestedId.trim();
  const takenIds = new Set(existingIds.filter((id) => id !== excludedId));
  if (!takenIds.has(baseId)) return baseId;

  let suffix = 1;
  let candidate = `${baseId}(${suffix})`;
  while (takenIds.has(candidate)) {
    suffix += 1;
    candidate = `${baseId}(${suffix})`;
  }

  return candidate;
};

const AdminInventory: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useData();
  const { logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const copy =
    locale === 'zh'
      ? {
          exitHome: '返回首页',
          inventoryTitle: '全球产品库',
          addCommodity: '新增产品',
          importFromSheet: '从 Google Sheet 导入 CSV',
          importLink: '导入链接',
          importing: '导入中...',
          uploadCsv: '上传 CSV',
          searchPlaceholder: '按品名、等级、品类或 ID 搜索...',
          editCommodity: '编辑产品',
        createCommodity: '新建产品',
        translationSection: '中文翻译',
        translationNote: '用于简体中文目录输出；留空时默认回退到英文。',
        updatePortfolio: '提交产品更新',
        initializeCommodity: '创建产品条目',
        manageDesc: '管理 B2B 出口产品的规格与供货信息。',
        allCategories: '全部分类',
        productIntel: '产品情报',
        category: '分类',
        status: '状态',
        actions: '操作',
        activeExport: '有效出口中',
        noMatches: '未找到匹配产品',
        cmsLanguage: 'CMS 语言'
      }
      : {
          exitHome: 'Exit to Home',
          inventoryTitle: 'Global Inventory',
          addCommodity: 'Add New Commodity',
          importFromSheet: 'Import CSV from Google Sheet',
          importLink: 'Import Link',
          importing: 'Importing...',
          uploadCsv: 'Upload CSV',
          searchPlaceholder: 'Search by variety name, grade, category, or ID...',
          editCommodity: 'Edit Commodity',
          createCommodity: 'Register New Commodity',
          translationSection: 'Chinese Translation',
          translationNote: 'Optional fields for Simplified Chinese catalog output. Leave blank to fall back to English.',
          updatePortfolio: 'Commit Portfolio Update',
          initializeCommodity: 'Initialize Commodity Entry',
          manageDesc: 'Manage product specifications and stock availability for B2B export.',
          allCategories: 'All Categories',
          productIntel: 'Product Intelligence',
          category: 'Category',
          status: 'Status',
          actions: 'Actions',
          activeExport: 'Active Export',
          noMatches: 'No matching commodities found',
          cmsLanguage: 'CMS Language'
        };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [csvSheetUrl, setCsvSheetUrl] = useState('');
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvImportStatus, setCsvImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });
  const [isUploadingPrimaryImage, setIsUploadingPrimaryImage] = useState(false);
  const [primaryImageUploadError, setPrimaryImageUploadError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    id: '',
    name: '',
    category: 'Rice',
    subCategory: '',
    description: '',
    shortDescription: '',
    image: '',
    pdfUrl: '',
    gallery: [],
    specifications: {},
    filters: {}
  });
  const hasInvalidPdfUrl = Boolean(formData.pdfUrl?.trim()) && !isValidPdfUrl(formData.pdfUrl || '');

  useEffect(() => {
    const draft = readInventoryDraft();
    if (!draft) return;

    if (draft.editingProductId) {
      const existingProduct = products.find((item) => item.id === draft.editingProductId);
      setEditingProduct(existingProduct || ({ id: draft.editingProductId } as Product));
    } else {
      setEditingProduct(null);
    }

    setFormData(draft.formData);
    setNewGalleryUrl(draft.newGalleryUrl);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      clearInventoryDraft();
      return;
    }

    writeInventoryDraft({
      editingProductId: editingProduct?.id || null,
      formData,
      newGalleryUrl
    });
  }, [isModalOpen, editingProduct?.id, formData, newGalleryUrl]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !normalizedSearchTerm ||
      p.name.toLowerCase().includes(normalizedSearchTerm) ||
      p.category.toLowerCase().includes(normalizedSearchTerm) ||
      p.subCategory.toLowerCase().includes(normalizedSearchTerm) ||
      (p.translations?.zh?.name || '').toLowerCase().includes(normalizedSearchTerm) ||
      (p.translations?.zh?.subCategory || '').toLowerCase().includes(normalizedSearchTerm) ||
      p.id.toLowerCase().includes(normalizedSearchTerm);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openModal = (product?: Product) => {
    setPrimaryImageUploadError(null);
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        pdfUrl: product.pdfUrl || '',
        gallery: product.gallery || [],
        specifications: { ...product.specifications },
        translations: cloneProductTranslations(product)
      });
    } else {
      setEditingProduct(null);
      setFormData({
        id: `FM-${Math.floor(Math.random() * 10000)}`,
        name: '',
        category: 'Rice',
        subCategory: '',
        description: '',
        shortDescription: '',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=1200',
        pdfUrl: '',
        gallery: [],
        specifications: { 'Broken': '5.0% Max', 'Moisture': '14.0% Max' },
        filters: { type: 'Standard' },
        translations: { zh: { name: '', subCategory: '', shortDescription: '', description: '', specifications: {} } }
      });
    }
    setNewGalleryUrl('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setPrimaryImageUploadError(null);
    clearInventoryDraft();
  };

  const handleAddGalleryImage = () => {
    if (!newGalleryUrl.trim()) return;
    setFormData({
      ...formData,
      gallery: [...(formData.gallery || []), newGalleryUrl.trim()]
    });
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryImage = (index: number) => {
    const updatedGallery = [...(formData.gallery || [])];
    updatedGallery.splice(index, 1);
    setFormData({ ...formData, gallery: updatedGallery });
  };

  const handlePrimaryImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setPrimaryImageUploadError(null);
    setIsUploadingPrimaryImage(true);

    try {
      const publicUrl = await uploadCmsImage(file, [
        'products',
        (formData.id || editingProduct?.id || formData.name || 'product').trim(),
        'hero'
      ]);

      setFormData((prev) => ({
        ...prev,
        image: publicUrl
      }));
    } catch (err: any) {
      setPrimaryImageUploadError(err?.message || 'Image upload failed.');
    } finally {
      setIsUploadingPrimaryImage(false);
    }
  };

  // Specification Management
  const handleAddSpec = () => {
    setFormData({
      ...formData,
      specifications: {
        ...formData.specifications,
        [`Attribute ${Object.keys(formData.specifications || {}).length + 1}`]: 'Value'
      }
    });
  };

  const handleUpdateSpec = (oldKey: string, newKey: string, value: string) => {
    const newSpecs = { ...formData.specifications };
    if (oldKey !== newKey) {
      delete newSpecs[oldKey];
    }
    newSpecs[newKey] = value;
    setFormData({ ...formData, specifications: newSpecs });
  };

  const handleRemoveSpec = (key: string) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData({ ...formData, specifications: newSpecs });
  };

  const updateZhTranslation = (field: 'name' | 'subCategory' | 'shortDescription' | 'description', value: string) => {
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        zh: {
          ...prev.translations?.zh,
          [field]: value
        }
      }
    }));
  };

  const handleUpdateZhSpec = (oldKey: string, newKey: string, value: string) => {
    const specs = { ...(formData.translations?.zh?.specifications || {}) };
    if (oldKey !== newKey) {
      delete specs[oldKey];
    }
    specs[newKey] = value;
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        zh: {
          ...prev.translations?.zh,
          specifications: specs
        }
      }
    }));
  };

  const handleAddZhSpec = () => {
    const nextSpecs = {
      ...(formData.translations?.zh?.specifications || {}),
      [`中文属性 ${Object.keys(formData.translations?.zh?.specifications || {}).length + 1}`]: '数值'
    };
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        zh: {
          ...prev.translations?.zh,
          specifications: nextSpecs
        }
      }
    }));
  };

  const handleRemoveZhSpec = (key: string) => {
    const nextSpecs = { ...(formData.translations?.zh?.specifications || {}) };
    delete nextSpecs[key];
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        zh: {
          ...prev.translations?.zh,
          specifications: nextSpecs
        }
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const requestedId = formData.id?.trim() || '';
    if (!requestedId) {
      alert("Product ID is required.");
      setIsSaving(false);
      return;
    }

    if (hasInvalidPdfUrl) {
      alert('Product PDF URL must be a valid URL and end with .pdf');
      setIsSaving(false);
      return;
    }

    const collision = products.find((p) => p.id === requestedId && p.id !== editingProduct?.id);
    let resolvedId = requestedId;
    let replacedExistingProduct = false;

    if (collision) {
      const shouldReplace = window.confirm(
        `The ID "${requestedId}" is already assigned to "${collision.name}". Press OK to replace it, or Cancel to save this product as a new ID.`
      );

      if (shouldReplace) {
        replacedExistingProduct = true;
      } else {
        resolvedId = buildNextProductId(requestedId, products.map((product) => product.id), editingProduct?.id);
      }
    }

    const nextProduct = {
      ...formData,
      id: resolvedId
    } as Product;

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 600));

      if (editingProduct) {
        await updateProduct(nextProduct, editingProduct.id);
      } else if (replacedExistingProduct) {
        await updateProduct(nextProduct);
      } else {
        await addProduct(nextProduct);
      }

      if (resolvedId !== requestedId) {
        alert(`The ID "${requestedId}" already existed, so this product was saved as "${resolvedId}".`);
      }

      closeModal();
    } catch (err: any) {
      alert(err?.message || 'Unable to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the global catalog?`)) {
      deleteProduct(id);
    }
  };

  const importProductsFromCsvText = async (csvText: string, sourceLabel: string) => {
    const parsed = parseCsv(csvText);
    if (!parsed.rows.length) {
      throw new Error('CSV has no data rows to import.');
    }

    const mapped = mapCsvRowsToProducts(parsed.rows);
    if (!mapped.items.length) {
      throw new Error(mapped.errors[0] || 'No valid product rows found.');
    }

    const existingById = new Map(products.map((item) => [item.id, item]));
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of mapped.items) {
      if (existingById.has(item.id)) {
        await updateProduct(item);
        updatedCount += 1;
      } else {
        await addProduct(item);
        createdCount += 1;
      }
      existingById.set(item.id, item);
    }

    if (mapped.errors.length > 0) {
      // eslint-disable-next-line no-console
      console.warn('Product CSV skipped rows:', mapped.errors);
    }

    const skippedPart = mapped.errors.length > 0 ? `, skipped ${mapped.errors.length} invalid row(s)` : '';
    setCsvImportStatus({
      type: 'success',
      message: `${sourceLabel}: imported ${mapped.items.length} product(s) (${createdCount} new, ${updatedCount} updated${skippedPart}).`
    });
  };

  const handleImportFromSheet = async () => {
    const rawUrl = csvSheetUrl.trim();
    if (!rawUrl) {
      setCsvImportStatus({ type: 'error', message: 'Please enter a Google Sheet link first.' });
      return;
    }

    setIsImportingCsv(true);
    setCsvImportStatus({ type: null, message: '' });
    try {
      const csvUrl = googleSheetToCsvUrl(rawUrl);
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`Unable to download CSV (HTTP ${response.status}). Check sharing/publish settings on Google Sheet.`);
      }
      const csvText = await response.text();
      await importProductsFromCsvText(csvText, 'Google Sheet');
    } catch (err: any) {
      setCsvImportStatus({ type: 'error', message: err?.message || 'CSV import failed.' });
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleCsvFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImportingCsv(true);
    setCsvImportStatus({ type: null, message: '' });
    try {
      const csvText = await file.text();
      await importProductsFromCsvText(csvText, file.name || 'CSV file');
    } catch (err: any) {
      setCsvImportStatus({ type: 'error', message: err?.message || 'CSV import failed.' });
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleExit = () => {
    logout();
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Mini Sidebar */}
      <aside className="w-22 bg-foodmax-forest text-white flex flex-col items-center py-8 gap-8 sticky top-0 h-screen shadow-2xl z-20">
        <Link to="/admin" className="p-3.5 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/5"><ChevronLeft size={24} /></Link>
        <div className="flex flex-col gap-6 flex-grow">
          <Link to="/admin/inventory" className="p-3.5 bg-foodmax-lime text-foodmax-forest rounded-2xl shadow-xl shadow-foodmax-lime/20 border border-foodmax-lime/20"><Package size={24} /></Link>
        </div>

        {/* Mini Branded Exit Button */}
        <div className="mt-auto pt-6 border-t border-white/10 w-full flex flex-col items-center gap-4">
          <Link
            to="/"
            onClick={handleExit}
            className="p-3 hover:bg-white/10 rounded-2xl transition-all group relative overflow-visible"
            title={locale === 'zh' ? '返回首页' : 'Exit to Homepage'}
          >
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
               <div className="flex items-center relative">
                  <span className="text-foodmax-forest font-[900] text-xl">F</span>
               </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-foodmax-lime rounded-full flex items-center justify-center border-2 border-foodmax-forest shadow-md">
              <LogOut size={10} className="text-foodmax-forest" />
            </div>
            
            {/* Tooltip Label */}
            <div className="absolute left-full ml-4 py-2 px-3 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl">
              {copy.exitHome}
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </Link>
        </div>
      </aside>

      <main className="flex-grow p-8 md:p-12 overflow-y-auto">
        {/* ... (Existing main content remains identical) */}
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{copy.inventoryTitle}</h1>
              <p className="text-gray-500 font-medium">{copy.manageDesc}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                <span>{copy.cmsLanguage}</span>
                <button type="button" onClick={() => setLocale('en')} className={locale === 'en' ? 'text-foodmax-forest' : ''}>
                  EN
                </button>
                <span>/</span>
                <button type="button" onClick={() => setLocale('zh')} className={locale === 'zh' ? 'text-foodmax-forest' : ''}>
                  中文
                </button>
              </div>
              <button 
                onClick={() => openModal()}
                className="px-8 py-4 bg-foodmax-forest text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl hover:bg-foodmax-lime hover:text-foodmax-forest transition-all"
              >
                <Plus size={20} /> {copy.addCommodity}
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end gap-3">
              <div className="flex-grow space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  {copy.importFromSheet}
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input
                    type="url"
                    value={csvSheetUrl}
                    onChange={(e) => setCsvSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium"
                  />
                </div>
              </div>
              <button
                onClick={handleImportFromSheet}
                disabled={isImportingCsv}
                className="px-6 py-3 bg-foodmax-forest text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60 hover:bg-foodmax-lime hover:text-foodmax-forest transition-all"
              >
                {isImportingCsv ? copy.importing : copy.importLink}
              </button>
              <label className="px-6 py-3 border border-gray-200 rounded-xl text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-all">
                <Upload size={14} /> {copy.uploadCsv}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileUpload}
                  disabled={isImportingCsv}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              Supported product columns: id, name, category, subCategory, shortDescription, description, image, pdfUrl, gallery,
              specifications/spec_* and filters/filter_*.
            </p>
            {csvImportStatus.type && (
              <div
                className={`px-4 py-3 rounded-xl text-sm font-semibold ${
                  csvImportStatus.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {csvImportStatus.message}
              </div>
            )}
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-grow relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="text" 
                placeholder={copy.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-foodmax-forest/10 border-none text-sm font-medium"
              />
            </div>
            <div className="relative md:w-72">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={16} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-foodmax-forest/10 border-none text-xs font-black text-gray-500 uppercase tracking-widest cursor-pointer"
              >
                <option value="all">{copy.allCategories}</option>
                {PRODUCT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category as CategoryType, locale)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{copy.productIntel}</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{copy.category}</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{copy.status}</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{copy.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map(p => {
                  const localized = localizeProduct(p, locale);
                  return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-inner">
                          <img src={p.image} className="w-full h-full object-cover" alt={localized.name} />
                        </div>
                        <div>
                          <p className="text-base font-black text-gray-900 leading-tight">{localized.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">ID: {p.id.toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-foodmax-forest/5 text-foodmax-forest text-[10px] font-black uppercase tracking-widest rounded-lg">
                        {getCategoryLabel(p.category, locale)}
                      </span>
                      <p className="text-xs text-gray-400 font-bold mt-1">{localized.subCategory}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500" />
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{copy.activeExport}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => openModal(p)}
                          className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-foodmax-forest hover:text-white transition-all shadow-sm"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && (
              <div className="py-20 text-center">
                <AlertCircle size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-black uppercase text-xs tracking-widest">{copy.noMatches}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal remains identical */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-foodmax-forest text-white">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  {editingProduct ? copy.editCommodity : copy.createCommodity}
                </h2>
                <p className="text-foodmax-lime/60 text-[10px] font-bold uppercase tracking-widest mt-1">Export Intelligence Update</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-10 space-y-10">
              {/* Product SKU / ID - NOW MANUALLY EDITABLE */}
              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-foodmax-forest text-white rounded-lg"><Tag size={18} /></div>
                   <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Unique Identifier (SKU / ID)</h3>
                </div>
                <input 
                  type="text" 
                  value={formData.id}
                  onChange={(e) => setFormData({...formData, id: e.target.value})}
                  className="w-full px-4 py-4 bg-white border-2 border-transparent focus:border-foodmax-forest/20 rounded-xl outline-none text-sm font-black transition-all"
                  placeholder="e.g. RICE-JASMINE-001"
                  required
                />
                <p className="text-[10px] text-gray-400 italic">
                  {editingProduct 
                    ? "Warning: Changing the ID will update the primary key for this record across the system."
                    : "This ID is used for system mapping and can be manually adjusted later."}
                </p>
              </div>

              {/* Main Image Section */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Primary Hero Visual (URL or upload)</label>
                <div className="flex gap-6 items-start">
                  <div className="w-40 h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-gray-200" size={32} />
                    )}
                  </div>
                  <div className="flex-grow space-y-2">
                    <input 
                      type="url" 
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium"
                      required
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <label
                        className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          isUploadingPrimaryImage
                            ? 'cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400'
                            : 'cursor-pointer border-gray-200 bg-white text-foodmax-forest hover:border-foodmax-forest/20 hover:bg-foodmax-forest/5'
                        }`}
                      >
                        {isUploadingPrimaryImage ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {isUploadingPrimaryImage ? 'Uploading image...' : 'Upload from computer'}
                        <input
                          type="file"
                          accept={CMS_IMAGE_INPUT_ACCEPT}
                          onChange={handlePrimaryImageUpload}
                          disabled={isUploadingPrimaryImage}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-gray-400 font-medium">JPG, PNG, WEBP, GIF, AVIF. Max 10MB.</span>
                    </div>
                    <p className="text-[10px] text-gray-400 italic">This is the main image displayed in the catalog.</p>
                    {primaryImageUploadError && (
                      <p className="text-[10px] text-red-500 italic">{primaryImageUploadError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Product PDF Section */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Product PDF / Technical Datasheet (Optional)</label>
                <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  <div className="p-2 bg-foodmax-forest text-white rounded-lg">
                    <FileText size={16} />
                  </div>
                  <div className="flex-grow space-y-2">
                    <input
                      type="url"
                      value={formData.pdfUrl || ''}
                      onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                      placeholder="https://example.com/spec-sheet.pdf"
                      className={`w-full px-4 py-3 bg-white rounded-xl border-2 outline-none text-sm font-medium ${
                        hasInvalidPdfUrl ? 'border-red-300 focus:border-red-400' : 'border-transparent focus:border-foodmax-forest/20'
                      }`}
                    />
                    {hasInvalidPdfUrl ? (
                      <p className="text-[10px] text-red-500 italic">
                        Please enter a valid PDF link (must end with .pdf).
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400 italic">
                        Link a spec/certificate PDF to display on the Product Detail page.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Gallery Section */}
              <div className="space-y-6 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <div>
                  <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest block mb-2">Product Detail Gallery</label>
                  <p className="text-[11px] text-gray-500 mb-6">Add close-up shots of grains, beans, or export packaging.</p>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {formData.gallery?.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group bg-white border border-gray-100 shadow-sm">
                      <img src={url} className="w-full h-full object-cover" alt={`detail-${idx}`} />
                      <button 
                        type="button"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))}
                  {(!formData.gallery || formData.gallery.length < 3) && (
                    <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300">
                      <ImageIcon size={20} />
                      <span className="text-[9px] font-black uppercase tracking-widest mt-2">Empty Slot</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder="Add detail image URL..."
                    className="flex-grow px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none text-xs font-medium"
                  />
                  <button 
                    type="button"
                    onClick={handleAddGalleryImage}
                    className="px-4 py-3 bg-foodmax-forest text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-foodmax-lime hover:text-foodmax-forest transition-colors"
                  >
                    Add Photo
                  </button>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Variety Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Global Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as CategoryType})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-bold cursor-pointer"
                  >
                    {PRODUCT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Sub-Category</label>
                <input 
                  type="text" 
                  value={formData.subCategory}
                  onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-bold"
                  placeholder="e.g. Premium & Fragrant Rice"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Short Commercial Description</label>
                <input 
                  type="text" 
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium"
                  placeholder="Brief hook for catalog browsing..."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Technical Portfolio Description</label>
                <textarea 
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium resize-none"
                  placeholder="Comprehensive variety details and processing standards..."
                  required
                />
              </div>

              <div className="space-y-6 rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foodmax-forest">{copy.translationSection}</h4>
                  <p className="mt-2 text-[11px] font-medium text-gray-500">
                    {copy.translationNote}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Chinese Name</label>
                    <input
                      type="text"
                      value={formData.translations?.zh?.name || ''}
                      onChange={(e) => updateZhTranslation('name', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium"
                      placeholder="中文产品名称"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Chinese Sub-Category</label>
                    <input
                      type="text"
                      value={formData.translations?.zh?.subCategory || ''}
                      onChange={(e) => updateZhTranslation('subCategory', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium"
                      placeholder="中文子分类"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Chinese Short Description</label>
                  <input
                    type="text"
                    value={formData.translations?.zh?.shortDescription || ''}
                    onChange={(e) => updateZhTranslation('shortDescription', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium"
                    placeholder="中文简短描述"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Chinese Technical Description</label>
                  <textarea
                    rows={4}
                    value={formData.translations?.zh?.description || ''}
                    onChange={(e) => updateZhTranslation('description', e.target.value)}
                    className="w-full px-4 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium resize-none"
                    placeholder="中文技术说明"
                  />
                </div>
              </div>

              {/* DYNAMIC QUALITY SPECS EDITOR */}
              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Hash size={14} className="text-foodmax-forest" /> Quality Matrix / Specifications
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Technical laboratory values</p>
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddSpec}
                    className="flex items-center gap-2 text-[10px] font-black text-foodmax-forest hover:text-foodmax-lime transition-colors uppercase tracking-widest"
                  >
                    <PlusCircle size={16} /> Add Attribute
                  </button>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(formData.specifications || {}).map(([key, value], idx) => (
                    <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex-[2]">
                        <input 
                          type="text"
                          value={key}
                          onChange={(e) => handleUpdateSpec(key, e.target.value, value as string)}
                          placeholder="Label (e.g. Moisture)"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <div className="flex-[3]">
                        <input 
                          type="text"
                          value={value as string}
                          onChange={(e) => handleUpdateSpec(key, key, e.target.value)}
                          placeholder="Value (e.g. 14.0% Max)"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveSpec(key)}
                        className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {Object.keys(formData.specifications || {}).length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No quality specs defined</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Hash size={14} className="text-foodmax-forest" /> Chinese Specifications
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Localized labels for zh catalog output</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddZhSpec}
                    className="flex items-center gap-2 text-[10px] font-black text-foodmax-forest hover:text-foodmax-lime transition-colors uppercase tracking-widest"
                  >
                    <PlusCircle size={16} /> Add Chinese Attribute
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.entries(formData.translations?.zh?.specifications || {}).map(([key, value], idx) => (
                    <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex-[2]">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => handleUpdateZhSpec(key, e.target.value, value as string)}
                          placeholder="标签（如 水分）"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black tracking-widest outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <div className="flex-[3]">
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => handleUpdateZhSpec(key, key, e.target.value)}
                          placeholder="值（如 14.0% Max）"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveZhSpec(key)}
                        className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {Object.keys(formData.translations?.zh?.specifications || {}).length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No Chinese specs defined</p>
                    </div>
                  )}
                </div>
              </div>
            </form>

            <div className="p-8 border-t border-gray-100 bg-gray-50 flex items-center gap-4">
              <button 
                onClick={closeModal}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
              >
                Discard Changes
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || isUploadingPrimaryImage}
                className="flex-[2] py-4 bg-foodmax-forest text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-foodmax-lime hover:text-foodmax-forest transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <><Save size={18} /> {editingProduct ? copy.updatePortfolio : copy.initializeCommodity}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
