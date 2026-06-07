# Checklist Técnico de Validação Manual do MVP

Este documento orienta a validação manual do MVP da plataforma Marmoraria 3D.

O objetivo é confirmar que o fluxo principal funciona de ponta a ponta antes de uma demonstração ou validação com uma marmoraria real.

## Premissas

- O projeto deve estar rodando localmente.
- O Supabase deve estar configurado.
- As migrations já devem ter sido aplicadas.
- Nenhum dado real sensível deve ser usado durante os testes.
- Cada teste deve respeitar o isolamento por empresa.

## 1. Configuração do .env

Passos:

- Criar o arquivo `.env` local a partir de `.env.example`.
- Preencher `VITE_SUPABASE_URL`.
- Preencher `VITE_SUPABASE_ANON_KEY`.
- Preencher `VITE_SIMULATOR_COMPANY_ID` com o id da empresa de teste.

Resultado esperado:

- A aplicação inicia sem erro de variáveis ausentes.
- O simulador não exibe aviso de configuração incompleta.

## 2. Supabase conectado

Passos:

- Iniciar a aplicação.
- Acessar `/login`.
- Confirmar que não há mensagem pedindo configuração de Supabase.
- Verificar o console do navegador.

Resultado esperado:

- Não há erro de conexão com Supabase.
- A tela de login permanece funcional.

## 3. Empresa cadastrada

Passos:

- Verificar a tabela `companies`.
- Confirmar que existe uma empresa de teste.
- Confirmar que a empresa possui `id`, `name`, `slug` e `active = true`.
- Confirmar que `whatsapp` está preenchido para validar o envio pelo WhatsApp.

Resultado esperado:

- A empresa de teste está ativa e pronta para uso.

## 4. Usuário vinculado à empresa

Passos:

- Verificar a tabela `users`.
- Confirmar que existe um usuário com o mesmo e-mail do login Supabase.
- Confirmar que o usuário possui `company_id` igual ao id da empresa de teste.
- Confirmar que o usuário possui `active = true`.

Resultado esperado:

- O painel administrativo consegue resolver a empresa do usuário autenticado.

## 5. Login funcionando

Passos:

- Acessar `/login`.
- Informar e-mail e senha do usuário de teste.
- Enviar o formulário.

Resultado esperado:

- O usuário é redirecionado para `/admin`.
- Não aparece mensagem de erro de autenticação.

## 6. Admin acessível

Passos:

- Após login, acessar `/admin`.
- Acessar também:
  - `/admin/pedidos`
  - `/admin/produtos`
  - `/admin/pedras`
  - `/admin/cubas`
  - `/admin/acabamentos`
  - `/admin/configuracoes`

Resultado esperado:

- Todas as telas carregam sem erro.
- Nenhuma tela mostra dados de outra empresa.

## 7. Cadastro de produto

Passos:

- Acessar `/admin/produtos`.
- Cadastrar um produto de teste.
- Preencher nome, descrição opcional, category_id opcional e status ativo.

Resultado esperado:

- O produto aparece na listagem.
- O produto é salvo com o `company_id` da empresa do usuário.

## 8. Cadastro de pedra

Passos:

- Acessar `/admin/pedras`.
- Cadastrar uma pedra de teste.
- Preencher nome, image_url opcional, preço por m² e status ativo.

Resultado esperado:

- A pedra aparece na listagem.
- A pedra é salva com o `company_id` da empresa do usuário.

## 9. Cadastro de cuba

Passos:

- Acessar `/admin/cubas`.
- Cadastrar uma cuba de teste.
- Preencher nome, categoria, preço e status ativo.

Resultado esperado:

- A cuba aparece na listagem.
- A cuba é salva com o `company_id` da empresa do usuário.

## 10. Cadastro de acabamento

Passos:

- Acessar `/admin/acabamentos`.
- Cadastrar um acabamento de teste.
- Preencher nome, tipo de cobrança, preço e status ativo.

Resultado esperado:

- O acabamento aparece na listagem.
- O acabamento é salvo com o `company_id` da empresa do usuário.

## 11. Simulador carregando catálogo real

Passos:

- Acessar `/simulador`.
- Confirmar que produtos, pedras, cubas e acabamentos cadastrados aparecem nas etapas correspondentes.
- Confirmar que apenas registros ativos aparecem.

Resultado esperado:

- O simulador carrega o catálogo real da empresa definida em `VITE_SIMULATOR_COMPANY_ID`.
- Registros inativos não aparecem.

## 12. Cálculo do orçamento

Passos:

- Escolher ambiente, produto, pedra, cuba e acabamento.
- Informar largura, profundidade, espessura e quantidade.
- Observar o resumo lateral do orçamento.

Resultado esperado:

- O valor da pedra muda conforme largura, profundidade, preço por m² e quantidade.
- Os valores de cuba e acabamento entram no total.
- O valor final estimado é atualizado em tempo real.

## 13. Salvamento do orçamento

Passos:

- Ir até a etapa de resumo do simulador.
- Preencher nome e telefone do cliente de teste.
- Preencher cidade e e-mail opcional, se necessário.
- Clicar em salvar orçamento.

Resultado esperado:

- O sistema exibe mensagem de sucesso.
- Um registro é criado em `quotes`.
- Um registro relacionado é criado em `quote_items`.
- O orçamento usa o `company_id` correto.

## 14. Pedido aparecendo no admin

Passos:

- Acessar `/admin/pedidos`.
- Procurar o orçamento salvo no teste anterior.

Resultado esperado:

- O pedido aparece na listagem.
- São exibidos nome do cliente, telefone, cidade, status, valor total e data.

## 15. Alteração de status do pedido

Passos:

- Acessar `/admin/pedidos`.
- Alterar o status do pedido para:
  - contacted
  - negotiating
  - won
  - lost
- Recarregar a página.

Resultado esperado:

- O novo status permanece salvo.
- O dashboard reflete a alteração nos indicadores correspondentes.

## 16. WhatsApp abrindo com mensagem correta

Passos:

- Acessar `/simulador`.
- Configurar um orçamento completo.
- Ir até a etapa de resumo.
- Clicar em "Solicitar orçamento pelo WhatsApp".

Resultado esperado:

- O WhatsApp abre em nova aba.
- A mensagem contém:
  - Ambiente
  - Produto
  - Pedra
  - Cuba
  - Acabamento
  - Medidas
  - Quantidade
  - Valor estimado
- O número usado é o WhatsApp cadastrado na empresa.

## 17. Responsividade mobile

Passos:

- Abrir a aplicação em viewport mobile.
- Validar:
  - Home
  - Login
  - Simulador
  - Admin Dashboard
  - Pedidos
  - Configurações

Resultado esperado:

- Não há rolagem horizontal indevida.
- Botões continuam clicáveis.
- Campos continuam legíveis.
- Cards e tabelas continuam utilizáveis.
- O simulador mantém as etapas acessíveis.

## Resultado Final Esperado

O MVP deve permitir validar o fluxo principal:

- Login administrativo.
- Cadastro de catálogo básico.
- Simulação com catálogo real.
- Cálculo automático de orçamento.
- Salvamento do pedido.
- Gestão do pedido no painel.
- Envio da solicitação pelo WhatsApp.

Se todos os itens forem aprovados, o MVP está pronto para uma demonstração inicial controlada.
