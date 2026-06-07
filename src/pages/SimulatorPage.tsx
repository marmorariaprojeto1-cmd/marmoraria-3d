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

type OptionCardProps = {
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
};

const simulatorSteps = [
  'Ambiente',
  'Produto',
  'Pedra',
  'Medidas',
  'Cuba e acabamento',
  'Resumo',
];

const environments = [
  'Cozinha',
  'Banheiro',
  'Área Gourmet',
  'Escada',
  'Soleira',
  'Peitoril',
  'Comercial',
];

const mockProducts = ['Bancada', 'Pia', 'Ilha', 'Nicho', 'Soleira', 'Peitoril'];

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

function OptionCard({ title, description, selected, onClick }: OptionCardProps) {
  return (
    <button
      className={[
        'rounded-lg border p-4 text-left transition',
        selected
          ? 'border-graphite bg-graphite text-white'
          : 'border-stoneLine bg-white text-graphite hover:bg-stone-50',
      ].join(' ')}
      type="button"
      onClick={onClick}
    >
      <span className="block font-semibold">{title}</span>
      {description && (
        <span
          className={[
            'mt-1 block text-sm',
            selected ? 'text-stone-100' : 'text-stone-600',
          ].join(' ')}
        >
          {description}
        </span>
      )}
    </button>
  );
}

export function SimulatorPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [environment, setEnvironment] = useState(environments[0]);
  const [product, setProduct] = useState(mockProducts[0]);
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
  const isLastStep = currentStep === simulatorSteps.length - 1;

  function goBack() {
    setCurrentStep((step) => Math.max(0, step - 1));
  }

  function goNext() {
    setCurrentStep((step) => Math.min(simulatorSteps.length - 1, step + 1));
  }

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Simulador</p>
        <h1 className="mt-2 text-3xl font-bold text-graphite">
          Simulador 2D inicial
        </h1>
        <p className="mt-3 max-w-3xl text-stone-700">
          Configure uma peça em etapas com dados mockados locais e veja o
          orçamento estimado em tempo real. Esta versão não salva orçamento, não
          usa Supabase e não possui 3D.
        </p>
      </div>

      <div className="rounded-lg border border-stoneLine bg-white p-4 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {simulatorSteps.map((step, index) => (
            <button
              key={step}
              className={[
                'rounded-md px-3 py-2 text-left text-sm font-medium transition',
                currentStep === index
                  ? 'bg-graphite text-white'
                  : index < currentStep
                    ? 'bg-green-50 text-green-700'
                    : 'bg-stone-100 text-stone-600',
              ].join(' ')}
              type="button"
              onClick={() => setCurrentStep(index)}
            >
              <span className="block text-xs">Etapa {index + 1}</span>
              {step}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-lg border border-stoneLine bg-white p-5 shadow-sm">
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-graphite">
                    Etapa 1 - Escolher ambiente
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Escolha onde a peça será usada.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {environments.map((item) => (
                    <OptionCard
                      key={item}
                      title={item}
                      selected={environment === item}
                      onClick={() => setEnvironment(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-graphite">
                    Etapa 2 - Escolher produto
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Produtos mockados para o ambiente {environment}.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {mockProducts.map((item) => (
                    <OptionCard
                      key={item}
                      title={item}
                      selected={product === item}
                      onClick={() => setProduct(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-graphite">
                    Etapa 3 - Escolher pedra
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Valores locais apenas para validar o motor de orçamento.
                  </p>
                </div>
                <div className="grid gap-3 xl:grid-cols-3">
                  {mockStones.map((stone) => (
                    <OptionCard
                      key={stone.id}
                      title={stone.name}
                      description={`${stone.category} · ${formatCurrency(
                        stone.pricePerM2,
                      )}/m²`}
                      selected={stoneId === stone.id}
                      onClick={() => setStoneId(stone.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-graphite">
                    Etapa 4 - Medidas
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Informe medidas em metros e a quantidade de peças.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
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
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-graphite">
                    Etapa 5 - Cuba e acabamento
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Escolha os opcionais que entram no orçamento.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase text-stone-600">
                    Cuba
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {mockSinks.map((sink) => (
                      <OptionCard
                        key={sink.id}
                        title={sink.name}
                        description={formatCurrency(sink.price)}
                        selected={sinkId === sink.id}
                        onClick={() => setSinkId(sink.id)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase text-stone-600">
                    Acabamento
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {mockFinishes.map((finish) => (
                      <OptionCard
                        key={finish.id}
                        title={finish.name}
                        description={formatCurrency(finish.price)}
                        selected={finishId === finish.id}
                        onClick={() => setFinishId(finish.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-graphite">
                    Etapa 6 - Resumo
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Revise a configuração antes das próximas etapas futuras de
                    captura de lead.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryItem label="Ambiente" value={environment} />
                  <SummaryItem label="Produto" value={product} />
                  <SummaryItem label="Pedra" value={selectedStone.name} />
                  <SummaryItem label="Cuba" value={selectedSink.name} />
                  <SummaryItem
                    label="Acabamento"
                    value={selectedFinish.name}
                  />
                  <SummaryItem
                    label="Medidas"
                    value={`${dimensions.width.toFixed(
                      2,
                    )}m x ${dimensions.depth.toFixed(
                      2,
                    )}m · qtd. ${resolvedQuantity}`}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              className="rounded-md border border-stoneLine px-5 py-3 text-sm font-semibold text-graphite transition hover:bg-white disabled:cursor-not-allowed disabled:text-stone-400"
              type="button"
              onClick={goBack}
              disabled={currentStep === 0}
            >
              Voltar
            </button>
            <button
              className="rounded-md bg-graphite px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              type="button"
              onClick={goNext}
              disabled={isLastStep}
            >
              {isLastStep ? 'Resumo concluído' : 'Continuar'}
            </button>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-stoneLine bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2">
              <div>
                <h2 className="text-lg font-semibold text-graphite">
                  Preview visual 2D
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  {selectedStone.name} · {selectedStone.category}
                </p>
              </div>
              <span className="w-fit rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700">
                {dimensions.width.toFixed(2)}m x {dimensions.depth.toFixed(2)}m
              </span>
            </div>

            <div className="mt-6 flex min-h-56 items-center justify-center rounded-lg bg-stone-100 p-6">
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
              <SummaryRow label="Área total" value={`${quote.area.toFixed(2)} m²`} />
              <SummaryRow label="Pedra" value={formatCurrency(quote.stonePrice)} />
              <SummaryRow label="Cuba" value={formatCurrency(quote.sinkPrice)} />
              <SummaryRow
                label="Acabamento"
                value={formatCurrency(quote.finishPrice)}
              />
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
        </aside>
      </div>
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stoneLine bg-stone-50 p-4">
      <p className="text-xs font-semibold uppercase text-stone-500">{label}</p>
      <p className="mt-1 font-medium text-graphite">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-stone-600">{label}</dt>
      <dd className="font-medium text-graphite">{value}</dd>
    </div>
  );
}
