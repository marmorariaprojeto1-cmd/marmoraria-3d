# Plano de Implementacao do Modulo 3D

Data: 2026-06-07

Escopo: preparacao documental do modulo 3D.

Este documento nao implementa 3D, nao instala bibliotecas, nao altera simulador, nao altera motor de calculo, nao altera banco, nao altera RLS e nao muda regras comerciais. A V1 do 3D deve ser uma camada visual sobre o fluxo atual.

## 1. Objetivo do Modulo 3D

O modulo 3D deve ajudar o cliente a entender proporcao, formato, textura e espessura da peca configurada no simulador.

O objetivo nao e produzir render fotorrealista nem desenho tecnico. A V1 deve ser leve, responsiva e suficiente para apoiar a decisao comercial antes do contato com a marmoraria.

Principios:

- Consumir medidas e selecoes ja existentes no simulador.
- Nao alterar calculo de preco.
- Nao gravar novos dados no banco.
- Nao depender de informacao comercial fora do fluxo atual.
- Funcionar bem em desktop e mobile.

## 2. O Que Sera 3D na V1

A V1 deve renderizar:

- Bancada retangular simples.
- Textura visual da pedra aplicada ao tampo.
- Espessura visivel.
- Cuba simplificada quando selecionada.
- Rotacao orbitada pelo usuario.
- Zoom.
- Preview responsivo no espaco do simulador.

O modelo deve representar a peca configurada, nao o ambiente completo.

## 3. O Que Continuara 2D ou Simplificado

Continuara simplificado na V1:

- Etapas do simulador.
- Selecao de produto, pedra, cuba, acabamento e medidas.
- Resumo comercial.
- Calculo do orcamento.
- Salvamento por RPC.
- Mensagem de WhatsApp.
- Catalogo administrativo.

Elementos visuais que podem permanecer simplificados:

- Cuba como cavidade ou objeto basico sem detalhe hidraulico.
- Acabamento como destaque visual discreto na borda.
- Pedras sem mapas PBR completos.
- Iluminacao basica.
- Sem escala arquitetonica perfeita.

## 4. Componentes Necessarios

Componentes futuros recomendados:

- `ThreeDPreview`: container principal do preview 3D.
- `CountertopScene`: cena, camera, luzes e controles.
- `CountertopMesh`: geometria da bancada.
- `StoneMaterial`: material/textura da pedra.
- `SinkCutoutMesh`: representacao simples da cuba ou recorte.
- `SceneControls`: controles de rotacao, zoom e reset de camera.
- `PreviewFallback`: fallback para navegadores, dispositivos ou erros de WebGL.
- `useCountertopModel`: adaptador que transforma os dados do simulador em parametros visuais.

Esses componentes devem receber dados prontos do simulador, sem buscar banco diretamente.

## 5. Bibliotecas Recomendadas

Bibliotecas recomendadas para a fase de implementacao:

- `three`: motor 3D base.
- `@react-three/fiber`: integracao declarativa com React.
- `@react-three/drei`: controles, helpers e utilitarios comuns.

Bibliotecas opcionais futuras:

- `zustand`: somente se o estado 3D crescer alem do estado local do simulador.
- `leva`: apenas para debug interno, nao para interface final do usuario.
- `three-stdlib`: se algum helper nao estiver coberto por `drei`.

Nao instalar bibliotecas nesta tarefa.

## 6. Estrutura de Arquivos Futura

Estrutura sugerida:

```text
src/
  components/
    three-d/
      ThreeDPreview.tsx
      CountertopScene.tsx
      CountertopMesh.tsx
      StoneMaterial.tsx
      SinkCutoutMesh.tsx
      SceneControls.tsx
      PreviewFallback.tsx
  hooks/
    useCountertopModel.ts
  types/
    threeD.ts
  utils/
    threeDGeometry.ts
    stoneTexture.ts
```

Regras de organizacao:

- O simulador deve apenas passar props para o preview.
- O motor de orcamento deve continuar em `src/services/quoteCalculator.ts`.
- Funcoes geometricas devem ficar separadas de componentes React quando possivel.
- Tipos do 3D devem ser separados dos tipos comerciais.

## 7. Como Aplicar Textura da Pedra

Na V1, cada pedra pode usar `image_url` quando existir. Se nao houver imagem, deve usar material visual neutro baseado no nome/categoria.

Fluxo recomendado:

