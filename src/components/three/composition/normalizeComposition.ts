import type {
  ThreeDCutoutPosition,
  ThreeDPreviewProps,
} from '../../../types/threePreview';

function resolveBacksplashHeightMm(componentId?: string, fallbackHeightMm = 0) {
  if (componentId === 'COMPONENT_020') return 0;
  if (componentId === 'COMPONENT_021') return 50;
  if (componentId === 'COMPONENT_022') return 100;
  return fallbackHeightMm;
}

function resolveFrontApronHeightMm(componentId?: string, fallbackHeightMm = 0) {
  if (componentId === 'COMPONENT_030') return 0;
  if (componentId === 'COMPONENT_031') return 40;
  if (componentId === 'COMPONENT_032') return 60;
  return fallbackHeightMm;
}

function centimetersToMeters(value: number) {
  return value / 100;
}

function millimetersToMeters(value: number) {
  return value / 1000;
}

function normalizeLegacyThicknessToMeters(value = 3) {
  return value > 1 ? centimetersToMeters(value) : value;
}

export type NormalizedThreeDPreviewProps = {
  topComponentId?: string;
  wetAreaComponentId?: string;
  cutoutComponentId?: string;
  backsplashComponentId?: string;
  frontApronComponentId?: string;
  width: number;
  depth: number;
  thickness: number;
  stoneName: string;
  stoneImageUrl?: string | null;
  sinkEnabled?: boolean;
  backsplashEnabled: boolean;
  backsplashHeightCm: number;
  leftBacksplashEnabled: boolean;
  leftBacksplashHeightCm: number;
  rightBacksplashEnabled: boolean;
  rightBacksplashHeightCm: number;
  frontApronEnabled: boolean;
  frontApronHeightCm: number;
  rearApronEnabled: boolean;
  rearApronHeightCm: number;
  leftFrontApronEnabled: boolean;
  leftFrontApronHeightCm: number;
  rightFrontApronEnabled: boolean;
  rightFrontApronHeightCm: number;
  edgeFinishType: NonNullable<ThreeDPreviewProps['edgeFinishType']>;
  wetAreaEnabled: boolean;
  wetAreaWidth?: number;
  wetAreaDepth?: number;
  wetAreaPosition?: ThreeDPreviewProps['wetAreaPosition'];
  cutoutEnabled: boolean;
  cutoutPosition?: ThreeDCutoutPosition;
  sinkCutoutComponentId?: string;
  sinkCutoutPosition?: ThreeDCutoutPosition;
  cooktopCutoutComponentId?: string;
  cooktopCutoutPosition?: ThreeDCutoutPosition;
};

export function normalizeComposition(
  props: ThreeDPreviewProps,
): NormalizedThreeDPreviewProps {
  if (props.composition) {
    const { composition } = props;
    const wetAreaComponentId =
      composition.wetArea?.id ?? composition.wetArea?.componentId;
    const cutoutComponentId =
      composition.cutout?.id ?? composition.cutout?.componentId;
    const backsplashComponentId =
      composition.backsplash?.id ?? composition.backsplash?.componentId;
    const frontApronComponentId =
      composition.frontApron?.id ?? composition.frontApron?.componentId;

    return {
      topComponentId: composition.top.id ?? composition.top.componentId,
      wetAreaComponentId,
      cutoutComponentId,
      backsplashComponentId,
      frontApronComponentId,
      width: composition.top.width,
      depth: composition.top.depth,
      thickness: millimetersToMeters(composition.top.thicknessMm),
      stoneName: composition.material.stoneName,
      stoneImageUrl: composition.material.stoneImageUrl ?? props.stoneImageUrl,
      sinkEnabled: props.sinkEnabled,
      backsplashEnabled:
        backsplashComponentId === 'COMPONENT_020'
          ? false
          : composition.backsplash?.enabled ?? false,
      backsplashHeightCm:
        resolveBacksplashHeightMm(
          backsplashComponentId,
          composition.backsplash?.heightMm,
        ) / 10,
      leftBacksplashEnabled: composition.backsplash?.leftEnabled ?? false,
      leftBacksplashHeightCm: (composition.backsplash?.heightMm ?? 80) / 10,
      rightBacksplashEnabled: composition.backsplash?.rightEnabled ?? false,
      rightBacksplashHeightCm: (composition.backsplash?.heightMm ?? 80) / 10,
      frontApronEnabled:
        frontApronComponentId === 'COMPONENT_030'
          ? false
          : composition.frontApron?.enabled ?? false,
      frontApronHeightCm:
        resolveFrontApronHeightMm(
          frontApronComponentId,
          composition.frontApron?.heightMm,
        ) / 10,
      rearApronEnabled: false,
      rearApronHeightCm: 10,
      leftFrontApronEnabled: false,
      leftFrontApronHeightCm: 10,
      rightFrontApronEnabled: false,
      rightFrontApronHeightCm: 10,
      edgeFinishType: composition.edgeFinish?.type ?? 'straight',
      wetAreaEnabled: composition.wetArea?.enabled ?? false,
      wetAreaWidth: composition.wetArea?.width,
      wetAreaDepth: composition.wetArea?.depth,
      wetAreaPosition: composition.wetArea?.position,
      cutoutEnabled: composition.cutout?.enabled ?? false,
      cutoutPosition: composition.cutout?.position,
    };
  }

  return {
    width: props.width ?? 0.8,
    depth: props.depth ?? 0.42,
    thickness: normalizeLegacyThicknessToMeters(props.thickness),
    stoneName: props.stoneName ?? 'Pedra não selecionada',
    stoneImageUrl: props.stoneImageUrl,
    sinkEnabled: props.sinkEnabled,
    backsplashEnabled: props.backsplashEnabled ?? true,
    backsplashHeightCm: props.backsplashHeightCm ?? 8,
    leftBacksplashEnabled: props.leftBacksplashEnabled ?? false,
    leftBacksplashHeightCm: props.leftBacksplashHeightCm ?? props.backsplashHeightCm ?? 8,
    rightBacksplashEnabled: props.rightBacksplashEnabled ?? false,
    rightBacksplashHeightCm: props.rightBacksplashHeightCm ?? props.backsplashHeightCm ?? 8,
    frontApronEnabled: props.frontApronEnabled ?? true,
    frontApronHeightCm: props.frontApronHeightCm ?? 12,
    rearApronEnabled: props.rearApronEnabled ?? false,
    rearApronHeightCm: props.rearApronHeightCm ?? 10,
    leftFrontApronEnabled: props.leftFrontApronEnabled ?? false,
    leftFrontApronHeightCm: props.leftFrontApronHeightCm ?? 10,
    rightFrontApronEnabled: props.rightFrontApronEnabled ?? false,
    rightFrontApronHeightCm: props.rightFrontApronHeightCm ?? 10,
    edgeFinishType: props.edgeFinishType ?? 'rounded',
    wetAreaEnabled: props.wetAreaEnabled ?? true,
    wetAreaWidth: props.wetAreaWidth,
    wetAreaDepth: props.wetAreaDepth,
    wetAreaPosition: props.wetAreaPosition,
    cutoutEnabled: props.cutoutEnabled ?? false,
    cutoutComponentId: props.cutoutComponentId,
    cutoutPosition: props.cutoutPosition,
    sinkCutoutComponentId: props.sinkCutoutComponentId,
    sinkCutoutPosition: props.sinkCutoutPosition,
    cooktopCutoutComponentId: props.cooktopCutoutComponentId,
    cooktopCutoutPosition: props.cooktopCutoutPosition,
  };
}
