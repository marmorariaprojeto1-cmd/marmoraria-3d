import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { supabase } from '../lib/supabase';

const USER_ROLES = ['owner', 'manager', 'salesperson'] as const;

type UserRole = (typeof USER_ROLES)[number];

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  city: string | null;
  whatsapp: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  company_id: string;
  companies: {
    name: string;
  } | null;
};

type SuperAdminOverview = {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  activeUsers: number;
  companies: CompanyRow[];
  users: UserRow[];
};

type CompanyFormState = {
  id?: string;
  name: string;
  slug: string;
  customDomain: string;
  whatsapp: string;
  email: string;
  city: string;
  active: boolean;
};

type UserFormState = {
  id?: string;
  email: string;
  companyId: string;
  role: UserRole;
  active: boolean;
  temporaryPassword: string;
};

type CreatedUserCredentials = {
  email: string;
  temporaryPassword: string;
};

type CreateAdminUserResponse = {
  success?: boolean;
  email?: string;
  temporaryPassword?: string;
  error?: unknown;
};

const emptyCompanyForm: CompanyFormState = {
  name: '',
  slug: '',
  customDomain: '',
  whatsapp: '',
  email: '',
  city: '',
  active: true,
};

const emptyUserForm: UserFormState = {
  email: '',
  companyId: '',
  role: 'owner',
  active: true,
  temporaryPassword: '',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function normalizeSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function statusLabel(active: boolean) {
  return active ? 'Ativo' : 'Inativo';
}

function nameFromEmail(email: string) {
  return email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || email;
}

function readableErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const errorRecord = error as Record<string, unknown>;
    const knownMessage =
      errorRecord.message ??
      errorRecord.error_description ??
      errorRecord.details ??
      errorRecord.hint ??
      errorRecord.code;

    if (typeof knownMessage === 'string' && knownMessage.trim()) {
      return knownMessage;
    }

    return JSON.stringify(errorRecord);
  }

  return String(error);
}

function mapCompanyError(error: unknown) {
  const message = readableErrorMessage(error);

  if (message.includes('companies_slug_key')) {
    return 'Já existe uma empresa com este slug.';
  }

  if (message.includes('companies_custom_domain_unique_idx')) {
    return 'Já existe uma empresa com este domínio próprio.';
  }

  return message || 'Não foi possível salvar a empresa.';
}

function mapUserError(error: unknown) {
  const message = readableErrorMessage(error);

  if (message.includes('users_company_id_email_key')) {
    return 'Já existe um usuário com este e-mail nesta empresa.';
  }

  return message || 'Não foi possível salvar o usuário.';
}

function validateTemporaryPassword(password: string) {
  if (!password) {
    return null;
  }

  if (password.length < 8) {
    return 'A senha temporária deve ter pelo menos 8 caracteres.';
  }

  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) {
    return 'A senha temporária deve conter pelo menos uma letra e um número.';
  }

  return null;
}

async function assertSuperAdmin() {
  const { data, error } = await supabase.rpc('current_user_is_superadmin');

  if (error) {
    throw error;
  }

  return data === true;
}

