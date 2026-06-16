import { FormEvent, useCallback, useEffect, useState } from 'react';
import { resolveUserCompanyId } from '../../admin/company';
import { useAuth } from '../../auth/useAuth';
import { supabase } from '../../lib/supabase';

type Company = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  home_title: string | null;
  home_subtitle: string | null;
  home_image_url: string | null;
  state: string | null;
  active: boolean;
  created_at: string;
};

type CompanyFormState = {
  name: string;
  slug: string;
  logoUrl: string;
  whatsapp: string;
  email: string;
  city: string;
  homeTitle: string;
  homeSubtitle: string;
  homeImageUrl: string;
  state: string;
  active: boolean;
};

const COMPANY_ASSET_BUCKET = 'company-assets';
const MAX_LOGO_IMAGE_SIZE = 1 * 1024 * 1024;
const MAX_HOME_IMAGE_SIZE = 3 * 1024 * 1024;
const COMPANY_ASSET_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const emptyForm: CompanyFormState = {
  name: '',
  slug: '',
  logoUrl: '',
  whatsapp: '',
  email: '',
  city: '',
  homeTitle: '',
  homeSubtitle: '',
  homeImageUrl: '',
  state: '',
  active: true,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function createFormFromCompany(company: Company): CompanyFormState {
  return {
    name: company.name,
    slug: company.slug,
    logoUrl: company.logo_url ?? '',
    whatsapp: company.whatsapp ?? '',
    email: company.email ?? '',
    city: company.city ?? '',
    homeTitle: company.home_title ?? '',
    homeSubtitle: company.home_subtitle ?? '',
    homeImageUrl: company.home_image_url ?? '',
    state: company.state ?? '',
    active: company.active,
  };
}

function formatSummaryValue(value: string | null | undefined, fallback = 'Não informado') {
  return value?.trim() || fallback;
}

function formatConfiguredValue(value: string | null | undefined) {
  return value?.trim() ? 'Configurada' : 'Não informada';
}

function sanitizeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildCompanyAssetPath(
  companyId: string,
  folder: 'logos' | 'home',
  file: File,
) {
  const safeName = sanitizeFileName(file.name) || 'company-asset';
  return `${companyId}/${folder}/${crypto.randomUUID()}-${safeName}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro desconhecido.';
}

export function CompanySettingsPage() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHomeImage, setUploadingHomeImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadCompany = useCallback(async (nextCompanyId: string) => {
    const { data, error } = await supabase
      .from('companies')
      .select(
        'id, name, slug, logo_url, whatsapp, email, city, home_title, home_subtitle, home_image_url, state, active, created_at',
      )
      .eq('id', nextCompanyId)
      .maybeSingle<Company>();

    if (error) {
      throw error;
    }

    setCompany(data ?? null);
    setForm(data ? createFormFromCompany(data) : emptyForm);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCompanySettings() {
      if (!user) {
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const nextCompanyId = await resolveUserCompanyId(user);

        if (!mounted) {
          return;
        }

        setCompanyId(nextCompanyId);

        if (nextCompanyId) {
          await loadCompany(nextCompanyId);
        }
      } catch {
        if (mounted) {
          setErrorMessage(
            'Não foi possível carregar as configurações da empresa. Verifique as permissões do Supabase.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadCompanySettings();

    return () => {
      mounted = false;
    };
  }, [loadCompany, user]);

  function updateForm(field: keyof CompanyFormState, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    if (company) {
      setForm(createFormFromCompany(company));
    }
    setErrorMessage('');
    setSuccessMessage('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!companyId || !company) {
      setErrorMessage(
        'Usuário autenticado sem empresa vinculada. Configure o vínculo em public.users antes de editar as configurações.',
      );
      return;
    }

    if (!form.name.trim()) {
      setErrorMessage('Informe o nome da empresa.');
      return;
    }

    if (!form.slug.trim()) {
      setErrorMessage('Informe o slug da empresa.');
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      logo_url: form.logoUrl.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      city: form.city.trim() || null,
      home_title: form.homeTitle.trim() || null,
      home_subtitle: form.homeSubtitle.trim() || null,
      home_image_url: form.homeImageUrl.trim() || null,
      state: form.state.trim() || null,
      active: form.active,
    };

    try {
      const { data, error } = await supabase
        .from('companies')
        .update(payload)
        .eq('id', companyId)
        .select(
          'id, name, slug, logo_url, whatsapp, email, city, home_title, home_subtitle, home_image_url, state, active, created_at',
        )
        .single<Company>();

      if (error) {
        throw error;
      }

      setCompany(data);
      setForm(createFormFromCompany(data));
      setSuccessMessage('Configurações da empresa atualizadas com sucesso.');
    } catch {
      setErrorMessage(
        'Não foi possível salvar as configurações. Verifique os dados, o slug e as permissões.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCompanyAssetUpload(
    kind: 'logo' | 'homeImage',
    file: File | null,
  ) {
    setErrorMessage('');
    setSuccessMessage('');

    if (!file) {
      return;
    }

    if (!companyId || !company) {
      setErrorMessage(
        'Usuário autenticado sem empresa vinculada. Não foi possível enviar a imagem.',
      );
      return;
    }

    if (!COMPANY_ASSET_MIME_TYPES.includes(file.type)) {
      setErrorMessage('Envie uma imagem PNG, JPG, JPEG ou WebP.');
      return;
    }

    const isLogo = kind === 'logo';
    const maxSize = isLogo ? MAX_LOGO_IMAGE_SIZE : MAX_HOME_IMAGE_SIZE;

    if (file.size > maxSize) {
      setErrorMessage(
        isLogo
          ? 'A logo deve ter no máximo 1MB.'
          : 'A imagem principal deve ter no máximo 3MB.',
      );
      return;
    }

    if (isLogo) {
      setUploadingLogo(true);
    } else {
      setUploadingHomeImage(true);
    }

    try {
      const field = isLogo ? 'logoUrl' : 'homeImageUrl';
      const column = isLogo ? 'logo_url' : 'home_image_url';
      const folder = isLogo ? 'logos' : 'home';
      const filePath = buildCompanyAssetPath(companyId, folder, file);

      const { error: uploadError } = await supabase.storage
        .from(COMPANY_ASSET_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(COMPANY_ASSET_BUCKET)
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update({ [column]: publicUrl })
        .eq('id', companyId)
        .select(
          'id, name, slug, logo_url, whatsapp, email, city, home_title, home_subtitle, home_image_url, state, active, created_at',
        )
        .single<Company>();

      if (updateError) {
        throw updateError;
      }

      setCompany(updatedCompany);
      setForm((current) => ({
        ...current,
        [field]: publicUrl,
      }));
      setSuccessMessage(
        isLogo
          ? 'Logo enviada e salva nas configurações.'
          : 'Imagem principal enviada e salva nas configurações.',
      );
    } catch (error) {
      setErrorMessage(
        `Não foi possível enviar a imagem. Verifique o bucket e as permissões do Storage. Detalhe: ${getErrorMessage(error)}`,
      );
    } finally {
      if (isLogo) {
        setUploadingLogo(false);
      } else {
        setUploadingHomeImage(false);
      }
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <p className="admin-page-kicker">Empresa</p>
        <h1 className="admin-page-title">
          Configurações da empresa
        </h1>
        <p className="admin-page-description">
          Edite os dados públicos e operacionais da marmoraria vinculada ao
          usuário autenticado. O vínculo multiempresa não pode ser alterado por
          esta tela.
        </p>
      </div>

      {!companyId && !loading && (
        <div className="message-warning">
          Nenhuma empresa foi vinculada ao usuário autenticado. Para preservar a
          arquitetura multiempresa, as configurações ficam bloqueadas até existir
          um vínculo ativo em public.users com o mesmo e-mail do login.
        </div>
      )}

      {errorMessage && (
        <div className="message-error">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="message-success">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="surface-card p-5 text-stone-700">
          Carregando configurações...
        </div>
      ) : !company ? (
        <div className="surface-card p-5 text-stone-700">
          Empresa não encontrada para o usuário autenticado.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form
            className="surface-card space-y-5 p-5"
            onSubmit={handleSubmit}
          >
            <div>
              <h2 className="text-lg font-semibold text-graphite">
                Dados da marmoraria
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Edite os dados públicos da empresa e envie os ativos usados na
                Home.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase text-stone-500">
                Dados da empresa
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Nome"
                  value={form.name}
                  onChange={(value) => updateForm('name', value)}
                  required
                />
                <TextField
                  label="Slug"
                  value={form.slug}
                  onChange={(value) => updateForm('slug', value)}
                  required
                />
                <TextField
                  label="Logo URL"
                  value={form.logoUrl}
                  onChange={(value) => updateForm('logoUrl', value)}
                />
                <AssetUploadField
                  className="sm:col-span-2"
                  label="Logo"
                  description="PNG, JPG, JPEG ou WebP até 1MB."
                  imageUrl={form.logoUrl}
                  placeholder="Logo não configurada"
                  uploading={uploadingLogo}
                  onUpload={(file) => handleCompanyAssetUpload('logo', file)}
                  previewClassName="h-24 max-w-[220px] object-contain"
                />
                <TextField
                  label="WhatsApp"
                  value={form.whatsapp}
                  onChange={(value) => updateForm('whatsapp', value)}
                />
                <TextField
                  label="E-mail"
                  type="email"
                  value={form.email}
                  onChange={(value) => updateForm('email', value)}
                />
                <TextField
                  label="Cidade"
                  value={form.city}
                  onChange={(value) => updateForm('city', value)}
                />
                <TextField
                  label="Estado"
                  value={form.state}
                  onChange={(value) => updateForm('state', value)}
                />
                <label className="flex items-center gap-3 rounded-md border border-stoneLine bg-white px-3 py-3 shadow-sm">
                  <input
                    className="h-4 w-4 accent-graphite"
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => updateForm('active', event.target.checked)}
                  />
                  <span className="text-sm font-medium text-stone-700">
                    Empresa ativa
                  </span>
                </label>
              </div>
            </div>

            <div className="border-t border-stoneLine pt-5">
              <p className="text-sm font-semibold uppercase text-stone-500">
                Site/Home
              </p>
              <p className="mt-1 text-sm text-stone-600">
                Campos usados na Home pública da marmoraria.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Título da Home"
                  value={form.homeTitle}
                  onChange={(value) => updateForm('homeTitle', value)}
                />
                <TextField
                  label="Subtítulo da Home"
                  value={form.homeSubtitle}
                  onChange={(value) => updateForm('homeSubtitle', value)}
                />
                <TextField
                  label="URL da imagem principal"
                  type="url"
                  value={form.homeImageUrl}
                  onChange={(value) => updateForm('homeImageUrl', value)}
                  className="sm:col-span-2"
                />
                <AssetUploadField
                  className="sm:col-span-2"
                  label="Imagem principal da Home"
                  description="PNG, JPG, JPEG ou WebP até 3MB."
                  imageUrl={form.homeImageUrl}
                  placeholder="Imagem principal não configurada"
                  uploading={uploadingHomeImage}
                  onUpload={(file) =>
                    handleCompanyAssetUpload('homeImage', file)
                  }
                  previewClassName="aspect-[16/9] w-full object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="primary-button"
                type="submit"
                disabled={saving || !companyId}
              >
                {saving ? 'Salvando...' : 'Salvar configurações'}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Descartar alterações
              </button>
            </div>
          </form>

          <aside className="space-y-4">
            <div className="surface-card space-y-4 p-5">
              <div>
                <p className="text-sm font-semibold uppercase text-moss">
                  Resumo
                </p>
                <h2 className="mt-1 text-xl font-bold text-graphite">
                  {company.name}
                </h2>
              </div>
              <SummaryRow label="Slug" value={company.slug} />
              <SummaryRow
                label="WhatsApp"
                value={company.whatsapp ?? 'Não informado'}
              />
              <SummaryRow label="E-mail" value={company.email ?? 'Não informado'} />
              <SummaryRow
                label="Cidade"
                value={company.city ?? 'Não informada'}
              />
              <SummaryRow
                label="Estado"
                value={company.state ?? 'Não informado'}
              />
              <SummaryRow
                label="Título da Home"
                value={formatSummaryValue(company.home_title)}
              />
              <SummaryRow
                label="Subtítulo da Home"
                value={formatSummaryValue(company.home_subtitle)}
              />
              <SummaryRow
                label="Imagem principal"
                value={formatConfiguredValue(company.home_image_url)}
              />
              <SummaryRow
                label="Logo"
                value={formatConfiguredValue(company.logo_url)}
              />
              <SummaryRow label="Status" value={company.active ? 'Ativa' : 'Inativa'} />
              <SummaryRow label="Criada em" value={formatDate(company.created_at)} />
            </div>

            <div className="surface-card space-y-4 p-5">
              <div>
                <p className="text-sm font-semibold uppercase text-moss">
                  Prévia da Home
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  Visualização simples dos campos da Home.
                </p>
              </div>
              <div className="rounded-md border border-stoneLine bg-stone-50 p-4">
                {form.logoUrl.trim() ? (
                  <img
                    alt="Logo configurada"
                    className="mb-3 max-h-12 max-w-[160px] object-contain"
                    src={form.logoUrl}
                  />
                ) : (
                  <p className="mb-3 text-sm font-bold text-graphite">
                    {formatSummaryValue(form.name, 'Nome da empresa')}
                  </p>
                )}
                <h3 className="text-lg font-bold leading-tight text-graphite">
                  {formatSummaryValue(form.homeTitle, 'Título da Home')}
                </h3>
                <p className="mt-2 text-sm leading-5 text-stone-600">
                  {formatSummaryValue(form.homeSubtitle, 'Subtítulo da Home')}
                </p>
                {form.homeImageUrl.trim() ? (
                  <img
                    alt="Imagem principal configurada"
                    className="mt-4 aspect-[4/3] w-full rounded-md border border-stoneLine object-cover"
                    src={form.homeImageUrl}
                  />
                ) : (
                  <div className="mt-4 flex aspect-[4/3] w-full items-center justify-center rounded-md border border-dashed border-stoneLine bg-white px-4 text-center text-sm font-medium text-stone-500">
                    Imagem principal não configurada
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function AssetUploadField({
  className = '',
  description,
  imageUrl,
  label,
  onUpload,
  placeholder,
  previewClassName,
  uploading,
}: {
  className?: string;
  description: string;
  imageUrl: string;
  label: string;
  onUpload: (file: File | null) => void;
  placeholder: string;
  previewClassName: string;
  uploading: boolean;
}) {
  return (
    <div
      className={[
        'rounded-md border border-stoneLine bg-white p-4 shadow-sm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-700">{label}</p>
          <p className="text-sm text-stone-600">{description}</p>
          <input
            className="field-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={uploading}
            onChange={(event) => {
              onUpload(event.target.files?.[0] ?? null);
              event.target.value = '';
            }}
          />
          {uploading && (
            <p className="text-sm font-medium text-moss">Enviando imagem...</p>
          )}
        </div>
        <div className="flex items-center justify-center rounded-md border border-dashed border-stoneLine bg-stone-50 p-3">
          {imageUrl.trim() ? (
            <img
              alt={`Prévia: ${label}`}
              className={['rounded-md', previewClassName].join(' ')}
              src={imageUrl}
            />
          ) : (
            <p className="px-3 text-center text-sm font-medium text-stone-500">
              {placeholder}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TextField({
  className = '',
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  className?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className={['block space-y-2', className].filter(Boolean).join(' ')}>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="field-input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-stoneLine pt-3 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase text-stone-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-graphite">
        {value}
      </p>
    </div>
  );
}
