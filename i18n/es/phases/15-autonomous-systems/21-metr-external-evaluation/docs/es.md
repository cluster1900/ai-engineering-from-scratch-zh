# METR Horizontes temporales y evaluación de la capacidad externa

> METR(preventes para ARC Evals) desde el 12 de enero de 2023 se convertirá en un 501 (c) 3) independiente 组织──他们的时间视野1.1基准(2026年1月) 将任务成功概率与 log(专家人类完成时间) 拟合为一个物流曲线;在50% 概率处交点定义为模型的时间视野──20252026年的参与集 覆盖GPT-5.1GPT-5.1-Codex-Max,以及原型监控评估(监控评估(监视能力是否发现侧任务;代理能否规避) 基准套件:CASH MLT180+ 个别的测量;分钟到8小时) RE-Bench  71 专家带有基础任务的 MLWA 署的任务; AWA                                                                                                                                                             

**类型：**Aprende
**语言：**Python (stdlib, estimador de horizonte logístico)
**先修：**Fase 15 · 01 (agentes de largo horizonte), Fase 15 · 19 (RSP)
**时间：**- 60 minutos

##  problemas

Las políticas de escalado (Lecciones 19, 20) dependen del resultado de las mediciones que se citan. El umbral de I+D-4 de la IA y la autonomía a largo plazo se define en el texto de la política.

METR es una organización de evaluación externa de 20242026 años, que define muchos de ellos. Ellos evalúan modelos fronterizos, generalmente realizados bajo las condiciones de la NDA del modelo publicado antes de la firma de laboratorio y luego de la publicación de un método. Time Horizon 1.1 punto de referencia (Janeiro de 2026) es su resultado central: una capacidad comprimida en una sola unidad de lectura humana. Este modelo puede ser completado con una fiabilidad del 50%.

Esta clase se trata de una parte sobre el método de cálculo del horizonte, la parte sobre la manera de explicar por qué el horizonte es el límite superior, y no la implementación de pronóstico. Estas dos habilidades deben ser puestas en común.

## 概念

### METR 背景

- 成立时间:2023 年 12 月(前身为 ARC Evals,拆分为独立 501(c)(3))
- 范围: evalúa las capacidades autónomas de los modelos fronterizos, generalmente realizadas antes de la publicación.
- 合作实验室:Antropic、OpenAI(20252026 años de participación)
- 重要交付物:Tiempo Horizonte 1.0(2025 años 3 月) 、Tiempo Horizonte 1.1(2026 años 1 月) 、原型监控评估──

### Horizonte del tiempo 拟合

方法论(de METR blog 和 papeles):

1. 收集一个任务套件,覆盖分钟级到小时级的专家完成时间──当前套件:HCAST(180+个任务)、RE-Bench(71个任务)、SWAA──
2. 让模型运行每个任务;记录成功或失败──
3. 拟合一条 逻辑曲线:P(éxito) es la función de log (专家完成时间)
4. horizonte es hacer P(éxito) = 0.5 of专家时间。

La forma logística-ajusta es adecuada, ya que normalmente existe una relación entre la capacidad y la dificultad de la tarea en aumento y en aproximación a la plataforma. El 50% de puntos es una opción.

### 2026 年 1 月数字

Según el Horizonte del Tiempo 1.1:

