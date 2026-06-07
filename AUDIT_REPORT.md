# Relatorio de Auditoria do MVP

Data da auditoria: 2026-06-07

Objetivo: auditar o MVP atual antes de avancar para a etapa de visualizacao 3D, sem implementar novas funcionalidades.

## Resumo Executivo

O projeto ja possui uma base funcional relevante para um MVP controlado: frontend React, rotas principais, autenticacao Supabase, painel administrativo, CRUDs de catalogo, simulador 2D, motor inicial de orcamento, salvamento de pedidos, WhatsApp, dashboard e configuracoes da empresa.

O principal bloqueador antes de teste real e apresentacao comercial e a camada de seguranca no Supabase. A migration habilita RLS, mas ainda nao cria policies. Isso tende a bloquear as telas reais com anon/auth key ou, se for contornado manualmente, pode deixar o isolamento multiempresa dependente demais do frontend. Antes do 3D, a prioridade deve ser fechar RLS, vinculo seguro usuario-empresa, fluxo de seed/teste e consistencia do calculo.

## Areas Auditadas

- Estrutura do projeto: adequada para crescimento incremental.
- Rotas: completas para o MVP atual.
- Autenticacao: funcional como base, mas ainda dependente de vinculo temporario por e-mail.
- Supabase: cliente criado e usado em admin/simulador.
- Migration: schema coerente, com RLS habilitado e sem policies.
- RLS: bloqueador atual.
- Isolamento por company_id: existe no frontend, mas precisa ser garantido no banco.
- Admin: estrutura real ja iniciada.
- CRUD de produtos: funcional, com pontos de validacao a melhorar.
- CRUD de pedras: funcional, com pontos de validacao a melhorar.
- CRUD de cubas: funcional, com pontos de validacao a melhorar.
- CRUD de acabamentos: funcional, com pequena divergencia de nomenclatura.
- Simulador: fluxo em etapas funcionando com catalogo real.
- Motor de orcamento: correto para a formula inicial, incompleto para regras finais.
- Salvamento de orcamento: funcional, mas nao atomico.
- WhatsApp: funcional, dependente de telefone valido da empresa.
- Dashboard: funcional com dados reais.
- Pedidos: funcional com listagem, detalhes e alteracao de status.
- Configuracoes da empresa: funcional, respeitando company_id resolvido.
- Responsividade: base responsiva com grids e overflow horizontal.
- Bugs, riscos, retrabalho e melhorias: listados abaixo.

## Achados Priorizados

### 1. RLS habilitado sem policies

- Classificacao: Crítico
- Arquivo relacionado: `supabase/migrations/20260606200000_initial_schema.sql:198`
- Descricao do problema: todas as tabelas principais tem RLS habilitado, mas nao existem policies de select, insert, update ou delete.
- Impacto: com anon/auth key, o admin, simulador, CRUDs, dashboard, pedidos e configuracoes podem falhar por permissao. Se alguem desabilitar RLS manualmente para testar, o isolamento multiempresa fica fragil.
- Sugestao de correcao: criar uma migration especifica de RLS com funcoes auxiliares de membership, policies por `company_id`, policies publicas limitadas para simulador e policies autenticadas para admin.
- Prioridade: antes de qualquer apresentacao real.

### 2. Isolamento multiempresa depende do frontend

- Classificacao: Crítico
- Arquivo relacionado: `src/admin/company.ts:8`, `src/pages/admin/OrdersPage.tsx:96`, `src/pages/SimulatorPage.tsx:145`
- Descricao do problema: as telas filtram por `company_id`, mas a garantia forte ainda nao esta no banco por falta de policies.
- Impacto: filtros de frontend ajudam a organizar a UI, mas nao sao uma barreira de seguranca. Em um SaaS multiempresa, a regra precisa ser imposta no Supabase.
- Sugestao de correcao: implementar policies que permitam acesso apenas a registros da empresa vinculada ao usuario autenticado, alem de regras especificas para leitura publica do catalogo ativo do simulador.
- Prioridade: antes de teste com usuarios externos.

### 3. Vinculo usuario-empresa temporario por e-mail