1. Receber `stone.image_url` e `stone.name` do simulador.
2. Tentar carregar a textura com loader do Three.js.
3. Aplicar a textura no material da bancada.
4. Configurar repeticao da textura proporcionalmente a largura e profundidade.
5. Usar fallback visual quando a imagem nao carregar.

Cuidados:

- Nao bloquear o simulador se a textura falhar.
- Evitar imagens muito pesadas no MVP.
- Nao usar textura para recalcular preco.
- Nao salvar textura no pedido nesta fase.

## 8. Representacao dos Elementos

### Bancada

A bancada deve ser representada como uma caixa retangular com:

- largura baseada na medida informada;
- profundidade baseada na medida informada;
- altura baseada na espessura;
- origem centralizada para facilitar rotacao.

Para evitar distorcoes, a cena pode usar escala visual simplificada. A proporcao deve ser coerente, mesmo que a unidade interna seja normalizada.

### Espessura

A espessura deve aparecer no volume lateral da bancada.

Regra visual:

- 2 cm: volume mais fino.
- 3 cm: volume intermediario.
- 4 cm: volume mais robusto.

Essa espessura e apenas visual. O multiplicador comercial continua no motor de orcamento.

### Cuba

Na V1, a cuba pode ser representada de forma simplificada:

- como recorte escuro/baixo relevo no tampo;
- ou como objeto retangular/oval simples sobreposto ou levemente rebaixado;
- posicionada inicialmente no centro ou em uma posicao fixa segura.

Nao e necessario criar geometria booleana perfeita na V1.

### Rodabanca Futura

Rodabanca deve ficar fora da V1 principal.

Quando entrar, pode ser representada como uma placa vertical atras da bancada, com:

- largura igual ou menor que a bancada;
- altura configuravel;
- mesma textura da pedra;
- ativacao visual independente.

### Saia Futura

Saia deve ficar fora da V1 principal.

Quando entrar, pode ser representada como uma extensao vertical na frente e/ou laterais da bancada, com:

- altura configuravel;
- mesma textura da pedra;
- comportamento visual separado da espessura.

## 9. Limites da V1

A V1 deve aceitar estes limites:

- Apenas bancada retangular.
- Sem ambiente completo de cozinha.
- Sem armarios, paredes, piso ou decoracao.
- Sem renderizacao fotorrealista.
- Sem medicao arquitetonica precisa.
- Sem exportacao CAD.
- Sem realidade aumentada.
- Sem simulacao de instalacao.
- Sem edicao avancada de posicao da cuba.
- Sem recortes complexos.
- Sem persistencia de estado 3D.
- Sem impacto no preco.

O 3D deve ser tratado como preview comercial, nao como projeto executivo.

## 10. Ordem de Implementacao Segura

Ordem recomendada:

1. Criar tipos visuais do 3D separados dos tipos de orcamento.
2. Criar componente isolado `ThreeDPreview` com fallback estatico.
3. Instalar bibliotecas 3D em tarefa propria.
4. Renderizar bancada retangular sem textura.
5. Adicionar controles de rotacao e zoom.
6. Aplicar textura da pedra com fallback.
7. Tornar espessura visualmente proporcional.
8. Adicionar cuba simplificada.
9. Integrar o preview ao simulador sem alterar etapas ou calculo.
10. Validar em desktop e mobile.
11. Rodar lint, build e verificacao visual.
12. Documentar limitacoes e proximas evolucoes.

## O Que Nao Fazer Agora

Nao fazer nesta fase:

- Criar ambiente completo de cozinha.
- Criar realidade aumentada.
- Criar exportacao CAD.
- Alterar regras de orcamento.
- Alterar persistencia.
- Alterar banco.
- Alterar RLS.
- Alterar RPC.
- Alterar fluxo de salvamento.
- Instalar bibliotecas sem tarefa especifica.
- Criar renderizacao fotorrealista.
- Fazer refatoracao ampla do simulador.

## Decisao de Arquitetura

A decisao recomendada e implementar o 3D como componente visual isolado, alimentado por props do simulador atual.

O modulo 3D nao deve consultar Supabase diretamente, nao deve calcular preco e nao deve persistir dados. Ele deve receber um modelo visual derivado das selecoes ja carregadas pelo simulador.

Essa separacao reduz risco comercial: o orcamento continua sendo responsabilidade do motor atual, enquanto o 3D apenas melhora a compreensao visual da peca.

