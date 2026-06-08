CATALOGO_COMPONENTES_MARMORARIA_3D

Versão: 1.0

Status: Em Construção

Objetivo:

Padronizar os componentes oficiais utilizados pelo simulador, preview 2D, preview 3D e futuras regras de orçamento da plataforma Marmoraria 3D.

Regra Principal:

Os componentes devem ser independentes entre si.

Nenhum componente deve conhecer regras internas de outro componente.

A montagem final será responsabilidade do motor de composição.

⸻

GRUPO 001 — TAMPOS

COMPONENT_001

Nome:
Tampo Reto 20 mm

Categoria:
Tampo

Parâmetros:

* largura
* profundidade

Compatível com:

* frontão
* saia
* área molhada
* cuba
* cooktop

⸻

COMPONENT_002

Nome:
Tampo Reto 30 mm

Categoria:
Tampo

Parâmetros:

* largura
* profundidade

Compatível com:

* frontão
* saia
* área molhada
* cuba
* cooktop

⸻

COMPONENT_003

Nome:
Tampo Reto 40 mm

Categoria:
Tampo

Parâmetros:

* largura
* profundidade

Compatível com:

* frontão
* saia
* área molhada
* cuba
* cooktop

⸻

GRUPO 010 — ÁREAS MOLHADAS

COMPONENT_010

Nome:
Área Molhada Reta

Categoria:
Área Molhada

Compatível com:

* tampo reto
* cuba inox
* cuba esculpida

⸻

COMPONENT_011

Nome:
Área Molhada Dupla

Categoria:
Área Molhada

Compatível com:

* tampo reto
* cuba inox
* cuba esculpida

⸻

COMPONENT_012

Nome:
Área Molhada 45°

Categoria:
Área Molhada

Compatível com:

* tampo reto
* cuba inox
* cuba esculpida

⸻

GRUPO 020 — FRONTÕES

COMPONENT_020

Nome:
Sem Frontão

Categoria:
Frontão

⸻

COMPONENT_021

Nome:
Frontão 50 mm

Categoria:
Frontão

Parâmetros:

* comprimento
* posição

⸻

COMPONENT_022

Nome:
Frontão 100 mm

Categoria:
Frontão

Parâmetros:

* comprimento
* posição

⸻

COMPONENT_023

Nome:
Frontão 120 mm

Categoria:
Frontão

Parâmetros:

* comprimento
* posição

⸻

GRUPO 030 — SAIAS

COMPONENT_030

Nome:
Sem Saia

Categoria:
Saia

⸻

COMPONENT_031

Nome:
Saia 40 mm

Categoria:
Saia

Parâmetros:

* comprimento

⸻

COMPONENT_032

Nome:
Saia 60 mm

Categoria:
Saia

Parâmetros:

* comprimento

⸻

COMPONENT_033

Nome:
Saia 80 mm

Categoria:
Saia

Parâmetros:

* comprimento

⸻

GRUPO 040 — CUBAS

COMPONENT_040

Nome:
Sem Cuba

Categoria:
Cuba

⸻

COMPONENT_041

Nome:
Recorte 500 x 400

Categoria:
Cuba

Compatível com:

* cuba inox 500 x 400

⸻

COMPONENT_042

Nome:
Recorte 600 x 400

Categoria:
Cuba

Compatível com:

* cuba inox 600 x 400

⸻

COMPONENT_043

Nome:
Cuba Esculpida

Categoria:
Cuba

Compatível com:

* área molhada reta
* área molhada dupla
* área molhada 45°

⸻

REGRA DE MONTAGEM

Exemplo:

Cliente seleciona:

* COMPONENT_002
* COMPONENT_012
* COMPONENT_022
* COMPONENT_031
* COMPONENT_041

O motor de composição monta:

Tampo reto 30 mm
+
Área molhada 45°
+
Frontão 100 mm
+
Saia 40 mm
+
Recorte 500 x 400

⸻

REGRA ARQUITETURAL

O preview 3D não cria componentes.

O preview 3D apenas renderiza componentes já definidos neste catálogo.

Toda nova peça deve primeiro ser cadastrada neste documento antes de ser implementada em código.