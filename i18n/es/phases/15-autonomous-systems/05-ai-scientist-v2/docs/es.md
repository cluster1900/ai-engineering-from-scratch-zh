# Científico de IA v2  Taller 级 autónomo estudio

> El científico de IA de Sakana v2 (Yamada et al., arXiv:2504.08066) 运行完整的研究循环:假设、代码、实验、图表、写作、投稿。 es el primer que hace que un trabajo de producción a través del sistema de revisión por pares del taller ICLR 2025 独立评估 (Beel et al.) 发现,42% de los experimentos en el código de errores fracasaron, la revisión de literatura también a menudo se identifica como un concepto de errores como novela。 Sakana 自己的 doc 警告说,该代码库会执行 LLM 编写的代码,并建议使用Docker 隔离── estos dos ejemplos de imágenes juntos constituyen un punto de relieve。

**Type:** Learn
**Languages:** Python (stdlib, research-loop state-machine toy)
**Prerequisites:** Phase 15 · 03 (AlphaEvolve), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

##  problemas

El estudio es una tarea abierta. A diferencia de la búsqueda de algoritmos de AlphaEvolve o DGM, el estudio no tiene un mecanismo que pueda comprobar los resultados de su auto modificación. El estudio es un trabajo de evaluación y no un ensayo unitario. Esto hace que el ciclo sea más difícil de cerrar. Una vez cerrado, también tiene más valor, ya que el estudio es donde se produce el progreso de la complejidad.

AI Scientist v1 (Sakana, 2024)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

Revista por pares 结论:一篇由 v2 生成的论文被ICLR 2025 workshop 接收(带披露) ・独立评估结论:该系统远不可靠──两者都是真的──

## 概念

### 架构

1. **想法生成。**LLM 根据主题和已有文献提出研究思想──v1 使用模板;v2 在假设空间上使用代理搜索──
2. **新颖性检查。**Recuperación de literatura 步骤检查该思想是否已经发表了──Beel et al. evaluaciones están en este paso encontrando un error de marcado: ya hay métodos que a menudo se clasifican como novelas──
3. **实验计划。**agente 起草实验协议 并编写代码──
4. **执行。**代码在沙箱中运行──失败会反到复试循环── según las mediciones de Beel et al., en esta etapa el 42% de los experimentos en codificación errónea fracasa──
5. **图表生成。**Modelo de lenguaje de visión 读取生成图表,并重写它们以提高可读性──这是 v2's key技术新增点──
6. **写作。**LLM 起草论文,并与内部评审员 代。
7. **可选：投稿。**El trabajo fue enviado a un lugar.

### Taller 接收结果 significa qué

Un artículo de v2 que ha sido creado por el estudio ha pasado por la revisión por pares del taller ICLR 2025 ⋅ autor al comité del programa ⋅ ha revelado la fuente del artículo ⋅ esta recepción es un punto de datos; no se afirma que el sistema ⋅ realizará estudios ⋅ permiso ⋅

重要背景:workshop 论文的门低于主会议论文──Peer review 噪声很大;在任意一天,都会有一小部分投稿被接收──一次成功是概念的证明,而不是可靠性声明──Nature 2026 论文记录端到端循环,且它本身由人类研究人员共同签署;它不是系统写了一篇 Nature 论文──

### 独立评估发现了什么

Beel et al. (arXiv:2502.14297)  llevaron a cabo evaluaciones externas.

- **实验失败。**El 42% de los experimentos en el código erróneo fracaso, errores de importación, desacuerdos de forma, variables indefinidas, o incluso de la retracción de un ciclo, capturaron parte, pero no toda la información.
- **新颖性错误标记。**La literatura-recuperar 步骤 frecuentemente把既有概念标记为小说── esto es equivalente a la alucinación en el campo de la investigación──
- **呈现质量差距。**La crítica gráfica en lenguaje de visión generó efectos de publicación, ocultando las debilidades de la experiencia de base.

El último hallazgo para esta fase es el más importante. Un sistema de producción creíble no se ha desarrollado, es más peligroso que un sistema que claramente falla, y no más seguro. La evaluación debe alcanzar la afirmación de nivel inferior, no puede quedarse en la tabla.

### Escape de caja de arena 风险

Sakana  propio repositorio README 警告:

> Debido a que el software ejecutará el código de LLM, no podemos garantizar la seguridad. Existe un paquete de riesgos.

