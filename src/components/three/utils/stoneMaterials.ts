import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import {
  isSupportedStoneTexturePath,
  resolveLocalStoneTexture,
} from '../stoneTextureMap';

export interface StoneProfile {
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

type StoneMaterialProps = {
  stoneName: string;
  texture: THREE.Texture | null;
  colorOffset?: number;
  roughnessOffset?: number;
};

type StonePhysicalMaterialProps = StoneMaterialProps & {
  transparent?: boolean;
  opacity?: number;
  depthWrite?: boolean;
};

type StonePhotoSurfaceProps = {
  texture: THREE.Texture | null;
  width: number;
  height: number;
  repeatX: number;
  repeatY: number;
  position: [number, number, number];
  rotation?: [number, number, number];
};

export function resolveStoneProfile(stoneName: string): StoneProfile {
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

export function resolveUsableTextureUrl(
  stoneName: string,
  stoneImageUrl?: string | null,
) {
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
  if (
    !image?.width ||
    !image?.height ||
    (isPowerOfTwo(image.width) && isPowerOfTwo(image.height))
  ) {
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

export function configureTexture(t: THREE.Texture, repeatX = 2.2, repeatY = 1.3) {
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

export function useSafeTexture(textureUrl: string | null) {
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
      (t) => {
        if (!active) {
          t.dispose();
          return;
        }

        const renderableTexture = createPowerOfTwoTexture(t);
        configureTexture(renderableTexture);
        setTexture(renderableTexture);
      },
      undefined,
      () => {
        if (active) setTexture(null);
      },
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

export function useRepeatedTexture(
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

export function StoneMaterial({
  stoneName,
  texture,
  colorOffset = 0,
  roughnessOffset = 0,
}: StoneMaterialProps) {
  const profile = useMemo(() => resolveStoneProfile(stoneName), [stoneName]);
  const baseColor = useMemo(() => {
    const c = new THREE.Color(profile.base);
    c.offsetHSL(0, 0, colorOffset);
    return c;
  }, [profile.base, colorOffset]);

  return React.createElement('meshPhysicalMaterial', {
    color: texture ? '#ffffff' : baseColor,
    map: texture ?? undefined,
    roughness: Math.max(0.1, profile.roughness + roughnessOffset),
    metalness: profile.metalness,
    clearcoat: profile.clearcoat,
    clearcoatRoughness: profile.clearcoatRoughness,
    reflectivity: profile.reflectivity,
    envMapIntensity: 1.4,
  });
}

export function StonePhysicalMaterial({
  stoneName,
  texture,
  colorOffset = 0,
  roughnessOffset = 0,
  transparent = false,
  opacity = 1,
  depthWrite,
}: StonePhysicalMaterialProps) {
  const profile = useMemo(() => resolveStoneProfile(stoneName), [stoneName]);
  const baseColor = useMemo(() => {
    const c = new THREE.Color(profile.base);
    c.offsetHSL(0, 0, colorOffset);
    return c;
  }, [profile.base, colorOffset]);

  return React.createElement('meshPhysicalMaterial', {
    color: texture ? '#ffffff' : baseColor,
    map: texture ?? undefined,
    roughness: Math.max(0.1, profile.roughness + roughnessOffset),
    metalness: profile.metalness,
    clearcoat: profile.clearcoat,
    clearcoatRoughness: profile.clearcoatRoughness,
    reflectivity: profile.reflectivity,
    envMapIntensity: 1.2,
    transparent,
    opacity,
    depthWrite,
  });
}

export function StonePhotoSurface({
  texture,
  width,
  height,
  repeatX,
  repeatY,
  position,
  rotation,
}: StonePhotoSurfaceProps) {
  const repeatedTexture = useRepeatedTexture(texture, repeatX, repeatY);

  if (!repeatedTexture) return null;

  return React.createElement(
    'mesh',
    { position, rotation },
    React.createElement('planeGeometry', { args: [width, height] }),
    React.createElement('meshPhysicalMaterial', {
      map: repeatedTexture,
      color: '#ffffff',
      roughness: 0.34,
      metalness: 0.02,
      clearcoat: 0.42,
      clearcoatRoughness: 0.2,
      reflectivity: 0.38,
      envMapIntensity: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
}
