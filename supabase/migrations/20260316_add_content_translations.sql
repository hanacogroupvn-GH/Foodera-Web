alter table if exists public.products
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table if exists public.news
  add column if not exists translations jsonb not null default '{}'::jsonb;
