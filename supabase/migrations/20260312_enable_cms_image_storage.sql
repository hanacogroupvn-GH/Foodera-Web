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
