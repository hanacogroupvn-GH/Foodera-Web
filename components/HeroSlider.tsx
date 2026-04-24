import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { appRoutes } from '../lib/routes';

const HeroSlider: React.FC = () => {
  const { locale } = useLocale();
  const slides = locale === 'zh'
    ? [
        {
          title: '越南优质大米出口',
          description: '面向全球进口商的优质茉莉香米、长粒白米与 ST25，大规模按国际标准加工。',
          cta: '查看大米产品线',
          link: appRoutes.productsByCategory('Rice'),
          image: 'https://images.unsplash.com/photo-1769149797509-d005e2d32940?auto=format&fit=crop&q=80&w=1600'
        },
        {
          title: '精品与优质咖啡',
          description: '来自越南中部高原的罗布斯塔与阿拉比卡，适合精品烘焙商与工业买家。',
          cta: '探索咖啡产品线',
          link: appRoutes.productsByCategory('Coffee'),
          image: 'https://images.unsplash.com/photo-1769159686935-c516d57023b5?auto=format&fit=crop&q=80&w=1600'
        },
        {
          title: '越南优质腰果仁',
          description: '适用于零售、餐饮与工业渠道的 WW180、WW240、WW320、WS 与 LBW 出口等级。',
          cta: '查看腰果等级',
          link: appRoutes.productsByCategory('Cashew'),
          image: 'https://images.unsplash.com/photo-1720720580549-70b4ebfa699a?auto=format&fit=crop&q=80&w=1600'
        }
      ]
    : [
        {
          title: "Vietnam's Finest Rice Exports",
          description: 'Premium Jasmine, Long Grain White, and ST25 varieties processed to international standards for global importers.',
          cta: 'View Rice Portfolios',
          link: appRoutes.productsByCategory('Rice'),
          image: 'https://images.unsplash.com/photo-1769149797509-d005e2d32940?auto=format&fit=crop&q=80&w=1600'
        },
        {
          title: 'Premium Specialty Coffee',
          description: 'Exceptional Robusta and Arabica beans from the Central Highlands, tailored for specialty roasters and industrial buyers.',
          cta: 'Explore Coffee Lines',
          link: appRoutes.productsByCategory('Coffee'),
          image: 'https://images.unsplash.com/photo-1769159686935-c516d57023b5?auto=format&fit=crop&q=80&w=1600'
        },
        {
          title: 'Premium Vietnamese Cashew Kernels',
          description: 'Export-ready WW180, WW240, WW320, WS, and LBW grades sourced for retail, foodservice, and industrial buyers.',
          cta: 'Explore Cashew Grades',
          link: appRoutes.productsByCategory('Cashew'),
          image: 'https://images.unsplash.com/photo-1720720580549-70b4ebfa699a?auto=format&fit=crop&q=80&w=1600'
        }
      ];
  const quoteLabel = locale === 'zh' ? '申请报价' : 'Request Quotation';
  const [current, setCurrent] = useState(0);

  const nextSlide = () => setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  useEffect(() => {
    const timer = setInterval(nextSlide, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[750px] overflow-hidden bg-foodera-forest">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Branded Gradient Overlay - Matching FoodEra Forest */}
          <div className="absolute inset-0 bg-gradient-to-t from-foodera-forest via-foodera-forest/40 to-transparent z-10"></div>
          
          <img 
            src={slide.image} 
            alt={slide.title}
            width={1600}
            height={900}
            fetchPriority={index === 0 ? 'high' : 'low'}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding={index === 0 ? 'sync' : 'async'}
            className="w-full h-full object-cover object-center transform transition-transform duration-[8000ms] ease-out opacity-80"
            style={{ transform: index === current ? 'scale(1.1)' : 'scale(1)' }}
          />
          
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
              <div className={`max-w-3xl mx-auto transform transition-all duration-1000 delay-300 ${index === current ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                <div className="flex justify-center mb-6">
                  <div className="h-1.5 w-24 bg-foodera-lime rounded-full shadow-[0_0_15px_rgba(140,198,63,0.5)]"></div>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight drop-shadow-2xl tracking-tighter">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-2xl text-white/90 mb-12 leading-relaxed max-w-2xl mx-auto drop-shadow font-medium">
                  {slide.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link 
                    to={slide.link}
                    className="px-10 py-5 bg-foodera-lime text-foodera-forest rounded-2xl font-black text-center hover:bg-white hover:text-foodera-forest transition-all hover:scale-105 active:scale-95 shadow-2xl tracking-[0.2em] uppercase text-xs"
                  >
                    {slide.cta}
                  </Link>
                  <Link 
                    to={appRoutes.contact}
                    className="px-10 py-5 bg-white/10 backdrop-blur-xl border border-white/30 text-white rounded-2xl font-black text-center hover:bg-white/20 transition-all uppercase text-xs tracking-[0.2em]"
                  >
                    {quoteLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Nav Controls */}
      <button onClick={prevSlide} className="absolute left-8 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full bg-white/5 text-white border border-white/10 backdrop-blur-md hover:bg-foodera-lime hover:text-foodera-forest transition-all hidden md:block group">
        <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
      </button>
      <button onClick={nextSlide} className="absolute right-8 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full bg-white/5 text-white border border-white/10 backdrop-blur-md hover:bg-foodera-lime hover:text-foodera-forest transition-all hidden md:block group">
        <ChevronRight size={28} className="group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Progress Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex gap-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === current ? 'bg-foodera-lime w-16 shadow-[0_0_10px_rgba(140,198,63,0.8)]' : 'bg-white/20 w-8 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
