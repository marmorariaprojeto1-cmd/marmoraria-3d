import type {
  CommercialProduct,
  CommercialProductCategory,
  CommercialProductDimensions,
} from './types';
import type { CountertopComposition } from '../../types/threePreview';

const ALLOWED_STONES = [
  'STONE_001',
  'STONE_002',
  'STONE_003',
  'STONE_004',
  'STONE_005',
  'STONE_006',
];

function buildDimensions(
  width: number,
  depth: number,
  thicknessMm = 30,
): CommercialProductDimensions {
  return { width, depth, thicknessMm };
}

function buildComposition({
  id,
  width,
  depth,
  stoneName,
  backsplashComponentId,
  frontApronComponentId,
  cutoutComponentId,
  notes,
}: {
  id: string;
  width: number;
  depth: number;
  stoneName: string;
  backsplashComponentId: 'COMPONENT_021' | 'COMPONENT_022';
  frontApronComponentId: 'COMPONENT_030' | 'COMPONENT_031' | 'COMPONENT_032';
  cutoutComponentId: 'COMPONENT_050' | 'COMPONENT_051' | 'COMPONENT_053';
  notes: string;
}): CountertopComposition {
  const backsplashHeightMm =
    backsplashComponentId === 'COMPONENT_022' ? 100 : 50;
  const frontApronHeightMm =
    frontApronComponentId === 'COMPONENT_032'
      ? 60
      : frontApronComponentId === 'COMPONENT_031'
        ? 40
        : 0;

  return {
    id,
    version: 1,
    top: {
      id: 'COMPONENT_002',
      componentId: 'COMPONENT_002',
      type: 'straight_top_30mm',
      width,
      depth,
      thicknessMm: 30,
    },
    material: {
      stoneName,
      stoneImageUrl: null,
      localTextureKey: null,
    },
    backsplash: {
      id: backsplashComponentId,
      componentId: backsplashComponentId,
      type: 'back_backsplash',
      enabled: true,
      heightMm: backsplashHeightMm,
      leftEnabled: false,
      rightEnabled: false,
    },
    frontApron: {
      id: frontApronComponentId,
      componentId: frontApronComponentId,
      type:
        frontApronComponentId === 'COMPONENT_030'
          ? 'no_front_apron'
          : 'front_apron',
      enabled: frontApronComponentId !== 'COMPONENT_030',
      heightMm: frontApronHeightMm,
    },
    edgeFinish: {
      type: 'straight',
    },
    cutout: {
      id: cutoutComponentId,
      componentId: cutoutComponentId,
      type:
        cutoutComponentId === 'COMPONENT_053'
          ? 'cooktop_cutout_560x480'
          : cutoutComponentId === 'COMPONENT_051'
            ? 'sink_cutout_560x340'
            : 'sink_cutout_500x400',
      enabled: true,
    },
    metadata: {
      source: 'commercial-product-catalog',
      notes,
    },
  };
}

function buildProduct({
  id,
  name,
  description,
  category,
  defaultDimensions,
  minDimensions,
  maxDimensions,
  defaultComposition,
}: {
  id: string;
  name: string;
  description: string;
  category: CommercialProductCategory;
  defaultDimensions: CommercialProductDimensions;
  minDimensions: CommercialProductDimensions;
  maxDimensions: CommercialProductDimensions;
  defaultComposition: CountertopComposition;
}): CommercialProduct {
  return {
    id,
    name,
    description,
    category,
    allowedStones: ALLOWED_STONES,
    defaultComposition,
    defaultDimensions,
    minDimensions,
    maxDimensions,
    active: true,
  };
}

