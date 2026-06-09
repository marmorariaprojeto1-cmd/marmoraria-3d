import type { CommercialProduct, CommercialProductDimensions } from '../products/types';
import type { CountertopComposition } from '../../types/threePreview';

export type StoneBasePrice = {
  stoneId: string;
  stoneName: string;
  pricePerM2: number;
  active: boolean;
  note: string;
};

export type ComponentPricingType = 'fixed';

export type ComponentAddonPrice = {
  componentId: string;
  name: string;
  pricingType: ComponentPricingType;
  price: number;
  active: boolean;
  note: string;
};

export type CalculateBasePriceInput = {
  stoneId: string;
  areaM2: number;
};

export type BasePriceResult = {
  stoneId: string;
  areaM2: number;
  pricePerM2: number;
  basePrice: number;
};

export type ComponentAddonItem = {
  componentId: string;
  name: string;
  price: number;
};

export type ComponentAddonsResult = {
  items: ComponentAddonItem[];
  totalAddons: number;
};

export type CalculateCommercialEstimateInput = {
  productId: string;
  stoneId: string;
  width: number;
  depth: number;
};

export type CalculateCommercialEstimateFromConfigurationInput =
  CalculateCommercialEstimateInput & {
    composition: CountertopComposition;
  };

export type CommercialEstimate = {
  product: CommercialProduct;
  stoneId: string;
  composition: CountertopComposition;
  dimensions: CommercialProductDimensions;
  estimatedAreaM2: number;
  basePrice: BasePriceResult;
  addons: ComponentAddonItem[];
  totalAddons: number;
  estimatedTotal: number;
};

export type EstimateBreakdownItem = {
  label: string;
  value: string;
};

export type EstimateBreakdown = {
  areaM2: number;
  stonePrice: number;
  stoneSubtotal: number;
  backsplashPrice: number;
  apronPrice: number;
  wetAreaPrice: number;
  cutoutPrice: number;
  addonsSubtotal: number;
  estimatedTotal: number;
  breakdownItems: EstimateBreakdownItem[];
};
