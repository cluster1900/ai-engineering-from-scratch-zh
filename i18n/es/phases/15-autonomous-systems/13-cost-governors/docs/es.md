# Presupuestos de acción, límites máximos de iteración y gobernadores de costes

> 某中型电子商务代理的月度 LLM 成本, 在团队启动"orden-tracking"habilidad 后,从 $1,200 跳到了 $4,800── esto no es un error de fijación de precios── esto es un agente  detecta un nuevo ciclo, y continúa en el ciclo de gastos ‒ Microsoft's Agent Governance Toolkit ‒ 2026 4 月 2 日) ha estandarizado la línea de protección contra este tipo de problemas: por petición ‒`max_tokens`、 Token y USD de cada tarea presupuesto、 límite máximo de día/meses  límites de iteración  límites de modelo de rotación  caché de inmediato  ventanas de contexto  costosos controles HITL en operación  interruptores de ejecución en caso de incumplimiento de presupuesto  SDK de Claude Code de Antropic con diferentes nombres ofrece la misma capacidad básica  límites de velocidad financiera, por ejemplo, más de $ 50 en 10 minutos para cortar la visita, comparación de límite de la cantidad de tiempo más rápido para capturar el ciclo 

**Type:** Learn
**Languages:** Python (stdlib, layered cost-governor simulator)
**先修要求：**Fase 15 · 10 (moduos de autorización), Fase 15 · 12 (execución duradera)
**Time:** ~60 minutes

##  problemas

Cada ronda de agentes autónomos gastará dinero real. El mal resultado de un chatbot es un mal retorno. El mal ciclo de un agente es una factura. En los documentos de la industria, el término para este modelo de fracaso es "Denial de billetera": agente continuo de pensar continuo de utilizar herramientas continuo de contar, sin que nada lo impida, porque al principio no se diseñó este mecanismo de bloqueo.

El método de reparación no es un número, sino un conjunto de diferentes medidas y grados de tiempo: cada solicitud, cada tarea, cada hora, cada día, cada mes.

Esta es una sección de ingeniería: matemáticas muy sencillas, el equipo fracasa en el lugar donde está en el registro.

## 概念

### gobierno de costes 

1. **每次请求的 `max_tokens`。**简单―― evitar que cualquier una vez se produzca una realización sin límites―
2. **每个任务的 Token 预算。**Durante todo el proceso de ejecución, debe exceder N 个 Token── hasta alcanzar la límite de tiempo duro stop──
3. **每个任务的美元预算。**Como el token, pero la unidad es moneda.`max_budget_usd`¿Qué es eso?
4. **每个工具调用上限。**No más de N veces`WebFetch`调用 ∞ N 次 ∞`shell_exec`调用, etc. etc.
5. **Iteration cap (`max_turns`)。**El número total de ciclos de los agentes; evitar el ciclo de la investigación ilimitado.
6. **每分钟 / 每小时 / 每天 / 每月上限。**滚动窗口── Usado en diferentes escalas de tiempo para capturar las fugas──
7. **财务速度限制。**Por ejemplo, si el gasto en 10 minutos supera los 50 dólares, entonces cortar el visitado.
8. **分层 model routing。**默认使用更小的模型; sólo cuando el clasificador 判断任务值得时才升级到更大的模型──
9. **Prompt caching。**Sistema de instancia y establecimiento de contexto existente proveedor cache en; re-enviar Token 成本接近零──
10. **Context windowing。**通过缩小/总结 把活文本 保持在值以下;直接降低 Token 成本。
11. **昂贵操作上的 HITL checkpoints。**Antes de que se realice una operación costosa, se requiere una confirmación artificial.
12. **预算违约时的 kill switch。**任一上限触发时会议 中止──记录触发的上限; necesita un camino de reinicio independiente──

### ¿Por qué necesita, en lugar de un límite único?

单个月度上限只有在钱包已经空后才抓住失控代理――单个每请求上限不能抓住任何问题――不同失败模式需要不同时间度:

