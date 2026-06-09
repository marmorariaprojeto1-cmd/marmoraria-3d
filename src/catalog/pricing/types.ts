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
