import { calculateBasePrice } from './calculateBasePrice';
import { calculateComponentAddons } from './calculateComponentAddons';
import {
  ensureNonNegativeNumber,
  resolveQuantity,
  roundMoney,
} from './moneyUtils';
import type { QuoteEngineInput, QuoteEngineResult } from './types';

/**
 * Orquestrador unificado de orçamento do Marmoraria3D.
 *
 * Substitui tanto `services/quoteCalculator.ts` (Motor 1 — simulador)
 * quanto `catalog/pricing/calculateCommercialEstimate.ts` (Motor 2 — preview
 * comercial) por uma única função que aceita os dois formatos de entrada.
 *
 * Regras aplicadas:
 *   - Área = largura × profundidade (m²)
 *   - Pedra = área × preçoPorM² × multiplicadorDeEspessura × quantidade
 *   - Cuba  = preço × quantidade
 *   - Acabamento = fixed | linear_meter | percentage
 *   - Componentes 3D (backsplash, saia, etc.) = soma dos preços fixos
 *   - Total = pedra + cuba + acabamento + componentes (arredondado)
 */
export function calculateQuoteEstimate(
  input: QuoteEngineInput,
): QuoteEngineResult {
  const {
    stoneId,
    width,
    depth,
    pricePerM2,
    thickness,
    sink,
    finish,
    quantity: rawQuantity,
    composition,
  } = input;

  // ── Validação ────────────────────────────────────────────────────────
  ensureNonNegativeNumber(width, 'width');
  ensureNonNegativeNumber(depth, 'depth');

  const resolvedQuantity = resolveQuantity(rawQuantity);
  const area = width * depth;

  // ── Pedra ─────────────────────────────────────────────────────────────
  const basePrice = calculateBasePrice({
    stoneId,
    areaM2: area,
    pricePerM2,
    thickness,
  });

  const stonePrice = roundMoney(
    basePrice.basePrice * resolvedQuantity,
  );

  // ── Cuba ──────────────────────────────────────────────────────────────
  let sinkPrice = 0;

  if (sink && sink.price > 0) {
    sinkPrice = roundMoney(sink.price * resolvedQuantity);
  }

  // ── Acabamento ────────────────────────────────────────────────────────
  let finishPrice = 0;

  if (finish && finish.price > 0) {
    if (finish.pricingType === 'fixed') {
      finishPrice = roundMoney(finish.price * resolvedQuantity);
    } else if (finish.pricingType === 'linear_meter') {
      const perimeter = (width + depth) * 2;
      finishPrice = roundMoney(perimeter * finish.price * resolvedQuantity);
    } else {
      // percentage: aplica sobre o preço da pedra (sem multiplicador de qtd)
      const stoneBaseForPercent = basePrice.basePrice;
      finishPrice = roundMoney(
        stoneBaseForPercent * (finish.price / 100),
      );
    }
  }

  // ── Componentes 3D (backsplash, saia, wet area, cutout) ──────────────
  let componentAddonsTotal = 0;

  if (composition) {
    const addons = calculateComponentAddons(composition);
    componentAddonsTotal = addons.totalAddons;
  }

  // ── Total ─────────────────────────────────────────────────────────────
  const subtotal = roundMoney(
    stonePrice + sinkPrice + finishPrice + componentAddonsTotal,
  );

  const thicknessMultiplier = basePrice.basePrice /
    (area * basePrice.pricePerM2);

  return {
    area: roundMoney(area * resolvedQuantity),
    stonePrice,
    sinkPrice,
    finishPrice,
    thicknessMultiplier: roundMoney(thicknessMultiplier),
    subtotal,
    total: subtotal,
  };
}
