import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { JoinShadow } from './EdgeFinish';
import { insetCenterFromFront } from '../utils/geometryUtils';
import {
  StoneMaterial,
  StonePhotoSurface,
  StonePhysicalMaterial,
} from '../utils/stoneMaterials';
import type { EdgeFinishVisualType } from '../utils/geometryUtils';

type FrontApronProps = {
  placement?: 'front' | 'back';
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
  placement = 'front',
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
  const isFront = placement === 'front';
  const apronFaceZ = isFront ? depth / 2 : -depth / 2;
  const skirtCenterZ = isFront
    ? insetCenterFromFront(depth, skirtThickness)
    : -insetCenterFromFront(depth, skirtThickness);
  const detailCenterZ = isFront
    ? insetCenterFromFront(depth, 0.006)
    : -insetCenterFromFront(depth, 0.006);
  const doubleApronDetailDepth = skirtThickness * 0.72;
  const doubleApronDetailCenterZ = insetCenterFromFront(
    depth,
    doubleApronDetailDepth,
  );
  const resolvedDoubleApronDetailCenterZ = isFront
    ? doubleApronDetailCenterZ
    : -doubleApronDetailCenterZ;

  return (
    <>
      <mesh
        castShadow
        receiveShadow
        position={[
          0,
          -thickness / 2 - skirtHeight / 2 + 0.006,
          skirtCenterZ,
        ]}
      >
        <RoundedBox
          args={[width, skirtHeight, skirtThickness]}
          radius={Math.min(0.014, edgeRadius * 0.72)}
          smoothness={8}
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
        width={width * 0.995}
        height={skirtHeight * 0.98}
        repeatX={Math.max(1.4, width)}
        repeatY={Math.max(0.4, skirtHeight * 1.8)}
        position={[0, -thickness / 2 - skirtHeight / 2 + 0.006, apronFaceZ]}
      />

      <JoinShadow
        width={width * 0.95}
        position={[0, -thickness / 2 + 0.002, detailCenterZ]}
      />

      {visualEdgeFinish === 'doubleApron' && (
        <>
          <mesh
            castShadow
            receiveShadow
            position={[
              0,
              -thickness / 2 - skirtHeight * 0.5 + 0.006,
              resolvedDoubleApronDetailCenterZ,
            ]}
          >
            <boxGeometry args={[width * 0.972, 0.010, doubleApronDetailDepth]} />
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
              detailCenterZ,
            ]}
          />
          <JoinShadow
            width={width * 0.94}
            position={[
              0,
              -thickness / 2 - skirtHeight * 0.5 - 0.006,
              detailCenterZ,
            ]}
          />
        </>
      )}
    </>
  );
}