- Claude Opus 4.6: en 50%可靠性下约 14 小时, de Horizonte del Tiempo 1.1 ((2026 年 1 月) ⋅
- El tiempo de duplicación de la misión de tipo HCAST: Horizonte temporal 1.1 ((1 de enero de 2026) 报道后2023 拟合约为 4.3 个月(130.8 天); aproximadamente 7 个月的数字是时间视野 1.0 时间视野 1.0 时间视野20192025 时间视野 1.1 时间视野 1.1.2 时间视野 1.1.2 时间视野 1.1.2 时间视野 1.1.2 时间视野 1.1.2 时间视野 1.1.2 时间视野 1.1.2 时间视野 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1.1.2 时间表 1. 时间表 1.1.2 时间表 1. 时间表 1. 时间表 1. 时间表 1. 时间表 1. 时间表 1. 时间表 1. 时间 时间表 1. 时间 时间 时间表 1. 时间 时间表 1. 时间 时间表 1. 时间 时间表 1. 时间 时间 时间 时间表 1. 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间 时间  时间 时间    时间 时间 时间 时间 时间         时间 时间      时间 时间       时间  时间 时间 

Estos son los números concretos de la Fase 15 后续引用的数字──Anthropic's RSP v3.0 (Leyón 19) y DeepMind's FSF v3 (Leyón 20) los citan, como una de las medidas de las evaluaciones de umbral de entrada──

### Suites de referencia

- **HCAST**Se trata de un conjunto de datos que se han desarrollado en el mundo de la información y la información.
- **RE-Bench**:71 个 ML investigación-ingeniería 任务,带有人类专家基线――衡量模型能否完成会输入到AI R&D-4 门 中的那类 ML R&D工作――
- **SWAA**:较短任务;用于校准视界曲线的低端──

### El tipo de evaluación de la vigilancia

20252026 工作 METR 工作包含监测-评估原型:monitor 能否发现模型正在执行副任务 (también conocido como "monitoreo de control") (monitoreo de control) 能否规避监测 (monitoreo de control) 这些直接输入到OpenAI PF v2 的Undermining Safeguards类别,以及 DeepMind FSF v3 (Leyción 20) 能否发现模型正在执行副任务 (también conocido como "monitoreo de control") 能否规避监测 (también conocido como "monitoreo de control") 能否规避监测 (también conocido como "monitoreo de control de control") Undermining Safeguards类别, así como el monitoreo de la alineación engañosa en DeepMind FSF v3 (Leyción 20).

### ¿Por qué los horizontes son el límite superior?

- **理想化工具**Las tareas de referencia 给模型提供干净工具和格式良好的数据──真实部署更混乱──
- **没有真实后果**El modelo no se encargará realmente de los gastos de los clientes, eliminará datos reales o comunicará con personas reales.
- **Eval-context gaming**La lección 1 ―Modelo en el ensayo comportamiento diferente―El Informe Internacional de Seguridad de la IA de 2026 ha registrado esto en el método de la práctica―.
- **没有真实用户差异**: las instrucciones de referencia son estructuradas.

El horizonte es la capacidad de los límites en condiciones favorables. La fiabilidad de la implementación es otro número, más bajo, y el equipo debe medir su distribución para saberlo.

### Signification de un evaluador externo

La independencia de METR: una 501 (c) (3) de tener un método abierto y artículos revisados por pares, es una medida de alivio estructural. En sí misma no es suficiente.

### 如何在实践中使用视界 数字 如何在实践中使用视界 数字 如何在实践中使用视界 数字

- **作为能力过滤器**Si el horizonte de un modelo es muy bajo que el tiempo de expertos de las tareas propuestas, no lo haga de forma autónoma.
- **作为趋势指标**El tiempo duplicado te dice que, incluso sin nuevas mitigations, la actual práctica también puede mantenerse segura durante mucho tiempo.
- **作为 prior**El horizonte de las horas es el punto de partida. De acuerdo con la distribución de sus tareas, la calidad de los instrumentos y la implementación de los mismos, el siguiente es el siguiente:


```figure
a5-horizon-fit
```

## Usalo

`code/main.py`基于合成结果集, logró logística de logística de logro-successo y logro-tiempo de expertos.                                                                                                                                                                                                                                                

##  entregarlo

`outputs/skill-horizon-interpretation.md`审查 vendedor's horizon claim,并产出基准 claim y análisis de la brecha entre la realidad de la implementación ──

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` confirmar que el 50% del horizonte que se ha logrado coincide con la realidad de la tierra sintética  ahora se reducirá la cuadrícula de tiempo de tarea  la estimación del horizonte ¿habrá lugar un cambio significativo?

2. 阅读METR's Time Horizon 1.1 blog post―: encontrar las tareas concretas más y menos fiables―: explicar por qué existe esta brecha―:

3. 阅读 METR 的测量自主AI Capacidades资源──列出 HCAST 任务类别──选择一个你会在生产任务中赋予更高权重的类别,并说明理由──

4. Introducir un simulador: transformar en éxito el 20% de las tareas fallidas.

5.  Basado en tu propio backlog de errores o conjunto de tareas representativas, diseña una evaluación de horizonte interno―describir la recopilación de datos、paraje, así como la salida te dice qué―, compararlo con el METR.

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| METR | “外部评估者” | 前身为 ARC Evals；自 2023 年 12 月起为独立 501(c)(3) |
| Time Horizon | “能力度量” | 来自 logistic fit 的、50% 可靠性下的专家任务长度 |
| HCAST | “METR 的主套件” | 180+ 个任务，跨度从 1 分钟到 8+ 小时 |
| RE-Bench | “Research engineering” | 71 个带人类 baseline 的 ML research-engineering 任务 |
| SWAA | “短任务套件” | 校准 horizon curve 的低端 |
| Doubling time | “增长率” | 50% horizon 翻倍所需时间；按 HCAST 约 7 个月 |
| Eval-context gaming | “模型行为不同” | 测试与部署之间有记录的行为差距 |
| Upper bound | “Horizon 是上限” | benchmark horizon > 负载下的 deployment reliability |

## 延伸阅读

- [METR — Resources for Measuring Autonomous AI Capabilities](https://metr.org/measuring-autonomous-ai-capabilities/) HCAST、RE-Bench、SWAA 规格──
- [METR — Measuring AI Ability to Complete Long Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) Originiario papel de horizonte。
- [METR — Time Horizon 1.1 (January 2026)](https://metr.org/research/) 当前数字和方法论──
- [Epoch AI — METR Time Horizons benchmark](https://epoch.ai/benchmarks/metr-time-horizons) 实时跟踪──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于 METR measurements 的内部视角──
