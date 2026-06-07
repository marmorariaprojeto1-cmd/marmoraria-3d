const stoneTextureMap: Record<string, string> = {
  'amarelo ornamental': '/textures/stones/amarelo-ornamental.svg',
  'branco fortaleza': '/textures/stones/branco-fortaleza.svg',
  'branco siena': '/textures/stones/branco-siena.svg',
  'cinza corumba': '/textures/stones/cinza-corumba.svg',
  'preto sao gabriel': '/textures/stones/preto-sao-gabriel.svg',
  'verde ubatuba': '/textures/stones/verde-ubatuba.svg',
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

export function isSupportedStoneTexturePath(texturePath: string) {
  const normalizedPath = texturePath.split(/[?#]/)[0].toLowerCase();

  return /\.(jpe?g|png|webp)$/.test(normalizedPath);
}
