import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { JoinShadow } from './EdgeFinish';
import { StoneMaterial, StonePhotoSurface } from '../utils/stoneMaterials';

type BacksplashProps = {
  width: number;
  depth: number;
  thickness: number;
  backsplashHeight: number;
  backsplashThickness: number;
  edgeRadius: number;
  stoneName: string;
  texture: THREE.Texture | null;
};

export function Backsplash({
  width,
  depth,
  thickness,
  backsplashHeight,
  backsplashThickness,
  edgeRadius,
  stoneName,
  texture,
}: BacksplashProps) {
  return (
    <>
      <mesh
        castShadow
        receiveShadow
        position={[
          0,
          thickness / 2 + backsplashHeight / 2 - 0.006,
          -depth / 2 + backsplashThickness / 2 - 0.002,
        ]}
      >
        <RoundedBox
          args={[width * 0.982, backsplashHeight, backsplashThickness]}
          radius={Math.min(0.012, edgeRadius * 0.65)}
          smoothness={6}
        >
          <StoneMaterial
            stoneName={stoneName}
            texture={texture}
            colorOffset={-0.025}
            roughnessOffset={0.04}
          />
        </RoundedBox>
      </mesh>

      <StonePhotoSurface
        texture={texture}
        width={width * 0.95}
        height={backsplashHeight * 0.88}
        repeatX={Math.max(1.4, width)}
        repeatY={Math.max(0.35, backsplashHeight * 1.8)}
        position={[
          0,
          thickness / 2 + backsplashHeight / 2 - 0.006,
          -depth / 2 + backsplashThickness + 0.001,
        ]}
      />

      <JoinShadow
        width={width * 0.96}
        position={[
          0,
          thickness / 2 + 0.004,
          -depth / 2 + backsplashThickness + 0.002,
        ]}
      />
    </>
  );
}
