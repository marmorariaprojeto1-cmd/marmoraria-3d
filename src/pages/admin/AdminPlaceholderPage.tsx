type AdminPlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function AdminPlaceholderPage({
  eyebrow,
  title,
  description,
}: AdminPlaceholderPageProps) {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold text-graphite">{title}</h1>
        <p className="mt-3 max-w-3xl text-stone-700">{description}</p>
      </div>

      <div className="rounded-lg border border-dashed border-stoneLine bg-white p-6 shadow-sm">
        <p className="font-medium text-graphite">Placeholder operacional</p>
        <p className="mt-2 text-stone-700">
          Esta tela reserva a estrutura visual para a etapa futura. Nenhum CRUD,
          integração com Supabase, upload, dado real ou regra de negócio foi
          implementado aqui.
        </p>
      </div>
    </section>
  );
}
