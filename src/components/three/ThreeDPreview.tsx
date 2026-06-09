import React, { Component, Suspense, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ThreeDPreviewProps } from '../../types/threePreview';
import {
  normalizeComposition,
  type NormalizedThreeDPreviewProps,
} from './composition/normalizeComposition';
import { findThreeDComponent } from './catalog';
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
  type CountertopModel,
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

function TextureLoadingSkeleton({ model }: { model: CountertopModel }) {
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[model.w, model.t, model.d]} />
        <meshPhysicalMaterial
          color="#d7d3ca"
          roughness={0.34}
          metalness={0.02}
          clearcoat={0.35}
          clearcoatRoughness={0.24}
        />
      </mesh>

      {model.backsplashH > 0 && (
        <mesh
          castShadow
          receiveShadow
          position={[
            0,
            model.t / 2 + model.backsplashH / 2 - 0.006,
            -model.d / 2 + model.backsplashT / 2,
          ]}
        >
          <boxGeometry args={[model.w * 0.982, model.backsplashH, model.backsplashT]} />
          <meshPhysicalMaterial
            color="#cbc7bd"
            roughness={0.38}
            clearcoat={0.25}
            clearcoatRoughness={0.3}
          />
        </mesh>
      )}

      {model.skirtEnabled && (
        <mesh
          castShadow
          receiveShadow
          position={[
            0,
            -model.t / 2 - model.skirtH / 2 + 0.006,
            model.d / 2 - model.skirtT / 2,
          ]}
        >
          <boxGeometry args={[model.w * 0.988, model.skirtH, model.skirtT]} />
          <meshPhysicalMaterial
            color="#c6c2b8"
            roughness={0.4}
            clearcoat={0.22}
            clearcoatRoughness={0.32}
          />
        </mesh>
      )}
    </>
  );
}

function resolveCutoutDimensions(componentId?: string) {
  if (componentId === 'COMPONENT_050') return { width: 0.5, depth: 0.4 };
  if (componentId === 'COMPONENT_051') return { width: 0.56, depth: 0.34 };
  if (componentId === 'COMPONENT_052') return { width: 0.49, depth: 0.35 };
  if (componentId === 'COMPONENT_053') return { width: 0.56, depth: 0.48 };
  return null;
}

