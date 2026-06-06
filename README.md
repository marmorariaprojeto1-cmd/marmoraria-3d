# Marmoraria 3D

Marmoraria 3D e uma plataforma SaaS para marmorarias criarem uma experiencia de orcamento visual, guiada e automatizada para seus clientes.

O cliente final podera configurar uma peca sob medida, visualizar o resultado em 3D, acompanhar o preco estimado em tempo real e enviar o pedido para a marmoraria responsavel.

## Objetivo do Produto

Criar uma solucao multiempresa para marmorarias que permita:

- Escolher o tipo de peca
- Escolher a pedra
- Escolher acabamento
- Escolher cuba
- Informar medidas
- Visualizar a peca em 3D
- Receber orcamento automatico em tempo real
- Enviar o pedido para a marmoraria

## Estado Atual

Este repositorio esta na fase de fundacao documental.

Ainda nao devem ser desenvolvidos:

- Frontend
- Backend
- Banco de dados
- Integracao com Supabase
- Deploy ou configuracao de Netlify
- Modelagem final de infraestrutura

## Principios do Projeto

- Crescer como SaaS multiempresa desde a concepcao
- Separar configuracoes por marmoraria
- Evitar decisoes tecnicas irreversiveis antes da validacao do escopo
- Priorizar clareza de produto antes de implementacao
- Manter documentacao simples, objetiva e atualizada

## Documentos Principais

- [PROJECT_VISION.md](PROJECT_VISION.md): visão oficial do produto
- [PROJECT_RULES.md](PROJECT_RULES.md): regras de trabalho e limites do projeto
- [PRODUCT_SCOPE.md](PRODUCT_SCOPE.md): escopo funcional do produto
- [MASTER_PRODUCT_CATALOG.md](MASTER_PRODUCT_CATALOG.md): catálogo mestre de produtos e opções
- [CATALOGO_DE_REGRAS_DE_ORCAMENTO.md](CATALOGO_DE_REGRAS_DE_ORCAMENTO.md): regras oficiais de orçamento
- [UX_FLOW.md](UX_FLOW.md): fluxo da experiência do cliente e da marmoraria
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md): esquema conceitual do banco de dados SaaS
- [WIREFRAMES.md](WIREFRAMES.md): wireframes conceituais das telas da plataforma
- [ROADMAP.md](ROADMAP.md): fases planejadas de evolucao

## Visao de SaaS Multiempresa

Cada marmoraria devera operar como uma empresa independente dentro da plataforma, com seus proprios:

- Catalogos de pedras
- Tipos de pecas disponiveis
- Acabamentos
- Cubas e acessorios
- Tabelas de preco
- Regras comerciais
- Usuarios internos
- Pedidos e orcamentos

Essa separacao deve orientar todas as futuras decisoes de arquitetura, dados, permissoes e experiencia do usuario.
