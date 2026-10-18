# Capstone 05  Autónomo investigador agente 类)

> El diseño de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión

**Type:** Capstone
**Languages:** Python（agent + sandbox）、LaTeX（output）
**Prerequisites:** Phase 2（ML）、Phase 3（Deep Learning）、Phase 7（transformers）、Phase 10（LLMs from scratch）、Phase 14（agents）、Phase 15（autonomous）、Phase 16（multi-agent）、Phase 18（safety）
**Phases exercised:**P0 · P2 · P3 · P7 · P10 · P14 · P15 · P16 · P18
**Time:** 40 小时

##  problemas
Agente de investigación independiente en 2026 pasó una puerta. El científico de IA de Sakana v2 publicado en Nature, generó un artículo que pasó por la revisión de pares del taller ShinkaEvolve (ICLR 2026) extenderá esta dirección hasta la hipótesis de evolución. El Laboratorio de Agentes de AMD publicó un rastro replicable. Estos agentes no son sorprendentes.

Usted pasará en una idea de semilla de un campo estrecho para implementar un agente como este para aprender este ciclo (por ejemplo, en el Transformer de 100M Parámetros en el que se hace una ablación de la escasez de atención)  El valor no es en el primer funcionamiento en el descubrimiento de algo nuevo  El valor está en la infraestructura: busqueda de árboles  experimento sandbox  escritor-revisor loop  informe del equipo rojo  El equipo de Sakana registró el fracaso de escape de la caja de arena; su agente  debe pasar por el mismo equipo rojo 

## 概念
Este agente es una mejor primera búsqueda de árbol. Se ejecuta cada niño en una nueva caja de arena con recursos duros. El resultado es contrarrestado a la función de puntuación, según la novedad × calidad × presupuesto restante)

El escritor es Multimodal de. Produce un borrador de LaTeX, la redacción, la figura de reproducción, y envía el PDF de la versión posterior a la reproducción de Claude Opus 4.7, en modo de visión, para el diseño crítico, la figura legible, así como la alineación de la evidencia de la afirmación.

La seguridad es una estructura de carga. Cada experimento está en la ausencia de salida de red, con un reloj de pared limitado, con un límite de recursos fijos en E2B o Daytona Sandbox.

## 架构
```
seed idea + domain
      |
      v
  literature search (Semantic Scholar + OpenAlex + FAISS cache)
      |
      v
  LangGraph plan-execute-verify tree
      |
      v
  +--- expand node ----+      per-node sandbox
  |                    |      (E2B / Daytona)
  v                    v      resource caps
  child_1           child_k   no network egress
  |                    |      deterministic seeds
  v                    v
  run experiment       run experiment
  |                    |
  v                    v
  score nodes by (novelty, quality, budget)
      |
      v
  best branch -> LaTeX writer
      |
      v
  compile + vision critique (Opus 4.7 vision)
      |
      v
  reviewer ensemble (5 LLM judges, NeurIPS rubric)
      |
      v
  paper.pdf + review.md + trace.json
```

## 技术
- Orquestación: con puntos de control y puerta de aprobación humana
- Busca de árbol: basado en el nodo de experimento de la autodeterminación mejor-primero(provino de Sakana v2 de AB-MCTS-estilo)
- Sandbox: cada experimento un E2B, Docker-in-Docker fallback; a través de grupos 施加资源 cap
- Literatura: API de gráfico de erudito semántico + OpenAlex + 本地 FAISS caché abstracto
- Escrito: plantilla LaTeX + Claude Opus 4.7 (modo de visión) para la crítica de figuras y diseño
- Revisor: 5 个评审的组合(Opus 4.7、GPT-5.4、Gemini 3 Pro、DeepSeek R1、Qwen3-Max),带权重集
- Marco de experimento: para el experimento físico PyTorch 2.5, W&B para el registro
- Observabilidad: Langfuse utiliza para rastrear agentes, por artículo presupuesto de 30 dólares


```figure
ce-experiment-tree
```

## Construirlo
1. **Seed and domain scoping.**选取一个种子想法 (por ejemplo, investigar patrones de esparcia en los mapas de atención de los transformadores sub-1B)  definir el espacio de búsqueda:modelo, conjunto de datos, presupuesto de cálculo.

2. **Literature pass.**查询 Semantic Scholar + OpenAlex 中最相关且引用最多的 50 篇论文;本地缓存摘要;生成 1 页域名消化──

3. **Tree scaffolding.**Usando la hipótesis de semilla inicial roots.`expand(node) -> children`, con una pequeña propuesta de cambio , cada niño un cambio de configuración)`score(node)`实现为加权的新品 × calidad × presupuesto 项──

4. **Sandbox wrapping.**Cada experimento funciona .`docker run --network=none --memory=8g --cpus=2 --pids-limit=256 --read-only`(o igual precio de la política E2B) ⋅ semillas 写入 sandbox;输出以只读的方式 方式 装备回外部──

5. **Plan-execute-verify loop.** `plan`Proponer a los niños.`execute`运行 sandbox, capture log 和 métric──`verify`¿Se ha reducido la pérdida de datos? ¿Se ha reducido la pérdida de datos? ¿Se ha producido una disminución de datos?

