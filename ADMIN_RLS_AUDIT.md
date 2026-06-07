# Auditoria de RLS do Painel Administrativo

Data da auditoria: 2026-06-07

Escopo: auditoria exclusiva das RLS policies necessarias para o painel administrativo nas tabelas `companies`, `users`, `products`, `stones`, `sinks`, `finishes`, `cutouts`, `drillings`, `quotes`, `quote_items`, `attachments` e `activity_logs`.

Esta tarefa nao implementa correcoes, nao altera codigo, nao altera migrations, nao cria policies e nao executa SQL destrutivo. O objetivo e documentar o desenho minimo e o desenho ideal de seguranca para orientar uma tarefa futura.

## Contexto Encontrado

- A migration inicial habilita RLS em todas as tabelas principais.
- Nao existem policies criadas na migration atual.
- O painel administrativo resolve a empresa do usuario autenticado consultando `public.users` por `email` e `active = true`.
- As telas administrativas filtram dados por `company_id` no frontend.
- O simulador publico le catalogos ativos e insere `quotes` e `quote_items`.
- O schema atual nao possui `auth_user_id` em `public.users`; por isso, o vinculo entre Supabase Auth e usuario interno depende de `auth.jwt()->>'email'` ou de `auth.users.email` exposto via JWT.

## Resumo dos Bloqueios Atuais

1. **Critico - RLS habilitado sem policies**: o painel admin tende a falhar em `select`, `insert` e `update` usando a anon/auth key.
2. **Critico - isolamento multiempresa depende do frontend**: filtros `.eq('company_id', ...)` organizam a UI, mas nao impedem acesso direto indevido via API.
3. **Alto - vinculo por e-mail e temporario**: e-mail pode mudar, pode haver duplicidade entre empresas no futuro e nao existe FK para `auth.users`.
4. **Alto - roles ainda nao protegem acoes sensiveis**: `owner`, `manager` e `salesperson` existem no schema, mas nao ha enforcement no banco.
5. **Alto - dados pessoais de leads exigem protecao forte**: `quotes` guarda nome, telefone e e-mail do cliente.
6. **Medio - catalogo publico precisa de policies separadas**: simulador deve ler somente dados ativos de empresas ativas, sem liberar CRUD anonimo.

## Modelo de Isolamento Recomendado

### Regra minima para o admin funcionar

O usuario autenticado deve acessar apenas registros da empresa encontrada em `public.users` quando:

- `public.users.email = auth.jwt()->>'email'`
- `public.users.active = true`
- `public.users.company_id = <linha>.company_id`
- para a propria empresa, `companies.id = public.users.company_id`

Essa abordagem usa o modelo atual sem exigir mudanca imediata de schema.

### Regra ideal para producao

Criar uma coluna futura `public.users.auth_user_id uuid` vinculada ao usuario do Supabase Auth e basear as policies em:

- `auth.uid() = public.users.auth_user_id`
- `public.users.active = true`
- `public.users.company_id = <linha>.company_id`
- `public.users.role in (...)` de acordo com a acao
- `companies.active = true` para bloquear operacao de empresas desativadas

Essa abordagem reduz dependencia de e-mail, simplifica auditoria e fortalece o controle multiempresa.

## Policies Minimas Para o Admin Funcionar

Estas policies devem existir em tarefa futura, em formato conceitual:

- `companies`: admin autenticado pode `select` e `update` somente a propria empresa.
- `users`: admin autenticado pode `select` o proprio registro ativo para resolver `company_id`; `owner`/`manager` podem listar usuarios da propria empresa.
- `products`, `stones`, `sinks`, `finishes`: admin autenticado da empresa pode `select`, `insert`, `update` e, se decidido, `delete` somente da propria empresa.
- `cutouts`, `drillings`: mesmas regras dos catalogos, mesmo que a UI atual ainda nao esteja completa.
- `quotes`: admin autenticado da empresa pode `select` e `update status` somente da propria empresa; `insert` publico/controlado deve existir para o simulador.
- `quote_items`: admin autenticado da empresa pode `select` itens da propria empresa e/ou de quotes da propria empresa; `insert` publico/controlado deve existir para o simulador.
- `attachments`: admin autenticado da empresa pode `select`, `insert`, `update` e `delete` somente anexos da propria empresa e de quotes da propria empresa.
- `activity_logs`: admin autenticado pode `select` logs da propria empresa; inserts devem ser feitos por funcoes controladas ou policies restritas.

