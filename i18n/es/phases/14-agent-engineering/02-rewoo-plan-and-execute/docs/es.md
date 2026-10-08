# ReWOO y Plan y Ejecución:解式规划

> ReAct en un flujo en el que se entrelazan pensamientos y acciones. ReWOO los separará: primero elaborar un plan completo, luego ejecutar.

**类型：**Construcción
**语言：**Python (stdlib)
**先修要求：**Fase 14 · 01 (Lúpulo de agentes)
**时间：**- 60 minutos

## El objetivo del aprendizaje
- Explicar por qué ReWOO de Planner / Trabajo / Solver  desmantelar  diferenciación de ReAct de ciclo de intercambio 能省代币并提升强度──
- 实现 un plan DAG 、 un ejecutor de ejecución según el orden de ejecución, así como un solver de resultados de trabajo de conjunto  全部使用 stdlib。
- Utiliza 2026 años Five workflow patterns 框架 Antropic), el trabajo de evaluación debe adoptar un plan y luego ejecutar y también un proceso de reacción.
- 识别什么时候 Plan-and-Act DATA de plan sintético para las tareas de largo horizonte web o móviles es necesario.

##  problemas
El ciclo de reflexión-acción-observación de ReAct es simple y flexible, pero cada llamada de herramienta debe llevar un contexto previo completo, incluyendo cada pensamiento anterior. El uso de tokens crece a medida que aumenta su intensidad.

ReWOO(Xu et al., arXiv:2305.18323, mayo 2023) notó este punto, y hizo una estrategia: primero completa planificación, paralelo  obtención de pruebas, final combinación de respuesta。 una vez llamada LLM Usado para planificar, N veces llamada herramienta Usado para pruebas( puede ser paralelo), una vez llamada LLM Usado para buscar solución。 esta estrategia es con menos flexibilidad(plan es estático de) cambiar mejor eficiencia de los tokens y más claro de los modos de fracaso。

## 概念
### Los tres papeles

```
Planner:  user_question -> [plan_dag]
Workers:  [plan_dag]     -> [evidence]        (tool calls, possibly parallel)
Solver:   user_question, plan_dag, evidence -> final_answer
```

Planner produce un DAG. Cada nodo especifica una herramienta, sus argumentos, así como depende de los nodos anteriores.`#E1`¿Qué es esto?`#E2`Así que los trabajadores se ponen en contacto con los nodos de la empresa.

### ¿Por qué 5 veces menos tokens?

La duración del impulso de ReAct 会随步数线性增长──在第十步, impulso 包含思想 1加行动 1加观察 1加思想 2加行动 2加观察 2,依此类推── cada paso intermedio 还会冗余包含原始提示──

ReWOO sólo paga una vez el planificador de la llamada de trabajo de cada uno de ellos sólo una llamada de herramienta, sin cadena) y una vez el solver de la llamada de la llamada de un solver.

### Por qué es más robusto

Si el trabajador 3 en ReAct fracasa, el loop  debe estar en el flujo en medio del camino del error en el proceso de recuperación. En ReWOO, el trabajador 3 devuelve una cadena de error.

### Destilación de planificadores

论文的第二个结果:因为规划师 看不到观测,你可以用175B教师的规划师的输出来细调一个7B模型──小模型负责规划;大模型在推论时不再需要──现在已经很常见 许多2026生产代理使用小规划师 和大执行器,或反过来使用──

### Plan y ejecución (LangChain, 2023)

LangChain 团队 en el artículo de agosto de 2023 se reorganizará ReWOO 泛化为一个模式名称:Plan-and-Execute。Up-front planner 输出一个步骤列表,执行人 执行每一步,可选的重组规划员可以在观察结果后进行修改──这比 ReWOO更接近 ReAct(replanner 会把观察带回规划), pero conserva los ahorros de ficha──

### Plan y Acta (Erdogan et al., arXiv:2503.09572, ICML 2025)

Plan-and-Act se extenderá a la web y los agentes móviles de largo horizonte. La contribución clave es la información de los planes sintéticos: un generador de trayectoria etiquetado.

### ¿Cuándo elegir cuál

