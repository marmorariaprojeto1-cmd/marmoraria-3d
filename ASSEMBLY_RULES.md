# ASSEMBLY_RULES.md

Versão: 1.0

Objetivo:

Definir como os componentes do catálogo podem ser combinados.

Este documento impede combinações inválidas e serve como base para o simulador, preview 2D, preview 3D e orçamento.

---

# REGRA 001

Todo projeto deve possuir exatamente um tampo.

Obrigatório:

- COMPONENT_001
ou
- COMPONENT_002
ou
- COMPONENT_003

---

# REGRA 002

Frontão é opcional.

Permitidos:

- COMPONENT_020
- COMPONENT_021
- COMPONENT_022
- COMPONENT_023

Somente um frontão principal por lado.

---

# REGRA 003

Saia é opcional.

Permitidos:

- COMPONENT_030
- COMPONENT_031
- COMPONENT_032
- COMPONENT_033

Somente uma configuração de saia por peça.

---

# REGRA 004

Área molhada é opcional.

Permitidos:

- COMPONENT_010
- COMPONENT_011
- COMPONENT_012

Somente uma área molhada por tampo na versão inicial.

---

# REGRA 005

Cuba depende de recorte compatível.

Exemplos:

COMPONENT_041
→ Recorte 500x400

COMPONENT_042
→ Recorte 600x400

COMPONENT_043
→ Cuba esculpida

---

# REGRA 006

Área molhada pode existir sem cuba.

Exemplo:

Área molhada simples para escorredor.

Permitido.

---

# REGRA 007

Área seca é sempre calculada.

Área seca = área total do tampo - área molhada.

Não é um componente independente.

---

# REGRA 008

Preview 3D não toma decisões.

Preview 3D apenas renderiza os componentes recebidos.

Toda regra de montagem deve estar neste documento.

---

# REGRA 009

Novos componentes devem ser cadastrados primeiro no:

CATALOGO_COMPONENTES_MARMORARIA_3D.md

Somente depois podem ser implementados no sistema.

---

# REGRA 010

Nenhum componente deve conhecer outro componente.

A montagem final pertence exclusivamente ao motor de composição.