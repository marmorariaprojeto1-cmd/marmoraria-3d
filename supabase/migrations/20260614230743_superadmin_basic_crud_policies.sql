-- Superadmin basic CRUD policies.
-- Scope: companies and users only. No DELETE policies are created.

drop policy if exists "companies_superadmin_insert" on public.companies;
drop policy if exists "companies_superadmin_update" on public.companies;
drop policy if exists "users_superadmin_insert" on public.users;
drop policy if exists "users_superadmin_update" on public.users;

create policy "companies_superadmin_insert"
on public.companies
for insert
to authenticated
with check (public.current_user_is_superadmin());

create policy "companies_superadmin_update"
on public.companies
for update
to authenticated
using (public.current_user_is_superadmin())
with check (public.current_user_is_superadmin());

create policy "users_superadmin_insert"
on public.users
for insert
to authenticated
with check (
  public.current_user_is_superadmin()
  and role in ('owner', 'manager', 'salesperson')
);

create policy "users_superadmin_update"
on public.users
for update
to authenticated
using (public.current_user_is_superadmin())
with check (
  public.current_user_is_superadmin()
  and role in ('owner', 'manager', 'salesperson')
);
