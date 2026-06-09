import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  insetCenterFromLeft,
  insetCenterFromRight,
} from '../utils/geometryUtils';
import { StoneMaterial, StonePhotoSurface } from '../utils/stoneMaterials';

type SideBacksplashProps = {
  side: 'left' | 'right';
  width: number;
  depth: number;
  thickness: number;
  backsplashHeight: number;
  backsplashThickness: number;
  edgeRadius: number;
  stoneName: string;
  texture: THREE.Texture | null;
};

export function SideBacksplash({
  side,
  width,
  depth,
  thickness,
  backsplashHeight,
  backsplashThickness,
  edgeRadius,
  stoneName,
  texture,
}: SideBacksplashProps) {
  const isLeft = side === 'left';
  const sideCenterX = isLeft
    ? insetCenterFromLeft(width, backsplashThickness)
    : insetCenterFromRight(width, backsplashThickness);
  const sideOuterFaceX = isLeft ? -backsplashThickness / 2 : backsplashThickness / 2;

  return (
    <group
      position={[
        sideCenterX,
        thickness / 2 + backsplashHeight / 2 - 0.006,
        -backsplashThickness / 2,
      ]}
    >
      <RoundedBox
        args={[backsplashThickness, backsplashHeight, depth - backsplashThickness]}
        radius={Math.min(0.012, edgeRadius * 0.6)}
        smoothness={6}
      >
        <StoneMaterial
          stoneName={stoneName}
          texture={texture}
          colorOffset={-0.03}
          roughnessOffset={0.04}
        />
      </RoundedBox>
      <StonePhotoSurface
        texture={texture}
        width={depth - backsplashThickness}
        height={backsplashHeight * 0.98}
        repeatX={Math.max(0.8, depth)}
        repeatY={Math.max(0.35, backsplashHeight * 1.8)}
        position={[
          sideOuterFaceX,
          0,
          backsplashThickness / 2,
        ]}
        rotation={[0, isLeft ? -Math.PI / 2 : Math.PI / 2, 0]}
      />
    </group>
  );
}
