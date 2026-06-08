import { FrontApron } from '../parts/FrontApron';
import type { ThreeDRegisteredComponentProps } from './types';

export const COMPONENT_032_ID = 'COMPONENT_032';
export const COMPONENT_032_NAME = 'Saia 60 mm';

const FRONT_APRON_60MM_HEIGHT = 0.06;

export function Component032FrontApron60mm({
  width,
  depth,
  thickness,
  skirtThickness,
  edgeRadius,
  stoneName,
  texture,
  visualEdgeFinish = 'straight',
}: ThreeDRegisteredComponentProps) {
  return (
    <FrontApron
      width={width}
      depth={depth}
      thickness={thickness}
      skirtHeight={FRONT_APRON_60MM_HEIGHT}
      skirtThickness={skirtThickness ?? Math.max(0.04, thickness * 0.36)}
      edgeRadius={edgeRadius}
      stoneName={stoneName}
      texture={texture}
      visualEdgeFinish={visualEdgeFinish}
    />
  );
}
