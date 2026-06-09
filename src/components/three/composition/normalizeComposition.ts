import type { ThreeDPreviewProps } from '../../../types/threePreview';

function resolveBacksplashHeightMm(componentId?: string, fallbackHeightMm = 0) {
  if (componentId === 'COMPONENT_021') return 50;
  if (componentId === 'COMPONENT_022') return 100;
  return fallbackHeightMm;
}

function resolveFrontApronHeightMm(componentId?: string, fallbackHeightMm = 0) {
  if (componentId === 'COMPONENT_031') return 40;
  if (componentId === 'COMPONENT_032') return 60;
  return fallbackHeightMm;
}

export type NormalizedThreeDPreviewProps = {
  topComponentId?: string;
  wetAreaComponentId?: string;
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
  rightBacksplashEnabled: boolean;
  frontApronEnabled: boolean;
  frontApronHeightCm: number;
  edgeFinishType: NonNullable<ThreeDPreviewProps['edgeFinishType']>;
  wetAreaEnabled: boolean;
  wetAreaWidth?: number;
  wetAreaDepth?: number;
  wetAreaPosition?: ThreeDPreviewProps['wetAreaPosition'];
};

export function normalizeComposition(
  props: ThreeDPreviewProps,
): NormalizedThreeDPreviewProps {
  if (props.composition) {
    const { composition } = props;
    const wetAreaComponentId =
      composition.wetArea?.id ?? composition.wetArea?.componentId;
    const backsplashComponentId = composition.backsplash?.id;
    const frontApronComponentId = composition.frontApron?.id;

    return {
      topComponentId: composition.top.id ?? composition.top.componentId,
      wetAreaComponentId,
      backsplashComponentId,
      frontApronComponentId,
      width: composition.top.width,
      depth: composition.top.depth,
      thickness: composition.top.thicknessMm / 10,
      stoneName: composition.material.stoneName,
      stoneImageUrl: composition.material.stoneImageUrl ?? props.stoneImageUrl,
      sinkEnabled: props.sinkEnabled,
      backsplashEnabled: composition.backsplash?.enabled ?? false,
      backsplashHeightCm:
        resolveBacksplashHeightMm(
          backsplashComponentId,
          composition.backsplash?.heightMm,
        ) / 10,
      leftBacksplashEnabled: composition.backsplash?.leftEnabled ?? false,
      rightBacksplashEnabled: composition.backsplash?.rightEnabled ?? false,
      frontApronEnabled: composition.frontApron?.enabled ?? false,
      frontApronHeightCm:
        resolveFrontApronHeightMm(
          frontApronComponentId,
          composition.frontApron?.heightMm,
        ) / 10,
      edgeFinishType: composition.edgeFinish?.type ?? 'straight',
      wetAreaEnabled: composition.wetArea?.enabled ?? false,
      wetAreaWidth: composition.wetArea?.width,
      wetAreaDepth: composition.wetArea?.depth,
      wetAreaPosition: composition.wetArea?.position,
    };
  }

  return {
    width: props.width ?? 0.8,
    depth: props.depth ?? 0.42,
    thickness: props.thickness ?? 3,
    stoneName: props.stoneName ?? 'Pedra não selecionada',
    stoneImageUrl: props.stoneImageUrl,
    sinkEnabled: props.sinkEnabled,
    backsplashEnabled: props.backsplashEnabled ?? true,
    backsplashHeightCm: props.backsplashHeightCm ?? 8,
    leftBacksplashEnabled: props.leftBacksplashEnabled ?? false,
    rightBacksplashEnabled: props.rightBacksplashEnabled ?? false,
    frontApronEnabled: props.frontApronEnabled ?? true,
    frontApronHeightCm: props.frontApronHeightCm ?? 12,
    edgeFinishType: props.edgeFinishType ?? 'rounded',
    wetAreaEnabled: props.wetAreaEnabled ?? true,
    wetAreaWidth: props.wetAreaWidth,
    wetAreaDepth: props.wetAreaDepth,
    wetAreaPosition: props.wetAreaPosition,
  };
}
