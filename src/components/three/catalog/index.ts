import {
  COMPONENT_021_ID,
  COMPONENT_021_NAME,
  Component021Backsplash50mm,
} from './COMPONENT_021_Backsplash50mm';
import {
  COMPONENT_022_ID,
  COMPONENT_022_NAME,
  Component022Backsplash100mm,
} from './COMPONENT_022_Backsplash100mm';
import {
  COMPONENT_002_ID,
  COMPONENT_002_NAME,
  Component002Top30mm,
} from './COMPONENT_002_Top30mm';
import {
  COMPONENT_031_ID,
  COMPONENT_031_NAME,
  Component031FrontApron40mm,
} from './COMPONENT_031_FrontApron40mm';
import {
  COMPONENT_032_ID,
  COMPONENT_032_NAME,
  Component032FrontApron60mm,
} from './COMPONENT_032_FrontApron60mm';
import type { ThreeDComponentRegistryItem } from './types';

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
  {
    id: COMPONENT_021_ID,
    name: COMPONENT_021_NAME,
    category: 'backsplash',
    component: Component021Backsplash50mm,
  },
  {
    id: COMPONENT_022_ID,
    name: COMPONENT_022_NAME,
    category: 'backsplash',
    component: Component022Backsplash100mm,
  },
  {
    id: COMPONENT_031_ID,
    name: COMPONENT_031_NAME,
    category: 'frontApron',
    component: Component031FrontApron40mm,
  },
  {
    id: COMPONENT_032_ID,
    name: COMPONENT_032_NAME,
    category: 'frontApron',
    component: Component032FrontApron60mm,
  },
];

export function findThreeDComponent(componentId: string) {
  return threeDComponentRegistry.find((item) => item.id === componentId) ?? null;
}

export {
  Component002Top30mm,
  Component021Backsplash50mm,
  Component022Backsplash100mm,
  Component031FrontApron40mm,
  Component032FrontApron60mm,
};
