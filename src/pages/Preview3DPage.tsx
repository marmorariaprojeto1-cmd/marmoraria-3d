import {
  buildEstimateBreakdown,
  calculateCommercialEstimate,
  formatCompositionComponents,
} from '../catalog/pricing';
import { listCommercialProducts } from '../catalog/products';
import { ThreeDPreview } from '../components/three/ThreeDPreview';

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
const commercialProductPreviews = commercialProductEstimates.map((estimate) => ({
  estimate,
  breakdown: buildEstimateBreakdown({ commercialEstimate: estimate }),
}));

export function Preview3DPage() {
  return (
    <section className="page-shell">
      <div>
        <p className="page-kicker">Preview temporario</p>
        <h1 className="page-title">Produtos comerciais 3D</h1>
        <p className="page-description">
          Rota temporaria para validar produtos comerciais estaticos usando o
          motor parametrico 3D existente, sem alterar o simulador ou regras
          comerciais.
        </p>
        <p className="mt-3 text-sm font-medium text-stone-600">
          Estimativa local para teste. Não substitui orçamento final.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        {commercialProductPreviews.map(({ estimate, breakdown }) => (
          <article key={estimate.product.id} className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-moss">
                {estimate.product.category}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-graphite">
                {estimate.product.name}
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                {estimate.product.description}
              </p>
            </div>

            <dl className="grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-graphite">Composicao</dt>
                <dd>{formatCompositionComponents(estimate.composition)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-graphite">Dimensoes</dt>
                <dd>{formatDimensions(estimate.dimensions)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-graphite">Pedra padrao</dt>
                <dd>{estimate.composition.material.stoneName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-graphite">Produto</dt>
                <dd>{estimate.product.id}</dd>
              </div>
              <div>
                <dt className="font-semibold text-graphite">Area estimada</dt>
                <dd>{estimate.estimatedAreaM2.toFixed(2)} m2</dd>
              </div>
              <div>
                <dt className="font-semibold text-graphite">Preço por m²</dt>
                <dd>{formatCurrency(estimate.basePrice.pricePerM2)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-graphite">Preço base</dt>
                <dd>{formatCurrency(estimate.basePrice.basePrice)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-graphite">Adicionais</dt>
                <dd>
                  {estimate.addons.length === 0
                    ? 'Sem adicionais'
                    : estimate.addons
                        .map((addon) => `${addon.name}: ${formatCurrency(addon.price)}`)
                        .join(' · ')}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-graphite">Total estimado</dt>
                <dd>{formatCurrency(estimate.estimatedTotal)}</dd>
              </div>
            </dl>

            <div className="rounded-lg border border-stoneLine bg-stone-50 p-4">
              <h3 className="text-sm font-semibold uppercase text-stone-600">
                Resumo Comercial
              </h3>
              <dl className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-graphite">Área</dt>
                  <dd>{breakdown.areaM2.toFixed(2)} m²</dd>
                </div>
                <div>
                  <dt className="font-semibold text-graphite">Pedra</dt>
                  <dd>{estimate.composition.material.stoneName}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-graphite">Preço m²</dt>
                  <dd>{formatCurrency(breakdown.stonePrice)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-graphite">Adicionais</dt>
                  <dd>{formatCurrency(breakdown.addonsSubtotal)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-graphite">Total</dt>
                  <dd className="text-lg font-bold text-graphite">
                    {formatCurrency(breakdown.estimatedTotal)}
                  </dd>
                </div>
              </dl>
            </div>

            <ThreeDPreview composition={estimate.composition} />
          </article>
        ))}
      </div>
    </section>
  );
}
