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
  if (stoneImageUrl && isSupportedStoneTexturePath(stoneImageUrl)) {
    return stoneImageUrl;
  }

  const localTextureUrl = resolveLocalStoneTexture(stoneName);
  if (localTextureUrl && isSupportedStoneTexturePath(localTextureUrl)) {
    return localTextureUrl;
  }

  return null;
}

function isPowerOfTwo(value: number) {
  return value > 0 && (value & (value - 1)) === 0;
}

function createPowerOfTwoTexture(source: THREE.Texture) {
  const image = source.image as HTMLImageElement | ImageBitmap | undefined;
  if (!image?.width || !image?.height || (isPowerOfTwo(image.width) && isPowerOfTwo(image.height))) {
    return source;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;

  const ctx = canvas.getContext('2d');
  if (!ctx) return source;

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = `${source.name || 'stone-texture'}-pot`;
  source.dispose();
  return texture;
}

function configureTexture(t: THREE.Texture, repeatX = 2.2, repeatY = 1.3) {
  const image = t.image as HTMLImageElement | ImageBitmap | undefined;
  const width = image?.width ?? 0;
  const height = image?.height ?? 0;
  const canRepeat = isPowerOfTwo(width) && isPowerOfTwo(height);

  t.wrapS = canRepeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.wrapT = canRepeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.repeat.set(canRepeat ? repeatX : 1, canRepeat ? repeatY : 1);
  t.generateMipmaps = canRepeat;
  t.minFilter = canRepeat ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
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
      (t) => {
        if (!active) { t.dispose(); return; }

        const renderableTexture = createPowerOfTwoTexture(t);
        configureTexture(renderableTexture);
        setTexture(renderableTexture);
      },
      undefined,
      () => { if (active) setTexture(null); },
    );
    return () => {
      active = false;
      setTexture((currentTexture) => {
        currentTexture?.dispose();
        return null;
      });
    };
  }, [textureUrl]);
  return texture;
}

