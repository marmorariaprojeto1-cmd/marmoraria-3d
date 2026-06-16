import { TechnicalServicesPage } from './TechnicalServicesPage';

const defaultDrillings = [
  { name: 'Furo Torneira', price: 40 },
  { name: 'Furo Dosador', price: 40 },
];

export function DrillingsPage() {
  return (
    <TechnicalServicesPage
      table="drillings"
      title="Furações"
      description="Configure preços fixos de furações técnicas para torneira, dosador e futuros acessórios."
      emptyMessage="Nenhuma furação cadastrada para esta empresa."
      defaults={defaultDrillings}
    />
  );
}
