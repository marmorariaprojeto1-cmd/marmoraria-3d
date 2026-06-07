# Catalogo Padrao do MVP

Este documento define o catalogo padrao oficial do MVP da plataforma Marmoraria 3D.

Ele deve servir como fonte unica da verdade para futuros seeds, imports e processos de onboarding de novas marmorarias.

Este documento nao e SQL, nao e migration e nao executa nenhuma criacao de dados.

## Objetivo

O sistema vira com um catalogo inicial para acelerar a implantacao de novas marmorarias.

A ideia e permitir que uma nova empresa comece a operar o MVP imediatamente, usando produtos, materiais, cubas e acabamentos comuns do mercado brasileiro. Depois da implantacao, cada marmoraria podera revisar nomes, descricoes, imagens, disponibilidade e precos conforme sua realidade comercial.

## Produtos padrao

Todos os produtos abaixo devem ser ativos por padrao no catalogo inicial.

| Nome | Descricao | Ativo por padrao |
| --- | --- | --- |
| Bancada de Cozinha | Bancada para cozinha residencial ou comercial, com medidas personalizadas. | Sim |
| Ilha Gourmet | Ilha central para cozinha, area gourmet ou integracao com ambientes sociais. | Sim |
| Pia de Banheiro | Pia para banheiro com pedra, cuba e acabamento configuraveis. | Sim |
| Lavatorio Esculpido | Lavatorio produzido na propria pedra, com cuba esculpida e acabamento personalizado. | Sim |
| Soleira | Peca linear usada em portas, passagens e transicoes de piso. | Sim |
| Peitoril | Peca para acabamento de janelas, areas externas e vãos. | Sim |
| Nicho | Nicho em pedra para banheiro, area de banho ou decoracao. | Sim |
| Escada | Degraus, pisos e espelhos de escada em pedra natural ou industrializada. | Sim |
| Mesa | Tampo de mesa em pedra, com medidas e material configuraveis. | Sim |
| Churrasqueira | Bancada ou acabamento em pedra para churrasqueira e area gourmet. | Sim |

## Pedras padrao

Todos os materiais abaixo devem ser ativos por padrao. O campo de preco deve ser editavel pela marmoraria, pois valores variam por regiao, fornecedor, lote, espessura, acabamento, disponibilidade e margem comercial.

### Granitos

| Nome | Categoria | Ativo por padrao | Campo de preco editavel pela marmoraria |
| --- | --- | --- | --- |
| Preto Sao Gabriel | Granito | Sim | Sim |
| Preto Absoluto | Granito | Sim | Sim |
| Verde Ubatuba | Granito | Sim | Sim |
| Branco Siena | Granito | Sim | Sim |
| Branco Itaunas | Granito | Sim | Sim |
| Cinza Corumba | Granito | Sim | Sim |
| Amarelo Ornamental | Granito | Sim | Sim |
| Branco Dallas | Granito | Sim | Sim |
| Branco Fortaleza | Granito | Sim | Sim |
| Cafe Imperial | Granito | Sim | Sim |
| Verde Labrador | Granito | Sim | Sim |
| Cinza Andorinha | Granito | Sim | Sim |

### Quartzos

| Nome | Categoria | Ativo por padrao | Campo de preco editavel pela marmoraria |
| --- | --- | --- | --- |
| Quartzo Branco | Quartzo | Sim | Sim |
| Quartzo Branco Prime | Quartzo | Sim | Sim |
| Quartzo Cinza | Quartzo | Sim | Sim |
| Quartzo Cinza Claro | Quartzo | Sim | Sim |
| Quartzo Preto | Quartzo | Sim | Sim |
| Quartzo Calacatta | Quartzo | Sim | Sim |
| Quartzo Carrara | Quartzo | Sim | Sim |
| Quartzo Bege | Quartzo | Sim | Sim |

### Marmores

| Nome | Categoria | Ativo por padrao | Campo de preco editavel pela marmoraria |
| --- | --- | --- | --- |
| Branco Parana | Marmore | Sim | Sim |
| Branco Pigues | Marmore | Sim | Sim |
| Carrara | Marmore | Sim | Sim |
| Calacatta | Marmore | Sim | Sim |
| Travertino Romano | Marmore | Sim | Sim |
| Crema Marfil | Marmore | Sim | Sim |
| Nero Marquina | Marmore | Sim | Sim |
| Imperador | Marmore | Sim | Sim |

