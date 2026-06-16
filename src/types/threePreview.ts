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

export type ThreeDCutoutPosition = {
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
  id?: string;
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

export type ThreeDCutoutComponent = {
  id?: string;
  componentId: string;
  type: string;
  enabled: boolean;
  position?: ThreeDCutoutPosition;
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
  cutout?: ThreeDCutoutComponent;
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
  cutoutEnabled?: boolean;
  cutoutComponentId?: string;
  cutoutPosition?: ThreeDCutoutPosition;
  /** Cuba como cutout independente */
  sinkCutoutComponentId?: string;
  sinkCutoutPosition?: ThreeDCutoutPosition;
  /** Cooktop como cutout independente */
  cooktopCutoutComponentId?: string;
  cooktopCutoutPosition?: ThreeDCutoutPosition;
  backsplashEnabled?: boolean;
  backsplashHeightCm?: number;
  leftBacksplashEnabled?: boolean;
  leftBacksplashHeightCm?: number;
  rightBacksplashEnabled?: boolean;
  rightBacksplashHeightCm?: number;
  frontApronEnabled?: boolean;
  frontApronHeightCm?: number;
  rearApronEnabled?: boolean;
  rearApronHeightCm?: number;
  leftFrontApronEnabled?: boolean;
  leftFrontApronHeightCm?: number;
  rightFrontApronEnabled?: boolean;
  rightFrontApronHeightCm?: number;
  edgeFinishType?: ThreeDEdgeFinishType;
  wetAreaEnabled?: boolean;
  wetAreaWidth?: number;
  wetAreaDepth?: number;
  wetAreaPosition?: ThreeDWetAreaPosition;
  cameraResetKey?: string | number | null;
};

export type ThreeDPreviewProps =
  | (LegacyThreeDPreviewProps & {
      composition?: CountertopComposition;
    })
  | ({
      composition: CountertopComposition;
    } & Partial<LegacyThreeDPreviewProps>);
