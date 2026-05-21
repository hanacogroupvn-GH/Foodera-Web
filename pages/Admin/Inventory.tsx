
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { Product, CategoryType, SupportedLocale } from '../../types';
import { googleSheetToCsvUrl, mapCsvRowsToProducts, parseCsv } from '../../lib/csvImport';
import { CMS_IMAGE_INPUT_ACCEPT, uploadCmsImage } from '../../lib/storageUploads';
import { PRODUCT_CATEGORIES } from '../../lib/productCategories';
import { getCategoryLabel, localizeProduct } from '../../lib/contentLocalization';
import { buildProductPdfPrintHtml as buildProductPdfTemplateHtml } from '../../lib/productPdfExport';
import { appRoutes } from '../../lib/routes';
import { preserveVietnamesePlaceNamesDeep } from '../../lib/preserveVietnamesePlaceNames';
import { repairMojibakeDeep, repairMojibakeText } from '../../lib/repairMojibake';
import { canTranslateCmsContent, translateProductToChinese } from '../../lib/zhTranslation';
import pdfFooterImage from '../../pdf-footer-current.png';
import pdfHeaderImage from '../../letterhead-logo.png';
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
  Link as LinkIcon,
  Languages,
  RefreshCw,
  FileDown,
  MapPinned
} from 'lucide-react';
import { AdminSidebar } from '../../components/AdminSidebar';

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

const INVENTORY_DRAFT_KEY = 'foodera_admin_inventory_draft_v1';

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
    ...preserveVietnamesePlaceNamesDeep(product?.translations?.zh || {}),
    specifications: product?.translations?.zh?.specifications
      ? preserveVietnamesePlaceNamesDeep({ ...product.translations.zh.specifications })
      : {},
    packaging: product?.translations?.zh?.packaging
      ? preserveVietnamesePlaceNamesDeep({ ...product.translations.zh.packaging })
      : {},
    payment: product?.translations?.zh?.payment
      ? preserveVietnamesePlaceNamesDeep({ ...product.translations.zh.payment })
      : {}
  }
});

