# Validacao Pos-Correcao Comercial

Data da validacao: 2026-06-07

Escopo: validacao curta apos a correcao da exibicao de snapshots no painel de pedidos.

Esta validacao nao altera codigo, banco, migrations, simulador, motor de orcamento, RLS ou visual. A analise foi feita por leitura de `PROJECT_RULES.md`, `COMMERCIAL_VALIDATION_REPORT.md`, `QUOTE_ENGINE_FIX_REPORT.md` e dos fluxos envolvidos no codigo atual.

## Resumo Executivo

O item reprovado da consolidacao comercial foi corrigido: o painel de pedidos agora consulta e exibe os snapshots persistidos em `quote_items`, mantendo fallback para pedidos antigos.

Resultado geral: **Aprovado com atencoes**.

O projeto fica liberado para iniciar a preparacao do modulo 3D, desde que a proxima fase trate o 3D como camada visual sobre o fluxo comercial existente, sem alterar regras de orcamento sem nova auditoria.

## Itens Validados

### Pedidos exibem snapshots corretamente

- Status: **Aprovado**
- Evidencia: `src/pages/admin/OrdersPage.tsx` passou a selecionar os campos de snapshot em `quote_items`.
- Campos exibidos:
  - `product_name_snapshot`
  - `stone_name_snapshot`
  - `sink_name_snapshot`
  - `finish_name_snapshot`
  - `stone_price_per_m2_snapshot`
  - `sink_unit_price_snapshot`
  - `finish_unit_price_snapshot`
  - `finish_pricing_type_snapshot`
  - `calculated_area`
  - `stone_price_snapshot`
  - `sink_price_snapshot`
  - `finish_price_snapshot`
  - `thickness_multiplier`
  - `subtotal_snapshot`
  - `total_snapshot`
- Impacto: o admin consegue visualizar o estado comercial do pedido no momento da solicitacao, mesmo que catalogo e precos sejam alterados depois.

### Pedidos antigos continuam funcionando com fallback

- Status: **Aprovado**
- Evidencia: quando um snapshot de nome nao existe, a tela cai para os relacionamentos atuais (`products`, `stones`, `sinks`, `finishes`).
- Evidencia adicional: campos numericos ausentes exibem mensagens como `Nao registrado` ou, no caso do total snapshot ausente, usam `total_price`.
- Impacto: pedidos criados antes da migration de snapshot continuam abrindo no painel.

### Status do pedido continua atualizando

- Status: **Aprovado**
- Evidencia: a funcao `updateQuoteStatus` continua atualizando apenas `quotes.status` por `id` e `company_id`.
- Observacao: a correcao de snapshot nao alterou a listagem, o seletor de status nem o estado local de pedidos.

### Dashboard continua carregando

- Status: **Aprovado**
- Evidencia: `AdminDashboardPage` segue consultando `quotes` por `company_id`, filtrando status comerciais e calculando indicadores a partir de `total_price`.
- Observacao: a tela de dashboard nao depende de `quote_items`, portanto a alteracao em pedidos nao afeta o carregamento dos indicadores.

### Simulador continua salvando orçamento

- Status: **Aprovado**
- Evidencia: `SimulatorPage` continua usando a RPC `create_quote_with_item`.
- Evidencia adicional: o simulador continua enviando breakdown minimo para a RPC:
  - area calculada
  - valores calculados de pedra, cuba e acabamento
  - multiplicador de espessura
  - subtotal
  - total
- Impacto: o salvamento transacional de `quotes` e `quote_items` permanece preservado.

### WhatsApp continua funcionando

- Status: **Aprovado**
- Evidencia: `handleWhatsAppRequest` continua montando o link `https://wa.me/` com o numero da empresa e mensagem gerada por `buildWhatsAppMessage`.
- Dados enviados: ambiente, produto, pedra, cuba, acabamento, medidas, quantidade e valor estimado.
- Atencao remanescente: a normalizacao ainda remove apenas caracteres nao numericos e nao valida DDI, tamanho ou formato E.164.

### Build e lint passam

- Status: **Aprovado**
- Evidencia: validacoes executadas nesta tarefa.
- `npm run lint`: aprovado.
- `npm run build`: aprovado.
- Atencao: o build continua emitindo aviso do Vite sobre chunks acima de 500 kB. Nao e bloqueio para esta fase.

## Atencoes Remanescentes

1. **Validacao forte do WhatsApp**
   - Classificacao: **Atencao**
   - Motivo: numero da empresa ainda pode gerar link incorreto se estiver sem DDI ou em formato invalido.

2. **RPC nao recalcula totais no banco**
   - Classificacao: **Atencao**
   - Motivo: a RPC valida empresa e catalogo, mas persiste o breakdown calculado pelo frontend.

3. **Regras comerciais futuras ainda nao implementadas**
   - Classificacao: **Atencao**
   - Motivo: recortes, furacoes, rodabancas, saias, instalacao, frete e margem ainda estao fora do MVP atual.

4. **Dashboard ainda nao separa `contacted` em card proprio**
   - Classificacao: **Atencao**
   - Motivo: o status existe no funil, mas nao possui indicador separado.

## Resultado da Validacao

- Pedidos com snapshots: **Aprovado**
- Fallback para pedidos antigos: **Aprovado**
- Atualizacao de status: **Aprovado**
- Dashboard: **Aprovado**
- Salvamento do simulador: **Aprovado**
- WhatsApp: **Aprovado com atencao**
- Lint: **Aprovado**
- Build: **Aprovado**

## Liberacao para Modulo 3D

Status: **Liberado para iniciar preparacao do modulo 3D**.

A liberacao e para preparacao tecnica e visual do modulo 3D, nao para alterar regras comerciais. O modulo 3D deve consumir o fluxo comercial atual sem mudar calculo, persistencia, RLS ou isolamento multiempresa sem nova tarefa especifica.

