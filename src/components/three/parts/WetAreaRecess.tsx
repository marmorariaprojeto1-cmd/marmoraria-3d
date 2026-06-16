import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { DEBUG_VISUAL, debugMaterial, DEBUG_COLORS } from '../debugVisual';
import { StoneMaterial } from '../utils/stoneMaterials';

type WetAreaRecessProps = {
  centerX: number;
  width: number;
  depth: number;
  countertopThickness: number;
  recessDepth: number;
  frontMargin?: number;
  backMargin?: number;
  stoneName: string;
  texture: THREE.Texture | null;
  cutoutHoles?: Array<{ width: number; depth: number; position: { x: number; z: number } }>;
};

const BORDER_W = 0.005;
const LINER_T = 0.003;
const SHALLOW_DEPTH = 0.003;

export function WetAreaRecess({
  centerX,
  width,
  depth,
  countertopThickness,
  recessDepth,
  frontMargin = 0.04,
  backMargin = 0.02,
  stoneName,
  texture,
  cutoutHoles,
}: WetAreaRecessProps) {
  const frontM = Math.max(frontMargin, 0.02);
  const backM = Math.max(backMargin, 0.01);
  const safeDepth = Math.max(0.08, depth - frontM - backM);
  const halfW = width / 2;
  const halfD = safeDepth / 2;
  const zCenter = backM + halfD - depth / 2;

  // ExtrudeGeometry raso com holes de Cuba/Cooktop dentro da wet area
  const platformGeometry = useMemo(() => {
    if (!cutoutHoles || cutoutHoles.length === 0) return null;
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, -safeDepth / 2);
    shape.lineTo(width / 2, -safeDepth / 2);
    shape.lineTo(width / 2, safeDepth / 2);
    shape.lineTo(-width / 2, safeDepth / 2);
    shape.lineTo(-width / 2, -safeDepth / 2);
    for (const c of cutoutHoles) {
      const hole = new THREE.Path();
      const hx = c.position.x - centerX;
      const hz = c.position.z - zCenter;
      hole.moveTo(hx - c.width / 2, hz - c.depth / 2);
      hole.lineTo(hx + c.width / 2, hz - c.depth / 2);
      hole.lineTo(hx + c.width / 2, hz + c.depth / 2);
      hole.lineTo(hx - c.width / 2, hz + c.depth / 2);
      hole.lineTo(hx - c.width / 2, hz - c.depth / 2);
      shape.holes.push(hole);
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: SHALLOW_DEPTH, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -SHALLOW_DEPTH / 2, 0);
    geo.computeVertexNormals();
    return geo;
  }, [width, safeDepth, cutoutHoles, centerX, zCenter]);

  useEffect(() => () => platformGeometry?.dispose(), [platformGeometry]);

  if (width <= 0 || safeDepth <= 0) return null;

  const t = countertopThickness;
  const r = Math.max(recessDepth, 0.01);
  const platformTopY = -t / 2;
  const platformCenterY = platformTopY - r / 2;
  const stepTopY = platformTopY + 0.001;

  const stone = { colorOffset: -0.06, roughnessOffset: 0.08 } as const;
  const linerStone = { colorOffset: -0.04, roughnessOffset: 0.06 } as const;
  const poly = { polygonOffset: true as const, polygonOffsetFactor: -3, polygonOffsetUnits: -3, depthWrite: false as const };

  return (
    <group>
      <mesh castShadow receiveShadow position={[centerX, platformCenterY, zCenter]} {...poly}>
        {platformGeometry ? (
          <primitive object={platformGeometry} attach="geometry" />
        ) : (
          <boxGeometry args={[width, r, safeDepth]} />
        )}
        {DEBUG_VISUAL ? (
          <primitive object={debugMaterial(DEBUG_COLORS.wetAreaRecess)} attach="material" />
        ) : (
          <StoneMaterial stoneName={stoneName} texture={texture} {...stone} />
        )}
      </mesh>

      {/* Liners */}
      <mesh position={[centerX - halfW + LINER_T / 2, 0, zCenter]} {...poly}>
        <boxGeometry args={[LINER_T, t, safeDepth]} />
        {DEBUG_VISUAL ? <primitive object={debugMaterial(DEBUG_COLORS.liner)} attach="material" /> : <StoneMaterial stoneName={stoneName} texture={texture} {...linerStone} />}
      </mesh>
      <mesh position={[centerX + halfW - LINER_T / 2, 0, zCenter]} {...poly}>
        <boxGeometry args={[LINER_T, t, safeDepth]} />
        {DEBUG_VISUAL ? <primitive object={debugMaterial(DEBUG_COLORS.liner)} attach="material" /> : <StoneMaterial stoneName={stoneName} texture={texture} {...linerStone} />}
      </mesh>
      <mesh position={[centerX, 0, zCenter - halfD + LINER_T / 2]} {...poly}>
        <boxGeometry args={[width, t, LINER_T]} />
        {DEBUG_VISUAL ? <primitive object={debugMaterial(DEBUG_COLORS.liner)} attach="material" /> : <StoneMaterial stoneName={stoneName} texture={texture} {...linerStone} />}
      </mesh>

      {/* Bordas */}
      <mesh position={[centerX - halfW + BORDER_W / 2, stepTopY, zCenter]} {...poly}><boxGeometry args={[BORDER_W, r + 0.002, safeDepth]} />{DEBUG_VISUAL ? <primitive object={debugMaterial(DEBUG_COLORS.border)} attach="material" /> : <meshBasicMaterial color="#000000" transparent opacity={0.25} depthWrite={false} />}</mesh>
      <mesh position={[centerX + halfW - BORDER_W / 2, stepTopY, zCenter]} {...poly}><boxGeometry args={[BORDER_W, r + 0.002, safeDepth]} />{DEBUG_VISUAL ? <primitive object={debugMaterial(DEBUG_COLORS.border)} attach="material" /> : <meshBasicMaterial color="#000000" transparent opacity={0.25} depthWrite={false} />}</mesh>
      <mesh position={[centerX, stepTopY, zCenter - halfD + BORDER_W / 2]} {...poly}><boxGeometry args={[width, r + 0.002, BORDER_W]} />{DEBUG_VISUAL ? <primitive object={debugMaterial(DEBUG_COLORS.border)} attach="material" /> : <meshBasicMaterial color="#000000" transparent opacity={0.25} depthWrite={false} />}</mesh>
      <mesh position={[centerX, stepTopY, zCenter + halfD - BORDER_W / 2]} {...poly}><boxGeometry args={[width, r + 0.002, BORDER_W]} />{DEBUG_VISUAL ? <primitive object={debugMaterial(DEBUG_COLORS.border)} attach="material" /> : <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />}</mesh>
    </group>
  );
}
