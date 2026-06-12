import { CareerItem, NewsItem, Product } from '../types';

export const isContentActive = <T extends { isActive?: boolean; status?: string }>(item: T) =>
  item.status ? item.status === 'published' : item.isActive !== false;

const isNewsPublished = (item: NewsItem) => {
  if (!item.scheduledAt) return true;
  return new Date(item.scheduledAt).getTime() <= Date.now();
};

export const getActiveProducts = (products: Product[]) => products.filter(isContentActive);

export const getActiveNews = (news: NewsItem[]) => news.filter((item) => isContentActive(item) && isNewsPublished(item));

export const getActiveCareers = (careers: CareerItem[]) => careers.filter(isContentActive);
