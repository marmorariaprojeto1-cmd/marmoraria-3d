# Relatorio de Seguranca

Data: 2026-06-07

Escopo desta correcao: RLS minimo para o painel administrativo atual e para as operacoes publicas indispensaveis do simulador nas tabelas `users`, `companies`, `products`, `stones`, `sinks`, `finishes`, `quotes` e `quote_items`.

Migration criada: `supabase/migrations/20260607130000_admin_minimum_rls_policies.sql`

## Funcoes Auxiliares Criadas

- `public.current_user_company_id()`: retorna a empresa do usuario autenticado ativo, usando `lower(public.users.email) = lower(auth.jwt()->>'email')` e exigindo empresa ativa.
- `public.current_user_role()`: retorna o papel do usuario autenticado ativo, usando o mesmo vinculo por e-mail e empresa ativa.
- `public.is_active_company_member(target_company_id uuid)`: confirma se o usuario autenticado e membro ativo da empresa informada.
- `public.is_active_company_quote(target_company_id uuid, target_quote_id uuid)`: confirma se um orcamento pertence a uma empresa ativa, sem liberar `SELECT` publico em `quotes`.

As funcoes foram criadas como `security definer`, com `search_path = public`, para permitir que as policies consultem `public.users` sem recursao de RLS. O uso de e-mail e temporario porque o schema atual ainda nao possui `auth_user_id`.

## Policies Criadas Por Tabela

### users

- `users_select_own_active_profile`: usuario autenticado pode ler o proprio registro ativo.
- `users_select_company_profiles_for_owner_manager`: `owner` e `manager` podem ler usuarios da propria empresa.

Nao ha policy publica, insert, update ou delete para `users`.

### companies

- `companies_public_select_active`: permite leitura publica de empresas ativas, necessaria para o simulador carregar nome e WhatsApp.
- `companies_select_own_company`: usuario autenticado pode ler a propria empresa.
- `companies_update_own_company_for_owner_manager`: `owner` e `manager` podem atualizar apenas a propria empresa.

Nao ha insert/delete pelo painel.

### products

- `products_public_select_active`: leitura publica apenas de produtos ativos de empresas ativas.
- `products_admin_select_company`: membro ativo pode ler produtos da propria empresa.
- `products_admin_insert_company`: membro ativo pode inserir produto na propria empresa.
- `products_admin_update_company`: membro ativo pode atualizar produto da propria empresa.

Nao foi criada policy de delete.

### stones

- `stones_public_select_active`: leitura publica apenas de pedras ativas de empresas ativas.
- `stones_admin_select_company`: membro ativo pode ler pedras da propria empresa.
- `stones_admin_insert_company`: membro ativo pode inserir pedra na propria empresa.
- `stones_admin_update_company`: membro ativo pode atualizar pedra da propria empresa.

Nao foi criada policy de delete.

### sinks

- `sinks_public_select_active`: leitura publica apenas de cubas ativas de empresas ativas.
- `sinks_admin_select_company`: membro ativo pode ler cubas da propria empresa.
- `sinks_admin_insert_company`: membro ativo pode inserir cuba na propria empresa.
- `sinks_admin_update_company`: membro ativo pode atualizar cuba da propria empresa.

Nao foi criada policy de delete.

### finishes

- `finishes_public_select_active`: leitura publica apenas de acabamentos ativos de empresas ativas.
- `finishes_admin_select_company`: membro ativo pode ler acabamentos da propria empresa.
- `finishes_admin_insert_company`: membro ativo pode inserir acabamento na propria empresa.
- `finishes_admin_update_company`: membro ativo pode atualizar acabamento da propria empresa.

Nao foi criada policy de delete.

### quotes

- `quotes_admin_select_company`: membro ativo pode ler orcamentos da propria empresa.
- `quotes_admin_update_company`: membro ativo pode atualizar orcamentos da propria empresa.
- `quotes_public_insert_active_company`: permite insert publico somente quando `company_id` pertence a empresa ativa.

Nao ha `SELECT` publico em `quotes`. Nao ha update/delete publico.

### quote_items

- `quote_items_admin_select_company`: membro ativo pode ler itens da propria empresa.
- `quote_items_public_insert_for_company_quote`: permite insert publico somente quando a empresa esta ativa, o `quote_id` pertence a mesma empresa e as referencias opcionais de catalogo pertencem a mesma empresa e estao ativas.

Nao ha `SELECT` publico em `quote_items`. Nao ha update/delete publico.

## Decisoes de Escopo

- Nao foram criadas policies para `cutouts`, `drillings`, `attachments` ou `activity_logs`.
- Nao foi criada policy de delete para catalogo, porque o MVP atual usa `active` para ativar/desativar registros.
- Nao houve alteracao de frontend, schema existente ou migration antiga.
- Nao houve uso de `service_role` no frontend.
- Nao houve desabilitacao de RLS.

## Riscos Remanescentes

- O vinculo por `auth.jwt()->>'email'` ainda e temporario. A evolucao recomendada e adicionar `public.users.auth_user_id` e migrar as policies para `auth.uid()`.
- Como `public.users` permite e-mails repetidos entre empresas pelo schema atual, um mesmo e-mail em mais de uma empresa pode gerar ambiguidade. O app atual tambem depende desse pressuposto.
- Policies de update em `quotes` protegem por empresa, mas ainda nao limitam colunas apenas a `status`.
- Inserts publicos de `quotes` ainda nao sao transacionais com `quote_items`; esse risco ja estava mapeado e fica fora desta tarefa.
- Leitura publica de `companies` ativas e feita por RLS de linha, nao por coluna. Portanto, qualquer coluna concedida ao papel anon nessa tabela pode ficar legivel para empresas ativas.
- `product_categories` e `stone_categories` continuam sem policies nesta tarefa, pois nao fazem parte das telas CRUD atuais listadas no escopo.
- `cutouts`, `drillings`, `attachments` e `activity_logs` continuam bloqueadas por RLS ate receberem policies especificas.
