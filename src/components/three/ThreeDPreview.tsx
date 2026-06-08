import React, {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ContactShadows,
  Environment,
  OrbitControls,
  RoundedBox,
  Preload,
} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ThreeDPreviewProps } from '../../types/threePreview';
import {
  isSupportedStoneTexturePath,
  resolveLocalStoneTexture,
} from './stoneTextureMap';

// ---------------------------------------------------------------------------
// Error boundary
// ---------------------------------------------------------------------------

type PreviewErrorBoundaryProps = { children: ReactNode };
type PreviewErrorBoundaryState = { hasError: boolean };

class PreviewErrorBoundary extends Component<
  PreviewErrorBoundaryProps,
  PreviewErrorBoundaryState
> {
  state: PreviewErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <PreviewFallback />;
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// WebGL check
// ---------------------------------------------------------------------------

function hasWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')),
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Stone color / material helpers
// ---------------------------------------------------------------------------

interface StoneProfile {
  base: string;
  vein: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  reflectivity: number;
  sheen?: number;
  sheenColor?: string;
}

function resolveStoneProfile(stoneName: string): StoneProfile {
  const n = stoneName.toLowerCase();

  if (n.includes('preto') || n.includes('nero')) {
    return {
      base: '#1c1e1f',
      vein: '#4a5052',
      roughness: 0.28,
      metalness: 0.04,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      reflectivity: 0.72,
    };
  }
  if (n.includes('verde')) {
    return {
      base: '#243428',
      vein: '#3e5842',
      roughness: 0.32,
      metalness: 0.06,
      clearcoat: 0.78,
      clearcoatRoughness: 0.15,
      reflectivity: 0.62,
      sheen: 0.3,
      sheenColor: '#6a8a5c',
    };
  }
  if (n.includes('amarelo') || n.includes('ornamental')) {
    return {
      base: '#c5a05a',
      vein: '#7a5e32',
      roughness: 0.35,
      metalness: 0.02,
      clearcoat: 0.72,
      clearcoatRoughness: 0.18,
      reflectivity: 0.58,
    };
  }
  if (n.includes('cinza')) {
    return {
      base: '#8a8d87',
      vein: '#5a5e5a',
      roughness: 0.30,
      metalness: 0.03,
      clearcoat: 0.80,
      clearcoatRoughness: 0.14,
      reflectivity: 0.66,
    };
  }
  if (n.includes('travertino') || n.includes('crema')) {
    return {
      base: '#c4ae88',
      vein: '#8e7452',
      roughness: 0.40,
      metalness: 0.01,
      clearcoat: 0.60,
      clearcoatRoughness: 0.22,
      reflectivity: 0.48,
    };
  }
  // branco / calacatta / siena / fortaleza
  return {
    base: '#ddd6c8',
    vein: '#a89880',
    roughness: 0.26,
    metalness: 0.02,
    clearcoat: 0.88,
    clearcoatRoughness: 0.10,
    reflectivity: 0.78,
  };
}

// ---------------------------------------------------------------------------
// Texture loader hook
// ---------------------------------------------------------------------------

function resolveUsableTextureUrl(stoneName: string, stoneImageUrl?: string | null) {
  const url = stoneImageUrl ?? resolveLocalStoneTexture(stoneName);
  if (!url || !isSupportedStoneTexturePath(url)) return null;
  return url;
}

function configureTexture(t: THREE.Texture, repeatX = 2.2, repeatY = 1.3) {
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
}

function useSafeTexture(textureUrl: string | null) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!textureUrl) { setTexture(null); return; }
    let active = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (t) => { if (!active) { t.dispose(); return; } configureTexture(t); setTexture(t); },
      undefined,
      () => { if (active) setTexture(null); },
    );
    return () => { active = false; setTexture(null); };
  }, [textureUrl]);
  return texture;
}

// ---------------------------------------------------------------------------
// Procedural stone material
// ---------------------------------------------------------------------------

