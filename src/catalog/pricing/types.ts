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

/** Categorias de addons para cálculo e breakdown do QuoteEngine unificado. */
export type ComponentAddonCategory =
  | 'backsplash'
  | 'frontApron'
  | 'wetArea'
  | 'cutout'
  | 'sink'
  | 'finish';

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
  /** Preço por m² informado externamente (ex: Supabase).
   *  Se ausente, usa o preço hardcoded (fallback do preview comercial). */
  pricePerM2?: number;
  /** Espessura da pedra em cm para aplicar multiplicador.
   *  Se ausente, usa multiplicador 1 (sem acréscimo). */
  thickness?: number;
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
  /** Categoria do addon para breakdown e sumarização.
   *  Opcional para não quebrar consumidores existentes. */
  category?: ComponentAddonCategory;
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

// ── QuoteEngine Unificado ────────────────────────────────────────────

/**
 * Input unificado do QuoteEngine.
 *
 * Aceita tanto o formato do simulador (stone com pricePerM2, thickness,
 * sink, finish opcionais) quanto o formato comercial (productId + stoneId
 * + width + depth com composição opcional).
 */
export type QuoteEngineInput = {
  /** ID do produto comercial (opcional — simulador não usa). */
  productId?: string;
  /** ID da pedra (obrigatório). */
  stoneId: string;
  /** Preço por m² da pedra. Se ausente, usa lookup hardcoded. */
  pricePerM2?: number;
  /** Largura em metros (obrigatório). */
  width: number;
  /** Profundidade em metros (obrigatório). */
  depth: number;
  /** Espessura em cm. Se ausente, multiplicador = 1. */
  thickness?: number;
  /** Quantidade de peças (padrão: 1). */
  quantity?: number;
  /** Cuba opcional com preço unitário. */
  sink?: {
    id?: string;
    name?: string;
    price: number;
  } | null;
  /** Acabamento opcional. */
  finish?: {
    id?: string;
    name?: string;
    pricingType: 'fixed' | 'linear_meter' | 'percentage';
    price: number;
  } | null;
  /** Composição 3D opcional (produtos comerciais). */
  composition?: CountertopComposition;
};

/**
 * Resultado unificado do QuoteEngine.
 *
 * Compatível com QuoteCalculationResult (simulador) e CommercialEstimate
 * (produtos comerciais). Campos opcionais ausentes recebem 0 ou vazio.
 */
export type QuoteEngineResult = {
  /** Área calculada em m². */
  area: number;
  /** Preço total da pedra (área × preço/m² × espessura × qtd). */
  stonePrice: number;
  /** Preço da cuba (0 se não informada). */
  sinkPrice: number;
  /** Preço do acabamento (0 se não informado). */
  finishPrice: number;
  /** Multiplicador aplicado pela espessura. */
  thicknessMultiplier: number;
  /** Subtotal antes de arredondamento final. */
  subtotal: number;
  /** Total arredondado (subtotal + arredondamento). */
  total: number;
};
