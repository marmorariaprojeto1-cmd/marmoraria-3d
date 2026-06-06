const dashboardCards = [
  { label: 'Pedidos novos', value: '0' },
  { label: 'Em negociação', value: '0' },
  { label: 'Fechados', value: '0' },
  { label: 'Valor estimado', value: 'R$ 0,00' },
];

export function AdminDashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-graphite">
          Visão geral da marmoraria
        </h1>
        <p className="mt-3 text-stone-700">
          Indicadores iniciais do painel administrativo. Dados reais serão
          conectados em fases futuras.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-stoneLine bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-stone-600">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-graphite">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
