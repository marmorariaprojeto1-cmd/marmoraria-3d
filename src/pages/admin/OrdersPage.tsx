import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { resolveUserCompanyId } from '../../admin/company';
import { useAuth } from '../../auth/useAuth';
import { supabase } from '../../lib/supabase';
import { generateQuotePDF } from '../../admin/generateQuotePDF';

type QuoteStatus = 'submitted' | 'contacted' | 'negotiating' | 'won' | 'lost';

type Quote = {
  id: string;
  company_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  city: string | null;
  status: QuoteStatus;
  total_price: number;
  created_at: string;
};

type RelatedName = {
  name: string;
};

type SnapshotComponent = {
  enabled?: boolean;
  height?: number | null;
  width?: number | null;
  centerX?: number | null;
  type?: string | null;
  frontMargin?: number | null;
  backMargin?: number | null;
};

type ConfigurationSnapshot = {
  version?: number;
  source?: string;
  customer?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
  };
  countertop?: {
    width?: number | null;
    depth?: number | null;
    thickness?: number | null;
    stoneName?: string | null;
    stoneId?: string | null;
    totalPrice?: number | null;
  };
  components?: {
    backsplashRear?: SnapshotComponent;
    backsplashLeft?: SnapshotComponent;
    backsplashRight?: SnapshotComponent;
    skirtFront?: SnapshotComponent;
    skirtRear?: SnapshotComponent;
    skirtLeft?: SnapshotComponent;
    skirtRight?: SnapshotComponent;
    wetArea?: SnapshotComponent;
    sink?: SnapshotComponent;
    cooktop?: SnapshotComponent;
  };
  pricing?: {
    total?: number | null;
    baseStone?: number | null;
    components?: Array<{
      id?: string;
      label?: string;
      name?: string;
      formula?: string;
      areaM2?: number | null;
      configuredPrice?: number | null;
      price?: number;
      source?: string;
    }>;
  };
};

type PricingComponentSnapshot = NonNullable<
  NonNullable<ConfigurationSnapshot['pricing']>['components']
>[number];

type QuoteItem = {
  id: string;
  quote_id: string;
  product_id: string | null;
  stone_id: string | null;
  sink_id: string | null;
  finish_id: string | null;
  width: number;
  depth: number;
  thickness: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  calculated_area: number | null;
  stone_price_snapshot: number | null;
  sink_price_snapshot: number | null;
  finish_price_snapshot: number | null;
  thickness_multiplier: number | null;
  subtotal_snapshot: number | null;
  total_snapshot: number | null;
  product_name_snapshot: string | null;
  stone_name_snapshot: string | null;
  sink_name_snapshot: string | null;
  finish_name_snapshot: string | null;
  stone_price_per_m2_snapshot: number | null;
  sink_unit_price_snapshot: number | null;
  finish_unit_price_snapshot: number | null;
  finish_pricing_type_snapshot: string | null;
  configuration_snapshot: ConfigurationSnapshot | null;
  products: RelatedName | null;
  stones: RelatedName | null;
  sinks: RelatedName | null;
  finishes: RelatedName | null;
};

const allowedStatuses: QuoteStatus[] = [
  'submitted',
  'contacted',
  'negotiating',
  'won',
  'lost',
];

const statusLabels: Record<QuoteStatus, string> = {
  submitted: 'Recebido',
  contacted: 'Contatado',
  negotiating: 'Em negociação',
  won: 'Fechado',
  lost: 'Perdido',
};

const statusStyles: Record<QuoteStatus, string> = {
  submitted: 'border-green-200 bg-green-50 text-green-700',
  contacted: 'border-blue-200 bg-blue-50 text-blue-700',
  negotiating: 'border-amber-200 bg-amber-50 text-amber-700',
  won: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  lost: 'border-red-200 bg-red-50 text-red-700',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatOptionalCurrency(value: number | null) {
  return value === null ? 'Não registrado' : formatCurrency(value);
}

function formatOptionalArea(value: number | null) {
  return value === null ? 'Não registrada' : `${value.toFixed(2)} m²`;
}

function formatOptionalMultiplier(value: number | null) {
  return value === null ? 'Não registrado' : `${value.toFixed(2)}x`;
}

function formatPricingType(value: string | null) {
  if (!value) {
    return 'Não registrado';
  }

  const labels: Record<string, string> = {
    fixed: 'Valor fixo',
    linear_meter: 'Metro linear',
    percentage: 'Percentual',
  };

  return labels[value] ?? value;
}

function formatOptionalNumber(value: number | null | undefined, suffix: string) {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value.toFixed(2)}${suffix}`
    : 'Não registrado';
}

function formatMeasure(value: number | null | undefined, suffix: string) {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}${suffix}`
    : 'Não registrado';
}

