# CrewAI: Basado en el papel de los equipos y flujos

> CrewAI es un marco multi-agente basado en papeles de 2026 años. Cuatro componentes básicos: Agente, Tarea, Equipo, Proceso. Dos tipos de formaciones: equipos (autónomos) y flujos (event driven, determination).

**类型：**学习 + 构建
**语言：**Python (stdlib)
**先修：**Fase 14 · 12 (Patrones de flujo de trabajo), Fase 14 · 14 (Modelo de actor)
**时间：**75 minutos

## El objetivo del aprendizaje

- Cuáles son los cuatro componentes básicos de CrewAI (Agencia, Tarea, Equipo, Proceso) y cada componente es responsable de qué?
- 区分 Sequencia, Jerarquía y proceso de consenso en el plan; para cada clase de trabajo carga seleccionar una manera。
- 区分 Crews (basado en el papel de un autor) y Flows (determinidad de los eventos),并解释文档中的生产建议──
- Uso `@tool`decoratora y`BaseTool`Subclase 接入 herramientas; entender las salidas estructuradas y el libre texto de la extracción.
- Cuáles son los cuatro tipos de memoria de CrewAI, y cada uno de ellos en qué momento vale la pena usar.
- 实现 un stdlib 三 Agente equipo investigador  escritor  editor), produce un breve
- 识别三种 CrewAI fall mode:pronto-bloat, gerente-LLM tax, brotes entregas,

##  problemas

 El equipo de los frameworks multi-agentes se estropeará con el mismo muro   Colaboración autónoma  en la demostración  Soñarse genial  Luego el cliente presenta un error, necesitas una reproducción determinista  o finanzas  Pregúntale a un equipo de LLM  Viaje  Cuánto dinero gastará cada vez de la operación  O en llamada  Necesita saber por las 3 de la mañana qué agente  se ha quedado 

Libert forms 、 por los equipos de LLM 路由 都干净地回答这些问题──纯 DAG puede responder a todos los problemas, pero perderá el agente de lluvia de ideas 需要的探索形态──

La separación de la tripulación de AI se basa en esta estrategia. Los equipos se basan en la colaboración, la función, la exploración.

## 概念

### Cuatro componentes básicos

La superficie de la tripulación es pequeña.

- **Agent。** `role + goal + backstory + tools + (optional) llm`◊ historia de fondo 很关键──它塑造语气、判断,以及 agent 何时停止──Tools is agent 可以调用函数(下面会讲)──
- **Task。** `description + expected_output + agent + (optional) context + (optional) output_pydantic`❖ Unidad de trabajo utilizable¬¬¬¬¬¬¬¬¬¬¬¬`expected_output`Es un acuerdo.`context`列出上游任务,其输遇被传入──`output_pydantic`强制使用结构化形态──
- **Crew。**容器── tener `agents`列表,`tasks`列表,`process`, y las opciones`memory`¿ Qué es eso ?`verbose`¿ Qué es eso ?`manager_llm`设置──
- **Process。**执行策略──Sequenciaal、Hierárquico、Consenso(计划中)── seleccionar la forma de ejecutar──

Los agentes no se verán directamente entre sí. Tascas  Citación de agentes. Equipo a las tareas  Equipo a las tareas  Equipo a la organización. Proceso decide quién elige la siguiente tarea.