## Policies Ideais Para Producao

- Usar funcoes auxiliares `current_app_user()`, `current_company_id()` e `current_role()` com `security definer`, revisadas com cuidado.
- Basear relacionamento principal em `auth.uid()`, nao em e-mail.
- Separar policies de admin e publicas por tabela e por operacao.
- Aplicar roles:
  - `owner`: acesso administrativo amplo dentro da propria empresa.
  - `manager`: gerenciamento operacional e catalogo dentro da propria empresa.
  - `salesperson`: leitura de catalogo e pedidos; update limitado de status/comercial.
- Bloquear qualquer acao administrativa quando o usuario interno estiver inativo.
- Bloquear administracao quando a empresa estiver inativa, exceto talvez leitura minima para tela de aviso.
- Evitar `delete` fisico em tabelas operacionais; preferir `active = false` ou status arquivado.
- Para dados publicos, liberar somente `select` de empresas ativas e catalogos ativos.
- Para `quotes` publicos, permitir somente `insert` validado para empresa ativa; nunca permitir `select` publico de leads.

## Auditoria Por Tabela

### companies

- Classificacao: **Critico**
- O que o admin precisa fazer:
  - `select`: ler dados da propria empresa para configuracoes e contexto.
  - `insert`: nao e necessario no painel admin atual; onboarding deve ser fluxo separado.
  - `update`: editar nome, logo, whatsapp, email, cidade, estado e status conforme papel.
  - `delete`: nao deve ser permitido no painel admin.
- Regra de isolamento:
  - Por usuario autenticado.
  - Por relacionamento com `public.users.company_id`.
  - Por role: idealmente apenas `owner` ou `manager` para update.
  - Por `active`: empresa inativa nao deve operar o admin.
- Policies necessarias:
  - `select_own_company_for_active_admin`.
  - `update_own_company_for_owner_manager`.
  - Opcional: `public_select_active_company_identity` somente para simulador, limitado a campos publicos e empresas ativas.
- Riscos se errada:
  - Uma empresa pode editar dados comerciais de outra.
  - Empresa inativa pode continuar operando.
  - Dados internos como e-mail/whatsapp podem ser expostos alem do necessario.
- Acesso publico:
  - Deve permitir acesso publico limitado somente para empresa ativa e dados necessarios ao simulador.
  - Nao deve permitir acesso publico de update, insert ou delete.
- Dependencia:
  - Minimo atual: `auth.jwt()->>'email'` + relacionamento com `public.users`.
  - Ideal: `auth.uid()` + `public.users.auth_user_id`.

### users

- Classificacao: **Critico**
- O que o admin precisa fazer:
  - `select`: resolver `company_id`, papel e status do usuario; listar equipe no futuro.
  - `insert`: futuro convite/cadastro de equipe; nao essencial para telas atuais.
  - `update`: futuro gerenciamento de nome, role e active.
  - `delete`: nao recomendado; preferir `active = false`.
- Regra de isolamento:
  - Por usuario autenticado.
  - Por `company_id`.
  - Por role: `owner`/`manager` gerenciam equipe; `salesperson` le no maximo o proprio perfil.
  - Por `active`: somente usuarios ativos devem conceder acesso.
- Policies necessarias:
  - `select_self_active_user_by_auth_email` para o modelo atual funcionar.
  - `select_company_users_for_owner_manager`.
  - `insert_company_user_for_owner`.
  - `update_company_user_for_owner_manager`.
  - `disable_company_user_for_owner`.
