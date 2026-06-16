-- Allow company-owned logo and home hero uploads in the existing asset bucket.
-- Scope for this sprint: Admin > Configuracoes uploads for companies.logo_url
-- and companies.home_image_url.

update storage.buckets
set
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'company-assets';

drop policy if exists "company_assets_company_insert" on storage.objects;
drop policy if exists "company_assets_company_update" on storage.objects;
drop policy if exists "company_assets_company_delete" on storage.objects;

create policy "company_assets_company_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'company-assets'
  and (storage.foldername(name))[1] = public.current_user_company_id()::text
  and (storage.foldername(name))[2] in ('stones', 'logos', 'home')
);

create policy "company_assets_company_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'company-assets'
  and (storage.foldername(name))[1] = public.current_user_company_id()::text
  and (storage.foldername(name))[2] in ('stones', 'logos', 'home')
)
with check (
  bucket_id = 'company-assets'
  and (storage.foldername(name))[1] = public.current_user_company_id()::text
  and (storage.foldername(name))[2] in ('stones', 'logos', 'home')
);

create policy "company_assets_company_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'company-assets'
  and (storage.foldername(name))[1] = public.current_user_company_id()::text
  and (storage.foldername(name))[2] in ('stones', 'logos', 'home')
);
