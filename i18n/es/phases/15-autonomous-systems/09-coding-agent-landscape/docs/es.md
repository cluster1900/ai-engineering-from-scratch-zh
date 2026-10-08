# Agente de codificación autónoma 版图(2026)

> SWE-bench Verified en no menos de tres años es el más activo de MIT-licenciado, su código-acto loop se ejecuta directamente en la caja de arena de Python, no en llamadas JSON.

**类型：**El aprendizaje
**语言：**Python(stdlib,CodeAct vs JSON herramienta de llamada
**先修要求：**Fase 14 · 07(uso de herramientas),Fase 15 · 01(agentes de largo horizonte)
**时间：** 45 minutos

##  problemas

¿Cuál es el mejor agente de codificación? ¿La verdadera pregunta es: en la distribución de tareas que coincide con mi trabajo, usando el andamio que operará en producción, ¿cómo puedo obtener fiabilidad de extremo a extremo?

Entre 2022 y 2026, este campo reconoce el andamio  captura de capas, planificadores, sandbox, edición-verificación de bucle, formato de retroalimentación  es una estructura de carga  Claude Sonnet 4.5 en SWE-agent v1 en el SWE-bench Verificado obtenido es del 43.2%; el mismo modelo en el andamio autónomo de Cline obtenido es del 59.8%  El mismo peso, la diferencia absoluta 16.6 分── el modelo básico es un componente; el bucle es sólo un producto 

伴随的问题是基准和会掩盖退步──SWE-bench Verified 已接近和,而易任务尾(500 个任务中有161 个只需要 ≤2 行) 会拉高顶部分数──真实世界质量更适合在SWE-bench Pro(10+ 行修改) de este tipo de distribución, donde el mismo sistema líder sigue siendo sólo 2359%──

## 概念

### Usó un mensaje para entender el banco de la SWE.

SWE-bench(Jimenez et al.) selección con parches de verdad de base de problemas de GitHub,并要求代理 生成一个补丁,让测试套件 通过──SWE-bench Verified(OpenAI,2024) es un 500 任务子集, que ha pasado artificialmente, ha eliminado la含糊和损坏的任务──SWE-bench Pro 是更难的后后版本  任务要求 10+ 行修改, los agentes fronterizos actuales obtienen una división de 2359%──

### 2022 → 2026 曲线真正说明了什么

- **2022**:modelos de investigación en el banco SWE original, alrededor del 4%
- **2024**:GPT-4 + andamios de estilo Devin alrededor del 14%; agente SWE alrededor del 12%。
- **2025**Claude 3.5/3.7 Sonnet en Aider y SWE-agent En promueve hasta 4055% 区间──
- **2026**El grupo de expertos de la IA de la época se encuentra en el primer puesto de la lista de resultados de la IA.

Esta tendencia proviene de tres superposición: mejor modelo de base, mejor andamio, mejor código, reflexión, verificador de bucles, así como mejores puntos de referencia, mejor movimiento de ruido.

### CodeAct vs JSON 工具调用

OpenHands(All-Hands-AI,arXiv:2407.16741, antecedencia para OpenDevin) hizo una apuesta de una estructura específica: no hacer que el modelo emita llamadas de herramientas JSON de un host, sino hacer que el modelo emita código Python, y que el kernel de estilo Jupyter funcione en la caja de arena.

权衡如下:

- **JSON tool calls**Cada acción es un turno; fácil de auditar; composicionalidad limitada; de forma más segura, ya que cada llamada pasa por un validador evidente.
- **CodeAct**Una acción puede ser un programa entero; posee composicionalidad; necesita sandbox endurecida(OpenHands utiliza aislamiento Docker); modos de falla incluyen el tiempo de ejecución de sandbox 允许的任何行为。

两种架构都已用于生产――CodeAct 在开放平台中占主导(OpenHands、smolagents)――JSON tool calls 在管理服务中仍占主导(Anthropic Managed Agents、OpenAI Assistants),因为供应商 控制执行者──

### 2026 版图中的 andamios

| Scaffold | License | Execution model | Notable property |
|---|---|---|---|
| OpenHands (OpenDevin) | MIT | Docker 中的 CodeAct | 最活跃的 open platform；event-stream 可 replay |
| SWE-agent | MIT | Agent-Computer Interface (ACI) | 第一个端到端 SWE-bench scaffold |
| Aider | Apache-2 | local repo 中 edit-via-diff | Minimal scaffold，regression stability 强 |
| Cline | Apache-2 | 带 tool policy 的 VS Code agent | Sonnet 4.5 上得分最高的 open scaffold |
| Devin (Cognition) | Proprietary | Managed VM + planner | 第一个“AI software engineer”产品类别 |
| Claude Code | Proprietary | Permission modes + routines | Lesson 10 会详细讲解 agent loop |

### ¿Por qué los andamios ?

Una vez se ejecuta la codificación es una trayectoria de largo horizonte.

1. **Retrieval**En el caso de los archivos de Aider, el índice de archivos de ACI, OpenHands y el mapa de repos están resolviendo este problema.
2. **Verifier loop**:运行测试、读取堆积痕迹、再试, 在SWE-bench 上能带来10+ 分差──
3. **Failure containment**: Fuera de error puede volver a la caja de arena  puede evitar daños acumulados

### Indicador de referencia 和与真实分布

OpenHands Autors y Epoch AI señalan que el banco SWE Verified existe una cola fácil: 500 个任务中有 161 个只需要12 行修改。高分部分由这个尾 驱动。 El banco SWE Pro 限定为10+ 行修改, incluso en sistemas fronterizos,分数也只有2359%── tu distribución de producción casi definitivamente se acerca más al Pro, en lugar de ser Verified。

选择代理的含义是: en tu propio backlog de errores 上运行一个类似Pro 的子集── real importancia de la cantidad de porcentajes, es el porcentaje de la tarea de su entrega real de contenido──


```figure
a5-scaffold-delta
```

## Usalo

`code/main.py`En una distribución de mini-tareas fija, compara dos andamios de agentes de juguetes:

1. Una de ellas .**JSON tool-call**Escafado, cada turno  tomar una acción 
2. Una de ellas .**CodeAct**Escafado, cada acción puede emitir un pequeño fragmento de Python.

两者都使用 stub model(regulas deterministas), por lo tanto comparar se separará el andamio con el modelo质量隔离──输见显示 CodeAct andamio 用更少转换 解决更多任务,代价是每行动的爆炸半径更大──

##  entregarlo

`outputs/skill-scaffold-audit.md` ayudarle a adoptar el andamio de agentes de codificación propuesto  antes de realizar una auditoría: calidad de recuperación  presencia de verificadores  aislamiento de la caja de arena, así como ajuste de referencia a la distribución 

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ En el mismo conjunto de tareas arriba, cada andamio  ¿Cuántos giros necesita? ¿Cuál es el radio de explosión por acción de cada andamio?

2. 阅读OpenHands paper(arXiv:2407.16741)。 Este documento 认为 CodeAct 在复杂任务上优于JSON tool calls──找出纸 承认一个失败模式,并写一句说明该模式 什么时候会在生产中占主导──

3. Seleccionar una necesidad de dos archivos  modificar 10+ 行的任务── estimar el modelo de frontera en (a) llamadas de herramienta JSON 和 (b) CodeAct 下的端到端成功概率──说明差距的理由──

4. SWE-bench Verified hay 161 个单档 12 行任务――构建一个排除它们分数――leaderboard 会如何重新排序?

5. 阅读 Introducing SWE-bench Verified(OpenAI) ――explicación utilizada para la eliminación de tareas ambiguas de una metodología específica,并说出一种策略 会漏掉的类别──

## 关键术语: "El hombre es un hombre"

| Term | 人们的说法 | 它实际意味着什么 |
|---|---|---|
| SWE-bench | “Coding benchmark” | 带有 ground-truth patches 和 test suites 的真实 GitHub issues |
| SWE-bench Verified | “Cleaned subset” | 500 个经过人工筛选的任务，存在 easier-tail |
| SWE-bench Pro | “Harder subset” | 10+ 行修改；frontier 得分为 23–59% |
| CodeAct | “Code-as-action” | Agent 发出 Python；Jupyter-style kernel 在 sandbox 中执行 |
| JSON tool call | “Function calling” | 每个 action 都是执行前经过验证的 structured JSON payload |
| Scaffold | “Agent framework” | 围绕基础模型的 retrieval + planner + executor + verifier loop |
| ACI (Agent-Computer Interface) | “SWE-agent's format” | 为 LLM ergonomics 设计的 command set，而不是 human shells |
| Verifier loop | “Test-and-retry” | 运行 tests、读取 output、修订 patch；最大的非模型可靠性收益 |

## 延伸阅读

- [Jimenez et al. — SWE-bench](https://www.swebench.com/) Origen de referencia y metodología¬
- [OpenAI — Introducing SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) subconjunto curado  cómo se construye 
- [Wang et al. — OpenHands: An Open Platform for AI Software Developers](https://arxiv.org/abs/2407.16741) CodeAct 架构和事件流设计──
- [Epoch AI — SWE-bench leaderboard](https://epoch.ai/benchmarks) 实时追踪的分数──
- [Anthropic — Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) Enmarcado de fiabilidad de los agentes codificadores de largo horizonte。
