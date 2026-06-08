import * as THREE from 'three';
import { StoneTop } from '../parts/StoneTop';

export const COMPONENT_002_ID = 'COMPONENT_002';
export const COMPONENT_002_NAME = 'Tampo Reto 30 mm';

const TOP_30MM_VISUAL_THICKNESS = 3 / 18;

export type Component002Top30mmProps = {
  width: number;
  depth: number;
  edgeRadius: number;
  stoneName: string;
  texture: THREE.Texture | null;
};

export function Component002Top30mm({
  width,
  depth,
  edgeRadius,
  stoneName,
  texture,
}: Component002Top30mmProps) {
  return (
    <StoneTop
      width={width}
      depth={depth}
      thickness={TOP_30MM_VISUAL_THICKNESS}
      edgeRadius={edgeRadius}
      stoneName={stoneName}
      texture={texture}
    />
  );
}
