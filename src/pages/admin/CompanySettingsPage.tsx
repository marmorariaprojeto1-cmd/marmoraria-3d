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
  state: string;
  active: boolean;
};

const emptyForm: CompanyFormState = {
  name: '',
  slug: '',
  logoUrl: '',
  whatsapp: '',
  email: '',
  city: '',
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
    state: company.state ?? '',
    active: company.active,
  };
}

export function CompanySettingsPage() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadCompany = useCallback(async (nextCompanyId: string) => {
    const { data, error } = await supabase
      .from('companies')
      .select(
        'id, name, slug, logo_url, whatsapp, email, city, state, active, created_at',
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
      state: form.state.trim() || null,
      active: form.active,
    };

    try {
      const { data, error } = await supabase
        .from('companies')
        .update(payload)
        .eq('id', companyId)
        .select(
          'id, name, slug, logo_url, whatsapp, email, city, state, active, created_at',
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

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Empresa</p>
        <h1 className="mt-2 text-3xl font-bold text-graphite">
          Configurações da empresa
        </h1>
        <p className="mt-3 max-w-3xl text-stone-700">
          Edite os dados públicos e operacionais da marmoraria vinculada ao
          usuário autenticado. O vínculo multiempresa não pode ser alterado por
          esta tela.
        </p>
      </div>

      {!companyId && !loading && (
        <div className="rounded-md border border-copper/30 bg-orange-50 p-4 text-sm text-stone-800">
          Nenhuma empresa foi vinculada ao usuário autenticado. Para preservar a
          arquitetura multiempresa, as configurações ficam bloqueadas até existir
          um vínculo ativo em public.users com o mesmo e-mail do login.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-stoneLine bg-white p-5 text-stone-700 shadow-sm">
          Carregando configurações...
        </div>
      ) : !company ? (
        <div className="rounded-lg border border-stoneLine bg-white p-5 text-stone-700 shadow-sm">
          Empresa não encontrada para o usuário autenticado.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form
            className="space-y-5 rounded-lg border border-stoneLine bg-white p-5 shadow-sm"
            onSubmit={handleSubmit}
          >
            <div>
              <h2 className="text-lg font-semibold text-graphite">
                Dados da marmoraria
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                O logo ainda não possui upload; use uma URL pública por
                enquanto.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
              <label className="flex items-center gap-3 rounded-md border border-stoneLine px-3 py-3">
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

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-md bg-graphite px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                type="submit"
                disabled={saving || !companyId}
              >
                {saving ? 'Salvando...' : 'Salvar configurações'}
              </button>
              <button
                className="rounded-md border border-stoneLine px-5 py-3 text-sm font-semibold text-graphite transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-400"
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Descartar alterações
              </button>
            </div>
          </form>

          <aside className="space-y-4 rounded-lg border border-stoneLine bg-white p-5 shadow-sm">
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
            <SummaryRow label="Status" value={company.active ? 'Ativa' : 'Inativa'} />
            <SummaryRow label="Criada em" value={formatDate(company.created_at)} />
          </aside>
        </div>
      )}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
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
