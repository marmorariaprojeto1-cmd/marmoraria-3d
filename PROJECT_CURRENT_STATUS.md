[01] Status Atual do Projeto

Data: 2026-06-07

Este documento registra o estado atual do projeto Marmoraria 3D para orientar as proximas tarefas locais. Nao representa deploy, nao publica alteracoes e nao altera codigo.

[02] Estado Geral

O projeto esta com a base comercial do MVP funcional e com o primeiro modulo visual 3D integrado ao simulador.

Estado atual:

* Simulador com fluxo comercial preservado.
* Preview 2D mantido.
* Preview 3D integrado ao simulador.
* Painel admin com exibicao de snapshots em pedidos.
* Motor de orcamento com arredondamento, espessura, breakdown e snapshots.
* RPC transacional create_quote_with_item documentada e usada pelo simulador.
* Catalogo padrao documentado e script local de seed criado/executado anteriormente.
* Preparacao local de texturas de pedra iniciada.

[03] Estado do Git

Branch atual:

* main

Estado em relacao ao remoto:

* main esta ahead 4 de origin/main.
* Nenhum push deve ser feito sem autorizacao explicita.

Arquivo nao rastreado existente:

* DATABASE_STATUS.md

Observacao: DATABASE_STATUS.md permanece fora do escopo atual e nao deve ser alterado, removido ou commitado sem pedido explicito.

[04] Commits Locais Pendentes de Push

Os commits abaixo existem localmente e ainda nao foram enviados para origin/main:

1. 2468a86 - feat: improve 3d preview visuals
    * Melhorou camera, iluminacao, sombras, material, espessura visual e cuba simplificada do ThreeDPreview.
2. 72e1526 - feat: prepare local stone texture fallbacks
    * Criou STONE_TEXTURE_STRATEGY.md, estrutura public/textures/stones/, placeholders SVG e mapeamento inicial de texturas locais.
3. f9d0460 - feat: refine placeholder stone textures
    * Refinou visualmente os seis SVGs placeholder das pedras principais.
4. 92b35e6 - fix: harden 3d stone texture fallback
    * Corrigiu o problema em que SVGs locais podiam quebrar o Canvas no preview 3D.
    * Limitou textura real a jpg, jpeg, png e webp.
    * Manteve fallback procedural com cor base e veios gerados.

[05] Decisoes Importantes

[05.01] 3D como camada visual

O preview 3D deve continuar sendo apenas uma camada visual.

Ele nao deve:

* calcular preco;
* alterar regras comerciais;
* salvar dados;
* consultar Supabase diretamente;
* mudar RPC;
* mudar RLS;
* substituir validacao da marmoraria.

[05.02] Arquitetura atual do módulo 3D


## Arquitetura atual do módulo 3D

O módulo 3D foi refatorado para deixar `ThreeDPreview.tsx` como orquestrador visual, reduzindo sua complexidade e separando responsabilidades.

### Regras principais

- O 3D é apenas uma camada visual.
- O 3D recebe dados por props.
- O 3D pode usar nome da pedra, imagem/textura da pedra, dimensões, espessura e configurações visuais.
- O 3D não calcula preço.
- O 3D não salva dados.
- O 3D não altera pedidos.
- O 3D não consulta Supabase.
- O 3D não conhece RLS, RPC, status de pedido ou regras comerciais.
- O cálculo continua fora do módulo 3D.

### Estrutura

`src/components/three/ThreeDPreview.tsx`

Responsável por:
- manter a API pública do preview;
- verificar suporte a WebGL;
- renderizar fallback visual;
- configurar o Canvas;
- montar a cena principal;
- passar dados para os componentes internos.

`src/components/three/stoneTextureMap.ts`

Responsável por:
- mapear nomes de pedras para texturas locais;
- normalizar nomes;
- validar extensões aceitas para textura WebGL;
- impedir uso de SVG como textura WebGL real.

`src/components/three/parts/`

Responsável pelas peças visuais do 3D:
- `StoneTop.tsx`: tampo principal;
- `FrontApron.tsx`: saia frontal;
- `Backsplash.tsx`: frontão traseiro;
- `SideBacksplash.tsx`: frontões laterais;
- `WetArea.tsx`: marcação visual de área molhada/seca;
- `EdgeFinish.tsx`: acabamentos de borda;
- `SceneLighting.tsx`: luzes, sombras, piso e parede;
- `SceneCamera.tsx`: câmera, zoom e controles.

`src/components/three/utils/`

Responsável por helpers compartilhados:
- `stoneMaterials.ts`: perfis visuais das pedras, materiais, texturas e fallback procedural;
- `geometryUtils.ts`: normalização de medidas, limites visuais e tipos internos.

### Observação importante

`WetArea.tsx` inicialmente é visual, mas deve estar preparado para futuramente representar regras comerciais de área molhada e área seca.

[05.03] Trabalho local sem publicacao automatica

Regra operacional atual:

* nao fazer push;
* nao fazer deploy;
* trabalhar localmente;
* fazer commit local apenas quando a tarefa pedir ou quando for necessario consolidar a entrega;
* aguardar autorizacao explicita para publicar.

[06] Validacoes Recentes

Validacoes executadas nas ultimas tarefas locais:

* npm run lint: passou.
* npm run build: passou.
* /preview-3d: canvas renderizado, sem fallback indevido e sem erros de console.
* /simulador: preview 2D e 3D renderizados, sem overflow e sem quebra do fluxo.
* Reload em /preview-3d e /simulador: preview 3D permaneceu ativo.
* Troca entre Branco Siena, Branco Fortaleza, Preto Sao Gabriel e Verde Ubatuba: preview 3D permaneceu renderizado.

Observacao: o build emite aviso esperado de chunk grande por causa das bibliotecas 3D.

[07] Proximos Passos Recomendados

1. Revisar visualmente o preview 3D no navegador real do usuario.
2. Validar se o problema do card com icone pequeno foi resolvido no ambiente local do usuario.
3. Quando aprovado, autorizar explicitamente o push dos quatro commits locais pendentes.
4. Depois do push, avaliar deploy manualmente, se os creditos/limites do Netlify permitirem.
5. Futuramente substituir placeholders SVG por imagens reais otimizadas em jpg, png ou webp.
6. Expandir o mapeamento de texturas para as demais pedras do catalogo padrao apenas depois da validacao das seis pedras principais.

[08] Regras de Trabalho Atuais

* Nao alterar codigo fora do escopo solicitado.
* Nao alterar calculo de orcamento sem auditoria especifica.
* Nao alterar Supabase, migrations, RLS ou RPC sem tarefa dedicada.
* Nao alterar admin quando a tarefa for do 3D/simulador visual.
* Nao remover fallback 2D.
* Nao quebrar salvamento do orcamento.
* Nao usar SVG como textura WebGL real no ThreeDPreview.
* Nao commitar DATABASE_STATUS.md sem pedido explicito.
* Nao fazer push sem autorizacao explicita.
* Nao fazer deploy sem autorizacao explicita.

[09] Situacao Para Publicacao

O projeto esta pronto para um push tecnico dos commits locais quando o usuario autorizar.

A publicacao/deploy deve ser uma etapa separada e manualmente autorizada.