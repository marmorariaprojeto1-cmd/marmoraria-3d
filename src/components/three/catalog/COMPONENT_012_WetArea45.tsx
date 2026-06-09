import { clamp } from '../utils/geometryUtils';
import type { ThreeDRegisteredComponentProps } from './types';

export const COMPONENT_012_ID = 'COMPONENT_012';
export const COMPONENT_012_NAME = 'Área molhada 45°';

export function Component012WetArea45({
  width,
  depth,
  thickness,
  wetAreaWidth,
  wetAreaDepth,
  wetAreaPosition,
}: ThreeDRegisteredComponentProps) {
  const markerWidth = clamp(wetAreaWidth ?? width * 0.38, width * 0.18, width * 0.64);
  const markerDepth = clamp(wetAreaDepth ?? depth * 0.48, depth * 0.2, depth * 0.72);
  const markerX = clamp(wetAreaPosition?.x ?? width * 0.14, -width * 0.3, width * 0.3);
  const markerZ = clamp(wetAreaPosition?.z ?? depth * 0.04, -depth * 0.24, depth * 0.24);

  return (
    <group position={[markerX, thickness / 2 + 0.009, markerZ]}>
      <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
        <planeGeometry args={[markerWidth * 0.82, markerDepth * 0.82]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.04}
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
        position={[markerWidth * 0.18, 0.002, -markerDepth * 0.34]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 4]}
      >
        <planeGeometry args={[markerWidth * 0.48, 0.008]} />
        <meshBasicMaterial
          color="#2d2924"
          transparent
          opacity={0.075}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
