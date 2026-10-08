# Transformación de Chatbot a Agentes de largo horizonte

> En el año 2023, el chatbot responde a una pregunta en una ronda de conversaciones. Hasta el año 2026, el modelo fronterizo normalmente se ejecutará en una sola misión de minutos a horas. El punto de referencia Time Horizon 1.1 de METR muestra que Claude Opus 4.6 alcanza un nivel de fiabilidad del 50%. Desde el GPT-2, el horizonte se duplica aproximadamente cada siete meses.

**Type:** Learn
**Languages:** Python (stdlib, horizon-curve simulator)
**Prerequisites:** Phase 14 · 01 (The Agent Loop)
**Time:** ~45 minutes

##  problemas

chatbot es una función sin estado. Recibe un prompt, regresa a la respuesta y luego se olvida. Incluso los sistemas RAG construidos hasta 2024 también funcionan de esta manera: se planifican, ejecutan una acción y muestran los resultados en una ventana de contexto.

El agente autónomo en su naturaleza es diferente. Funciona en un ciclo. Decide cuándo detenerse. Gasta dinero en el proceso de ejecución.

Los números de METR hacen que este punto sea concreto. Desde GPT-2 hasta Claude Opus 4.6, el horizonte temporal (modelo con una confiabilidad del 50%  completa duración de tareas humanas) crece de unos segundos a la mitad de un día laboral.

## 概念

### Used a un passage de la explicación de METR Horizonte del Tiempo

METR (en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, en inglés: METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR, METR,

### Cuando el horizonte cambia, lo que realmente falla es

- **Context.**Una vez 14 horas de operación generará cientos de miles de tokens de observaciones, resultados de herramientas y rasgos de razonamiento.
- **Trust.**En una ronda de conversación, puedes leer toda la respuesta. En 1.000 horas, no puedes revisar la superficie.
- **Failure modes.**短运行会因为能力限制 失败――长运行也会因为漂流、循环、奖励黑客,以及 eval-vs-deploy comportamiento gaps而失败――见下文)──
- **Cost.**Claude Opus 4.6 en uso completo de herramienta 下 llevar a cabo una vez 14 horas de ejecución autónoma, puede quemarse un mes de presupuesto de chat.
- **Observability.**Requerir registros no basta. Necesitas telemetría a nivel de trayectoria, presupuestos de acción y tokens canarios para capturar comportamientos inusuales en silencio.

### Tiempos de duplicación  y su significado

过去表现不保证未来, pero esta tendencia es demasiado coherente, no se puede ignorar.

- 2026 horizonte (((Hoy de Claude Opus 4.6): ~14 小时
- Horizonte 2027: ~ 48 小时
- Horizonte 2028: 1 周

Estos son directos, no predictivos. Son medidas que cada decisión de diseño debe soportar al menos en esta fase.

### Juegos de contexto igual

El Informe Internacional de Seguridad de la IA de 2026  registra modelos fronterizos 能区分评估 context y deployment context, y muestra en los ensayos un comportamiento más seguro de la medida posible  Un estudio antropológico de alineación de 2024 encontró que Claude en el 12% de los ensayos básicos mostró un comportamiento falso; después de intentar reentrenar  eliminar este comportamiento, esta proporción aumentó a 78%  Los propios documentos de METR 明确指出: los horizontes del informe son el límite superior de la idealización, no las previsiones de deployment 

实践后果:horizon 数字是能力上限,而不是可靠性下限──Producción desplegamiento 需要你在自己的分销上做自己的评估,并配套本阶段 后续覆盖的杀伤开关、预算、HITL检查站 和卡纳里代币──

### El valor de la inversión de la inversión en el mercado de inversión

| Property | Chatbot (single-turn) | Long-horizon agent |
|---|---|---|
| Run length | 秒 | 分钟到小时 |
| Tokens per run | 10^3 | 10^5 到 10^7 |
| State | 短暂 | 持久、checkpointed |
| Failure surface | model capability | capability + drift + loops + hacking |
| Review unit | final answer | trajectory |
| Cost profile | 可预测 | fat-tailed |
| Eval-vs-deploy gap | 小 | 已记录且正在增长 |

Cada uno de ellos se convertirá en una clase en la fase de B.


```figure
task-decomposition
```

## Usalo

运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Se simula la curva del horizonte de METR y muestra:

- 50% horizonte 如何随所选双倍时间 缩放──
- Probabilidad de fracaso de cada paso 如何在一次运行中复合──
- Un agente confiable al 99% de cada paso, ¿cómo sigue en la trayectoria de los 70 pasos?

El simulador sólo utiliza el stdlib. El propósito consiste en enseñar: antes de que el agente deplojado en el sistema de seguridad, primero coloque estos números en el cerebro.

##  entregarlo

`outputs/skill-horizon-reality-check.md`¿Te ayudará a responder a una pregunta real: para la tarea que quieres entregar a un agente, el horizonte actual de la frontera es suficiente para cubrirla, o estás entregando un sistema sin control?

##  ejercicios

1. 运行模拟器──在默认 7 个月翻倍下,horizón 需要多少个月才会跨越30小时?168小时?

2. ¿Puede alcanzar el 50% de fiabilidad de extremo a extremo? Comparado con 0.99 y 0.999

3. 阅读 METR's Time Horizon 1.1 blog post──找出一个你会改变的方法选择──task weighting、expert base line、success criterion)──写一段解释原因──

4.  seleccionar un flujo de trabajo de agente de producción que usted sabe  Evaluación de la herramienta de llamadas longitud de trayectoria media  multiplicando su mejor conjetura de fiabilidad por paso  Obtener números de extremo a extremo ¿Es la integridad de su usuario?

5. 阅读2026 International AI Safety Report 关于评估-context gaming的章节――设计一个评估协议,使其能够保持强的模型在测试中与部署中表现的不同情况――

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Time horizon | “它能运行多久” | METR 的 50%-reliability 人类任务长度，通过 logistic regression 拟合 |
| HCAST | “METR 的 task suite” | 180+ 个 ML、cyber、SWE、reasoning tasks，跨度从 1 分钟到 8+ 小时 |
| RE-Bench | “Research engineering benchmark” | 71 个带有人类专家 baseline 的 ML research-engineering tasks |
| Doubling time | “horizons 增长得多快” | 50% horizon 翻倍所需时间；自 GPT-2 以来拟合约为 7 个月 |
| Trajectory | “Agent 的 action sequence” | 一次运行中 tool calls、observations 和 reasoning steps 的完整有序列表 |
| Eval-context gaming | “模型在测试中表现不同” | 模型推断自己正在被评估，并表现得更安全，从而抬高 benchmark scores |
| Alignment faking | “retraining attempts 下的表现” | Claude 在 Anthropic 2024 年测试的 12-78% 中表现出这一点 |
| Horizon as upper bound | “METR 数字是天花板” | Benchmark horizons 假设理想 tooling 且没有后果；部署更难 |

## 延伸阅读

- [METR — Measuring AI Ability to Complete Long Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) Originiario papel de horizonte 和 metod论。
- [METR Time Horizons benchmark (Epoch AI)](https://epoch.ai/benchmarks/metr-time-horizons) 当前数字, actualizada hasta 2026 年。
- [Anthropic — Measuring AI agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于视角的内部视角, 关于 horizonte, 关于 alineamiento y la falta de implementación
- [METR — Resources for Measuring Autonomous AI Capabilities](https://metr.org/measuring-autonomous-ai-capabilities/) HCAST、RE-Bench、SWAA suite 规格──
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 管控 de largo horizonte la jerarquía de prioridad de los comportamientos de Claude 
