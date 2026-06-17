
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { NewsItem, NewsCategory, NewsRelatedProduct, NewsRelatedProductLinkType } from '../../types';
import { buildUniqueNewsSlug, getNewsPath, normalizeNewsSlug } from '../../lib/newsSeo';
import { googleSheetToCsvUrl, mapCsvRowsToNews, parseCsv } from '../../lib/csvImport';
import { CMS_IMAGE_INPUT_ACCEPT, uploadCmsImage } from '../../lib/storageUploads';
import { formatDisplayDate, getNewsCategoryLabel, localizeNewsItem } from '../../lib/contentLocalization';
import { appRoutes } from '../../lib/routes';
import { preserveVietnamesePlaceNamesDeep } from '../../lib/preserveVietnamesePlaceNames';
import { repairMojibakeDeep, repairMojibakeText } from '../../lib/repairMojibake';
import { canTranslateCmsContent, translateNewsToChinese } from '../../lib/zhTranslation';
import { analyzeSeo, SeoReport, SeoSeverity, type ContentPolicyFlag, type ReadabilityResult, type SerpPreviewData } from '../../lib/seoAnalyzer';
import { getDynamicCategories, normalizeProductCategorySlug } from '../../lib/productCategories';
import RichTextEditor from '../../components/RichTextEditor';
import { NewsPreviewModal } from './news/NewsPreviewModal';
import { SeoFieldsPanel } from './news/SeoFieldsPanel';
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
  CalendarClock,
  Inbox,
  Megaphone,
  Tag,
  Anchor,
  Globe,
  AlertOctagon,
  BookOpen,
  Gauge,
  ListTree,
  Info,
} from 'lucide-react';
import { AdminSidebar } from '../../components/AdminSidebar';

type ListViewTab = 'all' | 'scheduled' | 'active' | 'inactive';

// ── HTML → SEO-aware plain text (giữ cấu trúc heading, paragraph, link) ─
// Dùng cho SEO Analyzer — KHÔNG dùng doc.body.textContent vì sẽ mất cấu trúc
const htmlToSeoText = (html: string): string => {
  if (!html) return '';

  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Convert links → "text (href)" để SEO analyzer detect được internal/external link
    doc.querySelectorAll('a[href]').forEach((a) => {
      const text = a.textContent?.trim() || 'link';
      const href = a.getAttribute('href') || '';
      a.replaceWith(`${text} (${href})`);
    });

    // Add line breaks around block elements để paragraph/heading check hoạt động đúng
    doc.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,div,tr').forEach((el) => {
      el.insertAdjacentText('beforebegin', '\n');
      el.insertAdjacentText('afterend', '\n');
    });

    return (doc.body.textContent || '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  } catch {
    // Fallback regex khi DOMParser không khả dụng
    return html
      .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '$2 ($1)')
      .replace(/<\/(h1|h2|h3|h4|h5|h6|p|li|blockquote|div|tr)>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }
};

