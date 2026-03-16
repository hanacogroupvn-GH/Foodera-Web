
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { NewsItem, NewsCategory } from '../../types';
import { buildUniqueNewsSlug, getNewsPath, normalizeNewsSlug } from '../../lib/newsSeo';
import { googleSheetToCsvUrl, mapCsvRowsToNews, parseCsv } from '../../lib/csvImport';
import { CMS_IMAGE_INPUT_ACCEPT, uploadCmsImage } from '../../lib/storageUploads';
import { formatDisplayDate, getNewsCategoryLabel, localizeNewsItem } from '../../lib/contentLocalization';
import { 
  FileText, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  Calendar,
  X,
  Image as ImageIcon,
  Save,
  Loader2,
  AlertCircle,
  Clock,
  Eye,
  LogOut,
  Upload,
  Link as LinkIcon
} from 'lucide-react';

const NEWS_DRAFT_KEY = 'foodmax_admin_news_draft_v1';

type NewsDraft = {
  editingItemId: string | null;
  formData: Partial<NewsItem>;
  contentString: string;
  zhContentString: string;
  hasCustomSlug: boolean;
};

const readNewsDraft = (): NewsDraft | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(NEWS_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NewsDraft;
    if (!parsed || typeof parsed !== 'object' || !parsed.formData) return null;
    return {
      editingItemId: typeof parsed.editingItemId === 'string' ? parsed.editingItemId : null,
      formData: parsed.formData,
      contentString: typeof parsed.contentString === 'string' ? parsed.contentString : '',
      zhContentString: typeof parsed.zhContentString === 'string' ? parsed.zhContentString : '',
      hasCustomSlug: Boolean(parsed.hasCustomSlug)
    };
  } catch {
    return null;
  }
};

const writeNewsDraft = (draft: NewsDraft) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NEWS_DRAFT_KEY, JSON.stringify(draft));
};

const clearNewsDraft = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(NEWS_DRAFT_KEY);
};

