export type StoneBasePrice = {
  stoneId: string;
  stoneName: string;
  pricePerM2: number;
  active: boolean;
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
