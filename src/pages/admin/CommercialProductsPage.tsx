import {
  buildEstimateBreakdown,
  calculateCommercialEstimate,
  formatCompositionComponents,
} from '../../catalog/pricing';
import { listCommercialProducts } from '../../catalog/products';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDimensions({
  width,
  depth,
  thicknessMm,
}: {
  width: number;
  depth: number;
  thicknessMm: number;
}) {
  return `${width.toFixed(2)} m x ${depth.toFixed(2)} m x ${thicknessMm} mm`;
}

const commercialProducts = listCommercialProducts();
const commercialProductEstimates = commercialProducts.map((product) =>
  calculateCommercialEstimate({
    productId: product.id,
    stoneId: product.allowedStones[0],
    width: product.defaultDimensions.width,
    depth: product.defaultDimensions.depth,
  }),
);

export function CommercialProductsPage() {
  return (
    <section className="page-shell">
      <div>
        <p className="page-kicker">Produtos Comerciais</p>
        <h1 className="page-title">Produtos comerciais</h1>
        <p className="page-description">
          Visão somente leitura dos produtos comerciais locais. Esta tela não
          salva dados, não consulta Supabase e não substitui o orçamento oficial.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {commercialProductEstimates.map((estimate) => {
          const breakdown = buildEstimateBreakdown({
            commercialEstimate: estimate,
          });

          return (
            <article
              key={estimate.product.id}
              className="surface-card overflow-hidden"
            >
              <div className="border-b border-stoneLine p-5">
                <p className="text-xs font-semibold uppercase text-moss">
                  {estimate.product.category}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-graphite">
                  {estimate.product.name}
                </h2>
                <p className="mt-2 text-sm text-stone-600">
                  {estimate.product.description}
                </p>
              </div>

              <div className="grid gap-4 p-5 text-sm text-stone-700 sm:grid-cols-2">
                <InfoBlock
                  label="Pedra padrão"
                  value={estimate.composition.material.stoneName}
                />
                <InfoBlock
                  label="Dimensões padrão"
                  value={formatDimensions(estimate.dimensions)}
                />
                <InfoBlock
                  label="Área estimada"
                  value={`${estimate.estimatedAreaM2.toFixed(2)} m²`}
                />
                <InfoBlock
                  label="Composição"
                  value={formatCompositionComponents(estimate.composition)}
                />
              </div>

              <div className="border-t border-stoneLine bg-stone-50 p-5">
                <h3 className="text-sm font-semibold uppercase text-stone-600">
                  Resumo comercial
                </h3>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <SummaryRow
                    label="Preço base"
                    value={formatCurrency(breakdown.stoneSubtotal)}
                  />
                  <SummaryRow
                    label="Adicionais"
                    value={formatCurrency(breakdown.addonsSubtotal)}
                  />
                  <SummaryRow
                    label="Frontão"
                    value={formatCurrency(breakdown.backsplashPrice)}
                  />
                  <SummaryRow
                    label="Saia"
                    value={formatCurrency(breakdown.apronPrice)}
                  />
                  <SummaryRow
                    label="Área molhada"
                    value={formatCurrency(breakdown.wetAreaPrice)}
                  />
                  <SummaryRow
                    label="Recorte"
                    value={formatCurrency(breakdown.cutoutPrice)}
                  />
                  <div className="border-t border-stoneLine pt-3 sm:col-span-2">
                    <SummaryRow
                      label="Total estimado"
                      value={formatCurrency(breakdown.estimatedTotal)}
                      strong
                    />
                    <p className="mt-3 text-sm font-medium text-stone-600">
                      Estimativa local para teste. Não substitui orçamento final.
                    </p>
                  </div>
                </dl>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-graphite">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={strong ? 'font-semibold text-graphite' : 'text-stone-600'}>
        {label}
      </dt>
      <dd className={strong ? 'text-lg font-bold text-graphite' : 'font-medium text-graphite'}>
        {value}
      </dd>
    </div>
  );
}
