import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  resolveStoneProfile,
  StoneMaterial,
  StonePhotoSurface,
} from '../utils/stoneMaterials';

type StoneTopProps = {
  width: number;
  depth: number;
  thickness: number;
  edgeRadius: number;
  stoneName: string;
  texture: THREE.Texture | null;
};

type StoneVeinsProps = {
  width: number;
  depth: number;
  thickness: number;
  stoneName: string;
};

function StoneVeins({ width, depth, thickness, stoneName }: StoneVeinsProps) {
  const profile = useMemo(() => resolveStoneProfile(stoneName), [stoneName]);

  const veins = useMemo(() => {
    const seed = stoneName.length;
    return Array.from({ length: 11 }, (_, i) => {
      const t = (i + 1) / 12;
      const offset = Math.sin((i + seed) * 1.37) * 0.14;
      return {
        x: width * (t - 0.5),
        z: depth * offset,
        len: width * (0.38 + (i % 4) * 0.11),
        opacity: 0.08 + (i % 3) * 0.055,
        rotation: -0.28 + i * 0.055,
        width: i % 3 === 0 ? 0.022 : 0.009,
      };
    });
  }, [depth, width, stoneName]);

  return (
    <group position={[0, thickness / 2 + 0.003, 0]}>
      {veins.map((v) => (
        <mesh
          key={`${v.x}-${v.len}`}
          position={[v.x, 0, v.z]}
          rotation={[-Math.PI / 2, 0, v.rotation]}
        >
          <planeGeometry args={[v.len, v.width]} />
          <meshBasicMaterial
            color={profile.vein}
            transparent
            opacity={v.opacity}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function StoneTop({
  width,
  depth,
  thickness,
  edgeRadius,
  stoneName,
  texture,
}: StoneTopProps) {
  return (
    <>
      <mesh castShadow receiveShadow>
        <RoundedBox args={[width, thickness, depth]} radius={edgeRadius} smoothness={8}>
          <StoneMaterial stoneName={stoneName} texture={texture} />
        </RoundedBox>
      </mesh>

      <StonePhotoSurface
        texture={texture}
        width={width}
        height={depth}
        repeatX={Math.max(1.4, width * 1.1)}
        repeatY={Math.max(0.9, depth * 1.25)}
        position={[0, thickness / 2 + 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      {!texture && (
        <StoneVeins
          width={width}
          depth={depth}
          thickness={thickness}
          stoneName={stoneName}
        />
      )}
    </>
  );
}