function useRepeatedTexture(
  texture: THREE.Texture | null,
  repeatX: number,
  repeatY: number,
) {
  const repeatedTexture = useMemo(() => {
    if (!texture) return null;

    const clonedTexture = texture.clone();
    clonedTexture.needsUpdate = true;
    configureTexture(clonedTexture, repeatX, repeatY);
    return clonedTexture;
  }, [repeatX, repeatY, texture]);

  useEffect(() => () => repeatedTexture?.dispose(), [repeatedTexture]);

  return repeatedTexture;
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

function StonePhotoSurface({
  texture,
  width,
  height,
  repeatX,
  repeatY,
  position,
  rotation,
}: {
  texture: THREE.Texture | null;
  width: number;
  height: number;
  repeatX: number;
  repeatY: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const repeatedTexture = useRepeatedTexture(texture, repeatX, repeatY);

  if (!repeatedTexture) return null;

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshPhysicalMaterial
        map={repeatedTexture}
        color="#ffffff"
        roughness={0.34}
        metalness={0.02}
        clearcoat={0.42}
        clearcoatRoughness={0.2}
        reflectivity={0.38}
        envMapIntensity={0.5}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
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

function JoinShadow({
  width,
  position,
}: {
  width: number;
  position: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, 0.006, 0.006]} />
      <meshBasicMaterial
        color="#191715"
        transparent
        opacity={0.28}
        depthWrite={false}
      />
    </mesh>
  );
}

function WetAreaMarker({
  width,
  depth,
  thickness,
}: {
  width: number;
  depth: number;
  thickness: number;
}) {
  const markerWidth = Math.min(width * 0.36, 0.72);
  const markerDepth = Math.min(depth * 0.46, 0.42);

  return (
    <group position={[width * 0.16, thickness / 2 + 0.009, depth * 0.05]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[markerWidth, markerDepth]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.13}
          roughness={0.08}
          metalness={0}
          clearcoat={0.95}
          clearcoatRoughness={0.05}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>

      <mesh
        position={[0, 0.002, -markerDepth / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[markerWidth * 0.82, 0.008]} />
        <meshBasicMaterial
          color="#2d2924"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
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
}: ThreeDPreviewProps) {
  const resolvedTextureUrl = resolveUsableTextureUrl(stoneName, stoneImageUrl);
  const texture = useSafeTexture(resolvedTextureUrl);
  const groupRef = useRef<THREE.Group>(null);

  const model = useMemo(() => {
    const w = Math.min(3.6, Math.max(0.8, width || 0.8));
    const d = Math.min(1.75, Math.max(0.42, depth || 0.42));
    const t = Math.min(0.26, Math.max(0.09, thickness / 18));
    const edgeRadius = Math.min(0.026, Math.max(0.014, t * 0.14));
    const backsplashH = Math.min(0.10, Math.max(0.07, d * 0.13));
    const backsplashT = Math.min(0.065, Math.max(0.04, t * 0.36));
    const skirtH = Math.min(0.16, Math.max(0.095, t * 0.82));
    const skirtT = Math.min(0.065, Math.max(0.04, t * 0.36));

    return { w, d, t, edgeRadius, backsplashH, backsplashT, skirtH, skirtT };
  }, [width, depth, thickness]);

  // Group Y offset so piece sits on floor
  const groupY = model.t / 2 + model.skirtH + 0.018;

  return (
    <>
      {/* Background */}
      <color attach="background" args={['#e8e3db']} />
      <fog attach="fog" args={['#e8e3db', 5.5, 9.0]} />

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
            radius={model.edgeRadius}
            smoothness={8}
          >
            <StoneMaterial stoneName={stoneName} texture={texture} />
          </RoundedBox>
        </mesh>

        <StonePhotoSurface
          texture={texture}
          width={model.w * 0.965}
          height={model.d * 0.92}
          repeatX={Math.max(1.4, model.w * 1.1)}
          repeatY={Math.max(0.9, model.d * 1.25)}
          position={[0, model.t / 2 + 0.005, 0.006]}
          rotation={[-Math.PI / 2, 0, 0]}
        />

        <WetAreaMarker
          width={model.w}
          depth={model.d}
          thickness={model.t}
        />

        {/* Edge highlight catch-light */}
        <EdgeProfile width={model.w} depth={model.d} thickness={model.t} />

        {/* ── Backsplash ── */}
        <mesh
          castShadow
          receiveShadow
          position={[
            0,
            model.t / 2 + model.backsplashH / 2 - 0.006,
            -model.d / 2 + model.backsplashT / 2 - 0.002,
          ]}
        >
          <RoundedBox
            args={[model.w * 0.982, model.backsplashH, model.backsplashT]}
            radius={Math.min(0.012, model.edgeRadius * 0.65)}
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
          width={model.w * 0.95}
          height={model.backsplashH * 0.88}
          repeatX={Math.max(1.4, model.w)}
          repeatY={Math.max(0.45, model.backsplashH * 1.6)}
          position={[
            0,
            model.t / 2 + model.backsplashH / 2 - 0.006,
            -model.d / 2 + model.backsplashT + 0.001,
          ]}
        />

        {/* Backsplash / countertop junction caulk line */}
        <JoinShadow
          width={model.w * 0.96}
          position={[0, model.t / 2 + 0.004, -model.d / 2 + model.backsplashT + 0.002]}
        />

        {/* ── Front skirt (fascia) ── */}
        <mesh
          castShadow
          receiveShadow
          position={[
            0,
            -model.t / 2 - model.skirtH / 2 + 0.006,
            model.d / 2 - model.skirtT / 2 + 0.002,
          ]}
        >
          <RoundedBox
            args={[model.w * 0.988, model.skirtH, model.skirtT]}
            radius={Math.min(0.014, model.edgeRadius * 0.72)}
            smoothness={6}
          >
            <StoneMaterial
              stoneName={stoneName}
              texture={texture}
              colorOffset={-0.045}
              roughnessOffset={0.06}
            />
          </RoundedBox>
        </mesh>

        <StonePhotoSurface
          texture={texture}
          width={model.w * 0.96}
          height={model.skirtH * 0.9}
          repeatX={Math.max(1.4, model.w)}
          repeatY={Math.max(0.5, model.skirtH * 1.8)}
          position={[
            0,
            -model.t / 2 - model.skirtH / 2 + 0.006,
            model.d / 2 + 0.001,
          ]}
        />

        <JoinShadow
          width={model.w * 0.95}
          position={[0, -model.t / 2 + 0.002, model.d / 2 + 0.005]}
        />

        {/* ── Rodabanca (trim strip at base of skirt) ── */}
        <mesh
          receiveShadow
          position={[
            0,
            -model.t / 2 - model.skirtH + 0.008,
            model.d / 2 - 0.006,
          ]}
        >
          <RoundedBox
            args={[model.w * 0.982, 0.018, 0.026]}
            radius={0.007}
            smoothness={5}
          >
            <StoneMaterial
              stoneName={stoneName}
              texture={texture}
              colorOffset={-0.065}
              roughnessOffset={0.08}
            />
          </RoundedBox>
        </mesh>

        <StonePhotoSurface
          texture={texture}
          width={model.w * 0.95}
          height={0.018}
          repeatX={Math.max(1.4, model.w)}
          repeatY={0.25}
          position={[
            0,
            -model.t / 2 - model.skirtH + 0.008,
            model.d / 2 + 0.008,
          ]}
        />

        {/* ── Procedural veins (no texture) ── */}
        {!texture && (
          <StoneVeins
            width={model.w}
            depth={model.d}
            thickness={model.t}
            stoneName={stoneName}
          />
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
