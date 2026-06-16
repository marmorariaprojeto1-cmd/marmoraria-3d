alter table public.companies
  add column if not exists custom_domain text;

create unique index if not exists companies_custom_domain_unique_idx
on public.companies (lower(custom_domain))
where custom_domain is not null;

comment on column public.companies.custom_domain
is 'Dominio proprio usado para resolver o site publico da empresa.';

drop function if exists public.create_company_with_default_catalog(
  text,
  text,
  text,
  text,
  text,
  boolean
);

create or replace function public.create_company_with_default_catalog(
  p_name text,
  p_slug text,
  p_whatsapp text default null,
  p_email text default null,
  p_city text default null,
  p_active boolean default true,
  p_custom_domain text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_model_company_id constant uuid := '72d157c3-8164-4d8d-a96e-b33fa826d09a';
  v_slug text;
begin
  if not public.current_user_is_superadmin() then
    raise exception 'Acesso não autorizado.';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'Nome da empresa é obrigatório.';
  end if;

  v_slug := trim(both '-' from lower(regexp_replace(coalesce(p_slug, ''), '[^a-zA-Z0-9]+', '-', 'g')));

  if nullif(v_slug, '') is null then
    raise exception 'Slug é obrigatório.';
  end if;

  insert into public.companies (
    name,
    slug,
    whatsapp,
    email,
    city,
    active,
    custom_domain
  )
  values (
    trim(p_name),
    v_slug,
    nullif(trim(coalesce(p_whatsapp, '')), ''),
    nullif(trim(coalesce(p_email, '')), ''),
    nullif(trim(coalesce(p_city, '')), ''),
    coalesce(p_active, true),
    nullif(lower(trim(coalesce(p_custom_domain, ''))), '')
  )
  returning id into v_company_id;

  if not exists (
    select 1 from public.stone_categories where company_id = v_company_id
  ) then
    insert into public.stone_categories (
      company_id,
      name,
      slug,
      sort_order,
      active
    )
    select
      v_company_id,
      sc.name,
      sc.slug,
      sc.sort_order,
      sc.active
    from public.stone_categories as sc
    where sc.company_id = v_model_company_id
    order by sc.sort_order asc, sc.name asc
    on conflict do nothing;
  end if;

  if not exists (
    select 1 from public.stones where company_id = v_company_id
  ) then
    insert into public.stones (
      company_id,
      category_id,
      name,
      image_url,
      price_per_m2,
      active
    )
    select
      v_company_id,
      target_category.id,
      source_stone.name,
      source_stone.image_url,
      source_stone.price_per_m2,
      source_stone.active
    from public.stones as source_stone
    left join public.stone_categories as source_category
      on source_category.id = source_stone.category_id
    left join public.stone_categories as target_category
      on target_category.company_id = v_company_id
      and (
        target_category.slug = source_category.slug
        or (
          source_category.slug is null
          and target_category.name = source_category.name
        )
      )
    where source_stone.company_id = v_model_company_id
    order by source_stone.name asc
    on conflict do nothing;
  end if;

  if not exists (
    select 1 from public.sinks where company_id = v_company_id
  ) then
    insert into public.sinks (
      company_id,
      name,
      category,
      price,
      active
    )
    select
      v_company_id,
      s.name,
      s.category,
      s.price,
      s.active
    from public.sinks as s
    where s.company_id = v_model_company_id
    order by s.name asc
    on conflict do nothing;
  end if;

  if not exists (
    select 1 from public.cutouts where company_id = v_company_id
  ) then
    insert into public.cutouts (
      company_id,
      name,
      price,
      active
    )
    select
      v_company_id,
      c.name,
      c.price,
      c.active
    from public.cutouts as c
    where c.company_id = v_model_company_id
    order by c.name asc
    on conflict do nothing;
  end if;

  if not exists (
    select 1 from public.drillings where company_id = v_company_id
  ) then
    insert into public.drillings (
      company_id,
      name,
      price,
      active
    )
    select
      v_company_id,
      d.name,
      d.price,
      d.active
    from public.drillings as d
    where d.company_id = v_model_company_id
    order by d.name asc
    on conflict do nothing;
  end if;

  return v_company_id;
end;
$$;

revoke all on function public.create_company_with_default_catalog(
  text,
  text,
  text,
  text,
  text,
  boolean,
  text
) from public;

grant execute on function public.create_company_with_default_catalog(
  text,
  text,
  text,
  text,
  text,
  boolean,
  text
) to authenticated;
