import { buildProductConfiguration } from '../products/pricing';
import { calculateBasePrice } from './calculateBasePrice';
import { calculateComponentAddons } from './calculateComponentAddons';
import type {
  CalculateCommercialEstimateFromConfigurationInput,
  CalculateCommercialEstimateInput,
  CommercialEstimate,
} from './types';

function buildCommercialEstimate({
  configuration,
}: {
  configuration: ReturnType<typeof buildProductConfiguration>;
}): CommercialEstimate {
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

  return buildCommercialEstimate({ configuration });
}

export function calculateCommercialEstimateFromConfiguration({
  productId,
  stoneId,
  width,
  depth,
  composition,
}: CalculateCommercialEstimateFromConfigurationInput): CommercialEstimate {
  const configuration = buildProductConfiguration({
    productId,
    stoneId,
    width,
    depth,
  });

  return buildCommercialEstimate({
    configuration: {
      ...configuration,
      composition: {
        ...composition,
        top: {
          ...composition.top,
          width: configuration.dimensions.width,
          depth: configuration.dimensions.depth,
          thicknessMm: configuration.dimensions.thicknessMm,
        },
        material: configuration.composition.material,
        metadata: {
          ...composition.metadata,
          source: 'commercial-product-template-customization',
        },
      },
    },
  });
}
