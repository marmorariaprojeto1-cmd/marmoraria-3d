import { Link } from 'react-router-dom';

const productTypes = ['Bancadas', 'Ilhas', 'Cubas', 'Soleiras'];
const highlights = [
  'Catálogo por marmoraria',
  'Orçamento em tempo real',
  'Envio pelo WhatsApp',
];

export function HomePage() {
  return (
    <section className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div className="space-y-6">
          <div>
            <p className="page-kicker">MVP em demonstração</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold text-graphite sm:text-5xl">
              Orçamentos de marmoraria com visualização simples e resposta
              rápida.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-700">
              O cliente escolhe produto, pedra, medidas e acabamento, acompanha
              o valor estimado e envia a solicitação para a marmoraria em poucos
              passos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/simulador" className="primary-button text-center">
              Montar meu projeto
            </Link>
            <Link to="/admin" className="secondary-button text-center">
              Acessar painel
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div key={item} className="soft-card p-4">
                <p className="text-sm font-semibold text-graphite">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="border-b border-stoneLine bg-stone-50 px-5 py-4">
            <p className="text-sm font-semibold uppercase text-moss">
              Preview do simulador
            </p>
            <h2 className="mt-1 text-xl font-bold text-graphite">
              Bancada de cozinha
            </h2>
          </div>
          <div className="space-y-5 p-5">
            <div className="rounded-lg bg-stone-100 p-5">
              <div className="relative mx-auto h-36 max-w-md rounded-md border border-stone-400 bg-gradient-to-br from-stone-200 via-white to-stone-400 shadow-lg">
                <div className="absolute left-1/2 top-1/2 h-14 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-stone-500 bg-white/75 shadow-inner" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {productTypes.map((item) => (
                <div key={item} className="rounded-md border border-stoneLine p-3">
                  <p className="text-sm font-semibold text-graphite">{item}</p>
                  <p className="mt-1 text-sm text-stone-600">Disponível no MVP</p>
                </div>
              ))}
            </div>
            <div className="rounded-md bg-graphite p-4 text-white">
              <p className="text-sm text-stone-200">Valor estimado</p>
              <p className="mt-1 text-2xl font-bold">R$ 2.480,00</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