export const commercialProducts: CommercialProduct[] = [
  buildProduct({
    id: 'PRODUCT_001_BANHEIRO_PREMIUM',
    name: 'Banheiro Premium',
    description: 'Bancada de banheiro com frontao baixo, saia frontal e recorte para cuba.',
    category: 'bathroom',
    defaultDimensions: buildDimensions(1.2, 0.5),
    minDimensions: buildDimensions(0.8, 0.42),
    maxDimensions: buildDimensions(2.2, 0.7),
    defaultComposition: buildComposition({
      id: 'composition-product-001-banheiro-premium',
      width: 1.2,
      depth: 0.5,
      stoneName: 'Branco Siena',
      backsplashComponentId: 'COMPONENT_021',
      frontApronComponentId: 'COMPONENT_031',
      cutoutComponentId: 'COMPONENT_050',
      notes: 'PRODUCT_001_BANHEIRO_PREMIUM: COMPONENT_002 + COMPONENT_021 + COMPONENT_031 + COMPONENT_050.',
    }),
  }),
  buildProduct({
    id: 'PRODUCT_002_LAVABO_SLIM',
    name: 'Lavabo Slim',
    description: 'Bancada compacta de lavabo com frontao baixo e sem saia frontal.',
    category: 'bathroom',
    defaultDimensions: buildDimensions(0.9, 0.42),
    minDimensions: buildDimensions(0.7, 0.38),
    maxDimensions: buildDimensions(1.6, 0.55),
    defaultComposition: buildComposition({
      id: 'composition-product-002-lavabo-slim',
      width: 0.9,
      depth: 0.42,
      stoneName: 'Branco Fortaleza',
      backsplashComponentId: 'COMPONENT_021',
      frontApronComponentId: 'COMPONENT_030',
      cutoutComponentId: 'COMPONENT_050',
      notes: 'PRODUCT_002_LAVABO_SLIM: COMPONENT_002 + COMPONENT_021 + COMPONENT_030 + COMPONENT_050.',
    }),
  }),
  buildProduct({
    id: 'PRODUCT_003_COZINHA_RETA',
    name: 'Cozinha Reta',
    description: 'Bancada reta de cozinha com frontao alto, saia frontal e recorte para cuba.',
    category: 'kitchen',
    defaultDimensions: buildDimensions(2.4, 0.62),
    minDimensions: buildDimensions(1.2, 0.55),
    maxDimensions: buildDimensions(3.6, 0.75),
    defaultComposition: buildComposition({
      id: 'composition-product-003-cozinha-reta',
      width: 2.4,
      depth: 0.62,
      stoneName: 'Preto Sao Gabriel',
      backsplashComponentId: 'COMPONENT_022',
      frontApronComponentId: 'COMPONENT_032',
      cutoutComponentId: 'COMPONENT_051',
      notes: 'PRODUCT_003_COZINHA_RETA: COMPONENT_002 + COMPONENT_022 + COMPONENT_032 + COMPONENT_051.',
    }),
  }),
  buildProduct({
    id: 'PRODUCT_004_COZINHA_COOKTOP',
    name: 'Cozinha com Cooktop',
    description: 'Bancada reta de cozinha com frontao alto, sem saia e recorte tecnico para cooktop.',
    category: 'kitchen',
    defaultDimensions: buildDimensions(2.2, 0.65),
    minDimensions: buildDimensions(1.4, 0.58),
    maxDimensions: buildDimensions(3.6, 0.8),
    defaultComposition: buildComposition({
      id: 'composition-product-004-cozinha-cooktop',
      width: 2.2,
      depth: 0.65,
      stoneName: 'Cinza Corumba',
      backsplashComponentId: 'COMPONENT_022',
      frontApronComponentId: 'COMPONENT_030',
      cutoutComponentId: 'COMPONENT_053',
      notes: 'PRODUCT_004_COZINHA_COOKTOP: COMPONENT_002 + COMPONENT_022 + COMPONENT_030 + COMPONENT_053.',
    }),
  }),
];

export function listCommercialProducts() {
  return commercialProducts.filter((product) => product.active);
}

export function findCommercialProduct(id: string) {
  return commercialProducts.find((product) => product.id === id) ?? null;
}

export type { CommercialProduct } from './types';
