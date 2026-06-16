-- Superadmin read-only access for platform visibility.
-- Scope: role constraint, helper function, and SELECT-only global RLS policies.

alter table public.users
  drop constraint if exists users_role_check;

alter table public.users
  add constraint users_role_check
  check (role in ('owner', 'manager', 'salesperson', 'superadmin'));

create or replace function public.current_user_is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users as u
    where lower(u.email) = lower(coalesce(auth.jwt()->>'email', ''))
      and u.role = 'superadmin'
      and u.active is true
  )
$$;

revoke all on function public.current_user_is_superadmin() from public;
grant execute on function public.current_user_is_superadmin() to authenticated;

drop policy if exists "companies_superadmin_select_all" on public.companies;
drop policy if exists "users_superadmin_select_all" on public.users;
drop policy if exists "quotes_superadmin_select_all" on public.quotes;
drop policy if exists "quote_items_superadmin_select_all" on public.quote_items;
drop policy if exists "stones_superadmin_select_all" on public.stones;
drop policy if exists "sinks_superadmin_select_all" on public.sinks;
drop policy if exists "cutouts_superadmin_select_all" on public.cutouts;
drop policy if exists "drillings_superadmin_select_all" on public.drillings;
drop policy if exists "stone_categories_superadmin_select_all" on public.stone_categories;

create policy "companies_superadmin_select_all"
on public.companies
for select
to authenticated
using (public.current_user_is_superadmin());

create policy "users_superadmin_select_all"
on public.users
for select
to authenticated
using (public.current_user_is_superadmin());

create policy "quotes_superadmin_select_all"
on public.quotes
for select
to authenticated
using (public.current_user_is_superadmin());

create policy "quote_items_superadmin_select_all"
on public.quote_items
for select
to authenticated
using (public.current_user_is_superadmin());

create policy "stones_superadmin_select_all"
on public.stones
for select
to authenticated
using (public.current_user_is_superadmin());

create policy "sinks_superadmin_select_all"
on public.sinks
for select
to authenticated
using (public.current_user_is_superadmin());

create policy "cutouts_superadmin_select_all"
on public.cutouts
for select
to authenticated
using (public.current_user_is_superadmin());

create policy "drillings_superadmin_select_all"
on public.drillings
for select
to authenticated
using (public.current_user_is_superadmin());

create policy "stone_categories_superadmin_select_all"
on public.stone_categories
for select
to authenticated
using (public.current_user_is_superadmin());
