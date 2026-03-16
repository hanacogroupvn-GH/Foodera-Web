-- Foodmax Supabase schema (products + news + admin_users)

create extension if not exists unaccent with schema extensions;

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
  translations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news (
  id text primary key,
  slug text not null unique,
  title text not null,
  date text not null,
  category text not null,
  excerpt text not null,
  content jsonb not null default '[]'::jsonb,
  image text not null,
  translations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Admin allowlist
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(input, ''))), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.news_generate_unique_slug(base_slug text, current_id text default null)
returns text
language plpgsql
as $$
declare
  normalized_base text := public.slugify(base_slug);
  candidate text;
  suffix integer := 2;
begin
  if normalized_base = '' then
    normalized_base := 'news-item';
  end if;

  candidate := normalized_base;
  while exists (
    select 1
    from public.news n
    where n.slug = candidate
      and (current_id is null or n.id::text <> current_id)
  ) loop
    candidate := normalized_base || '-' || suffix;
    suffix := suffix + 1;
  end loop;

  return candidate;
end;
$$;

create or replace function public.news_set_slug()
returns trigger
language plpgsql
as $$
declare
  candidate_slug text;
begin
  if tg_op = 'UPDATE' and (new.slug is null or btrim(new.slug) = '') and old.slug is not null and btrim(old.slug) <> '' then
    new.slug := old.slug;
    return new;
  end if;

  candidate_slug := public.slugify(coalesce(new.slug, new.title, new.id::text, 'news-item'));
  if candidate_slug = '' then
    candidate_slug := 'news-item';
  end if;

  new.slug := public.news_generate_unique_slug(candidate_slug, case when tg_op = 'UPDATE' then new.id::text else null end);
  return new;
end;
$$;

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

drop trigger if exists trg_news_set_slug on public.news;
create trigger trg_news_set_slug
before insert or update on public.news
for each row execute function public.news_set_slug();
