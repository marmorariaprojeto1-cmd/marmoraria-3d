import { clamp } from '../utils/geometryUtils';
import type { ThreeDRegisteredComponentProps } from './types';

export const COMPONENT_010_ID = 'COMPONENT_010';
export const COMPONENT_010_NAME = 'Área molhada reta';

export function Component010WetAreaStraight({
  width,
  depth,
  thickness,
  wetAreaWidth,
  wetAreaDepth,
  wetAreaPosition,
}: ThreeDRegisteredComponentProps) {
  const markerWidth = clamp(wetAreaWidth ?? width * 0.36, width * 0.16, width * 0.62);
  const markerDepth = clamp(wetAreaDepth ?? depth * 0.46, depth * 0.18, depth * 0.72);
  const markerX = clamp(wetAreaPosition?.x ?? width * 0.16, -width * 0.32, width * 0.32);
  const markerZ = clamp(wetAreaPosition?.z ?? depth * 0.05, -depth * 0.24, depth * 0.24);

  return (
    <group position={[markerX, thickness / 2 + 0.009, markerZ]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[markerWidth, markerDepth]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.11}
          roughness={0.08}
          metalness={0}
          clearcoat={0.95}
          clearcoatRoughness={0.05}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>

      <mesh
        position={[0, 0.002, -markerDepth / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[markerWidth * 0.82, 0.008]} />
        <meshBasicMaterial
          color="#2d2924"
          transparent
          opacity={0.14}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