| Pattern | When |
|---------|------|
| ReAct | 短任务、未知 environment、需要 reactive exception handling |
| ReWOO | 具备已知 tools 的结构化任务、对 token 敏感、evidence 可 parallelize |
| Plan-and-Execute | 类似 ReWOO，但在 partial execution 后支持 replanning |
| Plan-and-Act | Long-horizon（>30 步）、web/mobile/computer-use |
| Tree of Thoughts | Search 值得付出成本（Lesson 04） |

La guía de Anthropic de 2024: empezar de la manera más simple. Si la tarea es sólo una llamada de herramienta, un resumen, no construya ReWOO. Si la tarea es una tarea de investigación de 40 pasos, no sólo con ReAct.


```figure
rewoo-plan
```

## Construirlo
`code/main.py`实现 una versión de juguete ReWOO:

- `Planner` Una política guionada, según el plan de salida de inmediato DAG。
- `Worker`  A través del registro 分发 cada nodo de la llamada de herramienta.
- `Solver` composición escrita, lectura de pruebas y generación de la respuesta final.
- Resolución de dependencia  类似 `#E1`Las referencias serán reemplazadas por resultados de trabajadores más tempranos.

Esta demo  respuesta Cuál es la población de la capital de Francia, redondeada a millones?, usar dos pasos plan:

¿Qué es eso ?

```
python3 code/main.py
```

trace 会先显示完整计划,然后显示工人结果,最后显示解决器组成──将符号数(我们打印了粗略的字符数) con ReAct-style交错运行进行比较  在这种结构化任务上 ReWOO 胜出──

## Usalo
LangGraph va a planificar y ejecutar  como receta  proporcionar(`create_react_agent`Utilizado para ReAct, gráficos personalizados Utilizado para ejecutar el plan) ――CrewAI de Flujos  directamente codificó el patrón: Usted predefinir tareas, entonces Flow DAG  ejecutarlas―Los datos sintéticos del Plan-y-Act  método actualmente todavía pertenecen principalmente a la investigación; patrón de tiempo de ejecución (Plan DAG) mediante LangGraph y CrewAI de Flujos en producción proporcionan―

##  entregarlo
`outputs/skill-rewoo-planner.md`En caso de un catálogo de herramientas, según la solicitud del usuario, el plan de ReWOO se produce en el día de hoy.

##  ejercicios
1. En un DAG de 6 nodos de 2 grupos paralelos, ¿qué beneficios puede traer esto?
2. Añadir un nodo de replanificación, cuando cualquier trabajador regrese error 时触发── hacer ReWOO 变成 Plan-and-Execute de la modificación mínima ¿Qué es?
3. Con un modelo pequeño (clase 7B) sustituye`Planner`,并让 `Solver`Utilice el modelo fronterizo. ¿Qué falta en esta división?
4. 阅读ReWOO 论文中关于计划器蒸的第4节──从概念上复现 175B -> 7B 的结果: ¿Qué datos de capacitación necesitas, y cómo evaluar la calidad del plan?
5. ¿Qué cambios se producen en el plan y la secuencia del juego?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ReWOO | “Reasoning without observations” | 先 plan，然后 parallel 获取 evidence，最后 solve —— planning prompt 中没有 observations |
| Plan-and-Execute | “LangChain's plan-execute pattern” | ReWOO 加上 execution 后可选的 replanner node |
| Plan-and-Act | “Scaled plan-execute” | 显式 planner/executor 拆分，并用 synthetic plan training data 支持 long-horizon tasks |
| Evidence reference | “#E1, #E2, ...” | plan-node placeholder，在 dispatch 时用先前的 worker output 替换 |
| Planner distillation | “Small planner, big executor” | 用 large teacher 的 planner traces 来 fine-tune small model |
| Token efficiency | “Fewer round trips” | 论文中在 HotpotQA 上相对 ReAct 减少 5x tokens |
| DAG executor | “Topological dispatcher” | 按 dependency order 运行 plan nodes；每一层可 parallel |

## 延伸阅读
- [Xu et al., ReWOO: Decoupling Reasoning from Observations (arXiv:2305.18323)](https://arxiv.org/abs/2305.18323) 经典论文
- [Erdogan et al., Plan-and-Act (arXiv:2503.09572)](https://arxiv.org/abs/2503.09572) 带 planes sintéticos  带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带                                                                                                                                                                                                                                                                                                                      
- [LangGraph Plan-and-Execute tutorial](https://docs.langchain.com/oss/python/langgraph/overview) receta marco
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 选择能工作的最简单模式  选择能工作的最简单模式