function formatThickness(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value.toLocaleString('pt-BR', {
      maximumFractionDigits: 2,
    })}cm`
    : 'Não registrado';
}

function formatSnapshotComponent(label: string, component: SnapshotComponent | undefined) {
  if (!component?.enabled) {
    return `${label}: não`;
  }

  const details: string[] = [];

  if (typeof component.height === 'number') {
    details.push(`${component.height}cm`);
  }

  if (component.type) {
    details.push(component.type);
  }

  if (typeof component.width === 'number') {
    details.push(`largura ${component.width.toFixed(2)}m`);
  }

  if (typeof component.centerX === 'number') {
    details.push(`centro ${component.centerX.toFixed(2)}m`);
  }

  return details.length > 0 ? `${label}: ${details.join(' · ')}` : `${label}: sim`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatWhatsAppPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

function buildWhatsAppUrl(quote: Quote, snapshot: ConfigurationSnapshot | null) {
  const countertop = snapshot?.countertop ?? {};
  const pricing = snapshot?.pricing ?? {};
  const stoneName = countertop.stoneName ?? 'Não informada';
  const width = typeof countertop.width === 'number' ? countertop.width.toFixed(2) : 'Não informado';
  const depth = typeof countertop.depth === 'number' ? countertop.depth.toFixed(2) : 'Não informada';
  const total = pricing.total ?? countertop.totalPrice ?? quote.total_price;
  const message = [
    `Olá, ${quote.customer_name}! Tudo bem?`,
    '',
    'Segue seu orçamento da Marmoraria 3D:',
    '',
    `Pedra: ${stoneName}`,
    `Medidas: ${width}m x ${depth}m`,
    `Valor total: ${formatCurrency(total)}`,
    '',
    'O orçamento em PDF já está disponível para envio.',
    '',
    'Qualquer dúvida, fico à disposição.',
  ].join('\n');

  return `https://wa.me/${formatWhatsAppPhone(quote.customer_phone)}?text=${encodeURIComponent(message)}`;
}

