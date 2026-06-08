import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { JoinShadow } from './EdgeFinish';
import { StoneMaterial, StonePhotoSurface, StonePhysicalMaterial } from '../utils/stoneMaterials';
import type { EdgeFinishVisualType } from '../utils/geometryUtils';

type FrontApronProps = {
  width: number;
  depth: number;
  thickness: number;
  skirtHeight: number;
  skirtThickness: number;
  edgeRadius: number;
  stoneName: string;
  texture: THREE.Texture | null;
  visualEdgeFinish: EdgeFinishVisualType;
};

export function FrontApron({
  width,
  depth,
  thickness,
  skirtHeight,
  skirtThickness,
  edgeRadius,
  stoneName,
  texture,
  visualEdgeFinish,
}: FrontApronProps) {
  return (
    <>
      <mesh
        castShadow
        receiveShadow
        position={[
          0,
          -thickness / 2 - skirtHeight / 2 + 0.006,
          depth / 2 - skirtThickness / 2 + 0.002,
        ]}
      >
        <RoundedBox
          args={[width * 0.988, skirtHeight, skirtThickness]}
          radius={Math.min(0.014, edgeRadius * 0.72)}
          smoothness={6}
        >
          <StoneMaterial
            stoneName={stoneName}
            texture={texture}
            colorOffset={-0.045}
            roughnessOffset={visualEdgeFinish === 'doubleApron' ? 0.035 : 0.06}
          />
        </RoundedBox>
      </mesh>

      <StonePhotoSurface
        texture={texture}
        width={width * 0.96}
        height={skirtHeight * 0.9}
        repeatX={Math.max(1.4, width)}
        repeatY={Math.max(0.4, skirtHeight * 1.8)}
        position={[0, -thickness / 2 - skirtHeight / 2 + 0.006, depth / 2 + 0.001]}
      />

      <JoinShadow
        width={width * 0.95}
        position={[0, -thickness / 2 + 0.002, depth / 2 + 0.005]}
      />

      {visualEdgeFinish === 'doubleApron' && (
        <>
          <mesh
            castShadow
            receiveShadow
            position={[
              0,
              -thickness / 2 - skirtHeight * 0.5 + 0.006,
              depth / 2 + skirtThickness * 0.08,
            ]}
          >
            <boxGeometry args={[width * 0.972, 0.010, skirtThickness * 0.72]} />
            <StonePhysicalMaterial
              stoneName={stoneName}
              texture={texture}
              colorOffset={0.012}
              roughnessOffset={0.02}
            />
          </mesh>
          <JoinShadow
            width={width * 0.94}
            position={[
              0,
              -thickness / 2 - skirtHeight * 0.5 + 0.014,
              depth / 2 + 0.008,
            ]}
          />
          <JoinShadow
            width={width * 0.94}
            position={[
              0,
              -thickness / 2 - skirtHeight * 0.5 - 0.006,
              depth / 2 + 0.008,
            ]}
          />
        </>
      )}

      <mesh receiveShadow position={[0, -thickness / 2 - skirtHeight + 0.008, depth / 2 - 0.006]}>
        <RoundedBox args={[width * 0.982, 0.018, 0.026]} radius={0.007} smoothness={5}>
          <StoneMaterial
            stoneName={stoneName}
            texture={texture}
            colorOffset={visualEdgeFinish === 'doubleApron' ? -0.035 : -0.065}
            roughnessOffset={0.08}
          />
        </RoundedBox>
      </mesh>

      <StonePhotoSurface
        texture={texture}
        width={width * 0.95}
        height={0.018}
        repeatX={Math.max(1.4, width)}
        repeatY={0.25}
        position={[0, -thickness / 2 - skirtHeight + 0.008, depth / 2 + 0.008]}
      />
    </>
  );
}
