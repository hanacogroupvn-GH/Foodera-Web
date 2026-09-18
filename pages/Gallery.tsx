import React, { useEffect, useState } from 'react';
import { X, Images, ChevronLeft, ChevronRight, Layers, Sparkles } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { useDocumentMeta, BASE_URL } from '../lib/useDocumentMeta';
import { GalleryCategory, GalleryPhotoItem, SupportedLocale } from '../types';
import { api } from '../lib/apiClient';
import defaultGalleryData from '../data/gallery.json';

interface FarmAlbumMeta {
  key: string;
  title: Record<SupportedLocale, string>;
  shortLabel: Record<SupportedLocale, string>;
  badge: Record<SupportedLocale, string>;
  desc: Record<SupportedLocale, string>;
  icon: string;
  badgeClass: string;
}

const FARM_ALBUMS: Record<string, FarmAlbumMeta> = {
  'durian-farm-visit': {
    key: 'durian-farm-visit',
    title: {
      vi: 'Khảo sát Vùng trồng Sầu riêng Xuất khẩu',
      en: 'Durian Plantation Field Inspection',
      zh: '榴莲种植园实地考察'
    },
    shortLabel: {
      vi: 'Vườn Sầu Riêng',
      en: 'Durian Plantation',
      zh: '榴莲果园'
    },
    badge: {
      vi: 'Vườn Sầu Riêng',
      en: 'Durian Plantation',
      zh: '榴莲果园'
    },
    desc: {
      vi: 'Khảo sát thực địa vùng trồng sầu riêng Ri6 và Monthong tại Tây Nguyên, kiểm tra quy trình chăm sóc cây đại thụ, độ phát triển chùm quả và chuẩn hóa thu hoạch phân loại quả loại 1 xuất khẩu.',
      en: 'Field inspection of partner durian orchards in the Central Highlands, assessing mature tree health, fruit cluster development, and export grading standards for Ri6 & Monthong varieties.',
      zh: '实地考察西原地区 Ri6 与 Monthong 优质榴莲合作果园，严格检验树体养护、挂果密度与一级出口鲜果采收标准。'
    },
    icon: '🍈',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  'coffee-farm-visit': {
    key: 'coffee-farm-visit',
    title: {
      vi: 'Khảo sát Vùng nguyên liệu Cà phê Robusta',
      en: 'Robusta Coffee Plantation Inspection',
      zh: '罗布斯塔咖啡原料产地考察'
    },
    shortLabel: {
      vi: 'Nông Trường Cà Phê',
      en: 'Coffee Plantation',
      zh: '咖啡庄园'
    },
    badge: {
      vi: 'Nông Trường Cà Phê',
      en: 'Coffee Plantation',
      zh: '咖啡庄园'
    },
    desc: {
      vi: 'Khảo sát thực địa vùng nguyên liệu cà phê Robusta trọng điểm tại Đắk Lắk, đánh giá tỷ lệ đậu quả, độ đồng đều hạt và quy trình canh tác bền vững cùng nông dân liên kết.',
      en: 'Field survey of key Robusta coffee plantations in Đắk Lắk province, evaluating cherry set density, bean uniformity, and sustainable farming practices with partner growers.',
      zh: '深入考察得乐省核心罗布斯塔咖啡种植基地，实地评估咖啡果串密度、颗粒均匀度及规范化可持续种植管理。'
    },
    icon: '☕',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  'slovakia-partner-visit': {
    key: 'slovakia-partner-visit',
    title: {
      vi: 'Đoàn Đối tác Slovakia Khảo sát Nông trại',
      en: 'Slovak Delegation Farm Inspection',
      zh: '斯洛伐克采购代表团产地走访'
    },
    shortLabel: {
      vi: 'Đối Tác Quốc Tế',
      en: 'Intl Delegation',
      zh: '国际代表团'
    },
    badge: {
      vi: 'Đối Tác Quốc Tế',
      en: 'Intl Delegation',
      zh: '国际代表团'
    },
    desc: {
      vi: 'Đoàn đối tác nhập khẩu cà phê từ Slovakia đến thăm và làm việc thực địa tại vùng trồng cà phê Robusta Đắk Lắk cùng đại diện FoodEra.',
      en: 'Coffee import partners from Slovakia visiting our Robusta coffee farms in Đắk Lắk, Vietnam with the FoodEra team.',
      zh: '来自斯洛伐克的咖啡采购商代表团深入得乐省罗布斯塔咖啡农庄，实地考察原料品质与供应链合作。'
    },
    icon: '🤝',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
  }
};

const Gallery: React.FC = () => {
  const { locale } = useLocale();
  const [photos, setPhotos] = useState<GalleryPhotoItem[]>(
    () => (defaultGalleryData as unknown as GalleryPhotoItem[]).filter((p) => p.isActive !== false)
  );
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<GalleryCategory | 'all'>('all');
  const [activeFarmAlbum, setActiveFarmAlbum] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    api.getGallery()
      .then((res) => {
        if (isMounted && res.photos && res.photos.length > 0) {
          setPhotos(res.photos.filter((p) => p.isActive !== false));
        }
      })
      .catch(() => {
        // Keep static fallback on network error
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setActivePhotoIndex(null);
    setActiveFarmAlbum('all');
  }, [activeCategory]);

  useDocumentMeta({
    title: locale === 'zh' ? '活动相册 | FoodEra' : 'Gallery | FoodEra',
    description: locale === 'zh'
      ? '浏览 FoodEra 的公司活动、展会与产地拜访实景照片。'
      : "A look at FoodEra's company activities, trade fairs, and farm visits.",
    canonicalUrl: `${BASE_URL}/gallery`,
    ogUrl: `${BASE_URL}/gallery`,
  });

  // Normalize photos so any legacy photos like gallery-18 are properly associated with an album
  const normalizedPhotos = photos.map((p) => {
    if (p.id === 'gallery-18' && !p.album) {
      return {
        ...p,
        album: 'slovakia-partner-visit',
        albumTitle: 'Slovak Delegation Farm Inspection'
      };
    }
    return p;
  });

  const availableCategories = (['activities', 'trade-fairs', 'farm-visits'] as GalleryCategory[]).filter(
    (cat) => normalizedPhotos.some((photo) => photo.category === cat)
  );

  // Filtered photos based on category and album
  const visiblePhotos = (
    activeCategory === 'all'
      ? normalizedPhotos
      : normalizedPhotos.filter((photo) => {
          if (photo.category !== activeCategory) return false;
          if (activeCategory === 'farm-visits' && activeFarmAlbum !== 'all') {
            return photo.album === activeFarmAlbum;
          }
          return true;
        })
  ).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const activePhoto = activePhotoIndex !== null ? visiblePhotos[activePhotoIndex] ?? null : null;
  const goToPrevPhoto = () =>
    setActivePhotoIndex((i) => (i === null ? null : (i - 1 + visiblePhotos.length) % visiblePhotos.length));
  const goToNextPhoto = () =>
    setActivePhotoIndex((i) => (i === null ? null : (i + 1) % visiblePhotos.length));

  useEffect(() => {
    if (!activePhoto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePhotoIndex(null);
      if (e.key === 'ArrowLeft') goToPrevPhoto();
      if (e.key === 'ArrowRight') goToNextPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhoto, visiblePhotos.length]);

  const copy = locale === 'zh'
    ? {
        heroTitle: '活动相册',
        heroDesc: '记录 FoodEra 的公司活动、展会与产地拜访瞬间。',
        emptyTitle: '相册即将上线',
        emptyDesc: '我们公司活动、展会与产地拜访的照片将很快在这里展示。',
        categoryLabels: {
          all: '全部',
          activities: '公司活动',
          'trade-fairs': '展会',
          'farm-visits': '产地拜访',
        } as Record<GalleryCategory | 'all', string>,
        allAlbums: '全部产地考察',
        viewAlbum: '查看相册',
        photosCount: '张照片'
      }
    : {
        heroTitle: 'Gallery',
        heroDesc: "A look at FoodEra's company activities, trade fairs, and farm visits.",
        emptyTitle: 'Gallery Coming Soon',
        emptyDesc: 'Photos from our company activities, trade fairs, and farm visits will appear here soon.',
        categoryLabels: {
          all: 'All',
          activities: 'Company Activities',
          'trade-fairs': 'Trade Fairs',
          'farm-visits': 'Farm Visits',
        } as Record<GalleryCategory | 'all', string>,
        allAlbums: 'All Farm Visits',
        viewAlbum: 'View Album',
        photosCount: 'photos'
      };

  const farmPhotos = normalizedPhotos.filter((p) => p.category === 'farm-visits');
  const durianCount = farmPhotos.filter((p) => p.album === 'durian-farm-visit').length;
  const coffeeCount = farmPhotos.filter((p) => p.album === 'coffee-farm-visit').length;
  const slovakiaCount = farmPhotos.filter((p) => p.album === 'slovakia-partner-visit').length;
  const standaloneFarmPhotos = farmPhotos.filter(
    (p) => !p.album || !['durian-farm-visit', 'coffee-farm-visit', 'slovakia-partner-visit'].includes(p.album)
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-foodera-forest py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">{copy.heroTitle}</h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">{copy.heroDesc}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-24">
        <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 md:p-10">
          {/* Main Category Tabs */}
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {(['all', ...availableCategories] as (GalleryCategory | 'all')[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                    activeCategory === cat
                      ? 'bg-foodera-forest text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {copy.categoryLabels[cat]}
                </button>
              ))}
            </div>
          )}

          {/* Sub-filters for Farm Visits */}
          {activeCategory === 'farm-visits' && (
            <div className="flex flex-wrap items-center gap-2 p-3 mb-8 bg-gray-50/80 rounded-2xl border border-gray-200/70">
              <span className="text-xs font-bold text-gray-500 mr-2 flex items-center gap-1.5 pl-1">
                <Layers size={14} className="text-foodera-forest" />
                Bộ ảnh:
              </span>
              <button
                type="button"
                onClick={() => setActiveFarmAlbum('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  activeFarmAlbum === 'all'
                    ? 'bg-foodera-forest text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {copy.allAlbums} ({farmPhotos.length})
              </button>

              {durianCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFarmAlbum('durian-farm-visit')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeFarmAlbum === 'durian-farm-visit'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-amber-50'
                  }`}
                >
                  <span>🍈</span>
                  <span>{FARM_ALBUMS['durian-farm-visit']?.shortLabel?.[locale] || FARM_ALBUMS['durian-farm-visit']?.shortLabel?.en || 'Durian Plantation'}</span>
                  <span className="text-[10px] opacity-80">({durianCount})</span>
                </button>
              )}

              {coffeeCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFarmAlbum('coffee-farm-visit')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeFarmAlbum === 'coffee-farm-visit'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50'
                  }`}
                >
                  <span>☕</span>
                  <span>{FARM_ALBUMS['coffee-farm-visit']?.shortLabel?.[locale] || FARM_ALBUMS['coffee-farm-visit']?.shortLabel?.en || 'Coffee Plantation'}</span>
                  <span className="text-[10px] opacity-80">({coffeeCount})</span>
                </button>
              )}

              {slovakiaCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFarmAlbum('slovakia-partner-visit')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeFarmAlbum === 'slovakia-partner-visit'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'
                  }`}
                >
                  <span>🤝</span>
                  <span>{FARM_ALBUMS['slovakia-partner-visit']?.shortLabel?.[locale] || FARM_ALBUMS['slovakia-partner-visit']?.shortLabel?.en || 'Partner Delegation'}</span>
                  <span className="text-[10px] opacity-80">({slovakiaCount})</span>
                </button>
              )}
            </div>
          )}

          {visiblePhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {visiblePhotos.map((photo, index) => (
                <button
                  key={photo.id || photo.src}
                  type="button"
                  onClick={() => setActivePhotoIndex(index)}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-gray-100/90 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-foodera-forest/40"
                >
                  <img
                    src={photo.src}
                    alt={photo.alt || photo.caption || ''}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Subtle album badge if part of an album */}
                  {photo.album && (
                    <span className="absolute top-2.5 left-2.5 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-md shadow-xs truncate max-w-[150px] pointer-events-none">
                      {FARM_ALBUMS[photo.album]?.icon ? `${FARM_ALBUMS[photo.album].icon} ` : ''}
                      {FARM_ALBUMS[photo.album]?.shortLabel?.[locale] || FARM_ALBUMS[photo.album]?.shortLabel?.en || photo.albumTitle || photo.album}
                    </span>
                  )}
                  {/* Caption overlay at the bottom matching user screenshot */}
                  {photo.caption && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-white text-xs sm:text-sm font-semibold px-3 sm:px-3.5 py-2.5 sm:py-3 text-left line-clamp-2 drop-shadow-sm">
                      {photo.caption}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center rounded-[2rem] border border-dashed border-gray-200 bg-gray-50 px-8 py-20">
              <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 text-foodera-forest flex items-center justify-center mb-5">
                <Images size={24} />
              </div>
              <h2 className="text-lg font-black text-gray-900 mb-2">{copy.emptyTitle}</h2>
              <p className="text-sm text-gray-500 font-medium max-w-md">{copy.emptyDesc}</p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {activePhoto && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => setActivePhotoIndex(null)}
          />
          <div className="relative max-w-4xl w-full">
            <button
              type="button"
              onClick={() => setActivePhotoIndex(null)}
              aria-label="Close"
              className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors p-1"
            >
              <X size={28} />
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl bg-black/30">
              <img
                src={activePhoto.src}
                alt={activePhoto.alt}
                className="relative w-full max-h-[80vh] object-contain rounded-2xl mx-auto"
              />
            </div>
            {visiblePhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPrevPhoto}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-foodera-forest hover:bg-white transition-colors"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={goToNextPhoto}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-foodera-forest hover:bg-white transition-colors"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
            
            <div className="relative text-center mt-4 space-y-1.5 px-4">
              {(activePhoto.album || activePhoto.albumTitle) && (
                <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold border shadow-xs ${FARM_ALBUMS[activePhoto.album || '']?.badgeClass || 'bg-white/20 text-white border-white/30'}`}>
                  {FARM_ALBUMS[activePhoto.album || '']?.icon || '📁'} {FARM_ALBUMS[activePhoto.album || '']?.title?.[locale] || FARM_ALBUMS[activePhoto.album || '']?.title?.en || activePhoto.albumTitle || activePhoto.album}
                </span>
              )}
              {activePhoto.caption && (
                <p className="text-white text-sm md:text-base font-bold drop-shadow-sm">
                  {activePhoto.caption}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
