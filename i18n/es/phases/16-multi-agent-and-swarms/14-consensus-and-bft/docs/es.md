# 面向 Agentes de consenso y tolerancia por la falta bizantina

>  clásico sistemas distribuidos BFT encontró LLM de carácter arbitrario.**CP-WBFT**(arXiv:2511.10400)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     **DecentLLMs**(arXiv:2507.14928)  adopción de propuestas de trabajadores y de agregación geométrica-mediana;**WBFT**(arXiv:2505.05103) Se pondrá el voto ponderado con la estructura jerárquica Clustering 结结,把节点分分为核心和边缘──来自 ¿Pueden los agentes de IA estar de acuerdo? (arXiv:2603.01213) 诚实实证实结果是: incluso en el acuerdo de escala, hoy también es muy frágil, un agente engañoso en el que puede destruir la mezcla de agentes──BFT es necesario pero no suficiente──本课构建一个最小的BFT协议,注入三种特种代理攻击(拜占庭谎言、精神病的合规、相关错误单态文化),并衡量每种共识 如何应对──

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**前置要求：**Fase 16 · 07 (Sociedad de la mente y el debate), Fase 16 · 13 (memoria compartida)
**Time:** 约 75 分钟

##  problemas

Usted tiene N 个 LLM agentes, cada uno de ellos se produce una respuesta. Su opinión no coincide. La mayoría de los votos han elegido una respuesta errónea, porque dos agentes existen correlaciones. El mismo modelo básico, los mismos datos de entrenamiento, los mismos modos de fracaso.

Ahora se une a un agente engañoso: it故意撒谎──或 se une a un agente sicófante: it agre agre agrees última发言的人── en el clásico BFT,假设是拜占庭节点占比为`f < n/3`, y comportarse arbitrariamente. La realidad del año 2026 es que los nodos LLM incluso en la verdad también son casuales, se interrelacionan entre modelos y se influyen entre sí.

经典 BFT(PBFT, 1999)并没有错,但它不完整──它处理任意 bit-flipping──它不处理三个诚实代理 因共享训练数据而共享同一个幻觉──本课从PBFT的基础开始,并叠加三种2025-2026年的适配──

## 概念
### 经典 BFT 给你什么

Práctica tolerancia a la falta bizantina (Castro y Liskov, OSDI 1999)`f < n/3`个 Bizantino nodos. 个协议有三个阶段 (pre-prepare,prepare,commit) 和两个 primitivos (signat messages,quorum certificates) ⋅`n >= 3f + 1`个诚意或恶意节点之间, se ha llegado a un acuerdo sobre un valor único.

Estas garantías son muy fuertes, pero hay las siguientes hipótesis:

1. **Independent faults。**Los bizantinos no se juntan.
2. **Honest nodes 确实诚实。**La verdad de los resultados honestos no es un problema; el protocolo sólo se limita a los desacuerdos.
3. **问题存在 ground-truth answer。**El consenso sobre el error de hecho se alcanzó, todavía es consenso.

Los agentes de LLM  violaron estos tres puntos ∙ Los agentes de dos modelos de base de la misma operación ∙ Compartirán fallas ∙ Un  sinceridad                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

### Tres tipos de ataques específicos de LLM

**Byzantine lie。**Un agente 输出故意错误的答案──如果`f < n/3`, clásico BFT 能处理它──

**Sycophantic conformity。**Un agente en el voto previo a leer la respuesta de otros, y mantenerse en consonancia con el último pronunciamiento de la persona. Esto no es malicioso, pero se relacionará con la voz más alta.

**Correlated-error monoculture。**Tres agentes compartieron un modelo básico. Ellos alucinaban. Salieron con un mismo error. La mayoría de los agentes no lo hicieron.

### Respuesta de la temporada 2025-2026

**CP-WBFT**(arXiv:2511.10400)  BFT ponderado por prueba de confianza。 cada votante dá su respuesta 附加一查询信心(自报概率,或单独校准模型的预测)  Votes weights 随着信心 缩放──报告称在完整图上 BFT改善为 +85.71%──Mitición 目标:sycophantic conformity(conforming agents 往往对其主动给出的位置信心 较低) 

