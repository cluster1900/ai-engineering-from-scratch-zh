# 面向 Agents' Consensus et Tolérance à la faute byzantine

> Les systèmes distribués classiques BFT ont rencontré des LLM aléatoires.**CP-WBFT**(arXiv:2511.10400) par enquête de confiance pour le droit de vote par année;**DecentLLMs**(arXiv:2507.14928)  adoption de la méthode sans leader, des propositions de travailleurs et de l'agrégation géométrique-médiane;**WBFT**(arXiv:2505.05103) Va être le vote pondéré avec la structure hiérarchique Clustering 结结,把节点分分为核心和边缘──来自 Can AI Agents Agree? (arXiv:2603.01213) 诚实实证实结果是:

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**前置要求：**Phase 16 · 07 (Société de l'esprit et débat), phase 16 · 13 (mémoire partagée)
**Time:** 约 75 分钟

##  problématique

Vous avez N'agents LLM, chacun de vous sortira une réponse. Ils ne sont pas d'accord. La majorité a choisi une réponse erronée, car deux agents ont le même modèle de base, les mêmes données de formation, les mêmes modes d'échec.

现在加入一个欺骗的代理:它故意撒谎――或加入一个伪善的代理:它同意最后发言的人―― Dans le classique BFT, il est supposé que les nœuds byzantins 占比为`f < n/3`, et de se comporter de manière arbitraire. La réalité de l'année 2026 est que les nœuds LLM, même en temps réel, sont également aléatoires, se transforment en modèles, se lient et se produisent mutuellement.

经典 BFT(PBFT, 1999)并没有错,但它不完整──它处理任意 bit-flipping──它不处理三个诚实代理 因共享训练数据而共享同一个幻觉──本课从 PBFT的基础开始,并叠加三种2025-2026年的适配──

## 概念
### C' est un bon coup de main .

Tolérance pratique aux fautes byzantines (Castro et Liskov, OSDI 1999)`f < n/3`个 Byzantine nodes──该协议有三个阶段(pre-prepare、prepare、commit) 和两个 primitives(signé messages、quorum certificates)──它在`n >= 3f + 1`个诚意或恶意节点之间 un accord relatif à une valeur unique.

Ces garanties sont très fortes, mais il y a les hypothèses suivantes:

1. **Independent faults。**Les Byzantins ne se sont pas mis en contact avec nous.
2. **Honest nodes 确实诚实。**La validité des résultats honnêtes n'est pas un problème; le protocole ne fait que favoriser les désaccords.
3. **问题存在 ground-truth answer。**Un consensus est toujours atteint sur les erreurs.

Les agents de la LLM                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

### 3 types d'attaques spécifiques à la LLM

**Byzantine lie。**Un agent a fourni une réponse intentionnellement erronée.`f < n/3`, BFT classique 能处理它──

**Sycophantic conformity。**Un agent, en lisant les réponses des autres avant le vote, et en se conformant à la dernière parole, ne fait pas de mal, mais est lié au plus fort de voix.

**Correlated-error monoculture。**Trois agents partagent un modèle de base. Ils hallucinent en sortant d'un même erreur. La plupart des gens sont des erreurs.

### Réponse de l'année 2025-2026

**CP-WBFT**(arXiv:2511.10400)  BFT pondéré par preuve de confiance。 chaque électeur  donne à sa réponse une enquête de confiance  auto-rapport probabilité, ou modèle de calibration séparée de prédiction)。 Les poids des votes 随着信心 缩放──报告称在完整图上 BFT改善为 +85.71%──Mitiation 目标:conformité psychofantique(agents conformes 往往对其主动给定的位置信心 较低)。

**DecentLLMs**Les agents ouvriers et les agents évaluateurs proposent des propositions, les résultats sont obtenus en moyenne géométrique des positions.`f < n/2`时具备强性──Mitification 目标:mention byzantine 和 correlations errors(médiane géométrique contre les écartés robuste,并拉向密集集集团,而不是 moyennement modélisé)。

**WBFT**(arXiv:2505.05103)  Pise BFT avec structure hiérarchique Clustering。Pouvres de vote De la qualité de la réponse 加上从历史学习到的信任分分配──将代理 聚类为核心和边缘;Core agents 必须先达成共识,Edge agents 跟随──Mitigation 目标:scalability(Core consensus 小而快)以及部分应对单文化(Core可按多样性 选择)。

### 实证:Les agents de l'IA peuvent-ils être d'accord ? (arXiv:2603.01213)

Ce document  Measure multiple frontier models                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

- Même sans adversaires, les agents de la LLM sur de nombreux points de référence, les taux de désaccord sur les questions scalaires dépassent également les 30%*.
- 单个采用欺骗人的代理 可将 混合代理共识 拉离诚的基线 40+百分点──
- Les taux de désaccords avec la diversité des modèles 相关; ensembles hétérogènes par rapport aux ensembles homogènes 分歧更多(好处:non corrélations), mais dérive également更慢(坏处:time-to-agreement 更长)。

