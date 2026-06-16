import * as THREE from 'three';
import {
  insetCenterFromLeft,
  insetCenterFromRight,
} from '../utils/geometryUtils';
import { StoneMaterial, StonePhotoSurface } from '../utils/stoneMaterials';

type SideSkirtProps = {
  side: 'left' | 'right';
  width: number;
  depth: number;
  thickness: number;
  skirtHeight: number;
  skirtThickness: number;
  frontApronThickness?: number;
  rearApronThickness?: number;
  edgeRadius: number;
  stoneName: string;
  texture: THREE.Texture | null;
};

/**
 * Saia lateral — placa vertical presa na lateral do tampo,
 * crescendo para BAIXO (inverso do frontão lateral).
 *
 * Espelha a lógica do SideBacksplash, mas com Y negativo.
 */
export function SideSkirt({
  side,
  width,
  depth,
  thickness,
  skirtHeight,
  skirtThickness,
  frontApronThickness = 0,
  rearApronThickness = 0,
  stoneName,
  texture,
}: SideSkirtProps) {
  const isLeft = side === 'left';
  const sideCenterX = isLeft
    ? insetCenterFromLeft(width, skirtThickness)
    : insetCenterFromRight(width, skirtThickness);
  const sideOuterFaceX = isLeft ? -skirtThickness / 2 : skirtThickness / 2;
  const sideStartZ = -depth / 2 + rearApronThickness;
  const sideEndZ = depth / 2 - frontApronThickness;
  const sideSkirtDepth = Math.max(0.001, sideEndZ - sideStartZ);
  const sideSkirtCenterZ = (sideStartZ + sideEndZ) / 2;

  return (
    <group
      position={[
        sideCenterX,
        -thickness / 2 - skirtHeight / 2 + 0.006,
        sideSkirtCenterZ,
      ]}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[skirtThickness, skirtHeight, sideSkirtDepth]} />
        <StoneMaterial
          stoneName={stoneName}
          texture={texture}
          colorOffset={-0.045}
          roughnessOffset={0.055}
        />
      </mesh>
      <StonePhotoSurface
        texture={texture}
        width={sideSkirtDepth}
        height={skirtHeight * 0.965}
        repeatX={Math.max(0.8, depth)}
        repeatY={Math.max(0.4, skirtHeight * 1.8)}
        position={[
          sideOuterFaceX,
          0,
          skirtThickness / 2,
        ]}
        rotation={[0, isLeft ? -Math.PI / 2 : Math.PI / 2, 0]}
      />
    </group>
  );
}
