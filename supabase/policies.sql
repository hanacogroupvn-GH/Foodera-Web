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
