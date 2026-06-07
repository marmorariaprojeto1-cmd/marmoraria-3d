import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { resolveUserCompanyId } from '../../admin/company';
import { useAuth } from '../../auth/useAuth';
import { supabase } from '../../lib/supabase';

type FinishPricingType = 'fixed' | 'linear_meter' | 'percentage';

type Finish = {
  id: string;
  company_id: string;
  name: string;
  pricing_type: FinishPricingType;
  price: number;
  active: boolean;
  created_at: string;
};

type FinishFormState = {
  name: string;
  pricingType: FinishPricingType;
  price: string;
  active: boolean;
};

const pricingTypes: Array<{ value: FinishPricingType; label: string }> = [
  { value: 'fixed', label: 'fixed' },
  { value: 'linear_meter', label: 'per_linear_meter' },
  { value: 'percentage', label: 'percentage' },
];

const emptyForm: FinishFormState = {
  name: '',
  pricingType: 'fixed',
  price: '',
  active: true,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPricingType(value: FinishPricingType) {
  return pricingTypes.find((type) => type.value === value)?.label ?? value;
}

export function FinishesPage() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [finishes, setFinishes] = useState<Finish[]>([]);
  const [form, setForm] = useState<FinishFormState>(emptyForm);
  const [editingFinishId, setEditingFinishId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const editingFinish = useMemo(
    () => finishes.find((finish) => finish.id === editingFinishId) ?? null,
    [editingFinishId, finishes],
  );

  const loadFinishes = useCallback(async (nextCompanyId: string) => {
    const { data, error } = await supabase
      .from('finishes')
      .select('id, company_id, name, pricing_type, price, active, created_at')
      .eq('company_id', nextCompanyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    setFinishes((data ?? []) as Finish[]);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCompanyAndFinishes() {
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
          await loadFinishes(nextCompanyId);
        }
      } catch {
        if (mounted) {
          setErrorMessage(
            'Não foi possível carregar os acabamentos. Verifique as permissões do Supabase.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadCompanyAndFinishes();

    return () => {
      mounted = false;
    };
  }, [loadFinishes, user]);

  function updateForm(
    field: keyof FinishFormState,
    value: string | boolean | FinishPricingType,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingFinishId(null);
  }

  function startEditing(finish: Finish) {
    setEditingFinishId(finish.id);
    setForm({
      name: finish.name,
      pricingType: finish.pricing_type,
      price: String(finish.price),
      active: finish.active,
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
        'Usuário autenticado sem empresa vinculada. Configure o vínculo em public.users antes de cadastrar acabamentos.',
      );
      return;
    }

    const price = Number(form.price);

    if (!Number.isFinite(price) || price < 0) {
      setErrorMessage('Informe um valor válido.');
      return;
    }

    setSaving(true);

    const payload = {
      company_id: companyId,
      name: form.name.trim(),
      pricing_type: form.pricingType,
      price,
      active: form.active,
    };

    try {
      if (editingFinish) {
        const { error } = await supabase
          .from('finishes')
          .update(payload)
          .eq('id', editingFinish.id)
          .eq('company_id', companyId);

        if (error) {
          throw error;
        }

        setSuccessMessage('Acabamento atualizado com sucesso.');
      } else {
        const { error } = await supabase.from('finishes').insert(payload);

        if (error) {
          throw error;
        }

        setSuccessMessage('Acabamento cadastrado com sucesso.');
      }

      resetForm();
      await loadFinishes(companyId);
    } catch {
      setErrorMessage(
        'Não foi possível salvar o acabamento. Verifique os dados e as permissões.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleFinishActive(finish: Finish) {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase
        .from('finishes')
        .update({ active: !finish.active })
        .eq('id', finish.id)
        .eq('company_id', finish.company_id);

      if (error) {
        throw error;
      }

      setFinishes((current) =>
        current.map((item) =>
          item.id === finish.id ? { ...item, active: !finish.active } : item,
        ),
      );
      setSuccessMessage(
        finish.active ? 'Acabamento desativado.' : 'Acabamento ativado.',
      );
    } catch {
      setErrorMessage('Não foi possível alterar o status do acabamento.');
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Catálogo</p>
        <h1 className="mt-2 text-3xl font-bold text-graphite">
          Acabamentos
        </h1>
        <p className="mt-3 max-w-3xl text-stone-700">
          Cadastre e mantenha os acabamentos da marmoraria. O tipo
          per_linear_meter é gravado como linear_meter para respeitar o schema
          atual.
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

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form
          className="space-y-4 rounded-lg border border-stoneLine bg-white p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div>
            <h2 className="text-lg font-semibold text-graphite">
              {editingFinish ? 'Editar acabamento' : 'Cadastrar acabamento'}
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Configure apenas nome, tipo de cobrança, valor e status.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Nome</span>
            <input
              className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
              type="text"
              value={form.name}
              onChange={(event) => updateForm('name', event.target.value)}
              required
              disabled={!companyId || saving}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">
              Tipo de cobrança
            </span>
            <select
              className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
              value={form.pricingType}
              onChange={(event) =>
                updateForm(
                  'pricingType',
                  event.target.value as FinishPricingType,
                )
              }
              disabled={!companyId || saving}
            >
              {pricingTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Valor</span>
            <input
              className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => updateForm('price', event.target.value)}
              required
              disabled={!companyId || saving}
            />
          </label>

          <label className="flex items-center gap-3 text-sm font-medium text-stone-700">
            <input
              className="h-4 w-4 accent-moss"
              type="checkbox"
              checked={form.active}
              onChange={(event) => updateForm('active', event.target.checked)}
              disabled={!companyId || saving}
            />
            Acabamento ativo
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-md bg-graphite px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              type="submit"
              disabled={!companyId || saving}
            >
              {saving
                ? 'Salvando...'
                : editingFinish
                  ? 'Salvar edição'
                  : 'Cadastrar'}
            </button>
            {editingFinish && (
              <button
                className="rounded-md border border-stoneLine px-4 py-3 text-sm font-semibold text-graphite transition hover:bg-stone-100"
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="rounded-lg border border-stoneLine bg-white shadow-sm">
          <div className="border-b border-stoneLine p-5">
            <h2 className="text-lg font-semibold text-graphite">
              Acabamentos cadastrados
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Listagem vinculada à empresa do usuário autenticado.
            </p>
          </div>

          {loading ? (
            <p className="p-5 text-stone-700">Carregando acabamentos...</p>
          ) : finishes.length === 0 ? (
            <p className="p-5 text-stone-700">
              Nenhum acabamento cadastrado para esta empresa.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-stone-100 text-stone-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nome</th>
                    <th className="px-4 py-3 font-semibold">Cobrança</th>
                    <th className="px-4 py-3 font-semibold">Valor</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stoneLine">
                  {finishes.map((finish) => (
                    <tr key={finish.id}>
                      <td className="px-4 py-4 font-medium text-graphite">
                        {finish.name}
                      </td>
                      <td className="px-4 py-4 text-stone-700">
                        {formatPricingType(finish.pricing_type)}
                      </td>
                      <td className="px-4 py-4 text-stone-700">
                        {finish.pricing_type === 'percentage'
                          ? `${finish.price}%`
                          : formatCurrency(finish.price)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={[
                            'rounded-full px-2 py-1 text-xs font-semibold',
                            finish.active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-stone-100 text-stone-600',
                          ].join(' ')}
                        >
                          {finish.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-md border border-stoneLine px-3 py-2 font-medium text-graphite transition hover:bg-stone-100"
                            type="button"
                            onClick={() => startEditing(finish)}
                          >
                            Editar
                          </button>
                          <button
                            className="rounded-md border border-stoneLine px-3 py-2 font-medium text-graphite transition hover:bg-stone-100"
                            type="button"
                            onClick={() => void toggleFinishActive(finish)}
                          >
                            {finish.active ? 'Desativar' : 'Ativar'}
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
