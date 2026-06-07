# Script de Seed do Catalogo Padrao

Este documento explica o script local `scripts/seed-default-catalog.mjs`.

O script foi criado para clonar o catalogo padrao do MVP para uma empresa existente, usando o `company_id` configurado em `VITE_SIMULATOR_COMPANY_ID`.

Este documento nao cria SQL, nao cria migrations e nao executa o seed automaticamente.

## Como o script funciona

O script le as variaveis locais, monta os registros definidos em `DEFAULT_CATALOG_SEED.md` e tenta inserir o catalogo padrao nas tabelas:

- `products`
- `stones`
- `sinks`
- `finishes`

Cada registro recebe:

- `company_id` da empresa configurada;
- `active = true`;
- preco inicial seguro de demonstracao;
- campos opcionais de imagem como `null`, quando aplicavel.

O script usa `upsert` com `onConflict: 'company_id,name'` e `ignoreDuplicates: true`. Isso evita duplicidade sem sobrescrever registros personalizados ja existentes com o mesmo nome na mesma empresa.

## Variaveis necessarias

Variaveis obrigatorias:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SIMULATOR_COMPANY_ID`

Variavel obrigatoria para confirmar execucao:

- `CONFIRM_DEFAULT_CATALOG_SEED=yes`

Variaveis opcionais para ambientes com RLS exigindo usuario autenticado:

- `SEED_USER_EMAIL`
- `SEED_USER_PASSWORD`

O script nunca imprime chaves. A anon key e usada como chave publica do cliente Supabase. O script nao usa `service_role`.

## Como executar

Com as variaveis ja presentes no `.env`, rode:

```bash
CONFIRM_DEFAULT_CATALOG_SEED=yes npm run seed:default-catalog
```

Se a RLS do ambiente exigir usuario autenticado para inserir catalogo, rode com credenciais de um usuario autorizado:

```bash
CONFIRM_DEFAULT_CATALOG_SEED=yes SEED_USER_EMAIL="admin@example.com" SEED_USER_PASSWORD="senha" npm run seed:default-catalog
```

Sem `CONFIRM_DEFAULT_CATALOG_SEED=yes`, o script aborta antes de conectar e nao insere nada.

## O que ele insere

O script prepara:

- 10 produtos padrao;
- 38 pedras padrao;
- 6 cubas padrao;
- 6 acabamentos padrao.

Os precos sao valores iniciais seguros de demonstracao. Eles nao representam tabela comercial real e devem ser revisados pela marmoraria antes de uso com clientes.

## Como evitar duplicidade

A estrategia usada e:

- todos os registros sao vinculados a `company_id`;
- o conflito considerado e `company_id,name`;
- quando um registro ja existe, ele e ignorado;
- registros personalizados existentes nao sao sobrescritos.

Isso segue a decisao arquitetural documentada em `DEFAULT_CATALOG_IMPORT_STRATEGY.md`: catalogo mestre, clonagem para empresa e edicao da propria copia.

## Riscos e cuidados

- O script deve ser executado somente para uma empresa existente.
- `VITE_SIMULATOR_COMPANY_ID` deve apontar para a empresa correta.
- O seed nao deve ser usado com dados reais de preco sem revisao.
- Se a RLS bloquear inserts anonimos, use um usuario autorizado via `SEED_USER_EMAIL` e `SEED_USER_PASSWORD`.
- O script nao apaga dados e nao atualiza registros existentes com mesmo nome.
- Se uma empresa ja possui um item com nome diferente para o mesmo material, o script pode criar um item adicional.
- O script nao cria empresa, usuario, categorias, imagens ou regras comerciais avancadas.

## Escopo

Este script e uma ferramenta controlada para o MVP. Ele nao substitui um fluxo completo de onboarding.

No futuro, o seed podera evoluir para:

- painel interno de importacao;
- selecao de itens antes de importar;
- importacao incremental de novos itens sugeridos;
- historico de importacoes;
- controle de versao do catalogo mestre.
