# Auto-refinado y crítico: 代式输出改进

> Self-Refine(Madaan et al., 2023) hacer que un LLM en el ciclo desempeñe tres papeles: generar feedback、refinar。 average gain: en 7 个任务绝对提升+20──CRITIC(Gou et al., 2023) a través de una prueba de la vía a través de herramientas externas para fortalecer la retroalimentación 步骤── hasta 2026 años, este modelo se utilizará como un evaluator-optimizer

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 03 (Reflexion)
**Time:** ~60 分钟

## El objetivo del aprendizaje

- Cuentan los tres instantes de auto-refinado (generar, retratar, refinar), y explican por qué la historia de la auto-refinada es importante.
- 解释Critic的关键洞见: no hay fundamento externo 时,LLMs en auto-verificación 上不可靠──
- 实现一个带历史 和可选外部验证器的自清循环──
- La aplicación de este modelo se refleja en el flujo de trabajo de evaluador-optimizador de Anthropic y en los barrancos de salida de OpenAI Agents SDK.

##  problemas

Un agente produce una respuesta casi correcta. Quizás una línea de código tiene un error de sintaxis. Quizás un resumen demasiado largo. Quizás un plan ha perdido un caso de borde.

Auto-refinar  indicar: con un solo modelo ≠ no necesita datos de formación ≠ no necesita RL, también puede hacer esto. Pero hay un problema: LLM no es bueno con los hechos duros hacer auto-verificación.

Estos dos artículos definen conjuntamente el modelo de modificación de la generación 2026: generar, verificar, refinar, en el verificador, pasar por el tiempo de parar.

## 概念

### Auto-refinado (Madaan et al., NeurIPS 2023)

Un LLM, tres papeles:

```
generate(task)            -> output_0
feedback(task, output_0)  -> critique_0
refine(task, output_0, critique_0, history) -> output_1
feedback(task, output_1)  -> critique_1
refine(task, output_1, critique_1, history) -> output_2
...
stop when feedback says "no issues" or budget exhausted.
```

¿Qué es eso?`refine`Verá toda la historia, es decir, todas las anteriores publicaciones y críticas, por lo que no repite errores.

核心结果: en 7 tasas (math、code、acronym、dialog) en promedio, se produce una mejoría absoluta de +20, incluido GPT-4── no se necesita formación、 no se necesita herramienta externa、 un solo modelo──

### CRITA: Gou et al., arXiv:2305.11738, v4 feb 2024)

La auto-refinamiento es un proceso de auto-refinamiento, que es un proceso de auto-refinamiento.`verify(task, output, tools)` sustitución `feedback(task, output)`, entre ellos `tools`Incluye:

- Utilizando el motor de búsqueda de afirmaciones de hecho.
- Utilizando el intérprete de código de corrección de código.
- Utilizando la calculadora de la aritmética.
- 领域 específicos de verificación (unidad de pruebas, controles de tipo, linteras)

Verificador se generará en base a la crítica estructurada de los resultados de los instrumentos. Luego refinador se basará en esta crítica.

核心结果:CRITIC 在事实性任务上优于自理化,因为 crítica tiene fundamento.

### 停止条件 停止 condiciones 停止 condiciones 停止 condiciones 停止 condiciones 停止 condiciones 停止 condiciones 停止 condiciones 停止 condiciones 停止 停止 条件

两种常见形态:

1. **Verifier 通过。**Exterior test  Retorno éxito 有可用条件时首选 Unit tests type checker guardrail assertion) 
2. **没有发出 feedback。**Modelo dice que la salida está bien.  成本更低但不可靠; 应搭配最大化 cap──

2026 默认做法:组合二者──如果验证器通过,或模型说好且且反复 >= 2,或反复 >= max_iterations,则停止──

### Evaluador-Optimización (Antropic, 2024)

Anthropic en un artículo de diciembre de 2024 lo nombró como uno de los cinco patrones de flujo de trabajo.

- Evaluador: Give output打分并生成 crítica。
- Optimizador: Según la crítica 修订输出。

循环直到 evaluator 通过──这就是Antropic表述中的自精/CRITIC──Antropic 补充的关键工程细节是:evaluator 和优化器提示 应该有明显不同的结构,这样的模型 才不会只是膠盖──

