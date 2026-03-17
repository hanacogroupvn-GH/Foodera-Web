import { NewsItem, Product } from '../types';

export const isContentActive = <T extends { isActive?: boolean }>(item: T) => item.isActive !== false;

export const getActiveProducts = (products: Product[]) => products.filter(isContentActive);

export const getActiveNews = (news: NewsItem[]) => news.filter(isContentActive);