### Superficies Industrializadas

| Nome | Categoria | Ativo por padrao | Campo de preco editavel pela marmoraria |
| --- | --- | --- | --- |
| Dekton Aura | Superficie Industrializada | Sim | Sim |
| Dekton Sirius | Superficie Industrializada | Sim | Sim |
| Dekton Kelya | Superficie Industrializada | Sim | Sim |
| Silestone Branco Zeus | Superficie Industrializada | Sim | Sim |
| Silestone Eternal Calacatta | Superficie Industrializada | Sim | Sim |
| Neolith Calacatta | Superficie Industrializada | Sim | Sim |

### Categoria Especial

| Nome | Categoria | Ativo por padrao | Campo de preco editavel pela marmoraria |
| --- | --- | --- | --- |
| Onix Branco | Categoria Especial | Sim | Sim |
| Onix Mel | Categoria Especial | Sim | Sim |
| Quartzito Taj Mahal | Categoria Especial | Sim | Sim |
| Quartzito Mont Blanc | Categoria Especial | Sim | Sim |

Total de materiais padrao: 38.

## Cubas padrao

Todas as cubas abaixo devem ter preco editavel pela marmoraria.

| Nome | Tipo | Preco editavel |
| --- | --- | --- |
| Cuba inox simples | Inox | Sim |
| Cuba inox dupla | Inox | Sim |
| Cuba gourmet | Gourmet | Sim |
| Cuba esculpida | Esculpida | Sim |
| Cuba de apoio redonda | Apoio | Sim |
| Cuba de apoio quadrada | Apoio | Sim |

## Acabamentos padrao

Os acabamentos abaixo formam a base inicial do MVP. O `pricing_type` sugerido pode ser ajustado no futuro conforme a regra comercial da marmoraria.

| Nome | pricing_type sugerido | Observacao |
| --- | --- | --- |
| Reto | linear_meter | Cobrado por metro linear quando aplicado em bordas. |
| Meia esquadria | linear_meter | Cobrado por metro linear pela complexidade do acabamento. |
| Boleado simples | linear_meter | Cobrado por metro linear. |
| Boleado duplo | linear_meter | Cobrado por metro linear, normalmente com valor superior ao boleado simples. |
| Saia reta | linear_meter | Cobrado por metro linear ou regra equivalente de saia. |
| Saia com meia esquadria | linear_meter | Cobrado por metro linear, com maior complexidade de execucao. |

Tipos de precificacao suportados pelo MVP:

- `fixed`
- `linear_meter`
- `percentage`

## Campos editaveis pela marmoraria

Cada marmoraria podera alterar os dados do catalogo padrao conforme sua operacao:

- preco
- nome
- descricao
- imagem
- ativo/inativo

## Estrategia de implantacao

Uma nova marmoraria podera iniciar usando o catalogo padrao imediatamente, sem necessidade de cadastro manual completo antes da primeira demonstracao ou validacao.

O fluxo recomendado para onboarding futuro sera:

1. criar a empresa;
2. importar o catalogo padrao para a empresa;
3. permitir que a marmoraria ajuste precos e disponibilidade;
4. revisar imagens e descricoes;
5. ativar o simulador para uso controlado.

O catalogo padrao deve sempre respeitar o modelo multiempresa: cada empresa recebera sua propria copia editavel dos registros, sem compartilhar precos, disponibilidade ou configuracoes comerciais com outras marmorarias.

## Escopo MVP

Este catalogo e apenas o catalogo inicial do MVP.

Ele existe para reduzir atrito de implantacao e acelerar a validacao do fluxo principal. O catalogo podera ser expandido posteriormente com novas categorias, materiais, acabamentos, regras de preco, recortes, furacoes, rodabancas, saias, instalacao, frete e margem por empresa.

Este documento nao define valores comerciais finais. Todos os precos devem ser revisados pela marmoraria antes de uso real.

## Resumo executivo

| Grupo | Quantidade padrao |
| --- | ---: |
| Produtos padrao | 10 |
| Pedras padrao | 38 |
| Cubas padrao | 6 |
| Acabamentos padrao | 6 |
