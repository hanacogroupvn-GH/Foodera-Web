import React from 'react';
import { X, Eye, Monitor, Smartphone, Clock, CalendarDays } from 'lucide-react';
import { NewsItem, NewsCategory } from '../../../types';
import { getNewsCategoryLabel } from '../../../lib/contentLocalization';

interface NewsPreviewModalProps {
  formData: Partial<NewsItem>;
  contentHtml: string;
  onClose: () => void;
}

const estimateReadTime = (html: string): number => {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const text = doc.body.textContent || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 220));
  } catch {
    return 1;
  }
};

const formatPreviewDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const NewsPreviewModal: React.FC<NewsPreviewModalProps> = ({
  formData,
  contentHtml,
  onClose,
}) => {
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile'>('desktop');
  const readTime = React.useMemo(() => estimateReadTime(contentHtml), [contentHtml]);
  const title = formData.title || 'Tiêu đề bài viết';
  const excerpt = formData.excerpt || '';
  const image = formData.image || '';
  const category = (formData.category || 'Market Insight') as NewsCategory;
  const dateDisplay = formatPreviewDate(formData.date);

  // Prose classes matching NewsDetail.tsx exactly
  const proseClasses = [
    'prose prose-lg max-w-none',
    'prose-h2:text-2xl prose-h2:font-black prose-h2:text-gray-900 prose-h2:mt-10 prose-h2:mb-4',
    'prose-h3:text-xl prose-h3:font-bold prose-h3:text-gray-800 prose-h3:mt-7 prose-h3:mb-3',
    'prose-p:text-lg prose-p:text-gray-700 prose-p:leading-[1.85] prose-p:font-medium prose-p:mb-5',
    'prose-ul:pl-6 prose-ul:mb-4 prose-li:text-base prose-li:text-gray-700 prose-li:font-medium prose-li:mb-2',
    'prose-ol:pl-6 prose-ol:mb-4',
    'prose-blockquote:border-l-4 prose-blockquote:border-foodera-forest prose-blockquote:pl-5 prose-blockquote:py-2 prose-blockquote:my-6 prose-blockquote:italic prose-blockquote:text-gray-600',
    'prose-a:text-foodera-forest prose-a:underline prose-a:hover:text-foodera-lime prose-a:transition-colors',
    'prose-strong:font-black prose-strong:text-gray-900',
    'prose-table:w-full prose-table:border-collapse',
    'prose-th:bg-foodera-forest/5 prose-th:px-4 prose-th:py-3 prose-th:border prose-th:border-gray-200 prose-th:text-left prose-th:font-black prose-th:text-xs prose-th:uppercase prose-th:tracking-wider prose-th:text-foodera-forest',
    'prose-td:px-4 prose-td:py-3 prose-td:border prose-td:border-gray-200 prose-td:text-gray-700 prose-td:font-medium',
    'prose-img:rounded-2xl prose-img:my-8 prose-img:border prose-img:border-gray-100',
    'prose-hr:border-gray-200 prose-hr:my-10',
    // CTA block styling for preview
    '[&_.cta-block]:my-8 [&_.cta-block]:rounded-2xl [&_.cta-block]:p-8 [&_.cta-block]:text-center [&_.cta-block]:bg-gradient-to-r [&_.cta-block]:from-foodera-forest [&_.cta-block]:to-foodera-forest/80',
    '[&_.cta-link]:inline-flex [&_.cta-link]:items-center [&_.cta-link]:gap-2 [&_.cta-link]:px-6 [&_.cta-link]:py-3 [&_.cta-link]:bg-foodera-lime [&_.cta-link]:text-foodera-forest [&_.cta-link]:rounded-xl [&_.cta-link]:font-black [&_.cta-link]:text-sm [&_.cta-link]:uppercase [&_.cta-link]:tracking-widest [&_.cta-link]:no-underline',
  ].join(' ');

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foodera-forest/10 rounded-xl flex items-center justify-center">
              <Eye size={16} className="text-foodera-forest" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">Xem trước bài viết</p>
              <p className="text-[10px] text-gray-400 font-medium">Hiển thị như ngoài website</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'desktop' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Monitor size={13} /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Smartphone size={13} /> Mobile
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <div
            className={`bg-white rounded-2xl shadow-md mx-auto transition-all ${
              viewMode === 'mobile' ? 'max-w-sm' : 'max-w-4xl'
            }`}
          >
            {/* Article header */}
            <div className="p-8 pb-0">
              {/* Category + meta */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="px-3 py-1 bg-foodera-forest/10 text-foodera-forest text-[10px] font-black uppercase tracking-widest rounded-full">
                  {getNewsCategoryLabel(category, 'en')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400">
                  <Clock size={12} />
                  {readTime} Min Read
                </span>
                {dateDisplay && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400">
                    <CalendarDays size={12} />
                    {dateDisplay}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-[900] text-gray-900 leading-tight tracking-tight mb-4">
                {title}
              </h1>

              {/* Excerpt */}
              {excerpt && (
                <p className="text-lg text-gray-600 leading-relaxed mb-6 font-medium">
                  {excerpt}
                </p>
              )}

              {/* Author */}
              <div className="flex items-center gap-3 pb-5 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-foodera-forest/10 flex items-center justify-center flex-shrink-0">
                  <img src="/logo-era.png" alt="FoodEra" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">FoodEra Trade Desk</p>
                  <p className="text-[10px] text-gray-400 font-medium">By • {dateDisplay}</p>
                </div>
              </div>
            </div>

            {/* Cover image */}
            {image && (
              <div className="mx-8 my-6 rounded-2xl overflow-hidden border border-gray-100">
                <img
                  src={image}
                  alt={formData.imageAlt || title}
                  className="w-full h-48 md:h-64 object-cover"
                />
                {formData.imageAlt && (
                  <p className="px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest border-t border-gray-50">
                    {formData.imageAlt}
                  </p>
                )}
              </div>
            )}

            {/* Article body */}
            <div className="px-8 pb-10">
              {contentHtml ? (
                <div
                  className={proseClasses}
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
              ) : (
                <div className="py-16 text-center">
                  <p className="text-gray-400 text-sm font-medium">Chưa có nội dung bài viết.</p>
                  <p className="text-gray-300 text-xs mt-1">Soạn nội dung trong tab "Nội dung" để xem preview.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEO meta preview bar */}
        <div className="flex-shrink-0 px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">SERP Preview (Google)</p>
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-sm font-bold text-blue-600 truncate">
              {formData.seoTitle || title} | FoodEra News
            </p>
            <p className="text-[11px] text-green-700 truncate">
              foodera.com › news › {formData.slug || 'news-item'}
            </p>
            <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">
              {formData.metaDescription || excerpt || 'Không có meta description.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
