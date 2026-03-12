-- Foodmax Supabase RLS policies (admin CRUD, public read)

-- helper: check admin
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users au where au.user_id = uid);
$$;

-- Enable RLS
alter table public.products enable row level security;
alter table public.news enable row level security;
alter table public.admin_users enable row level security;

-- admin_users policies
drop policy if exists "Admins can read admin_users" on public.admin_users;
drop policy if exists "Users can read own admin_users" on public.admin_users;
drop policy if exists "Admins can manage admin_users" on public.admin_users;

create policy "Admins can read admin_users"
on public.admin_users
for select
using (public.is_admin(auth.uid()));

create policy "Users can read own admin_users"
on public.admin_users
for select
using (auth.uid() = user_id);

create policy "Admins can manage admin_users"
on public.admin_users
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- products policies
drop policy if exists "Public can read products" on public.products;
drop policy if exists "Admins can manage products" on public.products;

create policy "Public can read products"
on public.products
for select
using (true);

create policy "Admins can manage products"
on public.products
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- news policies
drop policy if exists "Public can read news" on public.news;
drop policy if exists "Admins can manage news" on public.news;

create policy "Public can read news"
on public.news
for select
using (true);

create policy "Admins can manage news"
on public.news
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- product PDF storage (public read, admin write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-pdfs', 'product-pdfs', true, 10485760, array['application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read product pdf files" on storage.objects;
drop policy if exists "Admins can upload product pdf files" on storage.objects;
drop policy if exists "Admins can update product pdf files" on storage.objects;
drop policy if exists "Admins can delete product pdf files" on storage.objects;
drop policy if exists "Authenticated can upload product pdf files" on storage.objects;
drop policy if exists "Authenticated can update product pdf files" on storage.objects;
drop policy if exists "Authenticated can delete product pdf files" on storage.objects;

create policy "Public can read product pdf files"
on storage.objects
for select
using (bucket_id = 'product-pdfs');

create policy "Authenticated can upload product pdf files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-pdfs');

create policy "Authenticated can update product pdf files"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-pdfs')
with check (bucket_id = 'product-pdfs');

create policy "Authenticated can delete product pdf files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-pdfs');

-- CMS image storage (public read, authenticated write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-images',
  'cms-images',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
    'image/heic',
    'image/heif'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read cms image files" on storage.objects;
drop policy if exists "Authenticated can upload cms image files" on storage.objects;
drop policy if exists "Authenticated can update cms image files" on storage.objects;
drop policy if exists "Authenticated can delete cms image files" on storage.objects;

create policy "Public can read cms image files"
on storage.objects
for select
using (bucket_id = 'cms-images');

create policy "Authenticated can upload cms image files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'cms-images');

create policy "Authenticated can update cms image files"
on storage.objects
for update
to authenticated
using (bucket_id = 'cms-images')
with check (bucket_id = 'cms-images');

create policy "Authenticated can delete cms image files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'cms-images');

-- CMS image storage (public read, authenticated write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-images',
  'cms-images',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
    'image/heic',
    'image/heif'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read cms image files" on storage.objects;
drop policy if exists "Authenticated can upload cms image files" on storage.objects;
drop policy if exists "Authenticated can update cms image files" on storage.objects;
drop policy if exists "Authenticated can delete cms image files" on storage.objects;

create policy "Public can read cms image files"
on storage.objects
for select
using (bucket_id = 'cms-images');

create policy "Authenticated can upload cms image files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'cms-images');

create policy "Authenticated can update cms image files"
on storage.objects
for update
to authenticated
using (bucket_id = 'cms-images')
with check (bucket_id = 'cms-images');

create policy "Authenticated can delete cms image files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'cms-images');
