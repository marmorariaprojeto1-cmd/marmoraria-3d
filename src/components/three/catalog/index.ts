import type { ComponentType } from 'react';
import {
  COMPONENT_002_ID,
  COMPONENT_002_NAME,
  Component002Top30mm,
  type Component002Top30mmProps,
} from './COMPONENT_002_Top30mm';

export type ThreeDComponentCategory =
  | 'top'
  | 'wetArea'
  | 'backsplash'
  | 'frontApron'
  | 'edgeFinish';

export type ThreeDComponentRegistryItem = {
  id: string;
  name: string;
  category: ThreeDComponentCategory;
  component: ComponentType<Component002Top30mmProps> | null;
};

export const threeDComponentRegistry: ThreeDComponentRegistryItem[] = [
  {
    id: 'COMPONENT_001',
    name: 'Tampo Reto',
    category: 'top',
    component: null,
  },
  {
    id: COMPONENT_002_ID,
    name: COMPONENT_002_NAME,
    category: 'top',
    component: Component002Top30mm,
  },
  {
    id: 'COMPONENT_003',
    name: 'Tampo Reto 40 mm',
    category: 'top',
    component: null,
  },
];

export function findThreeDComponent(componentId: string) {
  return threeDComponentRegistry.find((item) => item.id === componentId) ?? null;
}

export { Component002Top30mm };
