import { findStonePrice } from './stonePrices';
import type { BasePriceResult, CalculateBasePriceInput } from './types';
import { roundMoney, resolveThicknessMultiplier } from './moneyUtils';

export function calculateBasePrice({
  stoneId,
  areaM2,
  pricePerM2,
  thickness,
}: CalculateBasePriceInput): BasePriceResult {
  const effectivePricePerM2 = pricePerM2 ?? (() => {
    const stonePrice = findStonePrice(stoneId);

    if (!stonePrice || !stonePrice.active) {
      throw new Error(`Stone price not found: ${stoneId}`);
    }

    return stonePrice.pricePerM2;
  })();

  const multiplier = resolveThicknessMultiplier(thickness);

  return {
    stoneId,
    areaM2,
    pricePerM2: effectivePricePerM2,
    basePrice: roundMoney(areaM2 * effectivePricePerM2 * multiplier),
  };
}
