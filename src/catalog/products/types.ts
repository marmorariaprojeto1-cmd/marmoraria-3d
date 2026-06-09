import type { CountertopComposition } from '../../types/threePreview';

export type CommercialProductCategory = 'bathroom' | 'kitchen';

export type CommercialProductDimensions = {
  width: number;
  depth: number;
  thicknessMm: number;
};

export type CommercialProduct = {
  id: string;
  name: string;
  description: string;
  category: CommercialProductCategory;
  allowedStones: string[];
  defaultComposition: CountertopComposition;
  defaultDimensions: CommercialProductDimensions;
  minDimensions: CommercialProductDimensions;
  maxDimensions: CommercialProductDimensions;
  active: boolean;
};
