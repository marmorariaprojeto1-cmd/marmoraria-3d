import { TechnicalServicesPage } from './TechnicalServicesPage';

const defaultCutouts = [
  { name: 'Recorte Cuba', price: 120 },
  { name: 'Recorte Cooktop', price: 140 },
  { name: 'Área Molhada', price: 80 },
];

export function CutoutsPage() {
  return (
    <TechnicalServicesPage
      table="cutouts"
      title="Recortes"
      description="Configure preços fixos de recortes e serviços técnicos usados pelo configurador 3D."
      emptyMessage="Nenhum recorte cadastrado para esta empresa."
      defaults={defaultCutouts}
    />
  );
}