function CountertopScene({
  topComponentId,
  wetAreaComponentId,
  cutoutComponentId,
  backsplashComponentId,
  frontApronComponentId,
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
  cutoutEnabled,
  cutoutPosition,
}: NormalizedThreeDPreviewProps) {
  const visualEdgeFinish = resolveEdgeFinishVisualType(edgeFinishType);
  const hasExplicitNoFrontApron = frontApronComponentId === 'COMPONENT_030';
  const effectiveFrontApronEnabled = hasExplicitNoFrontApron
    ? false
    : frontApronEnabled;
  const effectiveVisualEdgeFinish =
    hasExplicitNoFrontApron && visualEdgeFinish === 'doubleApron'
      ? 'straight'
      : visualEdgeFinish;
  const resolvedTextureUrl = resolveUsableTextureUrl(stoneName, stoneImageUrl);
  const { texture, status: textureStatus } = useSafeTexture(resolvedTextureUrl);
  const groupRef = useRef<THREE.Group>(null);
  const topRegistryItem = topComponentId
    ? findThreeDComponent(topComponentId)
    : null;
  const wetAreaRegistryItem = wetAreaComponentId
    ? findThreeDComponent(wetAreaComponentId)
    : null;
  const cutoutRegistryItem = cutoutComponentId
    ? findThreeDComponent(cutoutComponentId)
    : null;
  const backsplashRegistryItem = backsplashComponentId
    ? findThreeDComponent(backsplashComponentId)
    : null;
  const frontApronRegistryItem = frontApronComponentId
    ? findThreeDComponent(frontApronComponentId)
    : null;
  const TopComponent =
    topRegistryItem?.category === 'top' ? topRegistryItem.component : null;
  const WetAreaComponent =
    wetAreaRegistryItem?.category === 'wetArea'
      ? wetAreaRegistryItem.component
      : null;
  const CutoutComponent =
    cutoutRegistryItem?.category === 'cutout'
      ? cutoutRegistryItem.component
      : null;
  const BacksplashComponent =
    backsplashRegistryItem?.category === 'backsplash'
      ? backsplashRegistryItem.component
      : null;
  const FrontApronComponent =
    frontApronRegistryItem?.category === 'frontApron'
      ? frontApronRegistryItem.component
      : null;

  const model = useMemo(
    () =>
      buildCountertopModel({
        width,
        depth,
        thickness,
        backsplashEnabled,
        backsplashHeightCm,
        frontApronEnabled: effectiveFrontApronEnabled,
        frontApronHeightCm,
        visualEdgeFinish: effectiveVisualEdgeFinish,
      }),
    [
      backsplashEnabled,
      backsplashHeightCm,
      depth,
      effectiveFrontApronEnabled,
      frontApronHeightCm,
      thickness,
      effectiveVisualEdgeFinish,
      width,
    ],
  );

  const groupY = model.t / 2 + model.skirtH + 0.018;
  const isLoadingResolvedTexture =
    Boolean(resolvedTextureUrl) && textureStatus === 'loading';
  const cutoutDimensions =
    cutoutEnabled && CutoutComponent
      ? resolveCutoutDimensions(cutoutComponentId)
      : null;
  const cutoutWidth = cutoutDimensions
    ? Math.min(cutoutDimensions.width, model.w * 0.72)
    : undefined;
  const cutoutDepth = cutoutDimensions
    ? Math.min(cutoutDimensions.depth, model.d * 0.74)
    : undefined;

  return (
    <>
      <SceneLighting
        wallWidth={model.w + 0.8}
        wallHeight={0.8 + model.backsplashH + groupY}
      />

      <group ref={groupRef} position={[0, groupY, 0]}>
        <AutoRotate targetRef={groupRef} />

        {isLoadingResolvedTexture ? (
          <TextureLoadingSkeleton model={model} />
        ) : (
          <>
        {TopComponent ? (
          <TopComponent
            width={model.w}
            depth={model.d}
            thickness={model.t}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
            cutoutWidth={cutoutWidth}
            cutoutDepth={cutoutDepth}
            cutoutPosition={cutoutPosition}
          />
        ) : (
          <StoneTop
            width={model.w}
            depth={model.d}
            thickness={model.t}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
            cutoutWidth={cutoutWidth}
            cutoutDepth={cutoutDepth}
            cutoutPosition={cutoutPosition}
          />
        )}

        {wetAreaEnabled && WetAreaComponent ? (
          <WetAreaComponent
            width={model.w}
            depth={model.d}
            thickness={model.t}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
            wetAreaWidth={wetAreaWidth}
            wetAreaDepth={wetAreaDepth}
            wetAreaPosition={wetAreaPosition}
          />
        ) : (
          <WetArea
            width={model.w}
            depth={model.d}
            thickness={model.t}
            enabled={wetAreaEnabled}
            wetAreaWidth={wetAreaWidth}
            wetAreaDepth={wetAreaDepth}
            wetAreaPosition={wetAreaPosition}
          />
        )}

        {cutoutEnabled && CutoutComponent && (
          <CutoutComponent
            width={model.w}
            depth={model.d}
            thickness={model.t}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
            cutoutWidth={cutoutWidth}
            cutoutDepth={cutoutDepth}
            cutoutPosition={cutoutPosition}
          />
        )}

        <EdgeFinish
          width={model.w}
          depth={model.d}
          thickness={model.t}
          stoneName={stoneName}
          texture={texture}
          edgeFinishType={effectiveVisualEdgeFinish}
        />

        {BacksplashComponent ? (
          <BacksplashComponent
            width={model.w}
            depth={model.d}
            thickness={model.t}
            backsplashHeight={model.backsplashH}
            backsplashThickness={model.backsplashT}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
          />
        ) : (
          backsplashEnabled && (
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
          )
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

        {FrontApronComponent ? (
          <FrontApronComponent
            width={model.w}
            depth={model.d}
            thickness={model.t}
            skirtHeight={model.skirtH}
            skirtThickness={model.skirtT}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
            visualEdgeFinish={effectiveVisualEdgeFinish}
          />
        ) : (
          model.skirtEnabled && (
          <FrontApron
            width={model.w}
            depth={model.d}
            thickness={model.t}
            skirtHeight={model.skirtH}
            skirtThickness={model.skirtT}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
            visualEdgeFinish={effectiveVisualEdgeFinish}
          />
          )
        )}

          </>
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
  const previewProps = useMemo(() => normalizeComposition(props), [props]);

  if (!webGLSupported) return <PreviewFallback />;

  return (
    <div className="overflow-hidden rounded-xl border border-stoneLine bg-stone-100 shadow-lg">
      <div className="flex items-center justify-between border-b border-stoneLine bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-moss">
            Preview 3D
          </p>
          <p className="text-sm font-semibold text-graphite">
            {previewProps.stoneName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-stone-500">
            {previewProps.width.toFixed(2)} m × {previewProps.depth.toFixed(2)} m
          </p>
          <p className="text-xs text-stone-400">esp. {previewProps.thickness} mm</p>
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
              <CountertopScene {...previewProps} />
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
