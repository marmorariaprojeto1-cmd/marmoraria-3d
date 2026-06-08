# STONE_LIBRARY.md

Versão: 1.0

Status: Ativo

Objetivo:

Definir oficialmente todas as pedras suportadas pela plataforma Marmoraria 3D.

Este documento é a única fonte oficial para cadastro de pedras utilizadas no:

- simulador
- preview 2D
- preview 3D
- catálogo comercial
- orçamento
- futuras integrações

---

# Estrutura Padrão

Toda pedra cadastrada deve possuir:

- código interno
- nome comercial
- categoria
- acabamento padrão
- textura principal
- cor base
- status

---

# STONE_001

Nome Comercial:

Branco Fortaleza

Categoria:

Granito

Código Interno:

STONE_001

Cor Base:

Branco Acinzentado

Acabamento Padrão:

Polido

Textura Principal:

branco-fortaleza.webp

Status:

Ativo

Palavras-chave:

- branco fortaleza
- granito branco
- branco acinzentado

---

# STONE_002

Nome Comercial:

Branco Siena

Categoria:

Granito

Código Interno:

STONE_002

Cor Base:

Branco Bege

Acabamento Padrão:

Polido

Textura Principal:

branco-siena.webp

Status:

Ativo

Palavras-chave:

- branco siena
- granito branco
- bege claro

---

# STONE_003

Nome Comercial:

Preto São Gabriel

Categoria:

Granito

Código Interno:

STONE_003

Cor Base:

Preto

Acabamento Padrão:

Polido

Textura Principal:

preto-sao-gabriel.webp

Status:

Ativo

Palavras-chave:

- preto sao gabriel
- granito preto
- preto absoluto

---

# STONE_004

Nome Comercial:

Verde Ubatuba

Categoria:

Granito

Código Interno:

STONE_004

Cor Base:

Verde Escuro

Acabamento Padrão:

Polido

Textura Principal:

verde-ubatuba.webp

Status:

Ativo

Palavras-chave:

- verde ubatuba
- granito verde
- verde escuro

---

# STONE_005

Nome Comercial:

Cinza Corumbá

Categoria:

Granito

Código Interno:

STONE_005

Cor Base:

Cinza

Acabamento Padrão:

Polido

Textura Principal:

cinza-corumba.webp

Status:

Ativo

Palavras-chave:

- cinza corumba
- granito cinza
- corumba

---

# STONE_006

Nome Comercial:

Amarelo Ornamental

Categoria:

Granito

Código Interno:

STONE_006

Cor Base:

Amarelo

Acabamento Padrão:

Polido

Textura Principal:

amarelo-ornamental.webp

Status:

Ativo

Palavras-chave:

- amarelo ornamental
- granito amarelo
- ornamental

---

# Regras Gerais

Toda pedra nova deve:

1. Possuir código interno único.
2. Possuir textura principal otimizada.
3. Possuir nome comercial padronizado.
4. Possuir categoria definida.
5. Possuir acabamento padrão definido.
6. Ser cadastrada neste documento antes de entrar no sistema.

---

# Regras do Preview 3D

O preview 3D deve:

- carregar a textura principal da pedra;
- utilizar fallback procedural quando necessário;
- nunca depender exclusivamente da textura para renderizar;
- continuar funcionando mesmo que a textura esteja ausente.

---

# Convenção de Arquivos

Local padrão:

public/textures/stones/

Exemplos:

- branco-fortaleza.webp
- branco-siena.webp
- preto-sao-gabriel.webp
- verde-ubatuba.webp
- cinza-corumba.webp
- amarelo-ornamental.webp

---

# Regra Arquitetural

O preview 3D não deve conhecer nomes de arquivos diretamente.

A resolução entre:

nome da pedra
→ código da pedra
→ textura da pedra

deve ser feita pela camada de mapeamento do sistema.