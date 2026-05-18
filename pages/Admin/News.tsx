
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
import { appRoutes } from '../../lib/routes';
import { preserveVietnamesePlaceNamesDeep } from '../../lib/preserveVietnamesePlaceNames';
import { repairMojibakeDeep, repairMojibakeText } from '../../lib/repairMojibake';
import { canTranslateCmsContent, translateNewsToChinese } from '../../lib/zhTranslation';
import { analyzeSeo, SeoReport, SeoSeverity, type ContentPolicyFlag, type ReadabilityResult, type SerpPreviewData } from '../../lib/seoAnalyzer';
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
  EyeOff,
  CheckCircle,
  LogOut,
  Upload,
  Link as LinkIcon,
  Languages,
  MapPinned,
  BarChart3,
  Target,
  TrendingUp,
  ShieldCheck,
  CircleAlert,
  TriangleAlert,
  CheckCircle2,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  CalendarClock,
  Inbox,
  Table2,
  Megaphone,
  Tag,
  Anchor,
  Undo2,
  Redo2,
  Globe,
  AlertOctagon,
  BookOpen,
  Gauge,
  FileSearch2,
  Replace,
  ListTree,
  Info,
} from 'lucide-react';
import { AdminSidebar } from '../../components/AdminSidebar';

type ListViewTab = 'all' | 'scheduled' | 'active' | 'inactive';

// ── Rich‑text toolbar helper ──────────────────────────────
const wrapSelection = (
  textarea: HTMLTextAreaElement | null,
  setter: React.Dispatch<React.SetStateAction<string>>,
  prefix: string,
  suffix: string,
  placeholder = 'text'
) => {
  if (!textarea) return;
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd) || placeholder;
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  const inserted = `${prefix}${selected}${suffix}`;
  setter(before + inserted + after);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(
      selectionStart + prefix.length,
      selectionStart + prefix.length + selected.length
    );
  });
};

const insertAtCursor = (
  textarea: HTMLTextAreaElement | null,
  setter: React.Dispatch<React.SetStateAction<string>>,
  text: string
) => {
  if (!textarea) return;
  const { selectionStart, value } = textarea;
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionStart);
  const needsNewline = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
  setter(before + needsNewline + text + after);
  requestAnimationFrame(() => {
    textarea.focus();
    const pos = selectionStart + needsNewline.length + text.length;
    textarea.setSelectionRange(pos, pos);
  });
};

