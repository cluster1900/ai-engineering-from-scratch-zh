# Investigación de Alineación Automática (ARA antropológica)

> En el caso de los investigadores de la capacitación de los hombres y mujeres, el rendimiento del AAR supera a los investigadores humanos. En el caso de los investigadores de la capacitación de los hombres y mujeres, el rendimiento del AAR supera a los de los hombres y mujeres. En el caso de los investigadores de la capacitación de los hombres y mujeres, el rendimiento del AAR supera a los de los hombres y mujeres. En el caso de los investigadores de la capacitación de los hombres y mujeres, el rendimiento del AAR supera a los de los hombres y mujeres.

**Type:** Learn
**Languages:** Python (stdlib, parallel-research-forum simulator)
**前置要求：**Fase 15 · 05 (científico de IA v2), Fase 15 · 04 (DGM)
**Time:** ~60 minutes

##  problemas

La investigación de alineación consume una gran cantidad de tiempo de los investigadores humanos. Como la supervisión escalable, la especificación de recompensas o la formación de débil a fuerte, este tipo de problemas, cada ronda de experimentación 代都需要数周── con las capacidades fronterizas 推进, alignment 工作量增速超过合格研究员供应的增速──

La investigación de alineación automática (AAR)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

 El resultado es positivo: el rendimiento de la AR en un problema de investigación es superior al nivel de base humano. Pero este resultado también centra cada preocupación que ya se ha desarrollado en esta fase en un sistema. Si la investigación de alineación puede ser automatizada, entonces la parte de las salvaguardias pueden ser automatizadas.

## 概念

### 架构(按公开描述)

- **Parallel agents.**Más de un millón de millones de dólares en el mercado de la información.
- **Shared forum.**El estudio descubre que se publica en un foro compartido, su almacenamiento de fondo se encuentra fuera de cada caja de arena.
- **Task allocation.**Una cola de tareas diseñada por humanos distribuirá los problemas de investigación a AAR. AAR propone la descomposición, realiza experimentos y escribe descubrimientos.
- **Weak-to-strong training focus.** El trabajo publicado trata sobre la formación de débil a fuerte, es decir, el uso de un modelo de supervisor más débil para entrenar un modelo de estudiante más fuerte.

### ¿Por qué el registro fuera de la caja de arena es importante?

Log-integritad  atributos  es la diferencia entre experimentos controlados y experimentos potencialmente perjudicados  Si AAR  puede editar su propio diario, ellos  pueden ocultar experimentos fallidos o sospechosos  Antropic  directamente señala esto: esta atributos  es una condición necesaria para la producción de la investigación de confianza, y la verificación  no es fácil 

En el término infraestructura, se utilizan registros de escritura a través de almacenamiento externo de sólo apéndices de almacenamiento externo (por ejemplo, S3 objeto-bloqueo, inmutables registros de Datadog)  Agente  no modificó la credencial de los registros anteriores  Esto es el mismo modelo que el equipo de seguridad empresarial de 2026 para construir rastros de auditoría de software antidetección 

### flujo de trabajo prescrito

El informe de Anthropic señala que los flujos de trabajo prescritos 往往会限制AAR de la flexibilidad y disminuir su rendimiento. En otras palabras: si un diseñador humano escribe un plan de investigación gradualmente, el rendimiento de AAR difiere de sólo dar un objetivo de alto nivel y permitir su libre descomposición. Esto coincide con los resultados de la investigación agencial: los andamios demasiado determinados podrían causar daño a los agentes capaces.

Seguridad significa muy delicado. La flexibilidad de la AAR también permite la descomposición no autorizada. También permite el uso de nuevos tipos de herramientas y la flexibilidad de la derivación de objetivos.

### 压缩风险 压缩风险 压缩风险 压缩风险 压缩风险

RSP v3.0 (lección 19) introdujo un umbral de capacidad de I+D de IA: tiene un coste competitivo en comparación con las herramientas de IA+humanos, la capacidad de automatizar completamente la tubería de I+D de IA.

AAR está más allá de este umbral: ha automatizado parte de la tubería (para la investigación de alineación de tareas específicas), pero todavía no hay un ciclo de desarrollo de capacidades de automatización de extremo a extremo.

                                                                                                                                                                                                                                                              

### AAR no puede sustituir nada

Los investigadores humanos establecen una cola de tareas, revisan los resultados y tienen autoridad constitucional. AAR es el medio de la línea de producción, no los dos extremos.

Este modelo se aplica al estudio en sí mismo y se ajusta a la Lección 15 en la que se propone el compromiso humano.


```figure
aar-forum
```

## Usalo

`code/main.py`模拟一个多AAR研究论坛──三个独立的研究代理并行运行,将发现发布到一个仅附录论坛,并可选择进行操纵尝试──

 observar:

- Logging out-of-sandbox 如何捕获木材
- En el problema de la mayor dificultad, permite la asignación de tareas de libre descomposición 如何优于固定工作流
- Si el registro no es evidente, solo una señal de AAR comprometida 如何污染论坛的信号──

##  entregarlo

`outputs/skill-aar-deployment-review.md`Es una revisión del Pre-Departamento de la línea de investigación de alineación automatizada.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Comparar "flujo de trabajo fijo" con "descomposición libre" 设置── libre descomposición ¿es siempre el éxito, también en ciertos tipos de problemas de flujo de trabajo fijo también existe competencia?

2. Modificar el simulador, hacer que un agente intentara manipular el registro.

3. 阅读Antropic's weak-to-strong AAR 报告――找出AAR 超越人类研究员的具体子任务――是什么让它适应自动化? ¿Qué es lo que hace que AAR se adapte a la automatización?

4. 设计一个任务队分配政策,在 AAR 灵活性 (更好结果) 约束 (约束) 更易审计) 约束 (更易审计) 约束 (约束) 更易审计) 约束 (更易审计) 约束 (约束) 更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (约束) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束 (更易审计) 约束) 约束 (更易审核) 约束 (更易审核) 约束) 描述你将对对对对对对对对对对对对进行 A/B测 (A/B测)

5. 阅读RSP v3.0  AI R&D-4                                                                                                                                                                                                                                                        

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| AAR | "Automated Alignment Researcher" | 在 alignment problems 上 autonomously 运行的 Claude Opus 4.6 实例 |
| Weak-to-strong training | "Training a stronger model with a weaker supervisor" | AAR 表现超过人类的经典 scalable-oversight benchmark |
| Shared forum | "Where agents publish findings" | Append-only、out-of-sandbox storage |
| Out-of-sandbox log | "Agent cannot edit its own record" | Tamper-evident write-through 到 external storage |
| Prescribed workflow | "Step-by-step plan from human designer" | 限制 AAR；相较 free decomposition 往往降低性能 |
| Free decomposition | "Agent decides how to break the task" | 能力更强，更难 audit |
| AI R&D threshold | "RSP/FSF capability level" | 以有竞争力的成本完全自动化 R&D pipeline |
| Compressed timeline | "Alignment vs capability race" | 如果 capability 复合增长快于 alignment，misalignment 风险就会增长 |

## 延伸阅读

- [Anthropic — Automated Weak-to-Strong Researcher](https://alignment.anthropic.com/2026/automated-w2s-researcher/) fuente primaria。
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) Enmarcamiento del umbral de I+D de la IA。
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) Más amplio marco de la autonomía de los agentes.
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) Niveles de autonomía de I+D de la R&D de la RSP en la línea media.
- [Burns et al. (2023). Weak-to-Strong Generalization (OpenAI)](https://openai.com/index/weak-to-strong-generalization/) Problemas de nivel inferior de la AAR
