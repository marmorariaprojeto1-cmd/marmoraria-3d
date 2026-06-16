import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { resolveUserCompanyId } from '../../admin/company';
import { useAuth } from '../../auth/useAuth';
import { supabase } from '../../lib/supabase';

type TechnicalServiceTable = 'cutouts' | 'drillings';

type TechnicalService = {
  id: string;
  company_id: string;
  name: string;
  price: number;
  active: boolean;
  created_at: string;
};

type TechnicalServiceFormState = {
  name: string;
  price: string;
  active: boolean;
};

type DefaultTechnicalService = {
  name: string;
  price: number;
};

type TechnicalServicesPageProps = {
  table: TechnicalServiceTable;
  title: string;
  description: string;
  emptyMessage: string;
  defaults: DefaultTechnicalService[];
};

const emptyForm: TechnicalServiceFormState = {
  name: '',
  price: '',
  active: true,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function TechnicalServicesPage({
  table,
  title,
  description,
  emptyMessage,
  defaults,
}: TechnicalServicesPageProps) {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [services, setServices] = useState<TechnicalService[]>([]);
  const [form, setForm] = useState<TechnicalServiceFormState>(emptyForm);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const editingService = useMemo(
    () => services.find((service) => service.id === editingServiceId) ?? null,
    [editingServiceId, services],
  );
  const createServiceLabel = title === 'Furações' ? 'Furação' : 'Recorte';

  const loadServices = useCallback(async (nextCompanyId: string) => {
    const { data, error } = await supabase
      .from(table)
      .select('id, company_id, name, price, active, created_at')
      .eq('company_id', nextCompanyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    setServices((data ?? []) as TechnicalService[]);
  }, [table]);

  const ensureDefaultServices = useCallback(async (nextCompanyId: string) => {
    const payload = defaults.map((service) => ({
      company_id: nextCompanyId,
      name: service.name,
      price: service.price,
      active: true,
    }));

    const { error } = await supabase
      .from(table)
      .upsert(payload, {
        onConflict: 'company_id,name',
        ignoreDuplicates: true,
      });

    if (error) {
      throw error;
    }
  }, [defaults, table]);

  useEffect(() => {
    let mounted = true;

    async function loadCompanyAndServices() {
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
          await ensureDefaultServices(nextCompanyId);
          await loadServices(nextCompanyId);
        }
      } catch {
        if (mounted) {
          setErrorMessage(
            `Não foi possível carregar ${title.toLowerCase()}. Verifique as permissões do Supabase.`,
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadCompanyAndServices();

    return () => {
      mounted = false;
    };
  }, [ensureDefaultServices, loadServices, title, user]);

  function updateForm(field: keyof TechnicalServiceFormState, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingServiceId(null);
  }

  function startEditing(service: TechnicalService) {
    setEditingServiceId(service.id);
    setForm({
      name: service.name,
      price: String(service.price),
      active: service.active,
    });
    setSuccessMessage('');
    setErrorMessage('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!companyId) {
      setErrorMessage(
        'Usuário autenticado sem empresa vinculada. Configure o vínculo em public.users antes de cadastrar serviços.',
      );
      return;
    }

    const price = Number(form.price);

    if (!Number.isFinite(price) || price < 0) {
      setErrorMessage('Informe um preço válido.');
      return;
    }

    setSaving(true);

    const payload = {
      company_id: companyId,
      name: form.name.trim(),
      price,
      active: form.active,
    };

    try {
      if (editingService) {
        const { error } = await supabase
          .from(table)
          .update(payload)
          .eq('id', editingService.id)
          .eq('company_id', companyId);

        if (error) {
          throw error;
        }

        setSuccessMessage('Serviço atualizado com sucesso.');
      } else {
        const { error } = await supabase.from(table).insert(payload);

        if (error) {
          throw error;
        }

        setSuccessMessage('Serviço cadastrado com sucesso.');
      }

      resetForm();
      await loadServices(companyId);
    } catch {
      setErrorMessage(
        'Não foi possível salvar o serviço. Verifique os dados e as permissões.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleServiceActive(service: TechnicalService) {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase
        .from(table)
        .update({ active: !service.active })
        .eq('id', service.id)
        .eq('company_id', service.company_id);

      if (error) {
        throw error;
      }

      setServices((current) =>
        current.map((item) =>
          item.id === service.id ? { ...item, active: !service.active } : item,
        ),
      );
      setSuccessMessage(service.active ? 'Serviço desativado.' : 'Serviço ativado.');
    } catch {
      setErrorMessage('Não foi possível alterar o status do serviço.');
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <p className="admin-page-kicker">Serviços técnicos</p>
        <h1 className="admin-page-title">{title}</h1>
        <p className="admin-page-description">{description}</p>
      </div>

      {!companyId && !loading && (
        <div className="rounded-md border border-copper/30 bg-orange-50 p-4 text-sm text-stone-800">
          Nenhuma empresa foi vinculada ao usuário autenticado. Para preservar a
          arquitetura multiempresa, o CRUD fica bloqueado até existir um vínculo
          ativo em public.users com o mesmo e-mail do login.
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

      <div className="space-y-6">
        <form
          className="surface-card p-5"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(220px,1fr)_minmax(130px,0.35fr)_auto_auto] xl:items-end">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Nome</span>
              <input
                className="field-input"
                type="text"
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                required
                disabled={!companyId || saving}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Preço</span>
              <input
                className="field-input"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => updateForm('price', event.target.value)}
                required
                disabled={!companyId || saving}
              />
            </label>

            <label className="flex min-h-[48px] items-center gap-3 whitespace-nowrap text-sm font-medium text-stone-700">
              <input
                className="h-4 w-4 accent-moss"
                type="checkbox"
                checked={form.active}
                onChange={(event) => updateForm('active', event.target.checked)}
                disabled={!companyId || saving}
              />
              Ativo
            </label>

            <button
              className="primary-button whitespace-nowrap px-4 py-2.5"
              type="submit"
              disabled={!companyId || saving}
            >
              {saving
                ? 'Salvando...'
                : editingService
                  ? 'Salvar edição'
                  : `Cadastrar ${createServiceLabel}`}
            </button>
            {editingService && (
              <button
                className="secondary-button whitespace-nowrap px-4 py-2.5"
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="surface-card overflow-hidden">
          <div className="admin-card-header">
            <h2 className="admin-card-title">
              Serviços cadastrados
            </h2>
            <p className="admin-card-description">
              Listagem vinculada à empresa do usuário autenticado.
            </p>
          </div>

          {loading ? (
            <p className="p-5 text-stone-700">Carregando serviços...</p>
          ) : services.length === 0 ? (
            <p className="p-5 text-stone-700">{emptyMessage}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table min-w-[560px]">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th className="text-right">Preço</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id}>
                      <td className="font-medium text-graphite">
                        {service.name}
                      </td>
                      <td className="text-right font-semibold text-graphite">
                        {formatCurrency(service.price)}
                      </td>
                      <td>
                        <span
                          className={[
                            'admin-status-badge',
                            service.active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-stone-100 text-stone-600',
                          ].join(' ')}
                        >
                          {service.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="admin-action-button"
                            type="button"
                            onClick={() => startEditing(service)}
                          >
                            Editar
                          </button>
                          <button
                            className="admin-action-button"
                            type="button"
                            onClick={() => void toggleServiceActive(service)}
                          >
                            {service.active ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
