# Auditoria do Motor de Orcamento

Data da auditoria: 2026-06-07

Escopo: auditoria do motor de orcamento atual sem alterar codigo, migrations ou regras de banco.

Arquivos e entidades auditados:

- `src/services/quoteCalculator.ts`
- `src/pages/SimulatorPage.tsx`
- `quotes`
- `quote_items`
- `products`
- `stones`
- `sinks`
- `finishes`

## Resumo Executivo

O motor atual funciona como uma estimativa inicial simples. Ele calcula:

Valor total =
pedra por area
+ cuba
+ acabamento

Essa regra e coerente com uma primeira validacao de MVP, mas ainda esta distante do catalogo oficial de regras de orcamento. O documento `CATALOGO_DE_REGRAS_DE_ORCAMENTO.md` define composicao com pedra, acabamentos, cubas, recortes, furacoes, rodabancas, saias, instalacao, frete e margem da marmoraria. Hoje, apenas quatro entidades entram no fluxo do simulador: `products`, `stones`, `sinks` e `finishes`; `products` serve mais como classificacao visual/operacional e nao altera preco.

O maior risco e financeiro: se o valor for apresentado como orcamento real, pode ficar abaixo ou acima do custo correto. A implementacao atual tambem nao persiste o detalhamento do calculo, nao salva snapshot de precos usados, nao e transacional e tem risco de cobranca duplicada em acabamento percentual quando `quantity > 1`.

## Regras de Calculo Atuais

### Area

- Origem: `src/services/quoteCalculator.ts:26`
- Regra atual: `area = width * depth`
- Unidade assumida: metros quadrados, pois a UI pede largura e profundidade em metros.
- Persistencia: `quote_items.width` e `quote_items.depth` gravam os valores informados.

### Pedra

- Origem: `src/services/quoteCalculator.ts:33`
- Regra atual: `stonePrice = area * pricePerM2 * quantity`
- Fonte do preco: `stones.price_per_m2`
- Persistencia: `quote_items.stone_id`, `quote_items.width`, `quote_items.depth`, `quote_items.quantity`, `quote_items.total_price`

### Cuba

- Origem: `src/services/quoteCalculator.ts:46`
- Regra atual: `sinkPrice = sink.price * quantity`
- Fonte do preco: `sinks.price`
- Persistencia: somente `quote_items.sink_id`; o valor da cuba nao e persistido separadamente.

### Acabamento

- Origem: `src/services/quoteCalculator.ts:57`
- Tipos atuais:
  - `fixed`: `price * quantity`
  - `linear_meter`: `((width + depth) * 2) * price * quantity`
  - `percentage`: `basePrice * (price / 100) * quantity`
- Fonte do preco: `finishes.price`
- Persistencia: somente `quote_items.finish_id`; o valor do acabamento nao e persistido separadamente.

### Total

- Origem: `src/services/quoteCalculator.ts:88`
- Regra atual: `total = stonePrice + sinkPrice + finishPrice`
- Persistencia:
  - `quotes.total_price`
  - `quote_items.total_price`
  - `quote_items.unit_price = total / quantity`

## Regras Ausentes Frente ao Catalogo Oficial

- Multiplicador por espessura.
- Multiplicador opcional por pedra.
- Recortes.
- Furacoes.
- Rodabancas.
- Saias.
- Instalacao por valor fixo, metragem ou cidade.
- Frete por valor fixo ou distancia.
- Margem percentual padrao da empresa.
- Margem por categoria de pedra.
- Descontos, cupons, tabelas especiais e comissao de vendedores.
- Regras por ambiente/produto.
- Breakdown persistente do orcamento.
- Snapshot dos precos no momento da simulacao.
- Validacao transacional entre quote e itens.

## Achados Priorizados

### 1. Motor nao cobre a formula oficial de orcamento

- Classificacao: **Critico**
- Local: `src/services/quoteCalculator.ts:88`
- Descricao: o total considera somente pedra, cuba e acabamento. A formula oficial inclui tambem recortes, furacoes, rodabancas, saias, instalacao, frete e margem.
- Risco financeiro: alto risco de subprecificar pedidos reais, especialmente quando instalacao, frete, margem e servicos complementares forem relevantes.
- Risco de orcamento incorreto: cliente pode receber valor estimado muito abaixo do valor comercial final.
- Prioridade de correcao: antes de apresentar o valor como orcamento confiavel.

### 2. Espessura e coletada e persistida, mas nao altera preco