- Classificacao: Alto
- Arquivo relacionado: `src/admin/company.ts:13`
- Descricao do problema: o painel resolve a empresa buscando `public.users.email = auth.user.email`.
- Impacto: funciona para MVP manual, mas e fragil para producao. Troca de e-mail, duplicidade entre empresas, ausencia de FK para `auth.users` e falta de papel efetivo podem causar erro de acesso ou manutencao dificil.
- Sugestao de correcao: adicionar relacionamento formal entre usuario autenticado e usuario de negocio, preferencialmente com `auth_user_id uuid` vinculado a `auth.users(id)`, e usar esse id nas policies.
- Prioridade: antes de onboarding real de marmorarias.

### 4. Salvamento de orcamento nao e atomico

- Classificacao: Alto
- Arquivo relacionado: `src/pages/SimulatorPage.tsx:183`
- Descricao do problema: primeiro insere `quotes`, depois insere `quote_items`.
- Impacto: se a segunda insercao falhar, pode ficar um pedido salvo sem item relacionado, prejudicando painel, dashboard e atendimento.
- Sugestao de correcao: criar RPC no Supabase para salvar quote e quote_items em transacao, ou implementar rollback controlado caso a segunda etapa falhe.
- Prioridade: antes de validar fluxo comercial real.

### 5. `company_id` publico do simulador e controlado pelo cliente

- Classificacao: Alto
- Arquivo relacionado: `src/pages/SimulatorPage.tsx:104`
- Descricao do problema: o simulador usa `VITE_SIMULATOR_COMPANY_ID`, variavel publica do frontend, para escolher a empresa.
- Impacto: qualquer pessoa pode inspecionar ou alterar o valor em um build local. Sem RLS bem desenhada, isso pode expor catalogos ou permitir criar pedidos em empresas indevidas.
- Sugestao de correcao: tratar o identificador publico por slug/rota da empresa e criar policies publicas que liberem somente leitura de empresas ativas e catalogos ativos, com insert restrito de leads apenas para a empresa publica resolvida.
- Prioridade: antes de disponibilizar o simulador publicamente.

### 6. Cliente Supabase usa fallback placeholder

- Classificacao: Medio
- Arquivo relacionado: `src/lib/supabase.ts:8`
- Descricao do problema: quando as variaveis de ambiente nao existem, o app cria um cliente com URL e anon key placeholder.
- Impacto: chamadas acidentais podem tentar acessar um endpoint inexistente e produzir erros confusos.
- Sugestao de correcao: centralizar guards de configuracao ou falhar de forma explicita em ambientes que exigem Supabase. Para telas publicas, manter mensagens claras quando `hasSupabaseConfig` for falso.
- Prioridade: antes de empacotar ambiente de demo.

### 7. Motor de orcamento ainda cobre somente formula inicial

- Classificacao: Medio
- Arquivo relacionado: `src/services/quoteCalculator.ts:88`
- Descricao do problema: o calculo considera pedra, cuba e acabamento. Ainda nao calcula espessura com multiplicador, recortes, furacoes, rodabanca, saia, instalacao, frete e margem.
- Impacto: o valor exibido nao representa o catalogo completo de regras de orcamento documentado.
- Sugestao de correcao: antes de apresentar como orcamento confiavel, deixar claro que e estimativa inicial ou ampliar o motor conforme `CATALOGO_DE_REGRAS_DE_ORCAMENTO.md`.
- Prioridade: antes de venda comercial; pode ser apos validacao tecnica inicial.

### 8. Possivel cobranca duplicada em acabamento percentual com quantidade maior que 1

- Classificacao: Medio
- Arquivo relacionado: `src/services/quoteCalculator.ts:85`, `src/services/quoteCalculator.ts:97`
- Descricao do problema: `stonePrice` ja inclui quantidade, e o acabamento percentual multiplica novamente por `quantity`.
- Impacto: quando o acabamento for percentual e quantidade for maior que 1, o acabamento pode ser calculado acima do esperado.
- Sugestao de correcao: definir se `basePrice` percentual deve ser unitario ou total. Ajustar funcao e adicionar testes cobrindo quantidade 1 e maior que 1.
- Prioridade: antes de usar acabamento percentual em catalogo real.

### 9. Ausencia de testes automatizados para calculo

- Classificacao: Medio
- Arquivo relacionado: `src/services/quoteCalculator.ts:26`
- Descricao do problema: nao ha testes automatizados cobrindo area, pedra, cuba, acabamento fixo, linear e percentual.
- Impacto: alteracoes futuras no motor podem quebrar preco sem alerta.
- Sugestao de correcao: adicionar estrutura de testes unitarios para `quoteCalculator.ts` antes de expandir as regras.
- Prioridade: antes de ampliar o motor de orcamento.

