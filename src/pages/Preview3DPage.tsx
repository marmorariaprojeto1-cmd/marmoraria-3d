import { ThreeDPreview } from '../components/three/ThreeDPreview';
import type { ThreeDPreviewProps } from '../types/threePreview';

const previewExamples: Array<{
  title: string;
  description: string;
  props: ThreeDPreviewProps;
}> = [
  {
    title: 'Frontão 10 cm com saia',
    description: 'Configuração completa com frontão traseiro, laterais e saia frontal.',
    props: {
      width: 2.4,
      depth: 0.7,
      thickness: 3,
      stoneName: 'Branco Siena',
      backsplashEnabled: true,
      backsplashHeightCm: 10,
      leftBacksplashEnabled: true,
      rightBacksplashEnabled: true,
      frontApronEnabled: true,
      frontApronHeightCm: 12,
      edgeFinishType: 'rounded',
      wetAreaEnabled: true,
      wetAreaWidth: 0.72,
      wetAreaDepth: 0.34,
      wetAreaPosition: { x: 0.32, z: 0.04 },
    },
  },
  {
    title: 'Sem saia',
    description: 'Tampo com frontão e borda frontal limpa.',
    props: {
      width: 2.2,
      depth: 0.65,
      thickness: 3,
      stoneName: 'Cinza Corumba',
      backsplashEnabled: true,
      backsplashHeightCm: 8,
      frontApronEnabled: false,
      edgeFinishType: 'straight',
      wetAreaEnabled: true,
      wetAreaWidth: 0.58,
      wetAreaDepth: 0.28,
      wetAreaPosition: { x: 0.18, z: 0.02 },
    },
  },
  {
    title: 'Sem frontão',
    description: 'Bancada solta com saia frontal e área molhada discreta.',
    props: {
      width: 2.1,
      depth: 0.68,
      thickness: 3,
      stoneName: 'Preto São Gabriel',
      backsplashEnabled: false,
      frontApronEnabled: true,
      frontApronHeightCm: 10,
      edgeFinishType: 'rounded',
      wetAreaEnabled: true,
      wetAreaWidth: 0.62,
      wetAreaDepth: 0.32,
      wetAreaPosition: { x: 0.22, z: 0.02 },
    },
  },
  {
    title: 'Acabamento 45 graus',
    description: 'Leve chanfro visual na borda frontal.',
    props: {
      width: 2.3,
      depth: 0.72,
      thickness: 3,
      stoneName: 'Branco Fortaleza',
      backsplashEnabled: true,
      backsplashHeightCm: 9,
      frontApronEnabled: true,
      frontApronHeightCm: 9,
      edgeFinishType: 'miter45',
      wetAreaEnabled: false,
    },
  },
  {
    title: 'Área molhada e seca',
    description: 'Marcação visual do rebaixo sem cuba nem regra comercial.',
    props: {
      width: 2.4,
      depth: 0.75,
      thickness: 3,
      stoneName: 'Amarelo Ornamental',
      backsplashEnabled: true,
      backsplashHeightCm: 10,
      frontApronEnabled: false,
      edgeFinishType: 'rounded',
      wetAreaEnabled: true,
      wetAreaWidth: 0.86,
      wetAreaDepth: 0.42,
      wetAreaPosition: { x: 0.34, z: 0.05 },
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
