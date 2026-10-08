# 面向 Agentes' Consenso e Tolerança Bizantina

> Os sistemas distribuídos clássicos BFT encontraram LLMs de natureza aleatória.**CP-WBFT**(arXiv:2511.10400)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     **DecentLLMs**(arXiv:2507.14928) 采用无领导方式,并行工人提案与几何-median aggregation;**WBFT**(arXiv:2505.05103) Vai votar ponderado Com a Estrutura Hierárquica Clustering 结结,把节点分分为核心和边缘── 来源: Can AI Agents Agree? (arXiv:2603.01213) 诚实实证实结果是:即使是标量协议,今天也很脆弱,一个欺骗的代理就能破坏混合物.BFT不需要但不充分.本课构建一个最小的BFT协议,注入三种特种代理攻击(Byzantine lie、精神病学的合致、相关错误的单子文化),并衡每种共识 如何应对──

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**前置要求：**Fase 16 · 07 (Sociedade da Mente e Debate), Fase 16 · 13 (Memória Compartilhada)
**Time:** 约 75 分钟

## 问题

Você tem N 个 LLM agentes, cada um deles vai surgir uma resposta. Eles não concordam. A maioria dos votos escolheu uma resposta errada, porque dois agentes existem correlações.

Agora, junte-se a um agente enganador:`f < n/3`, e comportar-se arbitrariamente. A realidade de 2026 é que os nós LLM, mesmo que sinceramente, também são casuais, vão transcorrendo modelos, relacionados, e se afetam mutuamente.

经典 BFT(PBFT, 1999)并没有错,但它不完整──它处理任意 bit-flipping──它不处理三个诚实代理 因共享训练数据而共享同一个幻觉──本课从PBFT的基础开始,并叠加三种2025-2026年的适配──

## 概念
### O que é que eu te digo ?

Tolerância prática às falhas bizantinas (Castro e Liskov, OSDI 1999) `f < n/3`个 Bizantino nodes──该协议有三个阶段(pre-prepare、prepare、commit) 和两个原始的(signat messages、quorum certificates)──它在`n >= 3f + 1`个诚意或恶意节点之间达成单个价值协议――

Estas garantias são muito fortes, mas há as seguintes hipóteses:

1. **Independent faults。**Os bizantinos não se juntam.
2. **Honest nodes 确实诚实。**A verdade dos resultados honestos não é um problema; o protocolo é apenas um desacordo.
3. **问题存在 ground-truth answer。**O consenso sobre os erros é ainda um consenso.

Os agentes da LLM  violaram estes três pontos ∙ Os agentes dos dois modelos baseados no mesmo modelo de funcionamento ∙ Compartilham falhas ∙ Um LLM  sinceridade                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

### 3 tipos de ataques específicos do LLM

**Byzantine lie。**Um agente 输出故意错误的答案―― se `f < n/3`, Classic BFT 能处理它──

**Sycophantic conformity。**Um agente, antes de votar, lê as respostas de outras pessoas e mantém a concordância com quem diz a última palavra. Não é mal intencionado, mas está relacionado com a maior voz.

**Correlated-error monoculture。**Três agentes compartilham um modelo básico. Eles alucinam.

### Reacção de 2025-2026

**CP-WBFT**(arXiv:2511.10400)  Confiança-Probada Pesada BFT── Cada eleitor  dá a sua resposta 附加一信心探測(自报概率,或单独校准模型的预测)──Votação pós 随着信心 缩放──报告称在完整图上 BFT改善为 +85.71%──Mitificação 目标:sycophantic conformity(conforming agents 往往对其主动给出的位置信心 较低)──

**DecentLLMs**(arXiv:2507.14928)  无领导── Trabalhadores agentes 并行提出提案, avaliadores agentes 为提案 打分,最终答案是得点位置的几何中介──当`f < n/2`时具备强性──Mitigação 目标:mentiras bizantinas 和 correlacionadas erros(mediana geométrica para os outliers robusta,并拉向密集集集,而不是模型偏差平均)。

**WBFT**(arXiv:2505.05103)  BFT ponderado com Estrutura Hierárquica Clustering。 Pesos de voto De resposta Qualidade 加上从历史学习到的信任分分配──将代理 聚类为核心和边缘;Core agents 必须先达成共识,Edge agents 跟随──Mitigação 目标:scalability(Core consensus 小而快)以及部分应对单元文化(Core可按多样性 选择)。

### 实证:Os agentes da IA podem concordar? (arXiv:2603.01213)

Este artigo  Measure multiple frontier models                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

- Mesmo sem adversários, os agentes da LLM, em muitos pontos de referência, também superam 30% das taxas de desacordo sobre questões escalares.
- 单个采用欺骗人的代理 可将 混合代理共识 拉离诚的基线 40+百分点──
- Taxas de desacordo com a diversidade de modelos 相关; conjuntos heterogêneos em comparação com conjuntos homogêneos 分歧更多(好处:不相关错误),但漂移也更慢(坏处:时间-to-agree 更长) 』