### 10. Dados sensiveis de lead ficam legiveis no admin sem politica de papel

- Classificacao: Alto
- Arquivo relacionado: `src/pages/admin/OrdersPage.tsx:90`, `supabase/migrations/20260606200000_initial_schema.sql:115`
- Descricao do problema: pedidos guardam nome, telefone e e-mail. O app ainda nao diferencia permissoes por `owner`, `manager` e `salesperson` nas consultas.
- Impacto: quando houver varios usuarios por empresa, todos podem acabar acessando os mesmos dados sensiveis sem regra granular.
- Sugestao de correcao: aplicar roles nas policies e na UI, definindo quais papeis podem ver pedidos, alterar status e editar configuracoes.
- Prioridade: antes de convidar equipe real da marmoraria.

### 11. Status comercial nao gera historico

- Classificacao: Medio
- Arquivo relacionado: `src/pages/admin/OrdersPage.tsx:208`, `supabase/migrations/20260606200000_initial_schema.sql:155`
- Descricao do problema: a tela altera o status do pedido, mas nao registra evento em `activity_logs`.
- Impacto: perde-se rastreabilidade de quem alterou status e quando.
- Sugestao de correcao: registrar log nas acoes de status, edicao de catalogo e configuracoes quando a camada de usuario estiver estabilizada.
- Prioridade: antes de uso com vendedores.

### 12. Nao ha `updated_at` nas tabelas editaveis

- Classificacao: Medio
- Arquivo relacionado: `supabase/migrations/20260606200000_initial_schema.sql:6`
- Descricao do problema: as tabelas possuem `created_at`, mas nao possuem `updated_at`.
- Impacto: dificulta auditoria, ordenacao por ultima alteracao e suporte.
- Sugestao de correcao: adicionar `updated_at` com trigger padrao em migration futura.
- Prioridade: antes de operacao real continua.

### 13. Categorias ainda nao sao gerenciadas

- Classificacao: Medio
- Arquivo relacionado: `src/pages/admin/ProductsPage.tsx`, `src/pages/admin/StonesPage.tsx`
- Descricao do problema: `category_id` existe, mas fica opcional e sem CRUD de categorias.
- Impacto: catalogos maiores ficam desorganizados e o simulador nao filtra produtos por ambiente/categoria real.
- Sugestao de correcao: implementar CRUD de categorias de produto e pedra antes de ampliar catalogo real.
- Prioridade: pode esperar se a demo tiver catalogo pequeno.

### 14. Simulador nao filtra produtos por ambiente

- Classificacao: Medio
- Arquivo relacionado: `src/pages/SimulatorPage.tsx:595`
- Descricao do problema: a etapa de produto mostra produtos ativos da empresa, mas nao aplica filtro real por ambiente.
- Impacto: em catalogo real, o cliente pode escolher combinacoes fora do contexto.
- Sugestao de correcao: modelar relacao entre ambiente, categoria e produto, ou mapear produtos compativeis por empresa.
- Prioridade: antes de demonstracao com catalogo amplo.

### 15. Validacao de telefone e WhatsApp e basica

- Classificacao: Medio
- Arquivo relacionado: `src/pages/SimulatorPage.tsx:270`, `src/pages/CompanySettingsPage.tsx:174`
- Descricao do problema: o numero e normalizado removendo caracteres nao numericos, mas nao ha validacao de DDI, tamanho minimo ou formato esperado.
- Impacto: WhatsApp pode abrir link invalido ou enviar para numero incorreto.
- Sugestao de correcao: validar formato E.164 ou regra brasileira com DDI antes de salvar e antes de abrir o WhatsApp.
- Prioridade: antes de demo comercial.

### 16. Campos de URL externa sem validacao operacional

- Classificacao: Baixo
- Arquivo relacionado: `src/pages/admin/StonesPage.tsx`, `src/pages/admin/CompanySettingsPage.tsx:173`
- Descricao do problema: `image_url` e `logo_url` aceitam URLs externas sem validacao de origem ou disponibilidade.
- Impacto: imagens quebradas, rastreamento por terceiros ou conteudo inconsistente podem aparecer na demonstracao.
- Sugestao de correcao: validar protocolo `https`, tratar erro visual e futuramente migrar para Supabase Storage.
- Prioridade: pode esperar, mas revisar antes de usar imagens reais.

