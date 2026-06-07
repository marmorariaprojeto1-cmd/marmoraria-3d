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

function resolveQuantity(quantity?: number) {
  const resolvedQuantity = quantity ?? 1;

  if (!Number.isInteger(resolvedQuantity) || resolvedQuantity <= 0) {
    throw new Error('quantity deve ser um número inteiro maior que zero.');
  }

  return resolvedQuantity;
}

export function calculateArea({ width, depth }: QuoteDimensions) {
  ensureNonNegativeNumber(width, 'width');
  ensureNonNegativeNumber(depth, 'depth');

  return width * depth;
}

export function calculateStonePrice({
  dimensions,
  pricePerM2,
  quantity,
}: StoneQuoteInput) {
  ensureNonNegativeNumber(pricePerM2, 'pricePerM2');

  const area = calculateArea(dimensions);
  const resolvedQuantity = resolveQuantity(quantity);

  return area * pricePerM2 * resolvedQuantity;
}

export function calculateSinkPrice(input?: SinkQuoteInput | null) {
  if (!input) {
    return 0;
  }

  const price = input.price ?? 0;
  ensureNonNegativeNumber(price, 'sink.price');

  return price * resolveQuantity(input.quantity);
}

export function calculateFinishPrice(input?: FinishQuoteInput | null) {
  if (!input) {
    return 0;
  }

  const price = input.price ?? 0;
  ensureNonNegativeNumber(price, 'finish.price');

  const quantity = resolveQuantity(input.quantity);

  if (input.pricingType === 'fixed') {
    return price * quantity;
  }

  if (input.pricingType === 'linear_meter') {
    if (!input.dimensions) {
      throw new Error('dimensions é obrigatório para acabamento linear_meter.');
    }

    const perimeter = (input.dimensions.width + input.dimensions.depth) * 2;
    ensureNonNegativeNumber(perimeter, 'finish.perimeter');

    return perimeter * price * quantity;
  }

  const basePrice = input.basePrice ?? 0;
  ensureNonNegativeNumber(basePrice, 'finish.basePrice');

  return basePrice * (price / 100) * quantity;
}

export function calculateQuoteTotal(
  input: QuoteCalculationInput,
): QuoteCalculationResult {
  const area = calculateArea(input.stone.dimensions);
  const stonePrice = calculateStonePrice(input.stone);
  const sinkPrice = calculateSinkPrice(input.sink);
  const finishPrice = input.finish
    ? calculateFinishPrice({
        ...input.finish,
        basePrice: input.finish.basePrice ?? stonePrice,
        dimensions: input.finish.dimensions ?? input.stone.dimensions,
      })
    : 0;

  return {
    area,
    stonePrice,
    sinkPrice,
    finishPrice,
    total: stonePrice + sinkPrice + finishPrice,
  };
}
