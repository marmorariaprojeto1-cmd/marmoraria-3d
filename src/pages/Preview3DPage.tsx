import { ThreeDPreview } from '../components/three/ThreeDPreview';

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

      <ThreeDPreview
        width={2.4}
        depth={0.7}
        thickness={3}
        stoneName="Branco Paraná"
        sinkEnabled
      />
    </section>
  );
}

