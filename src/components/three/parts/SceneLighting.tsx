import { useRef } from 'react';
import * as THREE from 'three';

function FloorTile() {
  const floorRef = useRef<THREE.Mesh>(null);

  return (
    <mesh
      ref={floorRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.001, 0]}
      receiveShadow
    >
      <planeGeometry args={[7, 5]} />
      <meshPhysicalMaterial
        color="#e4e0da"
        roughness={0.30}
        metalness={0.01}
        clearcoat={0.35}
        clearcoatRoughness={0.28}
        reflectivity={0.40}
        envMapIntensity={0.55}
      />
    </mesh>
  );
}

function BackWall({ width, height }: { width: number; height: number }) {
  return (
    <mesh position={[0, height / 2 - 0.22, -1.12]} receiveShadow>
      <planeGeometry args={[width + 0.8, height + 0.6]} />
      <meshPhysicalMaterial
        color="#f0ebe3"
        roughness={0.82}
        metalness={0}
        clearcoat={0.04}
        envMapIntensity={0.2}
      />
    </mesh>
  );
}

export function SceneLighting({
  wallWidth,
  wallHeight,
}: {
  wallWidth: number;
  wallHeight: number;
}) {
  return (
    <>
      <color attach="background" args={['#e8e3db']} />
      <fog attach="fog" args={['#e8e3db', 5.5, 9.0]} />

      <directionalLight
        castShadow
        position={[3.5, 5.2, 3.8]}
        intensity={2.4}
        color="#fff8f0"
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={18}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />

      <directionalLight
        position={[-3.8, 3.2, -2.2]}
        intensity={0.55}
        color="#d4e8f2"
      />

      <pointLight
        position={[0, -0.3, 1.2]}
        intensity={0.28}
        color="#f5ece0"
        distance={3.5}
      />

      <pointLight
        position={[0, 1.8, -1.6]}
        intensity={0.38}
        color="#e8f0ff"
        distance={4}
      />

      <hemisphereLight args={['#c8d8e8', '#b8a898', 0.55]} />

      <spotLight
        position={[0, 3.2, 2.6]}
        intensity={0.72}
        angle={0.55}
        penumbra={0.7}
        color="#fff4e8"
        castShadow={false}
      />

      <BackWall width={wallWidth} height={wallHeight} />
      <FloorTile />
    </>
  );
}
