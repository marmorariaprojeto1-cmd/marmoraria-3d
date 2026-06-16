/**
 * Modo auditoria — substitui todos os materiais por cores sólidas
 * para identificar visualmente qual mesh causa cada artefato.
 *
 * Cores:
 *   StoneTop         = vermelho (#ff0000)
 *   WetAreaRecess    = azul    (#0066ff)
 *   Liners           = verde   (#00cc44)
 *   Bordas           = amarelo (#ffcc00)
 *   Frontões         = roxo    (#8800cc)
 *   Saias            = laranja (#ff6600)
 *   Cooktop          = rosa    (#ff44aa)
 */

export const DEBUG_VISUAL = false;

export const DEBUG_COLORS = {
  stoneTop: '#ff0000',
  wetAreaRecess: '#0066ff',
  liner: '#00cc44',
  border: '#ffcc00',
  backsplash: '#8800cc',
  skirt: '#ff6600',
  cooktop: '#ff44aa',
  edgeFinish: '#666666',
} as const;

export type DebugComponent = keyof typeof DEBUG_COLORS;

import * as THREE from 'three';

const debugMaterialCache = new Map<string, THREE.MeshBasicMaterial>();

export function debugMaterial(color: string): THREE.MeshBasicMaterial {
  const existing = debugMaterialCache.get(color);
  if (existing) return existing;
  const mat = new THREE.MeshBasicMaterial({ color, depthTest: true, depthWrite: true });
  debugMaterialCache.set(color, mat);
  return mat;
}
