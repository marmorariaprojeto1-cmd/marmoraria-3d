import { useRef } from 'react';
import { ContactShadows, OrbitControls, Preload } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export const DEFAULT_CAMERA_POSITION = new THREE.Vector3(-1.225, 0.951, 1.654);
export const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0.12, 0);

export function SceneCamera({
  resetKey,
}: {
  resetKey?: string | number | null;
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();
  const lastResetKeyRef = useRef<string | number | null | undefined>(undefined);

  useFrame(() => {
    if (lastResetKeyRef.current !== resetKey) {
      lastResetKeyRef.current = resetKey;
      camera.position.copy(DEFAULT_CAMERA_POSITION);
      controlsRef.current?.target.copy(DEFAULT_CAMERA_TARGET);
      controlsRef.current?.update();
    }
  });

  return (
    <>
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.55}
        scale={5.5}
        blur={2.6}
        far={2.2}
        color="#4a3e30"
      />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        minDistance={1.55}
        maxDistance={5.2}
        maxPolarAngle={Math.PI / 2.12}
        target={DEFAULT_CAMERA_TARGET.toArray()}
        rotateSpeed={0.72}
      />

      <Preload all />
    </>
  );
}
