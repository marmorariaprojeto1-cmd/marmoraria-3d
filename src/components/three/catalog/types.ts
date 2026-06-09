import type { ComponentType } from 'react';
import type * as THREE from 'three';
import type { ThreeDPreviewProps } from '../../../types/threePreview';
import type { EdgeFinishVisualType } from '../utils/geometryUtils';

export type ThreeDComponentCategory =
  | 'top'
  | 'wetArea'
  | 'backsplash'
  | 'frontApron'
  | 'edgeFinish';

export type ThreeDRegisteredComponentProps = {
  width: number;
  depth: number;
  thickness: number;
  edgeRadius: number;
  stoneName: string;
  texture: THREE.Texture | null;
  backsplashHeight?: number;
  backsplashThickness?: number;
  skirtHeight?: number;
  skirtThickness?: number;
  visualEdgeFinish?: EdgeFinishVisualType;
  wetAreaWidth?: number;
  wetAreaDepth?: number;
  wetAreaPosition?: ThreeDPreviewProps['wetAreaPosition'];
};

export type ThreeDRegisteredComponent = ComponentType<ThreeDRegisteredComponentProps>;

export type ThreeDComponentRegistryItem = {
  id: string;
  name: string;
  category: ThreeDComponentCategory;
  component: ThreeDRegisteredComponent | null;
};