function StoneMaterial({
  stoneName,
  texture,
  colorOffset = 0,
  roughnessOffset = 0,
}: {
  stoneName: string;
  texture: THREE.Texture | null;
  colorOffset?: number;
  roughnessOffset?: number;
}) {
  const profile = useMemo(() => resolveStoneProfile(stoneName), [stoneName]);
  const baseColor = useMemo(() => {
    const c = new THREE.Color(profile.base);
    c.offsetHSL(0, 0, colorOffset);
    return c;
  }, [profile.base, colorOffset]);

  return (
    <meshPhysicalMaterial
      color={texture ? '#ffffff' : baseColor}
      map={texture ?? undefined}
      roughness={Math.max(0.1, profile.roughness + roughnessOffset)}
      metalness={profile.metalness}
      clearcoat={profile.clearcoat}
      clearcoatRoughness={profile.clearcoatRoughness}
      reflectivity={profile.reflectivity}
      envMapIntensity={1.4}
    />
  );
}

// ---------------------------------------------------------------------------
// Procedural veins (used only without texture)
// ---------------------------------------------------------------------------

function StoneVeins({
  width,
  depth,
  thickness,
  stoneName,
}: {
  width: number;
  depth: number;
  thickness: number;
  stoneName: string;
}) {
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

// ---------------------------------------------------------------------------
// Countertop edge profile (chanfered highlight strip)
// ---------------------------------------------------------------------------

function EdgeProfile({
  width,
  depth,
  thickness,
}: {
  width: number;
  depth: number;
  thickness: number;
}) {
  // Front chamfer highlight
  return (
    <group>
      {/* Top front edge bevel highlight */}
      <mesh position={[0, thickness / 2 - 0.003, depth / 2 - 0.004]}>
        <boxGeometry args={[width - 0.004, 0.005, 0.010]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.28}
          roughness={0.05}
          clearcoat={1}
          depthWrite={false}
        />
      </mesh>
      {/* Front face top catch-light */}
      <mesh position={[0, thickness / 2 - 0.012, depth / 2 + 0.002]}>
        <boxGeometry args={[width - 0.012, 0.018, 0.003]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.18}
          roughness={0.08}
          clearcoat={1}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Sink (cuba) — very detailed stainless steel undermount
// ---------------------------------------------------------------------------

function SinkMesh({ radius }: { radius: number }) {
  const stainless = (
    <meshPhysicalMaterial
      color="#c8cece"
      roughness={0.18}
      metalness={0.92}
      clearcoat={0.6}
      clearcoatRoughness={0.14}
      envMapIntensity={1.8}
    />
  );

  const innerR = radius * 0.92;
  const bowlDepth = radius * 0.58;

  return (
    <group scale={[1.38, 1, 0.84]}>
      {/* Dark hole cutout */}
      <mesh receiveShadow position={[0, -0.008, 0]}>
        <cylinderGeometry args={[innerR * 0.98, innerR * 0.92, 0.016, 128]} />
        <meshStandardMaterial color="#0a0c0d" roughness={0.96} />
      </mesh>

      {/* Stainless rim — outer */}
      <mesh castShadow receiveShadow position={[0, 0.010, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.018, 24, 128]} />
        {stainless}
      </mesh>

      {/* Stainless rim — inner bevel */}
      <mesh castShadow receiveShadow position={[0, 0.004, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[innerR, 0.009, 16, 128]} />
        {stainless}
      </mesh>

      {/* Bowl walls — tapered cylinder */}
      <mesh receiveShadow position={[0, -bowlDepth / 2 - 0.010, 0]}>
        <cylinderGeometry
          args={[innerR * 0.96, innerR * 0.74, bowlDepth, 128, 1, true]}
        />
        {stainless}
      </mesh>

      {/* Bowl floor */}
      <mesh receiveShadow position={[0, -bowlDepth - 0.010, 0]}>
        <cylinderGeometry args={[innerR * 0.74, innerR * 0.74, 0.006, 128]} />
        {stainless}
      </mesh>

      {/* Drain hole */}
      <mesh position={[0, -bowlDepth - 0.012, 0]}>
        <cylinderGeometry args={[radius * 0.12, radius * 0.10, 0.018, 48]} />
        <meshStandardMaterial color="#1a1f20" roughness={0.9} metalness={0.3} />
      </mesh>

      {/* Drain grid cross */}
      {[-1, 0, 1].map((i) => (
        <mesh key={`dg-${i}`} position={[i * radius * 0.06, -bowlDepth - 0.003, 0]}>
          <boxGeometry args={[0.004, 0.006, radius * 0.22]} />
          <meshStandardMaterial color="#161b1d" roughness={0.7} metalness={0.5} />
        </mesh>
      ))}
      {[-1, 0, 1].map((i) => (
        <mesh key={`dgr-${i}`} position={[0, -bowlDepth - 0.003, i * radius * 0.06]}>
          <boxGeometry args={[radius * 0.22, 0.006, 0.004]} />
          <meshStandardMaterial color="#161b1d" roughness={0.7} metalness={0.5} />
        </mesh>
      ))}

      {/* Water reflection glint */}
      <mesh position={[-radius * 0.24, -bowlDepth + 0.001, -radius * 0.28]} rotation={[-Math.PI / 2, 0, -0.22]}>
        <planeGeometry args={[radius * 0.72, radius * 0.08]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.38} depthWrite={false} />
      </mesh>
      <mesh position={[radius * 0.28, -bowlDepth + 0.001, radius * 0.24]} rotation={[-Math.PI / 2, 0, 0.18]}>
        <planeGeometry args={[radius * 0.44, radius * 0.05]} />
        <meshBasicMaterial color="#e8f0ef" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Faucet (torneira) — simple but elegant
// ---------------------------------------------------------------------------

function Faucet({ sinkRadius }: { sinkRadius: number }) {
  const chrome = (
    <meshPhysicalMaterial
      color="#d8dddd"
      roughness={0.08}
      metalness={0.96}
      clearcoat={0.9}
      clearcoatRoughness={0.06}
      envMapIntensity={2.0}
    />
  );

  const r = sinkRadius;
  return (
    <group position={[0, 0.01, -r * 0.78]}>
      {/* Base */}
      <mesh castShadow position={[0, 0.018, 0]}>
        <cylinderGeometry args={[0.026, 0.032, 0.036, 32]} />
        {chrome}
      </mesh>
      {/* Neck riser */}
      <mesh castShadow position={[0, 0.072, 0]}>
        <cylinderGeometry args={[0.014, 0.016, 0.072, 24]} />
        {chrome}
      </mesh>
      {/* Spout arm horizontal */}
      <mesh castShadow position={[0, 0.108, r * 0.38]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.014, r * 0.76, 24]} />
        {chrome}
      </mesh>
      {/* Spout tip */}
      <mesh castShadow position={[0, 0.108, r * 0.76]}>
        <cylinderGeometry args={[0.011, 0.014, 0.028, 24]} />
        {chrome}
      </mesh>
      {/* Handle left */}
      <mesh castShadow position={[-0.048, 0.09, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.010, 0.052, 16]} />
        {chrome}
      </mesh>
      {/* Handle right */}
      <mesh castShadow position={[0.048, 0.09, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.010, 0.052, 16]} />
        {chrome}
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Floor tile (subtle grid / porcelain)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Wall behind countertop
// ---------------------------------------------------------------------------

function BackWall({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
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

// ---------------------------------------------------------------------------
// Auto-rotate helper (subtle, stops on user interaction)
// ---------------------------------------------------------------------------

function AutoRotate({ targetRef }: { targetRef: React.RefObject<THREE.Group | null> }) {
  const t = useRef(0);
  useFrame((_, delta) => {
    if (!targetRef.current) return;
    t.current += delta * 0.12;
    targetRef.current.rotation.y = Math.sin(t.current) * 0.08 - 0.12;
  });
  return null;
}

// ---------------------------------------------------------------------------
// Main scene
// ---------------------------------------------------------------------------

function CountertopScene({
  width,
  depth,
  thickness,
  stoneName,
  stoneImageUrl,
  sinkEnabled,
}: ThreeDPreviewProps) {
  const resolvedTextureUrl = resolveUsableTextureUrl(stoneName, stoneImageUrl);
  const texture = useSafeTexture(resolvedTextureUrl);
  const groupRef = useRef<THREE.Group>(null);

  const model = useMemo(() => {
    const w = Math.min(3.6, Math.max(0.8, width || 0.8));
    const d = Math.min(1.75, Math.max(0.42, depth || 0.42));
    const t = Math.min(0.26, Math.max(0.09, thickness / 18));
    const backsplashH = Math.min(0.46, Math.max(0.26, d * 0.30));
    const backsplashT = Math.min(0.08, d * 0.11);
    const skirtH = Math.min(0.38, Math.max(0.18, t * 1.8));
    const skirtT = Math.min(0.10, d * 0.14);
    const sinkR = Math.min(w * 0.155, d * 0.34, 0.33);

    return { w, d, t, backsplashH, backsplashT, skirtH, skirtT, sinkR };
  }, [width, depth, thickness]);

  // Group Y offset so piece sits on floor
  const groupY = model.t / 2 + model.skirtH + 0.018;

  return (
    <>
      {/* Background */}
      <color attach="background" args={['#e8e3db']} />
      <fog attach="fog" args={['#e8e3db', 5.5, 9.0]} />

      {/* Environment for PBR reflections — studio preset gives polished look */}
      <Environment preset="studio" environmentIntensity={0.55} />

      {/* Key light — warm, from upper right front */}
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

      {/* Fill light — cool, from upper left */}
      <directionalLight
        position={[-3.8, 3.2, -2.2]}
        intensity={0.55}
        color="#d4e8f2"
      />

      {/* Bounce light from below — simulates floor bounce */}
      <pointLight
        position={[0, -0.3, 1.2]}
        intensity={0.28}
        color="#f5ece0"
        distance={3.5}
      />

      {/* Back rim light — adds depth separation */}
      <pointLight
        position={[0, 1.8, -1.6]}
        intensity={0.38}
        color="#e8f0ff"
        distance={4}
      />

      {/* Ambient hemisphere — sky / ground */}
      <hemisphereLight args={['#c8d8e8', '#b8a898', 0.55]} />

      {/* Soft fill spot for frontal clarity */}
      <spotLight
        position={[0, 3.2, 2.6]}
        intensity={0.72}
        angle={0.55}
        penumbra={0.7}
        color="#fff4e8"
        castShadow={false}
      />

      {/* Scene geometry */}
      <BackWall width={model.w + 0.8} height={0.8 + model.backsplashH + groupY} />
      <FloorTile />

      <group ref={groupRef} position={[0, groupY, 0]}>
        <AutoRotate targetRef={groupRef} />

        {/* ── Countertop slab ── */}
        <mesh castShadow receiveShadow>
          <RoundedBox
            args={[model.w, model.t, model.d]}
            radius={0.028}
            smoothness={6}
          >
            <StoneMaterial stoneName={stoneName} texture={texture} />
          </RoundedBox>
        </mesh>

        {/* Edge highlight catch-light */}
        <EdgeProfile width={model.w} depth={model.d} thickness={model.t} />

        {/* ── Backsplash ── */}
        <mesh
          castShadow
          receiveShadow
          position={[
            0,
            model.t / 2 + model.backsplashH / 2 - 0.006,
            -model.d / 2 + model.backsplashT / 2,
          ]}
        >
          <RoundedBox
            args={[model.w * 0.982, model.backsplashH, model.backsplashT]}
            radius={0.014}
            smoothness={4}
          >
            <StoneMaterial
              stoneName={stoneName}
              texture={texture}
              colorOffset={-0.025}
              roughnessOffset={0.04}
            />
          </RoundedBox>
        </mesh>

        {/* Backsplash / countertop junction caulk line */}
        <mesh
          position={[0, model.t / 2 + 0.002, -model.d / 2 + model.backsplashT + 0.002]}
        >
          <boxGeometry args={[model.w * 0.98, 0.004, 0.004]} />
          <meshStandardMaterial color="#d8d4cc" roughness={0.88} />
        </mesh>

        {/* ── Front skirt (fascia) ── */}
        <mesh
          castShadow
          receiveShadow
          position={[
            0,
            -model.t / 2 - model.skirtH / 2 + 0.010,
            model.d / 2 - model.skirtT / 2,
          ]}
        >
          <RoundedBox
            args={[model.w * 0.988, model.skirtH, model.skirtT]}
            radius={0.016}
            smoothness={4}
          >
            <StoneMaterial
              stoneName={stoneName}
              texture={texture}
              colorOffset={-0.045}
              roughnessOffset={0.06}
            />
          </RoundedBox>
        </mesh>

        {/* ── Rodabanca (trim strip at base of skirt) ── */}
        <mesh
          receiveShadow
          position={[
            0,
            -model.t / 2 - model.skirtH + 0.006,
            model.d / 2 - 0.010,
          ]}
        >
          <RoundedBox args={[model.w * 0.986, 0.022, 0.022]} radius={0.008} smoothness={4}>
            <meshPhysicalMaterial
              color="#5e5c56"
              roughness={0.52}
              metalness={0.08}
              clearcoat={0.22}
            />
          </RoundedBox>
        </mesh>

        {/* ── Procedural veins (no texture) ── */}
        {!texture && (
          <StoneVeins
            width={model.w}
            depth={model.d}
            thickness={model.t}
            stoneName={stoneName}
          />
        )}

        {/* ── Sink ── */}
        {sinkEnabled && (
          <group
            position={[
              model.w * 0.18,
              model.t / 2 + 0.004,
              model.d * 0.06,
            ]}
          >
            <SinkMesh radius={model.sinkR} />
            <Faucet sinkRadius={model.sinkR} />
          </group>
        )}
      </group>

      {/* Soft contact shadow on floor */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.55}
        scale={5.5}
        blur={2.6}
        far={2.2}
        color="#4a3e30"
      />

      {/* Orbit controls */}
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

// ---------------------------------------------------------------------------
// Fallback UI
// ---------------------------------------------------------------------------

function PreviewFallback() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-stoneLine bg-stone-50 p-6 text-center text-stone-700">
      <div>
        <p className="font-semibold text-graphite">Preview 3D indisponível</p>
        <p className="mt-2 text-sm">
          Este dispositivo ou navegador não conseguiu carregar WebGL. O
          orçamento e as seleções continuam funcionando normalmente.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export function ThreeDPreview(props: ThreeDPreviewProps) {
  const webGLSupported = useMemo(() => hasWebGLSupport(), []);

  if (!webGLSupported) return <PreviewFallback />;

  return (
    <div className="overflow-hidden rounded-xl border border-stoneLine bg-stone-100 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stoneLine bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-moss">
            Preview 3D
          </p>
          <p className="text-sm font-semibold text-graphite">{props.stoneName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-stone-500">
            {props.width.toFixed(2)} m × {props.depth.toFixed(2)} m
          </p>
          <p className="text-xs text-stone-400">
            esp. {props.thickness} mm
          </p>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative h-[380px] w-full sm:h-[460px] lg:h-[500px]">
        <PreviewErrorBoundary>
          <Suspense fallback={<PreviewFallback />}>
            <Canvas
              camera={{ position: [2.45, 1.55, 2.15], fov: 31 }}
              shadows={{ type: THREE.PCFSoftShadowMap }}
              dpr={[1, 2]}
              gl={{
                antialias: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.05,
              }}
            >
              <CountertopScene {...props} />
            </Canvas>
          </Suspense>
        </PreviewErrorBoundary>

        {/* Drag hint */}
        <p className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm">
          arraste para girar
        </p>
      </div>
    </div>
  );
}