> **已针对**CrewAI 0.86(2026-05)验证──更新版本可能会重新命名或合并过程类型;在依赖具体形态之前,请查看 [CrewAI Processes docs](https://docs.crewai.com/concepts/processes)¿Qué es eso?

### Secuencia, Jerarquía y consenso

- **Sequential。**tareas 按声明顺序运行──Trabajo N 的输出可作为 `context`提供给任务 N+1──成本最低──最可预测──当顺序固定时使用──
- **Hierarchical。**Un gerente agente (en inglés)`manager_llm`Config o Configuración por defecto gerente de generación. Gerente Cada turno de seleccionar la siguiente tarea, y puede rechazar o volver a guiarse. Cuando usted tiene cuatro o más especialistas, y el orden realmente depende de la producción y la producción.
- **Consensus。**计划中, actual API pública 尚未 implementarse 文档保留该名称用于未来基于投票的过程──今天不要依赖它──

En cada llamada especialista, la Junta jerárquica aumenta cada vez más la llamada de LLM (manager) . En los cinco pasos de ejecución, el gasto de los tokens puede convertirse en tres veces.

### Los equipos contra los flujos

Este es el marco de 2026 años de documentación.

- **Crew。**Autonomía impulsada por el LLM. En el marco de la aplicación, el modelo de selección es adecuado para la investigación, la lluvia de ideas y los primeros proyectos, así como el camino en sí mismo es parte de la respuesta.
- **Flow。**Los eventos que tienes son un gráfico.`@start`标记入口──`@listen(topic)`标记一步,它会在另一个步骤 发发这个话题 时触发──每一步都是普通 Python(内部可以调用机组)──适应:生产──可观测──可测──确定性──

文档在 2026年的生产建议: desde el flujo 开始──当自主权 值其成本时,把船员 作为流动步骤 内部的 `Crew.kickoff()`llamadas 折进去──Flow 给你审计轨迹,Crew 给你探索──组合使用,不要二选一──

### Herramienta 集成

给代理配备工具有三种方式――选择最简单而适合的一种――

1. **`@tool` decorator。**純函数成工具──Signature is schema;docstring is LLM 看到的描述──最适合一次性辅助者──

   ```python
   from crewai.tools import tool

   @tool("Search the web")
   def search(query: str) -> str:
       """Return top results for the query."""
       return run_search(query)
   ```

2. **`BaseTool` subclass。**基于类的工具,带显式 args schema、async support、retries──当工具 有状态(client、cache) 或需要结构化 args 时使用──

   ```python
   from crewai.tools import BaseTool
   from pydantic import BaseModel

   class SearchArgs(BaseModel):
       query: str
       limit: int = 10

   class SearchTool(BaseTool):
       name = "web_search"
       description = "Search the web and return top results."
       args_schema = SearchArgs

       def _run(self, query: str, limit: int = 10) -> str:
           return self.client.search(query, limit=limit)
   ```

3. **内置 toolkits。**CrewAI  proporcionan adaptadores de primera parte:`SerperDevTool`¿Qué es esto?`FileReadTool`¿Qué es esto?`DirectoryReadTool`¿Qué es esto?`CodeInterpreterTool`¿Qué es esto?`RagTool`¿Qué es esto?`WebsiteSearchTool`■ una vez importación 即可接入──

Resultados estructurados Utiliza Pydantic.`output_pydantic=MyModel` El equipo de trabajo deberá evaluar la respuesta del MLL según el modelo, y realizar la coerción o retratante.`expected_output`string 配合使用── Libre texto de salida 适合草稿; estructurados de salida 才是下游 Flujos 能消费的内容──

### Cuchillos de memoria

CrewAI 开箱提供四种内存类型──它们可以组合:一个 Crew可以同时启用四种──

> **已针对**CrewAI 0.86(2026-05)验证──近期版本把所有内容都路由到统一的 `Memory`El sistema, este sistema empaquetado estas cuatro tiendas. El modelo de concepto de abajo sigue en vigor, pero en la versión actualizada, la superficie de clase pública podría ser recibida por una sola.`Memory`punto de entrada; por favor, vea[CrewAI memory docs](https://docs.crewai.com/concepts/memory)了解当前 API。

- **Short-term。**单次运行内 conversación buffer──结束时清空──
- **Long-term。**跨运行持久化──存储在向量DB 中(默认 Chroma,可替换)──按与当前任务的相似度检索──
- **Entity。**按实体 记录事实──Cliente X está en el plan empresarial. 按实体按键, y no按相似度──跨运行保留──
- **Contextual。**组装时检索──在 Agent 需要时拉取相关记忆,而不是预载──

En el equipo`memory=True`O según el tipo de configuración  activado 支(por el proveedor de embeddings que usted ha configurado 支(默认 OpenAI,可替换为本地)  Memoria es uno de los lugares donde CrewAI es más ligero que los frameworks 体现价值; pura LangGraph 需要你自己连接每种种──

### ¿Cuándo se adapta a la tripulación?

- Tres a seis agentes, personajes y colaboradores de trabajo.
- El LLM constituye el rumbo de la evaluación del valor en el siguiente paso (hiérarquico).
- 团队更愿意读 `role + goal + backstory`, en lugar de leer la definición del gráfico de escenarios.

### ¿Qué tiempo no encaja CrewAI?

- 带严格顺序的确定性 DAGs──使用LangGraph(Lesson 13)──forma del gráfico es una verdadera abstracción;marcado de los papeles de la tripulación 会带来摩擦──
- 亚秒级延迟预算──等级会增加回路旅行──即使序列化也会包含背景故事和前输出的提示──
- Loops de agente único. Salto a través de un marco. Un bucle de agente.

Lección 17 Enfrentamiento de los agentes) con Matrix  demostró esto.

### Forma de dependencia

独立于LangChain──Python 3.10 hasta 3.13──使用 `uv`✿ Conto de estrellas: See [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI)(Hasta 2026-05 de snapshot) ――AWS Bedrock integración tiene archivos; vendedores de referencia  reportar su en las cargas de trabajo de QA  上相比 LangGraph tiene una notable提速, pero metod论(dataset、hardware、evaluación métricas) no se ha abierto, por lo tanto, los números de marco-vendedores sólo pueden ser como referencia de dirección―

### Este patrón se puede encontrar en el error

- **Backstories 导致 prompt-bloat。**Cada agente Una historia de 2000 palabras, recoger cinco miembros del equipo de los agentes, se reunirán en la primera llamada de herramienta Pre-burnout contexto presupuesto,
- **Manager-LLM token tax。**Proceso jerárquico Reunión en cada llamada especialista 前增加一个管理员LLM llamada。五个任务的工作人员 会从五次LLM llamada 变成六次,而且管理员调用 携带完整任务列表加上前输出──除非路由依赖输出,否则切换到序列──
- **Brittle handoffs。**La tarea N `expected_output`Es un esquema. La tarea N+1 es ponerla como una tarea.`context`读取,并尝试 parse 三个节目──LLM 生成四个──下游 Agente 即兴处理──修复方式在任务 N 上使用 `output_pydantic`,让Task N+1 读取 objeto tipado, en lugar de texto libre.
- **Crew-as-prod。**libertad forma Crew en caso de que no haya envoltura de flujo se emite hasta la producción.


```figure
ae-crew-vs-flow
```

## Construirlo

`code/main.py` Realizó dos versiones de stdlib, así como una tripulación de tres agentes.

形态:

- `Agent`¿Qué es esto?`Task`Las clases de datos, que corresponden a la superficie de la tripulación.
- `SequentialCrew.kickoff(inputs)`按声明顺序运行任务,并把输出 作为 `context`¿Qué pasa?
- `HierarchicalCrew.kickoff(topic)` aumentar un gerente agente, cada turno seleccionar el siguiente especialista, y  hacer 处停止──
- 带 `@start`Y `@listen(topic)`decoratores de `Flow`, un pequeño ciclo de eventos, así como un rastro.
- `tool(name)`Decorador, espejo de la tripulación`@tool`forma
- 带 `short_term`¿Qué es esto?`long_term`¿Qué es esto?`entity`las tiendas de`Memory`Se burlaron de la similitud.
- Las respuestas de LLM simuladas son en función del papel, además de las cadenas codificadas con el prefijo de entrada en clave.

具体 demo:researcher、writer、editor crew,产出一份关于 agent engineering 2026 的简介──Researcher 拉取(mocked)sources──Writer 起草──Editor 收紧──同一个 crew 通过 Flow 运行,以展示决定性形──

¿Qué es eso ?

```bash
python3 code/main.py
```

Trace 覆盖: tripulación secuencial 通过 `context`串接输出, equipo jerárquico 带 manager picks(investigador, escritor, editor, luego done), flujo usando temas evidentes(`researched`¿Qué es esto?`drafted`¿Qué es esto?`edited`)运行同样三步, herramientas llamadas 通过 `@tool`路由, así como la memoria a largo plazo entre dos veces de salida 保存──

El rastro de la tripulación es fluido; el gerente en principio puede reorganizarse.

## Usalo

- **CrewAI Flow**Para la producción. Incluso el flujo sólo tiene un paso.`Crew.kickoff()`◊ Flujo  proporcionar límites de auditoría ◊
- **CrewAI Crew (Sequential)**Se utiliza para trabajar en conjunto, especialmente en los primeros proyectos y los bucles de revisión.
- **CrewAI Crew (Hierarchical)**Cuando se envía depende de la salida, y tienes cuatro o más especialistas que usan.
- **LangGraph**(Lección 13) para utilizar máquinas de estado de forma clara, resumen duradero, ordenamiento estricto.
- **AutoGen v0.4**(Lección 14) para la concurrencia del modelo actor y el aislamiento de fallos.
- **OpenAI Agents SDK**(Lección 16) para productos de OpenAI, con remesas y barandillas.
- **Claude Agent SDK**(Lección 17) para productos de primera clase, con subagentes y tienda de sesiones.

##  Publicarlo

`outputs/skill-crew-or-flow.md`Se trata de un proyecto de investigación que se desarrolla en el campo de la investigación y la investigación de la tecnología y de la tecnología.

## 常见坑

- **把 backstory 当作调味。**Se formará las salidas. Cada agente prueba tres variantes. La variante es real.
- **跳过 `expected_output`。**没有每个任务的契约,下游任务 会拿到LLM 产出的任意内容──Crew 能跑;audit 会失败──
- **Memory always-on。**A largo plazo cada vez que se ejecuta se escribe.
- **Manager prompt drift。**El mando de la jerarquía es un instante de ocultamiento. Si el enrutamiento se vuelve extraño, en modo de verbo, se deshace de leer.
- **Crews 中 tool side effects。**El equipo puede utilizar más veces que lo esperado la herramienta.

##  ejercicios

1. Añade la secuencia de tripulación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
2. 给船员 添加实体记忆:关于客户的事实在开关之间 持久化――验证检索 拉取了正确实体――
3. 实现 un proceso jerárquico: gerente en la producción del escritor al menos hay tres fragmentos antes, rechazar el camino hasta el editor.
4. Por un lado, la búsqueda en la web.`BaseTool`Subclase:`@tool`Decorador 版本。
5. 给编辑任务 添加 `output_pydantic=Brief`, entre ellos `Brief`¿ Qué ?`title`¿Qué es esto?`summary`¿Qué es esto?`sections` hacer que el escritor haga una tarea 输出 una vez JSON malformado;验证 CrewAI 在 trace 中的重试行为──
6. 阅读 CrewAI's doc intro──把 el juguete 移植到真实 `crewai`¿Qué garantías ha pasado la versión de API?
7. ¿Qué rastros te faltan en la versión de Star Wars?

## 关键术语: "El hombre es un hombre"

| Term | 大家常说 | 实际含义 |
|------|----------------|------------------------|
| Agent | “Persona” | Role + goal + backstory + tools |
| Task | “工作单元” | Description + expected output + assignee + optional structured output |
| Crew | “Agent team” | Agents + Tasks + Process 的容器 |
| Process | “执行策略” | Sequential / Hierarchical / Consensus（计划中） |
| Flow | “Deterministic workflow” | 事件驱动、代码拥有、可测试 |
| Backstory | “Persona prompt” | Agent 的语气与判断塑造器 |
| `@tool` | “Function tool” | 把函数变成 Agent 可调用 tool 的 decorator |
| `BaseTool` | “Class tool” | 带 args schema、retries、async support 的 class-based tool |
| Entity memory | “Per-entity facts” | 限定到某个 customer / account / issue 的 memory |
| Long-term memory | “Cross-run memory” | 在 kickoffs 之间保留的 vector-backed memory |
| Contextual memory | “Just-in-time retrieval” | Agent 需要时才拉取的 memory |
| Manager LLM | “Router agent” | Hierarchical process 中选择下一个 task 的额外 LLM |
| `expected_output` | “Task contract” | 告诉 Agent（和 audit）要返回什么形态的 string |

## 延伸阅读

- [CrewAI docs introduction](https://docs.crewai.com/en/introduction)Conceptos y métodos de producción
- [CrewAI Flows guide](https://docs.crewai.com/en/concepts/flows)El caso de la empresa`@start`¿Qué es esto?`@listen`
- [CrewAI tools reference](https://docs.crewai.com/en/concepts/tools)¿Qué es esto ?`@tool`¿Qué es esto?`BaseTool`、kits de herramientas
- [CrewAI memory](https://docs.crewai.com/en/concepts/memory)En el contexto de la investigación, el desarrollo de la información y la información se ha desarrollado a largo plazo.
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents): multi-agente  ¿Cuándo ayuda, cuándo no
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview):alternativa de la máquina estatal
