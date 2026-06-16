import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { resolveUserCompanyId } from '../../admin/company';
import { useAuth } from '../../auth/useAuth';
import { supabase } from '../../lib/supabase';

type Sink = {
  id: string;
  company_id: string;
  name: string;
  category: string | null;
  price: number;
  active: boolean;
  created_at: string;
};

type SinkFormState = {
  name: string;
  category: string;
  price: string;
  active: boolean;
};

const sinkCategories = [
  'cozinha',
  'banheiro',
  'gourmet',
  'esculpida',
  'sobreposta',
  'embutida',
  'submontada',
];

const emptyForm: SinkFormState = {
  name: '',
  category: '',
  price: '',
  active: true,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function SinksPage() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [sinks, setSinks] = useState<Sink[]>([]);
  const [form, setForm] = useState<SinkFormState>(emptyForm);
  const [editingSinkId, setEditingSinkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const editingSink = useMemo(
    () => sinks.find((sink) => sink.id === editingSinkId) ?? null,
    [editingSinkId, sinks],
  );

  const loadSinks = useCallback(async (nextCompanyId: string) => {
    const { data, error } = await supabase
      .from('sinks')
      .select('id, company_id, name, category, price, active, created_at')
      .eq('company_id', nextCompanyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    setSinks((data ?? []) as Sink[]);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCompanyAndSinks() {
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
          await loadSinks(nextCompanyId);
        }
      } catch {
        if (mounted) {
          setErrorMessage(
            'Não foi possível carregar as cubas. Verifique as permissões do Supabase.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadCompanyAndSinks();

    return () => {
      mounted = false;
    };
  }, [loadSinks, user]);

  function updateForm(field: keyof SinkFormState, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingSinkId(null);
  }

  function startEditing(sink: Sink) {
    setEditingSinkId(sink.id);
    setForm({
      name: sink.name,
      category: sink.category ?? '',
      price: String(sink.price),
      active: sink.active,
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
        'Usuário autenticado sem empresa vinculada. Configure o vínculo em public.users antes de cadastrar cubas.',
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
      category: form.category.trim() || null,
      price,
      active: form.active,
    };

    try {
      if (editingSink) {
        const { error } = await supabase
          .from('sinks')
          .update(payload)
          .eq('id', editingSink.id)
          .eq('company_id', companyId);

        if (error) {
          throw error;
        }

        setSuccessMessage('Cuba atualizada com sucesso.');
      } else {
        const { error } = await supabase.from('sinks').insert(payload);

        if (error) {
          throw error;
        }

        setSuccessMessage('Cuba cadastrada com sucesso.');
      }

      resetForm();
      await loadSinks(companyId);
    } catch {
      setErrorMessage(
        'Não foi possível salvar a cuba. Verifique os dados e as permissões.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleSinkActive(sink: Sink) {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase
        .from('sinks')
        .update({ active: !sink.active })
        .eq('id', sink.id)
        .eq('company_id', sink.company_id);

      if (error) {
        throw error;
      }

      setSinks((current) =>
        current.map((item) =>
          item.id === sink.id ? { ...item, active: !sink.active } : item,
        ),
      );
      setSuccessMessage(sink.active ? 'Cuba desativada.' : 'Cuba ativada.');
    } catch {
      setErrorMessage('Não foi possível alterar o status da cuba.');
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <p className="admin-page-kicker">Catálogo</p>
        <h1 className="admin-page-title">Cubas</h1>
        <p className="admin-page-description">
          Cadastre e mantenha as cubas disponíveis para a marmoraria. Esta etapa
          não implementa upload, orçamento, simulador ou outros módulos.
        </p>
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
          <div className="grid gap-4 xl:grid-cols-[minmax(180px,1.4fr)_minmax(160px,1fr)_minmax(130px,0.8fr)_auto_auto] xl:items-end">
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
              <span className="text-sm font-medium text-stone-700">
                Categoria
              </span>
              <select
                className="field-input"
                value={form.category}
                onChange={(event) => updateForm('category', event.target.value)}
                disabled={!companyId || saving}
              >
                <option value="">Sem categoria</option>
                {sinkCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
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
              Ativa
            </label>

            <button
              className="primary-button whitespace-nowrap px-4 py-2.5"
              type="submit"
              disabled={!companyId || saving}
            >
              {saving
                ? 'Salvando...'
                : editingSink
                  ? 'Salvar edição'
                  : 'Cadastrar cuba'}
            </button>
            {editingSink && (
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
              Cubas cadastradas
            </h2>
            <p className="admin-card-description">
              Listagem vinculada à empresa do usuário autenticado.
            </p>
          </div>

          {loading ? (
            <p className="p-5 text-stone-700">Carregando cubas...</p>
          ) : sinks.length === 0 ? (
            <p className="p-5 text-stone-700">
              Nenhuma cuba cadastrada para esta empresa.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table min-w-[640px]">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Categoria</th>
                    <th className="text-right">Preço</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sinks.map((sink) => (
                    <tr key={sink.id}>
                      <td className="font-medium text-graphite">
                        {sink.name}
                      </td>
                      <td className="text-stone-700">
                        {sink.category || 'Sem categoria'}
                      </td>
                      <td className="text-right font-semibold text-graphite">
                        {formatCurrency(sink.price)}
                      </td>
                      <td>
                        <span
                          className={[
                            'admin-status-badge',
                            sink.active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-stone-100 text-stone-600',
                          ].join(' ')}
                        >
                          {sink.active ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="admin-action-button"
                            type="button"
                            onClick={() => startEditing(sink)}
                          >
                            Editar
                          </button>
                          <button
                            className="admin-action-button"
                            type="button"
                            onClick={() => void toggleSinkActive(sink)}
                          >
                            {sink.active ? 'Desativar' : 'Ativar'}
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
