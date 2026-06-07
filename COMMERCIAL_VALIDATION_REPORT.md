# Relatorio de Validacao Comercial

Data da validacao: 2026-06-07

Escopo: Fase 7 - Consolidacao Comercial.

Esta validacao nao implementa 3D, nao altera visual, nao cria funcionalidades complexas, nao cria dados de teste e nao executa alteracoes no banco. A analise foi feita por leitura dos documentos de auditoria, codigo atual, migrations existentes e fluxo implementado no MVP.

## Resumo Executivo

O MVP possui uma base comercial funcional para demonstracao controlada: catalogo de cubas e acabamentos, simulador com catalogo ativo, calculo com espessura, salvamento via RPC transacional, dashboard simples e pedidos com alteracao de status.

Ainda nao recomendo avancar diretamente para o modulo 3D como etapa principal. O motivo nao e a falta de 3D, mas sim a necessidade de fechar alguns pontos comerciais que o 3D vai amplificar: exibicao do snapshot no admin, validacao manual com pedido real de ponta a ponta, testes automatizados do motor e melhorias no detalhamento financeiro.

Resultado geral: **Aprovacao parcial com atencoes.**

## 1. Cubas

### Cadastro

- Status: **OK**
- Evidencia: `src/pages/admin/SinksPage.tsx` permite cadastrar cuba com `company_id`, `name`, `category`, `price` e `active`.
- Observacao: o cadastro depende de usuario autenticado vinculado a `public.users`.

### Edicao

- Status: **OK**
- Evidencia: a tela carrega o registro no formulario e executa `update` filtrando por `id` e `company_id`.

### Ativacao/desativacao

- Status: **OK**
- Evidencia: `toggleSinkActive` alterna `active` sem apagar dados.

### Reflexo no simulador

- Status: **OK**
- Evidencia: `SimulatorPage` consulta `sinks` com `.eq('active', true)` e `.eq('company_id', companyId)`.
- Impacto: cubas desativadas deixam de aparecer no simulador.

### Reflexo no orcamento

- Status: **Atencao**
- Evidencia: `calculateSinkPrice` usa `sink.price * quantity`.
- Motivo da atencao: para o MVP isso funciona, mas em casos reais uma unica cuba pode atender mais de uma peca. A quantidade de cubas ainda acompanha a quantidade de pecas.

## 2. Acabamentos

### Cadastro e edicao

- Status: **OK**
- Evidencia: `FinishesPage` permite cadastrar e editar `fixed`, `linear_meter` e `percentage`, gravando `pricing_type`, `price`, `active` e `company_id`.

### Ativacao/desativacao

- Status: **OK**
- Evidencia: `toggleFinishActive` alterna `active` sem apagar dados.

### `fixed`

- Status: **OK**
- Evidencia: `calculateFinishPrice` retorna `roundMoney(price * quantity)`.

### `linear_meter`

- Status: **Atencao**
- Evidencia: `calculateFinishPrice` usa perimetro completo: `(width + depth) * 2`.
- Motivo da atencao: comercialmente alguns acabamentos lineares podem ser aplicados apenas em bordas especificas. Para MVP, o calculo e consistente; para producao, precisa regra por borda/metragem.

### `percentage`

- Status: **OK**
- Evidencia: `calculateFinishPrice` usa `roundMoney(basePrice * (price / 100))`, sem multiplicar `quantity` de novo.
- Impacto: corrige o risco anterior de cobranca duplicada quando `quantity > 1`.

### Persistencia correta

- Status: **OK**
- Evidencia: a RPC grava `finish_id`, `finish_price_snapshot`, `finish_name_snapshot`, `finish_unit_price_snapshot` e `finish_pricing_type_snapshot`.
- Atencao secundaria: o admin ainda nao exibe esses campos de snapshot.

## 3. Espessuras

### 2 cm

- Status: **OK**
- Multiplicador: `1.00`

### 3 cm

- Status: **OK**
- Multiplicador: `1.15`

