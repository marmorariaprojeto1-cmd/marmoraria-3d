import type { CountertopComposition } from '../../types/threePreview';
import { findCommercialProduct } from './index';
import type { CommercialProduct, CommercialProductDimensions } from './types';

export type CommercialStone = {
  id: string;
  name: string;
};

export type ProductConfigurationInput = {
  productId: string;
  stoneId: string;
  width: number;
  depth: number;
};

export type ProductConfiguration = {
  product: CommercialProduct;
  stone: CommercialStone;
  composition: CountertopComposition;
  dimensions: CommercialProductDimensions;
  estimatedAreaM2: number;
};

const COMMERCIAL_STONES: CommercialStone[] = [
  { id: 'STONE_001', name: 'Branco Siena' },
  { id: 'STONE_002', name: 'Branco Fortaleza' },
  { id: 'STONE_003', name: 'Preto Sao Gabriel' },
  { id: 'STONE_004', name: 'Cinza Corumba' },
  { id: 'STONE_005', name: 'Verde Ubatuba' },
  { id: 'STONE_006', name: 'Amarelo Ornamental' },
];

function findCommercialStone(stoneId: string) {
  return COMMERCIAL_STONES.find((stone) => stone.id === stoneId) ?? null;
}

function normalizeLinearMeasureToMeters(value: number) {
  return value > 10 ? value / 1000 : value;
}

function cloneCompositionWithConfiguration({
  composition,
  stone,
  dimensions,
}: {
  composition: CountertopComposition;
  stone: CommercialStone;
  dimensions: CommercialProductDimensions;
}): CountertopComposition {
  return {
    ...composition,
    top: {
      ...composition.top,
      width: dimensions.width,
      depth: dimensions.depth,
      thicknessMm: dimensions.thicknessMm,
    },
    material: {
      ...composition.material,
      stoneName: stone.name,
    },
    metadata: {
      ...composition.metadata,
      source: 'commercial-product-configuration',
    },
  };
}

export function buildProductArea(width: number, depth: number) {
  const widthM = normalizeLinearMeasureToMeters(width);
  const depthM = normalizeLinearMeasureToMeters(depth);

  return widthM * depthM;
}

export function buildProductConfiguration({
  productId,
  stoneId,
  width,
  depth,
}: ProductConfigurationInput): ProductConfiguration {
  const product = findCommercialProduct(productId);
  if (!product) {
    throw new Error(`Commercial product not found: ${productId}`);
  }

  const stone = findCommercialStone(stoneId);
  if (!stone) {
    throw new Error(`Commercial stone not found: ${stoneId}`);
  }

  if (!product.allowedStones.includes(stone.id)) {
    throw new Error(`Stone ${stoneId} is not allowed for product ${productId}`);
  }

  const dimensions = {
    width: normalizeLinearMeasureToMeters(width),
    depth: normalizeLinearMeasureToMeters(depth),
    thicknessMm: product.defaultDimensions.thicknessMm,
  };
  const composition = cloneCompositionWithConfiguration({
    composition: product.defaultComposition,
    stone,
    dimensions,
  });

  return {
    product,
    stone,
    composition,
    dimensions,
    estimatedAreaM2: buildProductArea(dimensions.width, dimensions.depth),
  };
}
