import type { CountertopComposition } from '../../types/threePreview';
import { findComponentPrice } from './componentPrices';

const fallbackComponentNames: Record<string, string> = {
  COMPONENT_010: 'Área molhada reta',
  COMPONENT_011: 'Área molhada dupla',
  COMPONENT_012: 'Área molhada 45°',
  COMPONENT_020: 'Sem Frontão',
  COMPONENT_021: 'Frontão 50 mm',
  COMPONENT_022: 'Frontão 100 mm',
  COMPONENT_030: 'Sem Saia',
  COMPONENT_031: 'Saia 40 mm',
  COMPONENT_032: 'Saia 60 mm',
  COMPONENT_050: 'Recorte Cuba 500x400',
  COMPONENT_051: 'Recorte Cuba 560x340',
  COMPONENT_052: 'Recorte Cooktop 490x350',
  COMPONENT_053: 'Recorte Cooktop 560x480',
  COMPONENT_002: 'Tampo 30 mm',
};

function collectCompositionComponentIds(composition: CountertopComposition) {
  return [
    composition.top.id ?? composition.top.componentId,
    composition.backsplash?.id ?? composition.backsplash?.componentId,
    composition.frontApron?.id ?? composition.frontApron?.componentId,
    composition.wetArea?.id ?? composition.wetArea?.componentId,
    composition.cutout?.id ?? composition.cutout?.componentId,
  ].filter((componentId): componentId is string => Boolean(componentId));
}

export function getComponentDisplayName(componentId: string) {
  return (
    findComponentPrice(componentId)?.name ??
    fallbackComponentNames[componentId] ??
    componentId
  );
}

export function formatCompositionComponents(composition: CountertopComposition) {
  return collectCompositionComponentIds(composition)
    .map(getComponentDisplayName)
    .join(' + ');
}
