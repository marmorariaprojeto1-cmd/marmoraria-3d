import { findStonePrice } from './stonePrices';
import type { BasePriceResult, CalculateBasePriceInput } from './types';

export function calculateBasePrice({
  stoneId,
  areaM2,
}: CalculateBasePriceInput): BasePriceResult {
  const stonePrice = findStonePrice(stoneId);

  if (!stonePrice || !stonePrice.active) {
    throw new Error(`Stone price not found: ${stoneId}`);
  }

  return {
    stoneId,
    areaM2,
    pricePerM2: stonePrice.pricePerM2,
    basePrice: areaM2 * stonePrice.pricePerM2,
  };
}