- Classificacao: **Alto**
- Local: `src/pages/SimulatorPage.tsx:281`, `src/pages/SimulatorPage.tsx:352`, `src/services/quoteCalculator.ts:27`
- Descricao: a UI pede espessura em centimetros e grava `quote_items.thickness`, mas o motor ignora esse valor. O catalogo oficial preve multiplicadores por 2 cm, 3 cm e 4 cm.
- Risco financeiro: pedras mais espessas podem ser vendidas com preco de uma espessura base.
- Consistencia UI/banco: a tela sugere que a espessura importa, mas o total nao muda.
- Prioridade de correcao: alta, antes de qualquer demo com comparacao de espessura.

### 3. Acabamento percentual pode cobrar quantidade duas vezes

- Classificacao: **Alto**
- Local: `src/services/quoteCalculator.ts:85`, `src/services/quoteCalculator.ts:97`, `src/pages/SimulatorPage.tsx:373`
- Descricao: `stonePrice` ja inclui `quantity`, e depois `calculateFinishPrice` multiplica novamente por `quantity` para acabamento percentual quando `basePrice` padrao vem de `stonePrice`.
- Exemplo: se a pedra total de 2 pecas ja e R$ 2.000 e acabamento percentual e 10%, o esperado pode ser R$ 200, mas o motor calcula R$ 400.
- Risco financeiro: sobrepreco em orcamentos com quantidade maior que 1.
- Prioridade de correcao: alta, antes de liberar acabamento percentual em catalogo real.

### 4. Persistencia nao salva breakdown do calculo

- Classificacao: **Alto**
- Local: `src/pages/SimulatorPage.tsx:183`, `supabase/migrations/20260606200000_initial_schema.sql:115`, `supabase/migrations/20260606200000_initial_schema.sql:129`
- Descricao: `quotes` e `quote_items` gravam total, unitario e referencias, mas nao gravam `stonePrice`, `sinkPrice`, `finishPrice`, area calculada, margem, frete ou outros componentes.
- Risco financeiro: o admin nao consegue auditar como o total foi formado.
- Persistencia: se precos de catalogo mudarem depois, o sistema perde a explicacao exata do valor original.
- Prioridade de correcao: alta, antes de usar pedidos como base comercial.

### 5. Nao ha snapshot dos precos usados

- Classificacao: **Alto**
- Local: `quote_items.product_id`, `quote_items.stone_id`, `quote_items.sink_id`, `quote_items.finish_id`
- Descricao: o banco guarda FKs para catalogo, mas nao guarda nome/preco historico usado no momento da cotacao.
- Risco financeiro: alterar `stones.price_per_m2`, `sinks.price` ou `finishes.price` pode tornar dificil explicar pedidos antigos.
- Compatibilidade futura: marmorarias precisam de historico de preco por pedido para CRM, renegociacao e auditoria.
- Prioridade de correcao: alta.

### 6. Salvamento de quote e quote_items nao e atomico

- Classificacao: **Alto**
- Local: `src/pages/SimulatorPage.tsx:183`, `src/pages/SimulatorPage.tsx:202`
- Descricao: primeiro insere `quotes`, depois insere `quote_items`. Se o segundo insert falhar, fica um pedido sem item.
- Risco financeiro: dashboard e admin podem mostrar valor total sem detalhamento.
- Persistencia: dados parcialmente salvos exigem limpeza manual ou tratamento posterior.
- Prioridade de correcao: alta, ja mapeada tambem no `AUDIT_REPORT.md`.

### 7. `unit_price` mistura todos os componentes do pedido

- Classificacao: **Medio**
- Local: `src/pages/SimulatorPage.tsx:396`, `src/pages/SimulatorPage.tsx:444`, `supabase/migrations/20260606200000_initial_schema.sql:141`
- Descricao: `unit_price = quote.total / quantity`, incluindo pedra, cuba e acabamento dentro de um unico valor medio.
- Risco financeiro: o valor unitario pode ser interpretado como preco de uma peca, mas inclui componentes que talvez nao escalem linearmente.
- Exemplo: instalacao/frete futuros nao deveriam necessariamente ser divididos por quantidade da mesma forma.
- Prioridade de correcao: media, antes de relatorios comerciais.

### 8. Arredondamento monetario fica implicito no JavaScript

