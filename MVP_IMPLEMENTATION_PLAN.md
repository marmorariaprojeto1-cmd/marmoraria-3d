# MVP IMPLEMENTATION PLAN

Este documento organiza a execução do MVP da plataforma Marmoraria 3D.

Não representa implementação imediata, criação de código, banco de dados, frontend ou backend. O objetivo é definir a ordem oficial das fases futuras.

## Objetivo

Construir a primeira versão funcional da plataforma Marmoraria 3D.

---

# Fase 1 - Fundação Técnica

Objetivo:

Preparar a base do sistema.

Itens:

- React
- Vite
- TypeScript
- Tailwind
- ESLint
- Prettier
- Supabase
- React Query
- React Router

Entregável:

Projeto inicial funcionando.

---

# Fase 2 - Banco de Dados

Objetivo:

Implementar o schema definido em DATABASE_SCHEMA.md.

Entregável:

Banco funcional.

---

# Fase 3 - Autenticação

Objetivo:

Implementar login multiempresa.

Entregável:

Login funcionando.

---

# Fase 4 - Painel Administrativo

Objetivo:

Permitir gestão da empresa.

Módulos:

- Pedras
- Cubas
- Acabamentos
- Produtos
- Configurações

Entregável:

Empresa consegue alimentar catálogo.

---

# Fase 5 - Motor de Orçamento

Objetivo:

Implementar regras definidas em CATALOGO_DE_REGRAS_DE_ORCAMENTO.md.

Entregável:

Orçamento automático funcionando.

---

# Fase 6 - Simulador Visual

Objetivo:

Criar visualização 2D inicial.

IMPORTANTE:

Antes do 3D completo.

Entregável:

Cliente consegue visualizar medidas e alterações.

---

# Fase 7 - Simulador 3D

Objetivo:

Implementar motor descrito em 3D_ENGINE_SPEC.md.

Entregável:

Visualização interativa.

---

# Fase 8 - Captura de Leads

Objetivo:

Enviar pedidos para a marmoraria.

Entregável:

Leads funcionando.

---

# Fase 9 - Dashboard

Objetivo:

Acompanhar pedidos e conversões.

Entregável:

Dashboard operacional.

---

# Fase 10 - Lançamento Beta

Objetivo:

Validar com uma marmoraria real.

Checklist:

- Cadastro completo
- Simulação
- Orçamento
- Leads
- Dashboard

---

# Fora do MVP

Não implementar inicialmente:

- Marketplace
- IA
- ERP
- Financeiro
- Multiunidades
- Realidade aumentada

---

# Ordem Obrigatória

Nenhuma fase deve ser iniciada sem conclusão da anterior.

Essa ordem existe para reduzir retrabalho, validar dependências e manter o MVP simples antes de evoluções mais complexas.