- Riscos se errada:
  - Escalada de privilegio alterando `role`.
  - Usuario inativo continua acessando admin.
  - Vazamento de usuarios de outras empresas.
  - Falha total do admin, pois a resolucao de empresa depende desta tabela.
- Acesso publico:
  - Nao deve permitir acesso publico.
- Dependencia:
  - Minimo atual: `auth.jwt()->>'email'` e `public.users.email`.
  - Ideal: `auth.uid()` via `auth_user_id`.

### products

- Classificacao: **Alto**
- O que o admin precisa fazer:
  - `select`: listar produtos da propria empresa, ativos e inativos.
  - `insert`: criar produtos.
  - `update`: editar dados e alternar `active`.
  - `delete`: nao essencial; se existir, somente `owner`/`manager` e dentro da propria empresa.
- Regra de isolamento:
  - Por `company_id`.
  - Por usuario autenticado ativo.
  - Por role: `owner`/`manager` para escrita; `salesperson` no maximo leitura.
  - Por `active`: admin pode ver ativos e inativos; publico somente ativos.
- Policies necessarias:
  - `admin_select_company_products`.
  - `admin_insert_company_products`.
  - `admin_update_company_products`.
  - `admin_delete_company_products_optional`.
  - `public_select_active_products_for_active_company`.
- Riscos se errada:
  - Catalogo/precos comerciais de uma empresa aparecem para outra.
  - Usuario altera produtos de outra empresa.
  - Simulador exibe produto inativo.
- Acesso publico:
  - Sim, somente `select` de produtos ativos pertencentes a empresa ativa.
- Dependencia:
  - Minimo atual: relacionamento com `public.users` por e-mail.
  - Ideal: `auth.uid()` + role em `public.users`.

### stones

- Classificacao: **Alto**
- O que o admin precisa fazer:
  - `select`: listar pedras da propria empresa, ativas e inativas.
  - `insert`: cadastrar pedra e preco por m2.
  - `update`: editar imagem, preco e `active`.
  - `delete`: opcional e restrito; preferir desativacao.
- Regra de isolamento:
  - Por `company_id`.
  - Por usuario autenticado ativo.
  - Por role: escrita para `owner`/`manager`.
  - Por `active`: publico somente pedras ativas.
- Policies necessarias:
  - `admin_select_company_stones`.
  - `admin_insert_company_stones`.
  - `admin_update_company_stones`.
  - `admin_delete_company_stones_optional`.
  - `public_select_active_stones_for_active_company`.
- Riscos se errada:
  - Exposicao de precos por m2.
  - Alteracao indevida de margens/precos.
  - Exibicao publica de pedra inativa ou incompleta.
- Acesso publico:
  - Sim, somente `select` de pedras ativas de empresa ativa.
- Dependencia:
  - Minimo atual: `auth.jwt()->>'email'` + `public.users.company_id`.
  - Ideal: `auth.uid()` + role.

### sinks

- Classificacao: **Alto**
- O que o admin precisa fazer:
  - `select`: listar cubas da propria empresa, ativas e inativas.
  - `insert`: cadastrar cuba.
  - `update`: editar categoria, preco e `active`.
  - `delete`: opcional e restrito; preferir desativacao.
- Regra de isolamento:
  - Por `company_id`.
  - Por usuario autenticado ativo.
  - Por role para escrita.
  - Por `active`: publico somente cubas ativas.
- Policies necessarias:
  - `admin_select_company_sinks`.
  - `admin_insert_company_sinks`.
  - `admin_update_company_sinks`.
  - `admin_delete_company_sinks_optional`.
  - `public_select_active_sinks_for_active_company`.
- Riscos se errada:
  - Exposicao ou alteracao de preco de cuba de outra empresa.
  - Simulador oferece itens indisponiveis.
- Acesso publico:
  - Sim, somente `select` de cubas ativas de empresa ativa.
- Dependencia:
  - Minimo atual: `auth.jwt()->>'email'` + `public.users`.
  - Ideal: `auth.uid()` + role.

