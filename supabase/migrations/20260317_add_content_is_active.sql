alter table if exists public.products
  add column if not exists is_active boolean not null default true;

alter table if exists public.news
  add column if not exists is_active boolean not null default true;
