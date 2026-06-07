-- Priority 1 quote engine fixes.
-- Adds quote item calculation snapshots and a transactional RPC for quote creation.

alter table public.quote_items
  add column if not exists calculated_area numeric(12, 4),
  add column if not exists stone_price_snapshot numeric(12, 2),
  add column if not exists sink_price_snapshot numeric(12, 2),
  add column if not exists finish_price_snapshot numeric(12, 2),
  add column if not exists thickness_multiplier numeric(6, 2),
  add column if not exists subtotal_snapshot numeric(12, 2),
  add column if not exists total_snapshot numeric(12, 2),
  add column if not exists product_name_snapshot text,
  add column if not exists stone_name_snapshot text,
  add column if not exists sink_name_snapshot text,
  add column if not exists finish_name_snapshot text,
  add column if not exists stone_price_per_m2_snapshot numeric(12, 2),
  add column if not exists sink_unit_price_snapshot numeric(12, 2),
  add column if not exists finish_unit_price_snapshot numeric(12, 2),
  add column if not exists finish_pricing_type_snapshot text;

create or replace function public.create_quote_with_item(
  p_company_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_city text,
  p_status text,
  p_product_id uuid,
  p_stone_id uuid,
  p_sink_id uuid,
  p_finish_id uuid,
  p_width numeric,
  p_depth numeric,
  p_thickness numeric,
  p_quantity integer,
  p_unit_price numeric,
  p_total_price numeric,
  p_calculated_area numeric,
  p_stone_price_snapshot numeric,
  p_sink_price_snapshot numeric,
  p_finish_price_snapshot numeric,
  p_thickness_multiplier numeric,
  p_subtotal_snapshot numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quote_id uuid;
  v_product_name text;
  v_stone_name text;
  v_stone_price_per_m2 numeric(12, 2);
  v_sink_name text;
  v_sink_unit_price numeric(12, 2);
  v_finish_name text;
  v_finish_unit_price numeric(12, 2);
  v_finish_pricing_type text;
begin
  if not exists (
    select 1
    from public.companies as c
    where c.id = p_company_id
      and c.active is true
  ) then
    raise exception 'company_id must reference an active company';
  end if;

  select p.name
  into v_product_name
  from public.products as p
  where p.id = p_product_id
    and p.company_id = p_company_id
    and p.active is true;

  if v_product_name is null then
    raise exception 'product_id must reference an active product from the same company';
  end if;

  select s.name, s.price_per_m2
  into v_stone_name, v_stone_price_per_m2
  from public.stones as s
  where s.id = p_stone_id
    and s.company_id = p_company_id
    and s.active is true;

  if v_stone_name is null then
    raise exception 'stone_id must reference an active stone from the same company';
  end if;

  if p_sink_id is not null then
    select si.name, si.price
    into v_sink_name, v_sink_unit_price
    from public.sinks as si
    where si.id = p_sink_id
      and si.company_id = p_company_id
      and si.active is true;

    if v_sink_name is null then
      raise exception 'sink_id must reference an active sink from the same company';
    end if;
  end if;

  if p_finish_id is not null then
    select f.name, f.price, f.pricing_type
    into v_finish_name, v_finish_unit_price, v_finish_pricing_type
    from public.finishes as f
    where f.id = p_finish_id
      and f.company_id = p_company_id
      and f.active is true;

    if v_finish_name is null then
      raise exception 'finish_id must reference an active finish from the same company';
    end if;
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
    p_customer_name,
    p_customer_phone,
    nullif(p_customer_email, ''),
    nullif(p_city, ''),
    p_status,
    p_total_price
  )
  returning id into v_quote_id;

  insert into public.quote_items (
    company_id,
    quote_id,
    product_id,
    stone_id,
    sink_id,
    finish_id,
    width,
    depth,
    thickness,
    quantity,
    unit_price,
    total_price,
    calculated_area,
    stone_price_snapshot,
    sink_price_snapshot,
    finish_price_snapshot,
    thickness_multiplier,
    subtotal_snapshot,
    total_snapshot,
    product_name_snapshot,
    stone_name_snapshot,
    sink_name_snapshot,
    finish_name_snapshot,
    stone_price_per_m2_snapshot,
    sink_unit_price_snapshot,
    finish_unit_price_snapshot,
    finish_pricing_type_snapshot
  )
  values (
    p_company_id,
    v_quote_id,
    p_product_id,
    p_stone_id,
    p_sink_id,
    p_finish_id,
    p_width,
    p_depth,
    p_thickness,
    p_quantity,
    p_unit_price,
    p_total_price,
    p_calculated_area,
    p_stone_price_snapshot,
    p_sink_price_snapshot,
    p_finish_price_snapshot,
    p_thickness_multiplier,
    p_subtotal_snapshot,
    p_total_price,
    v_product_name,
    v_stone_name,
    v_sink_name,
    v_finish_name,
    v_stone_price_per_m2,
    v_sink_unit_price,
    v_finish_unit_price,
    v_finish_pricing_type
  );

  return v_quote_id;
end;
$$;

revoke all on function public.create_quote_with_item(
  uuid,
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  numeric,
  numeric,
  numeric,
  integer,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric
) from public;

grant execute on function public.create_quote_with_item(
  uuid,
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  numeric,
  numeric,
  numeric,
  integer,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric
) to anon, authenticated;
