import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { resolveUserCompanyId } from '../../admin/company';
import { supabase } from '../../lib/supabase';

const STONE_IMAGE_BUCKET = 'company-assets';
const MAX_STONE_IMAGE_SIZE = 2 * 1024 * 1024;
const STONE_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

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

type StoneCategory = {
  id: string;
  company_id: string;
  name: string;
  slug: string | null;
  sort_order: number | null;
  active: boolean;
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

function sanitizeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildStoneImagePath(companyId: string, file: File) {
  const safeName = sanitizeFileName(file.name) || 'stone-image';
  return `${companyId}/stones/${crypto.randomUUID()}-${safeName}`;
}

export function StonesPage() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [stones, setStones] = useState<Stone[]>([]);
  const [categories, setCategories] = useState<StoneCategory[]>([]);
  const [form, setForm] = useState<StoneFormState>(emptyForm);
  const [editingStoneId, setEditingStoneId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const editingStone = useMemo(
    () => stones.find((stone) => stone.id === editingStoneId) ?? null,
    [editingStoneId, stones],
  );
  const categoryNameById = useMemo(
    () =>
      new Map(
        categories.map((category) => [category.id, category.name] as const),
      ),
    [categories],
  );
  const categorySortOrderByName = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.name,
          category.sort_order ?? 999,
        ] as const),
      ),
    [categories],
  );
  const groupedStones = useMemo(() => {
    const groups = new Map<string, Stone[]>();

    stones.forEach((stone) => {
      const groupName = stone.category_id
        ? (categoryNameById.get(stone.category_id) ?? 'Sem categoria')
        : 'Sem categoria';
      groups.set(groupName, [...(groups.get(groupName) ?? []), stone]);
    });

    return Array.from(groups.entries())
      .map(([name, items]) => ({
        name,
        items: items.sort((left, right) => left.name.localeCompare(right.name)),
      }))
      .sort((left, right) => {
        const orderDiff =
          (categorySortOrderByName.get(left.name) ?? 999) -
          (categorySortOrderByName.get(right.name) ?? 999);

        return orderDiff || left.name.localeCompare(right.name);
      });
  }, [categoryNameById, categorySortOrderByName, stones]);

  const loadStoneCategories = useCallback(async (nextCompanyId: string) => {
    const { data, error } = await supabase
      .from('stone_categories')
      .select('id, company_id, name, slug, sort_order, active')
      .eq('company_id', nextCompanyId)
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao carregar categorias de pedras:', error);
      setCategories([]);
      return;
    }

    setCategories((data ?? []) as StoneCategory[]);
  }, []);

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
          await Promise.all([
            loadStoneCategories(nextCompanyId),
            loadStones(nextCompanyId),
          ]);
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
  }, [loadStoneCategories, loadStones, user]);

  function updateForm(field: keyof StoneFormState, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingStoneId(null);
    setFormOpen(false);
  }

  function openCreateForm() {
    setForm(emptyForm);
    setEditingStoneId(null);
    setSuccessMessage('');
    setErrorMessage('');
    setFormOpen(true);
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
    setFormOpen(true);
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
    } catch (err) {
      console.error('Erro ao salvar pedra:', err);
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Verifique os dados e as permissões.';
      setErrorMessage(
        `Não foi possível salvar a pedra. ${message}`,
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

  async function handleImageUpload(file: File | null) {
    setErrorMessage('');
    setSuccessMessage('');

    if (!file) {
      return;
    }

    if (!companyId) {
      setErrorMessage(
        'Usuário autenticado sem empresa vinculada. Não foi possível enviar a imagem.',
      );
      return;
    }

    if (!STONE_IMAGE_MIME_TYPES.includes(file.type)) {
      setErrorMessage('Envie uma imagem PNG, JPG, JPEG ou WebP.');
      return;
    }

    if (file.size > MAX_STONE_IMAGE_SIZE) {
      setErrorMessage('A imagem deve ter no máximo 2MB.');
      return;
    }

    setUploadingImage(true);

    try {
      const filePath = buildStoneImagePath(companyId, file);
      const { error: uploadError } = await supabase.storage
        .from(STONE_IMAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(STONE_IMAGE_BUCKET)
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;
      updateForm('imageUrl', publicUrl);

      if (editingStone) {
        const { error: updateError } = await supabase
          .from('stones')
          .update({ image_url: publicUrl })
          .eq('id', editingStone.id)
          .eq('company_id', companyId);

        if (updateError) {
          throw updateError;
        }

        setStones((current) =>
          current.map((stone) =>
            stone.id === editingStone.id
              ? { ...stone, image_url: publicUrl }
              : stone,
          ),
        );
      }

      setSuccessMessage(
        editingStone
          ? 'Imagem enviada e vinculada à pedra.'
          : 'Imagem enviada. Salve a pedra para concluir o cadastro.',
      );
    } catch {
      setErrorMessage(
        'Não foi possível enviar a imagem. Verifique o bucket e as permissões do Storage.',
      );
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <section className="admin-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="admin-page-header">
          <p className="admin-page-kicker">Catálogo</p>
          <h1 className="admin-page-title">Pedras</h1>
          <p className="admin-page-description">
            Cadastre as pedras da marmoraria e envie uma imagem para utilização na
            Home e no configurador 3D.
          </p>
        </div>
        <button
          className="primary-button whitespace-nowrap px-4 py-2.5"
          type="button"
          onClick={openCreateForm}
          disabled={!companyId || loading}
        >
          + Nova pedra
        </button>
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
        {formOpen && (
          <form
            className="surface-card p-5"
            onSubmit={handleSubmit}
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-stoneLine pb-4">
              <div>
                <h2 className="text-lg font-semibold text-graphite">
                  {editingStone ? 'Editar pedra' : 'Nova pedra'}
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Informe os dados da pedra e envie uma imagem para a vitrine.
                </p>
              </div>
              <button
                className="rounded-md border border-stoneLine bg-white px-3 py-2 text-sm font-semibold text-graphite transition hover:bg-stone-50"
                type="button"
                onClick={resetForm}
                disabled={saving}
                aria-label="Fechar formulário de pedra"
              >
                X
              </button>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(180px,1fr)_minmax(160px,0.75fr)_minmax(140px,0.45fr)_auto] xl:items-end">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Nome da pedra
                </span>
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
                  Marca/Categoria
                </span>
                <select
                  className="field-input"
                  value={form.categoryId}
                  onChange={(event) => updateForm('categoryId', event.target.value)}
                  disabled={!companyId || saving}
                >
                  <option value="">Sem categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Preço por m²
                </span>
                <input
                  className="field-input"
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

              <label className="flex min-h-[48px] items-center gap-3 whitespace-nowrap text-sm font-medium text-stone-700">
                <input
                  className="h-4 w-4 accent-moss"
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => updateForm('active', event.target.checked)}
                  disabled={!companyId || saving}
                />
                Pedra ativa
              </label>
            </div>

            <div className="mt-4 grid gap-4 border-t border-stoneLine pt-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(260px,1fr)_auto] lg:items-end">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Imagem da pedra
                </span>
                <input
                  className="block w-full text-sm text-stone-700 file:mr-3 file:rounded-md file:border-0 file:bg-graphite file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-stone-800 disabled:cursor-not-allowed"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    void handleImageUpload(event.target.files?.[0] ?? null);
                    event.target.value = '';
                  }}
                  disabled={!companyId || saving || uploadingImage}
                />
              </label>

              <div className="text-sm text-stone-600">
                <p>Formatos aceitos: PNG, JPG, JPEG ou WebP.</p>
                <p>Limite recomendado: 2MB.</p>
                {uploadingImage && (
                  <p className="mt-1 font-medium text-moss">Enviando imagem...</p>
                )}
              </div>

              <StoneImagePreview imageUrl={form.imageUrl} />
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                className="secondary-button whitespace-nowrap px-4 py-2.5"
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="primary-button whitespace-nowrap px-4 py-2.5"
                type="submit"
                disabled={!companyId || saving}
              >
                {saving
                  ? 'Salvando...'
                  : editingStone
                    ? 'Salvar edição'
                    : 'Cadastrar pedra'}
              </button>
            </div>
          </form>
        )}

        <div className="surface-card overflow-hidden">
          <div className="admin-card-header">
            <h2 className="admin-card-title">
              Pedras cadastradas
            </h2>
            <p className="admin-card-description">
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
            <div className="divide-y divide-stoneLine">
              {groupedStones.map((group, index) => (
                <details key={group.name} open={index === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-stone-50 px-5 py-4 text-sm font-semibold text-graphite transition hover:bg-stone-100">
                    <span>
                      {group.name} ({group.items.length})
                    </span>
                    <span className="text-xs font-medium text-stone-500">
                      Clique para expandir
                    </span>
                  </summary>
                  <div className="divide-y divide-stoneLine">
                    {group.items.map((stone) => (
                      <div
                        key={stone.id}
                        className="grid gap-4 px-5 py-4 md:grid-cols-[72px_minmax(0,1fr)_160px_110px_220px] md:items-center"
                      >
                        <div>
                          {stone.image_url ? (
                            <img
                              alt={`Imagem da pedra ${stone.name}`}
                              className="h-[72px] w-[72px] rounded-md border border-stoneLine object-cover"
                              src={stone.image_url}
                            />
                          ) : (
                            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-md border border-dashed border-stoneLine bg-stone-50 px-2 text-center text-[11px] font-medium text-stone-500">
                              Sem imagem
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-graphite">
                            {stone.name}
                          </p>
                          <p className="mt-1 text-sm text-stone-600">
                            {stone.category_id
                              ? (categoryNameById.get(stone.category_id) ??
                                'Sem categoria')
                              : 'Sem categoria'}
                          </p>
                        </div>
                        <p className="font-semibold text-graphite">
                          {formatCurrency(stone.price_per_m2)}/m²
                        </p>
                        <span
                          className={[
                            'admin-status-badge w-fit',
                            stone.active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-stone-100 text-stone-600',
                          ].join(' ')}
                        >
                          {stone.active ? 'Ativa' : 'Inativa'}
                        </span>
                        <div className="flex flex-wrap gap-2 md:justify-end">
                          <button
                            className="admin-action-button"
                            type="button"
                            onClick={() => startEditing(stone)}
                          >
                            Editar
                          </button>
                          <button
                            className="admin-action-button"
                            type="button"
                            onClick={() => void toggleStoneActive(stone)}
                          >
                            {stone.active ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StoneImagePreview({ imageUrl }: { imageUrl: string }) {
  if (!imageUrl.trim()) {
    return (
      <div className="flex h-16 min-w-[120px] items-center justify-center rounded-md border border-dashed border-stoneLine bg-stone-50 px-3 text-center text-xs font-medium text-stone-500">
        Prévia da pedra
      </div>
    );
  }

  return (
    <img
      alt="Prévia da pedra"
      className="h-16 w-24 rounded-md border border-stoneLine object-cover"
      src={imageUrl}
    />
  );
}
