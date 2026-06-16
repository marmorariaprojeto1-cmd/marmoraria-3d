# Status Atual do Banco de Dados

Data da verificacao: 2026-06-07

Objetivo: verificar o estado atual do banco apos a limpeza, sem criar dados, sem alterar dados e sem executar migrations.

## Metodo de Verificacao

- Foi lido `PROJECT_RULES.md`.
- Foi verificado que o arquivo `.env` local existe.
- Foi verificado que as variaveis abaixo estao presentes no ambiente local, sem imprimir seus valores:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_SIMULATOR_COMPANY_ID`
- Foi feita uma consulta somente leitura ao Supabase usando apenas a anon key configurada no `.env`.
- Nenhum dado foi criado, alterado ou removido.
- Nenhuma migration foi executada.

## Variavel de Empresa do Simulador

`VITE_SIMULATOR_COMPANY_ID` configurado localmente:

```text
72d157c3-8164-4d8d-a96e-b33fa826d09a
```

## Contagem de Registros Visiveis

| Tabela | Registros visiveis |
| --- | ---: |
| `companies` | 0 |
| `users` | 0 |
| `products` | 0 |
| `stones` | 0 |
| `sinks` | 0 |
| `finishes` | 0 |
| `quotes` | 0 |
| `quote_items` | 0 |

## Empresas Encontradas

Nenhuma empresa foi encontrada pela consulta atual.

Resultado em `companies`:

```text
[]
```

## Usuarios Encontrados

Nenhum usuario foi encontrado pela consulta atual em `public.users`.

Resultado em `public.users`:

```text
[]
```

## Empresa Cadastrada

Nao existe empresa visivel na tabela `companies` pela consulta atual.

Observacao importante: como a consulta usou anon key, se houver RLS bloqueando leitura, registros existentes podem ficar invisiveis para essa consulta. Porem, para o funcionamento publico do simulador e do MVP atual, o resultado pratico e que nenhuma empresa esta acessivel com a configuracao atual.

## Usuario Vinculado a Empresa

Nao existe usuario visivel em `public.users`.

Como `public.users` retornou vazio, nao ha usuario visivel vinculado a nenhuma empresa.

## Correspondencia Entre `auth.users` e `public.users`

Nao foi possivel confirmar correspondencia com `auth.users` usando anon key.

Motivo:

- `auth.users` pertence ao schema de autenticacao do Supabase.
- A anon key nao deve listar usuarios de autenticacao.
- Nao foi usada `service_role key`.
- Nenhuma alteracao administrativa foi executada.

Com base no que esta visivel:

- `public.users` esta vazio.
- Portanto, nao existe correspondencia visivel entre `auth.users` e `public.users`.

Para confirmar no Supabase, verificar manualmente em:

- `Authentication > Users`
- `Table Editor > users`

O e-mail criado em `Authentication > Users` precisa existir tambem em `public.users`.

## E-mail Autenticado no Sistema

Nenhum e-mail esta autenticado na sessao local consultada.

Resultado da sessao Supabase local:

```text
hasSession: false
email: null
userId: null
```

## `company_id` Vinculado ao Usuario Autenticado

Nao ha `company_id` vinculado porque nao existe usuario autenticado na sessao local consultada.

Resultado:

```text
company_id: null
```

## Banco Vazio ou Nao

Pela consulta atual com anon key, o banco esta vazio nas tabelas verificadas.

Tabelas verificadas:

- `companies`
- `users`
- `products`
- `stones`
- `sinks`
- `finishes`
- `quotes`
- `quote_items`

## Problemas Encontrados

### 1. Nenhuma empresa visivel

- Classificacao: Alto
- Impacto: o simulador nao consegue carregar empresa, catalogo ou WhatsApp.
- Proximo ajuste necessario: criar uma empresa demo ou confirmar se a empresa existe mas esta invisivel por RLS.

### 2. Nenhum usuario visivel em `public.users`

- Classificacao: Alto
- Impacto: mesmo que exista usuario em `Authentication > Users`, o admin nao conseguira resolver `company_id` pelo e-mail.
- Proximo ajuste necessario: criar o registro correspondente em `public.users` com o mesmo e-mail do usuario autenticado.

### 3. Nao ha sessao autenticada local

- Classificacao: Medio
- Impacto: nao foi possivel informar um e-mail autenticado real porque a consulta local nao possui sessao Supabase ativa.
- Proximo ajuste necessario: fazer login pelo app e validar novamente o admin.

### 4. `auth.users` nao e verificavel com anon key

- Classificacao: Observacao
- Impacto: nao da para confirmar via script local se existe usuario no Authentication sem usar ferramenta administrativa.
- Proximo ajuste necessario: conferir manualmente no painel do Supabase em `Authentication > Users`.

### 5. `VITE_SIMULATOR_COMPANY_ID` aponta para uma empresa nao visivel

- Classificacao: Alto
- Impacto: o simulador esta configurado para `72d157c3-8164-4d8d-a96e-b33fa826d09a`, mas essa empresa nao foi encontrada pela consulta atual.
- Proximo ajuste necessario: criar/confirmar a empresa com esse UUID ou atualizar a variavel para o UUID correto depois de criar a empresa demo.

## Proximo Passo Recomendado

1. Confirmar no Supabase se existe algum usuario em `Authentication > Users`.
2. Criar ou recriar a empresa demo em `companies`.
3. Criar o usuario correspondente em `public.users` com o mesmo e-mail do Authentication.
4. Criar catalogo minimo de teste:
   - produto
   - pedra
   - cuba
   - acabamento
5. Validar login em `/login`.
6. Validar acesso a `/admin`.
7. Validar carregamento do simulador com `VITE_SIMULATOR_COMPANY_ID`.

## Resumo Final

- Banco vazio ou nao: vazio para as tabelas consultadas com anon key.
- Empresas encontradas: nenhuma.
- Usuarios encontrados: nenhum em `public.users`.
- E-mail autenticado: nenhum na sessao local consultada.
- `company_id` vinculado ao usuario autenticado: nenhum.
- Principal problema: nao ha dados minimos visiveis para o MVP funcionar.
- Proximo passo recomendado: recriar dados demo e vincular o usuario do Authentication a `public.users`.
