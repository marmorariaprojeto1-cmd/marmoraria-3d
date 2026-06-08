import React, { Component, Suspense, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ThreeDPreviewProps } from '../../types/threePreview';
import { Backsplash } from './parts/Backsplash';
import { EdgeFinish } from './parts/EdgeFinish';
import { FrontApron } from './parts/FrontApron';
import { SceneCamera } from './parts/SceneCamera';
import { SceneLighting } from './parts/SceneLighting';
import { SideBacksplash } from './parts/SideBacksplash';
import { StoneTop } from './parts/StoneTop';
import { WetArea } from './parts/WetArea';
import {
  buildCountertopModel,
  resolveEdgeFinishVisualType,
} from './utils/geometryUtils';
import {
  resolveUsableTextureUrl,
  useSafeTexture,
} from './utils/stoneMaterials';

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

function AutoRotate({ targetRef }: { targetRef: React.RefObject<THREE.Group | null> }) {
  const t = useRef(0);

  useFrame((_, delta) => {
    if (!targetRef.current) return;
    t.current += delta * 0.12;
    targetRef.current.rotation.y = Math.sin(t.current) * 0.08 - 0.12;
  });

  return null;
}

function CountertopScene({
  width,
  depth,
  thickness,
  stoneName,
  stoneImageUrl,
  backsplashEnabled = true,
  backsplashHeightCm = 8,
  leftBacksplashEnabled = false,
  rightBacksplashEnabled = false,
  frontApronEnabled = true,
  frontApronHeightCm = 12,
  edgeFinishType = 'rounded',
  wetAreaEnabled = true,
  wetAreaWidth,
  wetAreaDepth,
  wetAreaPosition,
}: ThreeDPreviewProps) {
  const visualEdgeFinish = resolveEdgeFinishVisualType(edgeFinishType);
  const resolvedTextureUrl = resolveUsableTextureUrl(stoneName, stoneImageUrl);
  const texture = useSafeTexture(resolvedTextureUrl);
  const groupRef = useRef<THREE.Group>(null);

  const model = useMemo(
    () =>
      buildCountertopModel({
        width,
        depth,
        thickness,
        backsplashEnabled,
        backsplashHeightCm,
        frontApronEnabled,
        frontApronHeightCm,
        visualEdgeFinish,
      }),
    [
      backsplashEnabled,
      backsplashHeightCm,
      depth,
      frontApronEnabled,
      frontApronHeightCm,
      thickness,
      visualEdgeFinish,
      width,
    ],
  );

  const groupY = model.t / 2 + model.skirtH + 0.018;

  return (
    <>
      <SceneLighting
        wallWidth={model.w + 0.8}
        wallHeight={0.8 + model.backsplashH + groupY}
      />

      <group ref={groupRef} position={[0, groupY, 0]}>
        <AutoRotate targetRef={groupRef} />

        <StoneTop
          width={model.w}
          depth={model.d}
          thickness={model.t}
          edgeRadius={model.edgeRadius}
          stoneName={stoneName}
          texture={texture}
        />

        <WetArea
          width={model.w}
          depth={model.d}
          thickness={model.t}
          enabled={wetAreaEnabled}
          wetAreaWidth={wetAreaWidth}
          wetAreaDepth={wetAreaDepth}
          wetAreaPosition={wetAreaPosition}
        />

        <EdgeFinish
          width={model.w}
          depth={model.d}
          thickness={model.t}
          stoneName={stoneName}
          texture={texture}
          edgeFinishType={visualEdgeFinish}
        />

        {backsplashEnabled && (
          <Backsplash
            width={model.w}
            depth={model.d}
            thickness={model.t}
            backsplashHeight={model.backsplashH}
            backsplashThickness={model.backsplashT}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
          />
        )}

        {leftBacksplashEnabled && backsplashEnabled && (
          <SideBacksplash
            side="left"
            width={model.w}
            depth={model.d}
            thickness={model.t}
            backsplashHeight={model.backsplashH}
            backsplashThickness={model.backsplashT}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
          />
        )}

        {rightBacksplashEnabled && backsplashEnabled && (
          <SideBacksplash
            side="right"
            width={model.w}
            depth={model.d}
            thickness={model.t}
            backsplashHeight={model.backsplashH}
            backsplashThickness={model.backsplashT}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
          />
        )}

        {model.skirtEnabled && (
          <FrontApron
            width={model.w}
            depth={model.d}
            thickness={model.t}
            skirtHeight={model.skirtH}
            skirtThickness={model.skirtT}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
            visualEdgeFinish={visualEdgeFinish}
          />
        )}

        {!model.skirtEnabled && (
          <mesh position={[0, -model.t / 2 + 0.002, model.d / 2 + 0.003]}>
            <boxGeometry args={[model.w * 0.94, 0.004, 0.004]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.16}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      <SceneCamera />
    </>
  );
}

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

export function ThreeDPreview(props: ThreeDPreviewProps) {
  const webGLSupported = useMemo(() => hasWebGLSupport(), []);

  if (!webGLSupported) return <PreviewFallback />;

  return (
    <div className="overflow-hidden rounded-xl border border-stoneLine bg-stone-100 shadow-lg">
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
          <p className="text-xs text-stone-400">esp. {props.thickness} mm</p>
        </div>
      </div>

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

        <p className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm">
          arraste para girar
        </p>
      </div>
    </div>
  );
}
