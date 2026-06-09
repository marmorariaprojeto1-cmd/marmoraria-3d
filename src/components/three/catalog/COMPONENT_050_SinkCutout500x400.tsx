import { RoundedBox } from '@react-three/drei';
import { clamp } from '../utils/geometryUtils';
import { StonePhysicalMaterial } from '../utils/stoneMaterials';
import type { ThreeDRegisteredComponentProps } from './types';

export const COMPONENT_050_ID = 'COMPONENT_050';
export const COMPONENT_050_NAME = 'Recorte Cuba 500x400';

const CUTOUT_WIDTH = 0.5;
const CUTOUT_DEPTH = 0.4;

export function Component050SinkCutout500x400({
  width,
  depth,
  thickness,
  stoneName,
  texture,
  cutoutPosition,
}: ThreeDRegisteredComponentProps) {
  const cutoutWidth = Math.min(CUTOUT_WIDTH, width * 0.72);
  const cutoutDepth = Math.min(CUTOUT_DEPTH, depth * 0.74);
  const cutoutX = clamp(cutoutPosition?.x ?? 0, -width * 0.28, width * 0.28);
  const cutoutZ = clamp(cutoutPosition?.z ?? 0, -depth * 0.2, depth * 0.2);
  const wallThickness = 0.014;
  const wallDrop = Math.max(0.035, thickness * 0.42);

  return (
    <group position={[cutoutX, thickness / 2 + 0.006, cutoutZ]}>
      <RoundedBox
        args={[cutoutWidth, 0.008, cutoutDepth]}
        radius={0.022}
        smoothness={8}
      >
        <meshBasicMaterial color="#10100f" />
      </RoundedBox>

      {[-1, 1].map((side) => (
        <mesh
          key={`long-${side}`}
          position={[0, -wallDrop / 2, side * (cutoutDepth / 2 - wallThickness / 2)]}
        >
          <boxGeometry args={[cutoutWidth, wallDrop, wallThickness]} />
          <StonePhysicalMaterial
            stoneName={stoneName}
            texture={texture}
            colorOffset={-0.08}
            roughnessOffset={0.08}
          />
        </mesh>
      ))}

      {[-1, 1].map((side) => (
        <mesh
          key={`short-${side}`}
          position={[side * (cutoutWidth / 2 - wallThickness / 2), -wallDrop / 2, 0]}
        >
          <boxGeometry args={[wallThickness, wallDrop, cutoutDepth]} />
          <StonePhysicalMaterial
            stoneName={stoneName}
            texture={texture}
            colorOffset={-0.08}
            roughnessOffset={0.08}
          />
        </mesh>
      ))}
    </group>
  );
}