async function fetchSuperAdminOverview(): Promise<SuperAdminOverview> {
  const [
    totalCompaniesResult,
    activeCompaniesResult,
    totalUsersResult,
    activeUsersResult,
    companiesResult,
    usersResult,
  ] = await Promise.all([
    supabase.from('companies').select('id', { count: 'exact', head: true }),
    supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .eq('active', true),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('active', true),
    supabase
      .from('companies')
      .select('id,name,slug,custom_domain,city,whatsapp,email,active,created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('id,name,email,role,active,company_id,companies(name)')
      .order('email', { ascending: true }),
  ]);

  const results = [
    totalCompaniesResult,
    activeCompaniesResult,
    totalUsersResult,
    activeUsersResult,
    companiesResult,
    usersResult,
  ];
  const failedResult = results.find((result) => result.error);

  if (failedResult?.error) {
    throw failedResult.error;
  }

  return {
    totalCompanies: totalCompaniesResult.count ?? 0,
    activeCompanies: activeCompaniesResult.count ?? 0,
    totalUsers: totalUsersResult.count ?? 0,
    activeUsers: activeUsersResult.count ?? 0,
    companies: (companiesResult.data ?? []) as CompanyRow[],
    users: (usersResult.data ?? []) as unknown as UserRow[],
  };
}

async function saveCompany(form: CompanyFormState) {
  const payload = {
    name: form.name.trim(),
    slug: normalizeSlug(form.slug),
    custom_domain: form.customDomain.trim().toLowerCase() || null,
    whatsapp: form.whatsapp.trim() || null,
    email: form.email.trim() || null,
    city: form.city.trim() || null,
    active: form.active,
  };

  if (!payload.name) {
    throw new Error('Nome da empresa é obrigatório.');
  }

  if (!payload.slug) {
    throw new Error('Slug é obrigatório.');
  }

  if (!form.id) {
    const { error } = await supabase.rpc('create_company_with_default_catalog', {
      p_active: payload.active,
      p_city: payload.city,
      p_custom_domain: payload.custom_domain,
      p_email: payload.email,
      p_name: payload.name,
      p_slug: payload.slug,
      p_whatsapp: payload.whatsapp,
    });

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase
    .from('companies')
    .update(payload)
    .eq('id', form.id);

  if (error) {
    throw error;
  }
}

async function toggleCompanyStatus(company: CompanyRow) {
  const { error } = await supabase
    .from('companies')
    .update({ active: !company.active })
    .eq('id', company.id);

  if (error) {
    throw error;
  }
}

async function savePlatformUser(form: UserFormState) {
  const email = form.email.trim().toLowerCase();

  if (!email) {
    throw new Error('E-mail é obrigatório.');
  }

  if (!form.companyId) {
    throw new Error('Empresa é obrigatória.');
  }

  if (!USER_ROLES.includes(form.role)) {
    throw new Error('Role inválida.');
  }

  if (!form.id) {
    const manualPassword = form.temporaryPassword.trim();
    const passwordError = validateTemporaryPassword(manualPassword);

    if (passwordError) {
      throw new Error(passwordError);
    }

    const { data, error } =
      await supabase.functions.invoke<CreateAdminUserResponse>(
        'create-admin-user',
        {
          body: {
            email,
            company_id: form.companyId,
            role: form.role,
            active: form.active,
            password: manualPassword || undefined,
          },
        },
      );

    if (error) {
      throw error;
    }

    if (data?.error) {
      throw new Error(readableErrorMessage(data.error));
    }

    if (!data?.success || !data.temporaryPassword || !data.email) {
      throw new Error('A função não retornou a senha temporária.');
    }

    return {
      email: data.email,
      temporaryPassword: data.temporaryPassword,
    };
  }

  const payload = {
    company_id: form.companyId,
    role: form.role,
    active: form.active,
    name: nameFromEmail(email),
  };

  const { error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', form.id);

  if (error) {
    throw error;
  }

  return null;
}

async function togglePlatformUserStatus(platformUser: UserRow) {
  const { error } = await supabase
    .from('users')
    .update({ active: !platformUser.active })
    .eq('id', platformUser.id);

  if (error) {
    throw error;
  }
}

export function ProtectedSuperAdminPage() {
  const { loading, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [companyForm, setCompanyForm] = useState<CompanyFormState | null>(null);
  const [userForm, setUserForm] = useState<UserFormState | null>(null);
  const [companyError, setCompanyError] = useState('');
  const [userError, setUserError] = useState('');
  const [createdUserCredentials, setCreatedUserCredentials] =
    useState<CreatedUserCredentials | null>(null);

  const superAdminQuery = useQuery({
    queryKey: ['current-user-is-superadmin', user?.id],
    queryFn: assertSuperAdmin,
    enabled: Boolean(user),
    retry: false,
  });

  const overviewQuery = useQuery({
    queryKey: ['superadmin-overview'],
    queryFn: fetchSuperAdminOverview,
    enabled: superAdminQuery.data === true,
  });

  const companiesById = useMemo(() => {
    const entries: Array<[string, CompanyRow]> =
      overviewQuery.data?.companies.map((company) => [company.id, company]) ??
      [];

    return new Map(entries);
  }, [overviewQuery.data?.companies]);

  const companyMutation = useMutation({
    mutationFn: saveCompany,
    onSuccess: () => {
      setCompanyForm(null);
      setCompanyError('');
      queryClient.invalidateQueries({ queryKey: ['superadmin-overview'] });
    },
    onError: (error) => setCompanyError(mapCompanyError(error)),
  });

  const companyStatusMutation = useMutation({
    mutationFn: toggleCompanyStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-overview'] });
    },
    onError: (error) => setCompanyError(mapCompanyError(error)),
  });

  const userMutation = useMutation({
    mutationFn: savePlatformUser,
    onSuccess: (credentials) => {
      setUserForm(null);
      setUserError('');
      setCreatedUserCredentials(credentials);
      queryClient.invalidateQueries({ queryKey: ['superadmin-overview'] });
    },
    onError: (error) => setUserError(mapUserError(error)),
  });

  const userStatusMutation = useMutation({
    mutationFn: togglePlatformUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-overview'] });
    },
    onError: (error) => setUserError(mapUserError(error)),
  });

  if (loading) {
    return (
      <div className="surface-card p-6 text-stone-700">
        Verificando sessão...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (superAdminQuery.isLoading) {
    return (
      <div className="surface-card p-6 text-stone-700">
        Verificando permissão de superadmin...
      </div>
    );
  }

  if (superAdminQuery.error || superAdminQuery.data !== true) {
    return (
      <div className="surface-card p-6">
        <p className="text-lg font-bold text-graphite">Acesso não autorizado.</p>
        <p className="mt-2 text-sm text-stone-600">
          Esta área é restrita a usuários superadmin ativos.
        </p>
      </div>
    );
  }

  const overview = overviewQuery.data;

  function openNewCompanyForm() {
    setCompanyError('');
    setCompanyForm(emptyCompanyForm);
  }

  function openEditCompanyForm(company: CompanyRow) {
    setCompanyError('');
    setCompanyForm({
      id: company.id,
      name: company.name,
      slug: company.slug,
      customDomain: company.custom_domain ?? '',
      whatsapp: company.whatsapp ?? '',
      email: company.email ?? '',
      city: company.city ?? '',
      active: company.active,
    });
  }

  function openNewUserForm() {
    setUserError('');
    setCreatedUserCredentials(null);
    setUserForm({
      ...emptyUserForm,
      companyId: overview?.companies[0]?.id ?? '',
    });
  }

  function openEditUserForm(platformUser: UserRow) {
    setUserError('');
    setCreatedUserCredentials(null);
    setUserForm({
      id: platformUser.id,
      email: platformUser.email,
      companyId: platformUser.company_id,
      role: USER_ROLES.includes(platformUser.role as UserRole)
        ? (platformUser.role as UserRole)
        : 'salesperson',
      active: platformUser.active,
      temporaryPassword: '',
    });
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="admin-page-kicker">Plataforma</p>
          <h1 className="admin-page-title">Superadmin</h1>
          <p className="admin-page-description">
            Gerencie empresas e vínculos de usuários da plataforma.
          </p>
        </div>
        <button
          className="secondary-button whitespace-nowrap px-4 py-2.5"
          type="button"
          onClick={handleSignOut}
        >
          Sair
        </button>
      </div>

      {overviewQuery.isLoading && (
        <div className="surface-card p-6 text-stone-700">
          Carregando dados da plataforma...
        </div>
      )}

      {overviewQuery.error && (
        <div className="surface-card border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Não foi possível carregar a visão geral do Superadmin.
        </div>
      )}

      {overview && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total de empresas" value={overview.totalCompanies} />
            <MetricCard label="Empresas ativas" value={overview.activeCompanies} />
            <MetricCard label="Total de usuários" value={overview.totalUsers} />
            <MetricCard label="Usuários ativos" value={overview.activeUsers} />
          </div>

          <div className="surface-card overflow-hidden p-0">
            <div className="admin-card-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="admin-card-title">Empresas</h2>
                <p className="admin-card-description">
                  Cadastre e mantenha marmorarias da plataforma.
                </p>
              </div>
              <button
                className="primary-button whitespace-nowrap px-4 py-2.5"
                type="button"
                onClick={openNewCompanyForm}
              >
                Nova empresa
              </button>
            </div>

            {companyForm && (
              <CompanyForm
                error={companyError}
                form={companyForm}
                saving={companyMutation.isPending}
                onCancel={() => {
                  setCompanyForm(null);
                  setCompanyError('');
                }}
                onChange={setCompanyForm}
                onSubmit={() => companyMutation.mutate(companyForm)}
              />
            )}

            <div className="overflow-x-auto">
              <table className="admin-table min-w-[980px]">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Slug</th>
                    <th>Domínio</th>
                    <th>Cidade</th>
                    <th>WhatsApp</th>
                    <th>E-mail</th>
                    <th>Status</th>
                    <th>Criada em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.companies.map((company) => (
                    <tr key={company.id}>
                      <td className="font-semibold text-graphite">{company.name}</td>
                      <td>{company.slug}</td>
                      <td>{company.custom_domain || 'Não configurado'}</td>
                      <td>{company.city || 'Não informada'}</td>
                      <td>{company.whatsapp || 'Não informado'}</td>
                      <td>{company.email || 'Não informado'}</td>
                      <td>
                        <StatusBadge active={company.active} />
                      </td>
                      <td>{formatDate(company.created_at)}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="admin-action-button"
                            type="button"
                            onClick={() => openEditCompanyForm(company)}
                          >
                            Editar
                          </button>
                          <button
                            className="admin-action-button"
                            type="button"
                            onClick={() => companyStatusMutation.mutate(company)}
                          >
                            {company.active ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="surface-card overflow-hidden p-0">
            <div className="admin-card-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="admin-card-title">Usuários</h2>
                <p className="admin-card-description">
                  Vincule usuários às empresas. A criação no Supabase Auth
                  continua manual nesta sprint.
                </p>
              </div>
              <button
                className="primary-button whitespace-nowrap px-4 py-2.5"
                type="button"
                onClick={openNewUserForm}
              >
                Novo usuário
              </button>
            </div>

            {createdUserCredentials && (
              <TemporaryPasswordBox
                credentials={createdUserCredentials}
                onDismiss={() => setCreatedUserCredentials(null)}
              />
            )}

            {userForm && (
              <UserForm
                companies={overview.companies}
                error={userError}
                form={userForm}
                saving={userMutation.isPending}
                onCancel={() => {
                  setUserForm(null);
                  setUserError('');
                }}
                onChange={setUserForm}
                onSubmit={() => userMutation.mutate(userForm)}
              />
            )}

            <div className="overflow-x-auto">
              <table className="admin-table min-w-[860px]">
                <thead>
                  <tr>
                    <th>E-mail</th>
                    <th>Empresa</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.users.map((platformUser) => (
                    <tr key={platformUser.id}>
                      <td className="font-semibold text-graphite">
                        {platformUser.email}
                      </td>
                      <td>
                        {platformUser.companies?.name ||
                          companiesById.get(platformUser.company_id)?.name ||
                          platformUser.company_id}
                      </td>
                      <td>{platformUser.role}</td>
                      <td>
                        <StatusBadge active={platformUser.active} />
                      </td>
                      <td>
                        {platformUser.role === 'superadmin' ? (
                          <span className="text-sm font-semibold text-stone-500">
                            Protegido
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() => openEditUserForm(platformUser)}
                            >
                              Editar
                            </button>
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() =>
                                userStatusMutation.mutate(platformUser)
                              }
                            >
                              {platformUser.active ? 'Desativar' : 'Ativar'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CompanyForm({
  error,
  form,
  saving,
  onCancel,
  onChange,
  onSubmit,
}: {
  error: string;
  form: CompanyFormState;
  saving: boolean;
  onCancel: () => void;
  onChange: (form: CompanyFormState) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="border-y border-stoneLine bg-stone-50/70 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <Field label="Nome">
          <input
            className="field-input"
            value={form.name}
            onChange={(event) =>
              onChange({
                ...form,
                name: event.target.value,
                slug: form.id ? form.slug : normalizeSlug(event.target.value),
              })
            }
          />
        </Field>
        <Field label="Slug">
          <input
            className="field-input"
            value={form.slug}
            onChange={(event) =>
              onChange({ ...form, slug: normalizeSlug(event.target.value) })
            }
          />
        </Field>
        <Field label="Domínio próprio">
          <input
            className="field-input"
            placeholder="www.marmoraria.com.br"
            value={form.customDomain}
            onChange={(event) =>
              onChange({
                ...form,
                customDomain: event.target.value.toLowerCase(),
              })
            }
          />
        </Field>
        <Field label="WhatsApp">
          <input
            className="field-input"
            value={form.whatsapp}
            onChange={(event) =>
              onChange({ ...form, whatsapp: event.target.value })
            }
          />
        </Field>
        <Field label="E-mail">
          <input
            className="field-input"
            type="email"
            value={form.email}
            onChange={(event) => onChange({ ...form, email: event.target.value })}
          />
        </Field>
        <Field label="Cidade">
          <input
            className="field-input"
            value={form.city}
            onChange={(event) => onChange({ ...form, city: event.target.value })}
          />
        </Field>
        <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-stone-700">
          <input
            checked={form.active}
            type="checkbox"
            onChange={(event) =>
              onChange({ ...form, active: event.target.checked })
            }
          />
          Empresa ativa
        </label>
      </div>

      {error && (
        <p className="mt-3 text-sm font-semibold text-red-700">
          {readableErrorMessage(error)}
        </p>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <button className="secondary-button px-4 py-2.5" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary-button px-4 py-2.5" type="submit" disabled={saving}>
          {saving ? 'Salvando...' : form.id ? 'Salvar empresa' : 'Criar empresa'}
        </button>
      </div>
    </form>
  );
}

function UserForm({
  companies,
  error,
  form,
  saving,
  onCancel,
  onChange,
  onSubmit,
}: {
  companies: CompanyRow[];
  error: string;
  form: UserFormState;
  saving: boolean;
  onCancel: () => void;
  onChange: (form: UserFormState) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="border-y border-stoneLine bg-stone-50/70 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div
        className={[
          'grid gap-4 md:grid-cols-2',
          form.id ? 'xl:grid-cols-4' : 'xl:grid-cols-5',
        ].join(' ')}
      >
        <Field label="E-mail">
          <input
            className="field-input"
            disabled={Boolean(form.id)}
            type="email"
            value={form.email}
            onChange={(event) => onChange({ ...form, email: event.target.value })}
          />
        </Field>
        <Field label="Empresa">
          <select
            className="field-input"
            value={form.companyId}
            onChange={(event) =>
              onChange({ ...form, companyId: event.target.value })
            }
          >
            <option value="">Selecione</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Role">
          <select
            className="field-input"
            value={form.role}
            onChange={(event) =>
              onChange({ ...form, role: event.target.value as UserRole })
            }
          >
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </Field>
        {!form.id && (
          <Field label="Senha temporária">
            <input
              autoComplete="new-password"
              className="field-input"
              placeholder="Opcional"
              type="text"
              value={form.temporaryPassword}
              onChange={(event) =>
                onChange({ ...form, temporaryPassword: event.target.value })
              }
            />
            <span className="block text-xs font-medium text-stone-500">
              Mínimo 8 caracteres, com letra e número.
            </span>
          </Field>
        )}
        <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-stone-700">
          <input
            checked={form.active}
            type="checkbox"
            onChange={(event) =>
              onChange({ ...form, active: event.target.checked })
            }
          />
          Usuário ativo
        </label>
      </div>

      {error && (
        <p className="mt-3 text-sm font-semibold text-red-700">
          {readableErrorMessage(error)}
        </p>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <button className="secondary-button px-4 py-2.5" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary-button px-4 py-2.5" type="submit" disabled={saving}>
          {saving ? 'Salvando...' : form.id ? 'Salvar usuário' : 'Criar usuário'}
        </button>
      </div>
    </form>
  );
}

function TemporaryPasswordBox({
  credentials,
  onDismiss,
}: {
  credentials: CreatedUserCredentials;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyPassword() {
    await navigator.clipboard.writeText(credentials.temporaryPassword);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="border-y border-green-200 bg-green-50 p-5 text-sm text-green-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-bold">Usuário criado com sucesso.</p>
          <p className="mt-1">
            <span className="font-semibold">E-mail:</span> {credentials.email}
          </p>
          <p className="mt-1">
            <span className="font-semibold">Senha temporária:</span>{' '}
            <code className="rounded bg-white px-2 py-1 font-mono text-green-950">
              {credentials.temporaryPassword}
            </code>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="secondary-button px-4 py-2.5"
            type="button"
            onClick={copyPassword}
          >
            {copied ? 'Senha copiada' : 'Copiar senha'}
          </button>
          <button
            className="secondary-button px-4 py-2.5"
            type="button"
            onClick={onDismiss}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="space-y-2 text-sm font-semibold text-stone-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card p-6">
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-stone-500">
        {label}
      </p>
      <p className="mt-4 text-4xl font-bold text-graphite">{value}</p>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        'admin-status-badge w-fit',
        active ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600',
      ].join(' ')}
    >
      {statusLabel(active)}
    </span>
  );
}