export function OrdersPage() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updatingQuoteId, setUpdatingQuoteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedQuote = useMemo(
    () => quotes.find((quote) => quote.id === selectedQuoteId) ?? null,
    [quotes, selectedQuoteId],
  );
  const project3DItem = useMemo(
    () => quoteItems.find((item) => item.configuration_snapshot) ?? null,
    [quoteItems],
  );

  const loadQuotes = useCallback(async (nextCompanyId: string) => {
    const { data, error } = await supabase
      .from('quotes')
      .select(
        'id, company_id, customer_name, customer_phone, customer_email, city, status, total_price, created_at',
      )
      .eq('company_id', nextCompanyId)
      .in('status', allowedStatuses)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    setQuotes((data ?? []) as Quote[]);
  }, []);

  const loadQuoteItems = useCallback(
    async (quoteId: string, nextCompanyId = companyId) => {
      if (!nextCompanyId) {
        return;
      }

      setLoadingDetails(true);
      setErrorMessage('');

      try {
        const { data, error } = await supabase
          .from('quote_items')
          .select('*, products(name), stones(name), sinks(name), finishes(name)')
          .eq('company_id', nextCompanyId)
          .eq('quote_id', quoteId)
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }

        setQuoteItems((data ?? []) as unknown as QuoteItem[]);
      } catch {
        setErrorMessage(
          'Não foi possível carregar os itens do pedido. Verifique as permissões do Supabase.',
        );
      } finally {
        setLoadingDetails(false);
      }
    },
    [companyId],
  );

  useEffect(() => {
    let mounted = true;

    async function loadCompanyAndQuotes() {
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
          await loadQuotes(nextCompanyId);
        }
      } catch {
        if (mounted) {
          setErrorMessage(
            'Não foi possível carregar os pedidos. Verifique as permissões do Supabase.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadCompanyAndQuotes();

    return () => {
      mounted = false;
    };
  }, [loadQuotes, user]);

  async function openDetails(quote: Quote) {
    setSelectedQuoteId(quote.id);
    setSuccessMessage('');
    setQuoteItems([]);
    await loadQuoteItems(quote.id, quote.company_id);
    window.setTimeout(() => {
      document
        .getElementById('order-details-panel')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  async function updateQuoteStatus(quote: Quote, nextStatus: QuoteStatus) {
    if (!companyId || quote.status === nextStatus) {
      return;
    }

    setUpdatingQuoteId(quote.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: nextStatus })
        .eq('id', quote.id)
        .eq('company_id', companyId);

      if (error) {
        throw error;
      }

      setQuotes((current) =>
        current.map((item) =>
          item.id === quote.id ? { ...item, status: nextStatus } : item,
        ),
      );
      setSuccessMessage('Status do pedido atualizado.');
    } catch {
      setErrorMessage('Não foi possível alterar o status do pedido.');
    } finally {
      setUpdatingQuoteId(null);
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <p className="admin-page-kicker">Pedidos</p>
        <h1 className="admin-page-title">
          Pedidos recebidos
        </h1>
        <p className="admin-page-description">
          Acompanhe os orçamentos enviados pelos clientes e atualize o status
          comercial sem sair do painel da marmoraria.
        </p>
      </div>

      {!companyId && !loading && (
        <div className="message-warning">
          Nenhuma empresa foi vinculada ao usuário autenticado. Para preservar a
          arquitetura multiempresa, os pedidos ficam bloqueados até existir um
          vínculo ativo em public.users com o mesmo e-mail do login.
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

      <div className="surface-card overflow-hidden">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            Lista de pedidos
          </h2>
          <p className="admin-card-description">
            Exibindo apenas pedidos da empresa vinculada ao usuário logado.
          </p>
        </div>

        {loading ? (
          <p className="p-5 text-stone-700">Carregando pedidos...</p>
        ) : quotes.length === 0 ? (
          <p className="m-5 rounded-md bg-stone-50 p-4 text-stone-700">
            Nenhum pedido foi encontrado para esta empresa.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[860px]">
              <thead>
                <tr>
                  <th className="w-[118px]">Ações</th>
                  <th>Cliente</th>
                  <th className="w-[126px]">Telefone</th>
                  <th className="w-[126px]">Cidade</th>
                  <th className="w-[136px]">Status</th>
                  <th className="w-[130px] text-right">Valor total</th>
                  <th className="w-[136px]">Data</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.id} className="align-middle">
                    <td>
                      <button
                        className="admin-action-button"
                        type="button"
                        onClick={() => void openDetails(quote)}
                        aria-label={`Ver detalhes do pedido de ${quote.customer_name}`}
                      >
                        Ver detalhes
                      </button>
                    </td>
                    <td className="font-medium text-graphite">
                      {quote.customer_name}
                    </td>
                    <td className="whitespace-nowrap text-stone-700">
                      {quote.customer_phone}
                    </td>
                    <td className="text-stone-700">
                      {quote.city || 'Não informada'}
                    </td>
                    <td>
                      <select
                        className={[
                          'w-full rounded-md border px-3 py-2 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-moss/20 disabled:cursor-not-allowed disabled:opacity-60',
                          statusStyles[quote.status],
                        ].join(' ')}
                        value={quote.status}
                        onChange={(event) =>
                          void updateQuoteStatus(
                            quote,
                            event.target.value as QuoteStatus,
                          )
                        }
                        disabled={updatingQuoteId === quote.id}
                      >
                        {allowedStatuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap text-right font-semibold text-graphite">
                      {formatCurrency(quote.total_price)}
                    </td>
                    <td className="whitespace-nowrap text-stone-700">
                      {formatDate(quote.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedQuote && (
        <div
          className="surface-card scroll-mt-24 p-5"
          id="order-details-panel"
        >
          <div className="border-b border-stoneLine pb-3">
            <div>
              <p className="text-sm font-semibold uppercase text-moss">
                Dados do pedido
              </p>
              <h2 className="mt-1 text-xl font-bold text-graphite">
                {selectedQuote.customer_name}
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                {selectedQuote.customer_phone} ·{' '}
                {selectedQuote.city || 'Cidade não informada'}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  generateQuotePDF(
                    {
                      id: selectedQuote.id,
                      customerName: selectedQuote.customer_name,
                      customerPhone: selectedQuote.customer_phone,
                      city: selectedQuote.city,
                      totalPrice: selectedQuote.total_price,
                      createdAt: selectedQuote.created_at,
                    },
                    project3DItem?.configuration_snapshot ?? null,
                  )
                }
              >
                Gerar PDF
              </button>
              <a
                className="secondary-button"
                href={buildWhatsAppUrl(
                  selectedQuote,
                  project3DItem?.configuration_snapshot ?? null,
                )}
                target="_blank"
                rel="noreferrer"
              >
                Enviar WhatsApp
              </a>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setSelectedQuoteId(null);
                  setQuoteItems([]);
                }}
              >
                Fechar detalhes
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SummaryBox
              label="Status"
              value={statusLabels[selectedQuote.status]}
            />
            <SummaryBox
              label="Valor total"
              value={formatCurrency(selectedQuote.total_price)}
            />
            <SummaryBox label="Data" value={formatDate(selectedQuote.created_at)} />
          </div>

          <div className="mt-4">
            {!loadingDetails && project3DItem?.configuration_snapshot && (
              <Project3DSummary
                item={project3DItem}
                snapshot={project3DItem.configuration_snapshot}
              />
            )}

            <div className="border-t border-stoneLine pt-4">
              <h3 className="text-base font-semibold text-graphite">
                Itens técnicos e legado
              </h3>
              <p className="mt-1 text-sm text-stone-600">
                Dados salvos para compatibilidade com pedidos e snapshots anteriores.
              </p>
            </div>

            {loadingDetails ? (
              <p className="mt-3 text-stone-700">Carregando itens...</p>
            ) : quoteItems.length === 0 ? (
              <p className="mt-3 text-stone-700">
                Nenhum item foi encontrado para este pedido.
              </p>
            ) : (
              <div className="mt-4 grid gap-4">
                {quoteItems.map((item) => (
                  <div key={item.id} className="soft-card p-4">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <SummaryBox
                        label="Produto"
                        value={
                          item.product_name_snapshot ??
                          item.products?.name ??
                          'Não informado'
                        }
                      />
                      <SummaryBox
                        label="Pedra"
                        value={
                          item.stone_name_snapshot ??
                          item.stones?.name ??
                          'Não informada'
                        }
                      />
                      <SummaryBox
                        label="Cuba"
                        value={
                          item.sink_name_snapshot ??
                          item.sinks?.name ??
                          'Não informada'
                        }
                      />
                      <SummaryBox
                        label="Acabamento"
                        value={
                          item.finish_name_snapshot ??
                          item.finishes?.name ??
                          'Não informado'
                        }
                      />
                      <SummaryBox
                        label="Medidas"
                        value={`${item.width.toFixed(2)}m x ${item.depth.toFixed(
                          2,
                        )}m · esp. ${item.thickness.toFixed(1)}cm`}
                      />
                      <SummaryBox
                        label="Quantidade"
                        value={String(item.quantity)}
                      />
                      <SummaryBox
                        label="Valor unitário"
                        value={formatCurrency(item.unit_price)}
                      />
                      <SummaryBox
                        label="Valor total"
                        value={formatCurrency(item.total_price)}
                      />
                    </div>

                    <div className="mt-4 border-t border-stoneLine pt-3">
                      <h4 className="text-sm font-semibold uppercase text-stone-500">
                        Snapshot comercial do pedido
                      </h4>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryBox
                          label="Produto snapshot"
                          value={
                            item.product_name_snapshot ??
                            item.products?.name ??
                            'Não registrado'
                          }
                        />
                        <SummaryBox
                          label="Pedra snapshot"
                          value={
                            item.stone_name_snapshot ??
                            item.stones?.name ??
                            'Não registrada'
                          }
                        />
                        <SummaryBox
                          label="Cuba snapshot"
                          value={
                            item.sink_name_snapshot ??
                            item.sinks?.name ??
                            'Não registrada'
                          }
                        />
                        <SummaryBox
                          label="Acabamento snapshot"
                          value={
                            item.finish_name_snapshot ??
                            item.finishes?.name ??
                            'Não registrado'
                          }
                        />
                        <SummaryBox
                          label="Preço pedra m²"
                          value={formatOptionalCurrency(
                            item.stone_price_per_m2_snapshot,
                          )}
                        />
                        <SummaryBox
                          label="Preço cuba un."
                          value={formatOptionalCurrency(
                            item.sink_unit_price_snapshot,
                          )}
                        />
                        <SummaryBox
                          label="Preço acabamento"
                          value={formatOptionalCurrency(
                            item.finish_unit_price_snapshot,
                          )}
                        />
                        <SummaryBox
                          label="Tipo acabamento"
                          value={formatPricingType(
                            item.finish_pricing_type_snapshot,
                          )}
                        />
                      </div>
                    </div>

                    <div className="mt-4 border-t border-stoneLine pt-3">
                      <h4 className="text-sm font-semibold uppercase text-stone-500">
                        Breakdown salvo
                      </h4>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryBox
                          label="Área calculada"
                          value={formatOptionalArea(item.calculated_area)}
                        />
                        <SummaryBox
                          label="Pedra calculada"
                          value={formatOptionalCurrency(
                            item.stone_price_snapshot,
                          )}
                        />
                        <SummaryBox
                          label="Cuba calculada"
                          value={formatOptionalCurrency(
                            item.sink_price_snapshot,
                          )}
                        />
                        <SummaryBox
                          label="Acabamento calculado"
                          value={formatOptionalCurrency(
                            item.finish_price_snapshot,
                          )}
                        />
                        <SummaryBox
                          label="Multiplicador esp."
                          value={formatOptionalMultiplier(
                            item.thickness_multiplier,
                          )}
                        />
                        <SummaryBox
                          label="Subtotal snapshot"
                          value={formatOptionalCurrency(item.subtotal_snapshot)}
                        />
                        <SummaryBox
                          label="Total snapshot"
                          value={
                            item.total_snapshot === null
                              ? formatCurrency(item.total_price)
                              : formatCurrency(item.total_snapshot)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Project3DSummary({
  item,
  snapshot,
}: {
  item: QuoteItem;
  snapshot: ConfigurationSnapshot;
}) {
  const countertop = snapshot.countertop ?? {};
  const components = snapshot.components ?? {};
  const pricing = snapshot.pricing ?? {};
  const projectTotal = pricing.total ?? countertop.totalPrice ?? item.total_price;

  return (
    <div className="mb-4 rounded-md border border-moss/30 bg-moss/5 p-3.5">
      <h3 className="text-base font-semibold text-graphite">
        Projeto 3D
      </h3>
      <p className="mt-0.5 text-xs text-stone-600">
        Snapshot estrutural salvo pelo configurador 3D no momento do envio.
      </p>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryBox
          label="Medidas 3D"
          value={`${formatOptionalNumber(countertop.width, 'm')} x ${formatOptionalNumber(
            countertop.depth,
            'm',
          )} · esp. ${formatOptionalNumber(countertop.thickness, 'cm')}`}
        />
        <SummaryBox
          label="Pedra 3D"
          value={countertop.stoneName ?? 'Não registrada'}
        />
        <SummaryBox
          label="Preço 3D"
          value={formatCurrency(projectTotal)}
        />
        <SummaryBox
          label="Origem"
          value={snapshot.source ?? 'Configurador 3D'}
        />
        <SummaryBox
          label="Frontões"
          value={[
            formatSnapshotComponent('Traseiro', components.backsplashRear),
            formatSnapshotComponent('Esquerdo', components.backsplashLeft),
            formatSnapshotComponent('Direito', components.backsplashRight),
          ].join(' | ')}
        />
        <SummaryBox
          label="Saias"
          value={[
            formatSnapshotComponent('Frontal', components.skirtFront),
            formatSnapshotComponent('Traseira', components.skirtRear),
            formatSnapshotComponent('Esquerda', components.skirtLeft),
            formatSnapshotComponent('Direita', components.skirtRight),
          ].join(' | ')}
        />
        <SummaryBox
          label="Área molhada"
          value={formatSnapshotComponent('Área molhada', components.wetArea)}
        />
        <SummaryBox
          label="Cuba"
          value={formatSnapshotComponent('Cuba', components.sink)}
        />
        <SummaryBox
          label="Cooktop"
          value={formatSnapshotComponent('Cooktop', components.cooktop)}
        />
      </div>

      <FinancialBreakdown
        item={item}
        snapshot={snapshot}
      />
    </div>
  );
}

function FinancialBreakdown({
  item,
  snapshot,
}: {
  item: QuoteItem;
  snapshot: ConfigurationSnapshot;
}) {
  const countertop = snapshot.countertop ?? {};
  const pricing = snapshot.pricing ?? {};
  const componentItems = pricing.components ?? [];
  const stoneName = countertop.stoneName ?? 'Pedra não registrada';
  const baseStone = pricing.baseStone ?? null;
  const total = pricing.total ?? countertop.totalPrice ?? item.total_price;
  const stoneLine = `${stoneName} — ${formatMeasure(countertop.width, 'm')} x ${formatMeasure(
    countertop.depth,
    'm',
  )} x ${formatThickness(countertop.thickness)}`;

  const stoneComponents = componentItems.filter((component) =>
    component.source === 'stone_area' ||
    component.areaM2 !== null && component.areaM2 !== undefined,
  );
  const serviceComponents = componentItems.filter((component) =>
    !stoneComponents.includes(component),
  );

  return (
    <div className="mt-4 border-t border-moss/20 pt-4">
      <h4 className="text-base font-semibold text-graphite">
        Resumo financeiro
      </h4>
      <p className="mt-0.5 text-xs text-stone-600">
        Valores exibidos a partir do snapshot salvo no pedido.
      </p>

      <div className="mt-3 overflow-hidden rounded-md border border-stoneLine bg-white">
        <FinancialSection title="Pedra">
          <FinancialLine
            label={stoneLine}
            description="Valor base salvo no snapshot"
            value={baseStone === null ? null : baseStone}
          />
        </FinancialSection>

        {componentItems.length === 0 ? (
          <FinancialSection title="Componentes">
            <FinancialLine
              label="Breakdown de componentes não registrado"
              description="Pedido antigo ou snapshot sem pricing.components"
              value={null}
            />
          </FinancialSection>
        ) : (
          <>
            {stoneComponents.length > 0 && (
              <FinancialSection title="Frontões e saias">
                {stoneComponents.map((component, index) => (
                  <FinancialComponentLine
                    component={component}
                    key={component.id ?? `${component.label ?? component.name}-${index}`}
                  />
                ))}
              </FinancialSection>
            )}

            {serviceComponents.length > 0 && (
              <FinancialSection title="Serviços">
                {serviceComponents.map((component, index) => (
                  <FinancialComponentLine
                    component={component}
                    key={component.id ?? `${component.label ?? component.name}-${index}`}
                  />
                ))}
              </FinancialSection>
            )}
          </>
        )}

        <div className="flex items-center justify-between gap-4 border-t border-stoneLine bg-stone-50 px-3 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-graphite">
            Total
          </p>
          <p className="text-lg font-bold text-graphite">
            {formatCurrency(total)}
          </p>
        </div>
      </div>
    </div>
  );
}

function FinancialSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-stoneLine first:border-t-0">
      <div className="bg-stone-50 px-3 py-1.5">
        <p className="text-[11px] font-semibold uppercase text-stone-500">{title}</p>
      </div>
      <div className="divide-y divide-stoneLine">{children}</div>
    </div>
  );
}

function FinancialComponentLine({
  component,
}: {
  component: PricingComponentSnapshot;
}) {
  const label = component.label ?? component.name ?? 'Componente sem nome';
  const details = [
    component.formula,
    typeof component.areaM2 === 'number'
      ? `Área ${component.areaM2.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })} m²`
      : null,
    typeof component.configuredPrice === 'number'
      ? `Preço configurado ${formatCurrency(component.configuredPrice)}`
      : null,
  ].filter((detail): detail is string => Boolean(detail));

  return (
    <FinancialLine
      label={label}
      description={details.join(' · ') || 'Detalhes não registrados'}
      value={typeof component.price === 'number' ? component.price : null}
    />
  );
}

function FinancialLine({
  label,
  description,
  value,
}: {
  label: string;
  description: string;
  value: number | null;
}) {
  return (
    <div className="grid gap-2 px-3 py-2.5 sm:grid-cols-[1fr_auto] sm:items-start">
      <div>
        <p className="text-sm font-medium text-graphite">{label}</p>
        <p className="mt-0.5 text-xs text-stone-500">{description}</p>
      </div>
      <p className="text-sm font-semibold text-graphite">
        {value === null ? 'Não registrado' : formatCurrency(value)}
      </p>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stoneLine bg-white p-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase text-stone-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-graphite">{value}</p>
    </div>
  );
}
