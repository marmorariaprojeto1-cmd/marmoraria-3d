import type { ThreeDPreviewProps } from '../../../types/threePreview';

export type NormalizedThreeDPreviewProps = {
  topComponentId?: string;
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

    return {
      topComponentId: composition.top.id ?? composition.top.componentId,
      width: composition.top.width,
      depth: composition.top.depth,
      thickness: composition.top.thicknessMm / 10,
      stoneName: composition.material.stoneName,
      stoneImageUrl: composition.material.stoneImageUrl ?? props.stoneImageUrl,
      sinkEnabled: props.sinkEnabled,
      backsplashEnabled: composition.backsplash?.enabled ?? false,
      backsplashHeightCm: (composition.backsplash?.heightMm ?? 0) / 10,
      leftBacksplashEnabled: composition.backsplash?.leftEnabled ?? false,
      rightBacksplashEnabled: composition.backsplash?.rightEnabled ?? false,
      frontApronEnabled: composition.frontApron?.enabled ?? false,
      frontApronHeightCm: (composition.frontApron?.heightMm ?? 0) / 10,
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
