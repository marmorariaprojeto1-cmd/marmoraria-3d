import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ContactShadows, OrbitControls, RoundedBox } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import type { ThreeDPreviewProps } from '../../types/threePreview';
import {
  isSupportedStoneTexturePath,
  resolveLocalStoneTexture,
} from './stoneTextureMap';

type PreviewErrorBoundaryProps = {
  children: ReactNode;
};

type PreviewErrorBoundaryState = {
  hasError: boolean;
};

class PreviewErrorBoundary extends Component<
  PreviewErrorBoundaryProps,
  PreviewErrorBoundaryState
> {
  state: PreviewErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <PreviewFallback />;
    }

    return this.props.children;
  }
}

function hasWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');

    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl')),
    );
  } catch {
    return false;
  }
}

function resolveStoneColor(stoneName: string) {
  const normalized = stoneName.toLowerCase();

  if (normalized.includes('preto') || normalized.includes('nero')) {
    return '#25282a';
  }

  if (normalized.includes('branco') || normalized.includes('calacatta')) {
    return '#ded9ce';
  }

  if (normalized.includes('verde')) {
    return '#4e6250';
  }

  if (normalized.includes('cinza')) {
    return '#858883';
  }

  if (normalized.includes('travertino') || normalized.includes('crema')) {
    return '#b6a47f';
  }

  return '#928c80';
}

function resolveVeinColor(stoneName: string) {
  const normalized = stoneName.toLowerCase();

  if (normalized.includes('preto') || normalized.includes('nero')) {
    return '#62666a';
  }

  if (normalized.includes('branco') || normalized.includes('calacatta')) {
    return '#9b958b';
  }

  if (normalized.includes('verde')) {
    return '#2f3d32';
  }

  return '#6f6a61';
}

function resolveUsableTextureUrl(stoneName: string, stoneImageUrl?: string | null) {
  const textureUrl = stoneImageUrl ?? resolveLocalStoneTexture(stoneName);

  if (!textureUrl || !isSupportedStoneTexturePath(textureUrl)) {
    return null;
  }

  return textureUrl;
}

function configureTexture(texture: THREE.Texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.4, 1.4);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
}

function useSafeTexture(textureUrl: string | null) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!textureUrl) {
      setTexture(null);
      return;
    }

    let active = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      textureUrl,
      (loadedTexture) => {
        if (!active) {
          loadedTexture.dispose();
          return;
        }

        configureTexture(loadedTexture);
        setTexture(loadedTexture);
      },
      undefined,
      () => {
        if (active) {
          setTexture(null);
        }
      },
    );

    return () => {
      active = false;
      setTexture(null);
    };
  }, [textureUrl]);

  return texture;
}

