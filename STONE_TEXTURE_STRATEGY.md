# Estrategia de Texturas de Pedra

Data: 2026-06-07

Escopo: preparacao local para uso de texturas reais no preview 3D.

Este documento nao cria imagens reais, nao altera catalogo no banco, nao altera calculo, nao altera Supabase, nao altera migrations, nao altera RLS e nao muda regras comerciais.

## Objetivo

Preparar o projeto para exibir texturas reais de pedras no `ThreeDPreview`, mantendo o 3D como camada visual isolada.

A textura deve melhorar a percepcao visual da bancada, mas nunca deve interferir no preco, no salvamento do orcamento, na RPC ou no isolamento multiempresa.

## Ordem de Resolucao de Textura

O preview 3D deve resolver a textura nesta ordem:

1. Usar `stoneImageUrl`, quando informado pelo catalogo da empresa.
2. Se `stoneImageUrl` nao existir, procurar uma textura local em `stoneTextureMap` pelo nome da pedra.
3. Se nao houver textura local disponivel, manter o fallback visual atual com cor base e veios gerados.

Essa ordem preserva a autonomia da marmoraria: se a empresa cadastrar imagem propria no catalogo, ela tem prioridade sobre qualquer textura padrao local.

## Estrutura de Assets

Texturas locais devem ficar em:

```text
public/
  textures/
    stones/
```

Arquivos placeholder criados nesta etapa:

```text
public/textures/stones/branco-fortaleza.svg
public/textures/stones/branco-siena.svg
public/textures/stones/preto-sao-gabriel.svg
public/textures/stones/verde-ubatuba.svg
public/textures/stones/amarelo-ornamental.svg
public/textures/stones/cinza-corumba.svg
```

Esses arquivos sao placeholders visuais para validar o carregamento local. Eles nao representam fotos reais nem fidelidade comercial dos materiais.

Quando as texturas reais forem adicionadas, os caminhos do mapa podem ser trocados para JPG, PNG ou WebP otimizados.

## Mapeamento Inicial

O arquivo `src/components/three/stoneTextureMap.ts` centraliza o mapeamento inicial entre nome da pedra e caminho da textura local.

Pedras mapeadas:

- Branco Fortaleza
- Branco Siena
- Preto Sao Gabriel
- Verde Ubatuba
- Amarelo Ornamental
- Cinza Corumba

O mapeamento normaliza acentos e caixa para reduzir diferencas entre nomes como `Preto São Gabriel` e `Preto Sao Gabriel`.

## Padrao Recomendado para Imagens

Quando as imagens reais forem adicionadas, recomenda-se:

- formato: JPG ou WebP;
- proporcao quadrada ou proxima de quadrada;
- resolucao sugerida: entre 1024px e 2048px;
- textura com repeticao razoavel, sem marca d'agua;
- cor fiel ao material, mas sem promessa de fidelidade comercial absoluta;
- tamanho otimizado para web.

## Cuidados Comerciais

As texturas sao apenas ilustrativas.

O preview 3D nao deve:

- definir preco;
- alterar acabamento;
- alterar disponibilidade;
- substituir validacao da marmoraria;
- prometer fidelidade exata de lote, veios ou tonalidade.

## Evolucao Futura

Proximas evolucoes possiveis:

1. Adicionar imagens reais otimizadas para as seis pedras iniciais.
2. Expandir o mapeamento para as 38 pedras do catalogo padrao.
3. Permitir textura cadastrada por empresa no painel admin.
4. Criar validacao de assets ausentes.
5. Avaliar WebP para reduzir peso no carregamento.
