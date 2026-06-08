// Mapeamento de texturas locais para pedras do catálogo.
// SVGs são usados apenas como fallback visual/documental.
// Texturas WebGL reais devem ser jpg/png/webp.
//
// Ordem de resolução (ThreeDPreview):
//   1. stoneImageUrl (raster do Supabase, se fornecida e suportada)
//   2. textura raster local mapeada aqui (jpg/png/webp)
//   3. material procedural com cor base + veios gerados

const stoneTextureMap: Record<string, string> = {
  'amarelo ornamental': '/textures/stones/amarelo-ornamental.webp',
  'branco fortaleza': '/textures/stones/branco-fortaleza.webp',
  'branco siena': '/textures/stones/branco-siena.webp',
  'cinza corumba': '/textures/stones/cinza-corumba.webp',
  'preto sao gabriel': '/textures/stones/preto-sao-gabriel.webp',
  'verde ubatuba': '/textures/stones/verde-ubatuba.webp',
};

function normalizeStoneName(stoneName: string) {
  return stoneName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function resolveLocalStoneTexture(stoneName: string) {
  return stoneTextureMap[normalizeStoneName(stoneName)] ?? null;
}

/** Aceita apenas rasters — SVGs quebram o canvas WebGL. */
export function isSupportedStoneTexturePath(texturePath: string) {
  const normalizedPath = texturePath.split(/[?#]/)[0].toLowerCase();
  return /\.(jpe?g|png|webp)$/.test(normalizedPath);
}