### Protectores de salida de OpenAI Agents SDK

OpenAI Agents SDK va a utilizar este modelo como un control de salida  提供──guardrail es en el agente 最终输出上运行的验证器──如果 guardrail 触发                                                                                                                                                                                                                                       `OutputGuardrailTripwireTriggered`),输遇被拒绝,agente puede volver a intentar.

### 2026 años de cátedra

- **Rubber-stamp loops。**El mismo modelo utiliza el mismo estilo de generación y crítica, se percibe hasta que me parece bueno── utilizar diferentes instrucciones en la estructura, o utilizar un modelo más pequeño, más barato hacer crítica──
- **过度 refine。**Cada paso de refinamiento aumenta la latencia y los tokens.
- **在 trivial tasks 上使用 CRITIC。**Si no hay un verificador externo, CRITIC se volverá a auto-refinar; no pague la latencia para el verificador de estubes.


```figure
self-refine
```

## Construirlo

`code/main.py`En una tarea de juguete 上实现 Self-Refine 和 CRITIC: given topic, generar una lista de balas breve──verifier 检查格式──3 balas, cada una menor que 60 个字符)──CRITIC 增加一个外部 事实验证,用于惩罚已知幻觉──

组件:

- `generate`Producente del guión.
- `feedback` Autocrítica de estilo LLM。
- `verify_external` Verificador basado en el estilo CRITIC
- `refine` 根据历史 改写输出。
- Condición de parada  verificador 通過或最多 4 次反復──

运行:

```
python3 code/main.py
```

Comparar Auto-Refinación y resultados de la ejecución de CRITICas.

## Usalo

El evaluador-optimizador de Anthropic es el que utiliza un lenguaje amigable con Claude. El modelo es descrito en este modo. Los guardrails de salida de OpenAI Agents SDK presentan un formato crítico.

##  entregarlo

`outputs/skill-refine-loop.md`Se basan en la forma de la tarea, la disponibilidad del verificador y el presupuesto de la iteración, la configuración de un ciclo evaluador-optimizador, las instrucciones del generador de salida, evaluador/verificador y optimizador, así como la política de parada.

##  ejercicios

1. ¿Crítico todavía ayuda?
2. ¿Cuál es la realidad de la mayoría de las pilas de barandillas de 2026?
3. 实现一个 generator-critic on different models 变体:big model 生成,small model critic.
4. 阅读Critic Section 3 ((arXiv:2305.11738 v4) ❖说出三类验证工具类,并为每类给出一个例子――
5. Para OpenAI Agents SDK`output_guardrails`¿Qué es lo que hace el SDK? ¿Qué hace el SDK?

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际是什么意思 |
|------|----------------|------------------------|
| Self-Refine | “会修复自己的 LLM” | 在一个 model 中执行 Generate -> feedback -> refine loop，并带 history |
| CRITIC | “Tool-grounded verification” | 用外部 verifier（search、code、calc、tests）替换 feedback |
| Evaluator-Optimizer | “Anthropic workflow pattern” | 两个角色：evaluator 打分，optimizer 修订，并循环到收敛 |
| Output guardrail | “Post-hoc check” | OpenAI Agents SDK validator，在 agent 生成输出后运行 |
| Verify step | “Critique phase” | 承重决策点：grounded 还是 self-rated |
| Refine history | “Model 已经尝试过的内容” | 先前 outputs + critiques 被前置到 refine prompt；去掉后质量会崩塌 |
| Rubber-stamp loop | “Self-agreement failure” | 相同 prompt 的 critique 返回 “looks good”；用结构上不同的 prompts 修复 |
| Stop condition | “Convergence test” | Verifier 通过，或没有 feedback 且达到 iteration cap；绝不能只有单一条件 |

## 延伸阅读

- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) 经典 papel
- [Gou et al., CRITIC (arXiv:2305.11738)](https://arxiv.org/abs/2305.11738) Verificación basada en herramientas
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) Modelo de flujo de trabajo de evaluador-optimizador
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/)  Como barandillas de salida de verificadores en forma de CRITIC
