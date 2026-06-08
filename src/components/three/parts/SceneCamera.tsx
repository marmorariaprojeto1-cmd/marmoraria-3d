import { ContactShadows, OrbitControls, Preload } from '@react-three/drei';

export function SceneCamera() {
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
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        minDistance={1.55}
        maxDistance={5.2}
        maxPolarAngle={Math.PI / 2.12}
        target={[0, 0.28, 0]}
        rotateSpeed={0.72}
      />

      <Preload all />
    </>
  );
}
