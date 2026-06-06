import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { resolveUserCompanyId } from '../../admin/company';
import { supabase } from '../../lib/supabase';

type Stone = {
  id: string;
  company_id: string;
  category_id: string | null;
  name: string;
  image_url: string | null;
  price_per_m2: number;
  active: boolean;
  created_at: string;
};

type StoneFormState = {
  name: string;
  categoryId: string;
  imageUrl: string;
  pricePerM2: string;
  active: boolean;
};

const emptyForm: StoneFormState = {
  name: '',
  categoryId: '',
  imageUrl: '',
  pricePerM2: '',
  active: true,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function StonesPage() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [stones, setStones] = useState<Stone[]>([]);
  const [form, setForm] = useState<StoneFormState>(emptyForm);
  const [editingStoneId, setEditingStoneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const editingStone = useMemo(
    () => stones.find((stone) => stone.id === editingStoneId) ?? null,
    [editingStoneId, stones],
  );

  const loadStones = useCallback(async (nextCompanyId: string) => {
    const { data, error } = await supabase
      .from('stones')
      .select(
        'id, company_id, category_id, name, image_url, price_per_m2, active, created_at',
      )
      .eq('company_id', nextCompanyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    setStones((data ?? []) as Stone[]);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCompanyAndStones() {
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
          await loadStones(nextCompanyId);
        }
      } catch {
        if (mounted) {
          setErrorMessage(
            'Não foi possível carregar as pedras. Verifique as permissões do Supabase.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadCompanyAndStones();

    return () => {
      mounted = false;
    };
  }, [loadStones, user]);

  function updateForm(field: keyof StoneFormState, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingStoneId(null);
  }

  function startEditing(stone: Stone) {
    setEditingStoneId(stone.id);
    setForm({
      name: stone.name,
      categoryId: stone.category_id ?? '',
      imageUrl: stone.image_url ?? '',
      pricePerM2: String(stone.price_per_m2),
      active: stone.active,
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
        'Usuário autenticado sem empresa vinculada. Configure o vínculo em public.users antes de cadastrar pedras.',
      );
      return;
    }

    const price = Number(form.pricePerM2);

    if (!Number.isFinite(price) || price < 0) {
      setErrorMessage('Informe um preço por m² válido.');
      return;
    }

    setSaving(true);

    const payload = {
      company_id: companyId,
      name: form.name.trim(),
      category_id: form.categoryId.trim() || null,
      image_url: form.imageUrl.trim() || null,
      price_per_m2: price,
      active: form.active,
    };

    try {
      if (editingStone) {
        const { error } = await supabase
          .from('stones')
          .update(payload)
          .eq('id', editingStone.id)
          .eq('company_id', companyId);

        if (error) {
          throw error;
        }

        setSuccessMessage('Pedra atualizada com sucesso.');
      } else {
        const { error } = await supabase.from('stones').insert(payload);

        if (error) {
          throw error;
        }

        setSuccessMessage('Pedra cadastrada com sucesso.');
      }

      resetForm();
      await loadStones(companyId);
    } catch {
      setErrorMessage(
        'Não foi possível salvar a pedra. Verifique os dados e as permissões.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStoneActive(stone: Stone) {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase
        .from('stones')
        .update({ active: !stone.active })
        .eq('id', stone.id)
        .eq('company_id', stone.company_id);

      if (error) {
        throw error;
      }

      setStones((current) =>
        current.map((item) =>
          item.id === stone.id ? { ...item, active: !stone.active } : item,
        ),
      );
      setSuccessMessage(
        stone.active ? 'Pedra desativada.' : 'Pedra ativada.',
      );
    } catch {
      setErrorMessage('Não foi possível alterar o status da pedra.');
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Catálogo</p>
        <h1 className="mt-2 text-3xl font-bold text-graphite">Pedras</h1>
        <p className="mt-3 max-w-3xl text-stone-700">
          Cadastre e mantenha as pedras da marmoraria. Categorias serão
          gerenciadas em uma etapa futura; por enquanto, category_id é opcional.
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
              {editingStone ? 'Editar pedra' : 'Cadastrar pedra'}
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Use apenas URL da imagem nesta etapa.
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
              Category ID opcional
            </span>
            <input
              className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
              type="text"
              value={form.categoryId}
              onChange={(event) => updateForm('categoryId', event.target.value)}
              disabled={!companyId || saving}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">
              URL da imagem
            </span>
            <input
              className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
              type="url"
              value={form.imageUrl}
              onChange={(event) => updateForm('imageUrl', event.target.value)}
              disabled={!companyId || saving}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">
              Preço por m²
            </span>
            <input
              className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
              type="number"
              min="0"
              step="0.01"
              value={form.pricePerM2}
              onChange={(event) =>
                updateForm('pricePerM2', event.target.value)
              }
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
            Pedra ativa
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-md bg-graphite px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              type="submit"
              disabled={!companyId || saving}
            >
              {saving ? 'Salvando...' : editingStone ? 'Salvar edição' : 'Cadastrar'}
            </button>
            {editingStone && (
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
              Pedras cadastradas
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Listagem vinculada à empresa do usuário autenticado.
            </p>
          </div>

          {loading ? (
            <p className="p-5 text-stone-700">Carregando pedras...</p>
          ) : stones.length === 0 ? (
            <p className="p-5 text-stone-700">
              Nenhuma pedra cadastrada para esta empresa.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-stone-100 text-stone-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nome</th>
                    <th className="px-4 py-3 font-semibold">Preço por m²</th>
                    <th className="px-4 py-3 font-semibold">Imagem</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stoneLine">
                  {stones.map((stone) => (
                    <tr key={stone.id}>
                      <td className="px-4 py-4 font-medium text-graphite">
                        {stone.name}
                      </td>
                      <td className="px-4 py-4 text-stone-700">
                        {formatCurrency(stone.price_per_m2)}
                      </td>
                      <td className="px-4 py-4 text-stone-700">
                        {stone.image_url ? (
                          <a
                            className="text-moss underline"
                            href={stone.image_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Ver imagem
                          </a>
                        ) : (
                          'Sem imagem'
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={[
                            'rounded-full px-2 py-1 text-xs font-semibold',
                            stone.active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-stone-100 text-stone-600',
                          ].join(' ')}
                        >
                          {stone.active ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-md border border-stoneLine px-3 py-2 font-medium text-graphite transition hover:bg-stone-100"
                            type="button"
                            onClick={() => startEditing(stone)}
                          >
                            Editar
                          </button>
                          <button
                            className="rounded-md border border-stoneLine px-3 py-2 font-medium text-graphite transition hover:bg-stone-100"
                            type="button"
                            onClick={() => void toggleStoneActive(stone)}
                          >
                            {stone.active ? 'Desativar' : 'Ativar'}
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
