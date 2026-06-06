# Especificação do Motor Visual 2D/3D

Este documento define a especificação conceitual do motor visual da plataforma Marmoraria 3D.

Não representa implementação de frontend, código, biblioteca instalada ou arquitetura técnica final.

## Objetivo

Permitir que o cliente visualize a peça configurada de forma simples, leve e responsiva.

## Estratégia Inicial

A primeira versão deve priorizar um visual 3D leve, não renderização realista complexa.

O foco inicial é apoiar a decisão comercial do cliente, mostrando proporção, formato, textura da pedra e principais elementos configurados.

## Tecnologias sugeridas

- React
- Three.js
- React Three Fiber

## Elementos renderizáveis

- Bancada
- Pia
- Ilha
- Soleira
- Peitoril
- Balcão
- Cuba
- Cooktop
- Rodabanca
- Saia
- Borda

## Controles

Permitir:

- Rotacionar
- Aproximar
- Afastar
- Trocar textura da pedra
- Alterar medidas
- Alterar posição da cuba

## Texturas

Cada pedra deve possuir:

- Imagem/textura
- Nome
- Categoria
- Aplicação visual no modelo

## Medidas

A visualização deve refletir:

- Largura
- Profundidade
- Espessura
- Altura de rodabanca
- Altura de saia

## Mobile

A experiência precisa funcionar bem no celular.

O motor visual deve priorizar carregamento leve, controles simples e leitura clara em telas pequenas.

## Limitações da V1

Não implementar:

- Renderização fotorrealista
- Medição arquitetônica precisa
- Exportação CAD
- Realidade aumentada

## Evoluções futuras

- Renderização avançada
- Ambiente de cozinha completo
- Realidade aumentada
- Exportação de imagem
- Exportação PDF