const AdminNews: React.FC = () => {
  const createNewsId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `news-${Date.now()}`;
  };

  const { news, addNews, updateNews, deleteNews } = useData();
  const { logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const copy =
    locale === 'zh'
      ? {
          exitHome: '返回首页',
          portalTitle: '资讯与新闻中心',
          createPost: '新建文章',
          importFromSheet: '从 Google 表格导入 CSV',
          importLink: '导入链接',
          importing: '导入中...',
          uploadCsv: '上传 CSV',
          searchPlaceholder: '按标题或分类搜索文章...',
          editInsight: '编辑资讯文章',
          composeInsight: '撰写新资讯',
          translationSection: '中文翻译',
          translationNote: '用于多语言发布的简体中文字段。',
          discardDraft: '放弃草稿',
          updatePublication: '更新发布',
          publishPortal: '发布到站点',
          manageDesc: '管理企业资讯与全球市场分析内容。',
          articleIntel: '文章情报',
          category: '分类',
          publishDate: '发布日期',
          actions: '操作',
          noMatches: '未找到匹配资讯',
          cmsLanguage: 'CMS 语言',
          imageUploadFailed: '图片上传失败。',
          saveFailed: '无法保存该文章，请检查 Supabase schema 或权限策略。',
          csvLinkRequired: '请先输入 Google 表格链接。',
          csvImportFailed: 'CSV 导入失败。',
          supportedColumns: '支持的资讯列：id、title、slug、category、date、excerpt、content（或 content_1/content_2...）、image。',
          slugLabel: '短链',
          modalSubtitle: '市场分析与传播中心',
          coverImageLabel: '封面图（URL 或上传）',
          coverUrlPlaceholder: '输入 Unsplash 或图片直链...',
          uploadingImage: '图片上传中...',
          uploadFromComputer: '从电脑上传',
          resolutionHint: '建议分辨率：1200x800px，适合高分屏显示。',
          headlineLabel: '标题 / 主标题',
          headlinePlaceholder: '例如：第四季度大米出口稳定性分析...',
          seoSlugLabel: 'SEO Slug（可选）',
          canonicalUrlLabel: '规范 URL',
          categoryLabel: '资讯分类',
          releaseDateLabel: '发布日期',
          releaseDatePlaceholder: '2024年2月15日',
          excerptLabel: '文章摘要（短简介）',
          excerptPlaceholder: '用于资讯列表的简短引导文...',
          zhHeadlineLabel: '中文标题',
          zhExcerptLabel: '中文摘要',
          fullContentLabel: '正文内容',
          fullContentHint: '每次换行都会生成一个段落',
          zhContentLabel: '中文正文',
          zhContentHint: '使用换行创建中文段落',
          saveFailedPrefix: '保存失败：'
        }
      : {
          exitHome: 'Exit to Home',
          portalTitle: 'Insights & News Portal',
          createPost: 'Create New Post',
          importFromSheet: 'Import CSV from Google Sheet',
          importLink: 'Import Link',
          importing: 'Importing...',
          uploadCsv: 'Upload CSV',
          searchPlaceholder: 'Search articles by title or category...',
          editInsight: 'Edit Insight Post',
          composeInsight: 'Compose New Insight',
          translationSection: 'Chinese Translation',
          translationNote: 'Optional Simplified Chinese fields for multilingual publishing.',
          discardDraft: 'Discard Draft',
          updatePublication: 'Update Publication',
          publishPortal: 'Publish to Portal',
          manageDesc: 'Manage corporate communications and global market analysis reports.',
          articleIntel: 'Article Intelligence',
          category: 'Category',
          publishDate: 'Publish Date',
          actions: 'Actions',
          noMatches: 'No matching insights found',
          cmsLanguage: 'CMS Language',
          imageUploadFailed: 'Image upload failed.',
          saveFailed: 'Unable to save this article. Please check Supabase schema/policies.',
          csvLinkRequired: 'Please enter a Google Sheet link first.',
          csvImportFailed: 'CSV import failed.',
          supportedColumns: 'Supported insight columns: id, title, slug, category, date, excerpt, content (or content_1/content_2...), image.',
          slugLabel: 'Slug',
          modalSubtitle: 'Market Analysis & Communication Hub',
          coverImageLabel: 'Featured Cover Image (URL or upload)',
          coverUrlPlaceholder: 'Enter Unsplash or Direct URL...',
          uploadingImage: 'Uploading image...',
          uploadFromComputer: 'Upload from computer',
          resolutionHint: 'Resolution: 1200x800px recommended for high-DPI displays.',
          headlineLabel: 'Headline / Title',
          headlinePlaceholder: 'e.g. Q4 Rice Export Stability Analysis...',
          seoSlugLabel: 'SEO Slug (Optional)',
          canonicalUrlLabel: 'Canonical URL',
          categoryLabel: 'Intelligence Category',
          releaseDateLabel: 'Release Date',
          releaseDatePlaceholder: 'Feb 15, 2024',
          excerptLabel: 'Article Excerpt (Short Summary)',
          excerptPlaceholder: 'A brief hook for the news archive grid...',
          zhHeadlineLabel: 'Chinese Headline',
          zhExcerptLabel: 'Chinese Excerpt',
          fullContentLabel: 'Full Article Content',
          fullContentHint: 'Newlines create paragraphs',
          zhContentLabel: 'Chinese Article Content',
          zhContentHint: 'Use new lines to create Chinese paragraphs',
          saveFailedPrefix: 'Save failed: '
        };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasCustomSlug, setHasCustomSlug] = useState(false);
  const [csvSheetUrl, setCsvSheetUrl] = useState('');
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvImportStatus, setCsvImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);
  const [coverImageUploadError, setCoverImageUploadError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<NewsItem>>({
    slug: '',
    title: '',
    category: 'Market Insights',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    excerpt: '',
    content: [],
    image: ''
  });

  // Derived state for the multi-line content textarea
  const [contentString, setContentString] = useState('');
  const [zhContentString, setZhContentString] = useState('');

  useEffect(() => {
    const draft = readNewsDraft();
    if (!draft) return;

    if (draft.editingItemId) {
      const existingItem = news.find((item) => item.id === draft.editingItemId);
      setEditingItem(existingItem || ({ id: draft.editingItemId } as NewsItem));
    } else {
      setEditingItem(null);
    }

    setFormData(draft.formData);
    setContentString(draft.contentString);
    setZhContentString(draft.zhContentString);
    setHasCustomSlug(draft.hasCustomSlug);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      clearNewsDraft();
      return;
    }

    writeNewsDraft({
      editingItemId: editingItem?.id || null,
      formData,
      contentString,
      zhContentString,
      hasCustomSlug
    });
  }, [isModalOpen, editingItem?.id, formData, contentString, zhContentString, hasCustomSlug]);

  const filteredNews = news.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.translations?.zh?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.translations?.zh?.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const slugPreview = normalizeNewsSlug((formData.slug || formData.title || '').trim()) || 'news-item';

  const openModal = (item?: NewsItem) => {
    setSaveError(null);
    setCoverImageUploadError(null);
    if (item) {
      setEditingItem(item);
      setFormData({
        ...item,
        translations: {
          zh: {
            ...(item.translations?.zh || {})
          }
        }
      });
      setContentString(item.content.join('\n\n'));
      setZhContentString(item.translations?.zh?.content?.join('\n\n') || '');
      setHasCustomSlug(!!item.slug?.trim());
    } else {
      setEditingItem(null);
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      setFormData({
        slug: '',
        title: '',
        category: 'Market Insights',
        date: today,
        excerpt: '',
        content: [],
        image: 'https://images.unsplash.com/photo-1592910129881-892bbe239cc0?auto=format&fit=crop&q=80&w=1200',
        translations: { zh: { title: '', excerpt: '', content: [] } }
      });
      setContentString('');
      setZhContentString('');
      setHasCustomSlug(false);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setSaveError(null);
    setCoverImageUploadError(null);
    setHasCustomSlug(false);
    setZhContentString('');
    clearNewsDraft();
  };

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setCoverImageUploadError(null);
    setIsUploadingCoverImage(true);

    try {
      const publicUrl = await uploadCmsImage(file, [
        'news',
        normalizeNewsSlug((editingItem?.id || formData.slug || formData.title || 'news-item').trim()) || 'news-item',
        'cover'
      ]);

      setFormData((prev) => ({
        ...prev,
        image: publicUrl
      }));
    } catch (err: any) {
      setCoverImageUploadError(err?.message || copy.imageUploadFailed);
    } finally {
      setIsUploadingCoverImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    // Convert string to paragraphs
    const paragraphs = contentString.split('\n').filter(p => p.trim() !== '');
    const zhParagraphs = zhContentString.split('\n').filter(p => p.trim() !== '');

    setTimeout(async () => {
      let isSuccess = false;
      try {
        const title = (formData.title || '').trim();
        const slugPool = news.map((item) => item.slug);
        const requestedSlug = (formData.slug || '').trim();
        const finalSlug = buildUniqueNewsSlug(requestedSlug || title, slugPool, editingItem?.slug);

        const payload = {
          id: editingItem?.id || createNewsId(),
          slug: finalSlug,
          title,
          category: (formData.category || 'Market Insights') as NewsCategory,
          date: (formData.date || '').trim(),
          excerpt: (formData.excerpt || '').trim(),
          image: (formData.image || '').trim(),
          content: paragraphs,
          translations:
            (formData.translations?.zh?.title || '').trim() ||
            (formData.translations?.zh?.excerpt || '').trim() ||
            zhParagraphs.length > 0
              ? {
                  zh: {
                    title: (formData.translations?.zh?.title || '').trim(),
                    excerpt: (formData.translations?.zh?.excerpt || '').trim(),
                    content: zhParagraphs
                  }
                }
              : undefined
        } as NewsItem;

        if (editingItem) {
          await updateNews(payload);
        } else {
          await addNews(payload);
        }
        isSuccess = true;
      } catch (err: any) {
        setSaveError(err?.message || copy.saveFailed);
      } finally {
        setIsSaving(false);
        if (isSuccess) closeModal();
      }
    }, 600);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(locale === 'zh' ? `确定要永久删除文章“${title}”吗？` : `Are you sure you want to permanently delete the post: "${title}"?`)) {
      deleteNews(id);
    }
  };

  const importNewsFromCsvText = async (csvText: string, sourceLabel: string) => {
    const parsed = parseCsv(csvText);
    if (!parsed.rows.length) {
      throw new Error(locale === 'zh' ? 'CSV 中没有可导入的数据行。' : 'CSV has no data rows to import.');
    }

    const existingById = Object.fromEntries(news.map((item) => [item.id, item.slug]));
    const mapped = mapCsvRowsToNews(parsed.rows, { existingById });
    if (!mapped.items.length) {
      throw new Error(mapped.errors[0] || (locale === 'zh' ? '未找到有效的资讯数据行。' : 'No valid insight rows found.'));
    }

    const existingIds = new Set(news.map((item) => item.id));
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of mapped.items) {
      if (existingIds.has(item.id)) {
        await updateNews(item);
        updatedCount += 1;
      } else {
        await addNews(item);
        createdCount += 1;
      }
      existingIds.add(item.id);
    }

    if (mapped.errors.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(locale === 'zh' ? '资讯 CSV 已跳过以下行:' : 'News CSV skipped rows:', mapped.errors);
    }

    const skippedPart =
      mapped.errors.length > 0
        ? locale === 'zh'
          ? `，跳过 ${mapped.errors.length} 行无效数据`
          : `, skipped ${mapped.errors.length} invalid row(s)`
        : '';
    setCsvImportStatus({
      type: 'success',
      message:
        locale === 'zh'
          ? `${sourceLabel}: 已导入 ${mapped.items.length} 篇资讯（新增 ${createdCount} 篇，更新 ${updatedCount} 篇${skippedPart}）。`
          : `${sourceLabel}: imported ${mapped.items.length} insight(s) (${createdCount} new, ${updatedCount} updated${skippedPart}).`
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
            ? `无法下载 CSV（HTTP ${response.status}）。请检查 Google Sheet 的共享或发布设置。`
            : `Unable to download CSV (HTTP ${response.status}). Check sharing/publish settings on Google Sheet.`
        );
      }
      const csvText = await response.text();
      await importNewsFromCsvText(csvText, locale === 'zh' ? 'Google 表格' : 'Google Sheet');
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
      await importNewsFromCsvText(csvText, file.name || (locale === 'zh' ? 'CSV 文件' : 'CSV file'));
    } catch (err: any) {
      setCsvImportStatus({ type: 'error', message: err?.message || copy.csvImportFailed });
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleExit = () => {
    logout();
  };

  const categories: NewsCategory[] = ['Market Insights', 'Company Updates', 'Sustainability', 'Events'];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Mini Sidebar */}
      <aside className="w-22 bg-foodmax-forest text-white flex flex-col items-center py-8 gap-8 sticky top-0 h-screen shadow-2xl z-20">
        <Link to="/admin" className="p-3.5 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/5"><ChevronLeft size={24} /></Link>
        <div className="flex flex-col gap-6 flex-grow">
          <Link to="/admin/news" className="p-3.5 bg-foodmax-lime text-foodmax-forest rounded-2xl shadow-xl shadow-foodmax-lime/20 border border-foodmax-lime/20"><FileText size={24} /></Link>
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{copy.portalTitle}</h1>
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
                <Plus size={20} /> {copy.createPost}
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
            <p className="text-[11px] text-gray-500 font-medium">{copy.supportedColumns}</p>
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

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="text" 
                placeholder={copy.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-foodmax-forest/10 border-none text-sm font-medium"
              />
            </div>
          </div>

          {/* News Table */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{copy.articleIntel}</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{copy.category}</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{copy.publishDate}</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{copy.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredNews.map(item => {
                  const localized = localizeNewsItem(item, locale);
                  return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                          <img src={item.image} className="w-full h-full object-cover" alt={localized.title} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-tight line-clamp-1">{localized.title}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{copy.slugLabel}: {item.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-foodmax-forest/5 text-foodmax-forest text-[9px] font-black uppercase tracking-widest rounded-lg">
                        {getNewsCategoryLabel(item.category, locale)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar size={14} className="text-foodmax-lime" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{formatDisplayDate(item.date, locale)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <Link 
                          to={getNewsPath(item)}
                          target="_blank"
                          className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-900 hover:text-white transition-all shadow-sm"
                        >
                          <Eye size={18} />
                        </Link>
                        <button 
                          onClick={() => openModal(item)}
                          className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-foodmax-forest hover:text-white transition-all shadow-sm"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id, item.title)}
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
            
            {filteredNews.length === 0 && (
              <div className="py-20 text-center">
                <AlertCircle size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-black uppercase text-xs tracking-widest">{copy.noMatches}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Slide-Over remains identical */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-foodmax-forest text-white">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  {editingItem ? copy.editInsight : copy.composeInsight}
                </h2>
                <p className="text-foodmax-lime/60 text-[10px] font-bold uppercase tracking-widest mt-1">{copy.modalSubtitle}</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-10 space-y-8">
              {/* Cover Image */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.coverImageLabel}</label>
                <div className="flex gap-6 items-center">
                  <div className="w-48 h-28 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
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
                      placeholder={copy.coverUrlPlaceholder}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium"
                      required
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <label
                        className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          isUploadingCoverImage
                            ? 'cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400'
                            : 'cursor-pointer border-gray-200 bg-white text-foodmax-forest hover:border-foodmax-forest/20 hover:bg-foodmax-forest/5'
                        }`}
                      >
                        {isUploadingCoverImage ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {isUploadingCoverImage ? copy.uploadingImage : copy.uploadFromComputer}
                        <input
                          type="file"
                          accept={CMS_IMAGE_INPUT_ACCEPT}
                          onChange={handleCoverImageUpload}
                          disabled={isUploadingCoverImage}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-gray-400 font-medium">JPG, PNG, WEBP, GIF, AVIF. Max 10MB.</span>
                    </div>
                    <p className="text-[10px] text-gray-400 italic font-medium">{copy.resolutionHint}</p>
                    {coverImageUploadError && (
                      <p className="text-[10px] text-red-500 italic">{coverImageUploadError}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.headlineLabel}</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => {
                    const nextTitle = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      title: nextTitle,
                      slug: hasCustomSlug ? (prev.slug || '') : normalizeNewsSlug(nextTitle)
                    }));
                  }}
                  className="w-full px-4 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-lg font-black"
                  placeholder={copy.headlinePlaceholder}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.seoSlugLabel}</label>
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={(e) => {
                    const rawSlug = e.target.value;
                    setHasCustomSlug(rawSlug.trim().length > 0);
                    setFormData((prev) => ({ ...prev, slug: rawSlug }));
                  }}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-bold"
                  placeholder="incoterms-explained-a-practical-guide"
                />
                <p className="text-[10px] text-gray-500 font-semibold">
                  {copy.canonicalUrlLabel}: <span className="text-foodmax-forest">/news/{slugPreview}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.categoryLabel}</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as NewsCategory})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-bold cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{getNewsCategoryLabel(c, locale)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.releaseDateLabel}</label>
                  <input 
                    type="text" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-bold"
                    placeholder={copy.releaseDatePlaceholder}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.excerptLabel}</label>
                <textarea 
                  rows={2}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium resize-none"
                  placeholder={copy.excerptPlaceholder}
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

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.zhHeadlineLabel}</label>
                  <input
                    type="text"
                    value={formData.translations?.zh?.title || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        translations: {
                          ...prev.translations,
                          zh: {
                            ...prev.translations?.zh,
                            title: e.target.value
                          }
                        }
                      }))
                    }
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium"
                    placeholder="中文标题"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.zhExcerptLabel}</label>
                  <textarea
                    rows={2}
                    value={formData.translations?.zh?.excerpt || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        translations: {
                          ...prev.translations,
                          zh: {
                            ...prev.translations?.zh,
                            excerpt: e.target.value
                          }
                        }
                      }))
                    }
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-sm font-medium resize-none"
                    placeholder="中文摘要"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.fullContentLabel}</label>
                  <span className="text-[9px] font-bold text-foodmax-forest bg-foodmax-forest/5 px-2 py-1 rounded">{copy.fullContentHint}</span>
                </div>
                <textarea 
                  rows={10}
                  value={contentString}
                  onChange={(e) => setContentString(e.target.value)}
                  className="w-full px-4 py-5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-base font-medium resize-none leading-relaxed"
                  placeholder="Draft your professional analysis here..."
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.zhContentLabel}</label>
                  <span className="text-[9px] font-bold text-foodmax-forest bg-foodmax-forest/5 px-2 py-1 rounded">{copy.zhContentHint}</span>
                </div>
                <textarea
                  rows={8}
                  value={zhContentString}
                  onChange={(e) => setZhContentString(e.target.value)}
                  className="w-full px-4 py-5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodmax-forest/20 outline-none text-base font-medium resize-none leading-relaxed"
                  placeholder="中文正文内容..."
                />
              </div>
            </form>

            <div className="p-8 border-t border-gray-100 bg-gray-50">
              {saveError && (
                <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
                  {copy.saveFailedPrefix}{saveError}
                </div>
              )}
              <div className="flex items-center gap-4">
              <button 
                onClick={closeModal}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
              >
                {copy.discardDraft}
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || isUploadingCoverImage}
                className="flex-[2] py-4 bg-foodmax-forest text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-foodmax-lime hover:text-foodmax-forest transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <><Save size={18} /> {editingItem ? copy.updatePublication : copy.publishPortal}</>
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

export default AdminNews;
