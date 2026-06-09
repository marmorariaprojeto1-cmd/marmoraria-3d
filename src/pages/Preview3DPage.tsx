import { listCommercialProducts } from '../catalog/products';
import { ThreeDPreview } from '../components/three/ThreeDPreview';
import type { CountertopComposition } from '../types/threePreview';

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

function getCompositionSummary(composition: CountertopComposition) {
  return [
    composition.top.id ?? composition.top.componentId,
    composition.backsplash?.id ?? composition.backsplash?.componentId,
    composition.frontApron?.id ?? composition.frontApron?.componentId,
    composition.cutout?.id ?? composition.cutout?.componentId,
  ]
    .filter(Boolean)
    .join(' + ');
}

const commercialProducts = listCommercialProducts();

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
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        {commercialProducts.map((product) => (
          <article key={product.id} className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-moss">
                {product.category}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-graphite">
                {product.name}
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                {product.description}
              </p>
            </div>

            <dl className="grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-graphite">Composicao</dt>
                <dd>{getCompositionSummary(product.defaultComposition)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-graphite">Dimensoes</dt>
                <dd>{formatDimensions(product.defaultDimensions)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-graphite">Pedra padrao</dt>
                <dd>{product.defaultComposition.material.stoneName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-graphite">Produto</dt>
                <dd>{product.id}</dd>
              </div>
            </dl>

            <ThreeDPreview composition={product.defaultComposition} />
          </article>
        ))}
      </div>
    </section>
  );
}