**DecentLLMs**(arXiv:2507.14928)  无领导── trabajadores agentes 并行提出提案, evaluadores agentes 为提案 打分,最终答案是得点位置的几何中介──当`f < n/2`时具备强性──Mitigación 目标:Byzantine lie 和 correlacion errors(mediana geométrica para los valores fuera de línea robusta,并拉向密集集集,而不是 modelo-biased average)。

**WBFT**(arXiv:2505.05103)  Peso BFT con estructura jerárquica Clustering。 Peso de voto De la calidad de respuesta 加上从历史学习到的信任分分配──将代理 聚类为核心和边缘;Core agents 必须先达成共识,Edge agents 跟随──Mitigación 目标:scalability(Core consensus 小而快)以及部分应对单文化(Core可按多样性 选择)。

### 实证:¿Pueden los agentes de IA estar de acuerdo?

Este artículo  Measurando múltiples modelos fronterizos                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

- Incluso sin adversarios, los agentes de LLM en muchos puntos de referencia, las tasas de desacuerdo sobre las cuestiones escalares también superan el 30%.
- 单个采用欺骗人的代理 可将 混合代理共识 拉离诚的基线 40+百分点──
- Taxas de desacuerdo y diversidad de modelos 相关; conjuntos heterogéneos que conjuntos homogéneos 分歧更多(好处:无关错误),但漂移也更慢(坏处:时间-to-agree 更长) 』

结论:BFT 给你对齐输出的机制, pero no te dice si se trata de una verificación correcta.

### 剥离到核心协议 (procólogo de separación del núcleo)

Una cara hacia los agentes de LLM de la ronda BFT mínima:

```
1. task arrives; each agent i produces answer a_i
2. each agent attaches confidence probe c_i in [0, 1]
3. aggregator collects (a_i, c_i) from all n agents
4. aggregator groups by semantic cluster (equivalent answers)
5. aggregator computes weight for each cluster C:
     w(C) = sum_{i in C} c_i
6. winner = cluster with max weight, if max > threshold * sum(c_i)
   else: retry or escalate
7. minority clusters logged with provenance for post-hoc audit
```

Clustering semántico 步骤是LLM-specific's key change──两个答案l estudio informa un aumento del 4,2% 和 4.2%                                                                                                                                                                                                                                            

### El ajuste del umbral

`threshold`Parámetro decide cuándo aceptar ∞ cuándo volver a intentar ∞ ∞ ∞: Tú aceptaras la mayoría de las cosas ∞: Tú nunca aceptaras nada ∞:`n=5-7`Los agentes son de 0,5-0,67; más pequeños.`n`需要更高值──低于值时,escalate 给人类或另一个代理团队──

### Consenso 无法提供帮助的地方

- **Ambiguous questions。**Si el problema no tiene verdad, el consenso es una opinión.
- **Compound questions。**Escriba un código y explique esto.
- **Adversarial multi-round。**Si los agentes pueden observar las rondas anteriores y imitar el debate de 2023, comenzarán a estar de acuerdo entre sí, sin importar la verdad.


```figure
swarm-consensus-wave
```

## Construirlo
`code/main.py` realización:

- `AgentVoter` 带有 (respuesta, confianza) de la política guionada.
- `MajorityVote` 经典 pluralidad。
- `CPWBFT` 带 semántico de agrupamiento de votos ponderados por confianza。
- `DecentLLMs` En las propuestas anotadas 上 hacer agregación geométrica-mediana。
- `Scenario` 在三种攻击模式 下运行每个集集器──

已实现的攻击模式:

1. `byzantine`Un agente con mucha confianza.
2. `sycophancy`Un agente repite la primera respuesta que ve, y usa la confianza correspondiente.
3. `monoculture`Tres agentes compartieron una respuesta equivocada, un error correlacionado, confianza en sí mismos, etc.

运行:

```
python3 code/main.py
```

