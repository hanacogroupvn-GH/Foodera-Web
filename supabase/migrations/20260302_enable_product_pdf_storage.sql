create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users au where au.user_id = uid);
$$;

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
