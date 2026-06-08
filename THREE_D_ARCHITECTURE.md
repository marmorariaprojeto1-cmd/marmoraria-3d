# Arquitetura do Modulo 3D

## Objetivo

Este documento resume a organizacao atual do modulo 3D do MVP.

O `ThreeDPreview.tsx` agora funciona apenas como orquestrador da experiencia 3D. Ele recebe dados por props, monta o `Canvas`, aplica fallback de WebGL e combina os componentes visuais internos.

Nenhuma regra comercial deve ser colocada dentro do 3D. Calculo de preco, persistencia, Supabase, RPC, RLS e regras de orcamento continuam fora do modulo 3D.

## Estrutura Atual

```text
src/components/three/
  ThreeDPreview.tsx
  stoneTextureMap.ts
  parts/
    StoneTop.tsx
    FrontApron.tsx
    Backsplash.tsx
    SideBacksplash.tsx
    WetArea.tsx
    EdgeFinish.tsx
    SceneLighting.tsx
    SceneCamera.tsx
  utils/
    stoneMaterials.ts
    geometryUtils.ts
```

## Fluxo de Dados

O modulo 3D recebe dados prontos por props.

```text
Simulador ou rota de preview
↓
ThreeDPreviewProps
↓
ThreeDPreview.tsx
↓
parts/
↓
utils/
↓
Canvas 3D
```

O 3D pode usar nome da pedra, imagem da pedra, dimensoes, espessura e configuracoes visuais. Ele nao deve calcular valor, alterar pedido, salvar dados ou consultar banco.

## Responsabilidades

### ThreeDPreview.tsx

Orquestra o preview 3D.

Responsavel por:

- manter a API publica do componente;
- verificar suporte a WebGL;
- renderizar fallback visual;
- configurar o `Canvas`;
- montar a cena principal;
- passar dados para os componentes de `parts/`.

### stoneTextureMap.ts

Mapeia nomes de pedras para texturas locais.

Responsavel por:

- resolver textura local pelo nome da pedra;
- normalizar nomes;
- validar extensoes aceitas para textura WebGL;
- manter a regra de que SVG nao e textura WebGL confiavel.

### parts/StoneTop.tsx

Renderiza o tampo principal da bancada.

Responsavel por:

- geometria principal do tampo;
- textura fotografica no topo;
- material procedural quando nao houver textura;
- veios procedurais de fallback.

### parts/FrontApron.tsx

Renderiza a saia frontal.

Responsavel por:

- saia frontal simples;
- saia dupla do tipo sanduiche;
- frisos e juntas visuais;
- textura/material da pedra na frente da bancada.

### parts/Backsplash.tsx

Renderiza o frontao traseiro.

Responsavel por:

- peça traseira baixa;
- textura/material da pedra;
- junta discreta entre tampo e frontao.

### parts/SideBacksplash.tsx

Renderiza frontoes laterais opcionais.

Responsavel por:

- frontao lateral esquerdo;
- frontao lateral direito;
- alinhamento visual com o frontao traseiro;
- textura/material da pedra nas laterais.

### parts/WetArea.tsx

Renderiza a marcacao visual da area molhada.

Responsavel por:

- indicar area molhada de forma discreta;
- manter a area apenas visual;
- nao representar regra comercial;
- nao salvar informacao no banco.

### parts/EdgeFinish.tsx

Renderiza os acabamentos de borda.

Responsavel por:

- acabamento reto;
- meia cana;
- boleado;
- acabamento 45 graus;
- saia dupla/sanduiche;
- highlights, frisos e juntas da borda frontal.

### parts/SceneLighting.tsx

Configura iluminacao e ambiente visual.

Responsavel por:

- luz principal;
- luz de preenchimento;
- luz ambiente;
- parede de fundo;
- piso;
- sombras basicas da cena.

### parts/SceneCamera.tsx

Configura camera e interacao.

Responsavel por:

- controles de orbita;
- zoom;
- limite de rotacao;
- sombra de contato;
- preload de recursos 3D.

### utils/stoneMaterials.ts

Centraliza materiais e texturas.

Responsavel por:

- perfil visual das pedras;
- carregamento seguro de textura;
- repeticao de textura;
- material fisico da pedra;
- superficie fotografica;
- fallback procedural.

### utils/geometryUtils.ts

Centraliza regras geometricas visuais.

Responsavel por:

- normalizar tipo visual de acabamento;
- calcular dimensoes internas do modelo 3D;
- limitar medidas visuais;
- manter tipos internos compartilhados entre as peças.

## Regra Arquitetural Principal

O modulo 3D e uma camada visual.

Ele deve receber dados, desenhar a bancada e falhar com fallback quando necessario. Ele nao deve conhecer regra de preco, persistencia, status de pedido, RLS, RPC ou qualquer regra comercial da marmoraria.
