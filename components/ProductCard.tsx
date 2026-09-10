
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useLocale } from '../context/LocaleContext';
import { localizeProduct } from '../lib/contentLocalization';
import { appRoutes } from '../lib/routes';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { locale } = useLocale();
  const localizedProduct = localizeProduct(product, locale);

  return (
    <Link
      to={appRoutes.productBySlug(product.slug || product.id)}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 transform hover:-translate-y-2 overflow-hidden flex flex-col h-full"
    >
      <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
        <img
          src={product.image}
          alt={product.imageAlt || localizedProduct.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-foodera-forest text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-lg shadow-lg">
            {localizedProduct.subCategory}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-sm font-bold text-gray-900 group-hover:text-foodera-forest transition-colors leading-snug">
          {localizedProduct.name}
        </h3>
      </div>
    </Link>
  );
};

export default ProductCard;
