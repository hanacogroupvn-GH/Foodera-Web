create extension if not exists unaccent with schema extensions;

alter table if exists public.news
add column if not exists slug text;

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
      and (current_id is null or n.id <> current_id)
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

  candidate_slug := public.slugify(coalesce(new.slug, new.title, new.id, 'news-item'));
  if candidate_slug = '' then
    candidate_slug := 'news-item';
  end if;

  new.slug := public.news_generate_unique_slug(candidate_slug, case when tg_op = 'UPDATE' then new.id else null end);
  return new;
end;
$$;

do $$
declare
  rec record;
  base_slug text;
begin
  for rec in
    select id, title, slug
    from public.news
    order by created_at nulls first, id
  loop
    base_slug := public.slugify(coalesce(rec.slug, rec.title, rec.id, 'news-item'));
    if base_slug = '' then
      base_slug := 'news-item';
    end if;

    update public.news
    set slug = public.news_generate_unique_slug(base_slug, rec.id)
    where id = rec.id;
  end loop;
end;
$$;

alter table if exists public.news
alter column slug set not null;

create unique index if not exists idx_news_slug
on public.news (slug);

drop trigger if exists trg_news_set_slug on public.news;
create trigger trg_news_set_slug
before insert or update on public.news
for each row execute function public.news_set_slug();
