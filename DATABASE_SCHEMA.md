# DATABASE SCHEMA

Este documento descreve o esquema conceitual do banco de dados da plataforma Marmoraria 3D.

Não representa SQL, migrations ou implementação física. O objetivo é orientar a modelagem futura do SaaS multiempresa.

## Multiempresa

Tabela conceitual:

companies

Campos:

- id
- name
- slug
- logo_url
- whatsapp
- email
- city
- state
- active
- created_at

---

## Usuários

users

Campos:

- id
- company_id
- name
- email
- role
- active
- created_at

Roles:

- owner
- manager
- salesperson

---

## Categorias de Produtos

product_categories

Campos:

- id
- company_id
- name
- active

---

## Produtos

products

Campos:

- id
- company_id
- category_id
- name
- description
- active

---

## Categorias de Pedra

stone_categories

Campos:

- id
- company_id
- name

Exemplos:

- Granito
- Mármore
- Quartzo
- Dekton
- Porcelanato

---

## Pedras

stones

Campos:

- id
- company_id
- category_id
- name
- image_url
- price_per_m2
- active

---

## Cubas

sinks

Campos:

- id
- company_id
- name
- category
- price
- active

---

## Acabamentos

finishes

Campos:

- id
- company_id
- name
- pricing_type
- price
- active

---

## Recortes

cutouts

Campos:

- id
- company_id
- name
- price
- active

---

## Furações

drillings

Campos:

- id
- company_id
- name
- price
- active

---

## Orçamentos

quotes

Campos:

- id
- company_id
- customer_name
- customer_phone
- customer_email
- city
- status
- total_price
- created_at

Status:

- draft
- submitted
- contacted
- negotiating
- won
- lost

---

## Itens do Orçamento

quote_items

Campos:

- id
- quote_id
- product_id
- stone_id
- sink_id
- finish_id
- width
- depth
- thickness
- quantity
- unit_price
- total_price

---

## Arquivos

attachments

Campos:

- id
- quote_id
- file_url
- file_type

---

## Logs

activity_logs

Campos:

- id
- company_id
- user_id
- action
- created_at

---

## Observações Arquiteturais

### Isolamento por company_id

Todas as entidades operacionais da plataforma devem ser associadas a uma empresa sempre que fizer sentido de negócio.

O campo company_id será a base conceitual para separar catálogos, usuários, preços, pedidos, logs e regras comerciais entre marmorarias.

Nenhuma marmoraria deve consultar, alterar ou visualizar dados pertencentes a outra marmoraria.

### Arquitetura SaaS

O modelo deve nascer preparado para múltiplas empresas usando a mesma plataforma.

Cada empresa deverá possuir seus próprios catálogos, preços, produtos, pedras, cubas, acabamentos, usuários e orçamentos.

### Preparação para marketplace futuro

O schema conceitual deve permitir evolução para um marketplace nacional de marmorarias.

Para isso, empresas, produtos, categorias, pedras e orçamentos devem permanecer bem separados, evitando dependência rígida de uma única operação local.

### Preparação para CRM futuro

O modelo de orçamentos, usuários, logs e status deve permitir evolução para recursos de CRM.

No futuro, poderão existir histórico de contatos, responsáveis comerciais, funil de vendas, tarefas, observações internas e automações de acompanhamento.
