
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Product } from '../types';
import { useLocale } from '../context/LocaleContext';
import { usePersonalization } from '../context/PersonalizationContext';
import { getLocalizedFilterValue, localizeProduct } from '../lib/contentLocalization';
import { appRoutes } from '../lib/routes';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { locale } = useLocale();
  const { trackEvent } = usePersonalization();
  const localizedProduct = localizeProduct(product, locale);
  const copy = locale === 'zh'
    ? {
        specifications: '规格',
        exportQuality: '出口品质',
        details: '查看详情',
        brokenSuffix: '碎米'
      }
    : {
        specifications: 'Specifications',
        exportQuality: 'Export Quality',
        details: 'Details',
        brokenSuffix: 'Broken'
      };

  // Helper to render filter values as professional chips
  const renderAttributeChips = () => {
    return (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {Object.entries(localizedProduct.filters).map(([key, value]) => {
          if (!value) return null;
          
          const rawValue = String(value);
          let displayValue = getLocalizedFilterValue(rawValue, locale);
          // Apply specific formatting for key attributes
          if (key === 'brokenRatio' && /^\d+(?:\.\d+)?%$/.test(rawValue)) {
            displayValue = `${rawValue} ${copy.brokenSuffix}`;
          }
          
          return (
            <span 
              key={key} 
              className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[9px] font-black uppercase tracking-widest rounded-md border border-gray-100 group-hover:border-foodmax-lime/30 group-hover:bg-foodmax-lime/5 transition-colors"
            >
              {displayValue}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <Link 
      to={appRoutes.productById(product.id)}
      onClick={() => {
        void trackEvent(
          {
            entityType: 'product',
            action: 'click',
            itemId: product.id,
            category: product.category,
            subCategory: product.subCategory,
            locale,
            metadata: {
              surface: 'product_card'
            }
          },
          {
            dedupeKey: `product-click:${product.id}:${window.location.pathname}`,
            dedupeTtlMs: 1200
          }
        );
      }}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 transform hover:-translate-y-2 overflow-hidden flex flex-col h-full"
    >
      <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
        <img 
          src={product.image} 
          alt={localizedProduct.name} 
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-foodmax-forest text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-lg shadow-lg">
            {localizedProduct.subCategory}
          </span>
        </div>
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-foodmax-forest transition-colors leading-tight">
          {localizedProduct.name}
        </h3>
        
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed font-medium">
          {localizedProduct.shortDescription}
        </p>

        {/* Attribute Chips Section */}
        <div className="mb-6">
          <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-2">{copy.specifications}</p>
          {renderAttributeChips()}
        </div>
        
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <CheckCircle size={12} className="text-foodmax-lime" /> {copy.exportQuality}
          </span>
          <span className="flex items-center gap-1 text-sm font-black text-foodmax-forest transition-all group-hover:gap-2">
            {copy.details} <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
