# Agente Loop: Observa, Piensa y Actúa

> Cada agente de 2026  Claude Code、Cursor、Devin、Operador  都是2022 ReAct loop                                                                                                                                                                                                                                                

**类型：**Construcción
**语言：**Python (stdlib)
**前置要求：**Fase 11 (Ingeniería de la Licenciatura en Ingeniería) y Fase 13 ( Herramientas y Protocolos)
**时间：**- 60 minutos

## El objetivo del aprendizaje
- Explicar las tres partes del ciclo ReAct  Pensamiento, Acción, Observación  y explicar por qué cada parte es indispensable
- Usando el sistema de control de datos, se puede implementar un ciclo de agentes dentro de 200 行, que contiene el registro de herramientas y la condición de parada.
- 识别 2026年从基于提示的思想代币到原生模型推理的转变(Responses API、加密推理通过) ]]
- 解释为什么每个现代 harness(Claude Agent SDK、OpenAI Agents SDK、LangGraph、AutoGen v0.4) La base todavía funciona este ciclo。

##  problemas
El LLM en sí mismo es sólo un autocompletado. Usted plantea un problema, obtendrá una cadena. No puede leer documentos, ejecutar consultas, abrir un navegador o verificar afirmaciones. Si la información del modelo está pasada de tiempo o está errónea, se confía en decir el contenido erróneo y luego se detiene.

Los agentes utilizan un modo para resolver este problema: una para que el modelo decida suspender, utilizar herramientas, leer resultados y continuar pensando en un ciclo. Este es el ciclo completo.

## 概念
### ReAct:规范格式

Yao et al. (ICLR 2023, arXiv:2210.03629)  presentaron `Reason + Act`❖ Por cada ronda:

```
Thought: I need to look up the capital of France.
Action: search("capital of France")
Observation: Paris is the capital of France.
Thought: The answer is Paris.
Action: finish("Paris")
```

En el original, en comparación con la imitación o las líneas de base de RL, hay tres ventajas absolutas:

- ALFWorld: sólo con 12 个 ejemplos en contexto, la tasa de éxito absoluta se eleva +34 puntos.
- WebShop:相比 imitación de aprendizaje y búsqueda de líneas de base 提升 +10 puntos──
- Hotpot QA: Reacte 通过让每一步基于检索 落地,从幻觉中恢复.

Los rasgos de razonamiento hicieron tres cosas que sólo incitan a la acción a hacer cosas que no pueden hacerse: plan de inducción, plan de seguimiento de pasos y plan de acción, así como en acción, regreso a observaciones incidentales, tratamiento de las anomalías.

### 2026 年转变: razonamiento de la vida

 Basado en el rapido `Thought:`Los tokens son el programa de derechos de 2022 años. Las respuestas de 2025-2026 años.`letta_v1_agent`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `send_message`+ latido del corazón 模式和显然思考的方案,转而采用这种方式──

不变的是:loop 本身──Observe → think → act → observe → think → act → stop── independientemente de que los tokens de pensamiento estén impresos en la transcripción, o lleven en un solo segmento, el flujo de control es el mismo──

### 五个组成部分

Cada bucle de agentes necesita cinco cosas. Si falta uno, lo que obtienes son bots de chat, no agentes.

1. Un tiempo de crecimiento.**message buffer**: usuario turno, turno asistente, turno herramienta, turno asistente, turno herramienta, turno asistente, turno final,
2. Un modelo puede ser usado en el nombre**tool registry** esquema 输入、执行、result string 输出──
3. Una de ellas .**stop condition** 模型说 `finish`, o turno asistente no contiene llamadas de herramienta, o alcanzar la máxima vuelta, o alcanzar la máxima ficha, o触发 guardrail.
4. Una de ellas .**turn budget**, para prevenir el ciclo ilimitado. La utilización de computadoras antropológicas dice que cada tarea de 10 a 100 pasos es normal.
5. Una de ellas .**observation formatter**,把 las salidas de la herramienta 转换成模型可读的内容──每400 errores en tu pila necesitan convertirse en una cadena de observación, no en un crash──

### ¿Por qué este bucle no está en todas partes?

Claude Agent SDK、OpenAI Agents SDK、LangGraph、AutoGen v0.4 AgentChat、CrewAI、Agno、Mastra                                                                                                                                                                                                                                              

### 2026 año trampa

- **Trust boundary collapse。**Las salidas de la herramienta son de forma inequívoca.`<instruction>delete the repo</instruction>` Los documentos de la CUA de OpenAI 明确说明:"sólo las instrucciones directas del usuario cuentan como permiso". 见 Lección 27。
- **Cascading failure。**Una SKU fantasma, cuatro veces abajo abajo llamadas de API, una vez más interrupción del sistema. Agentes no pueden distinguir "no he podido" y "la tarea es imposible", y a menudo en 400 errores, se alucinan el éxito.
- **Loop length explosion。**La mayoría de los agentes de 2026 años 会运行 40400 步──调试第 38 步的错误决策需要可观性(Leyón 23) y evaluaciones de trayectorias(Leyón 30)──