结论:BFT 给你对齐输出的机制, mas não diz que você对齐后输出是否正确──要结合验证 (Fase 16 · 08 especialização de papel) 多样性 (Fase 16 · 15 variantes de debate) 及评价者 (Evaluator) Fase 16 · 24 benchmarks) 

### 剥离到核心协议

Uma fase mínima de BFT para agentes LLM:

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

Clustering semântico 步骤是LLM-specific 关键变化──两个答案 研究报告4.2% 和4.2%改善 属于同一集群──简单的字符串等级检查 会漏掉这一点──在生产中,使用便宜的嵌入模型或显然加нони化──

### Apontação do limiar

`threshold`Parâmetro decide quando aceitar, quando tentar novamente, quando aceitar a maioria das coisas.`n=5-7`Os agentes são 0,5-0,67; mais pequenos.`n`需要更高值──低于值时,escalate 给人类或另一个代理团队──

### Consenso 无法提供帮助

- **Ambiguous questions。**Se o problema não tem verdade, o consenso é uma opinião.
- **Compound questions。**Escreva o código e explica-o.
- **Adversarial multi-round。**Se os agentes 能 observar as rodadas anteriores e imitar o debate de 2023, eles começarão a concordar uns com os outros, não importa a verdade.


```figure
swarm-consensus-wave
```

## Construí-lo
`code/main.py`实现:

- `AgentVoter` 带有 (resposta, confiança) política guionada
- `MajorityVote` 经典 pluralidade。
- `CPWBFT` 带 semântico clustering 
- `DecentLLMs` Em propostas pontuais 上 fazer agregação geométrica-média
- `Scenario` 在三种攻击模式 下运行每个集集器──

已实现的攻击模式:

1. `byzantine`Um agente com alta confiança.
2. `sycophancy`Um agente replica a primeira resposta que vê, e usa a confiança correspondente.
3. `monoculture`Três agentes: 共享一个错误答案,confiança, etc.

运行:

```
python3 code/main.py
```

预期输出:一张 (ataque, agregador) -> resposta final de表,并高亮正确答案──Pluralidade em caso de monocultura 中失败──CPWBFT de confiança ponderação 缓解 sycophancy──Decent LLMs de geometria-média em monocultura 少于总体一半时会拉向诚实集群──

## Use-o
`outputs/skill-consensus-designer.md`Para o conjunto de agentes múltiplos design de protocolo de consenso:metodo de agrupamento, ponderação, limiar e política de escalada de rodadas de sub limiar

## Entrega-o
Antes de publicar qualquer mecanismo de consenso:

- **至少用上面三种 patterns 做 attack-test。**O seu protocolo deve ser previsível, não silencioso.
- **记录每个 minority cluster** e sua proveniência: Cluster de minorias é um sistema de alerta precoce de erros correlacionados.
- **强制 bounded rounds。**Não continuem a debater até chegarem a um acordo, isso vai recompensar a cego-de-cabeça.
- **将 agreement 与 correctness 分离。**A saída de consenso 交给verifier;verifier 独立于组──
- **监控 agreement rate。**A subida acentuada significa preconceito de conformidade; a queda acentuada significa deriva do modelo.

## 练习
1. 运行 `code/main.py` Confirmar a pluralidade no ataque da monocultura 下 fracassar, mas quando a confiança da monocultura 低于0.7 时 CPWBFT 能部分缓解──
2. - Adicione o quarto padrão de ataque:**silent abstention**, um agente  rejeitar responder  Não sei )  Toda agregação 应如何处理 abstenções?
3. Clustering semântico de cadeia canonização 换成嵌入式 (embedding-similarity) ⋅ Usar qualquer modelo de incorporação de código aberto (embedding model) ⋅ ataque de psicofância 会发生什么变化?
4. 阅读 CP-WBFT (arXiv:2511.10400)  Realizar calibração de sonda de confiança 步骤((um modelo de calibração individual 检查每个代理自报的信心)  Medir o aumento de precisão do cenário de monocultura 
5. 阅读 Can AI Agents Agree? (arXiv:2603.01213)。复现一个简化规模协议实验:三个代理、一个规模问题、欺骗性人物提示──CPWBFT或DecentLLMs 能抓住它吗?

## 关键术语
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
- [CP-WBFT — Confidence-Probe Weighted BFT](https://arxiv.org/abs/2511.10400) 按信任  proceder à ponderação dos votos
- [DecentLLMs — leaderless multi-agent consensus](https://arxiv.org/abs/2507.14928) Agregação geométrica-mediana
- [WBFT — Weighted BFT with Hierarchical Structure Clustering](https://arxiv.org/abs/2505.05103) Usando a separação Core/Edge da latência limitada
- [Can AI Agents Agree?](https://arxiv.org/abs/2603.01213) Fragilidade do acordo escalar e ataque de pessoa enganosa