function CountertopMaterial({
  stoneName,
  texture,
  colorOffset = 0,
}: {
  stoneName: string;
  texture: THREE.Texture | null;
  colorOffset?: number;
}) {
  const fallbackColor = new THREE.Color(resolveStoneColor(stoneName)).offsetHSL(
    0,
    0,
    colorOffset,
  );

  return (
    <meshStandardMaterial
      color={texture ? '#ffffff' : fallbackColor}
      map={texture ?? undefined}
      roughness={texture ? 0.5 : 0.48}
      metalness={0.03}
    />
  );
}

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
  const veins = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const progress = (index + 1) / 8;

        return {
          x: width * (progress - 0.5),
          z: depth * (0.18 * Math.sin(index * 1.7)),
          length: width * (0.48 + (index % 3) * 0.12),
          opacity: 0.13 + (index % 2) * 0.06,
          rotation: -0.22 + index * 0.075,
        };
      }),
    [depth, width],
  );

  return (
    <group position={[0, thickness / 2 + 0.004, 0]}>
      {veins.map((vein) => (
        <mesh
          key={`${vein.x}-${vein.length}`}
          position={[vein.x, 0, vein.z]}
          rotation={[-Math.PI / 2, 0, vein.rotation]}
        >
          <planeGeometry args={[vein.length, 0.012]} />
          <meshBasicMaterial
            color={resolveVeinColor(stoneName)}
            transparent
            opacity={vein.opacity}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function SinkMesh({
  radius,
}: {
  radius: number;
}) {
  return (
    <group scale={[1.38, 1, 0.84]}>
      <mesh receiveShadow position={[0, -0.007, 0]}>
        <cylinderGeometry args={[radius * 1.06, radius * 1.02, 0.012, 72]} />
        <meshStandardMaterial color="#151a1c" roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.016, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.02, 0.018, 14, 72]} />
        <meshStandardMaterial
          color="#c6c9c8"
          roughness={0.22}
          metalness={0.72}
        />
      </mesh>
      <mesh receiveShadow position={[0, -0.062, 0]}>
        <cylinderGeometry
          args={[radius * 0.86, radius * 0.66, 0.11, 72, 1, true]}
        />
        <meshStandardMaterial
          color="#8d9494"
          roughness={0.34}
          metalness={0.68}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh receiveShadow position={[0, -0.121, 0]}>
        <cylinderGeometry args={[radius * 0.67, radius * 0.64, 0.018, 72]} />
        <meshStandardMaterial color="#2b3335" roughness={0.82} metalness={0.15} />
      </mesh>
      <mesh position={[0, -0.05, radius * 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[radius * 1.3, radius * 0.75]} />
        <meshBasicMaterial
          color="#050708"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[-radius * 0.26, 0.034, -radius * 0.36]} rotation={[-Math.PI / 2, 0, -0.18]}>
        <planeGeometry args={[radius * 0.82, radius * 0.08]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

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
  const model = useMemo(() => {
    const safeWidth = Math.min(3.6, Math.max(0.8, width || 0.8));
    const safeDepth = Math.min(1.75, Math.max(0.42, depth || 0.42));
    const visualThickness = Math.min(0.24, Math.max(0.08, thickness / 19));
    const backsplashHeight = Math.min(0.42, Math.max(0.24, safeDepth * 0.28));
    const skirtHeight = Math.min(0.34, Math.max(0.18, visualThickness * 1.7));
    const sinkRadius = Math.min(safeWidth * 0.16, safeDepth * 0.36, 0.34);

    return {
      width: safeWidth,
      depth: safeDepth,
      thickness: visualThickness,
      backsplashHeight,
      skirtHeight,
      sinkRadius,
    };
  }, [depth, thickness, width]);

  return (
    <>
      <color attach="background" args={['#eeeae4']} />
      <ambientLight intensity={0.52} />
      <hemisphereLight args={['#fff7e8', '#9b9284', 1.2]} />
      <directionalLight
        castShadow
        position={[3.5, 4.2, 3.2]}
        intensity={1.75}
        shadow-bias={-0.0008}
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 1.8, -2.5]} intensity={0.35} />

      <group position={[0, 0.12, 0]} rotation={[0, -0.18, 0]}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <RoundedBox
            args={[model.width, model.thickness, model.depth]}
            radius={0.035}
            smoothness={5}
          />
          <CountertopMaterial
            stoneName={stoneName}
            texture={texture}
          />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          position={[
            0,
            model.thickness / 2 + model.backsplashHeight / 2 - 0.008,
            -model.depth / 2 + 0.035,
          ]}
        >
          <RoundedBox
            args={[
              model.width * 0.98,
              model.backsplashHeight,
              Math.min(0.075, model.depth * 0.12),
            ]}
            radius={0.018}
            smoothness={4}
          />
          <CountertopMaterial
            stoneName={stoneName}
            texture={texture}
            colorOffset={-0.03}
          />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          position={[
            0,
            -model.thickness / 2 - model.skirtHeight / 2 + 0.012,
            model.depth / 2 - 0.028,
          ]}
        >
          <RoundedBox
            args={[
              model.width * 0.985,
              model.skirtHeight,
              Math.min(0.09, model.depth * 0.14),
            ]}
            radius={0.02}
            smoothness={4}
          />
          <CountertopMaterial
            stoneName={stoneName}
            texture={texture}
            colorOffset={-0.05}
          />
        </mesh>
        {!texture && (
          <StoneVeins
            width={model.width}
            depth={model.depth}
            thickness={model.thickness}
            stoneName={stoneName}
          />
        )}

        <mesh
          position={[
            0,
            -model.thickness / 2 - model.skirtHeight - 0.006,
            model.depth / 2 - 0.018,
          ]}
          receiveShadow
        >
          <boxGeometry args={[model.width * 0.98, 0.018, 0.028]} />
          <meshStandardMaterial color="#6f6a60" roughness={0.55} />
        </mesh>

        {sinkEnabled && (
          <group
            position={[
              model.width * 0.22,
              model.thickness / 2 + 0.006,
              model.depth * 0.08,
            ]}
          >
            <SinkMesh radius={model.sinkRadius} />
          </group>
        )}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[5.4, 3.6]} />
        <shadowMaterial transparent opacity={0.08} />
      </mesh>
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.42}
        scale={4.6}
        blur={2.8}
        far={1.8}
      />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.55}
        maxDistance={5.2}
        maxPolarAngle={Math.PI / 2.08}
        target={[0, 0.12, 0]}
      />
    </>
  );
}

function PreviewFallback() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-stoneLine bg-stone-50 p-6 text-center text-stone-700">
      <div>
        <p className="font-semibold text-graphite">Preview 3D indisponivel</p>
        <p className="mt-2 text-sm">
          Este dispositivo ou navegador nao conseguiu carregar WebGL. O
          orcamento e as selecoes continuam funcionando normalmente.
        </p>
      </div>
    </div>
  );
}

export function ThreeDPreview(props: ThreeDPreviewProps) {
  const webGLSupported = useMemo(() => hasWebGLSupport(), []);

  if (!webGLSupported) {
    return <PreviewFallback />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-stoneLine bg-stone-100">
      <div className="flex items-center justify-between border-b border-stoneLine bg-white px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase text-moss">Preview 3D</p>
          <p className="text-sm font-medium text-graphite">{props.stoneName}</p>
        </div>
        <p className="text-xs text-stone-500">
          {props.width.toFixed(2)}m x {props.depth.toFixed(2)}m
        </p>
      </div>

      <div className="h-[360px] w-full sm:h-[440px]">
        <PreviewErrorBoundary>
          <Suspense fallback={<PreviewFallback />}>
            <Canvas
              camera={{ position: [2.35, 1.25, 2.05], fov: 36 }}
              shadows
              dpr={[1, 1.8]}
            >
              <CountertopScene {...props} />
            </Canvas>
          </Suspense>
        </PreviewErrorBoundary>
      </div>
    </div>
  );
}
