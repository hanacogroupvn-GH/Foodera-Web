update public.products
set category = 'Cashew'
where lower(category) = 'agriculture'
  and (
    lower(coalesce(sub_category, '')) like '%cashew%'
    or lower(coalesce(name, '')) like '%cashew%'
    or lower(coalesce(id, '')) like '%cashew%'
    or lower(coalesce(filters::text, '')) like '%cashew%'
  );
