import type { ComponentAddonPrice } from './types';

const LOCAL_TEST_NOTE = 'Valor provisório para teste local';

const componentPrices: ComponentAddonPrice[] = [
  {
    componentId: 'COMPONENT_002',
    name: 'Tampo 30 mm',
    pricingType: 'fixed',
    price: 0,
    active: true,
    note: LOCAL_TEST_NOTE,
  },
  {
    componentId: 'COMPONENT_020',
    name: 'Sem Frontão',
    pricingType: 'fixed',
    price: 0,
    active: true,
    note: LOCAL_TEST_NOTE,
  },
  {
    componentId: 'COMPONENT_021',
    name: 'Frontão 50 mm',
    pricingType: 'fixed',
    price: 90,
    active: true,
    note: LOCAL_TEST_NOTE,
  },
  {
    componentId: 'COMPONENT_022',
    name: 'Frontão 100 mm',
    pricingType: 'fixed',
    price: 150,
    active: true,
    note: LOCAL_TEST_NOTE,
  },
  {
    componentId: 'COMPONENT_030',
    name: 'Sem Saia',
    pricingType: 'fixed',
    price: 0,
    active: true,
    note: LOCAL_TEST_NOTE,
  },
  {
    componentId: 'COMPONENT_031',
    name: 'Saia 40 mm',
    pricingType: 'fixed',
    price: 120,
    active: true,
    note: LOCAL_TEST_NOTE,
  },
  {
    componentId: 'COMPONENT_032',
    name: 'Saia 60 mm',
    pricingType: 'fixed',
    price: 180,
    active: true,
    note: LOCAL_TEST_NOTE,
  },
  {
    componentId: 'COMPONENT_010',
    name: 'Área molhada reta',
    pricingType: 'fixed',
    price: 80,
    active: true,
    note: LOCAL_TEST_NOTE,
  },
  {
    componentId: 'COMPONENT_011',
    name: 'Área molhada dupla',
    pricingType: 'fixed',
    price: 130,
    active: true,
    note: LOCAL_TEST_NOTE,
  },
  {
    componentId: 'COMPONENT_012',
    name: 'Área molhada 45°',
    pricingType: 'fixed',
    price: 160,
    active: true,
    note: LOCAL_TEST_NOTE,
  },
  {
    componentId: 'COMPONENT_050',
    name: 'Recorte Cuba 500x400',
    pricingType: 'fixed',
    price: 110,
    active: true,
    note: LOCAL_TEST_NOTE,
  },
  {
    componentId: 'COMPONENT_051',
    name: 'Recorte Cuba 560x340',
    pricingType: 'fixed',
    price: 120,
    active: true,
    note: LOCAL_TEST_NOTE,
  },
  {
    componentId: 'COMPONENT_052',
    name: 'Recorte Cooktop 490x350',
    pricingType: 'fixed',
    price: 140,
    active: true,
    note: LOCAL_TEST_NOTE,
  },
  {
    componentId: 'COMPONENT_053',
    name: 'Recorte Cooktop 560x480',
    pricingType: 'fixed',
    price: 160,
    active: true,
    note: LOCAL_TEST_NOTE,
  },
];

export function listComponentPrices() {
  return componentPrices.filter((component) => component.active);
}

export function findComponentPrice(componentId: string) {
  return componentPrices.find((component) => component.componentId === componentId) ?? null;
}
