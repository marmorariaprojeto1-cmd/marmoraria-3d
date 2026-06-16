/**
 * Utilitários financeiros do Marmoraria3D.
 * Extraídos de src/services/quoteCalculator.ts para uso no QuoteEngine unificado.
 *
 * Regras de arredondamento e validação numérica são aplicadas
 * em todos os cálculos de orçamento do projeto.
 */

/**
 * Arredonda um valor monetário para 2 casas decimais.
 * Usa EPSILON para evitar erros de ponto flutuante.
 */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error('value deve ser um número finito.');
  }

  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Valida que um número é finito e não negativo.
 * Dispara erro descritivo com o nome do campo.
 */
export function ensureNonNegativeNumber(
  value: number,
  fieldName: string,
): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      `${fieldName} deve ser um número maior ou igual a zero.`,
    );
  }
}

/**
 * Resolve e valida uma quantidade (padrão: 1).
 * Deve ser um inteiro maior que zero.
 */
export function resolveQuantity(quantity?: number): number {
  const resolvedQuantity = quantity ?? 1;

  if (!Number.isInteger(resolvedQuantity) || resolvedQuantity <= 0) {
    throw new Error(
      'quantity deve ser um número inteiro maior que zero.',
    );
  }

  return resolvedQuantity;
}

/**
 * Multiplicador de preço por espessura da pedra.
 *
 * Regras oficiais do MVP:
 *   2 cm → 1,00 (sem acréscimo)
 *   3 cm → 1,15 (+15%)
 *   4 cm → 1,30 (+30%)
 *
 * Espessuras não reconhecidas usam multiplicador 1.
 * Se thickness for undefined, retorna 1 (sem acréscimo).
 */
export function resolveThicknessMultiplier(thickness?: number): number {
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
