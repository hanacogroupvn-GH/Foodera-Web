-- Foodmax Supabase schema (products + news + admin_users)

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  sub_category text not null,
  description text not null,
  short_description text not null,
  image text not null,
  pdf_url text,
  gallery jsonb,
  specifications jsonb not null default '{}'::jsonb,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news (
  id text primary key,
  title text not null,
  date text not null,
  category text not null,
  excerpt text not null,
  content jsonb not null default '[]'::jsonb,
  image text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Admin allowlist
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_news_updated_at on public.news;
create trigger trg_news_updated_at
before update on public.news
for each row execute function public.set_updated_at();