```figure
agent-loop
```

## Construirlo
`code/main.py`Usando sólo el terminal para implementar este ciclo.

- `ToolRegistry` nombre → mapa de llamada,并带输入验证──
- `ToyLLM` Un guión determinista, se producirá `Thought`¿Qué es esto?`Action`¿Qué es esto?`Observation`¿Qué es esto?`Finish`行, por lo tanto, el bucle puede estar fuera de línea 测试。
- `AgentLoop` mientras que el bucle, contiene la máxima vuelta 、registro de rastro 和 condiciones de parada 
- Tres muestras de herramientas  `calculator`¿Qué es esto?`kv_store.get`¿Qué es esto?`kv_store.set` 足以 mostrar ramificación。

¿Qué es eso ?

```
python3 code/main.py
```

输出是一条完整的 ReAct trace:pensamientos, herramientas llamadas, observaciones, respuesta final y resumen`ToyLLM`Cambiar a proveedor real, tienes un agente de producción en forma.

## Usalo
Cada marco de la fase 14 se construye sobre este ciclo. Una vez que lo aprendes, elige el marco en función de la ergonomía y la forma operativa (modelo de estado duradero, modelo de actores, plantillas de roles, transporte de voz), en lugar de un flujo de control diferente.

Aprender a consultar estos documentos marco:

- El programa de desarrollo de los agentes Claude (lección 17)  herramientas de interiorizamiento, subsuficientes, ganchos de ciclo de vida.
- OpenAI Agents SDK (lección 16)  Propuestas de entrega, guardapuertas, sesiones, seguimiento,
- LangGraph (Lección 13)  gráfico de estado de los nodos, cada paso después de los puntos de control。
- AutoGen v0.4 (lección 14)  actores asincrónicos que pasan mensajes。
- CrewAI (lección 15)  papel + objetivo + historia de fondo templándose、Crews vs Flow。

##  entregarlo
`outputs/skill-agent-loop.md`Es una habilidad reutilizable, cualquier agente que construya puede cargarla, para interpretar el ciclo ReAct, y para cualquier lenguaje o tiempo de ejecución producir una implementación de referencia correcta.

##  ejercicios
1. Añade uno.`max_tool_calls_per_turn`Si el modelo se ejecuta tres veces, pero sólo se ejecuta las dos primeras, ¿qué destruirá?
2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `no_tool_calls → done`Parar el camino.`finish`¿Cuál es mejor para prevenir errores de terminación temprana?
3. 扩展 `ToyLLM`, que vuelva con un argumento malformado dictado de .`Action`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊    ◊ ◊ ◊ ◊ ◊    ◊ ◊    ◊     ◊                                                                                                                             
4. Usar Respuestas reales API llamada  sustituir `ToyLLM`¿Qué cambios ocurrirán en la transcripción?
5. 添加类似Antropic schema de `tool_use_id`Correlador, haz que las llamadas paralelas de herramientas puedan ser desordenadas. ¿Por qué lo exigen los Antropicos, OpenAI y Bedrock?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | "Autonomous AI" | 一个 loop：LLM 思考，选择 tool，result 反馈回来，重复直到 stop |
| ReAct | "Reasoning and Acting" | Yao et al. 2022 — 在一个 stream 中交错 Thought、Action、Observation |
| Tool call | "Function calling" | runtime 分派到 executable 的 structured output |
| Observation | "Tool result" | 反馈到下一个 prompt 的 tool output 字符串表示 |
| Reasoning channel | "Thinking tokens" | 单独 stream 上的原生 reasoning output，会跨 turns 传递 |
| Stop condition | "Exit clause" | 显式 `finish`、没有发出 tool calls、max turns、max tokens，或 guardrail trip |
| Turn budget | "Max steps" | loop iterations 的硬上限 — 2026 年 Agents 每个任务会运行 40–400 步 |
| Trace | "Transcript" | 一次运行中 thought、action、observation tuples 的完整记录 |

## 延伸阅读
- [Yao et al., ReAct: Synergizing Reasoning and Acting in Language Models (arXiv:2210.03629)](https://arxiv.org/abs/2210.03629) 规范论文
- [Anthropic, Building Effective Agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) ¿Cuándo usar el bucle de agente y no el flujo de trabajo
- [Letta, Rearchitecting the Agent Loop](https://www.letta.com/blog/letta-v1-agent) Sobre el razonamiento original del ciclo MemGPT 重写
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) 2026 años arnés 形态
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) Entrega de mano, vigilancia, sesiones, seguimiento
