alter table public.companies
  add column if not exists home_title text,
  add column if not exists home_subtitle text,
  add column if not exists home_image_url text;

comment on column public.companies.home_title
is 'Titulo principal da Home publica configurado pela marmoraria.';

comment on column public.companies.home_subtitle
is 'Subtitulo da Home publica configurado pela marmoraria.';

comment on column public.companies.home_image_url
is 'URL da imagem principal da Home publica configurada pela marmoraria.';
