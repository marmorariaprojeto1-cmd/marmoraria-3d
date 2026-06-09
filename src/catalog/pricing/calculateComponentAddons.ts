import type { CountertopComposition } from '../../types/threePreview';
import { findComponentPrice } from './componentPrices';
import type { ComponentAddonItem, ComponentAddonsResult } from './types';

const FREE_COMPONENT_IDS = new Set([
  'COMPONENT_002',
  'COMPONENT_020',
  'COMPONENT_030',
]);

function collectPricedComponentIds(composition: CountertopComposition) {
  return [
    composition.backsplash?.id ?? composition.backsplash?.componentId,
    composition.frontApron?.id ?? composition.frontApron?.componentId,
    composition.wetArea?.id ?? composition.wetArea?.componentId,
    composition.cutout?.id ?? composition.cutout?.componentId,
  ].filter((componentId): componentId is string => Boolean(componentId));
}

export function calculateComponentAddons(
  composition: CountertopComposition,
): ComponentAddonsResult {
  const items = collectPricedComponentIds(composition).reduce<ComponentAddonItem[]>(
    (addons, componentId) => {
      if (FREE_COMPONENT_IDS.has(componentId)) {
        return addons;
      }

      const componentPrice = findComponentPrice(componentId);
      if (!componentPrice || !componentPrice.active || componentPrice.price <= 0) {
        return addons;
      }

      return [
        ...addons,
        {
          componentId,
          name: componentPrice.name,
          price: componentPrice.price,
        },
      ];
    },
    [],
  );

  return {
    items,
    totalAddons: items.reduce((total, item) => total + item.price, 0),
  };
}
