# Preconceitos e lesões manifestantes entre as LLM

> Gallegos, Rossi, Barrow, Tanjim, Kim, Dernoncourt, Yu, Zhang, Ahmed (Linguística Computacional 2024, arXiv:2309.00770)。2024 anos de base, 表征性伤害(刻板印象、抹除) e distribuição 资源分配不平等) distinção,并将评估指标归类为基于嵌入、基于概率或基于生成文本──2024-2025 实证研究:An et al. (PNAS Nexus, março 2025) Em 20 个入门级位的自动简历评估, medir GPT-3.5 Turbo、GPT-4o、Gemini 1.5 Flash、Claude 3.5 Sonnet、Llama 3-70B 上的交叉性性别 x race 偏见――WinoIdentity (COLM 2025, arXiv:2508.07111) 引入基于不确定性的交叉身份公平性评估――Yu & Ananiadou 2025 识别 MLP 层中的性别神经元;Ahsan & Wallace 2025 使用SAEs 揭露临床场中的种族偏见;Zhou et al. 2024 (UniBias) 通过操纵注意头进行去偏──元批判 (arXiv:2508.11067): 10 年文献过度聚焦于二元性别偏见──

**类型：**Construção
**语言：**Python (stdlib, sonda de preconceito baseada em inserção de brinquedos)
**先修要求：**Fase 05 (embedings de palavras), Fase 18 · 01 (instruções seguintes)
**时间：**- 60 minutos.

## Objectivo de aprendizagem

- ☐ define a manifestação de danos e danos distribuídos, e cada um dá um exemplo na implementação do MLL:
- Dizendo que Gallegos et al. 2024 em três tipos de indicadores de avaliação,并分别描述其中一个指标――
- Descrição da intersecção, e por que a medida de equidade baseada na incerteza da WinoIdentity compensa a lacuna na avaliação de preconceitos de um único eixo.
- 描述两种偏见的机制可解释性方法 (Mécanismo de duas formas de preconceito pode ser explicado por métodos de interpretação de métodos de interpretação de métodos de interpretação de métodos de interpretação de métodos de interpretação de métodos de interpretação de métodos de interpretação de métodos de interpretação de dados).

## 问题

O curso anterior abrange lesões intencionais (jailbreaks, scheming) e gestão de segurança. O preconceito é uma lesão que surge de forma involuntária, que pode ser treinado em uma forma de distribuição de dados, de um rápido quadro, ou de uma seleção de design acumulada.

## 概念

### Expressão vs distribuição

- **表征性伤害。**O que é um tratamento de saúde para os pacientes com doenças cardiovasculares?
- **分配性伤害。**Resultados materiais desigual­mente. Uma aplicação sistematicamente ao candidato negro de LLM de menor grau, está a causar danos distributivos.

O modelo pode ser representado sem preconceito, produzindo uma descrição diversificada, ao mesmo tempo que a distribuição tem preconceito, dando uma recomendação desigual, e a avaliação precisa medir o outro.

### O artigo 5.o do Regulamento (UE) n.o 1095/2013 do Parlamento Europeu e do Conselho (JO L 345, 20.12.2013, p. 1).

- **基于 Embedding。**Em embalagens pré-RLHF 上 realizar WEAT 风格测试。衡量身份词与属性词之间的统计关联──局限:
- **基于概率。**刻板印象确认型补全与刻板印象违反型补全的日志-概率──Decoder 侧测量──能捕捉部分行为偏见──
- **基于生成文本。**Em gerar textos, realizar a medição de tarefas.

### 交叉性

A avaliação de preconceitos sobre gênero é apenas uma análise de preconceitos sobre gênero e raça.

A WinoIdentity (COLM 2025) introduziu a equidade de cessar baseada em incerteza. Ele mede o modelo de resultados de diferentes grupos de identidade de cessar-fogo, não apenas a medida de pontos de previsão.

### 机制方法

O trabalho explicável de 2024-2025 permite que os preconceitos sejam aceitáveis no âmbito do mecanismo:

