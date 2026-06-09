import { useEffect, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  resolveStoneProfile,
  StoneMaterial,
  StonePhotoSurface,
  StonePhysicalMaterial,
} from '../utils/stoneMaterials';
import type { ThreeDCutoutPosition } from '../../../types/threePreview';

type StoneTopProps = {
  width: number;
  depth: number;
  thickness: number;
  edgeRadius: number;
  stoneName: string;
  texture: THREE.Texture | null;
  cutoutWidth?: number;
  cutoutDepth?: number;
  cutoutPosition?: ThreeDCutoutPosition;
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

function createStoneTopCutoutGeometry({
  width,
  depth,
  thickness,
  edgeRadius,
  cutoutWidth,
  cutoutDepth,
  cutoutPosition,
}: {
  width: number;
  depth: number;
  thickness: number;
  edgeRadius: number;
  cutoutWidth: number;
  cutoutDepth: number;
  cutoutPosition?: ThreeDCutoutPosition;
}) {
  const margin = Math.max(edgeRadius * 2.2, 0.045);
  const safeCutoutWidth = Math.min(cutoutWidth, Math.max(0.08, width - margin * 2));
  const safeCutoutDepth = Math.min(cutoutDepth, Math.max(0.08, depth - margin * 2));
  const maxX = Math.max(0, width / 2 - safeCutoutWidth / 2 - margin);
  const maxZ = Math.max(0, depth / 2 - safeCutoutDepth / 2 - margin);
  const cutoutX = THREE.MathUtils.clamp(cutoutPosition?.x ?? 0, -maxX, maxX);
  const cutoutZ = THREE.MathUtils.clamp(cutoutPosition?.z ?? 0, -maxZ, maxZ);
  const bevelSize = Math.min(0.002, edgeRadius * 0.35, thickness * 0.06);
  const uvScale = 0.72;
  const uvGenerator = {
    generateTopUV(
      _geometry: THREE.BufferGeometry,
      vertices: number[],
      indexA: number,
      indexB: number,
      indexC: number,
    ) {
      const ax = vertices[indexA * 3];
      const ay = vertices[indexA * 3 + 1];
      const bx = vertices[indexB * 3];
      const by = vertices[indexB * 3 + 1];
      const cx = vertices[indexC * 3];
      const cy = vertices[indexC * 3 + 1];

      return [
        new THREE.Vector2((ax / width + 0.5) * uvScale, (ay / depth + 0.5) * uvScale),
        new THREE.Vector2((bx / width + 0.5) * uvScale, (by / depth + 0.5) * uvScale),
        new THREE.Vector2((cx / width + 0.5) * uvScale, (cy / depth + 0.5) * uvScale),
      ];
    },
    generateSideWallUV(
      _geometry: THREE.BufferGeometry,
      vertices: number[],
      indexA: number,
      indexB: number,
      indexC: number,
      indexD: number,
    ) {
      const ax = vertices[indexA * 3];
      const ay = vertices[indexA * 3 + 1];
      const bx = vertices[indexB * 3];
      const by = vertices[indexB * 3 + 1];
      const cx = vertices[indexC * 3];
      const cz = vertices[indexC * 3 + 2];
      const dx = vertices[indexD * 3];
      const dz = vertices[indexD * 3 + 2];
      const wallLength = Math.hypot(bx - ax, by - ay);

      return [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(wallLength * 1.5, 0),
        new THREE.Vector2(wallLength * 1.5 + Math.abs(cx - dx) * 0.12, Math.abs(cz) / thickness),
        new THREE.Vector2(0, Math.abs(dz) / thickness),
      ];
    },
  };
  const shape = new THREE.Shape();

  shape.moveTo(-width / 2, -depth / 2);
  shape.lineTo(width / 2, -depth / 2);
  shape.lineTo(width / 2, depth / 2);
  shape.lineTo(-width / 2, depth / 2);
  shape.lineTo(-width / 2, -depth / 2);

  const hole = new THREE.Path();
  const holeCenterY = -cutoutZ;
  hole.moveTo(cutoutX - safeCutoutWidth / 2, holeCenterY - safeCutoutDepth / 2);
  hole.lineTo(cutoutX - safeCutoutWidth / 2, holeCenterY + safeCutoutDepth / 2);
  hole.lineTo(cutoutX + safeCutoutWidth / 2, holeCenterY + safeCutoutDepth / 2);
  hole.lineTo(cutoutX + safeCutoutWidth / 2, holeCenterY - safeCutoutDepth / 2);
  hole.lineTo(cutoutX - safeCutoutWidth / 2, holeCenterY - safeCutoutDepth / 2);
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSize,
    bevelThickness: bevelSize * 0.5,
    bevelSegments: 2,
    curveSegments: 1,
    UVGenerator: uvGenerator,
  });

  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -thickness / 2, 0);
  geometry.computeVertexNormals();
  return geometry;
}

function StoneTopWithCutout({
  width,
  depth,
  thickness,
  edgeRadius,
  stoneName,
  texture,
  cutoutWidth,
  cutoutDepth,
  cutoutPosition,
}: Required<Pick<StoneTopProps, 'cutoutWidth' | 'cutoutDepth'>> &
  Omit<StoneTopProps, 'cutoutWidth' | 'cutoutDepth'>) {
  const geometry = useMemo(
    () =>
      createStoneTopCutoutGeometry({
        width,
        depth,
        thickness,
        edgeRadius,
        cutoutWidth,
        cutoutDepth,
        cutoutPosition,
      }),
    [cutoutDepth, cutoutPosition, cutoutWidth, depth, edgeRadius, thickness, width],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <>
      <mesh castShadow receiveShadow>
        <primitive object={geometry} attach="geometry" />
        <StonePhysicalMaterial
          stoneName={stoneName}
          texture={texture}
          colorOffset={-0.045}
          roughnessOffset={0.06}
        />
      </mesh>

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

export function StoneTop({
  width,
  depth,
  thickness,
  edgeRadius,
  stoneName,
  texture,
  cutoutWidth,
  cutoutDepth,
  cutoutPosition,
}: StoneTopProps) {
  if (cutoutWidth && cutoutDepth) {
    return (
      <StoneTopWithCutout
        width={width}
        depth={depth}
        thickness={thickness}
        edgeRadius={edgeRadius}
        stoneName={stoneName}
        texture={texture}
        cutoutWidth={cutoutWidth}
        cutoutDepth={cutoutDepth}
        cutoutPosition={cutoutPosition}
      />
    );
  }

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