const NEWS_DRAFT_KEY = 'foodera_admin_news_draft_v1';

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
  const rawCopy =
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
          saveFailed: '无法保存该文章，请检查 Turso 后端或 API 权限。',
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
          saveFailedPrefix: '保存失败：',
          imageAltLabel: '封面图 Alt Text (SEO)',
          imageAltPlaceholder: '例如：越南茉莉香米出口包装 - FoodEra',
          imageAltHint: '包含主关键词，不超过 125 字符。留空则自动使用文章标题。',
          imageSizeWarning: '⚠ 图片体积超过 500KB，建议压缩后再上传以提升页面加载速度。'
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
          saveFailed: 'Unable to save this article. Please check the Turso backend or API permissions.',
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
          saveFailedPrefix: 'Save failed: ',
          imageAltLabel: 'Cover Image Alt Text (SEO)',
          imageAltPlaceholder: 'e.g. Vietnamese jasmine rice export packaging — FoodEra',
          imageAltHint: 'Include your focus keyword. Max 125 chars. Leave blank to use article title.',
          imageSizeWarning: '⚠ Image exceeds 500KB — consider compressing before uploading for faster page load.'
        };
  const copy = locale === 'zh' ? repairMojibakeDeep(rawCopy) : rawCopy;
  const zh = repairMojibakeText;
  const activeStatusLabel = locale === 'zh' ? zh('\u542f\u7528') : 'Active';
  const inactiveStatusLabel = locale === 'zh' ? zh('\u505c\u7528') : 'Inactive';
  const statusFieldLabel = locale === 'zh' ? zh('\u72b6\u6001') : 'Status';
  const statusHelpText =
    locale === 'zh'
      ? zh('\u505c\u7528\u540e\uff0c\u8be5\u6587\u7ae0\u5c06\u4e0d\u518d\u5728\u516c\u5f00\u7f51\u7ad9\u4e0a\u663e\u793a\u3002')
      : 'Inactive articles are hidden from the public website.';
  const translateButtonLabel = locale === 'zh' ? zh('\u7ffb\u8bd1\u6210\u4e2d\u6587') : 'Translate to Chinese';
  const translatingButtonLabel = locale === 'zh' ? zh('\u7ffb\u8bd1\u4e2d...') : 'Translating...';
  const translateMissingKeyMessage =
    locale === 'zh'
      ? zh('Ollama \u7ffb\u8bd1\u672a\u5c31\u7eea\uff0c\u8bf7\u68c0\u67e5 VITE_OLLAMA_BASE_URL\u3001VITE_OLLAMA_MODEL \u6216\u672c\u5730 Ollama \u670d\u52a1\u3002')
      : 'Ollama translation is unavailable. Check VITE_OLLAMA_BASE_URL, VITE_OLLAMA_MODEL, or the local Ollama service.';
  const translateSuccessMessage =
    locale === 'zh' ? zh('\u5df2\u751f\u6210\u4e2d\u6587\u7ffb\u8bd1\u5e76\u4fdd\u5b58\u3002') : 'Chinese translation generated and saved.';
  const translateDraftSuccessMessage =
    locale === 'zh' ? zh('\u5df2\u586b\u5145\u4e2d\u6587\u7ffb\u8bd1\u8349\u7a3f\u3002') : 'Chinese translation draft populated.';
  const translateFailedPrefix = locale === 'zh' ? zh('\u7ffb\u8bd1\u5931\u8d25\uff1a') : 'Translation failed: ';
  const translateDraftRequirementMessage =
    locale === 'zh'
      ? zh('\u8bf7\u5148\u586b\u5199\u82f1\u6587\u6807\u9898\u548c\u6b63\u6587\uff0c\u518d\u6267\u884c\u7ffb\u8bd1\u3002')
      : 'Fill in the English title and content before translating.';
  const [searchTerm, setSearchTerm] = useState('');
  const [listTab, setListTab] = useState<ListViewTab>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasDraftToRestore, setHasDraftToRestore] = useState(false);
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
  const [translationStatus, setTranslationStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);
  const [coverImageUploadError, setCoverImageUploadError] = useState<string | null>(null);
  const [translatingItemId, setTranslatingItemId] = useState<string | null>(null);
  const [isTranslatingDraft, setIsTranslatingDraft] = useState(false);
  const [modalTab, setModalTab] = useState<'general' | 'content' | 'translation' | 'seo'>('general');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceTextVal, setReplaceTextVal] = useState('');
  const [showOutline, setShowOutline] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const contentTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<NewsItem>>({
    slug: '',
    title: '',
    isActive: true,
    category: 'Market Insight',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    excerpt: '',
    content: [],
    image: ''
  });

  // Derived state for the multi-line content textarea
  const [contentString, setContentString] = useState('');
  const [zhContentString, setZhContentString] = useState('');

  // Check for unsaved draft on mount (but don't auto-open — prompt user instead)
  useEffect(() => {
    const draft = readNewsDraft();
    if (draft) setHasDraftToRestore(true);
  }, []);

  // Draft is intentionally NOT auto-restored on mount to prevent form from
  // re-opening when the user navigates back to this page from elsewhere.

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

  const matchesSearch = (n: NewsItem) =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.translations?.zh?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.translations?.zh?.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase());

  const scheduledNews = news.filter(
    (n) => n.scheduledAt && new Date(n.scheduledAt).getTime() > Date.now() && matchesSearch(n)
  );
  const allFilteredNews = news.filter(matchesSearch);
  const activeNews = allFilteredNews.filter((n) => n.isActive !== false);
  const inactiveNews = allFilteredNews.filter((n) => n.isActive === false);
  const filteredNews =
    listTab === 'scheduled' ? scheduledNews
    : listTab === 'active'  ? activeNews
    : listTab === 'inactive' ? inactiveNews
    : allFilteredNews;
  const slugPreview = normalizeNewsSlug((formData.slug || formData.title || '').trim()) || 'news-item';

  const handleRestoreDraft = () => {
    const draft = readNewsDraft();
    if (!draft) return;
    if (draft.editingItemId) {
      const existingItem = news.find((item) => item.id === draft.editingItemId);
      setEditingItem(existingItem || ({ id: draft.editingItemId } as NewsItem));
    } else {
      setEditingItem(null);
    }
    setFormData(preserveVietnamesePlaceNamesDeep(draft.formData));
    setContentString(draft.contentString);
    setZhContentString(draft.zhContentString);
    setHasCustomSlug(draft.hasCustomSlug);
    setHasDraftToRestore(false);
    setIsModalOpen(true);
  };

  const handleDiscardDraft = () => {
    clearNewsDraft();
    setHasDraftToRestore(false);
  };

  const openModal = (item?: NewsItem) => {
    setSaveError(null);
    setCoverImageUploadError(null);
    if (item) {
      setEditingItem(item);
      setFormData({
        ...item,
        scheduledAt: item.scheduledAt || undefined,
        translations: {
          zh: {
            ...preserveVietnamesePlaceNamesDeep(item.translations?.zh || {})
          }
        }
      });
      setContentString(item.content.join('\n\n'));
      setZhContentString(preserveVietnamesePlaceNamesDeep(item.translations?.zh?.content || []).join('\n\n'));
      setHasCustomSlug(!!item.slug?.trim());
    } else {
      setEditingItem(null);
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      setFormData({
        slug: '',
        title: '',
        isActive: true,
        category: 'Market Insight',
        date: today,
        excerpt: '',
        content: [],
        image: '',
        translations: { zh: { title: '', excerpt: '', content: [] } }
      });
      setContentString('');
      setZhContentString('');
      setHasCustomSlug(false);
    }
    setIsModalOpen(true);
    setModalTab('general');
    setFocusKeyword('');
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

  // ── Undo / Redo helpers ──────────────────────────────────
  const pushUndo = (prev: string) => {
    setUndoStack(s => [...s.slice(-30), prev]);
    setRedoStack([]);
  };
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    setRedoStack(s => [...s, contentString]);
    setContentString(prev);
  };
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(s => s.slice(0, -1));
    setUndoStack(s => [...s, contentString]);
    setContentString(next);
  };
  const updateContentWithUndo = (next: string) => {
    pushUndo(contentString);
    setContentString(next);
  };

  // ── Find & Replace helper ───────────────────────────────
  const handleFindReplace = () => {
    if (!findText) return;
    const updated = contentString.split(findText).join(replaceTextVal);
    if (updated !== contentString) {
      pushUndo(contentString);
      setContentString(updated);
    }
  };

  // ── Content outline extractor ───────────────────────────
  const contentOutline = React.useMemo(() => {
    const lines = contentString.split('\n').map(l => l.trim()).filter(Boolean);
    const headingPat = /^\d{1,2}\s*[.)\-]?\s*[\p{L}\p{N}\s&/.-]{2,60}$/u;
    return lines
      .map((line, idx) => ({ line, idx, isHeading: headingPat.test(line) }))
      .filter(item => item.isHeading);
  }, [contentString]);

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setCoverImageUploadError(null);

    // Warn if file >500KB (SEO performance tip)
    if (file.size > 500 * 1024) {
      setCoverImageUploadError(copy.imageSizeWarning);
    }

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

  const pushTranslationStatus = (type: 'success' | 'error', message: string) => {
    setTranslationStatus({ type, message });
    window.setTimeout(() => {
      setTranslationStatus((current) => (current.message === message ? { type: null, message: '' } : current));
    }, 4000);
  };

  const normalizeTranslationContent = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value : (value || '').split('\n'))
      .map((part) => part.trim())
      .filter(Boolean);

  const buildNewsTranslationSource = (source: {
    title?: string;
    excerpt?: string;
    content?: string | string[];
  }) => {
    const title = (source.title || '').trim();
    const content = normalizeTranslationContent(source.content);
    const excerpt = (source.excerpt || '').trim() || content[0] || title;

    return {
      title,
      excerpt,
      content
    };
  };

  const translateDraftSource = async (source: { title: string; excerpt: string; content: string[] }) => {
    if (!canTranslateCmsContent) {
      throw new Error(translateMissingKeyMessage);
    }

    return translateNewsToChinese(source);
  };

  const handleTranslateDraft = async () => {
    if (isTranslatingDraft) return;

    const source = buildNewsTranslationSource({
      title: formData.title,
      excerpt: formData.excerpt,
      content: contentString
    });

    if (!source.title || source.content.length === 0) {
      pushTranslationStatus('error', translateDraftRequirementMessage);
      return;
    }

    if (!source.title || !source.excerpt || source.content.length === 0) {
      pushTranslationStatus(
        'error',
        locale === 'zh'
          ? '请先填写英文标题、摘要和正文，再执行翻译。'
          : 'Fill in the English title, excerpt, and content before translating.'
      );
      return;
    }

    setIsTranslatingDraft(true);
    try {
      const translated = await translateDraftSource(source);
      setFormData((prev) => ({
        ...prev,
        translations: {
          ...prev.translations,
          zh: {
            ...prev.translations?.zh,
            title: translated.title || prev.translations?.zh?.title || '',
            excerpt: translated.excerpt || prev.translations?.zh?.excerpt || ''
          }
        }
      }));
      setZhContentString((translated.content?.length ? translated.content : normalizeTranslationContent(zhContentString)).join('\n\n'));
      pushTranslationStatus('success', translateDraftSuccessMessage);
    } catch (error: any) {
      pushTranslationStatus('error', `${translateFailedPrefix}${error?.message || ''}`);
    } finally {
      setIsTranslatingDraft(false);
    }
  };

  const handleTranslateExistingItem = async (item: NewsItem) => {
    if (translatingItemId === item.id) return;

    setTranslatingItemId(item.id);
    try {
      const translated = await translateDraftSource(buildNewsTranslationSource(item));

      await updateNews({
        ...item,
        isActive: item.isActive !== false,
        translations: {
          ...item.translations,
          zh: {
            ...(item.translations?.zh || {}),
            title: translated.title || item.translations?.zh?.title || '',
            excerpt: translated.excerpt || item.translations?.zh?.excerpt || '',
            content: translated.content?.length ? translated.content : item.translations?.zh?.content || []
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
          isActive: formData.isActive !== false,
          category: (formData.category || 'Market Insight') as NewsCategory,
          date: (formData.date || '').trim(),
          excerpt: (formData.excerpt || '').trim(),
          image: (formData.image || '').trim(),
          imageAlt: (formData.imageAlt || '').trim() || undefined,
          content: paragraphs,
          scheduledAt: formData.scheduledAt || undefined,
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
    if (window.confirm(locale === 'zh' ? zh(`\u786e\u5b9a\u8981\u6c38\u4e45\u5220\u9664\u6587\u7ae0\u201c${title}\u201d\u5417\uff1f`) : `Are you sure you want to permanently delete the post: "${title}"?`)) {
      deleteNews(id);
    }
  };

  const importNewsFromCsvText = async (csvText: string, sourceLabel: string) => {
    const parsed = parseCsv(csvText);
    if (!parsed.rows.length) {
      throw new Error(locale === 'zh' ? zh('CSV \u4e2d\u6ca1\u6709\u53ef\u5bfc\u5165\u7684\u6570\u636e\u884c\u3002') : 'CSV has no data rows to import.');
    }

    const existingById = Object.fromEntries(news.map((item) => [item.id, item.slug]));
    const mapped = mapCsvRowsToNews(parsed.rows, { existingById });
    if (!mapped.items.length) {
      throw new Error(mapped.errors[0] || (locale === 'zh' ? zh('\u672a\u627e\u5230\u6709\u6548\u7684\u8d44\u8baf\u6570\u636e\u884c\u3002') : 'No valid insight rows found.'));
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
      console.warn(locale === 'zh' ? zh('\u8d44\u8baf CSV \u5df2\u8df3\u8fc7\u4ee5\u4e0b\u884c:') : 'News CSV skipped rows:', mapped.errors);
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
          ? zh(`${sourceLabel}: \u5df2\u5bfc\u5165 ${mapped.items.length} \u7bc7\u8d44\u8baf\uff08\u65b0\u589e ${createdCount} \u7bc7\uff0c\u66f4\u65b0 ${updatedCount} \u7bc7${skippedPart}\uff09\u3002`)
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
            ? zh(`\u65e0\u6cd5\u4e0b\u8f7d CSV\uff08HTTP ${response.status}\uff09\u3002\u8bf7\u68c0\u67e5 Google Sheet \u7684\u5171\u4eab\u6216\u53d1\u5e03\u8bbe\u7f6e\u3002`)
            : `Unable to download CSV (HTTP ${response.status}). Check sharing/publish settings on Google Sheet.`
        );
      }
      const csvText = await response.text();
      await importNewsFromCsvText(csvText, locale === 'zh' ? zh('Google \u8868\u683c') : 'Google Sheet');
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
      await importNewsFromCsvText(csvText, file.name || (locale === 'zh' ? zh('CSV 文件') : 'CSV file'));
    } catch (err: any) {
      setCsvImportStatus({ type: 'error', message: err?.message || copy.csvImportFailed });
    } finally {
      setIsImportingCsv(false);
    }
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

  const categories: NewsCategory[] = ['Product', 'Logistics', 'Market Insight'];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <AdminSidebar
        onLogout={handleExit}
        onOpenNewsForm={() => openModal()}
        onCloseNewsForm={closeModal}
        isNewsFormOpen={isModalOpen}
      />

      {isModalOpen ? null : (
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
                <button type="button" onClick={() => setLocale('en')} className={locale === 'en' ? 'text-foodera-forest' : ''}>
                  EN
                </button>
                <span>/</span>
                <button type="button" onClick={() => setLocale('zh')} className={locale === 'zh' ? 'text-foodera-forest' : ''}>
                  {'\u4e2d\u6587'}
                </button>
              </div>
              <button 
                onClick={() => openModal()}
                className="px-8 py-4 bg-foodera-forest text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl hover:bg-foodera-lime hover:text-foodera-forest transition-all"
              >
                <Plus size={20} /> {copy.createPost}
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

          {/* List-level tabs: All / Scheduled / Active / Inactive */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {(['all', 'scheduled'] as const).map((tab) => {
              const isActive = listTab === tab;
              const count = tab === 'scheduled' ? scheduledNews.length : allFilteredNews.length;
              const label = tab === 'all'
                ? (locale === 'zh' ? '\u5168\u90e8\u6587\u7ae0' : 'All Articles')
                : (locale === 'zh' ? '\u5df2\u8ba1\u5212\u53d1\u5e03' : 'Scheduled');
              const Icon = tab === 'scheduled' ? CalendarClock : Inbox;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setListTab(tab)}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border ${
                    isActive
                      ? 'bg-foodera-forest text-white border-foodera-forest shadow-lg shadow-foodera-forest/20'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-foodera-forest/30 hover:text-foodera-forest'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                  <span className={`ml-1 px-2 py-0.5 rounded-lg text-[9px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Separator */}
            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Active tab */}
            <button
              type="button"
              onClick={() => setListTab('active')}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border ${
                listTab === 'active'
                  ? 'bg-foodera-forest text-white border-foodera-forest shadow-lg'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-foodera-forest/30 hover:text-foodera-forest'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                listTab === 'active' ? 'bg-foodera-lime' : 'bg-green-400'
              }`} />
              Active
              <span className={`ml-1 px-2 py-0.5 rounded-lg text-[9px] font-black ${
                listTab === 'active' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {activeNews.length}
              </span>
            </button>

            {/* Inactive tab */}
            <button
              type="button"
              onClick={() => setListTab('inactive')}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border ${
                listTab === 'inactive'
                  ? 'bg-gray-700 text-white border-gray-700 shadow-lg'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              Inactive
              <span className={`ml-1 px-2 py-0.5 rounded-lg text-[9px] font-black ${
                listTab === 'inactive' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {inactiveNews.length}
              </span>
            </button>
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
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-foodera-forest/10 border-none text-sm font-medium"
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
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{statusFieldLabel}</th>
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
                      <span className="px-3 py-1 bg-foodera-forest/5 text-foodera-forest text-[9px] font-black uppercase tracking-widest rounded-lg">
                        {getNewsCategoryLabel(item.category, locale)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {item.isActive !== false ? (
                            <CheckCircle size={14} className="text-green-500" />
                          ) : (
                            <X size={14} className="text-gray-400" />
                          )}
                          <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                            {item.isActive !== false ? activeStatusLabel : inactiveStatusLabel}
                          </span>
                        </div>
                        {item.scheduledAt && new Date(item.scheduledAt).getTime() > Date.now() && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md w-fit">
                            <Clock size={10} />
                            {new Date(item.scheduledAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar size={14} className="text-foodera-lime" />
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
                          className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-foodera-forest hover:text-white transition-all shadow-sm"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleTranslateExistingItem(item)}
                          disabled={translatingItemId === item.id}
                          className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-foodera-forest hover:text-white transition-all shadow-sm disabled:opacity-50"
                          title={translateButtonLabel}
                        >
                          {translatingItemId === item.id ? <Loader2 size={18} className="animate-spin" /> : <Languages size={18} />}
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
      )}

      {/* Full-page Form */}
      {isModalOpen && (
        <main className="flex-grow flex flex-col overflow-hidden bg-white">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-foodera-forest text-white">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  {editingItem ? copy.editInsight : copy.composeInsight}
                </h2>
                <p className="text-foodera-lime/60 text-[10px] font-bold uppercase tracking-widest mt-1">{copy.modalSubtitle}</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-grow overflow-y-auto flex flex-col">
              {/* Tab Bar */}
              <div className="flex border-b border-gray-200 px-10 pt-4 gap-1 bg-gray-50/50 flex-shrink-0">
                {(['general', 'content', 'translation', 'seo'] as const).map((tab) => {
                  const tabLabels = { general: 'General', content: 'Content', translation: 'Translation', seo: 'SEO Check' };
                  const isActive = modalTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setModalTab(tab)}
                      className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest rounded-t-xl transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-white text-foodera-forest border border-gray-200 border-b-white -mb-px shadow-sm'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
                      }`}
                    >
                      {tab === 'seo' && <BarChart3 size={13} />}
                      {tabLabels[tab]}
                    </button>
                  );
                })}
              </div>

              <div className="flex-grow overflow-y-auto p-10 space-y-8">
              {/* TAB: General */}
              {modalTab === 'general' && (
              <>
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
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-medium"
                      required
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <label
                        className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          isUploadingCoverImage
                            ? 'cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400'
                            : 'cursor-pointer border-gray-200 bg-white text-foodera-forest hover:border-foodera-forest/20 hover:bg-foodera-forest/5'
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
                      <p className={`text-[10px] italic ${coverImageUploadError.startsWith('⚠') ? 'text-amber-500' : 'text-red-500'}`}>{coverImageUploadError}</p>
                    )}
                  </div>
                </div>
                {/* SEO Alt Text for Cover Image */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    {copy.imageAltLabel}
                  </label>
                  <input
                    type="text"
                    value={formData.imageAlt || ''}
                    onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                    placeholder={copy.imageAltPlaceholder}
                    maxLength={125}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-medium"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 italic font-medium">{copy.imageAltHint}</p>
                    <span className={`text-[10px] font-bold tabular-nums ${(formData.imageAlt?.length || 0) > 100 ? 'text-amber-500' : 'text-gray-300'}`}>
                      {formData.imageAlt?.length || 0}/125
                    </span>
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
                  className="w-full px-4 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-lg font-black"
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
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-bold"
                  placeholder="incoterms-explained-a-practical-guide"
                />
                <p className="text-[10px] text-gray-500 font-semibold">
                  {copy.canonicalUrlLabel}: <span className="text-foodera-forest">/news/{slugPreview}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.categoryLabel}</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as NewsCategory})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-bold cursor-pointer"
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
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-bold"
                    placeholder={copy.releaseDatePlaceholder}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{statusFieldLabel}</label>
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
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    <Clock size={10} className="inline mr-1" />
                    {locale === 'zh' ? '\u5b9a\u65f6\u53d1\u5e03' : 'Schedule Publish'}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt || ''}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value || undefined })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-bold"
                  />
                  <p className="text-[10px] text-gray-400 italic">
                    {locale === 'zh'
                      ? '\u7559\u7a7a\u8868\u793a\u7acb\u5373\u53d1\u5e03\u3002\u8bbe\u7f6e\u65f6\u95f4\u540e\u6587\u7ae0\u5c06\u5728\u6307\u5b9a\u65f6\u95f4\u81ea\u52a8\u4e0a\u7ebf\u3002'
                      : 'Leave empty to publish immediately. Set a future date to schedule.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.excerptLabel}</label>
                <textarea 
                  rows={3}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-medium resize-none"
                  placeholder={copy.excerptPlaceholder}
                  required
                />
              </div>
              </>
              )}

              {/* TAB: Content */}
              {modalTab === 'content' && (
              <>
              <div className="flex gap-4">
              {/* Outline Sidebar (collapsible) */}
              {showOutline && (
                <div className="w-56 flex-shrink-0 bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3 h-fit sticky top-0">
                  <div className="flex items-center gap-2 mb-3">
                    <ListTree size={14} className="text-foodera-forest" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-foodera-forest">Article Outline</span>
                  </div>
                  {contentOutline.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">No headings detected. Add numbered sections (e.g. "1. Overview") to build an outline.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {contentOutline.map((h, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const ta = contentTextareaRef.current;
                            if (!ta) return;
                            const lines = contentString.split('\n');
                            let charPos = 0;
                            for (let li = 0; li < lines.length && li <= h.idx; li++) {
                              if (li < h.idx) charPos += lines[li].length + 1;
                            }
                            ta.focus();
                            ta.setSelectionRange(charPos, charPos + h.line.length);
                            ta.scrollTop = (charPos / contentString.length) * ta.scrollHeight;
                          }}
                          className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-foodera-forest/5 transition-colors"
                        >
                          <CheckCircle2 size={10} className="text-green-500 flex-shrink-0" />
                          <span className="text-[10px] font-bold text-gray-700 truncate">{h.line}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-[9px] text-gray-400">
                      {contentOutline.length} section{contentOutline.length !== 1 ? 's' : ''} detected
                    </p>
                  </div>
                </div>
              )}

              <div className="flex-grow space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.fullContentLabel}</label>
                  <span className="text-[9px] font-bold text-foodera-forest bg-foodera-forest/5 px-2 py-1 rounded">{copy.fullContentHint}</span>
                </div>

                {/* ── Enhanced Rich-text Toolbar ──────────────── */}
                <div className="flex flex-wrap items-center gap-1 p-2 bg-white border border-gray-200 rounded-t-xl">
                  {/* Undo / Redo */}
                  <button type="button" title="Undo (Ctrl+Z)" onClick={handleUndo} disabled={undoStack.length === 0}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors disabled:opacity-30">
                    <Undo2 size={16} />
                  </button>
                  <button type="button" title="Redo (Ctrl+Shift+Z)" onClick={handleRedo} disabled={redoStack.length === 0}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors disabled:opacity-30">
                    <Redo2 size={16} />
                  </button>

                  <div className="w-px h-6 bg-gray-200 mx-1" />

                  {/* Bold / Italic */}
                  <button type="button" title="Bold (Ctrl+B)"
                    onClick={() => { pushUndo(contentString); wrapSelection(contentTextareaRef.current, setContentString, '**', '**', 'bold text'); }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors">
                    <Bold size={16} />
                  </button>
                  <button type="button" title="Italic (Ctrl+I)"
                    onClick={() => { pushUndo(contentString); wrapSelection(contentTextareaRef.current, setContentString, '*', '*', 'italic text'); }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors">
                    <Italic size={16} />
                  </button>

                  <div className="w-px h-6 bg-gray-200 mx-1" />

                  {/* Heading H2 */}
                  <button type="button" title="Heading (H2)"
                    onClick={() => {
                      const ta = contentTextareaRef.current;
                      if (!ta) return;
                      pushUndo(contentString);
                      const { selectionStart, value } = ta;
                      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
                      const lineEnd = value.indexOf('\n', selectionStart);
                      const end = lineEnd === -1 ? value.length : lineEnd;
                      const lineText = value.slice(lineStart, end);
                      const alreadyHeading = /^\d+\.\s/.test(lineText);
                      const before = value.slice(0, lineStart);
                      const after = value.slice(end);
                      setContentString(alreadyHeading ? before + lineText.replace(/^\d+\.\s*/, '') + after : before + '1. ' + lineText + after);
                      requestAnimationFrame(() => ta.focus());
                    }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors">
                    <Heading2 size={16} />
                  </button>
                  {/* Heading H3 (subheading) */}
                  <button type="button" title="Subheading (H3)"
                    onClick={() => { pushUndo(contentString); insertAtCursor(contentTextareaRef.current, setContentString, '1.1 Subheading'); }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors">
                    <Heading3 size={16} />
                  </button>

                  <div className="w-px h-6 bg-gray-200 mx-1" />

                  {/* Lists */}
                  <button type="button" title="Bulleted List"
                    onClick={() => { pushUndo(contentString); insertAtCursor(contentTextareaRef.current, setContentString, '• '); }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors">
                    <List size={16} />
                  </button>
                  <button type="button" title="Numbered List"
                    onClick={() => { pushUndo(contentString); insertAtCursor(contentTextareaRef.current, setContentString, '1. '); }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors">
                    <ListOrdered size={16} />
                  </button>

                  <div className="w-px h-6 bg-gray-200 mx-1" />

                  {/* Link / Image */}
                  <button type="button" title="Link (Ctrl+K)"
                    onClick={() => { pushUndo(contentString); wrapSelection(contentTextareaRef.current, setContentString, '[', '](https://)', 'link text'); }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors">
                    <LinkIcon size={16} />
                  </button>
                  <button type="button" title="Insert Image"
                    onClick={() => { pushUndo(contentString); insertAtCursor(contentTextareaRef.current, setContentString, '[[IMAGE:https://example.com/image.jpg|Alt text|Caption]]'); }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors">
                    <ImageIcon size={16} />
                  </button>

                  <div className="w-px h-6 bg-gray-200 mx-1" />

                  {/* Quote / Separator */}
                  <button type="button" title="Quote"
                    onClick={() => {
                      const ta = contentTextareaRef.current;
                      if (!ta) return;
                      pushUndo(contentString);
                      const { selectionStart, selectionEnd, value } = ta;
                      const selected = value.slice(selectionStart, selectionEnd);
                      const quoted = (selected || 'quote text').split('\n').map((l: string) => `> ${l}`).join('\n');
                      const before = value.slice(0, selectionStart);
                      const after = value.slice(selectionEnd);
                      const nl = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
                      setContentString(before + nl + quoted + after);
                      requestAnimationFrame(() => ta.focus());
                    }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors">
                    <Quote size={16} />
                  </button>
                  <button type="button" title="Separator"
                    onClick={() => { pushUndo(contentString); insertAtCursor(contentTextareaRef.current, setContentString, '\n---\n'); }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors">
                    <Minus size={16} />
                  </button>

                  <div className="w-px h-6 bg-gray-200 mx-1" />

                  {/* Table */}
                  <button type="button" title="Insert Table"
                    onClick={() => { pushUndo(contentString); insertAtCursor(contentTextareaRef.current, setContentString, '| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Data     | Data     | Data     |'); }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors">
                    <Table2 size={16} />
                  </button>
                  {/* CTA Block */}
                  <button type="button" title="Call-to-Action"
                    onClick={() => { pushUndo(contentString); insertAtCursor(contentTextareaRef.current, setContentString, '[[CTA:Contact us for a competitive quotation|/contact]]'); }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors">
                    <Megaphone size={16} />
                  </button>
                  {/* Tag */}
                  <button type="button" title="Semantic Tag"
                    onClick={() => { pushUndo(contentString); wrapSelection(contentTextareaRef.current, setContentString, '[[TAG:', ']]', 'keyword'); }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors">
                    <Tag size={16} />
                  </button>
                  {/* Anchor */}
                  <button type="button" title="Anchor Point"
                    onClick={() => { pushUndo(contentString); insertAtCursor(contentTextareaRef.current, setContentString, '[[ANCHOR:section-name]]'); }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors">
                    <Anchor size={16} />
                  </button>

                  <div className="w-px h-6 bg-gray-200 mx-1" />

                  {/* Find & Replace */}
                  <button type="button" title="Find & Replace"
                    onClick={() => setShowFindReplace(v => !v)}
                    className={`p-2 rounded-lg transition-colors ${showFindReplace ? 'bg-foodera-forest/10 text-foodera-forest' : 'text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest'}`}>
                    <FileSearch2 size={16} />
                  </button>
                  {/* Outline Toggle */}
                  <button type="button" title="Toggle Outline"
                    onClick={() => setShowOutline(v => !v)}
                    className={`p-2 rounded-lg transition-colors ${showOutline ? 'bg-foodera-forest/10 text-foodera-forest' : 'text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest'}`}>
                    <ListTree size={16} />
                  </button>
                  {/* Preview */}
                  <button type="button" title="Live Preview"
                    onClick={() => setShowPreviewModal(true)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-foodera-forest/10 hover:text-foodera-forest transition-colors">
                    <Eye size={16} />
                  </button>
                </div>

                {/* ── Find & Replace Bar ──────────────────────── */}
                {showFindReplace && (
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                    <Search size={14} className="text-amber-500 flex-shrink-0" />
                    <input type="text" value={findText} onChange={e => setFindText(e.target.value)}
                      placeholder="Find..." className="flex-grow min-w-[100px] px-2 py-1.5 bg-white rounded-lg border border-amber-200 text-xs font-medium outline-none focus:border-foodera-forest/30" />
                    <Replace size={14} className="text-amber-500 flex-shrink-0" />
                    <input type="text" value={replaceTextVal} onChange={e => setReplaceTextVal(e.target.value)}
                      placeholder="Replace with..." className="flex-grow min-w-[100px] px-2 py-1.5 bg-white rounded-lg border border-amber-200 text-xs font-medium outline-none focus:border-foodera-forest/30" />
                    <button type="button" onClick={handleFindReplace}
                      className="px-3 py-1.5 bg-foodera-forest text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-foodera-lime hover:text-foodera-forest transition-all">
                      Replace All
                    </button>
                    <button type="button" onClick={() => setShowFindReplace(false)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                )}

                <textarea
                  ref={contentTextareaRef}
                  rows={20}
                  value={contentString}
                  onChange={(e) => setContentString(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                      e.preventDefault();
                      pushUndo(contentString);
                      wrapSelection(contentTextareaRef.current, setContentString, '**', '**', 'bold text');
                    }
                    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                      e.preventDefault();
                      pushUndo(contentString);
                      wrapSelection(contentTextareaRef.current, setContentString, '*', '*', 'italic text');
                    }
                    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                      e.preventDefault();
                      pushUndo(contentString);
                      wrapSelection(contentTextareaRef.current, setContentString, '[', '](https://)', 'link text');
                    }
                    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                      e.preventDefault();
                      handleUndo();
                    }
                    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                      e.preventDefault();
                      handleRedo();
                    }
                  }}
                  className="w-full px-4 py-5 bg-gray-50 rounded-b-xl rounded-t-none border-2 border-t-0 border-gray-200 focus:border-foodera-forest/20 outline-none text-base font-medium resize-none leading-relaxed font-mono"
                  placeholder="Draft your professional analysis here..."
                  required
                />

                {/* ── Word Count Status Bar ──────────────────── */}
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-gray-400">
                      {contentString.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {contentString.length} chars
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {contentString.split('\n').filter(l => l.trim()).length} paragraphs
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      ~{Math.max(1, Math.ceil(contentString.trim().split(/\s+/).filter(Boolean).length / 220))} min read
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {undoStack.length > 0 && (
                      <span className="text-[9px] font-bold text-amber-500">{undoStack.length} undo available</span>
                    )}
                  </div>
                </div>
              </div>
              </div>
              </>
              )}

              {/* TAB: Translation */}
              {modalTab === 'translation' && (
              <>
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
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-medium"
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
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-medium resize-none"
                    placeholder="中文摘要"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.zhContentLabel}</label>
                  <span className="text-[9px] font-bold text-foodera-forest bg-foodera-forest/5 px-2 py-1 rounded">{copy.zhContentHint}</span>
                </div>
                <textarea
                  rows={12}
                  value={zhContentString}
                  onChange={(e) => setZhContentString(e.target.value)}
                  className="w-full px-4 py-5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-base font-medium resize-none leading-relaxed"
                  placeholder="中文正文内容..."
                />
              </div>
              </>
              )}

              {/* TAB: SEO Check */}
              {modalTab === 'seo' && (() => {
                const seoInput = {
                  title: (formData.title || '').trim(),
                  slug: slugPreview,
                  excerpt: (formData.excerpt || '').trim(),
                  content: contentString,
                  image: (formData.image || '').trim(),
                  focusKeyword: focusKeyword.trim(),
                  existingArticleTitles: news.filter(n => n.id !== editingItem?.id).map(n => n.title),
                };
                const report: SeoReport = analyzeSeo(seoInput, 'en');
                const { readability, contentPolicy, serpPreview } = report;

                const severityIcon = (severity: SeoSeverity) => {
                  switch (severity) {
                    case 'good': return <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />;
                    case 'warning': return <TriangleAlert size={16} className="text-amber-500 flex-shrink-0" />;
                    case 'error': return <CircleAlert size={16} className="text-red-500 flex-shrink-0" />;
                  }
                };

                const severityBg = (severity: SeoSeverity) => {
                  switch (severity) {
                    case 'good': return 'bg-green-50 border-green-100';
                    case 'warning': return 'bg-amber-50 border-amber-100';
                    case 'error': return 'bg-red-50 border-red-100';
                  }
                };

                const gradeColor = (grade: string) => {
                  switch (grade) {
                    case 'A': return 'from-green-400 to-emerald-600';
                    case 'B': return 'from-lime-400 to-green-600';
                    case 'C': return 'from-amber-400 to-yellow-600';
                    case 'D': return 'from-orange-400 to-red-500';
                    default: return 'from-red-400 to-red-700';
                  }
                };

                const goodCount = report.checks.filter(c => c.severity === 'good').length;
                const warningCount = report.checks.filter(c => c.severity === 'warning').length;
                const errorCount = report.checks.filter(c => c.severity === 'error').length;

                return (
                  <>
                  {/* Focus Keyword Input */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Target size={18} className="text-foodera-forest" />
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Focus Keyword</label>
                    </div>
                    <input
                      type="text"
                      value={focusKeyword}
                      onChange={(e) => setFocusKeyword(e.target.value)}
                      placeholder="e.g. Vietnamese rice export, Jasmine rice supplier..."
                      className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-foodera-forest/20 outline-none text-sm font-bold"
                    />
                    <p className="text-[10px] text-gray-400 italic">Enter the main keyword you want this article to rank for. Leave blank to skip keyword-related checks.</p>
                  </div>

                  {/* Score Overview Card */}
                  <div className="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradeColor(report.grade)} opacity-[0.04]`} />
                    <div className="relative p-8">
                      <div className="flex items-center justify-between gap-8">
                        {/* Score Circle */}
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative w-28 h-28">
                            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                              <circle
                                cx="50" cy="50" r="42" fill="none"
                                stroke="url(#seoGradient)" strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={`${(report.overallScore / 100) * 263.9} 263.9`}
                                className="transition-all duration-700 ease-out"
                              />
                              <defs>
                                <linearGradient id="seoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" className={report.overallScore >= 70 ? 'text-green-400' : report.overallScore >= 40 ? 'text-amber-400' : 'text-red-400'} stopColor="currentColor" />
                                  <stop offset="100%" className={report.overallScore >= 70 ? 'text-emerald-600' : report.overallScore >= 40 ? 'text-yellow-600' : 'text-red-600'} stopColor="currentColor" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-black text-gray-900 leading-none">{report.overallScore}</span>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">/ 100</span>
                            </div>
                          </div>
                          <span className={`text-xs font-black uppercase tracking-widest bg-gradient-to-r ${gradeColor(report.grade)} bg-clip-text text-transparent`}>
                            Grade {report.grade}
                          </span>
                        </div>

                        {/* Stats */}
                        <div className="flex-grow space-y-4">
                          <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-400" />
                              <span className="text-sm font-bold text-gray-700">{goodCount} Passed</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-400" />
                              <span className="text-sm font-bold text-gray-700">{warningCount} Warnings</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-400" />
                              <span className="text-sm font-bold text-gray-700">{errorCount} Issues</span>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                            {goodCount > 0 && <div className="h-full bg-green-400 transition-all duration-500" style={{ width: `${(goodCount / report.checks.length) * 100}%` }} />}
                            {warningCount > 0 && <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(warningCount / report.checks.length) * 100}%` }} />}
                            {errorCount > 0 && <div className="h-full bg-red-400 transition-all duration-500" style={{ width: `${(errorCount / report.checks.length) * 100}%` }} />}
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium">
                            {report.overallScore >= 85
                              ? 'Excellent SEO! Your article is well-optimized for search engines.'
                              : report.overallScore >= 70
                              ? 'Good SEO. A few improvements could boost your ranking.'
                              : report.overallScore >= 55
                              ? 'Moderate SEO. Review the warnings below to improve your score.'
                              : 'Needs work. Address the issues below before publishing.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Individual Check Results */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-4">
                      <ShieldCheck size={18} className="text-foodera-forest" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foodera-forest">SEO Checklist</h4>
                    </div>
                    {report.checks.map((check) => (
                      <div
                        key={check.id}
                        className={`flex items-start gap-3 p-4 rounded-2xl border transition-all hover:shadow-sm ${severityBg(check.severity)}`}
                      >
                        {severityIcon(check.severity)}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <span className="text-xs font-black text-gray-800 uppercase tracking-wider">{check.label}</span>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                              check.severity === 'good'
                                ? 'bg-green-100 text-green-700'
                                : check.severity === 'warning'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {check.score}/100
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 font-medium leading-relaxed">{check.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── SERP Preview ────────────────────────── */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-2">
                      <Globe size={18} className="text-foodera-forest" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foodera-forest">Google SERP Preview</h4>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1 shadow-sm">
                      <p className="text-[11px] text-green-700 font-medium truncate">{serpPreview.url}</p>
                      <p className="text-lg font-semibold text-blue-800 leading-snug hover:underline cursor-default">{serpPreview.title || 'Untitled Article'}</p>
                      <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-2">{serpPreview.description || 'No description provided.'}</p>
                    </div>
                  </div>

                  {/* ── Readability Gauge ───────────────────── */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-2">
                      <Gauge size={18} className="text-foodera-forest" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foodera-forest">Readability Analysis</h4>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-6 mb-4">
                        <div className="flex flex-col items-center">
                          <span className={`text-3xl font-black ${readability.level === 'easy' ? 'text-green-600' : readability.level === 'moderate' ? 'text-amber-600' : 'text-red-600'}`}>{readability.score}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">Flesch Score</span>
                        </div>
                        <div className="flex-grow">
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${readability.level === 'easy' ? 'bg-green-400' : readability.level === 'moderate' ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${readability.score}%` }} />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[9px] text-gray-400">Difficult</span>
                            <span className={`text-[9px] font-black uppercase ${readability.level === 'easy' ? 'text-green-600' : readability.level === 'moderate' ? 'text-amber-600' : 'text-red-600'}`}>{readability.level}</span>
                            <span className="text-[9px] text-gray-400">Easy</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Avg Sentence', value: `${readability.avgSentenceLength} words` },
                          { label: 'Long Sentences', value: `${readability.longSentencePercent}%` },
                          { label: 'Passive Voice', value: `${readability.passiveVoicePercent}%` },
                          { label: 'Transitions', value: `${readability.transitionWordPercent}%` },
                        ].map(stat => (
                          <div key={stat.label} className="bg-gray-50 rounded-xl p-3 text-center">
                            <span className="text-sm font-black text-gray-900 block">{stat.value}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 italic mt-3">Target: 40-60 (Professional B2B). Higher = easier to read.</p>
                    </div>
                  </div>

                  {/* ── Content Policy ──────────────────────── */}
                  {contentPolicy.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertOctagon size={18} className="text-red-500" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600">Google Content Policy</h4>
                    </div>
                    {contentPolicy.map(flag => (
                      <div key={flag.id} className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                        flag.severity === 'critical' ? 'bg-red-50 border-red-200' : flag.severity === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
                      }`}>
                        {flag.severity === 'critical' ? <CircleAlert size={16} className="text-red-500 flex-shrink-0 mt-0.5" /> : flag.severity === 'warning' ? <TriangleAlert size={16} className="text-amber-500 flex-shrink-0 mt-0.5" /> : <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-gray-800 uppercase tracking-wider">{flag.label}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${flag.severity === 'critical' ? 'bg-red-100 text-red-700' : flag.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{flag.severity}</span>
                          </div>
                          <p className="text-[11px] text-gray-600 font-medium">{flag.message}</p>
                          {flag.googlePolicyRef && (
                            <a href={flag.googlePolicyRef} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline mt-1 inline-block">View Google Policy →</a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  )}

                  {/* Tips Section */}
                  <div className="rounded-2xl bg-foodera-forest/[0.03] border border-foodera-forest/10 p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-foodera-forest" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foodera-forest">SEO Tips</span>
                    </div>
                    <ul className="space-y-2 text-[11px] text-gray-600 font-medium">
                      <li className="flex gap-2"><span className="text-foodera-forest">•</span>Write titles between 50-60 characters for optimal display in Google results.</li>
                      <li className="flex gap-2"><span className="text-foodera-forest">•</span>Meta descriptions should be 150-160 characters long.</li>
                      <li className="flex gap-2"><span className="text-foodera-forest">•</span>Include your focus keyword in title, excerpt, slug, and body naturally.</li>
                      <li className="flex gap-2"><span className="text-foodera-forest">•</span>Aim for 600-1500 words. Long-form content ranks higher for most queries.</li>
                      <li className="flex gap-2"><span className="text-foodera-forest">•</span>Add external source references to boost E-E-A-T credibility.</li>
                      <li className="flex gap-2"><span className="text-foodera-forest">•</span>Use transition words and vary sentence length for natural readability.</li>
                      <li className="flex gap-2"><span className="text-foodera-forest">•</span>Keep passive voice under 20% for engaging, action-oriented writing.</li>
                    </ul>
                  </div>
                  </>
                );
              })()}
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
                className="flex-[2] py-4 bg-foodera-forest text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-foodera-lime hover:text-foodera-forest transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <><Save size={18} /> {editingItem ? copy.updatePublication : copy.publishPortal}</>
                )}
              </button>
              </div>
            </div>
        </main>
      )}

      {/* ── Live Preview Modal ────────────────────────────── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-4xl h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Eye size={20} className="text-foodera-forest" />
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Live Preview</h3>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-10">
              <article className="max-w-3xl mx-auto">
                {/* Category + Date */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-foodera-forest/10 text-foodera-forest text-[10px] font-black uppercase tracking-widest rounded-full">
                    {formData.category || 'Market Insight'}
                  </span>
                  <span className="text-xs font-bold text-gray-400">{formData.date}</span>
                </div>
                {/* Title */}
                <h1 className="text-4xl font-[900] text-gray-900 mb-6 leading-tight tracking-tight">
                  {formData.title || 'Untitled Article'}
                </h1>
                {/* Excerpt */}
                {formData.excerpt && (
                  <p className="text-xl text-gray-600 leading-relaxed mb-8 font-medium">
                    {formData.excerpt}
                  </p>
                )}
                {/* Featured Image */}
                {formData.image && (
                  <figure className="w-full overflow-hidden rounded-2xl mb-10 border border-gray-100">
                    <img src={formData.image} alt={formData.title} className="w-full h-[300px] object-cover" />
                  </figure>
                )}
                {/* Content */}
                <div className="prose prose-lg max-w-none">
                  {(() => {
                    const lines = contentString.split('\n').filter(l => l.trim());
                    const rendered: React.ReactNode[] = [];
                    let i = 0;
                    while (i < lines.length) {
                      const trimmed = lines[i].trim();

                      // ── Table (multi-line: detect pipe-delimited rows) ──
                      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                        const tableLines: string[] = [];
                        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
                          tableLines.push(lines[i].trim());
                          i++;
                        }
                        // Parse header + separator + body
                        const rows = tableLines
                          .filter(r => !/^\|[\s\-:|]+\|$/.test(r)) // skip separator
                          .map(r => r.split('|').slice(1, -1).map(c => c.trim()));
                        if (rows.length > 0) {
                          const [header, ...body] = rows;
                          rendered.push(
                            <div key={`table-${i}`} className="my-6 overflow-x-auto rounded-2xl border border-gray-200">
                              <table className="w-full text-sm">
                                <thead className="bg-foodera-forest/5">
                                  <tr>
                                    {header.map((h, hi) => (
                                      <th key={hi} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-foodera-forest border-b border-gray-200">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {body.map((row, ri) => (
                                    <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      {row.map((cell, ci) => (
                                        <td key={ci} className="px-4 py-3 text-gray-700 border-b border-gray-100">{cell}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                          continue;
                        }
                      }

                      // ── Heading pattern ──
                      if (/^\d{1,2}\s*[.)\-]?\s*[\p{L}\p{N}\s&/.-]{2,60}$/u.test(trimmed)) {
                        rendered.push(
                          <div key={i} className="mt-10 mb-4">
                            <div className="w-10 h-1 bg-foodera-lime rounded-full mb-3" />
                            <h2 className="text-2xl font-black text-gray-900">{trimmed}</h2>
                          </div>
                        );
                        i++;
                        continue;
                      }

                      // ── HR ──
                      if (trimmed === '---') {
                        rendered.push(<hr key={i} className="my-8 border-gray-200" />);
                        i++;
                        continue;
                      }

                      // ── Quote ──
                      if (trimmed.startsWith('> ')) {
                        rendered.push(<blockquote key={i} className="border-l-4 border-foodera-forest pl-4 py-2 my-4 italic text-gray-600">{trimmed.slice(2)}</blockquote>);
                        i++;
                        continue;
                      }

                      // ── Bullet ──
                      if (trimmed.startsWith('• ')) {
                        rendered.push(<div key={i} className="flex gap-2 mb-2 text-gray-700"><span className="text-foodera-forest">•</span><span>{trimmed.slice(2)}</span></div>);
                        i++;
                        continue;
                      }

                      // ── CTA Block: [[CTA:text|link]] ──
                      const ctaMatch = trimmed.match(/\[\[CTA:(.*?)\|(.*?)\]\]/i);
                      if (ctaMatch) {
                        rendered.push(
                          <div key={i} className="my-8 rounded-2xl bg-gradient-to-r from-foodera-forest to-foodera-forest/80 p-8 text-center">
                            <p className="text-white text-lg font-bold mb-4">{ctaMatch[1].trim()}</p>
                            <span className="inline-flex items-center gap-2 px-6 py-3 bg-foodera-lime text-foodera-forest rounded-xl font-black text-sm uppercase tracking-widest">
                              <Megaphone size={16} /> {ctaMatch[2].trim() === '/contact' ? 'Contact Us' : ctaMatch[2].trim()}
                            </span>
                          </div>
                        );
                        i++;
                        continue;
                      }

                      // ── TAG: [[TAG:keyword]] ──
                      const tagMatch = trimmed.match(/\[\[TAG:(.*?)\]\]/i);
                      if (tagMatch) {
                        rendered.push(
                          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foodera-forest/10 text-foodera-forest rounded-full text-xs font-black uppercase tracking-wider my-2 mr-2">
                            <Tag size={12} />{tagMatch[1].trim()}
                          </span>
                        );
                        i++;
                        continue;
                      }

                      // ── ANCHOR: [[ANCHOR:name]] ──
                      const anchorMatch = trimmed.match(/\[\[ANCHOR:(.*?)\]\]/i);
                      if (anchorMatch) {
                        rendered.push(
                          <div key={i} id={anchorMatch[1].trim()} className="flex items-center gap-2 my-2 text-gray-300">
                            <Anchor size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">⚓ {anchorMatch[1].trim()}</span>
                          </div>
                        );
                        i++;
                        continue;
                      }

                      // ── Image marker ──
                      const imgMatch = trimmed.match(/\[\[IMAGE:(.*?)\]\]/i);
                      if (imgMatch) {
                        const parts = imgMatch[1].split('|').map(p => p.trim());
                        rendered.push(
                          <figure key={i} className="my-8 rounded-2xl overflow-hidden border border-gray-100">
                            <img src={parts[0]} alt={parts[1] || ''} className="w-full h-auto object-cover" />
                            {parts[2] && <figcaption className="px-4 py-2 text-xs text-gray-500 text-center border-t border-gray-100">{parts[2]}</figcaption>}
                          </figure>
                        );
                        i++;
                        continue;
                      }

                      // ── Regular paragraph (with bold, italic, links) ──
                      let text = trimmed;
                      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
                      text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">$1</a>');
                      rendered.push(<p key={i} className="text-lg text-gray-700 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: text }} />);
                      i++;
                    }
                    return rendered;
                  })()}
                </div>
              </article>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNews;
