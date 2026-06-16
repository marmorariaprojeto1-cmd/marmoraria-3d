export type EdgeFinishVisualType =
  | 'straight'
  | 'halfBullnose'
  | 'bullnose'
  | 'miter45'
  | 'doubleApron';

export type EdgeFinishConfig = {
  edgeRadiusFactor: number;
  topHighlightHeight: number;
  faceHighlightHeight: number;
  faceHighlightOpacity: number;
  hasDoubleApron: boolean;
};

export type CountertopModel = {
  w: number;
  d: number;
  t: number;
  edgeRadius: number;
  backsplashH: number;
  backsplashT: number;
  skirtEnabled: boolean;
  skirtH: number;
  skirtT: number;
  rearSkirtEnabled: boolean;
  rearSkirtH: number;
  rearSkirtT: number;
  leftSkirtEnabled: boolean;
  leftSkirtH: number;
  leftSkirtT: number;
  rightSkirtEnabled: boolean;
  rightSkirtH: number;
  rightSkirtT: number;
};

export const edgeFinishConfigs: Record<EdgeFinishVisualType, EdgeFinishConfig> = {
  straight: {
    edgeRadiusFactor: 0.04,
    topHighlightHeight: 0.006,
    faceHighlightHeight: 0.008,
    faceHighlightOpacity: 0.14,
    hasDoubleApron: false,
  },
  halfBullnose: {
    edgeRadiusFactor: 0.14,
    topHighlightHeight: 0.008,
    faceHighlightHeight: 0.018,
    faceHighlightOpacity: 0.26,
    hasDoubleApron: false,
  },
  bullnose: {
    edgeRadiusFactor: 0.22,
    topHighlightHeight: 0.010,
    faceHighlightHeight: 0.03,
    faceHighlightOpacity: 0.32,
    hasDoubleApron: false,
  },
  miter45: {
    edgeRadiusFactor: 0.10,
    topHighlightHeight: 0.006,
    faceHighlightHeight: 0.03,
    faceHighlightOpacity: 0.22,
    hasDoubleApron: false,
  },
  doubleApron: {
    edgeRadiusFactor: 0.08,
    topHighlightHeight: 0.006,
    faceHighlightHeight: 0.014,
    faceHighlightOpacity: 0.2,
    hasDoubleApron: true,
  },
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function insetCenterFromFront(depth: number, pieceDepth: number) {
  return depth / 2 - pieceDepth / 2;
}

export function insetCenterFromBack(depth: number, pieceDepth: number) {
  return -depth / 2 + pieceDepth / 2;
}

export function insetCenterFromLeft(width: number, pieceWidth: number) {
  return -width / 2 + pieceWidth / 2;
}

export function insetCenterFromRight(width: number, pieceWidth: number) {
  return width / 2 - pieceWidth / 2;
}

export function resolveEdgeFinishVisualType(value: unknown): EdgeFinishVisualType {
  if (
    value === 'straight' ||
    value === 'halfBullnose' ||
    value === 'bullnose' ||
    value === 'miter45' ||
    value === 'doubleApron'
  ) {
    return value;
  }

  if (value === 'rounded') return 'bullnose';

  return 'straight';
}

export function buildCountertopModel({
  width,
  depth,
  thickness,
  backsplashEnabled,
  backsplashHeightCm,
  frontApronEnabled,
  frontApronHeightCm,
  rearApronEnabled,
  rearApronHeightCm,
  leftFrontApronEnabled,
  leftFrontApronHeightCm,
  rightFrontApronEnabled,
  rightFrontApronHeightCm,
  visualEdgeFinish,
}: {
  width: number;
  depth: number;
  thickness: number;
  backsplashEnabled: boolean;
  backsplashHeightCm: number;
  frontApronEnabled: boolean;
  frontApronHeightCm: number;
  rearApronEnabled: boolean;
  rearApronHeightCm: number;
  leftFrontApronEnabled: boolean;
  leftFrontApronHeightCm: number;
  rightFrontApronEnabled: boolean;
  rightFrontApronHeightCm: number;
  visualEdgeFinish: EdgeFinishVisualType;
}): CountertopModel {
  const w = Math.min(3.6, Math.max(0.8, width || 0.8));
  const d = Math.min(1.75, Math.max(0.42, depth || 0.42));
  const t = Math.min(0.08, Math.max(0.015, thickness || 0.03));
  const edgeRadius =
    visualEdgeFinish === 'straight'
      ? 0.007
      : visualEdgeFinish === 'miter45'
        ? 0.014
        : visualEdgeFinish === 'halfBullnose'
          ? Math.min(0.026, Math.max(0.018, t * 0.16))
          : visualEdgeFinish === 'bullnose'
            ? Math.min(0.038, Math.max(0.026, t * 0.22))
            : Math.min(0.018, Math.max(0.012, t * 0.1));
  const backsplashH = backsplashEnabled
    ? clamp(backsplashHeightCm / 100, 0.04, 0.18)
    : 0;
  const backsplashT = t;
  const skirtEnabled = frontApronEnabled || visualEdgeFinish === 'doubleApron';
  const skirtH = skirtEnabled
    ? clamp(
        visualEdgeFinish === 'doubleApron'
          ? Math.max(frontApronHeightCm / 100, 0.16)
          : frontApronHeightCm / 100,
        0.04,
        1.26,
      )
    : 0;
  const skirtT = t;
  const rearSkirtEnabled = rearApronEnabled;
  const rearSkirtH = rearSkirtEnabled
    ? clamp(rearApronHeightCm / 100, 0.04, 1.26)
    : 0;
  const rearSkirtT = t;
  const leftSkirtEnabled = leftFrontApronEnabled;
  const leftSkirtH = leftSkirtEnabled
    ? clamp(leftFrontApronHeightCm / 100, 0.04, 1.26)
    : 0;
  const leftSkirtT = t;
  const rightSkirtEnabled = rightFrontApronEnabled;
  const rightSkirtH = rightSkirtEnabled
    ? clamp(rightFrontApronHeightCm / 100, 0.04, 1.26)
    : 0;
  const rightSkirtT = t;

  return {
    w,
    d,
    t,
    edgeRadius,
    backsplashH,
    backsplashT,
    skirtEnabled,
    skirtH,
    skirtT,
    rearSkirtEnabled,
    rearSkirtH,
    rearSkirtT,
    leftSkirtEnabled,
    leftSkirtH,
    leftSkirtT,
    rightSkirtEnabled,
    rightSkirtH,
    rightSkirtT,
  };
}