### 17. Documentacao de estado atual esta desatualizada

- Classificacao: Medio
- Arquivo relacionado: `README.md:20`
- Descricao do problema: o README ainda afirma que o repositorio esta na fase de fundacao documental e que nao ha frontend, banco ou Supabase.
- Impacto: confunde continuidade do projeto e onboarding tecnico.
- Sugestao de correcao: atualizar o README em tarefa dedicada para refletir que o MVP ja possui frontend, Supabase, admin e simulador.
- Prioridade: antes de compartilhar o repositorio com terceiros.

### 18. Sem checklist automatizado de RLS/build/teste de banco

- Classificacao: Medio
- Arquivo relacionado: `MVP_TEST_CHECKLIST.md`, `supabase/migrations/20260606200000_initial_schema.sql`
- Descricao do problema: existe checklist manual, mas nao ha validacao automatizada de policies, acesso por empresa ou integridade do fluxo quote/quote_items.
- Impacto: regressao de seguranca pode passar despercebida.
- Sugestao de correcao: adicionar testes manuais guiados para RLS agora e, depois, testes automatizados ou scripts de validacao com usuarios de empresas diferentes.
- Prioridade: antes de multiempresa real.

### 19. Unidade de medida precisa ficar mais explicita no produto

- Classificacao: Baixo
- Arquivo relacionado: `src/pages/SimulatorPage.tsx:651`
- Descricao do problema: largura e profundidade sao em metros, espessura em centimetros, e o banco grava numeros sem unidade explicita no nome da coluna.
- Impacto: risco de cadastro/uso com unidade errada em operacao real.
- Sugestao de correcao: padronizar nomes/documentacao tecnica como `width_m`, `depth_m`, `thickness_cm` em evolucao futura ou reforcar labels e validacoes.
- Prioridade: pode esperar, mas deve ser decidido antes de integracoes.

### 20. Unit price do item mistura componentes do orcamento

- Classificacao: Baixo
- Arquivo relacionado: `src/pages/SimulatorPage.tsx:396`, `supabase/migrations/20260606200000_initial_schema.sql:141`
- Descricao do problema: `unit_price` recebe `total / quantity`, somando pedra, cuba e acabamento em um unico valor.
- Impacto: dificulta explicar o preco e reconstruir o detalhamento depois.
- Sugestao de correcao: persistir breakdown do orcamento ou colunas separadas para pedra, cuba, acabamento e regras futuras.
- Prioridade: antes de relatorios financeiros; pode esperar para demo inicial.

### 21. Fluxo permite navegar etapas sem validar escolhas anteriores

- Classificacao: Baixo
- Arquivo relacionado: `src/pages/SimulatorPage.tsx:541`
- Descricao do problema: o indicador de progresso permite clicar diretamente em qualquer etapa.
- Impacto: usuario pode chegar ao resumo sem escolhas consistentes, embora o botao de salvar bloqueie dados obrigatorios.
- Sugestao de correcao: bloquear avancos invalidos ou exibir pendencias por etapa.
- Prioridade: pode esperar se a demo for assistida.

### 22. CRUDs dependem de validacao HTML para alguns campos obrigatorios

- Classificacao: Baixo
- Arquivo relacionado: `src/pages/admin/ProductsPage.tsx`, `src/pages/admin/SinksPage.tsx`, `src/pages/admin/FinishesPage.tsx`
- Descricao do problema: parte da validacao obrigatoria fica no HTML e parte no TypeScript.
- Impacto: valores com espacos ou estados inconsistentes podem passar em alguns formularios.
- Sugestao de correcao: padronizar validacao com `trim`, mensagens consistentes e regras por formulario.
- Prioridade: antes de catalogo real extenso.

### 23. Nomenclatura de acabamento linear diverge da documentacao da tarefa

- Classificacao: Observacao
- Arquivo relacionado: `src/pages/admin/FinishesPage.tsx`, `supabase/migrations/20260606200000_initial_schema.sql:86`
- Descricao do problema: o sistema usa `linear_meter`, enquanto a tarefa sugeria `per_linear_meter`.
- Impacto: nao quebra o app, porque migration, tipos e calculadora usam o mesmo valor. Pode confundir documentacao e equipe.
- Sugestao de correcao: documentar oficialmente o valor tecnico escolhido ou migrar tudo para `per_linear_meter`.
- Prioridade: baixa.

