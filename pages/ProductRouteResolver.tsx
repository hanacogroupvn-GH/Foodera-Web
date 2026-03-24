import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { findProductCategoryBySlug } from '../lib/productCategories';
import { appRoutes } from '../lib/routes';
import Products from './Products';

const ProductRouteResolver: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();

  if (!slug) {
    return <Navigate to={appRoutes.products} replace />;
  }

  if (findProductCategoryBySlug(slug)) {
    return <Products categorySlug={slug} />;
  }

  return <Navigate to={appRoutes.productById(slug)} replace />;
};

export default ProductRouteResolver;