### finishes

- Classificacao: **Alto**
- O que o admin precisa fazer:
  - `select`: listar acabamentos da propria empresa, ativos e inativos.
  - `insert`: cadastrar acabamento.
  - `update`: editar tipo de precificacao, preco e `active`.
  - `delete`: opcional e restrito; preferir desativacao.
- Regra de isolamento:
  - Por `company_id`.
  - Por usuario autenticado ativo.
  - Por role para escrita.
  - Por `active`: publico somente acabamentos ativos.
- Policies necessarias:
  - `admin_select_company_finishes`.
  - `admin_insert_company_finishes`.
  - `admin_update_company_finishes`.
  - `admin_delete_company_finishes_optional`.
  - `public_select_active_finishes_for_active_company`.
- Riscos se errada:
  - Alteracao indevida da formula comercial.
  - Exposicao de precos e regras comerciais.
  - Simulador calcula com acabamento inativo.
- Acesso publico:
  - Sim, somente `select` de acabamentos ativos de empresa ativa.
- Dependencia:
  - Minimo atual: `auth.jwt()->>'email'` + `public.users`.
  - Ideal: `auth.uid()` + role.

### cutouts

- Classificacao: **Medio**
- O que o admin precisa fazer:
  - `select`: listar recortes da propria empresa, ativos e inativos.
  - `insert`: cadastrar recortes.
  - `update`: editar preco e `active`.
  - `delete`: opcional e restrito; preferir desativacao.
- Regra de isolamento:
  - Por `company_id`.
  - Por usuario autenticado ativo.
  - Por role para escrita.
  - Por `active`: publico somente recortes ativos quando entrarem no simulador.
- Policies necessarias:
  - `admin_select_company_cutouts`.
  - `admin_insert_company_cutouts`.
  - `admin_update_company_cutouts`.
  - `admin_delete_company_cutouts_optional`.
  - `public_select_active_cutouts_for_active_company` quando o simulador usar recortes.
- Riscos se errada:
  - Precos de servicos complementares podem vazar.
  - Orcamentos futuros podem usar recortes de outra empresa.
  - Recorte inativo pode continuar disponivel ao cliente.
- Acesso publico:
  - Nao no uso atual; sim no futuro apenas como leitura de ativos se aparecer no simulador.
- Dependencia:
  - Minimo atual: `auth.jwt()->>'email'` + `public.users`.
  - Ideal: `auth.uid()` + role.

### drillings

- Classificacao: **Medio**
- O que o admin precisa fazer:
  - `select`: listar furacoes da propria empresa, ativas e inativas.
  - `insert`: cadastrar furacoes.
  - `update`: editar preco e `active`.
  - `delete`: opcional e restrito; preferir desativacao.
- Regra de isolamento:
  - Por `company_id`.
  - Por usuario autenticado ativo.
  - Por role para escrita.
  - Por `active`: publico somente furacoes ativas quando entrarem no simulador.
- Policies necessarias:
  - `admin_select_company_drillings`.
  - `admin_insert_company_drillings`.
  - `admin_update_company_drillings`.
  - `admin_delete_company_drillings_optional`.
  - `public_select_active_drillings_for_active_company` quando o simulador usar furacoes.
- Riscos se errada:
  - Vazamento de regras e precos operacionais.
  - Uso de furacoes inativas ou de outra empresa em orcamentos futuros.
- Acesso publico:
  - Nao no uso atual; sim no futuro apenas como leitura de ativos se aparecer no simulador.
- Dependencia:
  - Minimo atual: `auth.jwt()->>'email'` + `public.users`.
  - Ideal: `auth.uid()` + role.

### quotes

- Classificacao: **Critico**
- O que o admin precisa fazer:
  - `select`: listar e detalhar pedidos da propria empresa.
  - `insert`: nao pelo painel admin atual; necessario para simulador publico.
  - `update`: alterar status comercial da propria empresa.
  - `delete`: nao deve ser permitido no admin comum; no maximo fluxo restrito de LGPD/operacao.
