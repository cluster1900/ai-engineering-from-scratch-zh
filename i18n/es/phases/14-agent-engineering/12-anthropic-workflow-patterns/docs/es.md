# Modelos de flujo de trabajo antropológico:简单优于复杂

> Schluntz y Zhang (Antropic,2024 12 月) distinguen los flujos de trabajo (predefinition pathway) y los agentes (动态工具使用) 五种工作流模式 覆盖大多数情况――从直接API calls 开始──只有当步无法预测时,才添加代理──

**类型：**学习 + 构建
**语言：**Python (stdlib)
**先修要求：**Fase 14 · 01 (Lúpulo de agentes)
**时间：** 60 minutos

## El objetivo del aprendizaje

- Explicar los cinco tipos de flujo de trabajo de Anthropic: cadena de trabajo rápida, enrutamiento, paralelación, orquesta-trabajadores, evaluador-optimizador.
- Explicar la diferencia entre el flujo de trabajo y el agente, así como sus costes de construcción.
- 识别何时选择工作流而不是 agente (反之亦然)
- Utiliza la metodología para implementar los cinco patrones de LLM.

##  problemas

团队 siempre debe utilizar una sola función para resolver problemas introducidos en marcos multiagentes.  costes es real: los marcos aumentarán niveles, ocultarán las instrucciones, ocultarán el flujo de control, no inducirán una complejidad prematura.  Schluntz 和 Zhang en un artículo publicado en diciembre de 2024, es el más citado en la industria.

## 概念

### Flujos de trabajo contra agentes

- **Workflow。**通过预定义代码路径编排的 LLM 和工具──工程师 拥有图――
- **Agent。**LLM 动态 dirigir sus propias herramientas并采取自己的步骤──Model 拥有图──

Todos tienen escenarios de aplicación; flujos de trabajo más convenientes; más rápidos, más fáciles de deshacer;  Agentes  pueden resolver problemas abiertos, pero permiten que los modos de falla más difíciles de calcular.

### M.L.M. de mayor calidad

五种模式的基础:一个LLM 接入三种能力  búsqueda(recuperar) 、 herramientas(acciones) 、memoria(persistencia) 。 cualquier llamada de API puede utilizar estas capacidades。

### 五种模式

1. **Prompt chaining。**La salida de llamada 1 se aplica a las situaciones de descomposición de tareas con una línea clara. Entre pasos se pueden añadir puertas programáticas selectivas.

2. **Routing。**Clasificador LLM  seleccionar para utilizar el LLM en aguas subyacentes o herramienta── se aplica a las categorías de datos que se encuentran claramente diferentes en las condiciones de los diferentes tipos de tratamiento (suporte de nivel 1 vs reembolso vs bug vs ventas)──

3. **Parallelization。**Y发运行 N 个 LLM llamadas,聚合结果──两种形态:sectioning(不同分) 和投票(同样提示,运行 N 次,多数/综合)

4. **Orchestrator-workers。**Los trabajadores de los LLM (LLC) se encuentran en el centro de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de la organización de las organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones de organizaciones

5. **Evaluator-optimizer。**Una LLM  planteó una respuesta, otra LLM  evaluarla―代直到 evaluador 通過──这是自我清洗的泛化──

### Flujos de trabajo 胜过代理的地方

- **可预测任务。**Si puedes hacer un paso, deberías hacerlo.
- **受成本约束的任务。**Los flujos de trabajo tienen un número de pasos definidos; los agentes pueden inflarse de forma incontrolada.
- **受合规约束的任务。**Los auditores esperan leer el gráfico, en lugar de deducirlo de las trayectorias.

### Los agentes han superado los flujos de trabajo

- **开放式研究。**Cuando el siguiente paso depende del contenido del paso anterior, regresar.
- **可变长度任务。**需要数分钟到数小时、步骤数未知工作── hace falta un par de minutos para un número de horas, pasos y pasos para un número desconocido de trabajos.
- **新领域。**Cuando todavía no sabes el flujo de trabajo correcto, primero explora, luego codifica.

### Ingeniería de contexto 配套内容

"Ingeniería de contexto eficaz para agentes de IA" (Antropic 2025) formalizó las disciplinas vecinas: la ventana de la revista 2007-2002 es presupuesto, no contenedor.


```figure
workflow-chain
```

## Construirlo

`code/main.py` en el sentido `ScriptedLLM` Realizó los cinco patrones de flujo de trabajo:

- `prompt_chain(input, steps)` 顺序执行。
- `route(input, classifier, handlers)` Clasificación + expedición。
- `parallel_vote(prompt, n, aggregator)` 运行 N 次并聚聚¬¬¬¬¬¬¬¬¬¬
- `orchestrator_workers(task, workers)` Orquestación  seleccionar trabajadores。
- `evaluator_optimizer(task, proposer, evaluator, max_iter)` 循环 hasta el paso.

运行:

```
python3 code/main.py
```

Cada patrón imprime su propio rastro. El número total de líneas de código de cada patrón es de aproximadamente 10-15 líneas; el costo del marco se mide generalmente en miles de líneas.

## Usalo

- La mayoría de las tareas utilizan llamadas directas de API.
- 只有当模式 真正需要持久状态(LangGraph) ‧Actor-model concurrencia(AutoGen v0.4) ‧rollo templating(CrewAI) ‧时才使用框架──
- Cuando quieres Claude Code harness 形态、但不想重建时,select Claude Agent SDK──

##  entregarlo

`outputs/skill-workflow-picker.md`Las tareas que se realizan en el trabajo se describen como el modelo correcto de selección, incluyendo la lógica de la decisión, así como los procesos de trabajo que no tienen tiempo suficiente para reestructurar el agente.

##  ejercicios

1. Usar el umbral de confianza  lograr el enrutamiento  inferior al umbral -> 升级 a humanos  Para el apoyo de nivel 1, por ejemplo, ¿dónde debería caer este umbral?
2. - ¿ Qué ?`parallel_vote`¿Qué pasa cuando se llama a alguien? ¿Cómo se reúne en caso de falta de votos?
3. ¿ Qué ?`evaluator_optimizer`改成 bandit: a través de las iteraciones Mantenga las mejores 2 salidas, así que los buenos resultados que aparecen tarde no serán cubiertos por los malos resultados que aparecen tarde.
4. Se puede utilizar una cadena de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de secuencias de
5. 选择你的一个生产功能――绘画出工作流图――统计步骤数――这里代理 真的会更好吗? ¿Es mejor hacer esto?

## 关键术语: "El hombre es un hombre"

| 术语 | 人们常说什么 | 它实际意味着什么 |
|------|----------------|------------------------|
| Workflow | "预定义 flow" | Engineer 拥有的 LLM 和 tool calls graph |
| Agent | "Autonomous AI" | Model 拥有的 graph；动态 tool direction |
| Augmented LLM | "带 tools 的 LLM" | LLM + search + tools + memory；原子单元 |
| Prompt chaining | "顺序 calls" | call N 的输出是 call N+1 的输入 |
| Routing | "Classifier dispatch" | 选择由哪条 chain/model 处理输入 |
| Parallelization | "Fan out" | N 个并发 calls；通过 sectioning 或 voting 聚合 |
| Orchestrator-workers | "Dispatcher agent" | Orchestrator LLM 动态选择 specialist LLMs |
| Evaluator-optimizer | "Proposer + judge" | 迭代直到 evaluator 通过；Self-Refine 的泛化 |

## 延伸阅读

- [Anthropic, Building Effective Agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) 五种工作流模式
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 配套方法
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) gráficos de estado 何時值其成本
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 产品化的 orquesta-trabajadores patrón
