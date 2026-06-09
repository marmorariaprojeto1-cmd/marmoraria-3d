import { buildProductConfiguration } from '../products/pricing';
import { calculateBasePrice } from './calculateBasePrice';
import { calculateComponentAddons } from './calculateComponentAddons';
import type {
  CalculateCommercialEstimateInput,
  CommercialEstimate,
} from './types';

export function calculateCommercialEstimate({
  productId,
  stoneId,
  width,
  depth,
}: CalculateCommercialEstimateInput): CommercialEstimate {
  const configuration = buildProductConfiguration({
    productId,
    stoneId,
    width,
    depth,
  });
  const basePrice = calculateBasePrice({
    stoneId: configuration.stoneId,
    areaM2: configuration.estimatedAreaM2,
  });
  const addons = calculateComponentAddons(configuration.composition);

  return {
    product: configuration.product,
    stoneId: configuration.stoneId,
    composition: configuration.composition,
    dimensions: configuration.dimensions,
    estimatedAreaM2: configuration.estimatedAreaM2,
    basePrice,
    addons: addons.items,
    totalAddons: addons.totalAddons,
    estimatedTotal: basePrice.basePrice + addons.totalAddons,
  };
}
