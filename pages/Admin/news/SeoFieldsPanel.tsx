import React from 'react';
import { Target, Search, FileText, Globe } from 'lucide-react';

interface SeoFieldsPanelProps {
  // Core SEO fields
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  slug: string;
  imageAlt: string;
  // Source fields for fallback display
  title: string;
  excerpt: string;
  // Handlers
  onSeoTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
  onFocusKeywordChange: (value: string) => void;
  onImageAltChange: (value: string) => void;
}

const CharCounter: React.FC<{
  current: number;
  max: number;
  recommended?: number;
}> = ({ current, max, recommended }) => {
  const isOver = current > max;
  const isGood = recommended ? current >= recommended && current <= max : current <= max;

  return (
    <span
      className={`text-[10px] font-bold tabular-nums ${
        isOver ? 'text-red-500' : isGood ? 'text-green-600' : 'text-gray-400'
      }`}
    >
      {current}/{max}
    </span>
  );
};

export const SeoFieldsPanel: React.FC<SeoFieldsPanelProps> = ({
  seoTitle,
  metaDescription,
  focusKeyword,
  slug,
  imageAlt,
  title,
  excerpt,
  onSeoTitleChange,
  onMetaDescriptionChange,
  onFocusKeywordChange,
  onImageAltChange,
}) => {
  const effectiveSeoTitle = seoTitle || title;
  const effectiveMetaDesc = metaDescription || excerpt;
  const effectiveSlug = slug || 'news-item';

  return (
    <div className="space-y-6">
      {/* SERP Preview */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
            <Search size={13} className="text-blue-500" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-gray-500">Google SERP Preview</span>
        </div>
        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
          <p className="text-base font-bold text-blue-600 truncate leading-tight">
            {effectiveSeoTitle ? `${effectiveSeoTitle} | FoodEra News` : 'Chưa có tiêu đề SEO'}
          </p>
          <p className="text-xs text-green-700 mt-0.5 truncate">
            foodera.com › news › <span className="text-green-600">{effectiveSlug}</span>
          </p>
          <p
            className={`text-xs mt-1 leading-relaxed line-clamp-2 ${
              effectiveMetaDesc ? 'text-gray-600' : 'text-gray-400 italic'
            }`}
          >
            {effectiveMetaDesc || 'Không có meta description — sẽ dùng excerpt bài viết.'}
          </p>
        </div>
      </div>

      {/* SEO Title */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center">
              <FileText size={13} className="text-indigo-500" />
            </div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-500">
              SEO Title
            </label>
          </div>
          <CharCounter current={effectiveSeoTitle.length} max={60} recommended={40} />
        </div>
        <input
          type="text"
          value={seoTitle}
          onChange={(e) => onSeoTitleChange(e.target.value)}
          placeholder={title || 'Để trống = dùng tiêu đề bài viết'}
          maxLength={80}
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-indigo-300 transition-colors placeholder:text-gray-300"
        />
        <p className="text-[10px] text-gray-400">
          Tiêu đề hiện trên tab trình duyệt và Google. Lý tưởng: 40–60 ký tự. Để trống = dùng tiêu đề bài viết.
        </p>
        {/* Visual length bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              effectiveSeoTitle.length > 60 ? 'bg-red-400' :
              effectiveSeoTitle.length >= 40 ? 'bg-green-400' : 'bg-amber-300'
            }`}
            style={{ width: `${Math.min(100, (effectiveSeoTitle.length / 60) * 100)}%` }}
          />
        </div>
      </div>

      {/* Meta Description */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Globe size={13} className="text-emerald-500" />
            </div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-500">
              Meta Description
            </label>
          </div>
          <CharCounter current={effectiveMetaDesc.length} max={160} recommended={120} />
        </div>
        <textarea
          value={metaDescription}
          onChange={(e) => onMetaDescriptionChange(e.target.value)}
          placeholder={excerpt || 'Để trống = dùng excerpt bài viết'}
          maxLength={200}
          rows={3}
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-emerald-300 transition-colors resize-none placeholder:text-gray-300"
        />
        <p className="text-[10px] text-gray-400">
          Mô tả hiện dưới tiêu đề trên Google. Lý tưởng: 120–160 ký tự. Để trống = dùng excerpt.
        </p>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              effectiveMetaDesc.length > 160 ? 'bg-red-400' :
              effectiveMetaDesc.length >= 120 ? 'bg-green-400' : 'bg-amber-300'
            }`}
            style={{ width: `${Math.min(100, (effectiveMetaDesc.length / 160) * 100)}%` }}
          />
        </div>
      </div>

      {/* Focus Keyword */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center">
            <Target size={13} className="text-amber-500" />
          </div>
          <label className="text-xs font-black uppercase tracking-widest text-gray-500">
            Focus Keyword
          </label>
        </div>
        <input
          type="text"
          value={focusKeyword}
          onChange={(e) => onFocusKeywordChange(e.target.value)}
          placeholder="Ví dụ: jasmine rice export Vietnam"
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-amber-300 transition-colors placeholder:text-gray-300"
        />
        <p className="text-[10px] text-gray-400">
          Từ khóa chính mà bài viết muốn xếp hạng. Dùng cho SEO Analyzer (tab SEO bên dưới).
        </p>
      </div>

      {/* Image Alt Text */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-rose-50 rounded-lg flex items-center justify-center">
              <FileText size={13} className="text-rose-500" />
            </div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-500">
              Cover Image Alt Text
            </label>
          </div>
          <CharCounter current={imageAlt.length} max={125} recommended={50} />
        </div>
        <input
          type="text"
          value={imageAlt}
          onChange={(e) => onImageAltChange(e.target.value)}
          placeholder="Mô tả ảnh bìa — ví dụ: Vietnamese jasmine rice export bags — FoodEra"
          maxLength={150}
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-rose-300 transition-colors placeholder:text-gray-300"
        />
        <p className="text-[10px] text-gray-400">
          Chứa từ khóa chính. Tối đa 125 ký tự. Để trống = tự động dùng tiêu đề bài viết.
        </p>
      </div>

      {/* SEO checklist */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Checklist SEO</p>
        {[
          {
            label: 'SEO Title trong ngưỡng tối ưu (40–60 ký tự)',
            ok: effectiveSeoTitle.length >= 40 && effectiveSeoTitle.length <= 60,
          },
          {
            label: 'Meta Description trong ngưỡng tối ưu (120–160 ký tự)',
            ok: effectiveMetaDesc.length >= 120 && effectiveMetaDesc.length <= 160,
          },
          {
            label: 'Focus Keyword đã điền',
            ok: focusKeyword.trim().length > 0,
          },
          {
            label: 'Image Alt Text đã điền',
            ok: imageAlt.trim().length > 0,
          },
          {
            label: 'Focus Keyword có trong SEO Title',
            ok:
              focusKeyword.trim().length > 0 &&
              effectiveSeoTitle.toLowerCase().includes(focusKeyword.toLowerCase()),
          },
          {
            label: 'Focus Keyword có trong Meta Description',
            ok:
              focusKeyword.trim().length > 0 &&
              effectiveMetaDesc.toLowerCase().includes(focusKeyword.toLowerCase()),
          },
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2.5">
            <div
              className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black ${
                item.ok ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
              }`}
            >
              {item.ok ? '✓' : '·'}
            </div>
            <span className={`text-xs font-medium ${item.ok ? 'text-gray-700' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