- Classificacao: **Medio**
- Local: `src/services/quoteCalculator.ts:30`, `src/services/quoteCalculator.ts:43`, `src/services/quoteCalculator.ts:107`
- Descricao: o motor usa `number` e nao arredonda componentes monetarios antes de persistir. O banco recebe `numeric(12,2)`, mas a UI calcula com ponto flutuante.
- Risco financeiro: diferencas pequenas podem aparecer entre exibicao, persistencia e somatorios futuros.
- Possivel erro: valores como percentual e area podem gerar casas decimais longas antes de chegar ao banco.
- Prioridade de correcao: media, junto da criacao de testes e politica de arredondamento.

### 9. Produtos nao participam do preco

- Classificacao: **Medio**
- Local: `src/pages/SimulatorPage.tsx:336`, `src/services/quoteCalculator.ts:27`
- Descricao: `products` e obrigatorio para salvar, mas nao influencia preco, regras, compatibilidade de medidas ou ambiente.
- Risco financeiro: produtos diferentes podem exigir regras diferentes e hoje geram o mesmo valor se pedra/medida/opcionais forem iguais.
- Compatibilidade futura: bancadas, soleiras, escadas e peitoris tendem a ter composicoes diferentes.
- Prioridade de correcao: media.

### 10. Ambiente nao filtra nem precifica produtos

- Classificacao: **Medio**
- Local: `src/pages/SimulatorPage.tsx:87`, `src/pages/SimulatorPage.tsx:595`
- Descricao: a UI informa "produtos ativos da empresa para o ambiente", mas a consulta carrega todos os produtos ativos da empresa sem filtro real por ambiente.
- Risco de orcamento incorreto: usuario pode escolher produto incompativel com o ambiente.
- Consistencia UI/banco: nao existe coluna/relacao de compatibilidade por ambiente.
- Prioridade de correcao: media, antes de catalogo amplo.

### 11. Acabamento linear usa perimetro completo automaticamente

- Classificacao: **Medio**
- Local: `src/services/quoteCalculator.ts:76`
- Descricao: acabamento `linear_meter` usa `(width + depth) * 2`. Em marmoraria, alguns acabamentos podem aplicar em bordas especificas, nao necessariamente no perimetro inteiro.
- Risco financeiro: pode superestimar ou subestimar acabamentos lineares dependendo do tipo de peca.
- Compatibilidade futura: precisa permitir metragem linear informada/calculada por regra do produto.
- Prioridade de correcao: media.

### 12. Cubas multiplicam por quantidade de pecas sem regra propria

- Classificacao: **Medio**
- Local: `src/services/quoteCalculator.ts:54`, `src/pages/SimulatorPage.tsx:365`
- Descricao: se `quantity = 2`, o motor cobra duas cubas automaticamente. Isso pode ser correto em alguns casos, mas errado quando ha duas pecas e uma unica cuba.
- Risco financeiro: sobrepreco ou composicao comercial errada.
- Compatibilidade futura: quantidade de cubas deve ser propria ou vinculada a selecao do cliente.
- Prioridade de correcao: media.

### 13. Medidas aceitam valores positivos sem limites comerciais

- Classificacao: **Medio**
- Local: `src/pages/SimulatorPage.tsx:661`, `src/services/quoteCalculator.ts:10`
- Descricao: ha validacao de numero nao negativo e checks no banco para `> 0`, mas nao ha minimo/maximo realista, area maxima, espessuras permitidas ou alerta de chapa.
- Risco financeiro: orcamentos com medidas irreais podem ser salvos.
- Compatibilidade futura: regras de chapa, emenda, transporte e instalacao dependem de limites.
- Prioridade de correcao: media.

### 14. Total exibido e salvo sem aviso forte de estimativa limitada

- Classificacao: **Medio**
- Local: `src/pages/SimulatorPage.tsx:480`, `src/pages/SimulatorPage.tsx:1005`
- Descricao: a UI chama o valor de estimado em alguns pontos, mas nao diferencia claramente que varias regras oficiais ainda nao entram no calculo.
- Risco financeiro: cliente ou vendedor pode tratar o valor como preco final.
- Prioridade de correcao: media.

### 15. Status do pedido comeca como `submitted`, mas schema tambem permite `draft`

- Classificacao: **Baixo**
- Local: `src/pages/SimulatorPage.tsx:192`, `supabase/migrations/20260606200000_initial_schema.sql:122`
- Descricao: o fluxo publico sempre cria pedido como `submitted`. Isso e aceitavel para MVP, mas nao usa `draft`.
- Risco de consistencia: no futuro, carrinho/simulacao parcialmente salva precisara separar rascunho de envio real.
- Prioridade de correcao: baixa.

