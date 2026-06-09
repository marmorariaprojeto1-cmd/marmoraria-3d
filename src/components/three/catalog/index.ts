import {
  COMPONENT_010_ID,
  COMPONENT_010_NAME,
  Component010WetAreaStraight,
} from './COMPONENT_010_WetAreaStraight';
import {
  COMPONENT_011_ID,
  COMPONENT_011_NAME,
  Component011WetAreaDouble,
} from './COMPONENT_011_WetAreaDouble';
import {
  COMPONENT_012_ID,
  COMPONENT_012_NAME,
  Component012WetArea45,
} from './COMPONENT_012_WetArea45';
import {
  COMPONENT_020_ID,
  COMPONENT_020_NAME,
  Component020NoBacksplash,
} from './COMPONENT_020_NoBacksplash';
import {
  COMPONENT_021_ID,
  COMPONENT_021_NAME,
  Component021Backsplash50mm,
} from './COMPONENT_021_Backsplash50mm';
import {
  COMPONENT_050_ID,
  COMPONENT_050_NAME,
  Component050SinkCutout500x400,
} from './COMPONENT_050_SinkCutout500x400';
import {
  COMPONENT_051_ID,
  COMPONENT_051_NAME,
  Component051SinkCutout560x340,
} from './COMPONENT_051_SinkCutout560x340';
import {
  COMPONENT_052_ID,
  COMPONENT_052_NAME,
  Component052CooktopCutout490x350,
} from './COMPONENT_052_CooktopCutout490x350';
import {
  COMPONENT_053_ID,
  COMPONENT_053_NAME,
  Component053CooktopCutout560x480,
} from './COMPONENT_053_CooktopCutout560x480';
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
  COMPONENT_030_ID,
  COMPONENT_030_NAME,
  Component030NoFrontApron,
} from './COMPONENT_030_NoFrontApron';
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
    id: COMPONENT_010_ID,
    name: COMPONENT_010_NAME,
    category: 'wetArea',
    component: Component010WetAreaStraight,
  },
  {
    id: COMPONENT_011_ID,
    name: COMPONENT_011_NAME,
    category: 'wetArea',
    component: Component011WetAreaDouble,
  },
  {
    id: COMPONENT_012_ID,
    name: COMPONENT_012_NAME,
    category: 'wetArea',
    component: Component012WetArea45,
  },
  {
    id: COMPONENT_020_ID,
    name: COMPONENT_020_NAME,
    category: 'backsplash',
    component: Component020NoBacksplash,
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
    id: COMPONENT_030_ID,
    name: COMPONENT_030_NAME,
    category: 'frontApron',
    component: Component030NoFrontApron,
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
  {
    id: COMPONENT_050_ID,
    name: COMPONENT_050_NAME,
    category: 'cutout',
    component: Component050SinkCutout500x400,
  },
  {
    id: COMPONENT_051_ID,
    name: COMPONENT_051_NAME,
    category: 'cutout',
    component: Component051SinkCutout560x340,
  },
  {
    id: COMPONENT_052_ID,
    name: COMPONENT_052_NAME,
    category: 'cutout',
    component: Component052CooktopCutout490x350,
  },
  {
    id: COMPONENT_053_ID,
    name: COMPONENT_053_NAME,
    category: 'cutout',
    component: Component053CooktopCutout560x480,
  },
];

export function findThreeDComponent(componentId: string) {
  return threeDComponentRegistry.find((item) => item.id === componentId) ?? null;
}

export {
  Component010WetAreaStraight,
  Component011WetAreaDouble,
  Component012WetArea45,
  Component002Top30mm,
  Component020NoBacksplash,
  Component021Backsplash50mm,
  Component022Backsplash100mm,
  Component030NoFrontApron,
  Component031FrontApron40mm,
  Component032FrontApron60mm,
  Component050SinkCutout500x400,
  Component051SinkCutout560x340,
  Component052CooktopCutout490x350,
  Component053CooktopCutout560x480,
};
