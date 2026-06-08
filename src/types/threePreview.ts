export type ThreeDEdgeFinishType = 'straight' | 'miter45' | 'rounded';

export type ThreeDWetAreaPosition = {
  x?: number;
  z?: number;
};

export type ThreeDPreviewProps = {
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
