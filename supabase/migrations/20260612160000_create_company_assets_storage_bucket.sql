-- Storage bucket for company-owned public assets.
-- Scope for this sprint: stone images uploaded from Admin > Pedras.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'company-assets',
  'company-assets',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "company_assets_public_select" on storage.objects;
drop policy if exists "company_assets_company_insert" on storage.objects;
drop policy if exists "company_assets_company_update" on storage.objects;
drop policy if exists "company_assets_company_delete" on storage.objects;

create policy "company_assets_public_select"
on storage.objects
for select
to public
using (bucket_id = 'company-assets');

create policy "company_assets_company_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'company-assets'
  and (storage.foldername(name))[1] = public.current_user_company_id()::text
  and (storage.foldername(name))[2] = 'stones'
);

create policy "company_assets_company_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'company-assets'
  and (storage.foldername(name))[1] = public.current_user_company_id()::text
  and (storage.foldername(name))[2] = 'stones'
)
with check (
  bucket_id = 'company-assets'
  and (storage.foldername(name))[1] = public.current_user_company_id()::text
  and (storage.foldername(name))[2] = 'stones'
);

create policy "company_assets_company_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'company-assets'
  and (storage.foldername(name))[1] = public.current_user_company_id()::text
  and (storage.foldername(name))[2] = 'stones'
);
