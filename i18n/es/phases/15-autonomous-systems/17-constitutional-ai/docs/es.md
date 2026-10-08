# Inteligencia artificial constitucional y reglas

> Antropic  Publicado el 22 de enero de 2026 en la Constitución de Claude 共 79 páginas, con CC0 授权. Se transfiere de la regulación basada en la regulación a la regulación basada en la racionalización, y establece cuatro niveles prioritarios: 1) seguridad y apoyo a la supervisión humana, 2) ética, 3) guía antropológica, 4) utilidad. El comportamiento se divide en prohibición codificada: la mejora de la capacidad de las armas biológicas, CSAM) y el código suave: los primeros operadores y usuarios no pueden cubrirlos, los últimos pueden definir las fronteras de la regulación. La versión original de 2022 de Bai et al. mediante la crítica de sí mismo y el entrenamiento de RLAIF contra el daño.

**Type:** Learn
**Languages:** Python (stdlib, four-tier priority resolver)
**前置要求：**Fase 15 · 06 (Automatización de la alineación de estudios), Fase 15 · 10 (权限模式)
**Time:** ~60 minutes

##  problemas

Un agente desplegado encontrará entradas que el diseñador nunca ha visto. No hay ninguna lista de reglas que llegue a cubrirlas.

基于规则的对齐(RBA): lista todos los hechos no permitidos. 查查很快,易审计,不可能保持最新,并且经常会对它未预见的相近类比过度拒绝. 基于推理的对齐(2026 Claude Constitution):编码原则,让模型推理──能扩展到未见的案例,更难审计,失败模式是原则误用,而不是漏掉规则──

2026 Constitución  adoptó una posición central clara. La prohibición de código duro, es decir, su erroreo no depende de los hechos siguientes.

## 概念

### Cuatro niveles de prioridad

1. **安全与支持人类监督。**La máxima, la prioridad es evitar debilitar la capacidad de la inteligencia artificial humana y antrope, no es mantener la prudencia, sino que es más que difícil hacer que la inteligencia humana sea supervisada.
2. **伦理。**诚实、避免伤害个人、不欺骗、不操纵──当它与人类指南冲突时,伦理优先──
3. **Anthropic 指南。**Antropic  considera importante la normativa de operación: producto alcance 交互模式 何时使用哪些工具──
4. **有用性。**Lo más mínimo. Lo más útil posible en el ámbito de la prioridad superior.

Cuando los niveles de conflicto, los niveles más altos logran ganar. Esto es lo mismo que la forma de la prioridad de Unix o de la QoS de red: este marco tiene como objetivo producir resultados de resolución predecibles, no necesariamente en el mejor comportamiento en cualquier dimensión única.

### Prohibición de código duro y código blando por defecto

**Hardcoded:**
- 生物武器 / CBRN 能力提升
- CSAM
- Ataques contra infraestructuras clave
- En la pregunta directa engañar a los usuarios acerca de la identidad del modelo

操作方不能覆盖这些. 用户也不能覆盖这些. 它们将在可能的情况下执行模型权重层 (RLHF / Constitutional AI 训练),否则在推理层执行――

**Soft-coded default（操作方可调整）：**
- 响应长度默认值
- Tema de la serie (del mismo modo que el modelo puede rechazar la operación)
- 风格(正式 vs 随意)
- 工具使用模式 工具使用模式 工具使用模式

操作方调整发生在声明边界内. 操作方不能通过重新命名移除硬码禁令.

### Entrenamiento de CAI 2022

El primer programa de investigación de la Universidad de Chicago fue el de la Universidad de Chicago.

1. 针对一组提示 生成响应──
2. 要求模型根据一套宪法 (en inglés) 要求模型根据一套宪法 (en inglés) 要求模型根据一套宪法 (en inglés) 要求模型根据一套宪法) 要求模型根据一套宪法 (en inglés) 要求模型根据一套宪法 (en inglés) 要求模型根据一套宪法) 要求模型根据一套宪法 (en inglés) 要求模型根据一套宪法) 要求模型根据一套宪法 (en inglés) 要求模型根据一套宪法 (en inglés) 要求模型根据一套宪法) 要求模型根据一套宪法 (en español) 要求模型根据一套宪法)
3. Según la crítica,
4. Para el par de modificaciones  realizar RLAIF  aprendizaje de refuerzo de la retroalimentación de IA) 

Resultado: el modelo utilizará la explicación de tener principios para rechazar peticiones nocivas, en lugar de rechazar generalmente. La Constitución de 2026 utilizó una versión posterior de este tipo de entrenamiento y realizó entrenamientos adicionales en una estructura de nivel manifiesto.

### Basado en la hipótesis de que el equipo puede capturar lo que pierde

