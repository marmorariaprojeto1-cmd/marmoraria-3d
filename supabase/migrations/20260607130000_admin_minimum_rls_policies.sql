-- Minimum RLS policies for the current admin MVP.
-- Scope: users, companies, products, stones, sinks, finishes, quotes, quote_items.
-- The current authentication bridge uses public.users.email matched to auth.jwt()->>'email'.

create or replace function public.current_user_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.company_id
  from public.users as u
  join public.companies as c on c.id = u.company_id
  where lower(u.email) = lower(coalesce(auth.jwt()->>'email', ''))
    and u.active is true
    and c.active is true
  order by u.created_at asc
  limit 1
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public.users as u
  join public.companies as c on c.id = u.company_id
  where lower(u.email) = lower(coalesce(auth.jwt()->>'email', ''))
    and u.active is true
    and c.active is true
  order by u.created_at asc
  limit 1
$$;

create or replace function public.is_active_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users as u
    join public.companies as c on c.id = u.company_id
    where u.company_id = target_company_id
      and lower(u.email) = lower(coalesce(auth.jwt()->>'email', ''))
      and u.active is true
      and c.active is true
  )
$$;

create or replace function public.is_active_company_quote(
  target_company_id uuid,
  target_quote_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.quotes as q
    join public.companies as c on c.id = q.company_id
    where q.id = target_quote_id
      and q.company_id = target_company_id
      and c.active is true
  )
$$;

revoke all on function public.current_user_company_id() from public;
revoke all on function public.current_user_role() from public;
revoke all on function public.is_active_company_member(uuid) from public;
revoke all on function public.is_active_company_quote(uuid, uuid) from public;

grant execute on function public.current_user_company_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_active_company_member(uuid) to authenticated;
grant execute on function public.is_active_company_quote(uuid, uuid) to anon, authenticated;

create policy "users_select_own_active_profile"
on public.users
for select
to authenticated
using (
  active is true
  and lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
);

create policy "users_select_company_profiles_for_owner_manager"
on public.users
for select
to authenticated
using (
  company_id = public.current_user_company_id()
  and public.current_user_role() in ('owner', 'manager')
);

create policy "companies_public_select_active"
on public.companies
for select
to anon, authenticated
using (active is true);

create policy "companies_select_own_company"
on public.companies
for select
to authenticated
using (id = public.current_user_company_id());

create policy "companies_update_own_company_for_owner_manager"
on public.companies
for update
to authenticated
using (
  id = public.current_user_company_id()
  and public.current_user_role() in ('owner', 'manager')
)
with check (
  id = public.current_user_company_id()
  and public.current_user_role() in ('owner', 'manager')
);

create policy "products_public_select_active"
on public.products
for select
to anon, authenticated
using (
  active is true
  and exists (
    select 1
    from public.companies as c
    where c.id = products.company_id
      and c.active is true
  )
);

create policy "products_admin_select_company"
on public.products
for select
to authenticated
using (public.is_active_company_member(company_id));

create policy "products_admin_insert_company"
on public.products
for insert
to authenticated
with check (public.is_active_company_member(company_id));

create policy "products_admin_update_company"
on public.products
for update
to authenticated
using (public.is_active_company_member(company_id))
with check (public.is_active_company_member(company_id));

create policy "stones_public_select_active"
on public.stones
for select
to anon, authenticated
using (
  active is true
  and exists (
    select 1
    from public.companies as c
    where c.id = stones.company_id
      and c.active is true
  )
);

create policy "stones_admin_select_company"
on public.stones
for select
to authenticated
using (public.is_active_company_member(company_id));

create policy "stones_admin_insert_company"
on public.stones
for insert
to authenticated
with check (public.is_active_company_member(company_id));

create policy "stones_admin_update_company"
on public.stones
for update
to authenticated
using (public.is_active_company_member(company_id))
with check (public.is_active_company_member(company_id));

create policy "sinks_public_select_active"
on public.sinks
for select
to anon, authenticated
using (
  active is true
  and exists (
    select 1
    from public.companies as c
    where c.id = sinks.company_id
      and c.active is true
  )
);

create policy "sinks_admin_select_company"
on public.sinks
for select
to authenticated
using (public.is_active_company_member(company_id));

create policy "sinks_admin_insert_company"
on public.sinks
for insert
to authenticated
with check (public.is_active_company_member(company_id));

create policy "sinks_admin_update_company"
on public.sinks
for update
to authenticated
using (public.is_active_company_member(company_id))
with check (public.is_active_company_member(company_id));

create policy "finishes_public_select_active"
on public.finishes
for select
to anon, authenticated
using (
  active is true
  and exists (
    select 1
    from public.companies as c
    where c.id = finishes.company_id
      and c.active is true
  )
);

create policy "finishes_admin_select_company"
on public.finishes
for select
to authenticated
using (public.is_active_company_member(company_id));

create policy "finishes_admin_insert_company"
on public.finishes
for insert
to authenticated
with check (public.is_active_company_member(company_id));

create policy "finishes_admin_update_company"
on public.finishes
for update
to authenticated
using (public.is_active_company_member(company_id))
with check (public.is_active_company_member(company_id));

create policy "quotes_admin_select_company"
on public.quotes
for select
to authenticated
using (public.is_active_company_member(company_id));

create policy "quotes_admin_update_company"
on public.quotes
for update
to authenticated
using (public.is_active_company_member(company_id))
with check (public.is_active_company_member(company_id));

create policy "quotes_public_insert_active_company"
on public.quotes
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.companies as c
    where c.id = quotes.company_id
      and c.active is true
  )
);

create policy "quote_items_admin_select_company"
on public.quote_items
for select
to authenticated
using (public.is_active_company_member(company_id));

create policy "quote_items_public_insert_for_company_quote"
on public.quote_items
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.companies as c
    where c.id = quote_items.company_id
      and c.active is true
  )
  and public.is_active_company_quote(quote_items.company_id, quote_items.quote_id)
  and (
    quote_items.product_id is null
    or exists (
      select 1
      from public.products as p
      where p.id = quote_items.product_id
        and p.company_id = quote_items.company_id
        and p.active is true
    )
  )
  and (
    quote_items.stone_id is null
    or exists (
      select 1
      from public.stones as s
      where s.id = quote_items.stone_id
        and s.company_id = quote_items.company_id
        and s.active is true
    )
  )
  and (
    quote_items.sink_id is null
    or exists (
      select 1
      from public.sinks as si
      where si.id = quote_items.sink_id
        and si.company_id = quote_items.company_id
        and si.active is true
    )
  )
  and (
    quote_items.finish_id is null
    or exists (
      select 1
      from public.finishes as f
      where f.id = quote_items.finish_id
        and f.company_id = quote_items.company_id
        and f.active is true
    )
  )
);
