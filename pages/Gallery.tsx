import React, { useEffect, useState } from 'react';
import { X, Images, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { useDocumentMeta, BASE_URL } from '../lib/useDocumentMeta';

type GalleryCategory = 'activities' | 'trade-fairs' | 'farm-visits';

interface GalleryPhoto {
  src: string;
  alt: string;
  caption?: string;
  category: GalleryCategory;
}

// Add new photos here — drop the image file into public/media/gallery/
// and add a matching entry below (with its category). The filter tabs,
// grid, and lightbox pick up new entries automatically.
const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    src: '/media/gallery/gallery-team-group-photo.webp',
    alt: 'The FoodEra team',
    caption: 'The FoodEra team',
    category: 'activities',
  },
  {
    src: '/media/gallery/gallery-meeting-product-portfolio.webp',
    alt: 'Team reviewing the FoodEra product portfolio',
    caption: 'Reviewing our product portfolio',
    category: 'activities',
  },
  {
    src: '/media/gallery/gallery-dashboard-presentation.webp',
    alt: 'Team meeting reviewing sales and export performance',
    caption: 'Sales & export performance review',
    category: 'activities',
  },
  {
    src: '/media/gallery/gallery-product-bags-lineup.webp',
    alt: 'Cashew, rice, and black pepper sample bags',
    caption: 'Product samples ready for review',
    category: 'activities',
  },
  {
    src: '/media/gallery/gallery-cashew-ww320-sample.webp',
    alt: 'Quality check of Cashew Nut WW320 sample',
    caption: 'Quality check — Cashew Nut WW320',
    category: 'activities',
  },
  {
    src: '/media/gallery/gallery-arabica-coffee-sample.webp',
    alt: 'Arabica Coffee S13 full washed sample',
    caption: 'Arabica Coffee S13 — Full Washed',
    category: 'activities',
  },
  {
    src: '/media/gallery/gallery-japonica-rice-sample-1.webp',
    alt: 'Vietnam Japonica Rice sample inspection',
    caption: 'Vietnam Japonica Rice — 5% Broken',
    category: 'activities',
  },
  {
    src: '/media/gallery/gallery-japonica-rice-sample-2.webp',
    alt: 'Vietnam Japonica Rice sample inspection',
    caption: 'Vietnam Japonica Rice — 5% Broken',
    category: 'activities',
  },
  {
    src: '/media/gallery/gallery-sourcing-vietnam-forum-entrance.webp',
    alt: 'FoodEra representatives at the Sourcing Vietnam – Export Forum 2026 entrance',
    caption: 'Sourcing Vietnam – Export Forum 2026',
    category: 'trade-fairs',
  },
  {
    src: '/media/gallery/gallery-sourcing-vietnam-rice-booth.webp',
    alt: 'Visitors exploring rice varieties at the Sourcing Vietnam exhibition floor',
    caption: 'Exploring rice varieties on the show floor',
    category: 'trade-fairs',
  },
  {
    src: '/media/gallery/gallery-sourcing-vietnam-rice-sample-check.webp',
    alt: 'Inspecting rice samples at a Sourcing Vietnam exhibitor booth',
    caption: 'Inspecting rice samples',
    category: 'trade-fairs',
  },
  {
    src: '/media/gallery/gallery-sourcing-vietnam-dak-lak-pavilion.webp',
    alt: 'FoodEra team member at the Đắk Lắk Pavilion, Sourcing Vietnam 2026',
    caption: 'Đắk Lắk Pavilion — Connecting and Reaching Further',
    category: 'trade-fairs',
  },
  {
    src: '/media/gallery/gallery-sourcing-vietnam-hcmc-pavilion.webp',
    alt: 'FoodEra team at the Ho Chi Minh City Pavilion, Sourcing Vietnam 2026',
    caption: 'Ho Chi Minh City Pavilion',
    category: 'trade-fairs',
  },
  {
    src: '/media/gallery/gallery-sourcing-vietnam-minh-han-booth.webp',
    alt: 'FoodEra team meeting spice supplier Minh Hân at Sourcing Vietnam 2026',
    caption: 'Meeting spice supplier Minh Hân',
    category: 'trade-fairs',
  },
  {
    src: '/media/gallery/gallery-sourcing-vietnam-business-networking.webp',
    alt: 'Business Networking zone at Sourcing Vietnam – Export Forum 2026',
    caption: 'Business Networking zone',
    category: 'trade-fairs',
  },
  {
    src: '/media/gallery/gallery-sourcing-vietnam-b2b-meeting-1.webp',
    alt: 'FoodEra team in a B2B meeting with international buyers at Sourcing Vietnam 2026',
    caption: 'B2B meeting with international buyers',
    category: 'trade-fairs',
  },
  {
    src: '/media/gallery/gallery-sourcing-vietnam-b2b-meeting-2.webp',
    alt: 'FoodEra team discussing partnership opportunities at Sourcing Vietnam 2026',
    caption: 'Discussing partnership opportunities',
    category: 'trade-fairs',
  },
  {
    src: '/media/news/slovakia-delegation-dak-lak-coffee-farm.webp',
    alt: 'FoodEra team hosting Slovak coffee import partners at a Robusta farm in Đắk Lắk, Vietnam',
    caption: 'Slovak partners visiting our Robusta farms in Đắk Lắk',
    category: 'farm-visits',
  },
];

const Gallery: React.FC = () => {
  const { locale } = useLocale();
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<GalleryCategory | 'all'>('all');

  useEffect(() => {
    setActivePhotoIndex(null);
  }, [activeCategory]);

  useDocumentMeta({
    title: locale === 'zh' ? '活动相册' : 'Gallery',
    description: locale === 'zh'
      ? '浏览 FoodEra 的公司活动、展会与产地拜访实景照片。'
      : "A look at FoodEra's company activities, trade fairs, and farm visits.",
    canonicalUrl: `${BASE_URL}/gallery`,
    ogUrl: `${BASE_URL}/gallery`,
  });

  const availableCategories = (['activities', 'trade-fairs', 'farm-visits'] as GalleryCategory[]).filter(
    (cat) => GALLERY_PHOTOS.some((photo) => photo.category === cat)
  );
  const visiblePhotos = activeCategory === 'all'
    ? GALLERY_PHOTOS
    : GALLERY_PHOTOS.filter((photo) => photo.category === activeCategory);

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
      };

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
          {GALLERY_PHOTOS.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {(['all', ...availableCategories] as (GalleryCategory | 'all')[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-colors ${
                    activeCategory === cat
                      ? 'bg-foodera-forest text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {copy.categoryLabels[cat]}
                </button>
              ))}
            </div>
          )}
          {visiblePhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {visiblePhotos.map((photo, index) => (
                <button
                  key={photo.src}
                  type="button"
                  onClick={() => setActivePhotoIndex(index)}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all"
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {photo.caption && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] font-bold px-3 py-2 text-left">
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
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setActivePhotoIndex(null)}
          />
          <div className="relative max-w-4xl w-full">
            <button
              type="button"
              onClick={() => setActivePhotoIndex(null)}
              aria-label="Close"
              className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors"
            >
              <X size={28} />
            </button>
            <img
              src={activePhoto.src}
              alt={activePhoto.alt}
              className="relative w-full max-h-[80vh] object-contain rounded-2xl"
            />
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
            {activePhoto.caption && (
              <p className="relative text-center text-white text-sm font-bold mt-4">{activePhoto.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