- Regra de isolamento:
  - Por `company_id`.
  - Por usuario autenticado ativo para admin.
  - Por role: `owner`/`manager`/`salesperson` podem ler; update de status pode ser permitido a `manager`/`salesperson`, com limites.
  - Por `active`: inserir publicamente apenas em empresa ativa.
- Policies necessarias:
  - `admin_select_company_quotes`.
  - `admin_update_company_quote_status`.
  - `public_insert_quote_for_active_company`.
  - Opcional: `admin_delete_company_quotes_restricted`.
- Riscos se errada:
  - Vazamento de dados pessoais de leads.
  - Uma empresa pode visualizar funil comercial de outra.
  - Ataques anonimos podem inserir leads em empresas inativas ou com `company_id` arbitrario.
  - Update amplo pode permitir adulterar valores e status sem rastreio.
- Acesso publico:
  - Nao para `select`, `update` ou `delete`.
  - Sim para `insert`, com restricao forte a empresa ativa e campos permitidos.
- Dependencia:
  - Admin minimo: `auth.jwt()->>'email'` + `public.users`.
  - Publico: nao deve depender de `auth.uid()`; deve depender de `company_id` pertencente a `companies.active = true`.
  - Ideal admin: `auth.uid()` + role.

### quote_items

- Classificacao: **Critico**
- O que o admin precisa fazer:
  - `select`: ler itens de orcamentos da propria empresa.
  - `insert`: nao pelo painel admin atual; necessario para simulador apos criar quote.
  - `update`: nao essencial no admin atual; futuro ajuste comercial pode exigir.
  - `delete`: nao recomendado sem regra de auditoria.
- Regra de isolamento:
  - Por `company_id`.
  - Por relacionamento com `quotes.company_id`.
  - Por usuario autenticado ativo para admin.
  - Por role para updates futuros.
  - Por `active`: nao ha coluna `active`; a validacao publica deve verificar empresa ativa e quote relacionada.
- Policies necessarias:
  - `admin_select_company_quote_items`.
  - `public_insert_quote_item_for_active_company_quote`.
  - Opcional: `admin_update_company_quote_items_restricted`.
  - Opcional: `admin_delete_company_quote_items_restricted`.
- Riscos se errada:
  - Itens de pedidos e valores detalhados vazam entre empresas.
  - Cliente anonimo pode inserir item em quote de outra empresa.
  - Inconsistencia entre `quote_items.company_id` e `quotes.company_id`.
  - Insercao publica pode referenciar produtos/pedras/cubas/acabamentos de outra empresa se nao houver validacao cruzada.
- Acesso publico:
  - Nao para leitura.
  - Sim para `insert` somente quando o `quote_id`, `company_id` e referencias pertencem a mesma empresa ativa.
- Dependencia:
  - Admin minimo: `auth.jwt()->>'email'` + `public.users`.
  - Publico: relacionamento com `quotes` e `companies.active`.
  - Ideal admin: `auth.uid()` + role.

### attachments

- Classificacao: **Alto**
- O que o admin precisa fazer:
  - `select`: ver anexos de orcamentos da propria empresa.
  - `insert`: anexar arquivos a quote da propria empresa.
  - `update`: corrigir metadados ou trocar URL, se permitido.
  - `delete`: remover anexos, idealmente apenas `owner`/`manager`.
- Regra de isolamento:
  - Por `company_id`.
  - Por relacionamento com `quotes.company_id`.
  - Por usuario autenticado ativo.
  - Por role para escrita/remocao.
  - Por `active`: nao ha coluna `active`; quote/empresa devem controlar acesso.
- Policies necessarias:
  - `admin_select_company_attachments`.
  - `admin_insert_company_attachments`.
  - `admin_update_company_attachments`.
  - `admin_delete_company_attachments_restricted`.
  - Futuro: policies tambem no Supabase Storage, se arquivos forem armazenados la.