### 16. Area calculada nao e persistida explicitamente

- Classificacao: **Baixo**
- Local: `src/services/quoteCalculator.ts:91`, `quote_items`
- Descricao: a area aparece no resultado do motor, mas nao e gravada. Ela pode ser recalculada de `width * depth`.
- Risco financeiro: baixo hoje, mas aumenta quando houver regras de arredondamento de area minima ou aproveitamento de chapa.
- Prioridade de correcao: baixa agora; sobe para media quando regras de area minima entrarem.

## Compatibilidade Com Futuras Regras de Marmoraria

O modelo atual e suficiente para uma demonstracao inicial de catalogo simples, mas nao esta pronto para regras comerciais reais. Pontos de incompatibilidade:

- `stones` nao possui multiplicador por pedra nem multiplicador por espessura.
- `finishes` nao permite informar bordas/metragem especifica.
- `products` nao possui tipo de regra, ambiente, area minima ou comportamento de composicao.
- `quote_items` nao registra recortes, furacoes, rodabanca, saia, instalacao, frete ou margem.
- `quotes` nao possui valor de subtotal, desconto, margem, taxa, origem ou validade.
- Nao ha tabela de regra comercial por empresa.
- Nao ha versionamento/snapshot de catalogo por orcamento.

## Consistencia Entre UI e Banco

Pontos consistentes:

- UI usa metros para `width` e `depth`, e o banco armazena numericos positivos.
- UI usa centimetros para `thickness`, e o banco armazena `thickness`.
- UI salva `company_id`, `product_id`, `stone_id`, `sink_id`, `finish_id`, `quantity`, `unit_price` e `total_price`.
- Campos de catalogo usados no simulador existem no banco: `products.active`, `stones.price_per_m2`, `sinks.price`, `finishes.pricing_type`, `finishes.price`.

Pontos inconsistentes ou incompletos:

- Espessura existe na UI/banco, mas nao no calculo.
- Produto e ambiente existem no fluxo, mas nao no calculo.
- `unit_price` nao representa apenas preco da pedra ou do produto; representa media do total.
- Breakdown exibido na lateral nao e persistido por componente.
- O banco permite `numeric(12,2)`, mas o motor nao define arredondamento antes de inserir.
- `quote_items` nao garante, no schema inicial, que `company_id` do item seja igual ao `company_id` da quote; a RLS recente reduz o risco em insert publico, mas a integridade estrutural ainda nao esta no schema.

## Plano de Correcao Priorizado

### Prioridade 1 - Antes de usar como orcamento comercial

1. Definir politica oficial de arredondamento: por componente ou somente no total.
2. Corrigir acabamento percentual com `quantity > 1`.
3. Aplicar multiplicador de espessura ou remover a expectativa de que espessura altera preco ate a regra existir.
4. Persistir breakdown minimo: pedra, cuba, acabamento, area, subtotal e total.
5. Salvar snapshot dos nomes/precos usados no momento do pedido.
6. Tornar salvamento de `quotes` + `quote_items` transacional.

### Prioridade 2 - Antes de catalogo real amplo

1. Incluir regras de recortes e furacoes.
2. Incluir rodabanca e saia com metragem propria.
3. Separar quantidade de cubas da quantidade de pecas.
4. Permitir acabamento linear por bordas/metragem configurada.
5. Modelar compatibilidade entre ambiente, produto e regras de calculo.
6. Criar testes unitarios para area, pedra, cuba, acabamento fixo, linear, percentual e quantidade.

### Prioridade 3 - Antes de beta com marmoraria real

1. Incluir instalacao, frete e margem por empresa.
2. Criar regras comerciais configuraveis por empresa.
3. Versionar catalogo/regras para manter historico de orcamentos antigos.
4. Adicionar validacoes de limites de medidas, espessuras permitidas e area minima.
5. Registrar logs de alteracao de status e eventual ajuste de valor.

### Prioridade 4 - Evolucao posterior

1. Descontos promocionais.
2. Cupons.
3. Tabelas especiais.
4. Comissao de vendedores.
5. Regras de marketplace.

## Conclusao

O motor atual deve continuar sendo tratado como estimativa inicial. Ele e util para validar fluxo, catalogo e captura de lead, mas nao deve ser usado como preco final sem as correcoes de prioridade 1. O principal risco nao e tecnico isolado; e comercial: o sistema pode gerar uma expectativa de preco que a marmoraria nao consegue cumprir ou justificar depois.
