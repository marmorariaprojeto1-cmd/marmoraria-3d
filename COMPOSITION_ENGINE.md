# Composition Engine

## Objetivo

Definir o objeto oficial de montagem da bancada 3D.

Este documento descreve apenas a estrutura conceitual da composicao. Ele nao altera calculo, banco, Supabase, persistencia, simulador ou regra comercial.

O Composition Engine deve servir como contrato futuro entre:

- configuracao visual escolhida pelo usuario;
- componentes 3D disponiveis;
- montagem final da bancada no preview.

## Principio Central

A composicao da bancada deve ser declarativa.

Em vez de o 3D decidir regras comerciais, ele deve receber um objeto pronto dizendo quais componentes visuais devem aparecer e com quais parametros.

O 3D continua sendo apenas camada visual.

## Estrutura Oficial do Objeto

```ts
type CountertopComposition = {
  id: string;
  version: number;
  top: TopComponent;
  wetArea?: WetAreaComponent;
  backsplash?: BacksplashComponent;
  frontApron?: FrontApronComponent;
  edgeFinish?: EdgeFinishComponent;
  material: MaterialComponent;
  metadata?: CompositionMetadata;
};
```

## Componentes Obrigatorios

### top

Define o tampo principal da bancada.

Exemplo:

```ts
top: {
  componentId: 'COMPONENT_001',
  type: 'straight_top_30mm',
  width: 2.4,
  depth: 0.7,
  thicknessMm: 30
}
```

Regras:

- sempre obrigatorio;
- deve possuir largura maior que zero;
- deve possuir profundidade maior que zero;
- deve possuir espessura maior que zero;
- deve ser a base para posicionamento dos demais componentes.

### material

Define a pedra/material aplicado aos componentes visuais.

Exemplo:

```ts
material: {
  stoneName: 'Branco Siena',
  stoneImageUrl: null,
  localTextureKey: 'branco-siena'
}
```

Regras:

- sempre obrigatorio;
- deve conter ao menos `stoneName`;
- pode receber imagem externa;
- pode usar textura local;
- se nenhuma textura estiver disponivel, o 3D deve usar fallback procedural.

## Componentes Opcionais

### wetArea

Define a area molhada visual.

Exemplo:

```ts
wetArea: {
  componentId: 'COMPONENT_010',
  type: 'straight_wet_area',
  enabled: true,
  width: 0.72,
  depth: 0.34,
  position: {
    x: 0.32,
    z: 0.04
  }
}
```

Regras:

- opcional;
- nao altera calculo;
- nao cria cuba;
- deve ficar dentro dos limites do tampo;
- pode representar area molhada reta, dupla ou 45 graus.

### backsplash

Define o frontao traseiro.

Exemplo:

```ts
backsplash: {
  componentId: 'COMPONENT_022',
  type: 'back_backsplash',
  enabled: true,
  heightMm: 100,
  leftEnabled: false,
  rightEnabled: false
}
```

Regras:

- opcional;
- se ausente ou desabilitado, a bancada fica sem frontao;
- altura deve ser maior que zero quando habilitado;
- laterais podem ser habilitadas separadamente;
- nao deve atravessar o tampo.

### frontApron

Define a saia frontal.

Exemplo:

```ts
frontApron: {
  componentId: 'COMPONENT_032',
  type: 'front_apron',
  enabled: true,
  heightMm: 60
}
```

Regras:

- opcional;
- se ausente ou desabilitado, a bancada fica sem saia;
- altura deve ser maior que zero quando habilitada;
- deve alinhar com a borda frontal do tampo;
- nao deve parecer flutuando.

### edgeFinish

Define o acabamento visual da borda.

Exemplo:

```ts
edgeFinish: {
  type: 'straight'
}
```

Valores previstos:

- `straight`
- `halfBullnose`
- `bullnose`
- `miter45`
- `doubleApron`

Regras:

- opcional;
- se ausente, usar `straight` ou padrao visual definido pelo produto;
- deve afetar apenas a leitura visual da borda;
- nao deve alterar preco;
- `doubleApron` pode exigir saia visual mesmo quando `frontApron` nao estiver habilitada.

## Metadata Opcional

```ts
metadata: {
  source: 'simulator',
  createdAt: '2026-06-08',
  notes: 'Composicao visual gerada no MVP'
}
```

Uso:

- auditoria visual;
- debug;
- comparacao entre composicoes;
- futuras importacoes/exportacoes.

## Regras de Validacao

Uma composicao valida deve obedecer:

1. `top` deve existir.
2. `material` deve existir.
3. `top.width` deve ser maior que zero.
4. `top.depth` deve ser maior que zero.
5. `top.thicknessMm` deve ser maior que zero.
6. `wetArea`, quando existir, deve caber dentro do tampo.
7. `backsplash.heightMm`, quando habilitado, deve ser maior que zero.
8. `frontApron.heightMm`, quando habilitado, deve ser maior que zero.
9. `edgeFinish.type`, quando informado, deve ser um acabamento suportado.
10. Nenhum componente visual deve alterar calculo comercial.
11. Nenhum componente visual deve salvar dados diretamente.
12. Nenhum componente visual deve consultar Supabase diretamente.

## Fluxo de Montagem

```text
Dados do simulador
↓
Objeto CountertopComposition
↓
Validacao da composicao
↓
Resolucao de material/textura
↓
Montagem do tampo
↓
Montagem da area molhada opcional
↓
Montagem do frontao opcional
↓
Montagem da saia opcional
↓
Aplicacao do acabamento de borda
↓
Renderizacao no Canvas 3D
```

## Componentes Iniciais Mapeados

### Tampo

- `COMPONENT_001`: Tampo reto 30 mm

### Area Molhada

- `COMPONENT_010`: Area molhada reta
- `COMPONENT_011`: Area molhada dupla
- `COMPONENT_012`: Area molhada 45 graus

### Frontao

- `COMPONENT_020`: Sem frontao
- `COMPONENT_021`: Frontao 50 mm
- `COMPONENT_022`: Frontao 100 mm

### Saia

- `COMPONENT_030`: Sem saia
- `COMPONENT_031`: Saia 40 mm
- `COMPONENT_032`: Saia 60 mm

## Fora do Escopo

Este documento nao define:

- preco;
- margem;
- regra de orcamento;
- persistencia;
- schema de banco;
- migration;
- RPC;
- RLS;
- integracao com admin;
- motor comercial.

Esses temas devem continuar fora do modulo 3D ate existir uma tarefa especifica.
