import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveUserCompanyId } from '../../admin/company';
import { useAuth } from '../../auth/useAuth';
import { supabase } from '../../lib/supabase';

type QuoteStatus = 'submitted' | 'contacted' | 'negotiating' | 'won' | 'lost';

type DashboardQuote = {
  id: string;
  company_id: string;
  customer_name: string;
  customer_phone: string;
  city: string | null;
  status: QuoteStatus;
  total_price: number;
  created_at: string;
};

const dashboardStatuses: QuoteStatus[] = [
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

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<DashboardQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadQuotes = useCallback(async (nextCompanyId: string) => {
    const { data, error } = await supabase
      .from('quotes')
      .select(
        'id, company_id, customer_name, customer_phone, city, status, total_price, created_at',
      )
      .eq('company_id', nextCompanyId)
      .in('status', dashboardStatuses)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    setQuotes((data ?? []) as DashboardQuote[]);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCompanyAndDashboard() {
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
            'Não foi possível carregar o dashboard. Verifique as permissões do Supabase.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadCompanyAndDashboard();

    return () => {
      mounted = false;
    };
  }, [loadQuotes, user]);

  const metrics = useMemo(() => {
    const submittedQuotes = quotes.filter(
      (quote) => quote.status === 'submitted',
    );
    const negotiatingQuotes = quotes.filter(
      (quote) => quote.status === 'negotiating',
    );
    const wonQuotes = quotes.filter((quote) => quote.status === 'won');
    const lostQuotes = quotes.filter((quote) => quote.status === 'lost');

    const sumByStatus = (status: QuoteStatus) =>
      quotes
        .filter((quote) => quote.status === status)
        .reduce((total, quote) => total + quote.total_price, 0);

    return {
      submittedCount: submittedQuotes.length,
      negotiatingCount: negotiatingQuotes.length,
      wonCount: wonQuotes.length,
      lostCount: lostQuotes.length,
      totalEstimatedValue: quotes.reduce(
        (total, quote) => total + quote.total_price,
        0,
      ),
      negotiatingValue: sumByStatus('negotiating'),
      wonValue: sumByStatus('won'),
    };
  }, [quotes]);

  const dashboardCards = [
    { label: 'Pedidos novos', value: String(metrics.submittedCount) },
    { label: 'Em negociação', value: String(metrics.negotiatingCount) },
    { label: 'Fechados', value: String(metrics.wonCount) },
    { label: 'Perdidos', value: String(metrics.lostCount) },
    {
      label: 'Valor total estimado',
      value: formatCurrency(metrics.totalEstimatedValue),
    },
    {
      label: 'Valor em negociação',
      value: formatCurrency(metrics.negotiatingValue),
    },
    { label: 'Valor fechado', value: formatCurrency(metrics.wonValue) },
  ];

  const latestQuotes = quotes.slice(0, 5);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-graphite">
          Visão geral da marmoraria
        </h1>
        <p className="mt-3 max-w-3xl text-stone-700">
          Indicadores reais de pedidos e oportunidades da empresa vinculada ao
          usuário autenticado.
        </p>
      </div>

      {!companyId && !loading && (
        <div className="rounded-md border border-copper/30 bg-orange-50 p-4 text-sm text-stone-800">
          Nenhuma empresa foi vinculada ao usuário autenticado. Para preservar a
          arquitetura multiempresa, o dashboard fica bloqueado até existir um
          vínculo ativo em public.users com o mesmo e-mail do login.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-stoneLine bg-white p-5 text-stone-700 shadow-sm">
          Carregando indicadores...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map((card) => (
              <div
                key={card.label}
                className="rounded-lg border border-stoneLine bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-stone-600">
                  {card.label}
                </p>
                <p className="mt-3 text-3xl font-bold text-graphite">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-stoneLine bg-white shadow-sm">
            <div className="border-b border-stoneLine p-5">
              <h2 className="text-lg font-semibold text-graphite">
                Últimos pedidos
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Lista simples dos pedidos mais recentes da empresa.
              </p>
            </div>

            {latestQuotes.length === 0 ? (
              <p className="p-5 text-stone-700">
                Nenhum pedido foi encontrado para esta empresa.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stoneLine text-sm">
                  <thead className="bg-stone-50 text-left text-xs font-semibold uppercase text-stone-600">
                    <tr>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Telefone</th>
                      <th className="px-4 py-3">Cidade</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stoneLine">
                    {latestQuotes.map((quote) => (
                      <tr key={quote.id}>
                        <td className="px-4 py-3 font-medium text-graphite">
                          {quote.customer_name}
                        </td>
                        <td className="px-4 py-3 text-stone-700">
                          {quote.customer_phone}
                        </td>
                        <td className="px-4 py-3 text-stone-700">
                          {quote.city || 'Não informada'}
                        </td>
                        <td className="px-4 py-3 text-stone-700">
                          {statusLabels[quote.status]}
                        </td>
                        <td className="px-4 py-3 font-semibold text-graphite">
                          {formatCurrency(quote.total_price)}
                        </td>
                        <td className="px-4 py-3 text-stone-700">
                          {formatDate(quote.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