- Riscos se errada:
  - Vazamento de documentos, fotos ou arquivos de clientes.
  - Upload/anexo em quote de outra empresa.
  - Exposicao publica de URLs sensiveis.
- Acesso publico:
  - Nao deve permitir acesso publico no painel admin.
  - Se houver upload publico futuro, deve ser separado e extremamente limitado.
- Dependencia:
  - Minimo atual: `auth.jwt()->>'email'` + `public.users`.
  - Ideal: `auth.uid()` + role + validacao com quote da mesma empresa.

### activity_logs

- Classificacao: **Alto**
- O que o admin precisa fazer:
  - `select`: consultar logs da propria empresa.
  - `insert`: registrar acoes administrativas.
  - `update`: nao deve ser permitido.
  - `delete`: nao deve ser permitido no painel comum.
- Regra de isolamento:
  - Por `company_id`.
  - Por usuario autenticado ativo.
  - Por role: leitura idealmente para `owner`/`manager`; inserts via funcao controlada.
  - Por `active`: empresas/usuarios inativos nao devem gerar acoes administrativas comuns.
- Policies necessarias:
  - `admin_select_company_activity_logs`.
  - `system_insert_company_activity_logs` ou RPC `log_activity`.
  - Nao criar policy de update.
  - Nao criar policy de delete, exceto manutencao server-side fora do painel.
- Riscos se errada:
  - Logs de uma empresa vazam para outra.
  - Usuario malicioso apaga ou altera trilha de auditoria.
  - Inserts livres permitem falsificar historico.
- Acesso publico:
  - Nao deve permitir acesso publico.
- Dependencia:
  - Minimo atual: `auth.jwt()->>'email'` + `public.users`.
  - Ideal: `auth.uid()` + `public.users.id` para preencher `user_id`.

## Ordem Recomendada de Implementacao

1. Criar funcoes auxiliares seguras para identificar usuario interno ativo, empresa atual e role atual.
2. Criar policy minima de `users` para o usuario autenticado resolver seu proprio registro ativo.
3. Criar policies de `companies` para `select`/`update` da propria empresa.
4. Criar policies admin para leitura e escrita dos catalogos: `products`, `stones`, `sinks`, `finishes`, `cutouts`, `drillings`.
5. Criar policies admin para `quotes` e `quote_items`, garantindo leitura apenas da propria empresa.
6. Criar policies publicas separadas para o simulador: leitura somente de catalogos ativos e insert controlado de `quotes`/`quote_items`.
7. Criar policies para `attachments`, incluindo revisao futura do Supabase Storage.
8. Criar policies ou RPC segura para `activity_logs`.
9. Validar com duas empresas, dois usuarios e pelo menos um usuario inativo.
10. Evoluir schema para `public.users.auth_user_id` e migrar as policies de e-mail para `auth.uid()`.

## Riscos de Manter o Isolamento Apenas no Frontend

- Qualquer pessoa com a anon key pode chamar a API diretamente e tentar trocar `company_id`.
- Bugs em uma tela podem expor dados de outra empresa mesmo que outras telas filtrem corretamente.
- O painel pode parecer seguro em uso normal, mas falhar em testes de API, automacoes ou scripts.
- Dados pessoais de leads ficam protegidos apenas pela interface, nao pelo banco.
- Roles podem ser ignoradas por chamadas diretas se nao existirem policies no Supabase.
- Empresa inativa pode continuar recebendo operacoes se a regra existir apenas no React.
- Auditoria e conformidade ficam frageis, porque a barreira real deve estar na camada de dados.

## Conclusao

O bloqueio principal do admin e critico: a RLS ja esta ativa, mas ainda nao ha policies. A correcao futura deve comecar pelo vinculo seguro entre usuario autenticado e `public.users`, seguido das policies por `company_id` e por role. Para producao, a dependencia de `auth.jwt()->>'email'` deve ser tratada como transitoria; o desenho recomendado e migrar para `auth.uid()` com `public.users.auth_user_id`.
