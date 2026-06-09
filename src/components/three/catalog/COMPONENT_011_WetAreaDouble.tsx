import { clamp } from '../utils/geometryUtils';
import type { ThreeDRegisteredComponentProps } from './types';

export const COMPONENT_011_ID = 'COMPONENT_011';
export const COMPONENT_011_NAME = 'Área molhada dupla';

export function Component011WetAreaDouble({
  width,
  depth,
  thickness,
  wetAreaWidth,
  wetAreaDepth,
  wetAreaPosition,
}: ThreeDRegisteredComponentProps) {
  const markerWidth = clamp(wetAreaWidth ?? width * 0.42, width * 0.2, width * 0.68);
  const markerDepth = clamp(wetAreaDepth ?? depth * 0.5, depth * 0.22, depth * 0.74);
  const markerX = clamp(wetAreaPosition?.x ?? width * 0.12, -width * 0.3, width * 0.3);
  const markerZ = clamp(wetAreaPosition?.z ?? depth * 0.04, -depth * 0.24, depth * 0.24);
  const channelOffset = markerWidth * 0.22;

  return (
    <group position={[markerX, thickness / 2 + 0.009, markerZ]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[markerWidth, markerDepth]} />
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

      {[-channelOffset, channelOffset].map((channelX) => (
        <mesh
          key={channelX}
          position={[channelX, 0.002, -markerDepth / 2]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[markerWidth * 0.34, 0.008]} />
          <meshBasicMaterial
            color="#2d2924"
            transparent
            opacity={0.075}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