// Legacy alias — vẫn giữ cho các chỗ dùng khi lưu content[] (paragraph split)
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  } catch {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
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

  const { news, activeProducts, addNews, updateNews, deleteNews } = useData();
  const { logout } = useAuth();
    const rawCopy =
    locale === 'vi'
      ? {
          exitHome: 'Quay lại Trang chủ',
          portalTitle: 'Trung tâm Tin tức & SEO',
          createPost: 'Viết bài mới',
          importFromSheet: 'Nhập CSV từ Google Sheets',
          importLink: 'Liên kết nhập dữ liệu',
          importing: 'Đang nhập...',
          uploadCsv: 'Tải lên CSV',
          searchPlaceholder: 'Tìm bài viết theo tiêu đề hoặc danh mục...',
          editInsight: 'Chỉnh sửa bài viết',
          composeInsight: 'Soạn thảo bài viết mới',
          translationSection: 'Bản dịch Tiếng Trung',
          translationNote: 'Các trường tiếng Trung tùy chọn cho xuất bản đa ngôn ngữ.',
          discardDraft: 'Hủy bản nháp',
          updatePublication: 'Cập nhật xuất bản',
          publishPortal: 'Xuất bản lên Trang web',
          manageDesc: 'Quản lý tin tức doanh nghiệp và báo cáo phân tích thị trường toàn cầu.',
          articleIntel: 'Thông tin bài viết',
          category: 'Danh mục',
          publishDate: 'Ngày xuất bản',
          actions: 'Thao tác',
          noMatches: 'Không tìm thấy bài viết phù hợp',
          cmsLanguage: 'Ngôn ngữ CMS',
          imageUploadFailed: 'Tải ảnh lên thất bại.',
          saveFailed: 'Không thể lưu bài viết này. Vui lòng kiểm tra quyền truy cập API hoặc cơ sở dữ liệu Turso.',
          csvLinkRequired: 'Vui lòng nhập liên kết Google Sheets trước.',
          csvImportFailed: 'Nhập CSV thất bại.',
          supportedColumns: 'Các cột tin tức được hỗ trợ: id, title, slug, category, date, excerpt, content (hoặc content_1/content_2...), image.',
          slugLabel: 'Đường dẫn thân thiện (Slug)',
          modalSubtitle: 'Trung tâm Truyền thông & Phân tích Thị trường',
          coverImageLabel: 'Ảnh bìa nổi bật (URL hoặc tải lên)',
          coverUrlPlaceholder: 'Nhập link ảnh từ Unsplash hoặc link trực tiếp...',
          uploadingImage: 'Đang tải ảnh lên...',
          uploadFromComputer: 'Tải lên từ máy tính',
          resolutionHint: 'Độ phân giải khuyến nghị: 1200x800px, hiển thị tốt trên màn hình độ nét cao.',
          headlineLabel: 'Tiêu đề bài viết',
          headlinePlaceholder: 'Ví dụ: Phân tích tính ổn định của xuất khẩu gạo Q4...',
          seoSlugLabel: 'SEO Slug (Tùy chọn)',
          canonicalUrlLabel: 'Canonical URL',
          categoryLabel: 'Danh mục tin tức',
          releaseDateLabel: 'Ngày phát hành',
          releaseDatePlaceholder: '15 Tháng 2, 2024',
          excerptLabel: 'Tóm tắt bài viết (Mô tả ngắn)',
          excerptPlaceholder: 'Giới thiệu ngắn hiển thị trên lưới tin tức...',
          zhHeadlineLabel: 'Tiêu đề tiếng Trung',
          zhExcerptLabel: 'Tóm tắt tiếng Trung',
          fullContentLabel: 'Nội dung chi tiết bài viết',
          fullContentHint: 'Xuống dòng để tạo đoạn văn mới',
          zhContentLabel: 'Nội dung tiếng Trung',
          zhContentHint: 'Xuống dòng để tạo đoạn văn tiếng Trung mới',
          saveFailedPrefix: 'Lưu thất bại: ',
          imageAltLabel: 'Alt Text ảnh bìa (SEO)',
          imageAltPlaceholder: 'Ví dụ: Bao bì gạo lài xuất khẩu Việt Nam - FoodEra',
          imageAltHint: 'Chứa từ khóa chính. Tối đa 125 ký tự. Để trống sẽ tự động lấy tiêu đề bài viết.',
          imageSizeWarning: '⚠ Kích thước ảnh vượt quá 500KB - Khuyến nghị nén ảnh trước khi tải lên để trang web tải nhanh hơn.'
        }
      : locale === 'zh'
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
  const activeStatusLabel = locale === 'vi' ? 'Hoạt động' : locale === 'zh' ? zh('\u542f\u7528') : 'Active';
  const inactiveStatusLabel = locale === 'vi' ? 'Ngừng hoạt động' : locale === 'zh' ? zh('\u505c\u7528') : 'Inactive';
  const statusFieldLabel = locale === 'vi' ? 'Trạng thái' : locale === 'zh' ? zh('\u72b6\u6001') : 'Status';
  const statusHelpText =
    locale === 'vi'
      ? 'Bài viết ngừng hoạt động sẽ không hiển thị trên website công cộng.'
      : locale === 'zh'
      ? zh('\u505c\u7528\u540e\uff0c\u8be5\u6587\u7ae0\u5c06\u4e0d\u518d\u5728\u516c\u5f00\u7f51\u7ad9\u4e0a\u663e\u793a\u3002')
      : 'Inactive articles are hidden from the public website.';
  const translateButtonLabel = locale === 'vi' ? 'Dịch sang tiếng Trung' : locale === 'zh' ? zh('\u7ffb\u8bd1\u6210\u4e2d\u6587') : 'Translate to Chinese';
  const translatingButtonLabel = locale === 'vi' ? 'Đang dịch...' : locale === 'zh' ? zh('\u7ffb\u8bd1\u4e2d...') : 'Translating...';
  const translateMissingKeyMessage =
    locale === 'vi'
      ? 'Dịch vụ dịch thuật Ollama chưa sẵn sàng. Hãy kiểm tra cài đặt.'
      : locale === 'zh'
      ? zh('Ollama \u7ffb\u8bd1\u672a\u5c31\u7eea\uff0c\u8bf7\u68c0\u67e5 VITE_OLLAMA_BASE_URL\u3001VITE_OLLAMA_MODEL \u6216\u672c\u5730 Ollama \u670d\u52a1\u3002')
      : 'Ollama translation is unavailable. Check VITE_OLLAMA_BASE_URL, VITE_OLLAMA_MODEL, or the local Ollama service.';
  const translateSuccessMessage =
    locale === 'vi' ? 'Đã dịch sang tiếng Trung và lưu lại.' : locale === 'zh' ? zh('\u5df2\u751f\u6210\u4e2d\u6587\u7ffb\u8bd1\u5e76\u4fdd\u5b58\u3002') : 'Chinese translation generated and saved.';
  const translateDraftSuccessMessage =
    locale === 'vi' ? 'Đã điền bản nháp tiếng Trung.' : locale === 'zh' ? zh('\u5df2\u586b\u5145\u4e2d\u6587\u7ffb\u8bd1\u8349\u7a3f\u3002') : 'Chinese translation draft populated.';
  const translateFailedPrefix = locale === 'vi' ? 'Dịch thất bại: ' : locale === 'zh' ? zh('\u7ffb\u8bd1\u5931\u8d25\uff1a') : 'Translation failed: ';
  const translateDraftRequirementMessage =
    locale === 'vi'
      ? 'Cần điền tiêu đề và nội dung tiếng Anh trước khi dịch.'
      : locale === 'zh'
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
  const [modalTab, setModalTab] = useState<'general' | 'content' | 'translation' | 'seo' | 'links'>('general');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [contentImageUploadError, setContentImageUploadError] = useState<string | null>(null);

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

  // Related products picker state
  const [rpPickerType, setRpPickerType] = useState<NewsRelatedProductLinkType>('product');
  const [rpPickerSearch, setRpPickerSearch] = useState('');
  const [rpPickerCategory, setRpPickerCategory] = useState<string>('Rice');
  const [rpPickerLabel, setRpPickerLabel] = useState('');

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
      setContentString(item.contentHtml || item.content.join('\n\n'));
      setZhContentString(preserveVietnamesePlaceNamesDeep(item.translations?.zh?.content || []).join('\n\n'));
      setHasCustomSlug(!!item.slug?.trim());
      // Restore SEO fields when editing existing item
      setFocusKeyword(item.focusKeyword || '');
      setSecondaryKeywords(Array.isArray(item.secondaryKeywords) ? item.secondaryKeywords : []);
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
    // focusKeyword đã được set trong block if/else phía trên — KHÔNG reset ở đây
    // secondaryKeywords cũng đã được set — KHÔNG reset ở đây
    setRpPickerType('product');
    setRpPickerSearch('');
    setRpPickerCategory('Rice');
    setRpPickerLabel('');
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

    // Extract plain text from HTML for legacy content[] field (SEO, translation fallback)
    const plainText = stripHtmlTags(contentString);
    const paragraphs = plainText.split('\n').filter(p => p.trim() !== '');
    const zhParagraphs = zhContentString.split('\n').filter(p => p.trim() !== '');

    setTimeout(async () => {
      let isSuccess = false;
      try {
        const title = (formData.title || '').trim();
        const slugPool = news.map((item) => item.slug);
        const requestedSlug = (formData.slug || '').trim();
        const finalSlug = buildUniqueNewsSlug(requestedSlug || title, slugPool, editingItem?.slug);

        // Determine if contentString is HTML (from Tiptap) or legacy plain text
        const isHtmlContent = contentString.trim().startsWith('<');

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
          // Keep content[] for backward compat with old rendering & translation pipeline
          content: paragraphs.length > 0 ? paragraphs : (formData.content || []),
          // Store HTML from Tiptap editor
          contentHtml: isHtmlContent ? contentString : undefined,
          // SEO fields
          seoTitle: (formData.seoTitle || '').trim() || undefined,
          metaDescription: (formData.metaDescription || '').trim() || undefined,
          focusKeyword: focusKeyword.trim() || undefined,
          secondaryKeywords: secondaryKeywords.length > 0 ? secondaryKeywords : undefined,
          scheduledAt: formData.scheduledAt || undefined,
          relatedProducts: (formData.relatedProducts ?? []).length > 0
            ? formData.relatedProducts
            : undefined,
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
                <button type="button" onClick={() => setLocale('vi')} className={locale === 'vi' ? 'text-foodera-forest' : ''}>
                  VIE
                </button>
                <span>/</span>
                <button type="button" onClick={() => setLocale('en')} className={locale === 'en' ? 'text-foodera-forest' : ''}>
                  EN
                </button>
                <span>/</span>
                <button type="button" onClick={() => setLocale('zh')} className={locale === 'zh' ? 'text-foodera-forest' : ''}>
                  CN
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
                {(['general', 'content', 'translation', 'seo', 'links'] as const).map((tab) => {
                  const tabLabels = { general: 'General', content: 'Content', translation: 'Translation', seo: 'SEO Check', links: 'Liên kết SP' };
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
                      {tab === 'links' && (
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black ${
                          (formData.relatedProducts?.length ?? 0) > 0
                            ? 'bg-foodera-forest text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          {formData.relatedProducts?.length ?? 0}
                        </span>
                      )}
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
              <div className="space-y-4">
                {/* Header row */}
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{copy.fullContentLabel}</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title="Xem trước bài viết"
                      onClick={() => setShowPreviewModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foodera-forest/5 hover:bg-foodera-forest text-foodera-forest hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Eye size={12} />
                      Xem trước
                    </button>
                  </div>
                </div>

                {/* Image upload error */}
                {contentImageUploadError && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
                    <AlertCircle size={14} />
                    <span>{contentImageUploadError}</span>
                    <button type="button" onClick={() => setContentImageUploadError(null)} className="ml-auto text-red-400 hover:text-red-600">
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Rich Text Editor */}
                <RichTextEditor
                  value={contentString}
                  onChange={setContentString}
                  placeholder="Soạn nội dung bài viết SEO của bạn tại đây... Dùng thanh công cụ để thêm tiêu đề H1-H3, in đậm, danh sách, bảng, hình ảnh, liên kết nội bộ..."
                  articleSlug={editingItem?.slug || formData.slug || formData.title || 'article'}
                  onImageUploadError={(msg) => setContentImageUploadError(msg)}
                />
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


              {/* TAB: Liên kết sản phẩm */}
              {modalTab === 'links' && (() => {
                const currentLinks: NewsRelatedProduct[] = formData.relatedProducts ?? [];

                const addLink = (entry: NewsRelatedProduct) => {
                  if (currentLinks.length >= 6) return;
                  // Avoid duplicates
                  const isDuplicate = currentLinks.some(rp =>
                    rp.type === entry.type &&
                    rp.productId === entry.productId &&
                    rp.category === entry.category
                  );
                  if (isDuplicate) return;
                  setFormData(prev => ({ ...prev, relatedProducts: [...currentLinks, entry] }));
                  setRpPickerSearch('');
                  setRpPickerLabel('');
                };

                const removeLink = (idx: number) => {
                  setFormData(prev => ({
                    ...prev,
                    relatedProducts: currentLinks.filter((_, i) => i !== idx)
                  }));
                };

                const moveLink = (idx: number, dir: -1 | 1) => {
                  const arr = [...currentLinks];
                  const swapIdx = idx + dir;
                  if (swapIdx < 0 || swapIdx >= arr.length) return;
                  [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
                  setFormData(prev => ({ ...prev, relatedProducts: arr }));
                };

                const filteredProducts = activeProducts.filter(p =>
                  rpPickerSearch.trim() === '' ||
                  p.name.toLowerCase().includes(rpPickerSearch.toLowerCase()) ||
                  p.id.toLowerCase().includes(rpPickerSearch.toLowerCase())
                ).slice(0, 8);

                return (
                  <>
                    {/* Header */}
                    <div className="rounded-2xl border border-foodera-forest/10 bg-foodera-forest/5 p-5 flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-foodera-forest flex items-center justify-center">
                        <LinkIcon size={18} className="text-foodera-lime" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">Liên kết nội bộ — Sản phẩm</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          Gắn link đến trang sản phẩm để tăng internal linking SEO. Hiển thị trong sidebar bài viết. Tối đa 6 mục.
                        </p>
                      </div>
                    </div>

                    {/* Picker */}
                    {currentLinks.length < 6 && (
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thêm liên kết mới</p>

                        {/* Type selector */}
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setRpPickerType('product')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                              rpPickerType === 'product'
                                ? 'bg-foodera-forest text-white border-foodera-forest shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-foodera-forest/30'
                            }`}
                          >
                            Sản phẩm cụ thể
                          </button>
                          <button
                            type="button"
                            onClick={() => setRpPickerType('category')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                              rpPickerType === 'category'
                                ? 'bg-foodera-forest text-white border-foodera-forest shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-foodera-forest/30'
                            }`}
                          >
                            Danh mục sản phẩm
                          </button>
                        </div>

                        {rpPickerType === 'product' ? (
                          <div className="space-y-3">
                            {/* Search box */}
                            <div className="relative">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                value={rpPickerSearch}
                                onChange={e => setRpPickerSearch(e.target.value)}
                                placeholder="Tìm sản phẩm theo tên..."
                                className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-foodera-forest/30"
                              />
                            </div>
                            {/* Product list */}
                            <div className="space-y-2 max-h-52 overflow-y-auto">
                              {filteredProducts.length === 0 && (
                                <p className="text-xs text-gray-400 font-medium text-center py-4">Không tìm thấy sản phẩm</p>
                              )}
                              {filteredProducts.map(product => {
                                const alreadyAdded = currentLinks.some(rp => rp.type === 'product' && rp.productId === product.id);
                                return (
                                  <div key={product.id} className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-gray-100 hover:border-foodera-forest/20 transition-colors">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-gray-800 line-clamp-1">{product.name}</p>
                                      <p className="text-[10px] text-gray-400 font-medium">{product.category} • {product.subCategory}</p>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={alreadyAdded}
                                      onClick={() => addLink({
                                        type: 'product',
                                        productId: product.id,
                                        label: rpPickerLabel.trim() || undefined
                                      })}
                                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                        alreadyAdded
                                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                          : 'bg-foodera-forest text-white hover:bg-foodera-lime hover:text-foodera-forest'
                                      }`}
                                    >
                                      {alreadyAdded ? '✓ Đã thêm' : '+ Thêm'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              {getDynamicCategories().map(cat => {
                                const alreadyAdded = currentLinks.some(rp => rp.type === 'category' && rp.category === cat);
                                return (
                                  <button
                                    key={cat}
                                    type="button"
                                    disabled={alreadyAdded}
                                    onClick={() => addLink({
                                      type: 'category',
                                      category: cat,
                                      label: rpPickerLabel.trim() || undefined
                                    })}
                                    className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                      alreadyAdded
                                        ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                                        : 'bg-white text-foodera-forest border-foodera-forest/20 hover:bg-foodera-forest hover:text-white hover:border-foodera-forest'
                                    }`}
                                  >
                                    {alreadyAdded ? `✓ ${cat}` : cat}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Custom label */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Label tùy chỉnh (tùy chọn)</label>
                          <input
                            type="text"
                            value={rpPickerLabel}
                            onChange={e => setRpPickerLabel(e.target.value)}
                            placeholder="Để trống để dùng tên sản phẩm / danh mục mặc định"
                            className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-foodera-forest/30"
                          />
                          <p className="text-[10px] text-gray-400 italic">Ví dụ: "Xem các loại gạo xuất khẩu" thay vì tên mặc định</p>
                        </div>
                      </div>
                    )}

                    {/* Current list */}
                    {currentLinks.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Đã chọn ({currentLinks.length}/6)
                        </p>
                        <div className="space-y-2">
                          {currentLinks.map((rp, idx) => {
                            const linkedProduct = rp.type === 'product'
                              ? activeProducts.find(p => p.id === rp.productId)
                              : null;
                            const displayLabel = rp.label ||
                              (rp.type === 'product'
                                ? (linkedProduct?.name ?? rp.productId ?? '')
                                : (rp.category ?? ''));
                            const targetUrl = rp.type === 'product'
                              ? appRoutes.productById(rp.productId!)
                              : appRoutes.productsByCategory(normalizeProductCategorySlug(rp.category ?? ''));

                            return (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                                {/* Thumbnail */}
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100">
                                  {linkedProduct?.image ? (
                                    <img src={linkedProduct.image} alt={displayLabel} className="w-full h-full object-cover" loading="lazy" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Globe size={16} className="text-gray-300" />
                                    </div>
                                  )}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black text-gray-800 leading-snug line-clamp-1">{displayLabel}</p>
                                  <p className="text-[9px] text-foodera-forest font-medium mt-0.5 truncate">{targetUrl}</p>
                                </div>
                                {/* Badge */}
                                <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                  rp.type === 'product'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {rp.type === 'product' ? 'SP' : 'DM'}
                                </span>
                                {/* Move up/down */}
                                <div className="flex flex-col gap-0.5 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => moveLink(idx, -1)}
                                    disabled={idx === 0}
                                    className="w-6 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                                  >
                                    <ChevronLeft size={12} className="rotate-90" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveLink(idx, 1)}
                                    disabled={idx === currentLinks.length - 1}
                                    className="w-6 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                                  >
                                    <ChevronLeft size={12} className="-rotate-90" />
                                  </button>
                                </div>
                                {/* Remove */}
                                <button
                                  type="button"
                                  onClick={() => removeLink(idx)}
                                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {currentLinks.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <LinkIcon size={32} className="mx-auto mb-3 text-gray-200" />
                        <p className="text-sm font-bold">Chưa có liên kết sản phẩm nào</p>
                        <p className="text-xs font-medium mt-1">Thêm liên kết phía trên để bài viết hiển thị mục Related Products trong sidebar</p>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* TAB: SEO Check */}
              {modalTab === 'seo' && (() => {
                // htmlToSeoText giữ nguyên heading, paragraph, link → SEO Analyzer chấm đúng
                const plainContent = htmlToSeoText(contentString);
                const seoInput = {
                  title: (formData.title || '').trim(),
                  slug: slugPreview,
                  // Ưu tiên metaDescription do user nhập, fallback về excerpt
                  excerpt: ((formData.metaDescription || formData.excerpt) || '').trim(),
                  content: plainContent,
                  image: (formData.image || '').trim(),
                  focusKeyword: focusKeyword.trim(),
                  secondaryKeywords: secondaryKeywords,
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
                  {/* SEO Fields Panel */}
                  <SeoFieldsPanel
                    seoTitle={formData.seoTitle || ''}
                    metaDescription={formData.metaDescription || ''}
                    focusKeyword={focusKeyword}
                    secondaryKeywords={secondaryKeywords}
                    slug={slugPreview}
                    imageAlt={formData.imageAlt || ''}
                    title={formData.title || ''}
                    excerpt={formData.excerpt || ''}
                    onSeoTitleChange={(v) => setFormData(prev => ({ ...prev, seoTitle: v }))}
                    onMetaDescriptionChange={(v) => setFormData(prev => ({ ...prev, metaDescription: v }))}
                    onFocusKeywordChange={setFocusKeyword}
                    onSecondaryKeywordsChange={setSecondaryKeywords}
                    onImageAltChange={(v) => setFormData(prev => ({ ...prev, imageAlt: v }))}
                  />

                  <div className="border-t border-gray-100 pt-6">
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
                  </div>{/* end border-t wrapper */}
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
        <NewsPreviewModal
          formData={formData}
          contentHtml={contentString}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
};

export default AdminNews;
