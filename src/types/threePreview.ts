export type ThreeDEdgeFinishType =
  | 'straight'
  | 'halfBullnose'
  | 'bullnose'
  | 'miter45'
  | 'doubleApron'
  | 'rounded';

export type ThreeDWetAreaPosition = {
  x?: number;
  z?: number;
};

export type ThreeDTopComponent = {
  id?: string;
  componentId?: string;
  type: string;
  width: number;
  depth: number;
  thicknessMm: number;
};

export type ThreeDMaterialComponent = {
  stoneName: string;
  stoneImageUrl?: string | null;
  localTextureKey?: string | null;
};

export type ThreeDWetAreaComponent = {
  componentId: string;
  type: string;
  enabled: boolean;
  width?: number;
  depth?: number;
  position?: ThreeDWetAreaPosition;
};

export type ThreeDBacksplashComponent = {
  id?: string;
  componentId: string;
  type: string;
  enabled: boolean;
  heightMm?: number;
  leftEnabled?: boolean;
  rightEnabled?: boolean;
};

export type ThreeDFrontApronComponent = {
  id?: string;
  componentId: string;
  type: string;
  enabled: boolean;
  heightMm?: number;
};

export type ThreeDEdgeFinishComponent = {
  type: ThreeDEdgeFinishType;
};

export type ThreeDCompositionMetadata = {
  source?: string;
  createdAt?: string;
  notes?: string;
};

export type CountertopComposition = {
  id: string;
  version: number;
  top: ThreeDTopComponent;
  material: ThreeDMaterialComponent;
  wetArea?: ThreeDWetAreaComponent;
  backsplash?: ThreeDBacksplashComponent;
  frontApron?: ThreeDFrontApronComponent;
  edgeFinish?: ThreeDEdgeFinishComponent;
  metadata?: ThreeDCompositionMetadata;
};

export type LegacyThreeDPreviewProps = {
  width: number;
  depth: number;
  thickness: number;
  stoneName: string;
  stoneImageUrl?: string | null;
  sinkEnabled?: boolean;
  backsplashEnabled?: boolean;
  backsplashHeightCm?: number;
  leftBacksplashEnabled?: boolean;
  rightBacksplashEnabled?: boolean;
  frontApronEnabled?: boolean;
  frontApronHeightCm?: number;
  edgeFinishType?: ThreeDEdgeFinishType;
  wetAreaEnabled?: boolean;
  wetAreaWidth?: number;
  wetAreaDepth?: number;
  wetAreaPosition?: ThreeDWetAreaPosition;
};

export type ThreeDPreviewProps =
  | (LegacyThreeDPreviewProps & {
      composition?: CountertopComposition;
    })
  | ({
      composition: CountertopComposition;
    } & Partial<LegacyThreeDPreviewProps>);
