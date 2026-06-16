import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { JoinShadow } from './EdgeFinish';
import { insetCenterFromBack } from '../utils/geometryUtils';
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
  suppressJoinShadow?: boolean;
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
  suppressJoinShadow = false,
}: BacksplashProps) {
  const backsplashCenterZ = insetCenterFromBack(depth, backsplashThickness);
  const backsplashInnerFaceZ = -depth / 2 + backsplashThickness;

  return (
    <>
      <mesh
        castShadow
        receiveShadow
        position={[
          0,
          thickness / 2 + backsplashHeight / 2 - 0.006,
          backsplashCenterZ,
        ]}
      >
        <RoundedBox
          args={[width, backsplashHeight, backsplashThickness]}
          radius={Math.min(0.012, edgeRadius * 0.65)}
          smoothness={8}
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
        width={width}
        height={backsplashHeight * 0.98}
        repeatX={Math.max(1.4, width)}
        repeatY={Math.max(0.35, backsplashHeight * 1.8)}
        position={[
          0,
          thickness / 2 + backsplashHeight / 2 - 0.006,
          backsplashInnerFaceZ,
        ]}
      />

      {!suppressJoinShadow && (
        <JoinShadow
          width={width}
          position={[
            0,
            thickness / 2 + 0.004,
            backsplashInnerFaceZ + 0.001,
          ]}
        />
      )}
    </>
  );
}
