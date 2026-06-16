import { Backsplash } from '../parts/Backsplash';
import type { ThreeDRegisteredComponentProps } from './types';

export const COMPONENT_021_ID = 'COMPONENT_021';
export const COMPONENT_021_NAME = 'Frontão 50 mm';

const BACKSPLASH_50MM_HEIGHT = 0.05;

export function Component021Backsplash50mm({
  width,
  depth,
  thickness,
  backsplashThickness,
  edgeRadius,
  stoneName,
  texture,
  suppressJoinShadow,
}: ThreeDRegisteredComponentProps) {
  return (
    <Backsplash
      width={width}
      depth={depth}
      thickness={thickness}
      backsplashHeight={BACKSPLASH_50MM_HEIGHT}
      backsplashThickness={backsplashThickness ?? Math.max(0.04, thickness * 0.36)}
      edgeRadius={edgeRadius}
      stoneName={stoneName}
      texture={texture}
      suppressJoinShadow={suppressJoinShadow}
    />
  );
}