6. **Writer.**Después de terminar el presupuesto, seleccionar el mejor分支── con la figura de color de la matplotlib 染── a través de Claude Opus 4.7 生成 LaTeX draft,并把 rango de rastro 放入文脈──编译──把编译后的 PDF 送回 Opus 4.7 vision 进行批评──代──

7. **Reviewer ensemble.**五个评委 根据 NeurIPS 风格 rubrica,对草案的(novedad、rigor、claridad、reproducibilidad、impacto)打分──如果平均 <4.0/5,则带批评 返回 writer──3次重写 后硬停止──

8. **Red team.**构建或集成一组针对沙箱的对抗任务:fork bomb、网络脱 filtration attempt、filesystem escape、LLM 写出的 shell metacharacter──确认全部被阻止──写出发现──

9. **Reproducibility.**Cada artículo tiene un rastro de búsqueda de árboles JSON, semilla, W&B, enlace de ejecución, configuración de la caja de arena, así como una recopilación de la lectura de la misma.

## Usalo
```
$ ai-scientist run --seed "attention sparsity in sub-1B transformers" --budget 30
[lit]    50 papers, digest in 12s
[tree]   expanded 8 nodes, budget 12/30
[exec]   node #3 sparsity=top-8, loss=2.83 (best so far)
[exec]   node #6 sparsity=top-4, loss=3.12 (worse)
[exec]   ...
[tree]   chose branch rooted at node #3 (novelty 0.62, quality 0.81)
[write]  LaTeX draft v1 complete
[vision] critique: figure 2 legend too small, claim-evidence ok
[write]  draft v2 after 3 edits
[review] mean 4.2/5 (novelty 3.9, rigor 4.3, clarity 4.1, repro 4.5, impact 4.2)
[done]   paper.pdf + review.md + trace.json     $28.40 spent
```

##  entregarlo
`outputs/skill-ai-scientist.md`Es un producto de entrega. Se le da una idea de semilla + un dominio + un presupuesto de $ 30, se ejecuta todo el pipeline, se produce un artículo de revisión, así como un paquete de reproducibilidad.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Paper quality | 根据已发表 workshop paper 做 blind rubric review |
| 20 | Experimental rigor | Baseline、seed、ablation；每个 claim 都由 results table 中的一个 cell 支撑 |
| 20 | Cost and compute discipline | 强制执行 $30/paper 上限，并由 Langfuse trace |
| 20 | Safety | Sandbox red team 通过；network policy 和 kill-switch 已验证 |
| 15 | Reproducibility | 使用相同 seed 一条命令 rerun 可复现 paper |
| **100** | | |

##  ejercicios
1. Utilice el mismo dominio entre tres ideas de semillas diferentes 运行管eline―Compare cuáles son las partes de la búsqueda de árboles 识别重复浪费的计算―

2. En la ejecución del experimento, para estimar más de 5 dólares en un nodo, añade un portal humano en el circuito.

3. Se evaluará el conjunto de revisores en un solo juez.

4. 引入 red team test:agent 写出尝试 `curl`Codificación del sitio web`--network=none`La política de bloqueo.

5. Comparar su búsqueda de árboles con un baseline aleatorio plano comparando el mismo presupuesto, sin estrategia de expansión)

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Tree search | “AB-MCTS-style expansion” | 用 novelty×quality×budget score 在 experiment node 上进行 best-first exploration |
| Sandbox | “Experiment isolation” | 无 network、CPU/memory 有界、固定 seed、read-only input 的 container |
| Vision critique | “Render-then-read” | 将 paper 编译为 PDF，把 PDF 送回 VLM，用于 layout 和 claim-evidence critique |
| Reviewer ensemble | “Automated peer review” | 多个 LLM judge 使用 NeurIPS rubric 为 paper 打分；weighted aggregate gate 控制 pipeline |
| Novelty score | “Is this new?” | 对接近 50-paper literature cache 的内容施加惩罚的 heuristic |
| Cost ceiling | “$ budget” | 每篇 paper 的总花费硬上限；Langfuse counter + pre-run estimate |
| Red team | “Sandbox-escape audit” | 如果 policy 错误就会逃出 sandbox 的 adversarial task |

## 延伸阅读
- [Sakana AI-Scientist-v2 repository](https://github.com/SakanaAI/AI-Scientist-v2) 参考 agente de investigación de producción
- [Sakana AI-Scientist-v1 paper (arXiv:2408.06292)](https://arxiv.org/abs/2408.06292) Método original
- [ShinkaEvolve (Sakana ICLR 2026)](https://sakana.ai) evolución 扩展
- [Agent Laboratory (AMD)](https://github.com/SamuelSchmidgall/AgentLaboratory) marco de laboratorio de investigación multifunción
- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) 参考 capa de orquestación
- [Semantic Scholar Graph API](https://api.semanticscholar.org/) Buscar literatura
- [E2B sandboxes](https://e2b.dev)  Referencia al aislamiento experimental
- [NeurIPS reviewer guidelines](https://neurips.cc/Conferences/2026/Reviewer-Guidelines) conjunto de críticos 编码的 rúbrica
