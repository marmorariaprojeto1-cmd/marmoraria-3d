alter table public.stone_categories
  add column if not exists slug text;

alter table public.stone_categories
  add column if not exists sort_order integer not null default 0;

update public.stone_categories
set
  slug = case
    when lower(name) = 'materiais naturais' then 'materiais-naturais'
    when lower(name) = 'dekton' then 'dekton'
    when lower(name) = 'silestone' then 'silestone'
    when lower(name) = 'neolith' then 'neolith'
    when lower(name) = 'outros' then 'outros'
    else concat(
      trim(both '-' from lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))),
      '-',
      left(id::text, 8)
    )
  end,
  sort_order = case
    when lower(name) = 'materiais naturais' then 1
    when lower(name) = 'dekton' then 2
    when lower(name) = 'silestone' then 3
    when lower(name) = 'neolith' then 4
    when lower(name) = 'outros' then 99
    else sort_order
  end
where slug is null
   or slug = '';

alter table public.stone_categories
  alter column slug set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stone_categories_company_id_slug_key'
      and conrelid = 'public.stone_categories'::regclass
  ) then
    alter table public.stone_categories
      add constraint stone_categories_company_id_slug_key unique (company_id, slug);
  end if;
end
$$;

insert into public.stone_categories (company_id, name, slug, sort_order, active)
select
  companies.id,
  defaults.name,
  defaults.slug,
  defaults.sort_order,
  true
from public.companies
cross join (
  values
    ('Materiais Naturais', 'materiais-naturais', 1),
    ('Dekton', 'dekton', 2),
    ('Silestone', 'silestone', 3),
    ('Neolith', 'neolith', 4),
    ('Outros', 'outros', 99)
) as defaults(name, slug, sort_order)
on conflict (company_id, name) do update
set
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  active = true;

drop policy if exists "stone_categories_public_select_active" on public.stone_categories;
drop policy if exists "stone_categories_admin_select_company" on public.stone_categories;
drop policy if exists "stone_categories_admin_insert_company" on public.stone_categories;
drop policy if exists "stone_categories_admin_update_company" on public.stone_categories;

create policy "stone_categories_public_select_active"
on public.stone_categories
for select
to anon, authenticated
using (
  active is true
  and exists (
    select 1
    from public.companies as c
    where c.id = stone_categories.company_id
      and c.active is true
  )
);

create policy "stone_categories_admin_select_company"
on public.stone_categories
for select
to authenticated
using (public.is_active_company_member(company_id));

create policy "stone_categories_admin_insert_company"
on public.stone_categories
for insert
to authenticated
with check (public.is_active_company_member(company_id));

create policy "stone_categories_admin_update_company"
on public.stone_categories
for update
to authenticated
using (public.is_active_company_member(company_id))
with check (public.is_active_company_member(company_id));
