# Relatorio de Correcao do Motor de Orcamento

Data: 2026-06-07

Escopo: correcao dos itens de Prioridade 1 da auditoria `QUOTE_ENGINE_AUDIT.md`.

## O Que Foi Corrigido

- Definida politica oficial de arredondamento monetario.
- Corrigido acabamento percentual para nao multiplicar `quantity` duas vezes.
- Incluido multiplicador de espessura no calculo da pedra.
- Expandido o breakdown retornado pelo motor.
- Criada migration segura para persistir snapshots minimos em `quote_items`.
- Criada RPC transacional `public.create_quote_with_item`.
- Atualizado o simulador para salvar por RPC, sem alterar o fluxo de etapas.

## Politica de Arredondamento

Valores monetarios sao arredondados para 2 casas decimais no motor de orcamento usando `roundMoney`.

Componentes arredondados:

- `stonePrice`
- `sinkPrice`
- `finishPrice`
- `subtotal`
- `total`
- `unitPrice`

A politica atual arredonda cada componente monetario antes de compor o subtotal. Como ainda nao existem desconto, frete, instalacao ou margem, `total` e igual a `subtotal`.

## Multiplicador de Espessura

O motor aplica o multiplicador diretamente no preco da pedra:

`stonePrice = area * pricePerM2 * thicknessMultiplier * quantity`

Tabela atual:

- 2 cm: `1.00`
- 3 cm: `1.15`
- 4 cm: `1.30`
- espessura nao reconhecida: `1.00`

A espessura informada e normalizada para 2 casas decimais antes da resolucao do multiplicador. Valores como `2`, `2.0` e `2.00` usam `1.00`; valores nao reconhecidos, como `2.5`, tambem usam `1.00`.

## Acabamento Percentual

Antes, acabamento percentual podia multiplicar `quantity` duas vezes porque o `basePrice` padrao ja vinha de `stonePrice`, que ja inclui quantidade.

Agora, para `percentage`, o calculo e:

`finishPrice = basePrice * (price / 100)`

Para `fixed` e `linear_meter`, `quantity` continua sendo aplicada como antes.

## Breakdown Retornado

`calculateQuoteTotal` passa a retornar:

- `area`
- `stonePrice`
- `sinkPrice`
- `finishPrice`
- `thicknessMultiplier`
- `subtotal`
- `total`

## Snapshot Persistido

A migration `20260607150000_quote_engine_priority_1.sql` adiciona campos em `quote_items` para armazenar o estado minimo do calculo e do catalogo no momento do pedido:

- `calculated_area`
- `stone_price_snapshot`
- `sink_price_snapshot`
- `finish_price_snapshot`
- `thickness_multiplier`
- `subtotal_snapshot`
- `total_snapshot`
- `product_name_snapshot`
- `stone_name_snapshot`
- `sink_name_snapshot`
- `finish_name_snapshot`
- `stone_price_per_m2_snapshot`
- `sink_unit_price_snapshot`
- `finish_unit_price_snapshot`
- `finish_pricing_type_snapshot`

Os snapshots de nomes e precos de catalogo sao buscados pela RPC diretamente no banco a partir dos IDs recebidos. Isso reduz dependencia de dados enviados pelo frontend.

## Transacao

Foi criada a RPC `public.create_quote_with_item`.

Ela executa em uma unica transacao de banco:

1. valida se a empresa esta ativa;
2. valida se produto e pedra pertencem a empresa e estao ativos;
3. valida cuba e acabamento quando informados;
4. insere `quotes`;
5. insere `quote_items` com breakdown e snapshot;
6. retorna o `quote_id`.

Se qualquer etapa falhar, a funcao falha inteira e nenhum pedido parcial deve permanecer salvo.

## Riscos Remanescentes

- O motor ainda nao implementa recortes, furacoes, rodabancas, saias, instalacao, frete e margem.
- Multiplicadores de espessura ainda sao fixos no codigo, nao configuraveis por empresa.
- Produto e ambiente ainda nao alteram regra de preco.
- Quantidade de cuba ainda acompanha quantidade de pecas.
- Acabamento linear ainda usa o perimetro completo.
- A RPC valida catalogo e empresa, mas nao recalcula o total no banco; ela persiste o breakdown calculado pelo frontend.
- O painel admin ainda nao exibe os novos campos de breakdown/snapshot.
