# Prejuicios y daños de carácter manifiesto en las MLL

> Gallegos, Rossi, Barrow, Tanjim, Kim, Dernoncourt, Yu, Zhang, Ahmed (Lingüística Computacional 2024, arXiv:2309.00770)。2024 años de base de la base, se dividirá entre la expresión de la lesión (刻板印象、抹除) y la distribución de la lesión (资源分配不平等) 区分开,并将评估指标归类为基于嵌入性、基于概率或基于生成文本──2024-2025 实证研究:An et al. (PNAS Nexus, marzo 2025) En 20 个入门级位的自动简历评估中,衡量 GPT-3.5 Turbo、GPT-4o、Gemini 1.5 Flash、Claude 3.5 Sonnet、Llama 3-70B 上的交叉性性别 x race 偏见――WinoIdentity (COLM 2025, arXiv:2508.07111) 引入基于不确定性的交叉身份公平性评估──Yu & Ananiadou 2025 识别 MLP层中的性别神经元;Ahsan & Wallace 2025 使用SAEs 揭示临床场中的种族偏见;Zhou et al. 2024 (UniBias) 通过操纵注意头脑 进行去偏──元批判 (arXiv:2508.11067): 10 años de literatura excesivamente enfocada en los prejuicios de género de la segunda generación.

**类型：**Construcción
**语言：**Python (stdlib, sonda de sesgo basada en el embebimiento de juguetes)
**先修要求：**Fase 05 (embedings de palabras), Fase 18 · 01 (instrucciones siguientes)
**时间：**- 60 minutos

## El objetivo del aprendizaje

- ☐ la reducción de los costes de trabajo y de la prestación de servicios de trabajo, y
- Explicó que Gallegos et al. en 2024 describió uno de los tres indicadores de evaluación.
- Describir la interconexión y por qué la medición de la equidad basada en la incertidumbre de la identidad vinícola ha compensado la falta de evaluación de la prejuicio de un solo eje.
- 描述两种偏见的机制可解释性方法(neuronas de género ✓ características de la ESA ✓ manipulación de la cabeza de la atención) ✓

##  problemas

El curso anterior cubre las lesiones intencionales (prisioneros, esquemas) y la administración de seguridad. El prejuicio es un daño que surge sin querer, que puede ser un método de formación de distribución de datos, de un marco de trabajo rápido o de una selección de diseño acumulada.

## 概念

### Expresión contra distribución

- **表征性伤害。**刻板印象、抹除、损性描绘── una enfermera descrita como una LLM completamente femenina, está produciendo una lesión exhibicional──
- **分配性伤害。**Resultados materiales desigual¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

El segundo no es el mismo. Un modelo puede exhibirse sin prejuicio.

### Tres clases de evaluación de los indicadores (Gallegos et al. 2024)

- **基于 Embedding。**En los embeddings pre-RLHF 上 realizar WEAT 风格测试。衡量身份词与属性词之间的统计关联──局限: mide es decir, no comportamiento──
- **基于概率。**刻板印象确认型补全与刻板印象违反型补全的日志-概率──Decoder 侧测量──能捕捉部分行为偏见──
- **基于生成文本。**En el texto de generación se realiza la medición de tareas.

### 交叉性

En el año 2025 se encontró que, en el curso de la evaluación, el GPT-4o consideraba que las mujeres negras sufrían un grado de castigo superior al de los hombres negros, y también al de las mujeres blancas.

WinoIdentity (COLM 2025) introdujo la equidad de intercambio basada en la incertidumbre. Mediría si los resultados de los modelos en diferentes grupos de identidad de intercambio son diferentes, no sólo medir puntos de pronóstico. Esto puede capturar ciertas situaciones: el modelo es igual de equivocado para cada grupo, pero es más incierto para algunos grupos, y esto generará diferentes comportamientos de distribución de flujo.

### 机制方法  mecanismo método

El trabajo explicable de 2024-2025 permite que los prejuicios sean aceptables en el nivel del mecanismo:

- **Gender neurons (Yu & Ananiadou 2025)。** Los neuronas MLP específicos relacionados con comportamientos sexuales diferentes                                                                                                                                                                                                                                                                                          
- **通过 SAEs 识别临床种族偏见 (Ahsan & Wallace 2025)。**Las características de autoencoder Sparse se expresarán internamente en una dimensión explicable; se pueden identificar y inhibir características relacionadas con la raza.
- **UniBias (Zhou et al. 2024)。**Utilizando la manipulación de la cabeza de atención de tiro cero, cabezas específicas aumentarán la sensibilidad de la clase de identidad; colocar estas cabezas a cero o volver a aumentar su poder, puede reducir los prejuicios en caso de no realizar ajustes finos.

### 元批判

Este artículo de 10 años de literatura resumen: arXiv:2508.11067, 2025) encontró que el campo se centra demasiado en el prejuicio de género de dos dimensiones. Otras líneas, incluyendo discapacidad, religión, migración, identidad y identidad, se centran en menos de una cantidad mayor de personas.

### Está en la fase 18

Lecciones 20-21 Forma de cobertura parcial y equidad. Lección 22  cobertura de privacidad. Lección 23  cobertura de marcado de agua.


```figure
an-bias-two-harms
```

## Usalo

`code/main.py`Construir una sonda de sesgo basada en el embebedamiento de juguete: en el simple共现 embebedamiento, medir la distancia entre el idioma y el idioma. Puedes inyectar un indicador de observación y observación; aplicar un simple desvio de la operación y observar la parte de recuperación.

##  entregarlo

本课产 出  `outputs/skill-bias-eval.md` Proponer una tarjeta modelo o una declaración de equidad, que se basará en tres tipos de indicadores:

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ Reporting to bias 风格偏见分数前后步骤前后的 WEAT 风格偏见分数―― explicar por qué este índice no se redujo a cero――

2. Usando una encuesta de encuesta de género, raza x (carrera, familia)

3. 阅读 An et al. 2025 (PNAS Nexus)  找出他们的报告的两个交叉性效应,而这些效应将被单轴性别 评估漏掉──

4. Yu & Ananiadou 2025 identificaron neuronas de género― diseñar un falso experimento, para distinguir  estas neuronas  conducen al sesgo de género y  estas neuronas con el sesgo de género                                                                                                                                                                                                                                    

5. El autor critica que el campo es demasiado estrecho para centrarse en el género de dos dimensiones.

## 关键术语: "El hombre es un hombre"

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
- [WinoIdentity — 基于不确定性的交叉公平性（arXiv:2508.07111, COLM 2025）](https://arxiv.org/abs/2508.07111) Nuevo índice de referencia
- [UniBias — attention-head manipulation (Zhou et al. 2024, ACL)](https://arxiv.org/abs/2405.20612) tiro cero