### 4 cm

- Status: **OK**
- Multiplicador: `1.30`

### Espessura nao reconhecida

- Status: **OK**
- Regra: usa `1.00`, conforme definido em `QUOTE_ENGINE_FIX_REPORT.md`.

### Persistencia

- Status: **OK**
- Evidencia: `quote_items` grava `thickness` e `thickness_multiplier`.

## 4. Dashboard

### Pedidos novos

- Status: **OK**
- Evidencia: dashboard conta `submitted`.

### Em negociacao

- Status: **OK**
- Evidencia: dashboard conta e soma `negotiating`.

### Fechados

- Status: **OK**
- Evidencia: dashboard conta `won` e soma valor fechado.

### Perdidos

- Status: **OK**
- Evidencia: dashboard conta `lost`.

### Totais financeiros

- Status: **Atencao**
- Evidencia: dashboard soma `total_price` de todos os pedidos listados em `totalEstimatedValue`, alem de valores em negociacao e fechados.
- Motivo da atencao: `contacted` entra no total estimado, mas nao possui card proprio. Para MVP e aceitavel; para operacao comercial, vale separar cada etapa do funil.

## 5. Pedidos

### Criacao

- Status: **OK**
- Evidencia: simulador salva via RPC `create_quote_with_item`.

### Atualizacao de status

- Status: **OK**
- Evidencia: `OrdersPage` atualiza `quotes.status` por `id` e `company_id`.

### Exibicao dos itens

- Status: **OK**
- Evidencia: `OrdersPage` lista produto, pedra, cuba, acabamento, medidas, quantidade, valor unitario e valor total.

### Snapshot dos valores

- Status: **Correcao necessaria**
- Evidencia: migration cria snapshots em `quote_items`, mas `OrdersPage` ainda consulta nomes via relacionamento (`products(name)`, `stones(name)`, `sinks(name)`, `finishes(name)`) e nao exibe `product_name_snapshot`, `stone_name_snapshot`, `sink_name_snapshot`, `finish_name_snapshot` nem precos snapshot.
- Impacto: se catalogo for alterado depois, o admin pode exibir nomes atuais em vez do estado historico do pedido.

## 6. WhatsApp

### Geracao da mensagem

- Status: **OK**
- Evidencia: `buildWhatsAppMessage` inclui ambiente, produto, pedra, cuba, acabamento, medidas, quantidade e valor estimado.

### Numero correto da empresa

- Status: **Atencao**
- Evidencia: o simulador consulta `companies` ativa por `VITE_SIMULATOR_COMPANY_ID` e usa `company.whatsapp`.
- Motivo da atencao: a normalizacao remove caracteres nao numericos, mas ainda nao valida DDI, tamanho minimo ou formato E.164.

### Dados do orcamento corretos

- Status: **OK**
- Evidencia: a mensagem usa o mesmo `quote.total`, medidas e selecoes do simulador.
- Observacao: o envio por WhatsApp nao cria pedido sozinho; pedido salvo depende do botao "Salvar orcamento".

## 7. Snapshot

### `product_name_snapshot`

- Status: **OK**
- Persistencia criada na RPC.
- Atencao: nao exibido no admin.

### `stone_name_snapshot`

- Status: **OK**
- Persistencia criada na RPC.
- Atencao: nao exibido no admin.

### `sink_name_snapshot`

- Status: **OK**
- Persistencia criada na RPC.
- Atencao: nao exibido no admin.

### `finish_name_snapshot`

- Status: **OK**
- Persistencia criada na RPC.
- Atencao: nao exibido no admin.

### Precos snapshot

- Status: **OK**
- Campos persistidos: `stone_price_snapshot`, `sink_price_snapshot`, `finish_price_snapshot`, `stone_price_per_m2_snapshot`, `sink_unit_price_snapshot`, `finish_unit_price_snapshot`.
- Atencao: nao exibidos no admin.

## 8. RPC