**能抓住：**
- El principio de la base de la operación fue originalmente permitido de forma imprevista, pero el principio fue claramente aplicable en la situación en que se utilizó.
- El nuevo tipo de petición está muy cerca de lo prohibido.
- De acuerdo, no puedes decir que no permites la ingeniería social atacar.

**会漏掉：**
- Utiliza principios discriminados de ataques                                                                                                                                                                                                                                                            
- ∆ dos principios en conflicto de manera imprevista y en orden de niveles que contienen escenarios confusos¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- 訓練周期中原則解释的缓慢漂移 (la transición de los entrenamientos en el ciclo de entrenamiento)

### 2023  participación en la experiencia

Anthropic realizó un experimento en 2023 en el que se comparaba la constitución escrita por una empresa con la constitución generada a través de la entrada pública (aproximadamente 1.000 encuestados estadounidenses) ⋅ dos versiones se acordaron en un principio de aproximadamente el 50% ⋅ en las divisiones, la versión de la fuente pública es más estricta en ciertos problemas ⋅ en el tratamiento de contenido político), más flexible en otros problemas ⋅ en la revelación de la identidad de la IA ⋅ en el 2026 la Constitución ⋅ no se incluye en la fuente pública ⋅ en el descubrimiento de que este método contiene la fuerza de los archivos de registro ⋅ en el proceso.

### ¿Por qué es necesaria la prohibición de código duro ?

 La prohibición de código duro no se puede cerrar en el marco de los requisitos.  Los atacantes si pueden hacer que el modelo acepte un supuesto. Por ejemplo,  somos un laboratorio de investigación de armas biológicas ), suelen evitar el principio de la hipótesis de caso de dependencia.  Las prohibiciones de código duro no se componen de un marco de condiciones. 曲── se encuentran en el marco de la lección 14 harden límite constitucional──

### Constitución 位于中的哪里

Constitución no es un interruptor de ejecución de la Lección 14― se encuentra en el nivel de modelo: el peso del modelo está entrenado para el contenido preferido― se encuentra en el nivel de ejecución: el tiempo que permite el tiempo que se ejecuta.


```figure
mx-priority-tiers
```

## Usalo

`code/main.py` realizar un resolvador de cuatro categorías mínimas de prioridad  resolver  recibir una propuesta de acción y un grupo de principios de evaluación  seguridad, ética, directrices, utilidad), y regresar a la acción  rechazar o modificar la acción  conductor  ejecutar un grupo de casos:  permitir  determinar no permitir  prohibición codificada  casos de confusión de nivel transversal 

##  entregarlo

`outputs/skill-constitution-review.md`审计某部署的宪法层: cuales son codificados, cuales son codificados, cómo se pueden ajustar y si los cuatro niveles son realmente ordenados.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`❖ Confirmar que incluso la utilidad 很高,hardcoded prohibition 也会触发──修改 resolver,让 utility's powerweight高于伦理;观察失败模式──

2. 阅读Claude Constitution(公开,79 页,CC0) ―― encontrar un principio que usted considera que no es suficiente.

3. Para el cliente de apoyo agente diseñar un grupo de código suave por defecto. ¿Cómo puede operar? ¿Qué puede operar? ¿Qué no puede tocar?

4. 阅读 Bai et al. 2022 CAI 论文── describir un ciclo de crítica y revisión de la IA constitucional 循环会比毯规则 产生更差结果的案例──识别该类──

5. En el año 2023, Anthropic encontró que entre los principios de la sociedad y los principios de la sociedad existen aproximadamente un 50% de diferencias.

## 关键术语: "El hombre es un hombre"

| Term | 人们常说 | 实际含义 |
|---|---|---|
| Constitutional AI | “Anthropic 的对齐方法” | 针对书面 constitution 的自我批判 + RLAIF |
| Reason-based alignment | “原则，而不是规则” | 模型基于原则进行推理，以处理未见案例 |
| Hardcoded prohibition | “永远不要做 X” | 操作方或用户都不能覆盖的基于规则的禁止项 |
| Soft-coded default | “操作方可调整” | 在声明边界内的行为，由操作方控制 |
| Four-tier hierarchy | “优先级顺序” | safety > ethics > guidelines > helpfulness |
| RLAIF | “AI feedback RL” | reward 来自模型生成批判的 RL |
| Participatory constitution | “公众来源原则” | 2023 Anthropic 实验；与公司原则约 50% 分歧 |
| Principle drift | “解释滑移” | 模型解读固定原则文本的方式缓慢变化 |

## 延伸阅读

- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 79 páginas CC0 文档。
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback) 2022 原始论文──
- [Anthropic — Collective Constitutional AI (2023)](https://www.anthropic.com/research/collective-constitutional-ai-aligning-a-language-model-with-public-input) 参与式实验──
- [Anthropic — Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) Constitución en la posición de RSP 
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) Constitución en el papel de la implementación de los períodos de duración.