### 24. Mensagem do README promete 3D como experiencia atual

- Classificacao: Observacao
- Arquivo relacionado: `README.md:5`
- Descricao do problema: o texto fala em visualizar em 3D, mas o MVP atual esta em simulador 2D inicial.
- Impacto: expectativa de demonstracao pode ficar desalinhada.
- Sugestao de correcao: ajustar a redacao para distinguir visao de produto e estado atual do MVP.
- Prioridade: antes de apresentacao externa.

## Pontos Positivos

- Estrutura tecnica moderna com React, Vite, TypeScript, Tailwind, React Router e React Query.
- Separacao clara entre paginas publicas, autenticacao, admin, servicos e tipos.
- Migration cobre as entidades centrais do modelo SaaS multiempresa.
- Todas as tabelas principais possuem UUID, `company_id` quando aplicavel, `created_at` e indices basicos.
- RLS ja foi habilitado, indicando direcao correta de seguranca.
- CRUDs de produtos, pedras, cubas e acabamentos ja seguem padrao visual e funcional semelhante.
- Simulador ja usa catalogo real do Supabase e calcula valor em tempo real.
- Admin ja lista pedidos reais, altera status e mostra detalhes.
- Dashboard ja calcula indicadores a partir de `quotes`.
- Configuracoes da empresa ja respeitam a empresa vinculada ao usuario.
- WhatsApp ja monta mensagem com os dados principais do orcamento.
- Projeto possui documentacao rica de produto, escopo, UX, banco, admin, regras de orcamento e roadmap.

## O Que Esta Pronto Para Teste Real Controlado

- Login com Supabase, desde que exista usuario autenticado e registro correspondente em `public.users`.
- Navegacao entre Home, Simulador, Login e Admin.
- CRUD inicial de produtos, pedras, cubas e acabamentos.
- Configuracao manual de dados da empresa.
- Simulador 2D com catalogo ativo real.
- Calculo estimado simples com pedra, cuba e acabamento.
- Salvamento de pedido e item, desde que as permissoes do Supabase permitam.
- Listagem de pedidos, detalhes e alteracao de status.
- Dashboard operacional simples.
- Abertura do WhatsApp com mensagem formatada.

## O Que Precisa Ser Corrigido Antes de Apresentar Para Uma Marmoraria

1. Implementar policies RLS para admin e simulador.
2. Formalizar vinculo entre usuario autenticado e empresa.
3. Validar acesso multiempresa com pelo menos duas empresas de teste.
4. Tornar salvamento de quote e quote_items atomico.
5. Definir claramente que o valor atual e uma estimativa simples ou ampliar regras de calculo essenciais.
6. Corrigir calculo percentual com quantidade maior que 1.
7. Validar WhatsApp da empresa antes de demonstrar.
8. Atualizar README para refletir o estado real do MVP.
9. Criar dados demo consistentes sem depender de alteracoes manuais inseguras.
10. Executar o checklist manual completo em desktop e mobile.

## O Que Pode Esperar Para Depois

- Visualizacao 3D avancada.
- Renderizacao fotorrealista.
- Realidade aumentada.
- Marketplace nacional de marmorarias.
- CRM completo.
- ERP, financeiro e estoque.
- Upload real de imagens em Supabase Storage.
- Exportacao PDF/CAD.
- Graficos avancados no dashboard.
- Distribuicao automatica de leads.

## Melhorias Obrigatorias Antes do 3D

Antes de investir no motor 3D, recomenda-se concluir:

- RLS e policies por `company_id`.
- Vinculo seguro `auth.users` -> usuario interno -> empresa.
- Policies publicas controladas para catalogo ativo do simulador.
- Insercao transacional de orcamento.
- Testes unitarios do motor de orcamento.
- Correcao da regra percentual de acabamento.
- Validacao manual multiempresa.
- Atualizacao do README e do checklist operacional.

Esses itens reduzem retrabalho porque o 3D vai depender diretamente de catalogo, produto, pedra, medidas, empresa ativa e persistencia de orcamento.

## Conclusao

O MVP esta em bom estado para uma base inicial, mas ainda nao esta pronto para exposicao externa sem ajustes de seguranca e integridade. O proximo passo mais importante nao e o 3D: e garantir que o Supabase aplique corretamente as regras multiempresa e que o fluxo de orcamento salve dados consistentes.
