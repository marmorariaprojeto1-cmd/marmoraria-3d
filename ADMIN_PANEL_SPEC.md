# Especificação do Painel Administrativo

Este documento define o escopo conceitual do painel administrativo da marmoraria dentro da plataforma Marmoraria 3D.

Não representa implementação de frontend, backend, banco de dados ou permissões técnicas definitivas.

## Objetivo

Permitir que cada marmoraria gerencie sua própria operação dentro da plataforma SaaS.

## Módulos do Painel

- Dashboard
- Pedidos
- Catálogo de pedras
- Categorias de pedras
- Produtos
- Cubas
- Acabamentos
- Recortes
- Furações
- Preços
- WhatsApp
- Usuários
- Configurações da empresa

## Dashboard

Exibir:

- Total de pedidos
- Pedidos novos
- Pedidos em negociação
- Pedidos fechados
- Valor estimado em oportunidades
- Produtos mais simulados
- Pedras mais escolhidas

## Pedidos

Cada pedido deve mostrar:

- Nome do cliente
- Telefone
- Cidade
- Produto
- Pedra
- Valor estimado
- Status
- Data

Status:

- Novo
- Em análise
- Contatado
- Em negociação
- Fechado
- Perdido

## Catálogo

Permitir cadastrar, editar, ativar e desativar:

- Pedras
- Produtos
- Cubas
- Acabamentos
- Recortes
- Furações

## Preços

Permitir configurar:

- Preço por m² da pedra
- Preço de acabamento
- Preço de cuba
- Preço de recorte
- Preço de furação
- Preço de instalação
- Preço de frete
- Margem percentual

## WhatsApp

Permitir configurar:

- Número principal
- Mensagem automática
- Ativar/desativar envio pelo WhatsApp

## Usuários

Permitir papéis:

- owner
- manager
- salesperson

## Regras SaaS

Cada empresa acessa apenas seus próprios dados.

Catálogos, pedidos, preços, usuários, configurações e integrações devem ser isolados por empresa.
