import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { calculateQuoteTotal } from '../services/quoteCalculator';
import type { FinishPricingType } from '../types/quote';

type ProductCatalogItem = {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
};

type StoneCatalogItem = {
  id: string;
  name: string;
  image_url: string | null;
  price_per_m2: number;
  category_id: string | null;
};

type SinkCatalogItem = {
  id: string;
  name: string;
  category: string | null;
  price: number;
};

type FinishCatalogItem = {
  id: string;
  name: string;
  pricing_type: FinishPricingType;
  price: number;
};

type SimulatorCatalog = {
  products: ProductCatalogItem[];
  stones: StoneCatalogItem[];
  sinks: SinkCatalogItem[];
  finishes: FinishCatalogItem[];
};

type SimulatorCompany = {
  id: string;
  name: string;
  whatsapp: string | null;
};

type SaveQuoteInput = {
  companyId: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    city?: string;
  };
  item: {
    productId: string;
    stoneId: string;
    sinkId: string | null;
    finishId: string | null;
    width: number;
    depth: number;
    thickness: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  };
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

const emptyCatalog: SimulatorCatalog = {
  products: [],
  stones: [],
  sinks: [],
  finishes: [],
};

const simulatorCompanyId = import.meta.env.VITE_SIMULATOR_COMPANY_ID;

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

async function fetchSimulatorCatalog(companyId: string): Promise<SimulatorCatalog> {
  const [products, stones, sinks, finishes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, description, category_id')
      .eq('company_id', companyId)
      .eq('active', true)
      .order('name', { ascending: true }),
    supabase
      .from('stones')
      .select('id, name, image_url, price_per_m2, category_id')
      .eq('company_id', companyId)
      .eq('active', true)
      .order('name', { ascending: true }),
    supabase
      .from('sinks')
      .select('id, name, category, price')
      .eq('company_id', companyId)
      .eq('active', true)
      .order('name', { ascending: true }),
    supabase
      .from('finishes')
      .select('id, name, pricing_type, price')
      .eq('company_id', companyId)
      .eq('active', true)
      .order('name', { ascending: true }),
  ]);

  const error =
    products.error ?? stones.error ?? sinks.error ?? finishes.error ?? null;

  if (error) {
    throw error;
  }

  return {
    products: (products.data ?? []) as ProductCatalogItem[],
    stones: (stones.data ?? []) as StoneCatalogItem[],
    sinks: (sinks.data ?? []) as SinkCatalogItem[],
    finishes: (finishes.data ?? []) as FinishCatalogItem[],
  };
}

async function saveCompletedQuote(input: SaveQuoteInput) {
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      company_id: input.companyId,
      customer_name: input.customer.name,
      customer_phone: input.customer.phone,
      customer_email: input.customer.email || null,
      city: input.customer.city || null,
      status: 'submitted',
      total_price: input.item.totalPrice,
    })
    .select('id')
    .single();

  if (quoteError) {
    throw quoteError;
  }

  const { error: itemError } = await supabase.from('quote_items').insert({
    company_id: input.companyId,
    quote_id: quote.id,
    product_id: input.item.productId,
    stone_id: input.item.stoneId,
    sink_id: input.item.sinkId,
    finish_id: input.item.finishId,
    width: input.item.width,
    depth: input.item.depth,
    thickness: input.item.thickness,
    quantity: input.item.quantity,
    unit_price: input.item.unitPrice,
    total_price: input.item.totalPrice,
  });

  if (itemError) {
    throw itemError;
  }

  return quote.id as string;
}

async function fetchSimulatorCompany(companyId: string): Promise<SimulatorCompany> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, whatsapp')
    .eq('id', companyId)
    .eq('active', true)
    .single();

  if (error) {
    throw error;
  }

  return data as SimulatorCompany;
}

