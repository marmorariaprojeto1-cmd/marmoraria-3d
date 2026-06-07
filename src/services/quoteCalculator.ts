import type {
  FinishQuoteInput,
  QuoteCalculationInput,
  QuoteCalculationResult,
  QuoteDimensions,
  SinkQuoteInput,
  StoneQuoteInput,
} from '../types/quote';

function ensureNonNegativeNumber(value: number, fieldName: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${fieldName} deve ser um número maior ou igual a zero.`);
  }
}

export function roundMoney(value: number) {
  if (!Number.isFinite(value)) {
    throw new Error('value deve ser um número finito.');
  }

  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function resolveQuantity(quantity?: number) {
  const resolvedQuantity = quantity ?? 1;

  if (!Number.isInteger(resolvedQuantity) || resolvedQuantity <= 0) {
    throw new Error('quantity deve ser um número inteiro maior que zero.');
  }

  return resolvedQuantity;
}

export function resolveThicknessMultiplier(thickness?: number) {
  if (thickness === undefined) {
    return 1;
  }

  ensureNonNegativeNumber(thickness, 'thickness');

  const normalizedThickness = Math.round(thickness * 100) / 100;

  if (normalizedThickness === 3) {
    return 1.15;
  }

  if (normalizedThickness === 4) {
    return 1.3;
  }

  return 1;
}

export function calculateArea({ width, depth }: QuoteDimensions) {
  ensureNonNegativeNumber(width, 'width');
  ensureNonNegativeNumber(depth, 'depth');

  return width * depth;
}

export function calculateStonePrice({
  dimensions,
  pricePerM2,
  thickness,
  quantity,
}: StoneQuoteInput) {
  ensureNonNegativeNumber(pricePerM2, 'pricePerM2');

  const area = calculateArea(dimensions);
  const resolvedQuantity = resolveQuantity(quantity);
  const thicknessMultiplier = resolveThicknessMultiplier(thickness);

  return roundMoney(area * pricePerM2 * thicknessMultiplier * resolvedQuantity);
}

export function calculateSinkPrice(input?: SinkQuoteInput | null) {
  if (!input) {
    return 0;
  }

  const price = input.price ?? 0;
  ensureNonNegativeNumber(price, 'sink.price');

  return roundMoney(price * resolveQuantity(input.quantity));
}

export function calculateFinishPrice(input?: FinishQuoteInput | null) {
  if (!input) {
    return 0;
  }

  const price = input.price ?? 0;
  ensureNonNegativeNumber(price, 'finish.price');

  const quantity = resolveQuantity(input.quantity);

  if (input.pricingType === 'fixed') {
    return roundMoney(price * quantity);
  }

  if (input.pricingType === 'linear_meter') {
    if (!input.dimensions) {
      throw new Error('dimensions é obrigatório para acabamento linear_meter.');
    }

    const perimeter = (input.dimensions.width + input.dimensions.depth) * 2;
    ensureNonNegativeNumber(perimeter, 'finish.perimeter');

    return roundMoney(perimeter * price * quantity);
  }

  const basePrice = input.basePrice ?? 0;
  ensureNonNegativeNumber(basePrice, 'finish.basePrice');

  return roundMoney(basePrice * (price / 100));
}

export function calculateQuoteTotal(
  input: QuoteCalculationInput,
): QuoteCalculationResult {
  const area = calculateArea(input.stone.dimensions);
  const thicknessMultiplier = resolveThicknessMultiplier(input.stone.thickness);
  const stonePrice = calculateStonePrice(input.stone);
  const sinkPrice = calculateSinkPrice(input.sink);
  const finishPrice = input.finish
    ? calculateFinishPrice({
        ...input.finish,
        basePrice: input.finish.basePrice ?? stonePrice,
        dimensions: input.finish.dimensions ?? input.stone.dimensions,
      })
    : 0;
  const subtotal = roundMoney(stonePrice + sinkPrice + finishPrice);

  return {
    area,
    stonePrice,
    sinkPrice,
    finishPrice,
    thicknessMultiplier,
    subtotal,
    total: subtotal,
  };
}