预期输出:一张 (ataque, agregador) -> respuesta final de la muestra,并高亮正确答案──Pluralidad en caso de monocultura en el caso de fracaso──CPWBFT de la confianza ponderación 缓解 sycophancy──DecentLLMs de la mediana geométrica en monocultura 少于总体一半时会拉向诚实集群──

## Usalo
`outputs/skill-consensus-designer.md`Por ejemplo, el programa de acción de la Comisión de Asuntos Exteriores (CAP) se ha desarrollado en el marco de la política de escalación de los rounds de sub-terreno.

##  entregarlo
Antes de publicar cualquier mecanismo de consenso:

- **至少用上面三种 patterns 做 attack-test。**Tu protocolo debería ser un fracaso predecible, no un fracaso silencioso.
- **记录每个 minority cluster** su procedencia: Clusters minoritaria es un sistema de alerta temprana de errores correlacionados.
- **强制 bounded rounds。**No continúes el debate hasta que se acuerde, esto recompensará la cícera.
- **将 agreement 与 correctness 分离。**Resultados de consenso 交给verifier;verifier 独立于组合──
- **监控 agreement rate。**El aumento brusco significa un sesgo de conformidad; la disminución brusca significa una deriva del modelo.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Confirmar la pluralidad en el ataque de la monocultura 下失败, pero cuando la confianza en la monocultura 低于0.7 时 CPWBFT 能部分缓解──
2. Añade el cuarto patrón de ataque:**silent abstention**, un agente  rechazar responder No sé )。 Cada agregador 应如何处理弃权?实现你的选择。
3. Clustering semántico de cadena canonización 换成嵌入式-similarity (¿utilizar cualquier modelo de incorporación de código abierto) ‧ ataque de psicofáncia 会发生什么变化?
4. 阅读CP-WBFT (arXiv:2511.10400)  lograr la calibración de la sonda de confianza 步骤(un modelo de calibración independiente 检查每个代理自报的信心)  Medir el aumento de precisión del escenario de monocultura 
5. ¿Pueden los agentes de IA estar de acuerdo? (arXiv:2603.01213)。 Representa un experimento simplificado de acuerdo escalare: tres agentes、una pregunta escalare、un mensaje de la persona engañosa―CPWBFT o DecentLLMs 能抓住它吗?

## 关键术语: "El hombre es un hombre"
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| BFT | “Byzantine fault tolerance” | Castro-Liskov 1999 protocol，用于在 `f < n/3` arbitrary faults 下达成 consensus。 |
| Byzantine | “任何坏行为” | 一个可以撒谎、丢弃 messages、静默失败的节点，除了安全 crash 外什么都可能做。 |
| Confidence probe | “你有多确定？” | 附加到 vote 上的自报或 calibrator-predicted probability。 |
| Semantic clustering | “同一答案，不同表述” | 在 counting votes 之前对等价 answers 分组。 |
| Geometric median | “Robust center” | 最小化到 sample points 距离之和的点。与 mean 不同，它对 outliers robust。 |
| Monoculture | “相同 model，相同 failures” | agents 共享 training data 或 base model 时产生的 correlated errors。 |
| Sycophantic conformity | “同意最大声的声音” | agent 的 vote 偏向最先/最大声发言的人。 |
| Core/Edge | “Hierarchical BFT” | WBFT 拆分：小规模 Core 先 consensus，Edge nodes 跟随。限制 latency。 |

## 延伸阅读
- [Castro & Liskov — Practical Byzantine Fault Tolerance (OSDI 1999)](https://pmg.csail.mit.edu/papers/osdi99.pdf) 基础
- [CP-WBFT — Confidence-Probe Weighted BFT](https://arxiv.org/abs/2511.10400) 按信任  llevar a cabo la ponderación de los votos
- [DecentLLMs — leaderless multi-agent consensus](https://arxiv.org/abs/2507.14928) Agregación geométrica-mediana
- [WBFT — Weighted BFT with Hierarchical Structure Clustering](https://arxiv.org/abs/2505.05103) Usando la división de núcleo/ borde de la latencia limitada
- [Can AI Agents Agree?](https://arxiv.org/abs/2603.01213) Fragilidad de acuerdo escalare y ataque de persona engañosa
