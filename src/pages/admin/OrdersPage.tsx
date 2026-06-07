import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveUserCompanyId } from '../../admin/company';
import { useAuth } from '../../auth/useAuth';
import { supabase } from '../../lib/supabase';

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
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
          .select(
            [
              'id',
              'quote_id',
              'product_id',
              'stone_id',
              'sink_id',
              'finish_id',
              'width',
              'depth',
              'thickness',
              'quantity',
              'unit_price',
              'total_price',
              'products(name)',
              'stones(name)',
              'sinks(name)',
              'finishes(name)',
            ].join(', '),
          )
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
    await loadQuoteItems(quote.id, quote.company_id);
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
    <section className="page-shell">
      <div>
        <p className="page-kicker">Pedidos</p>
        <h1 className="page-title">
          Pedidos recebidos
        </h1>
        <p className="page-description">
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
        <div className="border-b border-stoneLine p-5">
          <h2 className="text-lg font-semibold text-graphite">
            Lista de pedidos
          </h2>
          <p className="mt-1 text-sm text-stone-600">
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
            <table className="min-w-full divide-y divide-stoneLine text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Valor total</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stoneLine">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="align-top">
                    <td className="table-cell font-medium text-graphite">
                      {quote.customer_name}
                    </td>
                    <td className="table-cell text-stone-700">
                      {quote.customer_phone}
                    </td>
                    <td className="table-cell text-stone-700">
                      {quote.city || 'Não informada'}
                    </td>
                    <td className="table-cell">
                      <select
                        className="rounded-md border border-stoneLine bg-white px-3 py-2 text-sm text-graphite outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/20 disabled:cursor-not-allowed disabled:text-stone-400"
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
                    <td className="table-cell font-semibold text-graphite">
                      {formatCurrency(quote.total_price)}
                    </td>
                    <td className="table-cell text-stone-700">
                      {formatDate(quote.created_at)}
                    </td>
                    <td className="table-cell">
                      <button
                        className="secondary-button px-3 py-2"
                        type="button"
                        onClick={() => void openDetails(quote)}
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedQuote && (
        <div className="surface-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-moss">
                Detalhe do pedido
              </p>
              <h2 className="mt-1 text-2xl font-bold text-graphite">
                {selectedQuote.customer_name}
              </h2>
              <p className="mt-2 text-sm text-stone-600">
                {selectedQuote.customer_phone} ·{' '}
                {selectedQuote.city || 'Cidade não informada'}
              </p>
            </div>
            <button
              className="secondary-button px-3 py-2"
              type="button"
              onClick={() => {
                setSelectedQuoteId(null);
                setQuoteItems([]);
              }}
            >
              Fechar detalhes
            </button>
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

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-graphite">
              Itens do orçamento
            </h3>

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
                        value={item.products?.name ?? 'Não informado'}
                      />
                      <SummaryBox
                        label="Pedra"
                        value={item.stones?.name ?? 'Não informada'}
                      />
                      <SummaryBox
                        label="Cuba"
                        value={item.sinks?.name ?? 'Não informada'}
                      />
                      <SummaryBox
                        label="Acabamento"
                        value={item.finishes?.name ?? 'Não informado'}
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

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stoneLine bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-stone-500">{label}</p>
      <p className="mt-1 font-medium text-graphite">{value}</p>
    </div>
  );
}
