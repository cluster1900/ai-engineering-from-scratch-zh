# Débat multi-agents et collaboration

> Du et al. du CIML 2024,Société des esprits) fonctionnent N 个模型实例, ces exemples d'abord proposent des réponses indépendantes, puis se critiquent les uns les autres dans les R 轮中, afin de réaliser la réception────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 12（Workflow Patterns），Phase 14 · 05（Self-Refine and CRITIC）
**Time:** ~60 分钟

## Objectif de l'apprentissage
- ☐ Expliquer le protocole de débat: N 个 proposers、R 轮,并收到一个共享答案──
- Décrire pourquoi le débat peut augmenter la réalité, le respect des règles et le raisonnement.
- ☐ Expliquer une topologie rare: tous les débatteurs n'ont pas besoin de voir tous les autres débatteurs.
- Dans le scénario LLM 上 réaliser un débat stdlib, contenant plein-mesh 和 rares 变体; Mesurer Token 成本与精度──

##  problématique
L'auto-réfinition est un modèle de critique de soi, il existe une pensée de groupe 风险――CRITICES.

## 概念
### Société des esprits (Du et al., ICML 2024)

- N'exemple de modèle pour la même question de proposer des réponses indépendantes.
- Dans le R, chaque modèle lit les propositions des autres modèles et les critique.
- 模型根据批评 更新自己的答案──
- R 轮后, retour à la réception 后的答案──

Les expériences originales sont basées sur l'utilisation de N=3、R=2── dans les problèmes difficiles de la génération de la validité du mouvement des échecs, de la génération de la biographie, de plus d'agents et de plus de séries pour améliorer la précision.

Le modèle transversale 组合优于单模型辩论:ChatGPT + Bard 组合 > 任一单独模型。

### Topologie de la séparité

 Amélioration du débat multi-agents avec la topologie de la communication Sparse(arXiv:2406.11776,2024-2025) indique que le débat complet n'est pas toujours le meilleur.

 Influence:

- N = 5, R = 3 = 5 × 3 = 15 propositions, chacun d'eux a 4 pairs = 60 fois de critique.
- Star N = 5,R = 3 ((un centre + 4 个口) = 15 个建议,口,只读取中心 = 12 fois critique opciones。

### Quand le débat aide

- **Factuality。**N 个独立提案,cross-check 降低幻觉──
- **Rule-following。**En effet, un modèle échoue à la règle, un autre modèle le saisit.
- **Open-ended reasoning。**Les cadres seront progressivement rétrécis à la réponse exacte.

### Quand le débat fait mal

- **Latency-sensitive UX。**N × R 个串行轮次会产生你可能无法承受的延迟──
- **Cost-sensitive scale。**Chaque problème a besoin de N × R Token.
- **Simple factual lookups。**Une recherche sur les débats de cinq jeux.

### 2026 des instances pratiques

- **Anthropic orchestrator-workers**(第 12 课)  带 synthèse step 变体──
- **LangGraph supervisor**(第 13 课)  routeur central + agents spécialisés peuvent mettre en œuvre le débat en un seul nœud
- **OpenAI Agents SDK**(第 16 课)  agents 通过 handoff 来回进行反复批评──
- **Multi-agent evals** Pour le débat + l'optimisateur-évaluateur 配对, utilisé pour le signal d'évaluation 

### Cette façon est facile à trouver

- **Convergence collapse。**Tous les agents ont reçu la première erreur de réponse.
- **Hub failure。**Dans la topologie des étoiles, un mauvais hub contaminera tous les propriétaires.
- **Prompt homogenization。**Tous les agents utilisent le même prompt; ils produisent la même réponse.


```figure
debate-converge
```

## - Je le construis.
`code/main.py`实现了 stdlib débat:

- `Debater`Le programme de formation est un programme de formation de la classe.
- `FullMeshDebate`et `SparseDebate`Les coureurs.
- Un factuel, un fondé sur des règles, un raisonnement.
- Les mesures: réponse convergente, ronde à convergence, critique totale, options

运行:

```
python3 code/main.py
```

输出: précision et coût de chaque protocole; épargne sur 2/3 des questions pour une correspondance plus faible coût à la pleine maille.

## Utilisez-le
- **Anthropic orchestrator-workers**Il s'agit d'un débat simple entre deux ou trois travailleurs.
- **LangGraph**Il s'agit d'un débat multi-roundable.
- **Custom**Utilisé pour des garanties de précision de recherche ou spéciales.

## Je le livre.
`outputs/skill-debate.md`- construire un débat multi-agent, doté d'une topologie configurable,

## 练习
1.  réaliser un désaccord forcé  Règlement: dans la première ronde, chaque débatteur  doit émettre une proposition différente  mesurer son impact sur la vitesse de convergence
2. 添加信心重量集结:debatteurs 返回 (réponse, confiance);agrégateur 按信心 加权──¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
3. L'hétérogénéité améliore-t-elle la précision ?
4. Dans vos 3 questions, mesurez la masse complète et les jetons rares.
5. Lire le papier de la Société des esprits... Transporter votre jouet à N=5... R=3...

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Debate | “Multi-agent critique” | N 个 proposers，R 轮 cross-critique，并收敛 |
| Full mesh | “Everyone reads everyone” | 每个 debater 每轮读取每个 peer |
| Sparse topology | “Limited peer view” | Debaters 只读取 peers 的一个子集 |
| Hub-and-spoke | “Star topology” | 一个 central debater，N-1 个 spokes 只读取 hub |
| Convergence | “Agreement” | Debaters 收敛到一个共享答案 |
| Society of Minds | “Du et al. debate paper” | ICML 2024 multi-agent debate method |

## 延伸阅读
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) 经典 Débat multi-agent
- [Sparse Communication Topology (arXiv:2406.11776)](https://arxiv.org/abs/2406.11776) topologie rare 结果
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) orchestrateur-travailleurs  comme un débat 变体
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) Autoscritie de modèle unique à la méthode de traitement
