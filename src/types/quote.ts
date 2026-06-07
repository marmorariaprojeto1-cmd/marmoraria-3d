export type QuoteDimensions = {
  width: number;
  depth: number;
};

export type StoneQuoteInput = {
  dimensions: QuoteDimensions;
  pricePerM2: number;
  quantity?: number;
};

export type SinkQuoteInput = {
  price?: number | null;
  quantity?: number;
};

export type FinishPricingType = 'fixed' | 'linear_meter' | 'percentage';

export type FinishQuoteInput = {
  pricingType: FinishPricingType;
  price?: number | null;
  dimensions?: QuoteDimensions;
  basePrice?: number;
  quantity?: number;
};

export type QuoteCalculationInput = {
  stone: StoneQuoteInput;
  sink?: SinkQuoteInput | null;
  finish?: FinishQuoteInput | null;
};

export type QuoteCalculationResult = {
  area: number;
  stonePrice: number;
  sinkPrice: number;
  finishPrice: number;
  total: number;
};
