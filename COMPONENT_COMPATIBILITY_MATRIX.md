# COMPONENT_COMPATIBILITY_MATRIX.md

Versão: 1.0

Status: Ativo

Objetivo:

Definir oficialmente quais componentes podem ser combinados entre si.

Este documento é a autoridade máxima sobre compatibilidade de componentes da plataforma Marmoraria 3D.

Nenhuma implementação deve ignorar estas regras.

---

# LEGENDA

✅ Permitido

❌ Não permitido

⚠️ Permitido com validação adicional

---

# TAMPOS × ÁREAS MOLHADAS

| Componente | Área Reta | Área Dupla | Área 45° |
|------------|-----------|------------|-----------|
| COMPONENT_001 (20 mm) | ✅ | ⚠️ | ⚠️ |
| COMPONENT_002 (30 mm) | ✅ | ✅ | ✅ |
| COMPONENT_003 (40 mm) | ✅ | ✅ | ✅ |

Observação:

Tampo 20 mm pode exigir validações adicionais dependendo do tipo de área molhada.

---

# TAMPOS × FRONTÕES

| Componente | Sem Frontão | 50 mm | 100 mm | 120 mm |
|------------|-------------|--------|---------|---------|
| COMPONENT_001 | ✅ | ✅ | ✅ | ✅ |
| COMPONENT_002 | ✅ | ✅ | ✅ | ✅ |
| COMPONENT_003 | ✅ | ✅ | ✅ | ✅ |

---

# TAMPOS × SAIAS

| Componente | Sem Saia | 40 mm | 60 mm | 80 mm |
|------------|----------|--------|--------|--------|
| COMPONENT_001 | ✅ | ✅ | ⚠️ | ⚠️ |
| COMPONENT_002 | ✅ | ✅ | ✅ | ✅ |
| COMPONENT_003 | ✅ | ✅ | ✅ | ✅ |

---

# ÁREAS MOLHADAS × CUBAS

| Área Molhada | Recorte 500x400 | Recorte 600x400 | Cuba Esculpida |
|--------------|----------------|----------------|----------------|
| COMPONENT_010 | ✅ | ✅ | ✅ |
| COMPONENT_011 | ✅ | ✅ | ✅ |
| COMPONENT_012 | ⚠️ | ⚠️ | ✅ |

Observação:

Área molhada 45° pode exigir ajustes de posicionamento dependendo da cuba.

---

# FRONTÕES × SAIAS

| Frontão | Sem Saia | 40 mm | 60 mm | 80 mm |
|----------|----------|--------|--------|--------|
| COMPONENT_020 | ✅ | ✅ | ✅ | ✅ |
| COMPONENT_021 | ✅ | ✅ | ✅ | ✅ |
| COMPONENT_022 | ✅ | ✅ | ✅ | ✅ |
| COMPONENT_023 | ✅ | ✅ | ✅ | ✅ |

---

# CUBAS × TAMPOS

| Cuba | 20 mm | 30 mm | 40 mm |
|--------|--------|--------|--------|
| COMPONENT_041 | ✅ | ✅ | ✅ |
| COMPONENT_042 | ✅ | ✅ | ✅ |
| COMPONENT_043 | ⚠️ | ✅ | ✅ |

Observação:

Cuba esculpida normalmente requer espessura mínima de 30 mm.

---

# COMBINAÇÕES PROIBIDAS

Atualmente:

Nenhuma combinação está explicitamente bloqueada.

Toda incompatibilidade futura deverá ser cadastrada aqui.

Exemplo:

❌ Cuba Esculpida + Tampo 20 mm

❌ Área Molhada Dupla + Profundidade Inferior a 500 mm

❌ Frontão 120 mm + Determinado Acabamento

---

# REGRAS DE VALIDAÇÃO FUTURAS

O motor de montagem deverá validar:

- largura mínima;
- profundidade mínima;
- espessura mínima;
- distância de recortes;
- posição de cuba;
- posição de cooktop;
- área molhada mínima;
- área seca mínima.

---

# REGRA PRINCIPAL

O simulador não deve criar compatibilidades.

Toda compatibilidade deve existir primeiro neste documento.

O preview 2D, preview 3D, orçamento e motor de montagem devem consumir as regras definidas nesta matriz.

Qualquer nova peça criada deverá obrigatoriamente atualizar:

- CATALOGO_COMPONENTES_MARMORARIA_3D.md
- ASSEMBLY_RULES.md
- COMPONENT_RENDER_RULES.md
- COMPONENT_COMPATIBILITY_MA