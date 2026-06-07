import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { resolveUserCompanyId } from '../../admin/company';
import { useAuth } from '../../auth/useAuth';
import { supabase } from '../../lib/supabase';

type Product = {
  id: string;
  company_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
};

type ProductFormState = {
  name: string;
  description: string;
  categoryId: string;
  active: boolean;
};

const emptyForm: ProductFormState = {
  name: '',
  description: '',
  categoryId: '',
  active: true,
};

export function ProductsPage() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const editingProduct = useMemo(
    () => products.find((product) => product.id === editingProductId) ?? null,
    [editingProductId, products],
  );

  const loadProducts = useCallback(async (nextCompanyId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('id, company_id, category_id, name, description, active, created_at')
      .eq('company_id', nextCompanyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    setProducts((data ?? []) as Product[]);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCompanyAndProducts() {
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
          await loadProducts(nextCompanyId);
        }
      } catch {
        if (mounted) {
          setErrorMessage(
            'Não foi possível carregar os produtos. Verifique as permissões do Supabase.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadCompanyAndProducts();

    return () => {
      mounted = false;
    };
  }, [loadProducts, user]);

  function updateForm(field: keyof ProductFormState, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingProductId(null);
  }

  function startEditing(product: Product) {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? '',
      categoryId: product.category_id ?? '',
      active: product.active,
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
        'Usuário autenticado sem empresa vinculada. Configure o vínculo em public.users antes de cadastrar produtos.',
      );
      return;
    }

    setSaving(true);

    const payload = {
      company_id: companyId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      category_id: form.categoryId.trim() || null,
      active: form.active,
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id)
          .eq('company_id', companyId);

        if (error) {
          throw error;
        }

        setSuccessMessage('Produto atualizado com sucesso.');
      } else {
        const { error } = await supabase.from('products').insert(payload);

        if (error) {
          throw error;
        }

        setSuccessMessage('Produto cadastrado com sucesso.');
      }

      resetForm();
      await loadProducts(companyId);
    } catch {
      setErrorMessage(
        'Não foi possível salvar o produto. Verifique os dados e as permissões.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleProductActive(product: Product) {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase
        .from('products')
        .update({ active: !product.active })
        .eq('id', product.id)
        .eq('company_id', product.company_id);

      if (error) {
        throw error;
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id ? { ...item, active: !product.active } : item,
        ),
      );
      setSuccessMessage(
        product.active ? 'Produto desativado.' : 'Produto ativado.',
      );
    } catch {
      setErrorMessage('Não foi possível alterar o status do produto.');
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Catálogo</p>
        <h1 className="mt-2 text-3xl font-bold text-graphite">Produtos</h1>
        <p className="mt-3 max-w-3xl text-stone-700">
          Cadastre e mantenha os tipos de peça oferecidos pela marmoraria.
          Categorias serão gerenciadas em etapa futura; por enquanto,
          category_id é opcional.
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
              {editingProduct ? 'Editar produto' : 'Cadastrar produto'}
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Configure apenas nome, descrição, categoria opcional e status.
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
              Descrição
            </span>
            <textarea
              className="min-h-28 w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
              value={form.description}
              onChange={(event) =>
                updateForm('description', event.target.value)
              }
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

          <label className="flex items-center gap-3 text-sm font-medium text-stone-700">
            <input
              className="h-4 w-4 accent-moss"
              type="checkbox"
              checked={form.active}
              onChange={(event) => updateForm('active', event.target.checked)}
              disabled={!companyId || saving}
            />
            Produto ativo
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-md bg-graphite px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              type="submit"
              disabled={!companyId || saving}
            >
              {saving
                ? 'Salvando...'
                : editingProduct
                  ? 'Salvar edição'
                  : 'Cadastrar'}
            </button>
            {editingProduct && (
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
              Produtos cadastrados
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Listagem vinculada à empresa do usuário autenticado.
            </p>
          </div>

          {loading ? (
            <p className="p-5 text-stone-700">Carregando produtos...</p>
          ) : products.length === 0 ? (
            <p className="p-5 text-stone-700">
              Nenhum produto cadastrado para esta empresa.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-stone-100 text-stone-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nome</th>
                    <th className="px-4 py-3 font-semibold">Descrição</th>
                    <th className="px-4 py-3 font-semibold">Categoria</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stoneLine">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-4 font-medium text-graphite">
                        {product.name}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-stone-700">
                        {product.description || 'Sem descrição'}
                      </td>
                      <td className="px-4 py-4 text-stone-700">
                        {product.category_id || 'Sem categoria'}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={[
                            'rounded-full px-2 py-1 text-xs font-semibold',
                            product.active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-stone-100 text-stone-600',
                          ].join(' ')}
                        >
                          {product.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-md border border-stoneLine px-3 py-2 font-medium text-graphite transition hover:bg-stone-100"
                            type="button"
                            onClick={() => startEditing(product)}
                          >
                            Editar
                          </button>
                          <button
                            className="rounded-md border border-stoneLine px-3 py-2 font-medium text-graphite transition hover:bg-stone-100"
                            type="button"
                            onClick={() => void toggleProductActive(product)}
                          >
                            {product.active ? 'Desativar' : 'Ativar'}
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
