import { Product, SupportedLocale } from '../types';
import { getCategoryLabel, localizeProduct } from './contentLocalization';
import { repairMojibakeText } from './repairMojibake';

type ProductPdfAssets = {
  headerImageSrc: string;
  footerImageSrc: string;
};

type ProductPdfCopy = {
  documentTitle: string;
  category: string;
  subCategory: string;
  identifier: string;
  overviewTitle: string;
  packagingTitle: string;
  paymentTitle: string;
  specsTitle: string;
  docsTitle: string;
  parameterHeader: string;
  valueHeader: string;
  linkedPdf: string;
  linkedPdfAvailable: string;
  noPackagingData: string;
  noPaymentData: string;
  noSpecs: string;
  docs: string[];
  saveHint: string;
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

const getCopy = (locale: SupportedLocale): ProductPdfCopy => {
  const zh = repairMojibakeText;

  if (locale === 'zh') {
    return {
      documentTitle: zh('\u4ea7\u54c1\u89c4\u683c\u4e66'),
      category: zh('\u5206\u7c7b'),
      subCategory: zh('\u5b50\u5206\u7c7b'),
      identifier: zh('\u4ea7\u54c1 ID'),
      overviewTitle: zh('\u4ea7\u54c1\u6982\u89c8'),
      packagingTitle: zh('\u5305\u88c5\u4e0e\u88c5\u8fd0'),
      paymentTitle: zh('\u4ed8\u6b3e\u4e0e\u4ea4\u4ed8'),
      specsTitle: zh('\u6280\u672f\u89c4\u683c'),
      docsTitle: zh('\u6807\u51c6\u968f\u9644\u5355\u8bc1'),
      parameterHeader: zh('\u53c2\u6570'),
      valueHeader: zh('\u6570\u503c'),
      linkedPdf: zh('\u5173\u8054 PDF'),
      linkedPdfAvailable: zh('\u5df2\u5173\u8054'),
      noPackagingData: zh('\u6682\u65e0\u5305\u88c5\u4e0e\u88c5\u8fd0\u6570\u636e\u3002'),
      noPaymentData: zh('\u6682\u65e0\u4ed8\u6b3e\u4e0e\u4ea4\u4ed8\u6570\u636e\u3002'),
      noSpecs: zh('\u6682\u65e0\u6280\u672f\u89c4\u683c\u6570\u636e\u3002'),
      docs: [
        zh('\u5546\u4e1a\u53d1\u7968'),
        zh('\u63d0\u5355'),
        zh('\u88c5\u7bb1\u5355'),
        zh('\u539f\u4ea7\u5730\u8bc1\u4e66'),
        zh('\u8d28\u91cf\u8bc1\u4e66'),
        zh('\u690d\u7269\u68c0\u75ab\u8bc1\u4e66')
      ],
      saveHint: zh('\u6253\u5370\u7a97\u53e3\u6253\u5f00\u540e\uff0c\u8bf7\u9009\u62e9\u201c\u4fdd\u5b58\u4e3a PDF\u201d\u4ee5\u4e0b\u8f7d\u5230\u672c\u5730\u3002')
    };
  }

  return {
    documentTitle: 'Product Specification',
    category: 'Category',
    subCategory: 'Sub-Category',
    identifier: 'Product ID',
    overviewTitle: 'Product Overview',
    packagingTitle: 'Packaging & Loading',
    paymentTitle: 'Payment & Delivery',
    specsTitle: 'Technical Specifications',
    docsTitle: 'Standard Documentation Provided',
    parameterHeader: 'Parameter',
    valueHeader: 'Value',
    linkedPdf: 'Linked PDF',
    linkedPdfAvailable: 'Available',
    noPackagingData: 'No packaging or loading data available.',
    noPaymentData: 'No payment or delivery data available.',
    noSpecs: 'No technical specification data available.',
    docs: [
      'Commercial Invoice',
      'Bill of Lading',
      'Packing List',
      'Certificate of Origin',
      'Certificate of Quality',
      'Phytosanitary Certificate'
    ],
    saveHint: 'When the print window opens, choose "Save as PDF" to download the file.'
  };
};

const getTitleSizeMm = (title: string) => {
  const length = Math.max(title.trim().length, 1);
  return `${Math.min(12.6, Math.max(7.4, 232 / length)).toFixed(2)}mm`;
};

const buildOverviewRows = (
  product: Product,
  locale: SupportedLocale,
  copy: ProductPdfCopy
): ReadonlyArray<readonly [string, string]> =>
  [
    [copy.identifier, product.id.toUpperCase()] as const,
    [copy.category, getCategoryLabel(product.category, locale)] as const,
    [copy.subCategory, product.subCategory] as const,
    ...(product.pdfUrl?.trim() ? ([[copy.linkedPdf, copy.linkedPdfAvailable] as const] satisfies ReadonlyArray<readonly [string, string]>) : [])
  ].filter(([, value]) => String(value || '').trim());

const buildNamedRows = (record?: Record<string, string>): ReadonlyArray<readonly [string, string]> =>
  Object.entries(record || {})
    .map(([key, value]) => [key.trim(), String(value || '').trim()] as const)
    .filter(([key, value]) => key && value);

const normalizeComparableText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

const buildRowFingerprint = ([label, value]: readonly [string, string]) =>
  `${normalizeComparableText(label)}::${normalizeComparableText(value)}`;

const dedupeRows = (
  rows: ReadonlyArray<readonly [string, string]>,
  seenFingerprints: Set<string>
): ReadonlyArray<readonly [string, string]> => {
  const uniqueRows: Array<readonly [string, string]> = [];

  rows.forEach((row) => {
    const fingerprint = buildRowFingerprint(row);
    if (seenFingerprints.has(fingerprint)) {
      return;
    }
    seenFingerprints.add(fingerprint);
    uniqueRows.push(row);
  });

  return uniqueRows;
};

const renderKeyValueRows = (rows: ReadonlyArray<readonly [string, string]>) =>
  rows
    .map(
      ([label, value]) => `
        <div class="kv-row">
          <div class="kv-label">${escapeHtml(label)}</div>
          <div class="kv-value">${escapeHtml(value)}</div>
        </div>
      `
    )
    .join('');

const renderCardSubsection = (title: string, rowsHtml: string) => `
  <div class="card-subsection">
    <h3 class="card-subsection-title">${escapeHtml(title)}</h3>
    <div class="card-subsection-body">
      ${rowsHtml}
    </div>
  </div>
`;

const renderSpecTable = (entries: ReadonlyArray<readonly [string, string]>, copy: ProductPdfCopy) => `
  <table class="spec-table">
    <thead>
      <tr>
        <th>${escapeHtml(copy.parameterHeader)}</th>
        <th>${escapeHtml(copy.valueHeader)}</th>
      </tr>
    </thead>
    <tbody>
      ${entries
        .map(
          ([key, value]) => `
            <tr>
              <td>${escapeHtml(key)}</td>
              <td>${escapeHtml(value)}</td>
            </tr>
          `
        )
        .join('')}
    </tbody>
  </table>
`;

export const buildProductPdfPrintHtml = (
  product: Product,
  locale: SupportedLocale,
  assets: ProductPdfAssets
): string => {
  const localized = localizeProduct(product, locale);
  const copy = getCopy(locale);
  const seenFingerprints = new Set<string>();
  const overviewRows = dedupeRows(buildOverviewRows(localized, locale, copy), seenFingerprints);
  const overviewRowsHtml = renderKeyValueRows(overviewRows);
  const packagingRows = dedupeRows(buildNamedRows(localized.packaging), seenFingerprints);
  const paymentRows = dedupeRows(buildNamedRows(localized.payment), seenFingerprints);
  const packagingRowsHtml = packagingRows.length
    ? renderKeyValueRows(packagingRows)
    : '';
  const paymentRowsHtml = paymentRows.length
    ? renderKeyValueRows(paymentRows)
    : '';
  const specEntries = dedupeRows(
    Object.entries(localized.specifications || {}).filter(
      ([key, value]) => key.trim() && String(value).trim()
    ),
    seenFingerprints
  );
  const leftSpecs = specEntries.length > 12 ? specEntries.slice(0, Math.ceil(specEntries.length / 2)) : specEntries;
  const rightSpecs = specEntries.length > 12 ? specEntries.slice(Math.ceil(specEntries.length / 2)) : [];
  const specsHtml = specEntries.length
    ? `
        <div class="${rightSpecs.length > 0 ? 'spec-table-grid' : ''}">
          ${renderSpecTable(leftSpecs, copy)}
          ${rightSpecs.length > 0 ? renderSpecTable(rightSpecs, copy) : ''}
        </div>
      `
    : `<p class="empty">${escapeHtml(copy.noSpecs)}</p>`;
  const docsHtml = copy.docs.map((entry) => `<span class="doc-item">&#10003; ${escapeHtml(entry)}</span>`).join('');
  const title = localized.name.trim() || product.name.trim();
  const titleSize = getTitleSizeMm(title);
  const lang = locale === 'zh' ? 'zh-CN' : 'en';
  const fileTitle = sanitizeDocumentName(`${title} ${locale === 'zh' ? 'CN' : 'EN'} Spec`);
  const leftColumnSectionsHtml = [
    renderCardSubsection(copy.overviewTitle, overviewRowsHtml),
    packagingRowsHtml ? renderCardSubsection(copy.packagingTitle, packagingRowsHtml) : '',
    paymentRowsHtml ? renderCardSubsection(copy.paymentTitle, paymentRowsHtml) : ''
  ]
    .filter(Boolean)
    .join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(fileTitle)}</title>
    <style>
      :root {
        --primary: #2e7d32;
        --accent: #8bc34a;
        --text: #2f3831;
        --muted: #667267;
        --line: #d8e2d7;
        --panel: #ffffff;
        --soft: #eef6ee;
      }

      @page {
        size: A4;
        margin: 0;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: var(--text);
        font-family: ${
          locale === 'zh'
            ? '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Segoe UI", Arial, sans-serif'
            : '"Segoe UI", "Noto Sans", Arial, sans-serif'
        };
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      body {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
      }

      .page {
        width: 210mm;
        height: 297mm;
        min-height: 297mm;
        display: flex;
        flex-direction: column;
        background: #ffffff;
        overflow: hidden;
        padding: 15px;
      }

      .banner {
        width: 100%;
      }

      .banner img {
        display: block;
        width: 100%;
        height: auto;
      }

      .content {
        display: flex;
        flex-direction: column;
        gap: 3.4mm;
        padding: 7px 0 4px;
      }

      .title-wrap {
        text-align: center;
        display: block;
        padding-bottom: 0.2mm;
      }

      .product-name {
        margin: 0;
        color: var(--primary);
        font-size: ${titleSize};
        line-height: 1.08;
        font-style: italic;
        font-weight: 700;
      }

      .grid {
        display: grid;
        grid-template-columns: minmax(0, 76mm) minmax(0, 1fr);
        gap: 3.8mm;
        align-items: start;
      }

      .column {
        display: grid;
        gap: 3.6mm;
        align-content: start;
        grid-auto-rows: max-content;
      }

      .section-title {
        margin: 0 0 1.8mm;
        color: var(--primary);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.1em;
        line-height: 1.05;
        text-transform: uppercase;
      }

      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 10px;
        box-shadow: 0 4px 14px rgba(46, 125, 50, 0.05);
        overflow: hidden;
      }

      .stack-card {
        padding: 0;
      }

      .card-subsection {
        padding: 9px 10px 8px;
      }

      .card-subsection + .card-subsection {
        border-top: 1px solid var(--line);
      }

      .card-subsection-title {
        margin: 0 0 1.8mm;
        color: var(--primary);
        font-size: 10.8px;
        font-weight: 800;
        letter-spacing: 0.09em;
        line-height: 1.08;
        text-transform: uppercase;
      }

      .card-subsection-body {
        display: grid;
        gap: 0;
      }

      .specs-card {
        padding: 10px;
      }

      .kv-row {
        display: grid;
        grid-template-columns: 42% 58%;
        gap: 8px;
        padding: 5px 0;
        border-bottom: 1px solid #e3e9e2;
        font-size: 10.55px;
      }

      .kv-row:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .kv-label {
        color: var(--muted);
        font-weight: 600;
      }

      .kv-value {
        color: var(--text);
        font-weight: 700;
        word-break: break-word;
      }

      .spec-table-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        align-items: start;
      }

      .spec-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        overflow: hidden;
        border-radius: 10px;
        border: 1px solid #e1e8e1;
        font-size: 10.45px;
        background: #ffffff;
      }

      .spec-table th,
      .spec-table td {
        padding: 5px 6px;
        text-align: left;
        vertical-align: top;
        border-bottom: 1px solid #e2e8e2;
        overflow-wrap: anywhere;
      }

      .spec-table th {
        background: var(--soft);
        color: var(--primary);
        font-size: 8.9px;
        font-weight: 800;
        letter-spacing: 0.09em;
        text-transform: uppercase;
      }

      .spec-table td:last-child {
        font-weight: 700;
      }

      .spec-table tr:last-child td {
        border-bottom: none;
      }

      .docs {
        border-top: 1px solid var(--line);
        margin-top: 2.4mm;
        padding-top: 2.6mm;
        text-align: center;
        flex-shrink: 0;
      }

      .docs h3 {
        margin: 0;
        color: #7a857b;
        font-size: 9.2px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .docs-list {
        margin-top: 2.3mm;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 2mm 3.6mm;
      }

      .doc-item {
        color: #4f5851;
        font-size: 9.1px;
        font-weight: 600;
        white-space: nowrap;
      }

      .save-hint {
        margin-top: 1.9mm;
        color: #829083;
        font-size: 8.2px;
        letter-spacing: 0.03em;
      }

      .empty {
        margin: 0;
        color: #788378;
        font-size: 10px;
        font-style: italic;
      }

      .footer-banner {
        margin-top: auto;
      }

      .footer-banner img {
        display: block;
        width: 100%;
        height: auto;
      }

      @media print {
        body {
          margin: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="banner">
        <img src="${escapeHtml(assets.headerImageSrc)}" alt="Foodmax header" />
      </div>

      <div class="content">
        <section class="title-wrap">
          <h1 class="product-name">${escapeHtml(title)}</h1>
        </section>

        <section class="grid">
          <div class="column column-stack">
            <section>
              <div class="card stack-card">
                ${leftColumnSectionsHtml}
              </div>
            </section>
          </div>

          <div class="column column-specs">
            <section>
              <h3 class="section-title">${escapeHtml(copy.specsTitle)}</h3>
              <div class="card specs-card">
                ${specsHtml}
              </div>
            </section>
          </div>
        </section>

        <section class="docs">
          <h3>${escapeHtml(copy.docsTitle)}</h3>
          <div class="docs-list">${docsHtml}</div>
          <div class="save-hint">${escapeHtml(copy.saveHint)}</div>
        </section>
      </div>

      <div class="footer-banner">
        <img src="${escapeHtml(assets.footerImageSrc)}" alt="Foodmax footer" />
      </div>
    </div>

    <script>
      window.addEventListener('load', function () {
        window.setTimeout(function () {
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
