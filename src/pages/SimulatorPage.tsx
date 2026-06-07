import { useMemo, useState } from 'react';
import { calculateQuoteTotal } from '../services/quoteCalculator';
import type { FinishPricingType } from '../types/quote';

type MockStone = {
  id: string;
  name: string;
  category: string;
  pricePerM2: number;
  previewClassName: string;
};

type MockSink = {
  id: string;
  name: string;
  price: number;
};

type MockFinish = {
  id: string;
  name: string;
  pricingType: FinishPricingType;
  price: number;
};

const mockStones: MockStone[] = [
  {
    id: 'granito-cinza',
    name: 'Granito Cinza',
    category: 'Granito',
    pricePerM2: 420,
    previewClassName: 'from-stone-400 via-stone-300 to-stone-500',
  },
  {
    id: 'quartzo-branco',
    name: 'Quartzo Branco',
    category: 'Quartzo',
    pricePerM2: 780,
    previewClassName: 'from-stone-50 via-white to-stone-200',
  },
  {
    id: 'marmore-claro',
    name: 'Mármore Claro',
    category: 'Mármore',
    pricePerM2: 650,
    previewClassName: 'from-amber-50 via-stone-100 to-white',
  },
];

const mockSinks: MockSink[] = [
  { id: 'sem-cuba', name: 'Sem cuba', price: 0 },
  { id: 'cuba-simples', name: 'Cuba simples', price: 280 },
  { id: 'cuba-dupla', name: 'Cuba dupla', price: 520 },
];

const mockFinishes: MockFinish[] = [
  { id: 'reto', name: 'Reto', pricingType: 'fixed', price: 0 },
  { id: 'boleado', name: 'Boleado', pricingType: 'fixed', price: 180 },
  {
    id: 'meia-esquadria',
    name: 'Meia esquadria',
    pricingType: 'fixed',
    price: 320,
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function SimulatorPage() {
  const [stoneId, setStoneId] = useState(mockStones[0].id);
  const [sinkId, setSinkId] = useState(mockSinks[0].id);
  const [finishId, setFinishId] = useState(mockFinishes[0].id);
  const [width, setWidth] = useState('2.00');
  const [depth, setDepth] = useState('0.60');
  const [quantity, setQuantity] = useState('1');

  const selectedStone =
    mockStones.find((stone) => stone.id === stoneId) ?? mockStones[0];
  const selectedSink =
    mockSinks.find((sink) => sink.id === sinkId) ?? mockSinks[0];
  const selectedFinish =
    mockFinishes.find((finish) => finish.id === finishId) ?? mockFinishes[0];

  const dimensions = useMemo(
    () => ({
      width: Number(width) || 0,
      depth: Number(depth) || 0,
    }),
    [depth, width],
  );
  const resolvedQuantity = Math.max(1, Math.floor(Number(quantity) || 1));

  const quote = useMemo(
    () =>
      calculateQuoteTotal({
        stone: {
          dimensions,
          pricePerM2: selectedStone.pricePerM2,
          quantity: resolvedQuantity,
        },
        sink: {
          price: selectedSink.price,
          quantity: resolvedQuantity,
        },
        finish: {
          pricingType: selectedFinish.pricingType,
          price: selectedFinish.price,
          quantity: resolvedQuantity,
        },
      }),
    [
      dimensions,
      resolvedQuantity,
      selectedFinish.price,
      selectedFinish.pricingType,
      selectedSink.price,
      selectedStone.pricePerM2,
    ],
  );

  const previewWidth = Math.min(100, Math.max(45, dimensions.width * 35));
  const previewHeight = Math.min(70, Math.max(22, dimensions.depth * 70));

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Simulador</p>
        <h1 className="mt-2 text-3xl font-bold text-graphite">
          Simulador 2D inicial
        </h1>
        <p className="mt-3 max-w-3xl text-stone-700">
          Configure uma peça simples com dados mockados locais e veja o
          orçamento estimado em tempo real. Esta versão não salva orçamento, não
          usa Supabase e não possui 3D.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form className="space-y-4 rounded-lg border border-stoneLine bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-graphite">
              Configuração
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Valores locais apenas para validar o motor de orçamento.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Pedra</span>
            <select
              className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
              value={stoneId}
              onChange={(event) => setStoneId(event.target.value)}
            >
              {mockStones.map((stone) => (
                <option key={stone.id} value={stone.id}>
                  {stone.name} - {formatCurrency(stone.pricePerM2)}/m²
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Cuba</span>
            <select
              className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
              value={sinkId}
              onChange={(event) => setSinkId(event.target.value)}
            >
              {mockSinks.map((sink) => (
                <option key={sink.id} value={sink.id}>
                  {sink.name} - {formatCurrency(sink.price)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">
              Acabamento
            </span>
            <select
              className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
              value={finishId}
              onChange={(event) => setFinishId(event.target.value)}
            >
              {mockFinishes.map((finish) => (
                <option key={finish.id} value={finish.id}>
                  {finish.name} - {formatCurrency(finish.price)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">
                Largura (m)
              </span>
              <input
                className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
                type="number"
                min="0"
                step="0.01"
                value={width}
                onChange={(event) => setWidth(event.target.value)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">
                Profundidade (m)
              </span>
              <input
                className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
                type="number"
                min="0"
                step="0.01"
                value={depth}
                onChange={(event) => setDepth(event.target.value)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">
                Quantidade
              </span>
              <input
                className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </label>
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-lg border border-stoneLine bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-graphite">
                  Preview visual 2D
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  {selectedStone.name} · {selectedStone.category}
                </p>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700">
                {dimensions.width.toFixed(2)}m x {dimensions.depth.toFixed(2)}m
              </span>
            </div>

            <div className="mt-8 flex min-h-64 items-center justify-center rounded-lg bg-stone-100 p-6">
              <div
                className={[
                  'relative rounded-md border border-stone-400 bg-gradient-to-br shadow-lg',
                  selectedStone.previewClassName,
                ].join(' ')}
                style={{
                  width: `${previewWidth}%`,
                  height: `${previewHeight}%`,
                  minHeight: '96px',
                }}
              >
                {selectedSink.price > 0 && (
                  <div className="absolute left-1/2 top-1/2 h-12 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-stone-500 bg-white/70 shadow-inner" />
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-stoneLine bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-graphite">
              Resumo do orçamento
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-stone-600">Área total</dt>
                <dd className="font-medium text-graphite">
                  {quote.area.toFixed(2)} m²
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-600">Pedra</dt>
                <dd className="font-medium text-graphite">
                  {formatCurrency(quote.stonePrice)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-600">Cuba</dt>
                <dd className="font-medium text-graphite">
                  {formatCurrency(quote.sinkPrice)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-600">Acabamento</dt>
                <dd className="font-medium text-graphite">
                  {formatCurrency(quote.finishPrice)}
                </dd>
              </div>
              <div className="border-t border-stoneLine pt-4">
                <div className="flex justify-between gap-4">
                  <dt className="text-base font-semibold text-graphite">
                    Valor final estimado
                  </dt>
                  <dd className="text-2xl font-bold text-graphite">
                    {formatCurrency(quote.total)}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