- **Gender neurons (Yu & Ananiadou 2025)。** determinados neurônios MLP relacionados com comportamentos sexuais diferentes                                                                                                                                                                                                                                                        
- **通过 SAEs 识别临床种族偏见 (Ahsan & Wallace 2025)。**As características do autoencoder Sparse vão representar o interior de forma a se descomplicar para uma dimensão explicável; pode identificar e inibir características relacionadas à raça.
- **UniBias (Zhou et al. 2024)。**Utilizando manipulação de cabeça de atenção de tiro zero, cabeças específicas aumentam a sensibilidade da classe de identidade; colocando essas cabeças em zero ou reajustando-as, pode ser possível reduzir as preconceitas em caso de não realizar ajustes finos.

### 元批判

Este artigo de 10 anos foi publicado em 2010 e publicado em www.arXiv.org.br.

### Está na fase 18 .

Lições 20-21 Formalidade de cobertura preconceito e equidade. Lição 22  cobertura privacidade. Lição 23  cobertura marcação de água.


```figure
an-bias-two-harms
```

## Use-o

`code/main.py`Construir uma sonda de preconceito baseada em inserção de brinquedo: em simples embutidos, você pode inserir um indicador de inserção de preconceito e observar o indicador de inserção; aplicar um simples embutidos, fazer a observação e recuperar o seu componente.

## Entrega-o

本课产 出 `outputs/skill-bias-eval.md` uma carta modelo ou declaração de equidade, que será analisada a partir de três tipos de indicadores:

## 练习

1. 运行 `code/main.py`◊ Relatório de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Precição de Preção de Precição de Preção de Precição de Preção de Precição de Precição de Precição de Preção de Preção de Preção de Preção de Preção de Preção de Preção de Preção de Preção de Preção de Pre

2. Use a um交叉性测试扩展探:(gênero, raça) x (carreira, família) ⋅ relatório跨轴偏见分数──

3. An et al. 2025 (PNAS Nexus) : "Find out of their report's two cross-cutting effects, while these effects will be evaluated by single axis gender  evaluated by single axis gender  evaluated by single axis gender  evaluated by single axis gender  evaluated by single axis gender  evaluated by single axis gender  evaluated by single axis gender  evaluated by single axis gender  evaluated by single axis gender  evaluated by single axis gender  evaluated by single axis gender  evaluated by single axis gender  evaluated by single axis gender  evaluated by single axis gender  evaluated by single axis gender  evaluated by single axis  evaluated by single axis  evaluated by single axis  evaluated by single axis  evaluated by single axis  evaluated by single axis  evaluated by single axis  evaluated by single axis  evaluated by single axis  evaluated by the two axis  evaluated by the two axis of the two axis of the two axis of the two axis of the two axis of the two axis of the two axis of the two axis of the two axis of the two axis of the two axis of the two axis of the two axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the axis of the

4. Yu & Ananiadou 2025 identificaram neurônios de gênero― desenhar uma prova falsa, para distinguir  estes neurônios  conduzem a preconceito de gênero e  estes neurônios  estão relacionados  

5. Os antigos críticos consideram que o domínio é muito estreito e focalizado em dois géneros.

## 关键术语

| 术语 | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| 表征性伤害 | “刻板印象 / 抹除” | 对某个群体的有偏描绘 |
| 分配性伤害 | “不平等决策” | 针对某个群体的有偏物质结果 |
| WEAT | “Embedding 测试” | Word Embedding Association Test；基于共现的偏见 probe |
| 交叉性 | “组合身份效应” | 在多个身份轴线交汇处出现的偏见 |
| Gender neurons | “MLP 偏见 neurons” | 激活与性别特异行为相关的特定 neurons |
| SAE feature | “可解释维度” | Sparse-autoencoder 识别出的 feature；可用于机制性偏见分析 |
| UniBias | “attention-head 去偏” | 通过重新加权 attention heads 进行 zero-shot 去偏 |

## 延伸阅读

- [Gallegos et al. — Bias and Fairness in LLMs: A Survey (arXiv:2309.00770, Computational Linguistics 2024)](https://arxiv.org/abs/2309.00770) 经典综述
- [An et al. — Intersectional resume-evaluation bias (PNAS Nexus, March 2025)](https://academic.oup.com/pnasnexus/article/4/3/pgaf089/8111343) 五模型交叉性研究
- [WinoIdentity — 基于不确定性的交叉公平性（arXiv:2508.07111, COLM 2025）](https://arxiv.org/abs/2508.07111) Novo índice de referência
- [UniBias — attention-head manipulation (Zhou et al. 2024, ACL)](https://arxiv.org/abs/2405.20612)- Não é nada .
