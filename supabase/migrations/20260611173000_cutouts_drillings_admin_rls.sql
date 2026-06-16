-- RLS policies for configurable technical services used by the 3D configurator.
-- Scope: cutouts and drillings only.

create policy "cutouts_public_select_active"
on public.cutouts
for select
to anon, authenticated
using (
  active is true
  and exists (
    select 1
    from public.companies as c
    where c.id = cutouts.company_id
      and c.active is true
  )
);

create policy "cutouts_admin_select_company"
on public.cutouts
for select
to authenticated
using (public.is_active_company_member(company_id));

create policy "cutouts_admin_insert_company"
on public.cutouts
for insert
to authenticated
with check (public.is_active_company_member(company_id));

create policy "cutouts_admin_update_company"
on public.cutouts
for update
to authenticated
using (public.is_active_company_member(company_id))
with check (public.is_active_company_member(company_id));

create policy "drillings_public_select_active"
on public.drillings
for select
to anon, authenticated
using (
  active is true
  and exists (
    select 1
    from public.companies as c
    where c.id = drillings.company_id
      and c.active is true
  )
);

create policy "drillings_admin_select_company"
on public.drillings
for select
to authenticated
using (public.is_active_company_member(company_id));

create policy "drillings_admin_insert_company"
on public.drillings
for insert
to authenticated
with check (public.is_active_company_member(company_id));

create policy "drillings_admin_update_company"
on public.drillings
for update
to authenticated
using (public.is_active_company_member(company_id))
with check (public.is_active_company_member(company_id));
