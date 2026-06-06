import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase text-moss">
            MVP Fase 1
          </p>
          <h1 className="max-w-3xl text-4xl font-bold text-graphite sm:text-5xl">
            Fundação técnica da plataforma Marmoraria 3D
          </h1>
          <p className="max-w-2xl text-lg text-stone-700">
            Base inicial em React, Vite, TypeScript, Tailwind, React Router e
            React Query para sustentar as próximas fases do MVP.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/simulador"
            className="rounded-md bg-graphite px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            Abrir simulador
          </Link>
          <Link
            to="/admin"
            className="rounded-md border border-stoneLine px-5 py-3 text-sm font-semibold text-graphite transition hover:bg-white"
          >
            Abrir admin
          </Link>
        </div>
      </div>
      <div className="rounded-lg border border-stoneLine bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-graphite">
          Rotas iniciais
        </h2>
        <ul className="mt-4 space-y-3 text-stone-700">
          <li>/ - Home</li>
          <li>/simulador - Placeholder do simulador</li>
          <li>/admin - Placeholder administrativo</li>
        </ul>
      </div>
    </section>
  );
}
