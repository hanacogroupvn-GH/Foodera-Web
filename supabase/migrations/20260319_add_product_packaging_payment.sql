alter table if exists public.products
  add column if not exists packaging jsonb not null default '{}'::jsonb,
  add column if not exists payment jsonb not null default '{}'::jsonb;
