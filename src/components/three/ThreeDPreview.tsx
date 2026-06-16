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
import {
  DEFAULT_CAMERA_POSITION,
  SceneCamera,
} from './parts/SceneCamera';
import { SceneLighting } from './parts/SceneLighting';
import { SideBacksplash } from './parts/SideBacksplash';
import { SideSkirt } from './parts/SideSkirt';
import { StoneTop } from './parts/StoneTop';
import { WetAreaRecess } from './parts/WetAreaRecess';
import {
  buildCountertopModel,
  resolveEdgeFinishVisualType,
  clamp,
  type CountertopModel,
} from './utils/geometryUtils';
import {
  resolveUsableTextureUrl,
  useSafeTexture,
} from './utils/stoneMaterials';

type PreviewErrorBoundaryProps = { children: ReactNode };
type PreviewErrorBoundaryState = { hasError: boolean };

type CountertopSceneProps = NormalizedThreeDPreviewProps & {
  cameraResetKey?: string | number | null;
};

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

function formatThicknessMm(thickness: number) {
  const thicknessMm = thickness <= 1 ? thickness * 1000 : thickness * 10;
  return Math.round(thicknessMm);
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
  leftBacksplashHeightCm = 8,
  rightBacksplashEnabled = false,
  rightBacksplashHeightCm = 8,
  frontApronEnabled = true,
  frontApronHeightCm = 12,
  rearApronEnabled = false,
  rearApronHeightCm = 10,
  leftFrontApronEnabled = false,
  leftFrontApronHeightCm = 10,
  rightFrontApronEnabled = false,
  rightFrontApronHeightCm = 10,
  edgeFinishType = 'rounded',
  wetAreaEnabled = true,
  wetAreaWidth,
  wetAreaDepth,
  wetAreaPosition,
  sinkCutoutComponentId,
  sinkCutoutPosition,
  cooktopCutoutComponentId,
  cooktopCutoutPosition,
  cameraResetKey,
}: CountertopSceneProps) {
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
  const FrontApronComponent =
    frontApronRegistryItem?.category === 'frontApron'
      ? frontApronRegistryItem.component
      : null;
  const BacksplashComponent =
    backsplashRegistryItem?.category === 'backsplash'
      ? backsplashRegistryItem.component
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
        rearApronEnabled,
        rearApronHeightCm,
        leftFrontApronEnabled,
        leftFrontApronHeightCm,
        rightFrontApronEnabled,
        rightFrontApronHeightCm,
        visualEdgeFinish: effectiveVisualEdgeFinish,
      }),
    [
      backsplashEnabled,
      backsplashHeightCm,
      depth,
      effectiveFrontApronEnabled,
      frontApronHeightCm,
      rearApronEnabled,
      rearApronHeightCm,
      thickness,
      effectiveVisualEdgeFinish,
      width,
      leftFrontApronEnabled,
      leftFrontApronHeightCm,
      rightFrontApronEnabled,
      rightFrontApronHeightCm,
    ],
  );

  const activeSkirtHeight = Math.max(
    effectiveFrontApronEnabled ? model.skirtH : 0,
    rearApronEnabled ? model.rearSkirtH : 0,
    leftFrontApronEnabled ? model.leftSkirtH : 0,
    rightFrontApronEnabled ? model.rightSkirtH : 0,
  );
  const groupY = model.t / 2 + activeSkirtHeight + 0.018;
  const isLoadingResolvedTexture =
    Boolean(resolvedTextureUrl) && textureStatus === 'loading';
  // Multi-cutout: coleta cuba + cooktop independentes
  const resolvedCutouts: Array<{
    width: number;
    depth: number;
    position: { x?: number; z?: number };
  }> = [];
  if (sinkCutoutComponentId) {
    const dims = resolveCutoutDimensions(sinkCutoutComponentId);
    if (dims) {
      resolvedCutouts.push({
        width: Math.min(dims.width, model.w * 0.72),
        depth: Math.min(dims.depth, model.d * 0.74),
        position: sinkCutoutPosition ?? { x: 0, z: 0 },
      });
    }
  }
  if (cooktopCutoutComponentId) {
    const dims = resolveCutoutDimensions(cooktopCutoutComponentId);
    if (dims) {
      resolvedCutouts.push({
        width: Math.min(dims.width, model.w * 0.72),
        depth: Math.min(dims.depth, model.d * 0.74),
        position: cooktopCutoutPosition ?? { x: 0, z: 0 },
      });
    }
  }

  // Wet area hole — adicionado ao Shape do StoneTop para abrir a chapa
  const wetAreaCutout =
    wetAreaEnabled && wetAreaWidth != null && wetAreaPosition != null
      ? (() => {
          const waDepth = wetAreaDepth ?? model.d;
          const frontM = 0.04;
          const backM = 0.02;
          const safeD = Math.max(0.08, waDepth - frontM - backM);
          return {
            width: wetAreaWidth,
            depth: safeD,
            allowEdge: true,
            position: {
              x: wetAreaPosition.x ?? 0,
              z: backM + safeD / 2 - waDepth / 2,
            },
          };
        })()
      : null;

  const stoneTopCutouts = wetAreaCutout
    ? [
        wetAreaCutout,
        ...resolvedCutouts.filter((c) => {
          const wa = wetAreaCutout;
          const cx = c.position.x ?? 0;
          const halfW = c.width / 2;
          const cz = c.position.z ?? 0;
          const halfD = c.depth / 2;
          const inside =
            cx - halfW >= wa.position.x - wa.width / 2 &&
            cx + halfW <= wa.position.x + wa.width / 2 &&
            cz - halfD >= (wa.position.z as number) - wa.depth / 2 &&
            cz + halfD <= (wa.position.z as number) + wa.depth / 2;
          return !inside;
        }),
      ]
    : resolvedCutouts;

  // Cutouts 100% dentro da wet area → aplicados na plataforma com ExtrudeGeometry raso
  const wetAreaInsideCutouts = wetAreaCutout
    ? resolvedCutouts.filter((c) => {
        const wa = wetAreaCutout;
        const cx = c.position.x ?? 0;
        const halfW = c.width / 2;
        const cz = c.position.z ?? 0;
        const halfD = c.depth / 2;
        return (
          cx - halfW >= wa.position.x - wa.width / 2 &&
          cx + halfW <= wa.position.x + wa.width / 2 &&
          cz - halfD >= (wa.position.z as number) - wa.depth / 2 &&
          cz + halfD <= (wa.position.z as number) + wa.depth / 2
        );
      })
    : [];

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
            suppressStonePhotoSurface={wetAreaEnabled}
          />
        ) : (
          <StoneTop
            width={model.w}
            depth={model.d}
            thickness={model.t}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
            cutouts={stoneTopCutouts.length > 0 ? stoneTopCutouts : undefined}
            suppressStonePhotoSurface={wetAreaEnabled}
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
        ) : null}

        {wetAreaEnabled && wetAreaWidth != null && wetAreaPosition != null && (
          <WetAreaRecess
            centerX={wetAreaPosition.x ?? 0}
            width={wetAreaWidth}
            depth={wetAreaDepth ?? model.d}
            countertopThickness={model.t}
            recessDepth={model.t}
            frontMargin={0.04}
            backMargin={0.02}
            stoneName={stoneName}
            texture={texture}
            cutoutHoles={wetAreaInsideCutouts.length > 0
              ? wetAreaInsideCutouts.filter((c) => c.position.x != null).map((c) => ({
                  width: c.width, depth: c.depth,
                  position: { x: c.position.x!, z: c.position.z ?? 0 },
                }))
              : undefined}
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
            suppressJoinShadow={wetAreaEnabled}
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
            suppressJoinShadow={wetAreaEnabled}
          />
          )
        )}

        {leftBacksplashEnabled && (
          <SideBacksplash
            side="left"
            width={model.w}
            depth={model.d}
            thickness={model.t}
            backsplashHeight={clamp(leftBacksplashHeightCm / 100, 0.04, 0.18)}
            backsplashThickness={model.backsplashT}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
          />
        )}

        {rightBacksplashEnabled && (
          <SideBacksplash
            side="right"
            width={model.w}
            depth={model.d}
            thickness={model.t}
            backsplashHeight={clamp(rightBacksplashHeightCm / 100, 0.04, 0.18)}
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

        {model.rearSkirtEnabled && model.rearSkirtH > 0 && (
          <FrontApron
            placement="back"
            width={model.w}
            depth={model.d}
            thickness={model.t}
            skirtHeight={model.rearSkirtH}
            skirtThickness={model.rearSkirtT}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
            visualEdgeFinish={effectiveVisualEdgeFinish}
          />
        )}

        {model.leftSkirtEnabled && model.leftSkirtH > 0 && (
          <SideSkirt
            side="left"
            width={model.w}
            depth={model.d}
            thickness={model.t}
            skirtHeight={model.leftSkirtH}
            skirtThickness={model.leftSkirtT}
            frontApronThickness={model.skirtEnabled ? model.skirtT : 0}
            rearApronThickness={backsplashEnabled ? model.backsplashT : model.rearSkirtEnabled ? model.rearSkirtT : 0}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
          />
        )}

        {model.rightSkirtEnabled && model.rightSkirtH > 0 && (
          <SideSkirt
            side="right"
            width={model.w}
            depth={model.d}
            thickness={model.t}
            skirtHeight={model.rightSkirtH}
            skirtThickness={model.rightSkirtT}
            frontApronThickness={model.skirtEnabled ? model.skirtT : 0}
            rearApronThickness={backsplashEnabled ? model.backsplashT : model.rearSkirtEnabled ? model.rearSkirtT : 0}
            edgeRadius={model.edgeRadius}
            stoneName={stoneName}
            texture={texture}
          />
        )}

          </>
        )}
      </group>

      <SceneCamera resetKey={cameraResetKey} />
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
          <p className="text-xs text-stone-400">
            esp. {formatThicknessMm(previewProps.thickness)} mm
          </p>
        </div>
      </div>

      <div className="relative h-[380px] w-full sm:h-[460px] lg:h-[500px]">
        <PreviewErrorBoundary>
          <Suspense fallback={<PreviewFallback />}>
            <Canvas
              camera={{ position: DEFAULT_CAMERA_POSITION.toArray(), fov: 31 }}
              shadows={{ type: THREE.PCFSoftShadowMap }}
              dpr={[1, 2]}
              gl={{
                antialias: true,
                preserveDrawingBuffer: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.05,
              }}
            >
              <CountertopScene
                {...previewProps}
                cameraResetKey={props.cameraResetKey ?? 'default'}
              />
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