### `create_quote_with_item`

- Status: **OK**
- Evidencia: migration `20260607150000_quote_engine_priority_1.sql` cria a RPC.

### Persistencia transacional

- Status: **OK**
- Evidencia: a funcao PL/pgSQL insere `quotes` e `quote_items` dentro de uma unica execucao. Se alguma etapa falhar, a funcao falha inteira.

### Validacoes internas

- Status: **OK**
- Evidencia: valida empresa ativa, produto ativo, pedra ativa, cuba ativa quando informada e acabamento ativo quando informado.

### Recalculo server-side

- Status: **Atencao**
- Evidencia: a RPC persiste breakdown recebido do frontend e busca snapshots de catalogo no banco, mas nao recalcula o total no banco.
- Impacto: para MVP e aceitavel; para producao, idealmente a regra de calculo deve ser validada tambem no servidor/RPC.

## Lista de Bugs Encontrados

1. **Snapshot nao exibido em Pedidos**
   - Classificacao: Correcao necessaria
   - Impacto: pedidos antigos podem mostrar nomes atuais de catalogo se produtos, pedras, cubas ou acabamentos forem editados depois.

2. **WhatsApp sem validacao forte de numero**
   - Classificacao: Atencao
   - Impacto: numero sem DDI ou com tamanho invalido pode gerar link incorreto.

## Lista de Inconsistencias

1. `OrdersPage` usa relacionamentos atuais de catalogo em vez de snapshots persistidos.
2. Dashboard nao separa `contacted` em card proprio, embora inclua esse status na listagem e no total estimado.
3. Acabamento linear usa perimetro completo para todos os casos.
4. Quantidade de cuba acompanha quantidade de pecas.
5. WhatsApp pode ser enviado sem salvar pedido antes.
6. RPC nao recalcula total no banco; confia no calculo recebido do frontend.

## Melhorias Recomendadas

1. Exibir snapshots no detalhe de pedidos.
2. Adicionar card de `Contatados` no dashboard ou documentar que `Pedidos novos` significa apenas `submitted`.
3. Validar telefone/WhatsApp em formato brasileiro ou E.164.
4. Criar testes unitarios para `fixed`, `linear_meter`, `percentage`, espessuras 2/3/4 e quantidade maior que 1.
5. Separar quantidade de cubas da quantidade de pecas.
6. Permitir acabamento linear por bordas ou metragem informada.
7. Evoluir a RPC para recalcular ou validar total server-side.
8. Adicionar logs de alteracao de status em `activity_logs`.

## Itens Aprovados

- CRUD de cubas para cadastro, edicao e ativacao/desativacao.
- Reflexo de cubas ativas no simulador.
- CRUD de acabamentos para `fixed`, `linear_meter` e `percentage`.
- Correcao do acabamento percentual sem multiplicacao duplicada por `quantity`.
- Multiplicadores de espessura 2 cm, 3 cm e 4 cm.
- Salvamento transacional via `create_quote_with_item`.
- Persistencia de snapshots em `quote_items`.
- Dashboard basico de novos, em negociacao, fechados, perdidos e valores.
- Atualizacao de status de pedidos.
- Mensagem de WhatsApp com dados principais do orcamento.

## Itens Reprovados

- Exibicao comercial dos snapshots no admin.

## Aprovacao Para Avancar Ao Modulo 3D

Status: **Reprovado para avancar agora como proxima prioridade principal.**

Motivo: a base comercial esta proxima, mas ainda falta corrigir a exibicao dos snapshots no detalhe de pedidos e validar manualmente um pedido completo em ambiente real com os dados seedados. O 3D deve depender de pedidos, catalogo, medidas e valores confiaveis; portanto, a recomendacao e concluir esses ajustes comerciais antes de iniciar o modulo 3D.

Quando os snapshots forem exibidos corretamente no admin e houver validacao ponta a ponta de um pedido real, o projeto pode ser reavaliado para avancar ao 3D.
