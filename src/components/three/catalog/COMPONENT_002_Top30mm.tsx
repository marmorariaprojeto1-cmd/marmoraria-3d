import { StoneTop } from '../parts/StoneTop';
import type { ThreeDRegisteredComponentProps } from './types';

export const COMPONENT_002_ID = 'COMPONENT_002';
export const COMPONENT_002_NAME = 'Tampo Reto 30 mm';

const TOP_30MM_THICKNESS_METERS = 0.03;

export function Component002Top30mm({
  width,
  depth,
  edgeRadius,
  stoneName,
  texture,
  cutoutWidth,
  cutoutDepth,
  cutoutPosition,
}: ThreeDRegisteredComponentProps) {
  return (
    <StoneTop
      width={width}
      depth={depth}
      thickness={TOP_30MM_THICKNESS_METERS}
      edgeRadius={edgeRadius}
      stoneName={stoneName}
      texture={texture}
      cutoutWidth={cutoutWidth}
      cutoutDepth={cutoutDepth}
      cutoutPosition={cutoutPosition}
    />
  );
}
