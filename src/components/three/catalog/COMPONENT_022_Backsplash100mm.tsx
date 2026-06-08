import { Backsplash } from '../parts/Backsplash';
import type { ThreeDRegisteredComponentProps } from './types';

export const COMPONENT_022_ID = 'COMPONENT_022';
export const COMPONENT_022_NAME = 'Frontão 100 mm';

const BACKSPLASH_100MM_HEIGHT = 0.1;

export function Component022Backsplash100mm({
  width,
  depth,
  thickness,
  backsplashThickness,
  edgeRadius,
  stoneName,
  texture,
}: ThreeDRegisteredComponentProps) {
  return (
    <Backsplash
      width={width}
      depth={depth}
      thickness={thickness}
      backsplashHeight={BACKSPLASH_100MM_HEIGHT}
      backsplashThickness={backsplashThickness ?? Math.max(0.04, thickness * 0.36)}
      edgeRadius={edgeRadius}
      stoneName={stoneName}
      texture={texture}
    />
  );
}
