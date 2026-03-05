do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'news'
      and column_name = 'id'
      and data_type = 'uuid'
  ) then
    alter table public.news
      alter column id drop default;

    alter table public.news
      alter column id type text using id::text;
  end if;
end;
$$;
