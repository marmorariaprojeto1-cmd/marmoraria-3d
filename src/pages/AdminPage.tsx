export function AdminPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-graphite">
          Placeholder administrativo
        </h1>
      </div>
      <div className="rounded-lg border border-stoneLine bg-white p-6 shadow-sm">
        <p className="text-stone-700">
          Esta rota reserva o espaço para o painel administrativo futuro. Login,
          autenticação, catálogo, preços, Supabase e dados reais ficam para
          fases posteriores.
        </p>
      </div>
    </section>
  );
}