结论:BFT 给你对齐输出的机制, mais cela ne vous dit pas si c'est vrai.

### 剥离到核心协议

Un facteur de BFT minimal pour les agents de LLM:

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

Le clusterement sémantique 步骤是LLM-specific's key change──两个答案 l'étude rapporte une amélioration de 4,2% 和 4.2%                                                                                                                                                                                                                                         

### Régularisation des seuils

`threshold`Paramètre décide quand accepter, quand réessayer, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, quand accepter, si ce que faire, si ce que faire, si ce que faire, si ce que faire, c'est ce que faire, c'est ce que c'est ce que c'est que c'est que c'est que c'est que c'est que c'est.`n=5-7`Les agents sont de 0,5-0,67; plus petit.`n`需要更高值──低于值时,escalate 给人类或另一个代理团队──

### Consensus 无法提供帮助的地方

- **Ambiguous questions。**Si le problème n'a pas de vérité fondamentale, le consensus est une opinion.
- **Compound questions。**Écrivez du code et expliquez-le  是两个答案──分别对每个答案投票──
- **Adversarial multi-round。**Si les agents peuvent observer les précédents tours et imiter le débat de 2023, ils commenceront à se convenir, peu importe la vérité.


```figure
swarm-consensus-wave
```

## - Je le construis.
`code/main.py`实现:

- `AgentVoter` 带有 (réponse, confiance) politique écrite
- `MajorityVote` 经典 pluralité。
- `CPWBFT` 带 semantique clustering  vote pondéré par la confiance
- `DecentLLMs` Dans les propositions marquées, faites une aggregation géométrique-médiane.
- `Scenario` Dans trois types d'attaques,

 déjà réalisés des attaques:

1. `byzantine`Un agent avec une grande confiance.
2. `sycophancy`Un agent repose la première réponse qu'il voit, et utilise la confiance correspondante.
3. `monoculture`Les trois agents ont une mauvaise réponse, une erreur correlative, une confiance en soi, etc.

运行:

```
python3 code/main.py
```

预期输出:一张 (attaque, agrégateur) -> réponse finale de la réponse,并高亮正确答案──pluralité dans le cas de la monoculture 中失败──CPWBFT confiance pondération 缓解 sycophancy──DecentLLMs de la géométrie-médiane dans la monoculture 少于总体一半时会拉向诚实集群──

## Utilisez-le
`outputs/skill-consensus-designer.md`Pour l'ensemble multi-agents  concevoir un protocole de consensus: méthode de regroupement, pondération, seuil, ainsi que politique d'escalade des tours de sous-seil

## Je le livre.
Avant de publier un mécanisme de consensus:

- **至少用上面三种 patterns 做 attack-test。**Votre protocole devrait être un échec prévisible, et non un échec silencieux.
- **记录每个 minority cluster** et de leur provenance: les groupes minoritaires sont un système d'alerte précoce des erreurs corrélatives.
- **强制 bounded rounds。**Ne continuez pas à débattre jusqu'à ce que vous soyez d'accord, cela récompensera la sycophancy.
- **将 agreement 与 correctness 分离。**Les résultats du consensus sont donnés au vérificateur; le vérificateur est indépendant de l'ensemble.
- **监控 agreement rate。**Une hausse rapide signifie un biais de conformité; une baisse rapide signifie une dérive du modèle.

## 练习
1. 运行  référencement`code/main.py` Confirmer la pluralité dans l'attaque de la monoculture, mais lorsque la confiance en la monoculture est inférieure à 0,7 时 CPWBFT 能部分缓解──
2. 添加第四种攻击模式:**silent abstention**, un agent  refuse de répondre I don't know)。 chaque agrégateur 应如何处理弃权?实现你的选择。
3. Le cluster sémantique va être transformé en intégration-similarité de chaîne (utiliser un modèle d'intégration libre)
4. 阅读 CP-WBFT (arXiv:2511.10400)  réaliser l'étalonnage de la sonde de confiance 步骤(un modèle d'étalonnage unique 检查每个代理自报的信心)  Mesurer le gain de précision du scénario de monoculture 
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
- [CP-WBFT — Confidence-Probe Weighted BFT](https://arxiv.org/abs/2511.10400) 按信任  faire peser les voix
- [DecentLLMs — leaderless multi-agent consensus](https://arxiv.org/abs/2507.14928) Aggrégation géométrique-médiane
- [WBFT — Weighted BFT with Hierarchical Structure Clustering](https://arxiv.org/abs/2505.05103) Utilisé pour la séparation de la latence limitée
- [Can AI Agents Agree?](https://arxiv.org/abs/2603.01213) fragilité de l'accord de taille et attaque de personnalité trompeuse
