# Estrategia de Importacao do Catalogo Padrao

## Objetivo

Definir como uma nova marmoraria recebera o catalogo padrao inicial da plataforma Marmoraria 3D.

O objetivo e acelerar o onboarding de novas empresas sem comprometer o isolamento multiempresa. A empresa deve iniciar com produtos, pedras, cubas e acabamentos comuns do MVP, mas precisa ter liberdade para adaptar tudo a sua realidade comercial.

## Decisao principal

O modelo oficial recomendado e:

```text
Catalogo Mestre
↓
Clonagem para empresa
↓
Empresa edita sua propria copia
```

O catalogo mestre funciona como referencia inicial. No onboarding, os registros sao clonados para a empresa, recebendo o `company_id` da marmoraria. A partir desse momento, a copia pertence a empresa e pode ser editada sem afetar outras marmorarias.

## Por que nao usar catalogo compartilhado

Nao devemos usar um catalogo operacional compartilhado entre empresas, porque cada marmoraria precisa poder alterar:

- preco
- disponibilidade
- nome
- descricao
- imagem
- margem comercial
- regras proprias

sem afetar outras empresas.

Um catalogo compartilhado criaria risco de uma alteracao global indevida. Por exemplo, se uma empresa alterasse o preco do Preto Sao Gabriel, esse valor poderia aparecer para outras empresas, quebrando o principio multiempresa e criando problemas comerciais.

## Fluxo de onboarding

O fluxo recomendado para novas marmorarias e:

1. Criar empresa.
2. Criar usuario `owner`.
3. Clonar produtos padrao.
4. Clonar pedras padrao.
5. Clonar cubas padrao.
6. Clonar acabamentos padrao.
7. Marmoraria revisa precos.
8. Marmoraria ativa/desativa itens.
9. Simulador fica pronto para uso.

## Regra multiempresa

Cada registro clonado deve receber:

- `company_id` da empresa
- `active = true` por padrao
- preco inicial editavel
- campos de imagem opcionais

Os registros clonados devem ser independentes por empresa. Nenhuma marmoraria deve ler, alterar ou depender diretamente do catalogo clonado de outra marmoraria.

## Atualizacao futura do catalogo mestre

Alteracoes futuras no catalogo mestre nao devem sobrescrever automaticamente os catalogos das empresas.

Depois que uma empresa recebe sua copia, ela pode ter alterado nomes, precos, imagens, margens, disponibilidade e regras comerciais. Sobrescrever esses dados automaticamente poderia causar perdas de configuracao e problemas comerciais.

Atualizacoes futuras devem funcionar como sugestoes ou importacoes opcionais, por exemplo:

- sugerir novos materiais adicionados ao catalogo mestre;
- permitir importar apenas itens que ainda nao existem na empresa;
- mostrar diferencas antes de aplicar qualquer mudanca;
- registrar historico de importacao.

## Estrategia recomendada para o MVP

No MVP, a estrategia deve permanecer simples e controlada:

- criar seed manual ou script controlado;
- clonar os registros padrao para uma empresa demo;
- nao criar automacao complexa ainda.

Essa abordagem permite validar rapidamente o fluxo principal sem antecipar uma infraestrutura de onboarding mais sofisticada.

## Estrategia futura

No futuro, a plataforma podera evoluir para:

- painel interno de onboarding;
- botao "Importar catalogo padrao";
- botao "Adicionar novos itens sugeridos";
- controle de versao do catalogo mestre;
- historico de importacoes.

Esses recursos devem preservar a regra principal: importar sugestoes para a copia da empresa, nunca operar o catalogo de todas as empresas como uma tabela compartilhada de precos e disponibilidade.

## Riscos se a estrategia for errada

- Preco de uma empresa afetando outra.
- Alteracao global indevida.
- Dificuldade para personalizar catalogos.
- Problemas comerciais com valores, disponibilidade e margem.
- Retrabalho no SaaS multiempresa.
- Perda de confianca na separacao entre marmorarias.
- Dificuldade para evoluir regras proprias por empresa.

## Proximos passos

Ordem futura recomendada:

1. Criar script de seed demo.
2. Criar seed para produtos.
3. Criar seed para pedras.
4. Criar seed para cubas.
5. Criar seed para acabamentos.
6. Criar botao interno de importacao no futuro.

Esses passos devem ser feitos em tarefas futuras especificas. Este documento nao cria SQL, nao cria migrations e nao executa seeds.