- **失控循环**(Agente 卡在 5 秒重试中): por la limitación de velocidad de la captura.
- **缓慢泄漏**(agente cada tarea ha hecho aproximadamente 2x 预期工作): por el límite diario de captura.
- **糟糕发布**(New Version Using 5x Token): por cada semana / cada mes
- **合法激增**(Real Needs, no Bug): por el tiempo / 天上限抓住,并产生清晰日志。

### La superficie del presupuesto de Claude Code

Claude Code Agent SDK 暴露了(公开文档):

- `max_turns` Cap de iteración。
- `max_budget_usd` 美元上限;违约时会议 中止──
- `allowed_tools`- ¿ Qué ?`disallowed_tools` 工具 Allowlist 和 denylist。
- 工具使用前的 hook points, para la auto-definición de los costes de cálculo.

Con escalera de modo de permiso (lección 10)`max_budget_usd`de la `autoMode`La sesión es una autonomía no gobernada.

### La ley de IA de la UE  Agencia OWASP Top 10

El conjunto de herramientas de gobernanza de agentes de Microsoft  que cubre el Top 10 de los agentes de la OWASP y la Ley de IA de la UE Artículo 14  Supervisión humana  Requisitos  para el entorno de producción, registro y ejecución de la UE  no son opcionales 

###  observado $1,200 → $4.800 casos

Un caso real en Microsoft: un agente de comercio electrónico después de agregar nuevas herramientas, el costo mensual se duplicó en tres veces. Este instrumento permite al agente en cada sesión consultar el estado de los pedidos.


```figure
cost-governor-stack
```

## Usalo

`code/main.py`模拟一个有层层成本管理员堆 和没有该的代理 运行――模拟中的代理在几轮后漂移进轮询循环; layered stack将在速度窗口内抓住它,而单个月度上限将直到几天后才触发――

##  entregarlo

`outputs/skill-agent-budget-audit.md`审计一个拟议代理 部署的成本-governor stack,并标记缺失层──

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Confirmar en el ciclo de la ronda de la pregunta, la velocidad limitada antes de la iteración límite 触发── ahora de la prohibición de la velocidad límite, agente de medición en la iteración límite 抓住它之前花了多少──

2. ¿Qué herramientas necesitan límites más estrictos? ¿Qué herramientas pueden funcionar sin límites sin riesgo?

3. 阅读Microsoft Agent Governance Toolkit 文档――列出工具kit 命名的每种上限类型――把每种映射到某失败模式(失控循环、缓慢泄漏、糟糕发布、激增) 』

4. Por ejemplo, trayectoria de 50 emisiones en un repo)`max_budget_usd`设为点估计的2x. 解释为什么是2x.

5. El código de Claude `max_budget_usd`基于 sesión 聚合成本触发──设计一个你将在外部执行互补速度限制──什么会触发切断,重新启动是什么样子?

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Denial of Wallet | "Runaway bill" | agent 循环产生花费，并且没有上限阻止它 |
| max_tokens | "Per-request cap" | 单个 completion 大小的上限 |
| max_turns | "Iteration cap" | 一个 session 中 agent loop 迭代次数的上限 |
| max_budget_usd | "Dollar kill switch" | session 成本上限；违约时中止 |
| Velocity limit | "Rate cap" | 短窗口内花费的限制（例如，$50 / 10 min） |
| Tiered routing | "Small model first" | 默认使用便宜 model；只有 classifier 判断值得时才升级 |
| Prompt caching | "Cached system prompt" | provider 侧 cache 将重发 Token 成本降到接近零 |
| HITL checkpoint | "Human approval gate" | 昂贵操作前需要人工确认 |

## 延伸阅读

- [Anthropic Claude Code Agent SDK — agent loop and budgets](https://code.claude.com/docs/en/agent-sdk/agent-loop)¿ Qué es esto ?`max_turns`¿Qué es esto?`max_budget_usd`、 herramientas permitidas
- [Microsoft Agent Framework — human-in-the-loop 与治理](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) gobierno de gastos 检查点。
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) proveedor 侧成本控制──
- [Anthropic — Prompt caching (Claude API docs)](https://platform.claude.com/docs/en/prompt-caching) mecanismo de almacenamiento en caché 
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) costo de los agentes de largo horizonte
