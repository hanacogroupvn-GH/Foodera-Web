
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import pdfFooterImage from '../../pdf-footer-current.png?inline';
import pdfHeaderImage from '../../pdf-header.png?inline';
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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizeDocumentName = (value: string) =>
  value.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim() || 'product-datasheet';

const buildProductPdfPrintHtml = (product: Product, locale: SupportedLocale): string => {
  const localized = localizeProduct(product, locale);
  const specEntries = Object.entries(localized.specifications || {});
  const generatedAt = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(new Date());

  const copy =
    locale === 'zh'
      ? {
          category: '分类',
          generated: '生成时间',
          identifier: '产品 ID',
          overview: '产品概述',
          specs: '技术规格',
          value: '数值',
          sourcePdf: '已关联 PDF',
          saveHint: '打印窗口打开后，请选择“保存为 PDF”以下载到本地。'
        }
      : {
          category: 'Category',
          generated: 'Generated',
          identifier: 'Product ID',
          overview: 'Overview',
          specs: 'Technical Specifications',
          value: 'Value',
          sourcePdf: 'Linked PDF',
          saveHint: 'When the print window opens, choose "Save as PDF" to download the file.'
        };

  const specRows = specEntries
    .map(
      ([key, value]) => `
        <tr>
          <td>${escapeHtml(key)}</td>
          <td>${escapeHtml(value)}</td>
        </tr>
      `
    )
    .join('');

  const pdfRow = product.pdfUrl?.trim()
    ? `
      <div class="meta-row">
        <span>${escapeHtml(copy.sourcePdf)}</span>
        <span>${escapeHtml(product.pdfUrl.trim())}</span>
      </div>
    `
    : '';

  const imageBlock = product.image?.trim()
    ? `<img class="hero-image" src="${escapeHtml(product.image.trim())}" alt="${escapeHtml(localized.name)}" />`
    : '';

  return `<!DOCTYPE html>
<html lang="${locale === 'zh' ? 'zh-CN' : 'en'}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(sanitizeDocumentName(localized.name))}</title>
    <style>
      :root {
        --forest: #0c6a3d;
        --lime: #9ad23b;
        --ink: #0f172a;
        --muted: #64748b;
        --line: #dbe3ea;
        --panel: #f8fafc;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Segoe UI", Arial, sans-serif;
        color: var(--ink);
        background: white;
      }

      .page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: 18mm 16mm;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        margin-bottom: 18px;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--forest);
        font-size: 11px;
      }

      .brand-mark {
        width: 14px;
        height: 14px;
        border-radius: 4px;
        background: linear-gradient(135deg, var(--forest), var(--lime));
      }

      .meta {
        min-width: 240px;
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: var(--panel);
      }

      .meta-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 11px;
        padding: 6px 0;
        border-bottom: 1px solid rgba(15, 23, 42, 0.08);
      }

      .meta-row:last-child {
        border-bottom: none;
      }

      .meta-row span:first-child {
        color: var(--muted);
        font-weight: 700;
      }

      .meta-row span:last-child {
        text-align: right;
        font-weight: 700;
      }

      h1 {
        margin: 10px 0 8px;
        font-size: 28px;
        line-height: 1.1;
        letter-spacing: -0.04em;
      }

      .subline {
        color: var(--muted);
        font-size: 13px;
        margin-bottom: 18px;
      }

      .hero {
        display: grid;
        grid-template-columns: 1.15fr 1fr;
        gap: 18px;
        margin-bottom: 22px;
        align-items: stretch;
      }

      .hero-copy {
        padding: 20px 22px;
        border-radius: 24px;
        background: linear-gradient(180deg, rgba(12, 106, 61, 0.06), rgba(154, 210, 59, 0.1));
        border: 1px solid rgba(12, 106, 61, 0.08);
      }

      .hero-image {
        width: 100%;
        height: 100%;
        min-height: 240px;
        object-fit: cover;
        border-radius: 24px;
        border: 1px solid var(--line);
      }

      .section-label {
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.24em;
        color: var(--forest);
        margin-bottom: 10px;
      }

      .body-copy {
        font-size: 13px;
        line-height: 1.7;
        color: #334155;
        white-space: pre-wrap;
      }

      .spec-card {
        border: 1px solid var(--line);
        border-radius: 24px;
        overflow: hidden;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th, td {
        text-align: left;
        padding: 12px 16px;
        font-size: 12px;
        vertical-align: top;
      }

      thead th {
        background: var(--panel);
        color: var(--muted);
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.18em;
      }

      tbody tr:nth-child(odd) {
        background: rgba(248, 250, 252, 0.7);
      }

      tbody td:first-child {
        width: 38%;
        font-weight: 800;
        color: #334155;
      }

      .footer-note {
        margin-top: 20px;
        padding: 12px 14px;
        border-radius: 16px;
        background: rgba(154, 210, 59, 0.12);
        color: #365314;
        font-size: 11px;
        font-weight: 700;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .page {
          padding: 12mm 10mm;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <div>
          <div class="brand">
            <span class="brand-mark"></span>
            <span>Foodmax Export Sheet</span>
          </div>
          <h1>${escapeHtml(localized.name)}</h1>
          <div class="subline">${escapeHtml(localized.shortDescription || '')}</div>
        </div>
        <div class="meta">
          <div class="meta-row">
            <span>${escapeHtml(copy.identifier)}</span>
            <span>${escapeHtml(product.id)}</span>
          </div>
          <div class="meta-row">
            <span>${escapeHtml(copy.category)}</span>
            <span>${escapeHtml(getCategoryLabel(product.category, locale))}</span>
          </div>
          <div class="meta-row">
            <span>Line</span>
            <span>${escapeHtml(localized.subCategory)}</span>
          </div>
          <div class="meta-row">
            <span>${escapeHtml(copy.generated)}</span>
            <span>${escapeHtml(generatedAt)}</span>
          </div>
          ${pdfRow}
        </div>
      </div>

      <div class="hero">
        <div class="hero-copy">
          <div class="section-label">${escapeHtml(copy.overview)}</div>
          <div class="body-copy">${escapeHtml(localized.description || '')}</div>
        </div>
        ${imageBlock || '<div class="hero-copy"><div class="section-label">Foodmax</div><div class="body-copy">Product image is not available for this export sheet.</div></div>'}
      </div>

      <div class="spec-card">
        <table>
          <thead>
            <tr>
              <th>${escapeHtml(copy.specs)}</th>
              <th>${escapeHtml(copy.value)}</th>
            </tr>
          </thead>
          <tbody>
            ${specRows}
          </tbody>
        </table>
      </div>

      <div class="footer-note">${escapeHtml(copy.saveHint)}</div>
    </div>
    <script>
      window.addEventListener('load', function () {
        setTimeout(function () {
          window.focus();
          window.print();
        }, 250);
      });
      window.addEventListener('afterprint', function () {
        window.close();
      });
    </script>
  </body>
</html>`;
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
  const [translationStatus, setTranslationStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });
  const [isUploadingPrimaryImage, setIsUploadingPrimaryImage] = useState(false);
  const [primaryImageUploadError, setPrimaryImageUploadError] = useState<string | null>(null);
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

  useEffect(() => {
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
  const bulkTranslateTargets = useMemo(() => filteredProducts.slice(), [filteredProducts]);

  const openModal = (product?: Product) => {
    setPrimaryImageUploadError(null);
    setTranslationStatus({ type: null, message: '' });
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
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=1200',
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
      setPrimaryImageUploadError(err?.message || copy.imageUploadFailed);
    } finally {
      setIsUploadingPrimaryImage(false);
    }
  };

  const pushTranslationStatus = (type: 'success' | 'error', message: string) => {
    setTranslationStatus({ type, message });
    window.setTimeout(() => {
      setTranslationStatus((current) => (current.message === message ? { type: null, message: '' } : current));
    }, 4000);
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
    setCsvImportStatus({
      type: 'success',
      message:
        locale === 'zh'
          ? zh(`${sourceLabel}: \u5df2\u5bfc\u5165 ${mapped.items.length} \u4e2a\u4ea7\u54c1\uff08\u65b0\u589e ${createdCount} \u4e2a\uff0c\u66f4\u65b0 ${updatedCount} \u4e2a${skippedPart}\uff09\u3002`)
          : `${sourceLabel}: imported ${mapped.items.length} product(s) (${createdCount} new, ${updatedCount} updated${skippedPart}).`
    });
  };

  const handleImportFromSheet = async () => {
    const rawUrl = csvSheetUrl.trim();
    if (!rawUrl) {
      setCsvImportStatus({ type: 'error', message: copy.csvLinkRequired });
      return;
    }

    setIsImportingCsv(true);
    setCsvImportStatus({ type: null, message: '' });
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
      setCsvImportStatus({ type: 'error', message: err?.message || copy.csvImportFailed });
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
      await importProductsFromCsvText(csvText, file.name || (locale === 'zh' ? zh('CSV \u6587\u4ef6') : 'CSV file'));
    } catch (err: any) {
      setCsvImportStatus({ type: 'error', message: err?.message || copy.csvImportFailed });
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleReloadInventory = async () => {
    if (isReloadingInventory || isBulkTranslating) return;

    setIsReloadingInventory(true);
    setTranslationStatus({ type: null, message: '' });
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
    setTranslationStatus({ type: null, message: '' });

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

  const handleExit = () => {
    logout();
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Mini Sidebar */}
      <aside className="w-[5.5rem] bg-foodmax-forest text-white flex flex-col items-center py-8 gap-8 sticky top-0 h-screen shadow-2xl z-20">
        <Link to={appRoutes.admin} className="p-3.5 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/5"><ChevronLeft size={24} /></Link>
        <div className="flex flex-col gap-6 flex-grow">
          <Link to={appRoutes.adminInventory} className="p-3.5 bg-foodmax-lime text-foodmax-forest rounded-2xl shadow-xl shadow-foodmax-lime/20 border border-foodmax-lime/20"><Package size={24} /></Link>
          <Link
            to={appRoutes.adminMapContent}
            className="p-3.5 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/5"
            title={locale === 'zh' ? '地图内容' : 'Map Content'}
          >
            <MapPinned size={24} />
          </Link>
        </div>

        {/* Mini Branded Exit Button */}
        <div className="mt-auto pt-6 border-t border-white/10 w-full flex flex-col items-center gap-4">
          <Link
            to={appRoutes.home}
            onClick={handleExit}
            className="p-3 hover:bg-white/10 rounded-2xl transition-all group relative overflow-visible"
            title={locale === 'zh' ? copy.exitHome : 'Exit to Homepage'}
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
          <div className="mb-12 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{copy.inventoryTitle}</h1>
              <p className="text-gray-500 font-medium">{copy.manageDesc}</p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-3 md:flex-nowrap xl:w-auto xl:flex-nowrap">
              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
                <span>{copy.cmsLanguage}</span>
                <button type="button" onClick={() => setLocale('en')} className={locale === 'en' ? 'text-foodmax-forest' : ''}>
                  EN
                </button>
                <span>/</span>
                <button type="button" onClick={() => setLocale('zh')} className={locale === 'zh' ? 'text-foodmax-forest' : ''}>
                  {'\u4e2d\u6587'}
                </button>
              </div>
              <button
                type="button"
                onClick={handleReloadInventory}
                disabled={isReloadingInventory || isBulkTranslating}
                className="flex shrink-0 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-gray-600 shadow-sm transition-all hover:border-foodmax-forest hover:text-foodmax-forest disabled:opacity-50"
              >
                {isReloadingInventory ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                <span className="whitespace-nowrap">{isReloadingInventory ? reloadingButtonLabel : reloadButtonLabel}</span>
              </button>
              <button
                type="button"
                onClick={handleBulkTranslateFiltered}
                disabled={isBulkTranslating || isReloadingInventory}
                className="flex min-w-0 flex-1 items-center justify-center gap-3 rounded-2xl border border-foodmax-forest/15 bg-foodmax-forest/5 px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-foodmax-forest shadow-sm transition-all hover:bg-foodmax-forest hover:text-white disabled:opacity-50"
              >
                {isBulkTranslating ? <Loader2 size={16} className="animate-spin" /> : <Languages size={16} />}
                <span className="truncate">
                  {isBulkTranslating
                    ? `${bulkTranslatingButtonLabel} ${bulkTranslateProgress.current}/${bulkTranslateProgress.total}`
                    : `${bulkTranslateButtonLabel} (${bulkTranslateTargets.length})`}
                </span>
              </button>
              <button 
                onClick={() => openModal()}
                className="flex shrink-0 items-center justify-center gap-3 rounded-2xl bg-foodmax-forest px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-xl transition-all hover:bg-foodmax-lime hover:text-foodmax-forest"
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
              {locale === 'zh'
                ? '支持的产品列：id、name、category、subCategory、shortDescription、description、image、pdfUrl、gallery、specifications/spec_*、packaging/pack_*、payment/payment_* 以及 filters/filter_*。'
                : 'Supported product columns: id, name, category, subCategory, shortDescription, description, image, pdfUrl, gallery, specifications/spec_*, packaging/pack_*, payment/payment_* and filters/filter_*.'}
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
            {translationStatus.type && (
              <div
                className={`px-4 py-3 rounded-xl text-sm font-semibold ${
                  translationStatus.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {translationStatus.message}
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
                          className="inline-flex items-center gap-2 rounded-xl border border-foodmax-forest/15 bg-foodmax-forest/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-foodmax-forest transition-all hover:bg-foodmax-forest hover:text-white"
                          title={exportPdfEnButtonLabel}
                        >
                          <FileDown size={14} />
                          <span>{exportPdfEnButtonLabel}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportProductPdf(p, 'zh')}
                          className="inline-flex items-center gap-2 rounded-xl border border-foodmax-lime/30 bg-foodmax-lime/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-foodmax-forest transition-all hover:bg-foodmax-lime hover:text-foodmax-forest"
                          title={exportPdfCnButtonLabel}
                        >
                          <FileDown size={14} />
                          <span>{exportPdfCnButtonLabel}</span>
                        </button>
                        <button 
                          onClick={() => openModal(p)}
                          className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-foodmax-forest hover:text-white transition-all shadow-sm"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleTranslateExistingProduct(p)}
                          disabled={translatingItemId === p.id}
                          className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-foodmax-forest hover:text-white transition-all shadow-sm disabled:opacity-50"
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
                    {primaryImageUploadError && (
                      <p className="text-[10px] text-red-500 italic">{primaryImageUploadError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Product PDF Section */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.productPdfSection}</label>
                <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  <div className="p-2 bg-foodmax-forest text-white rounded-lg">
                    <FileText size={16} />
                  </div>
                  <div className="flex-grow space-y-2">
                    <input
                      type="url"
                      value={formData.pdfUrl || ''}
                      onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                      placeholder={copy.productPdfPlaceholder}
                      className={`w-full px-4 py-3 bg-white rounded-xl border-2 outline-none text-sm font-medium ${
                        hasInvalidPdfUrl ? 'border-red-300 focus:border-red-400' : 'border-transparent focus:border-foodmax-forest/20'
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
                    className="px-4 py-3 bg-foodmax-forest text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-foodmax-lime hover:text-foodmax-forest transition-colors"
                  >
                    {copy.addPhoto}
                  </button>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.varietyName}</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.globalCategory}</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as CategoryType})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-bold cursor-pointer"
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
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-bold"
                    placeholder={copy.subCategoryPlaceholder}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.status}</label>
                  <select
                    value={formData.isActive === false ? 'inactive' : 'active'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-bold cursor-pointer"
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
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium"
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
                  className="w-full px-4 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium resize-none"
                  placeholder={copy.descriptionPlaceholder}
                  required
                />
              </div>

              <div className="space-y-6 rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foodmax-forest">{copy.translationSection}</h4>
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-foodmax-forest/15 bg-foodmax-forest/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-foodmax-forest transition-all hover:bg-foodmax-forest hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium"
                      placeholder={copy.zhNamePlaceholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.zhSubCategoryLabel}</label>
                    <input
                      type="text"
                      value={formData.translations?.zh?.subCategory || ''}
                      onChange={(e) => updateZhTranslation('subCategory', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium"
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
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium"
                    placeholder={copy.zhShortDescriptionPlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.zhDescriptionLabel}</label>
                  <textarea
                    rows={4}
                    value={formData.translations?.zh?.description || ''}
                    onChange={(e) => updateZhTranslation('description', e.target.value)}
                    className="w-full px-4 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium resize-none"
                    placeholder={copy.zhDescriptionPlaceholder}
                  />
                </div>
              </div>

              {/* DYNAMIC QUALITY SPECS EDITOR */}
              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Hash size={14} className="text-foodmax-forest" /> {copy.specsTitle}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{copy.specsDesc}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddSpec}
                    className="flex items-center gap-2 text-[10px] font-black text-foodmax-forest hover:text-foodmax-lime transition-colors uppercase tracking-widest"
                  >
                    <PlusCircle size={16} /> {copy.addAttribute}
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
                          placeholder={copy.specsLabelPlaceholder}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <div className="flex-[3]">
                        <input 
                          type="text"
                          value={value as string}
                          onChange={(e) => handleUpdateSpec(key, key, e.target.value)}
                          placeholder={copy.specsValuePlaceholder}
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
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{copy.noSpecs}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Tag size={14} className="text-foodmax-forest" /> {copy.packagingTitle}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{copy.packagingDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPackaging}
                    className="flex items-center gap-2 text-[10px] font-black text-foodmax-forest hover:text-foodmax-lime transition-colors uppercase tracking-widest"
                  >
                    <PlusCircle size={16} /> {copy.addPackagingAttribute}
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.entries(formData.packaging || {}).map(([key, value], idx) => (
                    <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex-[2]">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => handleUpdatePackaging(key, e.target.value, value as string)}
                          placeholder={copy.packagingLabelPlaceholder}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <div className="flex-[3]">
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => handleUpdatePackaging(key, key, e.target.value)}
                          placeholder={copy.packagingValuePlaceholder}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePackaging(key)}
                        className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
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
                      <Tag size={14} className="text-foodmax-forest" /> {copy.paymentTitle}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{copy.paymentDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPayment}
                    className="flex items-center gap-2 text-[10px] font-black text-foodmax-forest hover:text-foodmax-lime transition-colors uppercase tracking-widest"
                  >
                    <PlusCircle size={16} /> {copy.addPaymentAttribute}
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.entries(formData.payment || {}).map(([key, value], idx) => (
                    <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex-[2]">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => handleUpdatePayment(key, e.target.value, value as string)}
                          placeholder={copy.paymentLabelPlaceholder}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <div className="flex-[3]">
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => handleUpdatePayment(key, key, e.target.value)}
                          placeholder={copy.paymentValuePlaceholder}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePayment(key)}
                        className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
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
                      <Hash size={14} className="text-foodmax-forest" /> {copy.zhSpecsTitle}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{copy.zhSpecsDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddZhSpec}
                    className="flex items-center gap-2 text-[10px] font-black text-foodmax-forest hover:text-foodmax-lime transition-colors uppercase tracking-widest"
                  >
                    <PlusCircle size={16} /> {copy.addZhAttribute}
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
                          placeholder={copy.zhSpecsLabelPlaceholder}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black tracking-widest outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <div className="flex-[3]">
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => handleUpdateZhSpec(key, key, e.target.value)}
                          placeholder={copy.zhSpecsValuePlaceholder}
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
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{copy.noZhSpecs}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Tag size={14} className="text-foodmax-forest" /> {copy.zhPackagingTitle}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{copy.zhPackagingDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddZhPackaging}
                    className="flex items-center gap-2 text-[10px] font-black text-foodmax-forest hover:text-foodmax-lime transition-colors uppercase tracking-widest"
                  >
                    <PlusCircle size={16} /> {copy.addZhPackagingAttribute}
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.entries(formData.translations?.zh?.packaging || {}).map(([key, value], idx) => (
                    <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex-[2]">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => handleUpdateZhPackaging(key, e.target.value, value as string)}
                          placeholder={copy.zhPackagingLabelPlaceholder}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black tracking-widest outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <div className="flex-[3]">
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => handleUpdateZhPackaging(key, key, e.target.value)}
                          placeholder={copy.zhPackagingValuePlaceholder}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveZhPackaging(key)}
                        className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
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
                      <Tag size={14} className="text-foodmax-forest" /> {copy.zhPaymentTitle}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{copy.zhPaymentDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddZhPayment}
                    className="flex items-center gap-2 text-[10px] font-black text-foodmax-forest hover:text-foodmax-lime transition-colors uppercase tracking-widest"
                  >
                    <PlusCircle size={16} /> {copy.addZhPaymentAttribute}
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.entries(formData.translations?.zh?.payment || {}).map(([key, value], idx) => (
                    <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex-[2]">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => handleUpdateZhPayment(key, e.target.value, value as string)}
                          placeholder={copy.zhPaymentLabelPlaceholder}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black tracking-widest outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <div className="flex-[3]">
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => handleUpdateZhPayment(key, key, e.target.value)}
                          placeholder={copy.zhPaymentValuePlaceholder}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-foodmax-forest"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveZhPayment(key)}
                        className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
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
            </form>

            <div className="p-8 border-t border-gray-100 bg-gray-50">
              {translationStatus.type && (
                <div
                  className={`mb-3 px-4 py-3 rounded-xl text-sm font-semibold ${
                    translationStatus.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {translationStatus.message}
                </div>
              )}
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
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
