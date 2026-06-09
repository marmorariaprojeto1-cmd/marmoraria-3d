import type { StoneBasePrice } from './types';

// Valores provisórios de exemplo para validar o fluxo comercial inicial.
const stonePrices: StoneBasePrice[] = [
  {
    stoneId: 'STONE_001',
    stoneName: 'Branco Fortaleza',
    pricePerM2: 520,
    active: true,
  },
  {
    stoneId: 'STONE_002',
    stoneName: 'Branco Siena',
    pricePerM2: 590,
    active: true,
  },
  {
    stoneId: 'STONE_003',
    stoneName: 'Preto São Gabriel',
    pricePerM2: 680,
    active: true,
  },
  {
    stoneId: 'STONE_004',
    stoneName: 'Verde Ubatuba',
    pricePerM2: 560,
    active: true,
  },
  {
    stoneId: 'STONE_005',
    stoneName: 'Cinza Corumbá',
    pricePerM2: 540,
    active: true,
  },
  {
    stoneId: 'STONE_006',
    stoneName: 'Amarelo Ornamental',
    pricePerM2: 620,
    active: true,
  },
];

export function listStonePrices() {
  return stonePrices.filter((stone) => stone.active);
}

export function findStonePrice(stoneId: string) {
  return stonePrices.find((stone) => stone.stoneId === stoneId) ?? null;
}
