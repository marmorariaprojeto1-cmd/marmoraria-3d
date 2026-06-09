import { ThreeDPreview } from '../components/three/ThreeDPreview';
import type {
  CountertopComposition,
  ThreeDPreviewProps,
} from '../types/threePreview';

const top30Backsplash50Apron40Composition: CountertopComposition = {
  id: 'preview-component-002-021-031',
  version: 1,
  top: {
    id: 'COMPONENT_002',
    componentId: 'COMPONENT_002',
    type: 'straight_top_30mm',
    width: 2.4,
    depth: 0.7,
    thicknessMm: 30,
  },
  material: {
    stoneName: 'Branco Siena',
    stoneImageUrl: null,
    localTextureKey: 'branco-siena',
  },
  backsplash: {
    id: 'COMPONENT_021',
    componentId: 'COMPONENT_021',
    type: 'back_backsplash',
    enabled: true,
    heightMm: 50,
    leftEnabled: true,
    rightEnabled: true,
  },
  frontApron: {
    id: 'COMPONENT_031',
    componentId: 'COMPONENT_031',
    type: 'front_apron',
    enabled: true,
    heightMm: 40,
  },
  edgeFinish: {
    type: 'straight',
  },
  wetArea: {
    componentId: 'COMPONENT_010',
    type: 'straight_wet_area',
    enabled: true,
    width: 0.72,
    depth: 0.34,
    position: { x: 0.32, z: 0.04 },
  },
  metadata: {
    source: 'preview-3d',
    notes: 'COMPONENT_002 + COMPONENT_021 + COMPONENT_031.',
  },
};

const top30Backsplash100Apron60Composition: CountertopComposition = {
  id: 'preview-component-002-022-032',
  version: 1,
  top: {
    id: 'COMPONENT_002',
    componentId: 'COMPONENT_002',
    type: 'straight_top_30mm',
    width: 2.5,
    depth: 0.72,
    thicknessMm: 30,
  },
  material: {
    stoneName: 'Preto São Gabriel',
    stoneImageUrl: null,
    localTextureKey: 'preto-sao-gabriel',
  },
  backsplash: {
    id: 'COMPONENT_022',
    componentId: 'COMPONENT_022',
    type: 'back_backsplash',
    enabled: true,
    heightMm: 100,
    leftEnabled: true,
    rightEnabled: false,
  },
  frontApron: {
    id: 'COMPONENT_032',
    componentId: 'COMPONENT_032',
    type: 'front_apron',
    enabled: true,
    heightMm: 60,
  },
  edgeFinish: {
    type: 'rounded',
  },
  wetArea: {
    componentId: 'COMPONENT_010',
    type: 'straight_wet_area',
    enabled: true,
    width: 0.68,
    depth: 0.34,
    position: { x: 0.28, z: 0.03 },
  },
  metadata: {
    source: 'preview-3d',
    notes: 'COMPONENT_002 + COMPONENT_022 + COMPONENT_032.',
  },
};

const top30NoBacksplashNoApronComposition: CountertopComposition = {
  id: 'preview-component-002-020-030',
  version: 1,
  top: {
    id: 'COMPONENT_002',
    componentId: 'COMPONENT_002',
    type: 'straight_top_30mm',
    width: 2.2,
    depth: 0.65,
    thicknessMm: 30,
  },
  material: {
    stoneName: 'Cinza Corumbá',
    stoneImageUrl: null,
    localTextureKey: 'cinza-corumba',
  },
  backsplash: {
    id: 'COMPONENT_020',
    componentId: 'COMPONENT_020',
    type: 'no_backsplash',
    enabled: false,
  },
  frontApron: {
    id: 'COMPONENT_030',
    componentId: 'COMPONENT_030',
    type: 'no_front_apron',
    enabled: false,
  },
  edgeFinish: {
    type: 'straight',
  },
  wetArea: {
    componentId: 'COMPONENT_010',
    type: 'straight_wet_area',
    enabled: true,
    width: 0.56,
    depth: 0.3,
    position: { x: 0.16, z: 0.02 },
  },
  metadata: {
    source: 'preview-3d',
    notes: 'COMPONENT_002 + COMPONENT_020 + COMPONENT_030.',
  },
};

const top30Backsplash100NoApronComposition: CountertopComposition = {
  id: 'preview-component-002-022-030',
  version: 1,
  top: {
    id: 'COMPONENT_002',
    componentId: 'COMPONENT_002',
    type: 'straight_top_30mm',
    width: 2.35,
    depth: 0.68,
    thicknessMm: 30,
  },
  material: {
    stoneName: 'Branco Fortaleza',
    stoneImageUrl: null,
    localTextureKey: 'branco-fortaleza',
  },
  backsplash: {
    id: 'COMPONENT_022',
    componentId: 'COMPONENT_022',
    type: 'back_backsplash',
    enabled: true,
    heightMm: 100,
    leftEnabled: false,
    rightEnabled: false,
  },
  frontApron: {
    id: 'COMPONENT_030',
    componentId: 'COMPONENT_030',
    type: 'no_front_apron',
    enabled: false,
  },
  edgeFinish: {
    type: 'miter45',
  },
  wetArea: {
    componentId: 'COMPONENT_010',
    type: 'straight_wet_area',
    enabled: false,
  },
  metadata: {
    source: 'preview-3d',
    notes: 'COMPONENT_002 + COMPONENT_022 sem saia.',
  },
};

const previewExamples: Array<{
  title: string;
  description: string;
  props: ThreeDPreviewProps;
}> = [
  {
    title: 'Tampo 30 mm + Frontão 50 mm + Saia 40 mm',
    description: 'COMPONENT_002 + COMPONENT_021 + COMPONENT_031.',
    props: {
      composition: top30Backsplash50Apron40Composition,
    },
  },
  {
    title: 'Tampo 30 mm + Frontão 100 mm + Saia 60 mm',
    description: 'COMPONENT_002 + COMPONENT_022 + COMPONENT_032.',
    props: {
      composition: top30Backsplash100Apron60Composition,
    },
  },
  {
    title: 'Tampo 30 mm sem frontão e sem saia',
    description: 'COMPONENT_002 + COMPONENT_020 + COMPONENT_030.',
    props: {
      composition: top30NoBacksplashNoApronComposition,
    },
  },
  {
    title: 'Tampo 30 mm + Frontão 100 mm sem saia',
    description: 'COMPONENT_002 + COMPONENT_022, com COMPONENT_030 desativado.',
    props: {
      composition: top30Backsplash100NoApronComposition,
    },
  },
];

export function Preview3DPage() {
  return (
    <section className="page-shell">
      <div>
        <p className="page-kicker">Preview temporario</p>
        <h1 className="page-title">Teste isolado do 3D</h1>
        <p className="page-description">
          Rota temporaria para validar a primeira versao isolada do preview 3D,
          sem integrar ao simulador e sem alterar regras comerciais.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        {previewExamples.map((example) => (
          <article key={example.title} className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold text-graphite">
                {example.title}
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                {example.description}
              </p>
            </div>
            <ThreeDPreview {...example.props} />
          </article>
        ))}
      </div>
    </section>
  );
}
