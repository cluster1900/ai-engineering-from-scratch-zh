#  evaluación y coordinación

> Los cinco puntos de referencia para 2025-2026 abarcan un espacio de evaluación multiagente.**MultiAgentBench / MARBLE**(ACL 2025, arXiv:2503.01935) con KPI de hitos  evaluación de estrella/cadena/árbol/gráfico 拓;**graph 最适合 research**, la planificación cognitiva  aumentó aproximadamente el 3% de los logros de la etapa milestone **COMMA** evaluar la coordinación de información asimétrica multimodal; incluido el modelo más avanzado GPT-4o en el que es difícil superar la línea de base aleatoria―**MedAgentBoard**(arXiv:2505.12371) abarca cuatro clases de tareas médicas, y a menudo se encuentra que el multi-agente no es mejor que el LLM único.**AgentArch**(arXiv:2509.10769) referencia 结合 herramienta-uso + memoria + orquestación de arquitecturas de agentes empresariales。**SWE-bench Pro**(El artículo[arXiv:2509.16941](https://arxiv.org/abs/2509.16941)) contiene 41 repositorios de 1865 problemas, que cubren aplicaciones de negocios, servicios B2B y herramientas de desarrollo; modelos fronterizos en Pro arriba alrededor del 23%, mientras que en Verified arriba más del 70% **64.3%**,并显式使用代理团队协调(no ha publicado Antropic primary source  先视为初步结果);Verdent(agente andamio) en Verified 上 达到**76.1% pass@1**(El artículo[Verdent technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report))。**AAAI 2026 Bridge Program WMAC**(El artículohttps://multiagents.org/2026/）是2026 年社区焦点──本课基于 MARBLE 的指标,运行拓学-vs-指标扫,并固定仅通过SWE-bench Verified 不是概括证据 这条规则──

**类型：**Aprende
**语言：**Python (stdlib)
**先修：**Fase 16 · 15 (Topología de votación y debate), Fase 16 · 23 (Modos de fracaso)
**时间：**75 minutos

##  problemas

Cuando un artículo afirma que nuestro sistema multiagente es mejor, la pregunta es: ¿Qué es mejor que qué, en qué tareas es mejor? ¿Cómo medir?

 sin parentescos, no puedes comparar significativamente dos sistemas multiagentes― peor aún, sin parentescos, los modelos fronterizos pueden contaminarse― hasta el año 2025, el banco SWE Verificado  ha entrado en parte en el material de entrenamiento y ha sido contaminado; puntajes fronterizos  inflación; Pro diseñado para ser un ensayo real no contaminado―

En el curso de la Universidad de San Francisco, el profesor de Ciencias de la Información y la Ciencia de la Información, el profesor de Ciencias de la Información y la Ciencia de la Información, el profesor de Ciencias de la Información y la Ciencia de la Información, el profesor de Ciencias de la Información y la Ciencia de la Información, el profesor de Ciencias de la Información y la Ciencia de la Información, el profesor de Ciencias de la Información y la Ciencia de la Información, el profesor de Ciencias de la Información y la Ciencia de la Información, el profesor de Ciencias de la Información y la Ciencia de la Información, el profesor de Ciencias de la Información y la Ciencia de la Información, el profesor de Ciencia de Ciencia de la Universidad de San Francisco, el profesor de Ciencia de San Francisco, el profesor de Ciencia de la Universidad de San Francisco, el profesor de Ciencia de San Francisco, el profesor de Ciencia de la Universidad de San Francisco, el profesor de la Universidad de San Francisco, el profesor de la Universidad de San Francisco, el profesor de la Universidad de San Francisco, el profesor de la Universidad de San Francisco, el año de Cato, el profesor de la Universidad de San Francisco, el cual se encuentra en una conferencia de la Universidad de la Universidad de la Universidad de San Francisco,

## 概念

### MultiAgentBench (MARBLE)  ACL 2025

ArXiv:2503.01935── en tareas de investigación, codificación y planificación 上评估四种协调拓类 (star,chain,tree,graph) ― basándose en los KPI de los hitos 跟踪部分进展,而不仅仅看最终成功──

测量结果:

- **Graph**Topología, mejor adaptado a los escenarios de investigación; apoyo a cualquier crítica.
- **Chain**La codificación de refinamiento gradual está en condiciones de máxima adaptabilidad.
- **Star**Lo mejor es la consolidación rápida de hechos.
- **Coordination tax**En el gráfico arriba aparecen más de 4 agentes.
- **Cognitive planning**En las diferentes topologías, el aumento de aproximadamente el 3% de logros de hitos.

Uso de escenario: 你想对协调拓类 进行果对果比较──MARBLE repo(https://github.com/ulab-uiuc/MARBLE）提供evaluador.

### COMMA  Multimodal 非对称信息

 los agentes de cobertura  poseen diferentes modalidades de observación  y deben coordinarse en tareas sin un intercambio completo de información  los resultados del informe son inadecuados: incluyen modelos fronterizos dentro del GPT-4o  en la colaboración entre agentes y agentes de COMMA  es muy difícil superar **random baseline** señales son: modalidades de múltiples agentes  formación insuficiente  evaluación insuficiente  LLM 能更合理处理单modalidad de cooperación; coordinación de múltiples modalidades 会崩。

Uso de escenario: Su sistema tiene coordinación multimodal o asimetrica de información.

### MedAgentBoard  prueba de estrés de dominio

ArXiv:2505.12371── Cuatro clases de tareas médicas: diagnóstico, planificación del tratamiento, generación de informes, comunicación con los pacientes, comparación de sistemas multiagentes, un solo LLM y sistemas tradicionales basados en reglas.

 Cuando las subtareas pueden ser claramente separadas, el diagnóstico + tratamiento, la descomposición de las tareas, ayuda; cuando la coordinación genera más de la generación de informes, produce efectos perjudiciales.

Uso de escenario: tu dominio tiene líneas de base claras de un solo LLM. Si la experiencia de MedAgentBoard puede generalizarse, entonces muchos sistemas multiagentes propuestos son sobre-ingenieros.

### AgentArch  Arquitecturas empresariales

ArXiv:2509.10769──将工具使用、记忆和调乐器 分层组合的企业设置──基准 隔离每层的贡献: 添加工具有多大帮助吗? 添加记忆吗? 添加多代理调乐器吗? 添加多代理调乐器吗? 添加多代理调乐器吗? 添加多代理调乐器吗?

Use Canceance: estás diseñando una pila de agentes empresariales, y necesitas demostrar la razonabilidad de cada uno de ellos.

### SWE-bench Pro  现实检验

ArXiv:2509.16941──41 个存储 中的 1865 个问题,覆盖商业应用程序、B2B服务和开发工具──设计目标是相对较晚的训练截止时间保持**未污染** Los modelos fronterizos en Pro suben alrededor del 23%, mientras que en Verified suben más del 70%  Esta diferencia es la señal de contaminación 

2026 年 4 月分数:
- Claude Opus 4.7 en Pro: **64.3%**(rapport称显式使用代理团队协调; aún no ha publicado fuente primaria antropófica  先视为初步结果)
- Verdent (Equipo de agentes) en Verificado: **76.1% pass@1**(El artículo[technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report))。
- No utiliza el andamio de agentes de la frontera puntajes crudos en Pro: ~23-35%[SWE-bench Pro paper](https://arxiv.org/abs/2509.16941))。

 hemos superado el SWE-bench Verified no es más un testimonio de capacidad──Pro es el actual test de gating──Agent-team scaffolding en Pro produce un beneficio medible 30 a 40 puntos delta), es uno de los argumentos empíricos más fuertes de la coordinación multi-agente en 2026 

### AAAI 2026 WMAC

Programa de puentes de la AAAI 2026  Taller sobre coordinación multiagentehttps://multiagents.org/2026/）。这是2026 años de investigación de AI multiagente en el ámbito de la comunidad. Los trabajos y los trabajos de taller aceptados son el lugar canónico para evaluar nuevos métodos.

### Usar la duda de que se puede leer las reclamaciones de referencia  lista de verificación 2026

Cuando alguien afirma un resultado multi-agente:

1. **哪个 benchmark，哪个 split？**SWE-bench Verified y Pro  diferencia muy grande ⋅ en error de división ⋅ en el informe de arriba números sin valor ⋅
2. **Contamination check。**¿Se publicará el punto de referencia después de la interrupción de entrenamiento del modelo evaluado?
3. **Baseline comparison。**Comparación con el trabajo de múltiples agentes anteriores en línea de base de un solo LLM, aleatorio, no con la versión no sintonizada del mismo sistema, comparación con
4. **Statistical significance。**N ensayos, p-valor, intervalo de confianza, varianza de modelos fronterizos, muy alta, ejecuciones individuales, error de dirección.
5. **Task diversity。**¿Una tarea o varias? La generalización para la producción es importante.
6. **Cost disclosure。**Tokens por tarea 壁時計──20x La solución del 90% de la producción es la decisión de negocio, no la declaración de capacidad──

### Los índices de referencia actuales medían el contenido malo

- **Long-horizon coordination。**持续数天的墙钟互动──当前所有基准都很短──
- **Adversarial resilience。**¿Qué pasa cuando un agente es malintencionado o es atacado?
- **Drift under deployment。**Los puntos de referencia son estáticos; la producción distribuida cambia.
- **Cost-normalized performance。**La mayoría de los índices de referencia  informan de precisión bruta, en lugar de precisión por dólar 

Por lo que realmente te preocupa, construir tu propio punto de referencia interno, es normalmente la práctica correcta.


```figure
a5-bench-gap
```

## Construirlo
`code/main.py`Es un paseo no interactivo:

- En la tarea de juguete 上模拟 3 个多代理系统──
- Para cada sistema calcular métricas de piedra calibre estilo MARBLE.
-                                                                                                                                                                                                                                                               
- 显式比较随机基线──
- 打印 tarjeta de resultados de las reclamaciones de referencia

运行:

```bash
python3 code/main.py
```

预期输出:carta de resultados del sistema, que incluye precisión en bruto, logros de metales, costes por tarea, delta de referencia aleatorio y nota de control de contaminación.

## Usalo
`outputs/skill-benchmark-reader.md`读取任意多代理基准索赔,并应用审查检查清单──输出:grade 和 caveats──

##  entregarlo
El producto de la empresa

- **构建 internal benchmark**Los índices de referencia públicos pueden proporcionar información, pero no pueden ser sustituidos.
- **在每次比较中包含 random baseline。**Si en la tarea de coordinación no puedes superar significativamente al azar, entonces la tarea puede definir mal.
- **同时报告 cost 和 accuracy。**El costo de los tokens y el reloj de la pared.
- **每季度重建 benchmark。**Distribución de la producción 会 cambios; viejos índices 会误导──
- **避免 published-benchmark overfitting。**Si tu equipo se especializa en optimizar el número de SWE-bench Pro, estarás en la producción.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Averiguar cuál de los tres sistemas simulados tiene el mejor costo por meta. ¿Está de acuerdo con el sistema de mayor precisión?
2. 阅读MultiAgentBench(arXiv:2503.01935)。 En cuanto a su propio dominio de tareas, juzgar MARBLE 会推四种TOPOLOGY 中的哪一种──根据论文结果说明理由──
3. ¿Cómo puede resistir la contaminación? ¿De igual manera puede aplicarse a otros puntos de referencia de su interés?
4. 阅读 COMMA 关于多模拟协调的发现――设计一个可以加入内部基准的简单多模拟协调任务――¿Qué se puede calcular para ser útil?
5. ¿Qué calificación darás a esta reclamación?

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| MARBLE | "MultiAgentBench" | ACL 2025；带 milestone KPIs 的 star/chain/tree/graph topologies。 |
| COMMA | "Multimodal benchmark" | Multimodal asymmetric-info coordination；frontier models 相比 random 表现吃力。 |
| MedAgentBoard | "Domain stress test" | 四个医疗类别；经常发现 multi-agent 并不优于 single-LLM。 |
| AgentArch | "Enterprise benchmark" | Tools + memory + orchestration 分层组合。 |
| SWE-bench Pro | "Contamination-resistant" | 1865 个问题、41 个 repos；在 Verified 上约 23% vs 70%+（contamination signal）。 |
| Milestone achievement | "Partial credit" | 奖励进展而不只奖励最终成功的 benchmarks。 |
| Contamination | "Benchmark leaked into training" | 发布后，benchmarks 进入训练语料；分数膨胀。 |
| WMAC | "AAAI 2026 Bridge Program" | Workshop on Multi-Agent Coordination；社区焦点。 |

## 延伸阅读

- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) 带 milestones KPIs de referencia de la topología
- [MARBLE repository](https://github.com/ulab-uiuc/MARBLE) Implementación de referencia
- [MedAgentBoard](https://arxiv.org/abs/2505.12371) Prueba de estrés de dominio; multi-agente normalmente no es superior a
- [AgentArch](https://arxiv.org/abs/2509.10769) Arquitecturas de agentes empresariales
- [SWE-bench leaderboards](https://www.swebench.com/) Modelos fronterizos de Verificados y Pro 分数
- [AAAI 2026 WMAC](https://multiagents.org/2026/) 2026 años comunidad焦点