const normalizeRecordSection = (record?: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(record || {})
      .map(([key, value]) => [key.trim(), String(value).trim()] as const)
      .filter(([key, value]) => key && value)
  );

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
  const { products, addProduct, updateProduct, deleteProduct, refresh } = useData();
  const { logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const rawCopy =
    locale === 'zh'
      ? {
          exitHome: '返回首页',
          inventoryTitle: '全球产品库',
          addCommodity: '新增产品',
          importFromSheet: '从 Google 表格导入 CSV',
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
          cmsLanguage: 'CMS 语言',
          imageUploadFailed: '图片上传失败。',
          productIdRequired: '产品 ID 为必填项。',
          saveFailed: '无法保存产品。',
          csvLinkRequired: '请先输入 Google 表格链接。',
          csvImportFailed: 'CSV 导入失败。',
          uploadingImage: '图片上传中...',
          uploadFromComputer: '从电脑上传',
          primaryImageHint: '这是目录中显示的主图。',
          productPdfSection: '产品 PDF / 技术资料表（可选）',
          productPdfPlaceholder: 'https://example.com/spec-sheet.pdf',
          productPdfInvalid: '请输入有效的 PDF 链接（必须以 .pdf 结尾）。',
          productPdfHelp: '链接到将在产品详情页展示的规格书或证书 PDF。',
          galleryTitle: '产品详情图库',
          galleryDesc: '可添加颗粒、豆类或出口包装的特写图片。',
          emptySlot: '空位',
          addPhoto: '添加图片',
          varietyName: '产品名称',
          globalCategory: '全球分类',
          subCategoryLabel: '子分类',
          subCategoryPlaceholder: '例如：高端香米系列',
          shortDescriptionLabel: '简短商业描述',
          shortDescriptionPlaceholder: '用于目录浏览的简要卖点...',
          descriptionLabel: '技术组合描述',
          descriptionPlaceholder: '完整填写品种细节与加工标准...',
          zhNameLabel: '中文名称',
          zhNamePlaceholder: '中文产品名称',
          zhSubCategoryLabel: '中文子分类',
          zhSubCategoryPlaceholder: '中文子分类',
          zhShortDescriptionLabel: '中文简短描述',
          zhShortDescriptionPlaceholder: '中文简短描述',
          zhDescriptionLabel: '中文技术描述',
          zhDescriptionPlaceholder: '中文技术说明',
          specsTitle: '质量矩阵 / 规格参数',
          specsDesc: '实验室技术指标',
          addAttribute: '添加属性',
          noSpecs: '尚未定义质量规格',
          zhSpecsTitle: '中文规格参数',
          zhSpecsDesc: '用于中文目录输出的本地化标签',
          addZhAttribute: '添加中文属性',
          noZhSpecs: '尚未定义中文规格',
          discardChanges: '放弃更改',
          specsLabelPlaceholder: '标签（如：水分）',
          specsValuePlaceholder: '数值（如：14.0% Max）',
          zhSpecsLabelPlaceholder: '标签（如：水分）',
          zhSpecsValuePlaceholder: '数值（如：14.0% Max）'
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
          cmsLanguage: 'CMS Language',
          imageUploadFailed: 'Image upload failed.',
          productIdRequired: 'Product ID is required.',
          saveFailed: 'Unable to save product.',
          csvLinkRequired: 'Please enter a Google Sheet link first.',
          csvImportFailed: 'CSV import failed.',
          uploadingImage: 'Uploading image...',
          uploadFromComputer: 'Upload from computer',
          primaryImageHint: 'This is the main image displayed in the catalog.',
          productPdfSection: 'Product PDF / Technical Datasheet (Optional)',
          productPdfPlaceholder: 'https://example.com/spec-sheet.pdf',
          productPdfInvalid: 'Please enter a valid PDF link (must end with .pdf).',
          productPdfHelp: 'Link a spec/certificate PDF to display on the Product Detail page.',
          galleryTitle: 'Product Detail Gallery',
          galleryDesc: 'Add close-up shots of grains, beans, or export packaging.',
          emptySlot: 'Empty Slot',
          addPhoto: 'Add Photo',
          varietyName: 'Variety Name',
          globalCategory: 'Global Category',
          subCategoryLabel: 'Sub-Category',
          subCategoryPlaceholder: 'e.g. Premium & Fragrant Rice',
          shortDescriptionLabel: 'Short Description',
          shortDescriptionPlaceholder: 'Brief hook for catalog browsing...',
          descriptionLabel: 'Technical Portfolio Description',
          descriptionPlaceholder: 'Comprehensive variety details and processing standards...',
          zhNameLabel: 'Chinese Name',
          zhNamePlaceholder: 'Chinese product name',
          zhSubCategoryLabel: 'Chinese Sub-Category',
          zhSubCategoryPlaceholder: 'Chinese sub-category',
          zhShortDescriptionLabel: 'Chinese Short Description',
          zhShortDescriptionPlaceholder: 'Chinese short description',
          zhDescriptionLabel: 'Chinese Technical Description',
          zhDescriptionPlaceholder: 'Chinese technical description',
          specsTitle: 'Quality Matrix / Specifications',
          specsDesc: 'Technical laboratory values',
          addAttribute: 'Add Attribute',
          noSpecs: 'No quality specs defined',
          zhSpecsTitle: 'Chinese Specifications',
          zhSpecsDesc: 'Localized labels for zh catalog output',
          addZhAttribute: 'Add Chinese Attribute',
          noZhSpecs: 'No Chinese specs defined',
          discardChanges: 'Discard Changes',
          specsLabelPlaceholder: 'Label (e.g. Moisture)',
          specsValuePlaceholder: 'Value (e.g. 14.0% Max)',
          zhSpecsLabelPlaceholder: 'Label (e.g. Moisture)',
          zhSpecsValuePlaceholder: 'Value (e.g. 14.0% Max)'
        };
  const zh = repairMojibakeText;
  const baseCopy = locale === 'zh' ? repairMojibakeDeep(rawCopy) : rawCopy;
  const copy = {
    ...baseCopy,
    ...(locale === 'zh'
      ? {
          packagingTitle: zh('\u5305\u88c5\u4e0e\u88c5\u8fd0'),
          packagingDesc: zh('\u5305\u88c5\u89c4\u683c\u3001\u5185\u886c\u3001\u88c5\u67dc\u4e0e\u50a8\u5b58\u8bf4\u660e'),
          addPackagingAttribute: zh('\u6dfb\u52a0\u5305\u88c5\u5c5e\u6027'),
          noPackaging: zh('\u5c1a\u672a\u5b9a\u4e49\u5305\u88c5\u4e0e\u88c5\u8fd0'),
          packagingLabelPlaceholder: zh('\u6807\u7b7e\uff08\u5982\uff1aPackaging Details\uff09'),
          packagingValuePlaceholder: zh('\u6570\u503c\uff08\u5982\uff1a25kg / 50kg new PP bags\uff09'),
          paymentTitle: zh('\u4ed8\u6b3e\u4e0e\u4ea4\u4ed8'),
          paymentDesc: zh('\u8d38\u6613\u6761\u6b3e\u3001\u4ed8\u6b3e\u65b9\u5f0f\u4e0e\u4ea4\u671f'),
          addPaymentAttribute: zh('\u6dfb\u52a0\u4ed8\u6b3e\u5c5e\u6027'),
          noPayment: zh('\u5c1a\u672a\u5b9a\u4e49\u4ed8\u6b3e\u4e0e\u4ea4\u4ed8'),
          paymentLabelPlaceholder: zh('\u6807\u7b7e\uff08\u5982\uff1aIncoterms\uff09'),
          paymentValuePlaceholder: zh('\u6570\u503c\uff08\u5982\uff1aFOB Ho Chi Minh / CIF / CFR\uff09'),
          zhPackagingTitle: zh('\u4e2d\u6587\u5305\u88c5\u4e0e\u88c5\u8fd0'),
          zhPackagingDesc: zh('\u7528\u4e8e\u4e2d\u6587\u76ee\u5f55\u7684\u5305\u88c5\u4e0e\u88c5\u8fd0\u6807\u7b7e'),
          addZhPackagingAttribute: zh('\u6dfb\u52a0\u4e2d\u6587\u5305\u88c5\u5c5e\u6027'),
          noZhPackaging: zh('\u5c1a\u672a\u5b9a\u4e49\u4e2d\u6587\u5305\u88c5\u4e0e\u88c5\u8fd0'),
          zhPackagingLabelPlaceholder: zh('\u6807\u7b7e\uff08\u5982\uff1a\u5305\u88c5\u8be6\u60c5\uff09'),
          zhPackagingValuePlaceholder: zh('\u6570\u503c'),
          zhPaymentTitle: zh('\u4e2d\u6587\u4ed8\u6b3e\u4e0e\u4ea4\u4ed8'),
          zhPaymentDesc: zh('\u7528\u4e8e\u4e2d\u6587\u76ee\u5f55\u7684\u4ed8\u6b3e\u4e0e\u4ea4\u4ed8\u6807\u7b7e'),
          addZhPaymentAttribute: zh('\u6dfb\u52a0\u4e2d\u6587\u4ed8\u6b3e\u5c5e\u6027'),
          noZhPayment: zh('\u5c1a\u672a\u5b9a\u4e49\u4e2d\u6587\u4ed8\u6b3e\u4e0e\u4ea4\u4ed8'),
          zhPaymentLabelPlaceholder: zh('\u6807\u7b7e\uff08\u5982\uff1a\u4ed8\u6b3e\u6761\u6b3e\uff09'),
          zhPaymentValuePlaceholder: zh('\u6570\u503c')
        }
      : {
          packagingTitle: 'Packaging & Loading',
          packagingDesc: 'Bagging, liner, container loading, and storage notes',
          addPackagingAttribute: 'Add Packaging Attribute',
          noPackaging: 'No packaging or loading details defined',
          packagingLabelPlaceholder: 'Label (e.g. Packaging Details)',
          packagingValuePlaceholder: 'Value (e.g. 25kg / 50kg new PP bags)',
          paymentTitle: 'Payment & Delivery',
          paymentDesc: 'Incoterms, payment terms, and lead time',
          addPaymentAttribute: 'Add Payment Attribute',
          noPayment: 'No payment or delivery details defined',
          paymentLabelPlaceholder: 'Label (e.g. Incoterms)',
          paymentValuePlaceholder: 'Value (e.g. FOB Ho Chi Minh / CIF / CFR)',
          zhPackagingTitle: 'Chinese Packaging & Loading',
          zhPackagingDesc: 'Localized packaging and loading labels for zh catalog output',
          addZhPackagingAttribute: 'Add Chinese Packaging Attribute',
          noZhPackaging: 'No Chinese packaging or loading details defined',
          zhPackagingLabelPlaceholder: 'Label (e.g. Packaging Details)',
          zhPackagingValuePlaceholder: 'Value',
          zhPaymentTitle: 'Chinese Payment & Delivery',
          zhPaymentDesc: 'Localized payment and delivery labels for zh catalog output',
          addZhPaymentAttribute: 'Add Chinese Payment Attribute',
          noZhPayment: 'No Chinese payment or delivery details defined',
          zhPaymentLabelPlaceholder: 'Label (e.g. Payment Terms)',
          zhPaymentValuePlaceholder: 'Value'
        })
  };
  const activeStatusLabel = locale === 'zh' ? zh('\u542f\u7528') : 'Active';
  const inactiveStatusLabel = locale === 'zh' ? zh('\u505c\u7528') : 'Inactive';
  const statusHelpText =
    locale === 'zh'
      ? zh('\u505c\u7528\u540e\uff0c\u8be5\u4ea7\u54c1\u5c06\u4e0d\u518d\u5728\u516c\u5f00\u7f51\u7ad9\u4e0a\u663e\u793a\u3002')
      : 'Inactive products are hidden from the public website.';
  const translateButtonLabel = locale === 'zh' ? zh('\u7ffb\u8bd1\u6210\u4e2d\u6587') : 'Translate to Chinese';
  const translatingButtonLabel = locale === 'zh' ? zh('\u7ffb\u8bd1\u4e2d...') : 'Translating...';
  const translateMissingKeyMessage =
    locale === 'zh'
      ? zh('Ollama \u7ffb\u8bd1\u672a\u5c31\u7eea\uff0c\u8bf7\u68c0\u67e5 VITE_OLLAMA_BASE_URL\u3001VITE_OLLAMA_MODEL \u6216\u672c\u5730 Ollama \u670d\u52a1\u3002')
      : 'Ollama translation is unavailable. Check VITE_OLLAMA_BASE_URL, VITE_OLLAMA_MODEL, or the local Ollama service.';
  const translateSuccessMessage =
    locale === 'zh' ? zh('\u5df2\u751f\u6210\u4e2d\u6587\u4ea7\u54c1\u7ffb\u8bd1\u5e76\u4fdd\u5b58\u3002') : 'Chinese product translation generated and saved.';
  const translateDraftSuccessMessage =
    locale === 'zh' ? zh('\u5df2\u586b\u5145\u4e2d\u6587\u4ea7\u54c1\u7ffb\u8bd1\u8349\u7a3f\u3002') : 'Chinese product translation draft populated.';
  const translateFailedPrefix = locale === 'zh' ? zh('\u7ffb\u8bd1\u5931\u8d25\uff1a') : 'Translation failed: ';
  const translateDraftRequirementMessage =
    locale === 'zh'
      ? zh('\u8bf7\u5148\u586b\u5199\u82f1\u6587\u4ea7\u54c1\u540d\u79f0\uff0c\u518d\u6267\u884c\u7ffb\u8bd1\u3002')
      : 'Fill in the English product name before translating.';
  const reloadButtonLabel = locale === 'zh' ? zh('\u91cd\u65b0\u52a0\u8f7d') : 'Reload';
  const reloadingButtonLabel = locale === 'zh' ? zh('\u52a0\u8f7d\u4e2d...') : 'Reloading...';
  const reloadSuccessMessage = locale === 'zh' ? zh('\u5df2\u91cd\u65b0\u52a0\u8f7d\u4ea7\u54c1\u6570\u636e\u3002') : 'Inventory reloaded from Turso.';
  const bulkTranslateButtonLabel = locale === 'zh' ? zh('\u6279\u91cf\u7ffb\u8bd1\u5f53\u524d\u5217\u8868') : 'Bulk Translate List';
  const bulkTranslatingButtonLabel = locale === 'zh' ? zh('\u6279\u91cf\u7ffb\u8bd1\u4e2d') : 'Bulk Translating';
  const bulkTranslateEmptyMessage =
    locale === 'zh' ? zh('\u5f53\u524d\u7b5b\u9009\u7ed3\u679c\u4e2d\u6ca1\u6709\u53ef\u7ffb\u8bd1\u7684\u4ea7\u54c1\u3002') : 'No products match the current list filters.';
  const bulkTranslateConfirmMessage = (count: number) =>
    locale === 'zh'
      ? zh(`\u8981\u5c06\u5f53\u524d\u5217\u8868\u4e2d\u7684 ${count} \u4e2a\u4ea7\u54c1\u6279\u91cf\u7ffb\u8bd1\u6210\u4e2d\u6587\u5417\uff1f\u8fd9\u4f1a\u8986\u76d6\u5df2\u6709\u7684\u4e2d\u6587\u5b57\u6bb5\u3002`)
      : `Translate the ${count} products in the current list to Chinese? This will overwrite existing Chinese fields.`;
  const bulkTranslateSuccessMessage = (successCount: number) =>
    locale === 'zh'
      ? zh(`\u5df2\u5b8c\u6210 ${successCount} \u4e2a\u4ea7\u54c1\u7684\u4e2d\u6587\u6279\u91cf\u7ffb\u8bd1\u3002`)
      : `Chinese translations completed for ${successCount} products.`;
  const bulkTranslatePartialMessage = (successCount: number, failureCount: number) =>
    locale === 'zh'
      ? zh(`\u6279\u91cf\u7ffb\u8bd1\u5b8c\u6210\uff0c\u6210\u529f ${successCount} \u4e2a\uff0c\u5931\u8d25 ${failureCount} \u4e2a\u3002`)
      : `Bulk translation finished with ${successCount} success and ${failureCount} failure(s).`;
  const exportPdfEnButtonLabel = locale === 'zh' ? zh('\u82f1\u6587 PDF') : 'EN PDF';
  const exportPdfCnButtonLabel = locale === 'zh' ? zh('\u4e2d\u6587 PDF') : 'CN PDF';
  const exportPdfBlockedMessage =
    locale === 'zh'
      ? zh('\u65e0\u6cd5\u6253\u5f00 PDF \u7a97\u53e3\uff0c\u8bf7\u5141\u8bb8\u6d4f\u89c8\u5668\u5f39\u7a97\u540e\u518d\u8bd5\u3002')
      : 'Unable to open the PDF window. Allow browser pop-ups and try again.';
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasDraftToRestore, setHasDraftToRestore] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [csvSheetUrl, setCsvSheetUrl] = useState('');
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  // CSV Import status handled via toast
  // Translation status handled via toast
  const [isUploadingPrimaryImage, setIsUploadingPrimaryImage] = useState(false);
  const [modalTab, setModalTab] = useState<'general' | 'media' | 'specs' | 'settings'>('general');
  const [translatingItemId, setTranslatingItemId] = useState<string | null>(null);
  const [isTranslatingDraft, setIsTranslatingDraft] = useState(false);
  const [isReloadingInventory, setIsReloadingInventory] = useState(false);
  const [isBulkTranslating, setIsBulkTranslating] = useState(false);
  const [bulkTranslateProgress, setBulkTranslateProgress] = useState({ current: 0, total: 0 });

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    id: '',
    name: '',
    isActive: true,
    category: 'Rice',
    subCategory: '',
    description: '',
    shortDescription: '',
    image: '',
    pdfUrl: '',
    gallery: [],
    specifications: {},
    packaging: {},
    payment: {},
    filters: {}
  });
  const hasInvalidPdfUrl = Boolean(formData.pdfUrl?.trim()) && !isValidPdfUrl(formData.pdfUrl || '');

  // Check for unsaved draft on mount (but don't auto-open — prompt user instead)
  useEffect(() => {
    const draft = readInventoryDraft();
    if (draft) setHasDraftToRestore(true);
  }, []);

  // Draft is intentionally NOT auto-restored on mount to prevent form from
  // re-opening when the user navigates back to this page from elsewhere.

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

  // Base filter: search + category (no status)
  const baseFilteredProducts = products.filter((p) => {
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

  const activeCount = baseFilteredProducts.filter((p) => p.isActive !== false).length;
  const inactiveCount = baseFilteredProducts.filter((p) => p.isActive === false).length;

  // Apply status filter on top of base
  const filteredProducts = baseFilteredProducts.filter((p) =>
    statusFilter === 'active' ? p.isActive !== false : p.isActive === false
  );

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const bulkTranslateTargets = useMemo(() => filteredProducts.slice(), [filteredProducts]);

  const handleRestoreDraft = () => {
    const draft = readInventoryDraft();
    if (!draft) return;
    if (draft.editingProductId) {
      const existingProduct = products.find((item) => item.id === draft.editingProductId);
      setEditingProduct(existingProduct || ({ id: draft.editingProductId } as Product));
    } else {
      setEditingProduct(null);
    }
    setFormData(preserveVietnamesePlaceNamesDeep(draft.formData));
    setNewGalleryUrl(draft.newGalleryUrl);
    setHasDraftToRestore(false);
    setIsModalOpen(true);
  };

  const handleDiscardDraft = () => {
    clearInventoryDraft();
    setHasDraftToRestore(false);
  };

  const openModal = (product?: Product) => {
    
    
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        pdfUrl: product.pdfUrl || '',
        gallery: product.gallery || [],
        specifications: { ...product.specifications },
        packaging: { ...(product.packaging || {}) },
        payment: { ...(product.payment || {}) },
        translations: cloneProductTranslations(product)
      });
    } else {
      setEditingProduct(null);
      setFormData({
        id: `FM-${Math.floor(Math.random() * 10000)}`,
        name: '',
        isActive: true,
        category: 'Rice',
        subCategory: '',
        description: '',
        shortDescription: '',
        image: '',
        pdfUrl: '',
        gallery: [],
        specifications: { 'Broken': '5.0% Max', 'Moisture': '14.0% Max' },
        packaging: {},
        payment: {},
        filters: { type: 'Standard' },
        translations: {
          zh: {
            name: '',
            subCategory: '',
            shortDescription: '',
            description: '',
            specifications: {},
            packaging: {},
            payment: {}
          }
        }
      });
    }
    setNewGalleryUrl('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    
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
      toast.error(err?.message || copy.imageUploadFailed);
    } finally {
      setIsUploadingPrimaryImage(false);
    }
  };

  const pushTranslationStatus = (type: 'success' | 'error', message: string) => {
    if (type === 'success') toast.success(message);
    else toast.error(message);
  };

  const translateProductSource = async (source: {
    name: string;
    subCategory: string;
    shortDescription: string;
    description: string;
    specifications: Record<string, string>;
    packaging: Record<string, string>;
    payment: Record<string, string>;
    filters: Record<string, string>;
  }) => {
    if (!canTranslateCmsContent) {
      throw new Error(translateMissingKeyMessage);
    }

    return translateProductToChinese(source);
  };

  const handleTranslateDraft = async () => {
    if (isTranslatingDraft) return;

    const source = {
      name: (formData.name || '').trim(),
      subCategory: (formData.subCategory || '').trim(),
      shortDescription: (formData.shortDescription || '').trim(),
      description: (formData.description || '').trim(),
      specifications: normalizeRecordSection(formData.specifications),
      packaging: normalizeRecordSection(formData.packaging),
      payment: normalizeRecordSection(formData.payment),
      filters: normalizeRecordSection(formData.filters as Record<string, string>)
    };

    if (!source.name) {
      pushTranslationStatus('error', translateDraftRequirementMessage);
      return;
    }

    setIsTranslatingDraft(true);
    try {
      const translated = await translateProductSource(source);
      setFormData((prev) => ({
        ...prev,
        translations: {
          ...prev.translations,
          zh: {
            ...prev.translations?.zh,
            name: translated.name || prev.translations?.zh?.name || '',
            subCategory: translated.subCategory || prev.translations?.zh?.subCategory || '',
            shortDescription: translated.shortDescription || prev.translations?.zh?.shortDescription || '',
            description: translated.description || prev.translations?.zh?.description || '',
            specifications: translated.specifications || prev.translations?.zh?.specifications || {},
            packaging: translated.packaging || prev.translations?.zh?.packaging || {},
            payment: translated.payment || prev.translations?.zh?.payment || {},
            filters: translated.filters || prev.translations?.zh?.filters || {}
          }
        }
      }));
      pushTranslationStatus('success', translateDraftSuccessMessage);
    } catch (error: any) {
      pushTranslationStatus('error', `${translateFailedPrefix}${error?.message || ''}`);
    } finally {
      setIsTranslatingDraft(false);
    }
  };

  const handleTranslateExistingProduct = async (product: Product) => {
    if (translatingItemId === product.id) return;

    setTranslatingItemId(product.id);
    try {
      const translated = await translateProductSource({
        name: product.name.trim(),
        subCategory: product.subCategory.trim(),
        shortDescription: product.shortDescription.trim(),
        description: product.description.trim(),
        specifications: normalizeRecordSection(product.specifications),
        packaging: normalizeRecordSection(product.packaging),
        payment: normalizeRecordSection(product.payment),
        filters: normalizeRecordSection(product.filters as Record<string, string>)
      });

      await updateProduct({
        ...product,
        isActive: product.isActive !== false,
        translations: {
          ...product.translations,
          zh: {
            ...(product.translations?.zh || {}),
            name: translated.name || product.translations?.zh?.name || '',
            subCategory: translated.subCategory || product.translations?.zh?.subCategory || '',
            shortDescription: translated.shortDescription || product.translations?.zh?.shortDescription || '',
            description: translated.description || product.translations?.zh?.description || '',
            specifications: translated.specifications || product.translations?.zh?.specifications || {},
            packaging: translated.packaging || product.translations?.zh?.packaging || {},
            payment: translated.payment || product.translations?.zh?.payment || {},
            filters: translated.filters || product.translations?.zh?.filters || {}
          }
        }
      });

      pushTranslationStatus('success', translateSuccessMessage);
    } catch (error: any) {
      pushTranslationStatus('error', `${translateFailedPrefix}${error?.message || ''}`);
    } finally {
      setTranslatingItemId(null);
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

  const handleAddPackaging = () => {
    setFormData({
      ...formData,
      packaging: {
        ...(formData.packaging || {}),
        [`Packaging ${Object.keys(formData.packaging || {}).length + 1}`]: 'Value'
      }
    });
  };

  const handleUpdatePackaging = (oldKey: string, newKey: string, value: string) => {
    const nextPackaging = { ...(formData.packaging || {}) };
    if (oldKey !== newKey) {
      delete nextPackaging[oldKey];
    }
    nextPackaging[newKey] = value;
    setFormData({ ...formData, packaging: nextPackaging });
  };

  const handleRemovePackaging = (key: string) => {
    const nextPackaging = { ...(formData.packaging || {}) };
    delete nextPackaging[key];
    setFormData({ ...formData, packaging: nextPackaging });
  };

  const handleAddPayment = () => {
    setFormData({
      ...formData,
      payment: {
        ...(formData.payment || {}),
        [`Payment ${Object.keys(formData.payment || {}).length + 1}`]: 'Value'
      }
    });
  };

  const handleUpdatePayment = (oldKey: string, newKey: string, value: string) => {
    const nextPayment = { ...(formData.payment || {}) };
    if (oldKey !== newKey) {
      delete nextPayment[oldKey];
    }
    nextPayment[newKey] = value;
    setFormData({ ...formData, payment: nextPayment });
  };

  const handleRemovePayment = (key: string) => {
    const nextPayment = { ...(formData.payment || {}) };
    delete nextPayment[key];
    setFormData({ ...formData, payment: nextPayment });
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

  const handleAddZhPackaging = () => {
    const nextPackaging = {
      ...(formData.translations?.zh?.packaging || {}),
      [`${zh('包装')} ${Object.keys(formData.translations?.zh?.packaging || {}).length + 1}`]: zh('数值')
    };
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        zh: {
          ...prev.translations?.zh,
          packaging: nextPackaging
        }
      }
    }));
  };

  const handleUpdateZhPackaging = (oldKey: string, newKey: string, value: string) => {
    const nextPackaging = { ...(formData.translations?.zh?.packaging || {}) };
    if (oldKey !== newKey) {
      delete nextPackaging[oldKey];
    }
    nextPackaging[newKey] = value;
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        zh: {
          ...prev.translations?.zh,
          packaging: nextPackaging
        }
      }
    }));
  };

  const handleRemoveZhPackaging = (key: string) => {
    const nextPackaging = { ...(formData.translations?.zh?.packaging || {}) };
    delete nextPackaging[key];
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        zh: {
          ...prev.translations?.zh,
          packaging: nextPackaging
        }
      }
    }));
  };

  const handleAddZhPayment = () => {
    const nextPayment = {
      ...(formData.translations?.zh?.payment || {}),
      [`${zh('付款')} ${Object.keys(formData.translations?.zh?.payment || {}).length + 1}`]: zh('数值')
    };
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        zh: {
          ...prev.translations?.zh,
          payment: nextPayment
        }
      }
    }));
  };

  const handleUpdateZhPayment = (oldKey: string, newKey: string, value: string) => {
    const nextPayment = { ...(formData.translations?.zh?.payment || {}) };
    if (oldKey !== newKey) {
      delete nextPayment[oldKey];
    }
    nextPayment[newKey] = value;
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        zh: {
          ...prev.translations?.zh,
          payment: nextPayment
        }
      }
    }));
  };

  const handleRemoveZhPayment = (key: string) => {
    const nextPayment = { ...(formData.translations?.zh?.payment || {}) };
    delete nextPayment[key];
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        zh: {
          ...prev.translations?.zh,
          payment: nextPayment
        }
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const requestedId = formData.id?.trim() || '';
    if (!requestedId) {
      alert(copy.productIdRequired);
      setIsSaving(false);
      return;
    }

    if (hasInvalidPdfUrl) {
      alert(copy.productPdfInvalid);
      setIsSaving(false);
      return;
    }

    const collision = products.find((p) => p.id === requestedId && p.id !== editingProduct?.id);
    let resolvedId = requestedId;
    let replacedExistingProduct = false;

    if (collision) {
      const shouldReplace = window.confirm(
        locale === 'zh'
          ? zh(`ID \u201c${requestedId}\u201d \u5df2\u5206\u914d\u7ed9 \u201c${collision.name}\u201d\u3002\u70b9\u51fb\u786e\u5b9a\u5c06\u8986\u76d6\u8be5\u8bb0\u5f55\uff0c\u70b9\u51fb\u53d6\u6d88\u5219\u4fdd\u5b58\u4e3a\u65b0\u7684 ID\u3002`)
          : `The ID "${requestedId}" is already assigned to "${collision.name}". Press OK to replace it, or Cancel to save this product as a new ID.`
      );

      if (shouldReplace) {
        replacedExistingProduct = true;
      } else {
        resolvedId = buildNextProductId(requestedId, products.map((product) => product.id), editingProduct?.id);
      }
    }

    const nextProduct = {
      ...formData,
      isActive: formData.isActive !== false,
      id: resolvedId,
      specifications: normalizeRecordSection(formData.specifications),
      packaging: normalizeRecordSection(formData.packaging),
      payment: normalizeRecordSection(formData.payment),
      translations: {
        ...formData.translations,
        zh: formData.translations?.zh
          ? {
              ...formData.translations.zh,
              specifications: normalizeRecordSection(formData.translations.zh.specifications),
              packaging: normalizeRecordSection(formData.translations.zh.packaging),
              payment: normalizeRecordSection(formData.translations.zh.payment)
            }
          : undefined
      }
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
        alert(
          locale === 'zh'
            ? zh(`ID \u201c${requestedId}\u201d \u5df2\u5b58\u5728\uff0c\u56e0\u6b64\u8be5\u4ea7\u54c1\u5df2\u4fdd\u5b58\u4e3a \u201c${resolvedId}\u201d\u3002`)
            : `The ID "${requestedId}" already existed, so this product was saved as "${resolvedId}".`
        );
      }

      closeModal();
    } catch (err: any) {
      alert(err?.message || copy.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(locale === 'zh' ? zh(`\u786e\u5b9a\u8981\u5c06 ${name} \u4ece\u5168\u7403\u76ee\u5f55\u4e2d\u79fb\u9664\u5417\uff1f`) : `Are you sure you want to remove ${name} from the global catalog?`)) {
      deleteProduct(id);
    }
  };

  const importProductsFromCsvText = async (csvText: string, sourceLabel: string) => {
    const parsed = parseCsv(csvText);
    if (!parsed.rows.length) {
      throw new Error(locale === 'zh' ? zh('CSV \u4e2d\u6ca1\u6709\u53ef\u5bfc\u5165\u7684\u6570\u636e\u884c\u3002') : 'CSV has no data rows to import.');
    }

    const mapped = mapCsvRowsToProducts(parsed.rows);
    if (!mapped.items.length) {
      throw new Error(mapped.errors[0] || (locale === 'zh' ? zh('\u672a\u627e\u5230\u6709\u6548\u7684\u4ea7\u54c1\u6570\u636e\u884c\u3002') : 'No valid product rows found.'));
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
      console.warn(locale === 'zh' ? zh('\u4ea7\u54c1 CSV \u5df2\u8df3\u8fc7\u4ee5\u4e0b\u884c:') : 'Product CSV skipped rows:', mapped.errors);
    }

    const skippedPart =
      mapped.errors.length > 0
        ? locale === 'zh'
          ? zh(`\uff0c\u8df3\u8fc7 ${mapped.errors.length} \u884c\u65e0\u6548\u6570\u636e`)
          : `, skipped ${mapped.errors.length} invalid row(s)`
        : '';
    toast.success(
        locale === 'zh'
          ? zh(`${sourceLabel}: \u5df2\u5bfc\u5165 ${mapped.items.length} \u4e2a\u4ea7\u54c1\uff08\u65b0\u589e ${createdCount} \u4e2a\uff0c\u66f4\u65b0 ${updatedCount} \u4e2a${skippedPart}\uff09\u3002`)
          : `${sourceLabel}: imported ${mapped.items.length} product(s) (${createdCount} new, ${updatedCount} updated${skippedPart}).`
    );
  };

  const handleImportFromSheet = async () => {
    const rawUrl = csvSheetUrl.trim();
    if (!rawUrl) {
      toast.error(copy.csvLinkRequired);
      return;
    }

    setIsImportingCsv(true);
    
    try {
      const csvUrl = googleSheetToCsvUrl(rawUrl);
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(
          locale === 'zh'
            ? zh(`\u65e0\u6cd5\u4e0b\u8f7d CSV\uff08HTTP ${response.status}\uff09\u3002\u8bf7\u68c0\u67e5 Google Sheet \u7684\u5171\u4eab\u6216\u53d1\u5e03\u8bbe\u7f6e\u3002`)
            : `Unable to download CSV (HTTP ${response.status}). Check sharing/publish settings on Google Sheet.`
        );
      }
      const csvText = await response.text();
      await importProductsFromCsvText(csvText, locale === 'zh' ? zh('Google \u8868\u683c') : 'Google Sheet');
    } catch (err: any) {
      toast.error(err?.message || copy.csvImportFailed);
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleCsvFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImportingCsv(true);
    
    try {
      const csvText = await file.text();
      await importProductsFromCsvText(csvText, file.name || (locale === 'zh' ? zh('CSV \u6587\u4ef6') : 'CSV file'));
    } catch (err: any) {
      toast.error(err?.message || copy.csvImportFailed);
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleReloadInventory = async () => {
    if (isReloadingInventory || isBulkTranslating) return;

    setIsReloadingInventory(true);
    
    try {
      await refresh();
      pushTranslationStatus('success', reloadSuccessMessage);
    } catch (error: any) {
      pushTranslationStatus('error', error?.message || copy.saveFailed);
    } finally {
      setIsReloadingInventory(false);
    }
  };

  const handleBulkTranslateFiltered = async () => {
    if (isBulkTranslating || isReloadingInventory) return;

    if (!canTranslateCmsContent) {
      pushTranslationStatus('error', translateMissingKeyMessage);
      return;
    }

    if (bulkTranslateTargets.length === 0) {
      pushTranslationStatus('error', bulkTranslateEmptyMessage);
      return;
    }

    if (!window.confirm(bulkTranslateConfirmMessage(bulkTranslateTargets.length))) {
      return;
    }

    setIsBulkTranslating(true);
    setBulkTranslateProgress({ current: 0, total: bulkTranslateTargets.length });
    

    let successCount = 0;
    let failureCount = 0;

    try {
      for (let index = 0; index < bulkTranslateTargets.length; index += 1) {
        const product = bulkTranslateTargets[index];
        setBulkTranslateProgress({ current: index + 1, total: bulkTranslateTargets.length });

        try {
          const translated = await translateProductSource({
            name: product.name.trim(),
            subCategory: product.subCategory.trim(),
            shortDescription: product.shortDescription.trim(),
            description: product.description.trim(),
            specifications: normalizeRecordSection(product.specifications),
            packaging: normalizeRecordSection(product.packaging),
            payment: normalizeRecordSection(product.payment),
            filters: normalizeRecordSection(product.filters as Record<string, string>)
          });

          await updateProduct({
            ...product,
            isActive: product.isActive !== false,
            translations: {
              ...product.translations,
              zh: {
                ...(product.translations?.zh || {}),
                name: translated.name || product.translations?.zh?.name || '',
                subCategory: translated.subCategory || product.translations?.zh?.subCategory || '',
                shortDescription: translated.shortDescription || product.translations?.zh?.shortDescription || '',
                description: translated.description || product.translations?.zh?.description || '',
                specifications: translated.specifications || product.translations?.zh?.specifications || {},
                packaging: translated.packaging || product.translations?.zh?.packaging || {},
                payment: translated.payment || product.translations?.zh?.payment || {},
                filters: translated.filters || product.translations?.zh?.filters || {}
              }
            }
          });

          successCount += 1;
        } catch (error) {
          failureCount += 1;
          // eslint-disable-next-line no-console
          console.error(`Bulk translation failed for ${product.id}:`, error);
        }
      }

      await refresh();

      if (failureCount > 0) {
        pushTranslationStatus('error', bulkTranslatePartialMessage(successCount, failureCount));
        return;
      }

      pushTranslationStatus('success', bulkTranslateSuccessMessage(successCount));
    } finally {
      setIsBulkTranslating(false);
      setBulkTranslateProgress({ current: 0, total: 0 });
    }
  };

  
  const handleExportZip = async () => {
    if (isExportingZip) return;
    setIsExportingZip(true);
    const toastId = toast.loading(locale === 'zh' ? '正在准备 PDF...' : 'Preparing PDFs...');
    
    try {
      const zip = new JSZip();
      
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule.default || html2pdfModule) as any;
      
      const capturePdfToBlob = async (htmlContent: string, filename: string): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.width = '794px';
          iframe.style.height = '1122px';
          iframe.style.top = '0';
          iframe.style.left = '0';
          iframe.style.zIndex = '-9999';
          iframe.style.opacity = '0';
          iframe.style.pointerEvents = 'none';
          document.body.appendChild(iframe);

          iframe.onload = async () => {
            try {
              const doc = iframe.contentDocument;
              if (!doc) throw new Error('No iframe document available');

              // Wait for images to load
              const imgs = Array.from(doc.querySelectorAll('img'));
              if (imgs.length > 0) {
                let loaded = 0;
                await new Promise<void>((imgResolve) => {
                  imgs.forEach((img) => {
                    if (img.complete) {
                      loaded++;
                      if (loaded === imgs.length) imgResolve();
                    } else {
                      img.onload = () => {
                        loaded++;
                        if (loaded === imgs.length) imgResolve();
                      };
                      img.onerror = () => {
                        loaded++;
                        if (loaded === imgs.length) imgResolve();
                      };
                    }
                  });
                });
              }

              // Give browser time to paint styles
              await new Promise((r) => setTimeout(r, 200));

              const blob = await html2pdf()
                .from(doc.documentElement)
                .set({
                  margin: 0,
                  filename,
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 794 },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                })
                .output('blob');
              
              document.body.removeChild(iframe);
              resolve(blob);
            } catch (err) {
              document.body.removeChild(iframe);
              reject(err);
            }
          };

          iframe.contentDocument?.open();
          iframe.contentDocument?.write(htmlContent.replace(/<script>[\s\S]*?<\/script>/gi, ''));
          iframe.contentDocument?.close();
        });
      };

      let processed = 0;
      
      for (const p of products) {
        if (!p.id) continue;
        
        const htmlEn = buildProductPdfTemplateHtml(p, 'en', { headerImageSrc: pdfHeaderImage, footerImageSrc: pdfFooterImage });
        const pdfEnBlob = await capturePdfToBlob(htmlEn, `${p.id}-EN.pdf`);
        zip.folder('EN')?.folder(p.category)?.file(`${p.id}-EN.pdf`, pdfEnBlob);
        
        const htmlCn = buildProductPdfTemplateHtml(p, 'zh', { headerImageSrc: pdfHeaderImage, footerImageSrc: pdfFooterImage });
        const pdfCnBlob = await capturePdfToBlob(htmlCn, `${p.id}-CN.pdf`);
        zip.folder('CN')?.folder(p.category)?.file(`${p.id}-CN.pdf`, pdfCnBlob);
        
        processed++;
        toast.loading(`${locale === 'zh' ? '导出' : 'Exporting'} ${processed}/${products.length}...`, { id: toastId });
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `FoodEra-Products-${new Date().toISOString().slice(0,10)}.zip`);
      toast.success(locale === 'zh' ? 'PDF 批量导出成功！' : 'Bulk PDF Export completed!', { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to export ZIP', { id: toastId });
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportProductPdf = (product: Product, exportLocale: SupportedLocale) => {
    const popup = window.open('', '_blank', 'width=980,height=1180');
    if (!popup) {
      pushTranslationStatus('error', exportPdfBlockedMessage);
      return;
    }

    popup.document.open();
    popup.document.write(
      buildProductPdfTemplateHtml(product, exportLocale, {
        headerImageSrc: pdfHeaderImage,
        footerImageSrc: pdfFooterImage
      })
    );
    popup.document.close();
  };

  useEffect(() => {
    if (window.location.hash === '#create') {
      openModal();
      window.history.replaceState(null, '', window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExit = () => {
    logout();
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <AdminSidebar
        onLogout={handleExit}
        onOpenInventoryForm={() => openModal()}
        onCloseInventoryForm={closeModal}
        isInventoryFormOpen={isModalOpen}
      />

      {isModalOpen ? null : (
        <main className="flex-grow p-8 md:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{copy.inventoryTitle}</h1>
              <p className="text-gray-500 font-medium">{copy.manageDesc}</p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-3 md:flex-nowrap xl:w-auto xl:flex-nowrap">
              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
                <span>{copy.cmsLanguage}</span>
                <button type="button" onClick={() => setLocale('en')} className={locale === 'en' ? 'text-foodera-forest' : ''}>
                  EN
                </button>
                <span>/</span>
                <button type="button" onClick={() => setLocale('zh')} className={locale === 'zh' ? 'text-foodera-forest' : ''}>
                  {'\u4e2d\u6587'}
                </button>
              </div>
              <button
                type="button"
                onClick={handleReloadInventory}
                disabled={isReloadingInventory || isBulkTranslating}
                className="flex shrink-0 items-center justify-center w-[3.25rem] h-[3.25rem] rounded-2xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:border-foodera-forest hover:text-foodera-forest disabled:opacity-50 relative group"
              >
                {isReloadingInventory ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap w-max shadow-xl z-50 border border-gray-800">
                  {isReloadingInventory ? reloadingButtonLabel : reloadButtonLabel}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-[5px] w-2.5 h-2.5 bg-gray-900 border-t border-l border-gray-800 rotate-45"></div>
                </div>
              </button>
              <button
                type="button"
                onClick={handleBulkTranslateFiltered}
                disabled={isBulkTranslating || isReloadingInventory}
                className="flex shrink-0 items-center justify-center w-[3.25rem] h-[3.25rem] rounded-2xl border border-foodera-forest/15 bg-foodera-forest/5 text-foodera-forest shadow-sm transition-all hover:bg-foodera-forest hover:text-white disabled:opacity-50 relative group"
              >
                {isBulkTranslating ? <Loader2 size={20} className="animate-spin" /> : <Languages size={20} />}
                <div className="absolute top-full mt-3 right-0 lg:left-1/2 lg:-translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap w-max shadow-xl z-50 border border-gray-800">
                  {isBulkTranslating
                    ? `${bulkTranslatingButtonLabel} ${bulkTranslateProgress.current}/${bulkTranslateProgress.total}`
                    : `${bulkTranslateButtonLabel} (${bulkTranslateTargets.length})`}
                  <div className="absolute bottom-full right-4 lg:left-1/2 lg:-translate-x-1/2 translate-y-[5px] w-2.5 h-2.5 bg-gray-900 border-t border-l border-gray-800 rotate-45"></div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={handleExportZip}
                disabled={isExportingZip}
                className="flex shrink-0 items-center justify-center w-[3.25rem] h-[3.25rem] rounded-2xl bg-white border border-gray-200 text-foodera-forest shadow-sm transition-all hover:bg-gray-50 hover:text-foodera-lime disabled:opacity-50 relative group"
              >
                {isExportingZip ? <Loader2 size={20} className="animate-spin" /> : <FileDown size={20} />}
                <div className="absolute top-full mt-3 right-0 lg:left-1/2 lg:-translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap w-max shadow-xl z-50 border border-gray-800">
                  {locale === 'zh' ? '导出全部为 ZIP' : 'Export PDF (ZIP)'}
                  <div className="absolute bottom-full right-4 lg:left-1/2 lg:-translate-x-1/2 translate-y-[5px] w-2.5 h-2.5 bg-gray-900 border-t border-l border-gray-800 rotate-45"></div>
                </div>
              </button>

              <button 
                onClick={() => openModal()}
                className="flex shrink-0 items-center justify-center gap-3 rounded-2xl bg-foodera-forest px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-xl transition-all hover:bg-foodera-lime hover:text-foodera-forest"
              >
                <Plus size={20} /> {copy.addCommodity}
              </button>
            </div>
          </div>

          {/* ── Draft Recovery Banner ────────────────────── */}
          {hasDraftToRestore && (
            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <FileText size={18} className="text-amber-600" />
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-sm font-black text-amber-900">
                  Bạn có bản nháp chưa lưu
                </p>
                <p className="text-xs text-amber-700 font-medium mt-0.5">
                  Tiếp tục chỉnh sửa bài viết đã lưu trước đó, hoặc bỏ qua để bắt đầu mới.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleRestoreDraft}
                  className="px-4 py-2 bg-foodera-forest text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-foodera-lime hover:text-foodera-forest transition-all shadow-sm"
                >
                  Tiếp tục chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-4 py-2 bg-white text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-all"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          )}

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
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-medium"
                  />
                </div>
              </div>
              <button
                onClick={handleImportFromSheet}
                disabled={isImportingCsv}
                className="px-6 py-3 bg-foodera-forest text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60 hover:bg-foodera-lime hover:text-foodera-forest transition-all"
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
              {locale === 'zh'
                ? '支持的产品列：id、name、category、subCategory、shortDescription、description、image、pdfUrl、gallery、specifications/spec_*、packaging/pack_*、payment/payment_* 以及 filters/filter_*。'
                : 'Supported product columns: id, name, category, subCategory, shortDescription, description, image, pdfUrl, gallery, specifications/spec_*, packaging/pack_*, payment/payment_* and filters/filter_*.'}
            </p>
            
            
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-grow relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="text" 
                placeholder={copy.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-foodera-forest/10 border-none text-sm font-medium"
              />
            </div>
          </div>

          {/* Status Tabs: Active / Inactive */}
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.16em] transition-all border ${
                statusFilter === 'active'
                  ? 'bg-foodera-forest text-white border-foodera-forest shadow-lg'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-foodera-forest/30 hover:text-foodera-forest'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${
                  statusFilter === 'active' ? 'bg-foodera-lime' : 'bg-green-400'
                }`} />
                Active
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                statusFilter === 'active' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setStatusFilter('inactive'); setCurrentPage(1); }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.16em] transition-all border ${
                statusFilter === 'inactive'
                  ? 'bg-gray-700 text-white border-gray-700 shadow-lg'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-gray-400" />
                Inactive
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                statusFilter === 'inactive' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {inactiveCount}
              </span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar gap-1">
            <button
              onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
              className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.16em] whitespace-nowrap border-b-2 transition-all ${
                selectedCategory === 'all' 
                ? 'border-foodera-forest text-foodera-forest' 
                : 'border-transparent text-gray-400 hover:text-gray-900 hover:border-gray-200'
              }`}
            >
              {copy.allCategories}
            </button>
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.16em] whitespace-nowrap border-b-2 transition-all ${
                  selectedCategory === cat
                  ? 'border-foodera-forest text-foodera-forest' 
                  : 'border-transparent text-gray-400 hover:text-gray-900 hover:border-gray-200'
                }`}
              >
                {getCategoryLabel(cat as CategoryType, locale)}
              </button>
            ))}
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
                {paginatedProducts.map(p => {
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
                      <span className="px-3 py-1 bg-foodera-forest/5 text-foodera-forest text-[10px] font-black uppercase tracking-widest rounded-lg">
                        {getCategoryLabel(p.category, locale)}
                      </span>
                      <p className="text-xs text-gray-400 font-bold mt-1">{localized.subCategory}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap items-center gap-2">
                        {p.isActive !== false ? (
                          <CheckCircle size={14} className="text-green-500" />
                        ) : (
                          <X size={14} className="text-gray-400" />
                        )}
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                          {p.isActive !== false ? activeStatusLabel : inactiveStatusLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExportProductPdf(p, 'en')}
                          className="inline-flex items-center gap-2 rounded-xl border border-foodera-forest/15 bg-foodera-forest/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-foodera-forest transition-all hover:bg-foodera-forest hover:text-white"
                          title={exportPdfEnButtonLabel}
                        >
                          <FileDown size={14} />
                          <span>{exportPdfEnButtonLabel}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportProductPdf(p, 'zh')}
                          className="inline-flex items-center gap-2 rounded-xl border border-foodera-lime/30 bg-foodera-lime/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-foodera-forest transition-all hover:bg-foodera-lime hover:text-foodera-forest"
                          title={exportPdfCnButtonLabel}
                        >
                          <FileDown size={14} />
                          <span>{exportPdfCnButtonLabel}</span>
                        </button>
                        <button 
                          onClick={() => openModal(p)}
                          className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-foodera-forest hover:text-white transition-all shadow-sm"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleTranslateExistingProduct(p)}
                          disabled={translatingItemId === p.id}
                          className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-foodera-forest hover:text-white transition-all shadow-sm disabled:opacity-50"
                          title={translateButtonLabel}
                        >
                          {translatingItemId === p.id ? <Loader2 size={18} className="animate-spin" /> : <Languages size={18} />}
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-4">
                   Page {currentPage} / {totalPages}
                 </span>
                 <div className="flex gap-2">
                   <button 
                     disabled={currentPage === 1}
                     onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                     className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-black uppercase text-gray-600 disabled:opacity-50 hover:bg-white transition-all bg-gray-100"
                   >
                     Prev
                   </button>
                   <button 
                     disabled={currentPage === totalPages}
                     onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                     className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-black uppercase text-gray-600 disabled:opacity-50 hover:bg-white transition-all bg-gray-100"
                   >
                     Next
                   </button>
                 </div>
              </div>
            )}
          </div>
        </div>
        </main>
      )}

      {/* ── Full-page Form ─────────────────────────── */}
      {isModalOpen && (
        <main className="flex-grow flex flex-col overflow-hidden bg-white">
          <div className="bg-foodera-forest text-white px-10 py-6 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  {editingProduct ? copy.editCommodity : copy.createCommodity}
                </h2>
                <p className="text-foodera-lime/60 text-[10px] font-bold uppercase tracking-widest mt-1">Export Intelligence Update</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            
            {/* Tab Bar */}
            <div className="flex border-b border-gray-200 px-10 pt-4 gap-1 bg-gray-50/50 flex-shrink-0">
              {(['general', 'media', 'specs', 'settings'] as const).map((tab) => {
                const tabLabels = { general: 'General', media: 'Gallery & Media', specs: 'Specs & Options', settings: 'Translation & Settings' };
                const isActive = modalTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setModalTab(tab)}
                    className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest rounded-t-xl transition-all ${
                      isActive
                        ? 'bg-white text-foodera-forest border border-gray-200 border-b-white -mb-px shadow-sm'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
                    }`}
                  >
                    {tabLabels[tab]}
                  </button>
                );
              })}
            </div>
            
            <form onSubmit={handleSave} className="flex-grow overflow-y-auto flex flex-col">
              <div className="flex-grow overflow-y-auto p-10 space-y-10">

              {modalTab === 'general' && (<>
              {/* Product SKU / ID - NOW MANUALLY EDITABLE */}
              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-foodera-forest text-white rounded-lg"><Tag size={18} /></div>
                   <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Unique Identifier (SKU / ID)</h3>
                </div>
                <input 
                  type="text" 
                  value={formData.id}
                  onChange={(e) => setFormData({...formData, id: e.target.value})}
                  className="w-full px-4 py-4 bg-white border-2 border-transparent focus:border-foodera-forest/20 rounded-xl outline-none text-sm font-black transition-all"
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
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-medium"
                      required
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <label
                        className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          isUploadingPrimaryImage
                            ? 'cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400'
                            : 'cursor-pointer border-gray-200 bg-white text-foodera-forest hover:border-foodera-forest/20 hover:bg-foodera-forest/5'
                        }`}
                      >
                        {isUploadingPrimaryImage ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {isUploadingPrimaryImage ? copy.uploadingImage : copy.uploadFromComputer}
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
                    <p className="text-[10px] text-gray-400 italic">{copy.primaryImageHint}</p>

                  </div>
                </div>
              </div>

              </>)}
              {modalTab === 'media' && (<>
              {/* Product PDF Section */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.productPdfSection}</label>
                <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  <div className="p-2 bg-foodera-forest text-white rounded-lg">
                    <FileText size={16} />
                  </div>
                  <div className="flex-grow space-y-2">
                    <input
                      type="url"
                      value={formData.pdfUrl || ''}
                      onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                      placeholder={copy.productPdfPlaceholder}
                      className={`w-full px-4 py-3 bg-white rounded-xl border-2 outline-none text-sm font-medium ${
                        hasInvalidPdfUrl ? 'border-red-300 focus:border-red-400' : 'border-transparent focus:border-foodera-forest/20'
                      }`}
                    />
                    {hasInvalidPdfUrl ? (
                      <p className="text-[10px] text-red-500 italic">
                        {copy.productPdfInvalid}
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400 italic">
                        {copy.productPdfHelp}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Gallery Section */}
              <div className="space-y-6 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <div>
                  <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest block mb-2">{copy.galleryTitle}</label>
                  <p className="text-[11px] text-gray-500 mb-6">{copy.galleryDesc}</p>
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
                      <span className="text-[9px] font-black uppercase tracking-widest mt-2">{copy.emptySlot}</span>
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
                    className="px-4 py-3 bg-foodera-forest text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-foodera-lime hover:text-foodera-forest transition-colors"
                  >
                    {copy.addPhoto}
                  </button>
                </div>
              </div>

              </>)}
              {modalTab === 'general' && (<>
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.varietyName}</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.globalCategory}</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as CategoryType})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-bold cursor-pointer"
                  >
                    {PRODUCT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{getCategoryLabel(category as CategoryType, locale)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.subCategoryLabel}</label>
                  <input 
                    type="text" 
                    value={formData.subCategory}
                    onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-bold"
                    placeholder={copy.subCategoryPlaceholder}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.status}</label>
                  <select
                    value={formData.isActive === false ? 'inactive' : 'active'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-bold cursor-pointer"
                  >
                    <option value="active">{activeStatusLabel}</option>
                    <option value="inactive">{inactiveStatusLabel}</option>
                  </select>
                  <p className="text-[10px] text-gray-400 italic">{statusHelpText}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.shortDescriptionLabel}</label>
                <input 
                  type="text" 
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-medium"
                  placeholder={copy.shortDescriptionPlaceholder}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.descriptionLabel}</label>
                <textarea 
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-medium resize-none"
                  placeholder={copy.descriptionPlaceholder}
                  required
                />
              </div>

              </>)}
              {modalTab === 'settings' && (<>
              <div className="space-y-6 rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foodera-forest">{copy.translationSection}</h4>
                    <p className="mt-2 text-[11px] font-medium text-gray-500">
                      {copy.translationNote}
                    </p>
                    {!canTranslateCmsContent && (
                      <p className="mt-2 text-[11px] font-medium text-amber-600">{translateMissingKeyMessage}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleTranslateDraft}
                    disabled={isTranslatingDraft}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-foodera-forest/15 bg-foodera-forest/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-foodera-forest transition-all hover:bg-foodera-forest hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isTranslatingDraft ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
                    {isTranslatingDraft ? translatingButtonLabel : translateButtonLabel}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.zhNameLabel}</label>
                    <input
                      type="text"
                      value={formData.translations?.zh?.name || ''}
                      onChange={(e) => updateZhTranslation('name', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-medium"
                      placeholder={copy.zhNamePlaceholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.zhSubCategoryLabel}</label>
                    <input
                      type="text"
                      value={formData.translations?.zh?.subCategory || ''}
                      onChange={(e) => updateZhTranslation('subCategory', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-medium"
                      placeholder={copy.zhSubCategoryPlaceholder}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.zhShortDescriptionLabel}</label>
                  <input
                    type="text"
                    value={formData.translations?.zh?.shortDescription || ''}
                    onChange={(e) => updateZhTranslation('shortDescription', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-medium"
                    placeholder={copy.zhShortDescriptionPlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.zhDescriptionLabel}</label>
                  <textarea
                    rows={4}
                    value={formData.translations?.zh?.description || ''}
                    onChange={(e) => updateZhTranslation('description', e.target.value)}
                    className="w-full px-4 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-medium resize-none"
                    placeholder={copy.zhDescriptionPlaceholder}
                  />
                </div>
              </div>

              </>)}
              {modalTab === 'specs' && (<>
              {/* DYNAMIC QUALITY SPECS EDITOR */}
              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Hash size={14} className="text-foodera-forest" /> {copy.specsTitle}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{copy.specsDesc}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddSpec}
                    className="flex items-center gap-2 text-[10px] font-black text-foodera-forest hover:text-foodera-lime transition-colors uppercase tracking-widest"
                  >
                    <PlusCircle size={16} /> {copy.addAttribute}
                  </button>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(formData.specifications || {}).map(([key, value], idx) => (
                    <div key={idx} className="flex items-center gap-3 group animate-in fade-in slide-in-from-top-1 duration-200 border-b border-gray-50 pb-2 mb-2">
                      <div className="flex-[2]">
                        <input 
                          type="text"
                          value={key}
                          onChange={(e) => handleUpdateSpec(key, e.target.value, value as string)}
                          placeholder={copy.specsLabelPlaceholder}
                          className="w-full px-4 py-3 bg-transparent border-2 border-transparent hover:border-gray-50 focus:bg-white focus:shadow-sm focus:border-foodera-forest/20 rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all placeholder:text-gray-300"
                        />
                      </div>
                      <div className="flex-[3]">
                        <input 
                          type="text"
                          value={value as string}
                          onChange={(e) => handleUpdateSpec(key, key, e.target.value)}
                          placeholder={copy.specsValuePlaceholder}
                          className="w-full px-4 py-3 bg-transparent border-2 border-transparent hover:border-gray-50 focus:bg-white focus:shadow-sm focus:border-foodera-forest/20 rounded-xl text-xs font-bold outline-none transition-all placeholder:text-gray-300"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveSpec(key)}
                        className="p-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {Object.keys(formData.specifications || {}).length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{copy.noSpecs}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Tag size={14} className="text-foodera-forest" /> {copy.packagingTitle}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{copy.packagingDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPackaging}
                    className="flex items-center gap-2 text-[10px] font-black text-foodera-forest hover:text-foodera-lime transition-colors uppercase tracking-widest"
                  >
                    <PlusCircle size={16} /> {copy.addPackagingAttribute}
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.entries(formData.packaging || {}).map(([key, value], idx) => (
                    <div key={idx} className="flex items-center gap-3 group animate-in fade-in slide-in-from-top-1 duration-200 border-b border-gray-50 pb-2 mb-2">
                      <div className="flex-[2]">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => handleUpdatePackaging(key, e.target.value, value as string)}
                          placeholder={copy.packagingLabelPlaceholder}
                          className="w-full px-4 py-3 bg-transparent border-2 border-transparent hover:border-gray-50 focus:bg-white focus:shadow-sm focus:border-foodera-forest/20 rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all placeholder:text-gray-300"
                        />
                      </div>
                      <div className="flex-[3]">
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => handleUpdatePackaging(key, key, e.target.value)}
                          placeholder={copy.packagingValuePlaceholder}
                          className="w-full px-4 py-3 bg-transparent border-2 border-transparent hover:border-gray-50 focus:bg-white focus:shadow-sm focus:border-foodera-forest/20 rounded-xl text-xs font-bold outline-none transition-all placeholder:text-gray-300"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePackaging(key)}
                        className="p-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {Object.keys(formData.packaging || {}).length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{copy.noPackaging}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Tag size={14} className="text-foodera-forest" /> {copy.paymentTitle}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{copy.paymentDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPayment}
                    className="flex items-center gap-2 text-[10px] font-black text-foodera-forest hover:text-foodera-lime transition-colors uppercase tracking-widest"
                  >
                    <PlusCircle size={16} /> {copy.addPaymentAttribute}
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.entries(formData.payment || {}).map(([key, value], idx) => (
                    <div key={idx} className="flex items-center gap-3 group animate-in fade-in slide-in-from-top-1 duration-200 border-b border-gray-50 pb-2 mb-2">
                      <div className="flex-[2]">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => handleUpdatePayment(key, e.target.value, value as string)}
                          placeholder={copy.paymentLabelPlaceholder}
                          className="w-full px-4 py-3 bg-transparent border-2 border-transparent hover:border-gray-50 focus:bg-white focus:shadow-sm focus:border-foodera-forest/20 rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all placeholder:text-gray-300"
                        />
                      </div>
                      <div className="flex-[3]">
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => handleUpdatePayment(key, key, e.target.value)}
                          placeholder={copy.paymentValuePlaceholder}
                          className="w-full px-4 py-3 bg-transparent border-2 border-transparent hover:border-gray-50 focus:bg-white focus:shadow-sm focus:border-foodera-forest/20 rounded-xl text-xs font-bold outline-none transition-all placeholder:text-gray-300"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePayment(key)}
                        className="p-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {Object.keys(formData.payment || {}).length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{copy.noPayment}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Hash size={14} className="text-foodera-forest" /> {copy.zhSpecsTitle}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{copy.zhSpecsDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddZhSpec}
                    className="flex items-center gap-2 text-[10px] font-black text-foodera-forest hover:text-foodera-lime transition-colors uppercase tracking-widest"
                  >
                    <PlusCircle size={16} /> {copy.addZhAttribute}
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.entries(formData.translations?.zh?.specifications || {}).map(([key, value], idx) => (
                    <div key={idx} className="flex items-center gap-3 group animate-in fade-in slide-in-from-top-1 duration-200 border-b border-gray-50 pb-2 mb-2">
                      <div className="flex-[2]">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => handleUpdateZhSpec(key, e.target.value, value as string)}
                          placeholder={copy.zhSpecsLabelPlaceholder}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black tracking-widest outline-none focus:border-foodera-forest"
                        />
                      </div>
                      <div className="flex-[3]">
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => handleUpdateZhSpec(key, key, e.target.value)}
                          placeholder={copy.zhSpecsValuePlaceholder}
                          className="w-full px-4 py-3 bg-transparent border-2 border-transparent hover:border-gray-50 focus:bg-white focus:shadow-sm focus:border-foodera-forest/20 rounded-xl text-xs font-bold outline-none transition-all placeholder:text-gray-300"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveZhSpec(key)}
                        className="p-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {Object.keys(formData.translations?.zh?.specifications || {}).length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{copy.noZhSpecs}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Tag size={14} className="text-foodera-forest" /> {copy.zhPackagingTitle}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{copy.zhPackagingDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddZhPackaging}
                    className="flex items-center gap-2 text-[10px] font-black text-foodera-forest hover:text-foodera-lime transition-colors uppercase tracking-widest"
                  >
                    <PlusCircle size={16} /> {copy.addZhPackagingAttribute}
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.entries(formData.translations?.zh?.packaging || {}).map(([key, value], idx) => (
                    <div key={idx} className="flex items-center gap-3 group animate-in fade-in slide-in-from-top-1 duration-200 border-b border-gray-50 pb-2 mb-2">
                      <div className="flex-[2]">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => handleUpdateZhPackaging(key, e.target.value, value as string)}
                          placeholder={copy.zhPackagingLabelPlaceholder}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black tracking-widest outline-none focus:border-foodera-forest"
                        />
                      </div>
                      <div className="flex-[3]">
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => handleUpdateZhPackaging(key, key, e.target.value)}
                          placeholder={copy.zhPackagingValuePlaceholder}
                          className="w-full px-4 py-3 bg-transparent border-2 border-transparent hover:border-gray-50 focus:bg-white focus:shadow-sm focus:border-foodera-forest/20 rounded-xl text-xs font-bold outline-none transition-all placeholder:text-gray-300"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveZhPackaging(key)}
                        className="p-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {Object.keys(formData.translations?.zh?.packaging || {}).length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{copy.noZhPackaging}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Tag size={14} className="text-foodera-forest" /> {copy.zhPaymentTitle}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{copy.zhPaymentDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddZhPayment}
                    className="flex items-center gap-2 text-[10px] font-black text-foodera-forest hover:text-foodera-lime transition-colors uppercase tracking-widest"
                  >
                    <PlusCircle size={16} /> {copy.addZhPaymentAttribute}
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.entries(formData.translations?.zh?.payment || {}).map(([key, value], idx) => (
                    <div key={idx} className="flex items-center gap-3 group animate-in fade-in slide-in-from-top-1 duration-200 border-b border-gray-50 pb-2 mb-2">
                      <div className="flex-[2]">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => handleUpdateZhPayment(key, e.target.value, value as string)}
                          placeholder={copy.zhPaymentLabelPlaceholder}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black tracking-widest outline-none focus:border-foodera-forest"
                        />
                      </div>
                      <div className="flex-[3]">
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => handleUpdateZhPayment(key, key, e.target.value)}
                          placeholder={copy.zhPaymentValuePlaceholder}
                          className="w-full px-4 py-3 bg-transparent border-2 border-transparent hover:border-gray-50 focus:bg-white focus:shadow-sm focus:border-foodera-forest/20 rounded-xl text-xs font-bold outline-none transition-all placeholder:text-gray-300"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveZhPayment(key)}
                        className="p-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {Object.keys(formData.translations?.zh?.payment || {}).length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{copy.noZhPayment}</p>
                    </div>
                  )}
                </div>
              </div>
            </>)}
</div></form>

            <div className="p-8 border-t border-gray-100 bg-gray-50">
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={closeModal}
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                >
                  {copy.discardChanges}
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving || isUploadingPrimaryImage}
                  className="flex-[2] py-4 bg-foodera-forest text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-foodera-lime hover:text-foodera-forest transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <><Save size={18} /> {editingProduct ? copy.updatePortfolio : copy.initializeCommodity}</>
                  )}
                </button>
              </div>
            </div>
        </main>
      )}
    </div>
  );
};

export default AdminInventory;
