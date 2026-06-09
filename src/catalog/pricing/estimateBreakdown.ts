import type {
  CommercialEstimate,
  ComponentAddonItem,
  EstimateBreakdown,
  EstimateBreakdownItem,
} from './types';

const BACKSPLASH_COMPONENT_IDS = new Set(['COMPONENT_021', 'COMPONENT_022']);
const APRON_COMPONENT_IDS = new Set(['COMPONENT_031', 'COMPONENT_032']);
const WET_AREA_COMPONENT_IDS = new Set([
  'COMPONENT_010',
  'COMPONENT_011',
  'COMPONENT_012',
]);
const CUTOUT_COMPONENT_IDS = new Set([
  'COMPONENT_050',
  'COMPONENT_051',
  'COMPONENT_052',
  'COMPONENT_053',
]);

function sumAddonsByComponent(
  addons: ComponentAddonItem[],
  componentIds: Set<string>,
) {
  return addons
    .filter((addon) => componentIds.has(addon.componentId))
    .reduce((total, addon) => total + addon.price, 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function buildBreakdownItems({
  commercialEstimate,
  backsplashPrice,
  apronPrice,
  wetAreaPrice,
  cutoutPrice,
}: {
  commercialEstimate: CommercialEstimate;
  backsplashPrice: number;
  apronPrice: number;
  wetAreaPrice: number;
  cutoutPrice: number;
}): EstimateBreakdownItem[] {
  return [
    {
      label: 'Área',
      value: `${commercialEstimate.estimatedAreaM2.toFixed(2)} m²`,
    },
    {
      label: 'Pedra',
      value: commercialEstimate.composition.material.stoneName,
    },
    {
      label: 'Preço m²',
      value: formatCurrency(commercialEstimate.basePrice.pricePerM2),
    },
    {
      label: 'Subtotal Pedra',
      value: formatCurrency(commercialEstimate.basePrice.basePrice),
    },
    {
      label: 'Frontão',
      value: formatCurrency(backsplashPrice),
    },
    {
      label: 'Saia',
      value: formatCurrency(apronPrice),
    },
    {
      label: 'Área molhada',
      value: formatCurrency(wetAreaPrice),
    },
    {
      label: 'Recorte',
      value: formatCurrency(cutoutPrice),
    },
    {
      label: 'Adicionais',
      value: formatCurrency(commercialEstimate.totalAddons),
    },
    {
      label: 'Total Estimado',
      value: formatCurrency(commercialEstimate.estimatedTotal),
    },
  ];
}

export function buildEstimateBreakdown({
  commercialEstimate,
}: {
  commercialEstimate: CommercialEstimate;
}): EstimateBreakdown {
  const backsplashPrice = sumAddonsByComponent(
    commercialEstimate.addons,
    BACKSPLASH_COMPONENT_IDS,
  );
  const apronPrice = sumAddonsByComponent(
    commercialEstimate.addons,
    APRON_COMPONENT_IDS,
  );
  const wetAreaPrice = sumAddonsByComponent(
    commercialEstimate.addons,
    WET_AREA_COMPONENT_IDS,
  );
  const cutoutPrice = sumAddonsByComponent(
    commercialEstimate.addons,
    CUTOUT_COMPONENT_IDS,
  );

  return {
    areaM2: commercialEstimate.estimatedAreaM2,
    stonePrice: commercialEstimate.basePrice.pricePerM2,
    stoneSubtotal: commercialEstimate.basePrice.basePrice,
    backsplashPrice,
    apronPrice,
    wetAreaPrice,
    cutoutPrice,
    addonsSubtotal: commercialEstimate.totalAddons,
    estimatedTotal: commercialEstimate.estimatedTotal,
    breakdownItems: buildBreakdownItems({
      commercialEstimate,
      backsplashPrice,
      apronPrice,
      wetAreaPrice,
      cutoutPrice,
    }),
  };
}

export function formatEstimateBreakdown(breakdown: EstimateBreakdown) {
  return breakdown.breakdownItems.map(
    (item) => `${item.label}: ${item.value}`,
  );
}