Esto es la forma operativa de la autonomía en el campo de la no comprobada. LLM puede escribir código; código se ejecuta; código puede hacer cualquier cosa que el proceso se permita hacer. Si no hay una caja de arena de restricciones duras para el sistema de archivos, redes y acciones de procesos, cualquier agente de investigación autónoma puede transmitir datos externos, consumir todo el cálculo o volver a escribirse a sí mismo.

La historia de AlphaEvolve es más fácil, ya que su evaluador es muy cercano. El ciclo de funcionamiento de código abierto de AI Scientist v2 tiene un objetivo abierto. Por lo tanto, necesita más aislamiento.

### V2 en la pila de fronteras

| System | Target | Output kind | Evaluator | Known failure |
|---|---|---|---|---|
| AlphaEvolve | algorithms | code | unit + benchmark | 受 evaluator 严谨程度限制 |
| DGM | agent scaffolding | code | SWE-bench | reward hacking |
| AI Scientist v2 | research papers | text + code + figures | peer review（弱） | 实验失败、错误标记、润色掩盖弱点 |

Entre estos tres, el evaluador automático de v2 lo más débil, el más amplio, el más corto de los caminos de artefactos abiertos a la información pública (controlos operativos, control de arena, revisión y divulgación) asumió la mayor parte del trabajo de seguridad.


```figure
mx-research-loop
```

## Usalo

`code/main.py`将 v2 循环模拟为一个状态机:想法 → 新性检查 → 实验 →图表 → 写作 → review → 接收或代―― cada estado tiene una probabilidad de fracaso configurable, esta probabilidad proviene de los hallazgos de Beel et al.

- Hay muchas ideas hasta llegar a la fase de publicación.
- Hay muchos posts que existen en el artículo de la revista.
- Los presupuestos de retraso ¿cómo se puede medir entre la calidad y la producción¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

##  entregarlo

`outputs/skill-ai-scientist-sandbox-review.md`Es una lista de revisión de dos puertas, para estudiar cualquier contenido producido por un agente de ciclo.

##  ejercicios

1. Utilizaciones de código abierto`code/main.py`¿Cuál es la proporción de artículos producidos por el ciclo de operaciones que tengan un error experimental pero que hayan sido criticados por los gráficos?

2. 默认值已使用 Beel et al. 42% / 25%──分別用 `--experiment-failure 0.20 --novelty-mislabel 0.10`Y `--experiment-failure 0.60 --novelty-mislabel 0.40`¿Cómo cambia la proporción de dos operaciones entre las cuales se ha pulido pero se ha compuesto de defectos?

3. 阅读 Sakana's AI Scientist v2 repo README 中关于沙箱 要求的内容──说出两个你会多日自主运行额外施加的限制(Docker 之外)──

4. 阅读Beel et al. Sección 4 en Contenido sobre la brecha de calidad de presentación―: diseñar un evaluador extra, para capturar artículos que parecen muy buenos pero que experimentalmente tienen fallas―:

5. Para el agente de investigación 输出 propone un protocolo de revisión humana, que haga su expansión superior a  cada artículo del artículo son todos por el doctorado 阅读── señalar botellas,并围绕它设计──

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|---|---|---|
| AI Scientist v1 | “Sakana 的 templated research agent” | 将实验填入固定 scaffold |
| AI Scientist v2 | “无 template 的 research agent” | 带有 VLM 图表批评的 agentic tree search |
| Agentic tree search | “分支式 research agent” | 并行扩展多个实验计划；由内部 critic 剪枝 |
| Vision-language critique | “对图表进行 VLM 润色” | Multimodal model 读取图表并重写以提高清晰度 |
| Literature retrieval | “新颖性检查” | 搜索 prior work 以确认想法新颖性，并已被记录会发生错误标记 |
| Polish masking | “漂亮论文，破损研究” | 呈现质量超过实验质量；隐藏弱点 |
| Sandbox escape | “LLM 代码逃逸” | agent 执行的代码做了 loop designer 未预期的事情 |

## 延伸阅读

- [Yamada et al. (2025). The AI Scientist-v2](https://arxiv.org/abs/2504.08066) 论文──
- [Sakana blog on the Nature 2026 publication](https://sakana.ai/ai-scientist-nature/) 带有同行评价 背景的供应商总结──
- [Beel et al. (2025). Independent evaluation of The AI Scientist](https://arxiv.org/abs/2502.14297) Número de evaluación del Ministerio de Relaciones Exteriores.
- [Sakana AI Scientist v1 paper](https://arxiv.org/abs/2408.06292) 模板化前身──
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy)  sobre el marco más amplio de los agentes de investigación abiertos.
