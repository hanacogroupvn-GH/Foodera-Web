import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { api } from '../lib/apiClient';
import { RFQ_ATTACHMENT_INPUT_ACCEPT, uploadRfqAttachment } from '../lib/rfqUploads';
import { getCategoryLabel, localizeProduct } from '../lib/contentLocalization';
import { Product, RfqAttachment, RfqRequestItemInput, SupportedLocale } from '../types';

interface RfqWorkflowFormProps {
  currentProduct: Product;
  products: Product[];
  locale: SupportedLocale;
  onSubmitted?: (summary: { selectedProductIds: string[]; monthlyVolume: string }) => void;
}

const INCOTERM_OPTIONS = ['FOB', 'CIF', 'CFR', 'EXW', 'DAP', 'DDP', 'Other'];
const TIMELINE_OPTIONS = ['ASAP', 'Within 2 weeks', 'Within 30 days', '1-3 months', 'Flexible'];

const buildInitialItems = (product: Product): RfqRequestItemInput[] => [
  {
    productId: product.id,
    productName: product.name,
    targetSpecs: ''
  }
];

const formatFileSize = (sizeBytes: number) => {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return '0 KB';
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const RfqWorkflowForm: React.FC<RfqWorkflowFormProps> = ({
  currentProduct,
  products,
  locale,
  onSubmitted
}) => {
  const [items, setItems] = useState<RfqRequestItemInput[]>(() => buildInitialItems(currentProduct));
  const [nextProductId, setNextProductId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');
  const [destinationPort, setDestinationPort] = useState('');
  const [incoterm, setIncoterm] = useState('FOB');
  const [monthlyVolume, setMonthlyVolume] = useState('');
  const [packaging, setPackaging] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [certificationNeeded, setCertificationNeeded] = useState('');
  const [timeline, setTimeline] = useState('Within 30 days');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<RfqAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [sending, setSending] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const copy = locale === 'zh'
    ? {
        kicker: 'B2B 询价流',
        title: '获取结构化出口报价',
        subtitle: '提交一份包含多个产品的询价单（RFQ），预先定义您的贸易条款，并附上目标规格或采购文件。',
        selectedProducts: '已选产品',
        selectedProductsDesc: '在同一份询价单中添加多个产品SKU，并可为每个产品添加目标规格。',
        allActiveSelected: '所有可选产品均已添加',
        addProduct: '添加产品',
        productLabelPrefix: '产品',
        remove: '移除',
        targetSpecs: '目标规格 / 特殊要求',
        targetSpecsPlaceholder: '例如：水分上限5%，WW320，真空包装，或买方特定的质量控制要求。',
        fullName: '全名',
        email: '工作邮箱',
        companyName: '公司名称',
        phoneWhatsapp: '电话 / WhatsApp',
        destinationPort: '目的港口',
        monthlyVolume: '月采购量',
        packaging: '包装要求',
        paymentTerms: '付款条件',
        certificationNeeded: '所需认证',
        attachments: '附件',
        attachmentsDesc: '上传规格书、质量要求文件、包装指南或任何采购文件（每个最多 15MB）。',
        uploading: '正在上传...',
        uploadFiles: '上传文件',
        noAttachment: '暂未上传附件',
        commercialNotes: '商业备注',
        commercialNotesPlaceholder: '分享数量预期、目标市场、质量要求、样品需求、目标价格逻辑或任何特殊要求。',
        rfqSubmitted: '询价单已提交',
        sendingRfq: '正在发送询价单...',
        submitRfq: '向出口业务台提交询价单',
        responseWindow: '通常回复时间：通过技术审核后 12-24 个工作小时内'
      }
    : {
        kicker: 'B2B RFQ Workflow',
        title: 'Request Structured Export Pricing',
        subtitle: 'Submit one RFQ for multiple products, define your trade terms up front, and attach target specifications or buying documents.',
        selectedProducts: 'Selected Products',
        selectedProductsDesc: 'Use one RFQ for multiple SKUs and add target specs per item when needed.',
        allActiveSelected: 'All active products already selected',
        addProduct: 'Add Product',
        productLabelPrefix: 'Product',
        remove: 'Remove',
        targetSpecs: 'Target Specs / Required Notes',
        targetSpecsPlaceholder: 'Example: moisture max 5%, WW320, vacuum pack, or buyer-specific QA notes.',
        fullName: 'Full Name',
        email: 'Business Email',
        companyName: 'Company Name',
        phoneWhatsapp: 'Phone / WhatsApp',
        destinationPort: 'Destination Port',
        monthlyVolume: 'Monthly Volume',
        packaging: 'Packaging Requirement',
        paymentTerms: 'Payment Terms',
        certificationNeeded: 'Certification Needed',
        attachments: 'Attachments',
        attachmentsDesc: 'Upload specifications, target quality sheets, packing guides, or any buyer document up to 15MB each.',
        uploading: 'Uploading...',
        uploadFiles: 'Upload Files',
        noAttachment: 'No attachment uploaded yet',
        commercialNotes: 'Commercial Notes',
        commercialNotesPlaceholder: 'Share volume expectations, market, quality concerns, sample requirements, target price logic, or any special request.',
        rfqSubmitted: 'RFQ Submitted',
        sendingRfq: 'Sending RFQ...',
        submitRfq: 'Submit RFQ to Export Desk',
        responseWindow: 'Typical response window: 12-24 business hours after technical review'
      };

  useEffect(() => {
    setItems(buildInitialItems(currentProduct));
    setNextProductId('');
    setAttachments([]);
    setSubmitError(null);
    setInquirySent(false);
  }, [currentProduct.id]);

  const localizedProducts = useMemo(
    () =>
      products.map((product) => ({
        product,
        localized: localizeProduct(product, locale)
      })),
    [locale, products]
  );

  const productById = useMemo(
    () =>
      new Map(
        localizedProducts.map((entry) => [
          entry.product.id,
          {
            product: entry.product,
            localized: entry.localized
          }
        ])
      ),
    [localizedProducts]
  );

  const selectedProductIds = useMemo(() => new Set(items.map((item) => item.productId)), [items]);
  const availableProducts = useMemo(
    () => localizedProducts.filter((entry) => !selectedProductIds.has(entry.product.id)),
    [localizedProducts, selectedProductIds]
  );

  useEffect(() => {
    if (!nextProductId && availableProducts[0]) {
      setNextProductId(availableProducts[0].product.id);
    }

    if (nextProductId && !availableProducts.some((entry) => entry.product.id === nextProductId)) {
      setNextProductId(availableProducts[0]?.product.id || '');
    }
  }, [availableProducts, nextProductId]);

  const addSelectedProduct = () => {
    if (!nextProductId || selectedProductIds.has(nextProductId)) {
      return;
    }

    const nextProduct = productById.get(nextProductId)?.product;
    setItems((currentItems) => [
      ...currentItems,
      {
        productId: nextProductId,
        productName: nextProduct?.name || nextProductId,
        targetSpecs: ''
      }
    ]);
  };

  const removeItem = (productId: string) => {
    setItems((currentItems) => {
      if (currentItems.length <= 1) {
        return currentItems;
      }

      return currentItems.filter((item) => item.productId !== productId);
    });
  };

  const updateTargetSpecs = (productId: string, targetSpecs: string) => {
    setItems((currentItems) =>
      currentItems.map((item) => (item.productId === productId ? { ...item, targetSpecs } : item))
    );
  };

  const handleAttachmentSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (files.length === 0) {
      return;
    }

    setSubmitError(null);
    setIsUploadingAttachment(true);

    try {
      const uploadedAttachments = [];

      for (const file of files) {
        uploadedAttachments.push(await uploadRfqAttachment(file));
      }

      setAttachments((current) => [...current, ...uploadedAttachments]);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to upload RFQ attachment.');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const removeAttachment = (publicUrl: string) => {
    setAttachments((current) => current.filter((item) => item.publicUrl !== publicUrl));
  };

  const resetForm = () => {
    setItems(buildInitialItems(currentProduct));
    setFullName('');
    setEmail('');
    setCompanyName('');
    setPhoneWhatsapp('');
    setDestinationPort('');
    setIncoterm('FOB');
    setMonthlyVolume('');
    setPackaging('');
    setPaymentTerms('');
    setCertificationNeeded('');
    setTimeline('Within 30 days');
    setMessage('');
    setAttachments([]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setSubmitError(null);
    setSending(true);

    try {
      const normalizedItems = items
        .map((item) => ({
          productId: item.productId,
          productName: productById.get(item.productId)?.product.name || item.productName || item.productId,
          targetSpecs: (item.targetSpecs || '').trim() || undefined
        }))
        .filter((item) => item.productId);

      await api.submitQuotationRequest({
        fullName: fullName.trim(),
        email: email.trim(),
        companyName: companyName.trim() || undefined,
        phoneWhatsapp: phoneWhatsapp.trim() || undefined,
        destinationPort: destinationPort.trim(),
        incoterm: incoterm.trim(),
        monthlyVolume: monthlyVolume.trim(),
        packaging: packaging.trim() || undefined,
        paymentTerms: paymentTerms.trim() || undefined,
        certificationNeeded: certificationNeeded.trim() || undefined,
        timeline: timeline.trim() || undefined,
        message: message.trim(),
        attachments,
        items: normalizedItems
      });

      setInquirySent(true);
      onSubmitted?.({
        selectedProductIds: normalizedItems.map((item) => item.productId),
        monthlyVolume: monthlyVolume.trim()
      });
      resetForm();
      window.setTimeout(() => setInquirySent(false), 5000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit RFQ.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="bg-white py-24 lg:py-32 border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white border-2 border-foodmax-forest p-8 md:p-14 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-gray-50 rounded-full -mr-20 -mt-20" />

          <div className="relative z-10">
            <div className="max-w-3xl mb-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foodmax-forest mb-4">{copy.kicker}</p>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">{copy.title}</h2>
              <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed">
                {copy.subtitle}
              </p>
            </div>

            {submitError && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="rounded-[2rem] border border-gray-100 bg-gray-50 p-6 md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">{copy.selectedProducts}</h3>
                    <p className="text-sm text-gray-500 font-medium">{copy.selectedProductsDesc}</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                      value={nextProductId}
                      onChange={(event) => setNextProductId(event.target.value)}
                      className="min-w-[220px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none focus:border-foodmax-forest"
                      disabled={availableProducts.length === 0}
                    >
                      {availableProducts.length === 0 ? (
                        <option value="">{copy.allActiveSelected}</option>
                      ) : (
                        availableProducts.map((entry) => (
                          <option key={entry.product.id} value={entry.product.id}>
                            {entry.localized.name} ({getCategoryLabel(entry.product.category, locale)})
                          </option>
                        ))
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={addSelectedProduct}
                      disabled={!nextProductId || availableProducts.length === 0}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-foodmax-forest px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-foodmax-lime hover:text-foodmax-forest disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={16} /> {copy.addProduct}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => {
                    const productEntry = productById.get(item.productId);
                    const localizedProduct = productEntry?.localized;
                    const productData = productEntry?.product;

                    return (
                      <div key={item.productId} className="rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-foodmax-forest mb-2">
                              {copy.productLabelPrefix} {index + 1}
                            </p>
                            <h4 className="text-xl font-black text-gray-900">
                              {localizedProduct?.name || item.productName || item.productId}
                            </h4>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
                              {productData ? `${getCategoryLabel(productData.category, locale)} / ${localizedProduct?.subCategory || productData.subCategory}` : item.productId}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            disabled={items.length <= 1}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 transition-colors hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={14} /> {copy.remove}
                          </button>
                        </div>
                        <div className="mt-5">
                          <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                            {copy.targetSpecs}
                          </label>
                          <textarea
                            rows={3}
                            value={item.targetSpecs || ''}
                            onChange={(event) => updateTargetSpecs(item.productId, event.target.value)}
                            placeholder={copy.targetSpecsPlaceholder}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-foodmax-forest focus:bg-white resize-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <input
                  type="text"
                  placeholder={copy.fullName}
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm font-medium outline-none focus:border-foodmax-forest focus:bg-white"
                />
                <input
                  type="email"
                  placeholder={copy.email}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm font-medium outline-none focus:border-foodmax-forest focus:bg-white"
                />
                <input
                  type="text"
                  placeholder={copy.companyName}
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm font-medium outline-none focus:border-foodmax-forest focus:bg-white"
                />
                <input
                  type="text"
                  placeholder={copy.phoneWhatsapp}
                  value={phoneWhatsapp}
                  onChange={(event) => setPhoneWhatsapp(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm font-medium outline-none focus:border-foodmax-forest focus:bg-white"
                />
                <input
                  type="text"
                  placeholder={copy.destinationPort}
                  required
                  value={destinationPort}
                  onChange={(event) => setDestinationPort(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm font-medium outline-none focus:border-foodmax-forest focus:bg-white"
                />
                <select
                  value={incoterm}
                  onChange={(event) => setIncoterm(event.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm font-medium outline-none focus:border-foodmax-forest focus:bg-white"
                >
                  {INCOTERM_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder={copy.monthlyVolume}
                  required
                  value={monthlyVolume}
                  onChange={(event) => setMonthlyVolume(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm font-medium outline-none focus:border-foodmax-forest focus:bg-white"
                />
                <input
                  type="text"
                  placeholder={copy.packaging}
                  value={packaging}
                  onChange={(event) => setPackaging(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm font-medium outline-none focus:border-foodmax-forest focus:bg-white"
                />
                <input
                  type="text"
                  placeholder={copy.paymentTerms}
                  value={paymentTerms}
                  onChange={(event) => setPaymentTerms(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm font-medium outline-none focus:border-foodmax-forest focus:bg-white"
                />
                <input
                  type="text"
                  placeholder={copy.certificationNeeded}
                  value={certificationNeeded}
                  onChange={(event) => setCertificationNeeded(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm font-medium outline-none focus:border-foodmax-forest focus:bg-white"
                />
                <select
                  value={timeline}
                  onChange={(event) => setTimeline(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm font-medium outline-none focus:border-foodmax-forest focus:bg-white md:col-span-2"
                >
                  {TIMELINE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-[2rem] border border-gray-100 bg-gray-50 p-6 md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">{copy.attachments}</h3>
                    <p className="text-sm text-gray-500 font-medium">
                      {copy.attachmentsDesc}
                    </p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-gray-700 transition-all hover:border-foodmax-forest hover:text-foodmax-forest">
                    {isUploadingAttachment ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {isUploadingAttachment ? copy.uploading : copy.uploadFiles}
                    <input
                      type="file"
                      multiple
                      accept={RFQ_ATTACHMENT_INPUT_ACCEPT}
                      onChange={handleAttachmentSelection}
                      className="hidden"
                    />
                  </label>
                </div>

                {attachments.length > 0 ? (
                  <div className="space-y-3">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.publicUrl}
                        className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-gray-900">{attachment.fileName}</p>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                            {attachment.contentType} / {formatFileSize(attachment.sizeBytes)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(attachment.publicUrl)}
                          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 transition-colors hover:text-red-600"
                        >
                          <X size={14} /> {copy.remove}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-gray-200 px-6 py-10 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">{copy.noAttachment}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                  {copy.commercialNotes}
                </label>
                <textarea
                  rows={6}
                  placeholder={copy.commercialNotesPlaceholder}
                  required
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="w-full rounded-[1.75rem] border border-gray-200 bg-gray-50 px-6 py-5 text-sm font-medium outline-none focus:border-foodmax-forest focus:bg-white resize-none"
                />
              </div>

              <button
                disabled={sending || inquirySent || isUploadingAttachment}
                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${
                  inquirySent
                    ? 'bg-green-500 text-white'
                    : 'bg-foodmax-forest text-white hover:bg-foodmax-forest/90 active:scale-[0.98]'
                } ${(sending || isUploadingAttachment) ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                {inquirySent ? (
                  <>
                    <CheckCircle size={20} /> {copy.rfqSubmitted}
                  </>
                ) : sending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> {copy.sendingRfq}
                  </>
                ) : (
                  <>{copy.submitRfq}</>
                )}
              </button>

              <p className="text-[10px] text-gray-400 text-center uppercase tracking-[0.3em] font-black">
                {copy.responseWindow}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RfqWorkflowForm;
