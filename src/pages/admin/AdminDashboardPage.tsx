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
    <section className="admin-page">
      <div className="admin-page-header">
        <p className="admin-page-kicker">Dashboard</p>
        <h1 className="admin-page-title">
          Visão geral da marmoraria
        </h1>
        <p className="admin-page-description">
          Indicadores reais de pedidos e oportunidades da empresa vinculada ao
          usuário autenticado.
        </p>
      </div>

      {!companyId && !loading && (
        <div className="message-warning">
          Nenhuma empresa foi vinculada ao usuário autenticado. Para preservar a
          arquitetura multiempresa, o dashboard fica bloqueado até existir um
          vínculo ativo em public.users com o mesmo e-mail do login.
        </div>
      )}

      {errorMessage && (
        <div className="message-error">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="surface-card p-5 text-stone-700">
          Carregando indicadores...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map((card) => (
              <div
                key={card.label}
                className="surface-card p-5"
              >
                <p className="text-sm font-medium text-stone-600">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-graphite">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="surface-card overflow-hidden">
            <div className="admin-card-header">
              <h2 className="admin-card-title">
                Últimos pedidos
              </h2>
              <p className="admin-card-description">
                Lista simples dos pedidos mais recentes da empresa.
              </p>
            </div>

            {latestQuotes.length === 0 ? (
              <p className="m-5 rounded-md bg-stone-50 p-4 text-stone-700">
                Nenhum pedido foi encontrado para esta empresa.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table min-w-[780px]">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Telefone</th>
                      <th>Cidade</th>
                      <th>Status</th>
                      <th className="text-right">Valor</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestQuotes.map((quote) => (
                      <tr key={quote.id}>
                        <td className="font-medium text-graphite">
                          {quote.customer_name}
                        </td>
                        <td className="text-stone-700">
                          {quote.customer_phone}
                        </td>
                        <td className="text-stone-700">
                          {quote.city || 'Não informada'}
                        </td>
                        <td className="text-stone-700">
                          {statusLabels[quote.status]}
                        </td>
                        <td className="text-right font-semibold text-graphite">
                          {formatCurrency(quote.total_price)}
                        </td>
                        <td className="text-stone-700">
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
