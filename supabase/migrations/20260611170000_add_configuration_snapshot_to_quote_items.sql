-- Adds structured 3D configurator snapshots without changing the existing quote RPC.

alter table public.quote_items
  add column if not exists configuration_snapshot jsonb;

comment on column public.quote_items.configuration_snapshot
is 'Snapshot estruturado da configuracao 3D enviada pelo configurador no momento do pedido.';

create or replace function public.create_3d_quote_with_item(
  p_company_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text default null,
  p_city text default null,
  p_total_price numeric default 0,
  p_configuration_snapshot jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quote_id uuid;
  v_width numeric;
  v_depth numeric;
  v_thickness numeric;
begin
  if not exists (
    select 1
    from public.companies as c
    where c.id = p_company_id
      and c.active is true
  ) then
    raise exception 'company_id must reference an active company';
  end if;

  if nullif(trim(p_customer_name), '') is null then
    raise exception 'customer_name is required';
  end if;

  if nullif(trim(p_customer_phone), '') is null then
    raise exception 'customer_phone is required';
  end if;

  if p_total_price is null or p_total_price < 0 then
    raise exception 'total_price must be non-negative';
  end if;

  if p_configuration_snapshot is null
    or jsonb_typeof(p_configuration_snapshot) <> 'object'
  then
    raise exception 'configuration_snapshot must be a JSON object';
  end if;

  v_width := nullif(p_configuration_snapshot #>> '{countertop,width}', '')::numeric;
  v_depth := nullif(p_configuration_snapshot #>> '{countertop,depth}', '')::numeric;
  v_thickness := nullif(p_configuration_snapshot #>> '{countertop,thickness}', '')::numeric;

  if v_width is null or v_width <= 0 then
    raise exception 'configuration_snapshot.countertop.width must be positive';
  end if;

  if v_depth is null or v_depth <= 0 then
    raise exception 'configuration_snapshot.countertop.depth must be positive';
  end if;

  if v_thickness is null or v_thickness <= 0 then
    raise exception 'configuration_snapshot.countertop.thickness must be positive';
  end if;

  insert into public.quotes (
    company_id,
    customer_name,
    customer_phone,
    customer_email,
    city,
    status,
    total_price
  )
  values (
    p_company_id,
    trim(p_customer_name),
    trim(p_customer_phone),
    nullif(trim(coalesce(p_customer_email, '')), ''),
    nullif(trim(coalesce(p_city, '')), ''),
    'submitted',
    p_total_price
  )
  returning id into v_quote_id;

  insert into public.quote_items (
    company_id,
    quote_id,
    width,
    depth,
    thickness,
    quantity,
    unit_price,
    total_price,
    configuration_snapshot
  )
  values (
    p_company_id,
    v_quote_id,
    v_width,
    v_depth,
    v_thickness,
    1,
    p_total_price,
    p_total_price,
    p_configuration_snapshot
  );

  return v_quote_id;
end;
$$;

revoke all on function public.create_3d_quote_with_item(
  uuid,
  text,
  text,
  text,
  text,
  numeric,
  jsonb
) from public;

grant execute on function public.create_3d_quote_with_item(
  uuid,
  text,
  text,
  text,
  text,
  numeric,
  jsonb
) to anon, authenticated;
