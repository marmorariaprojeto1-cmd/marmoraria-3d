# Regras do Projeto

Este documento define as regras iniciais para evolucao do Marmoraria 3D.

## Fase Atual

O projeto esta em fase de fundacao documental.

Nesta fase, o objetivo e organizar a visao do produto, seus limites, prioridades e criterios para desenvolvimento futuro.

## O Que Nao Fazer Agora

Enquanto o projeto estiver nesta fase, nao desenvolver:

- Frontend
- Backend
- Banco de dados
- Supabase
- Netlify
- Autenticacao
- APIs
- Modelos 3D finais
- Fluxos de pagamento
- Integracoes externas

## Regras de Produto

- Toda funcionalidade deve considerar o contexto multiempresa.
- Nenhuma marmoraria deve acessar dados de outra marmoraria.
- O cliente final deve interagir apenas com a experiencia da marmoraria selecionada.
- Precos, catalogos e regras comerciais devem ser configuraveis por marmoraria.
- O orcamento automatico deve ser tratado como estimativa ate validacao da marmoraria, salvo decisao futura em contrario.

## Regras de Escopo

- Antes de implementar uma funcionalidade, registrar o objetivo e os limites esperados.
- Evitar criar funcionalidades genericas sem relacao direta com o fluxo de orcamento de marmoraria.
- Priorizar o fluxo principal antes de telas administrativas avancadas.
- Manter o produto simples para validacao inicial.

## Regras Tecnicas Futuras

Quando a implementacao comecar:

- Separar claramente camadas de interface, dominio, dados e integracoes.
- Projetar isolamento por empresa desde o primeiro modelo de dados.
- Evitar acoplamento entre logica de calculo de preco e componentes visuais.
- Criar testes para calculo de orcamento e regras comerciais.
- Documentar decisoes arquiteturais relevantes antes de consolidar padroes.

## Convencoes de Documentacao

- Documentos devem ser escritos em portugues.
- Decisoes importantes devem ser registradas.
- Roadmap e escopo devem ser atualizados quando houver mudanca de prioridade.
- A documentacao deve explicar o por que das decisoes, nao apenas listar tarefas.

## Criterios Para Avancar de Fase

O projeto so deve sair da fundacao documental quando estiverem claros:

- Escopo do MVP
- Fluxo principal do cliente final
- Regras iniciais de orcamento
- Dados minimos por marmoraria
- Papeis de usuario
- Requisitos basicos da visualizacao 3D