function getStonePreviewClass(stoneId?: string) {
  const variants = [
    'from-stone-400 via-stone-300 to-stone-500',
    'from-stone-50 via-white to-stone-200',
    'from-amber-50 via-stone-100 to-white',
    'from-slate-300 via-stone-200 to-zinc-500',
  ];

  if (!stoneId) {
    return variants[0];
  }

  const index = stoneId
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  return variants[index % variants.length];
}

function formatFinishPricingType(value: FinishPricingType) {
  if (value === 'linear_meter') {
    return 'por metro linear';
  }

  if (value === 'percentage') {
    return 'percentual';
  }

  return 'valor fixo';
}

function normalizeWhatsAppNumber(value?: string | null) {
  return value?.replace(/\D/g, '') ?? '';
}

export function SimulatorPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [environment, setEnvironment] = useState(environments[0]);
  const [productId, setProductId] = useState('');
  const [stoneId, setStoneId] = useState('');
  const [sinkId, setSinkId] = useState('');
  const [finishId, setFinishId] = useState('');
  const [width, setWidth] = useState('2.00');
  const [depth, setDepth] = useState('0.60');
  const [thickness, setThickness] = useState('2.00');
  const [quantity, setQuantity] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [savedQuoteId, setSavedQuoteId] = useState('');

  const canFetchCatalog = Boolean(hasSupabaseConfig && simulatorCompanyId);

  const {
    data: catalog = emptyCatalog,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['simulator-catalog', simulatorCompanyId],
    queryFn: () => fetchSimulatorCatalog(simulatorCompanyId),
    enabled: canFetchCatalog,
  });

  const {
    data: company,
    isError: isCompanyError,
  } = useQuery({
    queryKey: ['simulator-company', simulatorCompanyId],
    queryFn: () => fetchSimulatorCompany(simulatorCompanyId),
    enabled: canFetchCatalog,
  });

  useEffect(() => {
    if (!productId && catalog.products[0]) {
      setProductId(catalog.products[0].id);
    }
  }, [catalog.products, productId]);

  useEffect(() => {
    if (!stoneId && catalog.stones[0]) {
      setStoneId(catalog.stones[0].id);
    }
  }, [catalog.stones, stoneId]);

  useEffect(() => {
    if (!sinkId && catalog.sinks[0]) {
      setSinkId(catalog.sinks[0].id);
    }
  }, [catalog.sinks, sinkId]);

  useEffect(() => {
    if (!finishId && catalog.finishes[0]) {
      setFinishId(catalog.finishes[0].id);
    }
  }, [catalog.finishes, finishId]);

  const selectedProduct =
    catalog.products.find((product) => product.id === productId) ?? null;
  const selectedStone =
    catalog.stones.find((stone) => stone.id === stoneId) ?? null;
  const selectedSink = catalog.sinks.find((sink) => sink.id === sinkId) ?? null;
  const selectedFinish =
    catalog.finishes.find((finish) => finish.id === finishId) ?? null;

  const dimensions = useMemo(
    () => ({
      width: Number(width) || 0,
      depth: Number(depth) || 0,
    }),
    [depth, width],
  );
  const resolvedQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
  const resolvedThickness = Number(thickness) || 0;

  const quote = useMemo(
    () =>
      selectedStone
        ? calculateQuoteTotal({
            stone: {
              dimensions,
              pricePerM2: selectedStone.price_per_m2,
              quantity: resolvedQuantity,
            },
            sink: selectedSink
              ? {
                  price: selectedSink.price,
                  quantity: resolvedQuantity,
                }
              : null,
            finish: selectedFinish
              ? {
                  pricingType: selectedFinish.pricing_type,
                  price: selectedFinish.price,
                  quantity: resolvedQuantity,
                }
              : null,
          })
        : {
            area: 0,
            stonePrice: 0,
            sinkPrice: 0,
            finishPrice: 0,
            total: 0,
          },
    [
      dimensions,
      resolvedQuantity,
      selectedFinish,
      selectedSink,
      selectedStone,
    ],
  );

  const previewWidth = Math.min(100, Math.max(45, dimensions.width * 35));
  const previewHeight = Math.min(70, Math.max(22, dimensions.depth * 70));
  const isLastStep = currentStep === simulatorSteps.length - 1;
  const unitPrice = quote.total / resolvedQuantity;
  const companyWhatsAppNumber = normalizeWhatsAppNumber(company?.whatsapp);
  const canSaveQuote = Boolean(
    canFetchCatalog &&
      selectedProduct &&
      selectedStone &&
      dimensions.width > 0 &&
      dimensions.depth > 0 &&
      resolvedThickness > 0 &&
      resolvedQuantity > 0 &&
      quote.total > 0 &&
      customerName.trim() &&
      customerPhone.trim(),
  );
  const canRequestByWhatsApp = Boolean(
    companyWhatsAppNumber &&
      selectedProduct &&
      selectedStone &&
      dimensions.width > 0 &&
      dimensions.depth > 0 &&
      resolvedThickness > 0 &&
      resolvedQuantity > 0 &&
      quote.total > 0,
  );

  const saveQuoteMutation = useMutation({
    mutationFn: () => {
      if (!simulatorCompanyId || !selectedProduct || !selectedStone) {
        throw new Error('Dados obrigatórios do orçamento não foram selecionados.');
      }

      return saveCompletedQuote({
        companyId: simulatorCompanyId,
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim(),
          city: customerCity.trim(),
        },
        item: {
          productId: selectedProduct.id,
          stoneId: selectedStone.id,
          sinkId: selectedSink?.id ?? null,
          finishId: selectedFinish?.id ?? null,
          width: dimensions.width,
          depth: dimensions.depth,
          thickness: resolvedThickness,
          quantity: resolvedQuantity,
          unitPrice,
          totalPrice: quote.total,
        },
      });
    },
    onSuccess: (quoteId) => {
      setSavedQuoteId(quoteId);
    },
  });

  function goBack() {
    setCurrentStep((step) => Math.max(0, step - 1));
  }

  function goNext() {
    setCurrentStep((step) => Math.min(simulatorSteps.length - 1, step + 1));
  }

  function handleSaveQuote() {
    setSavedQuoteId('');
    saveQuoteMutation.mutate();
  }

  function buildWhatsAppMessage() {
    return [
      'Olá! Gostaria de solicitar um orçamento.',
      '',
      `Ambiente: ${environment}`,
      `Produto: ${selectedProduct?.name ?? 'Não selecionado'}`,
      `Pedra: ${selectedStone?.name ?? 'Não selecionada'}`,
      `Cuba: ${selectedSink?.name ?? 'Não selecionada'}`,
      `Acabamento: ${selectedFinish?.name ?? 'Não selecionado'}`,
      `Medidas: ${dimensions.width.toFixed(2)}m x ${dimensions.depth.toFixed(
        2,
      )}m · esp. ${resolvedThickness.toFixed(1)}cm`,
      `Quantidade: ${resolvedQuantity}`,
      `Valor estimado: ${formatCurrency(quote.total)}`,
    ].join('\n');
  }

  function handleWhatsAppRequest() {
    if (!canRequestByWhatsApp) {
      return;
    }

    const url = `https://wa.me/${companyWhatsAppNumber}?text=${encodeURIComponent(
      buildWhatsAppMessage(),
    )}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Simulador</p>
        <h1 className="mt-2 text-3xl font-bold text-graphite">
          Simulador 2D inicial
        </h1>
        <p className="mt-3 max-w-3xl text-stone-700">
          Configure uma peça em etapas usando o catálogo ativo da marmoraria,
          veja o orçamento estimado em tempo real e salve a solicitação no
          Supabase. Esta versão não usa WhatsApp e não possui 3D.
        </p>
      </div>

      {!canFetchCatalog && (
        <div className="rounded-md border border-copper/30 bg-orange-50 p-4 text-sm text-stone-800">
          Configure VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e
          VITE_SIMULATOR_COMPANY_ID para carregar o catálogo real do simulador.
        </div>
      )}

      {isError && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Não foi possível carregar o catálogo ativo da empresa. Verifique o
          company_id, as permissões e as policies públicas necessárias.
        </div>
      )}

      {isCompanyError && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Não foi possível carregar o WhatsApp da empresa ativa configurada.
        </div>
      )}

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
            {isLoading && (
              <p className="text-stone-700">Carregando catálogo ativo...</p>
            )}

            {!isLoading && currentStep === 0 && (
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

            {!isLoading && currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-graphite">
                    Etapa 2 - Escolher produto
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Produtos ativos da empresa para o ambiente {environment}.
                  </p>
                </div>
                {catalog.products.length === 0 ? (
                  <EmptyCatalogMessage label="produtos" />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {catalog.products.map((item) => (
                      <OptionCard
                        key={item.id}
                        title={item.name}
                        description={item.description ?? undefined}
                        selected={productId === item.id}
                        onClick={() => setProductId(item.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isLoading && currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-graphite">
                    Etapa 3 - Escolher pedra
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Pedras ativas da empresa filtradas por company_id.
                  </p>
                </div>
                {catalog.stones.length === 0 ? (
                  <EmptyCatalogMessage label="pedras" />
                ) : (
                  <div className="grid gap-3 xl:grid-cols-3">
                    {catalog.stones.map((stone) => (
                      <OptionCard
                        key={stone.id}
                        title={stone.name}
                        description={`${formatCurrency(stone.price_per_m2)}/m²`}
                        selected={stoneId === stone.id}
                        onClick={() => setStoneId(stone.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isLoading && currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-graphite">
                    Etapa 4 - Medidas
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Informe medidas em metros e a quantidade de peças.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                      Espessura (cm)
                    </span>
                    <input
                      className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
                      type="number"
                      min="0"
                      step="0.1"
                      value={thickness}
                      onChange={(event) => setThickness(event.target.value)}
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

            {!isLoading && currentStep === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-graphite">
                    Etapa 5 - Cuba e acabamento
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Escolha os opcionais ativos da empresa.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase text-stone-600">
                    Cuba
                  </h3>
                  {catalog.sinks.length === 0 ? (
                    <EmptyCatalogMessage label="cubas" />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {catalog.sinks.map((sink) => (
                        <OptionCard
                          key={sink.id}
                          title={sink.name}
                          description={`${sink.category ?? 'sem categoria'} · ${formatCurrency(
                            sink.price,
                          )}`}
                          selected={sinkId === sink.id}
                          onClick={() => setSinkId(sink.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase text-stone-600">
                    Acabamento
                  </h3>
                  {catalog.finishes.length === 0 ? (
                    <EmptyCatalogMessage label="acabamentos" />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {catalog.finishes.map((finish) => (
                        <OptionCard
                          key={finish.id}
                          title={finish.name}
                          description={`${formatFinishPricingType(
                            finish.pricing_type,
                          )} · ${formatCurrency(finish.price)}`}
                          selected={finishId === finish.id}
                          onClick={() => setFinishId(finish.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isLoading && currentStep === 5 && (
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
                  <SummaryItem
                    label="Produto"
                    value={selectedProduct?.name ?? 'Não selecionado'}
                  />
                  <SummaryItem
                    label="Pedra"
                    value={selectedStone?.name ?? 'Não selecionada'}
                  />
                  <SummaryItem
                    label="Cuba"
                    value={selectedSink?.name ?? 'Não selecionada'}
                  />
                  <SummaryItem
                    label="Acabamento"
                    value={selectedFinish?.name ?? 'Não selecionado'}
                  />
                  <SummaryItem
                    label="Medidas"
                    value={`${dimensions.width.toFixed(
                      2,
                    )}m x ${dimensions.depth.toFixed(
                      2,
                    )}m · esp. ${resolvedThickness.toFixed(
                      1,
                    )}cm · qtd. ${resolvedQuantity}`}
                  />
                </div>

                <div className="rounded-lg border border-stoneLine bg-stone-50 p-4">
                  <h3 className="text-sm font-semibold uppercase text-stone-600">
                    Dados para salvar
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-stone-700">
                        Nome
                      </span>
                      <input
                        className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-stone-700">
                        Telefone
                      </span>
                      <input
                        className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
                        value={customerPhone}
                        onChange={(event) => setCustomerPhone(event.target.value)}
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-stone-700">
                        Cidade
                      </span>
                      <input
                        className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
                        value={customerCity}
                        onChange={(event) => setCustomerCity(event.target.value)}
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-stone-700">
                        E-mail opcional
                      </span>
                      <input
                        className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
                        type="email"
                        value={customerEmail}
                        onChange={(event) => setCustomerEmail(event.target.value)}
                      />
                    </label>
                  </div>

                  {saveQuoteMutation.isError && (
                    <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                      Não foi possível salvar o orçamento. Verifique as
                      permissões do Supabase para quotes e quote_items.
                    </p>
                  )}

                  {savedQuoteId && (
                    <p className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
                      Orçamento salvo com sucesso. ID: {savedQuoteId}
                    </p>
                  )}

                  <button
                    className="mt-4 rounded-md bg-graphite px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                    type="button"
                    onClick={handleSaveQuote}
                    disabled={!canSaveQuote || saveQuoteMutation.isPending}
                  >
                    {saveQuoteMutation.isPending
                      ? 'Salvando orçamento...'
                      : 'Salvar orçamento'}
                  </button>
                  {!canSaveQuote && (
                    <p className="mt-3 text-sm text-stone-600">
                      Preencha nome, telefone, produto, pedra e medidas válidas
                      para salvar.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-stoneLine bg-white p-4">
                  <h3 className="text-sm font-semibold uppercase text-stone-600">
                    Envio pelo WhatsApp
                  </h3>
                  <p className="mt-2 text-sm text-stone-600">
                    A mensagem será enviada para o WhatsApp cadastrado da
                    empresa {company?.name ?? 'configurada'}.
                  </p>
                  <button
                    className="mt-4 rounded-md bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                    type="button"
                    onClick={handleWhatsAppRequest}
                    disabled={!canRequestByWhatsApp}
                  >
                    Solicitar orçamento pelo WhatsApp
                  </button>
                  {!companyWhatsAppNumber && (
                    <p className="mt-3 text-sm text-stone-600">
                      Cadastre um WhatsApp ativo para a empresa antes de usar
                      este envio.
                    </p>
                  )}
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
                  {selectedStone?.name ?? 'Pedra não selecionada'}
                </p>
              </div>
              <span className="w-fit rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700">
                {dimensions.width.toFixed(2)}m x {dimensions.depth.toFixed(2)}m
              </span>
            </div>

            <div className="mt-6 flex min-h-56 items-center justify-center rounded-lg bg-stone-100 p-6">
              <div
                className={[
                  'relative rounded-md border border-stone-400 bg-gradient-to-br bg-cover bg-center shadow-lg',
                  selectedStone?.image_url
                    ? ''
                    : getStonePreviewClass(selectedStone?.id),
                ].join(' ')}
                style={{
                  width: `${previewWidth}%`,
                  height: `${previewHeight}%`,
                  minHeight: '96px',
                  backgroundImage: selectedStone?.image_url
                    ? `url(${selectedStone.image_url})`
                    : undefined,
                }}
              >
                {selectedSink && (
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

function EmptyCatalogMessage({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-stoneLine bg-stone-50 p-4 text-sm text-stone-700">
      Nenhum registro ativo de {label} foi encontrado para a empresa configurada.
    </div>
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
