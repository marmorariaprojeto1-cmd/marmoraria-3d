import { Component, Suspense, useMemo, type ReactNode } from 'react';
import { OrbitControls, useTexture } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import type { ThreeDPreviewProps } from '../../types/threePreview';

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
    return '#2f3032';
  }

  if (normalized.includes('branco') || normalized.includes('calacatta')) {
    return '#e7e2d7';
  }

  if (normalized.includes('verde')) {
    return '#586b52';
  }

  if (normalized.includes('cinza')) {
    return '#8a8c87';
  }

  if (normalized.includes('travertino') || normalized.includes('crema')) {
    return '#b9a886';
  }

  return '#9a9488';
}

function CountertopMaterial({
  stoneName,
  stoneImageUrl,
}: {
  stoneName: string;
  stoneImageUrl?: string | null;
}) {
  const fallbackColor = resolveStoneColor(stoneName);

  if (stoneImageUrl) {
    return <TexturedCountertopMaterial stoneImageUrl={stoneImageUrl} />;
  }

  return (
    <meshStandardMaterial
      color={fallbackColor}
      roughness={0.68}
      metalness={0.03}
    />
  );
}

function TexturedCountertopMaterial({
  stoneImageUrl,
}: {
  stoneImageUrl: string;
}) {
  const texture = useTexture(stoneImageUrl);

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.4, 1.4);
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <meshStandardMaterial
      color="#ffffff"
      map={texture}
      roughness={0.68}
      metalness={0.03}
    />
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
  const model = useMemo(() => {
    const safeWidth = Math.min(4, Math.max(0.6, width || 0.6));
    const safeDepth = Math.min(2.4, Math.max(0.35, depth || 0.35));
    const visualThickness = Math.min(0.18, Math.max(0.06, thickness / 25));
    const sinkWidth = Math.min(safeWidth * 0.28, 0.58);
    const sinkDepth = Math.min(safeDepth * 0.42, 0.42);

    return {
      width: safeWidth,
      depth: safeDepth,
      thickness: visualThickness,
      sinkWidth,
      sinkDepth,
    };
  }, [depth, thickness, width]);

  return (
    <>
      <ambientLight intensity={0.72} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <directionalLight position={[-4, 2, -3]} intensity={0.45} />

      <group rotation={[0, -0.2, 0]}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[model.width, model.thickness, model.depth]} />
          <CountertopMaterial
            stoneName={stoneName}
            stoneImageUrl={stoneImageUrl}
          />
        </mesh>

        {sinkEnabled && (
          <group position={[model.width * 0.18, model.thickness / 2 + 0.008, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry
                args={[
                  Math.min(model.sinkWidth, model.sinkDepth) / 2,
                  Math.min(model.sinkWidth, model.sinkDepth) / 2,
                  0.014,
                  48,
                ]}
              />
              <meshStandardMaterial color="#30383b" roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.004, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry
                args={[
                  Math.min(model.sinkWidth, model.sinkDepth) / 2,
                  Math.min(model.sinkWidth, model.sinkDepth) / 2 + 0.025,
                  48,
                ]}
              />
              <meshStandardMaterial color="#d4d0c5" roughness={0.52} />
            </mesh>
          </group>
        )}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.11, 0]} receiveShadow>
        <planeGeometry args={[5.2, 3.4]} />
        <meshStandardMaterial color="#eeeae1" roughness={0.9} />
      </mesh>

      <OrbitControls
        enablePan={false}
        enableDamping
        minDistance={1.8}
        maxDistance={6}
        maxPolarAngle={Math.PI / 2.08}
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
              camera={{ position: [2.2, 1.45, 2.35], fov: 42 }}
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
