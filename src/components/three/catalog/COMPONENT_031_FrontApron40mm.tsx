import { FrontApron } from '../parts/FrontApron';
import type { ThreeDRegisteredComponentProps } from './types';

export const COMPONENT_031_ID = 'COMPONENT_031';
export const COMPONENT_031_NAME = 'Saia 40 mm';

const FRONT_APRON_40MM_HEIGHT = 0.04;

export function Component031FrontApron40mm({
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
      skirtHeight={FRONT_APRON_40MM_HEIGHT}
      skirtThickness={skirtThickness ?? Math.max(0.04, thickness * 0.36)}
      edgeRadius={edgeRadius}
      stoneName={stoneName}
      texture={texture}
      visualEdgeFinish={visualEdgeFinish}
    />
  );
}
