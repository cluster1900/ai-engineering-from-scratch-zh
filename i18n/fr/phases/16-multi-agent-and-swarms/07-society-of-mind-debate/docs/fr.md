# Débat entre la société de l'esprit et plusieurs agents

> Minsky a prétendu en 1986 que l'intelligence est une société composée de spécialistes, qui sera redécouverte une fois par décennie. En 2023, Du et al. la transformeraient en un algorithme concret: plusieurs instances de LLM proposent des réponses, lisent les réponses, critiquent et se mettent à jour.**multiple agents**et **multiple rounds**Ils ont été récompensés par la participation de la société à un monologue monophonétique; par un échange multi-roundable; par un vote unique.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

##  problématique
L'auto-consistance, c'est-à-dire la plus faible coût de la logique que vous puissiez ajouter à un modèle, est une amélioration.

Le débat a brisé ce type de discussion et ne s'est pas basé sur un modèle, mais sur des données qui permettent aux agents de lire le raisonnement et de réviser la relation entre les exemples.

## 概念
### Du et al. 2023 算法

Le rapport de référence est le cas pour les produits de l'industrie de l'électricité.

1. Chacun des agents n'est à la recherche d'une réponse initiale.
2. Pour la ronde r = 2..R: Pour chaque agent  montrer les autres agents dans la ronde r-1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
3. R 轮后, à la réponse finale faire la majorité du vote.

论文在 MMLU、GSM8K、biographies、MATH 和 factualités benchmarks 上测试── Débat 持续优于 CoT 和 Self-Reflection──

### 两个独立旋

Comme dans un article de l'article:

- **Agent count alone**(1 tour, pour N 个结果做多数投票) sur la plupart des tâches dépasse un agent unique, mais entrera dans la période de la plateforme:
- **Round count alone**(1 个代理 见自己的先前推理) Il n'y a pratiquement pas d'aide, c'est le point faible de la réflexion.
- **Both together**L'échange multi-roundable entre plusieurs agents a entraîné une augmentation significative.

### Pourquoi ?

Œuvre de la Commission

1. **暴露于分歧。**Quand un agent voit la chaîne de raisonnement d'un autre agent et tire des conclusions différentes, il doit soit justifier, soit mettre à jour.
2. **相关错误减少。**Dans l'auto-consistance, tous les échantillons proviennent du même modèle, donc les erreurs sont liées, vous aurez une moyenne de réponse confiante mais erronée.

### Débat hétérogène

A-HMAD 和相关后续工作为不同代理 使用 *不同基模型*──Llama + Claude + GPT débat 会减少单文化崩(Lesson 26),因为一个模型家族的相关错误不会被其他模型家族共享────

缺点: faible modèle 参与辩论 时可能会把共识 拉向它的错误答案 ((见 Souvent nous devrions devenir fous ?, arXiv:2311.17371)

### NLSOM  129-agent 扩展

Zhuge et al. Mindstorms in Natural Language-Based Societies of Mind, arXiv:2305.17066) va étendre cette idée à 129 sociétés membres.

### Mode d'échec

- **Sycophancy cascade。**Tous les agents sont soumis à l'agent le plus confiant. Le débat se conclut en opinions contradictoires.
- **Topic drift。**Débat de plusieurs rounds 会偏离原始问题──缓解措施: chaque round réinsérer le problème──
- **Compute blowup。**N agents × R ronds = N·R suivants LLM appels, chaque appel dans le contexte de la croissance. Un débat de 5 agents, 5 ronds est de 25 appels, et le contexte continue de croître.


```figure
multi-agent-debate
```

## - Je le construis.
`code/main.py`Dans une question mathématique, on discute de 3 agents × 3 rounds, chacun d'eux découlant d'une réponse différente.

La démo montre deux effets clés:

- Un échange de roues permettra aux agents de se rapprocher de la vraie réponse.
- Les résultats de la deuxième ronde                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

运行:

```
python3 code/main.py
```

## Utilisez-le
`outputs/skill-debate-configurator.md`Pour le nouveau débat de configure des tâches: agents numéros, tours numéros, hétérogénéité, modèle et modèle mixte, attribution de rôle, symétrie et opposée.

## Je le livre.
Si vous voulez débattre en ligne:

- **将 rounds 上限设为 3。**Du et al.  montrent que les 3 roues ont capturé la majeure partie des avantages.
- **将 agents 上限设为 5。**≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 5 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10 ≈ 10
- **默认 heterogeneous。**池中 au moins deux modèles de base différents.
- **Adversarial slot。**Un agent est invité à ne pas être d'accord.
- **记录每一轮。**Les systèmes de débat de ronde intermédiaire sont incapables de débogage ou d'audit.

## 练习
1. 运行  référencement`code/main.py`, puis le comptage de ronde s'étale à 5, observez les rendements en diminution... jusqu'à quelle ronde de convergence supplémentaire s'arrête ?
2. 添加一个带有敌意作用的第四个代理: Toujours en désaccord avec la majorité actuelle.
3. 绘制(打印) Score de l'accord par tour(Stand majority answer 上的代理 比例) ⋅ Il arrive à 1.0 quand ?
4. 阅读 Du et al. Section 4 ablations。 utiliser ce code 复现 agents-only vs rounds-only vs both 结果。
5. 阅读 S'il faut aller en folie? (arXiv:2311.17371),并列出 周围轮结 之外的两个辩论变化,例如法官领导的辩论链,对立的

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Society of Mind | “Minsky 的想法” | Intelligence 是互动专家集合；1986 年的 framing 现在通过 LLM debate 被 operationalized。 |
| Multi-agent debate | “Agents 争论” | N 个 agents 提出答案、相互 critique、经过 R 轮 revise，然后 majority-vote。 |
| Consensus | “他们达成一致” | 不是 epistemic truth，只是 fraction-on-majority-answer。可能自信地错误。 |
| Rounds | “Exchange steps” | 一轮 = 每个 agent 读取其他 agents 并 update 一次。 |
| Heterogeneous debate | “混合 model families” | 使用不同 base models 来去相关 errors。 |
| Sycophancy cascade | “每个人都同意那个大声的人” | 一种 debate failure：agents 不管正确性如何，都顺从最自信的 agent。 |
| NLSOM | “129-agent society” | Natural-language society of mind；Zhuge et al. 的 scaled version。 |
| Correlated error | “同一个 model，同一个 bug” | self-consistency 饱和的原因；跨不同 views 的 debate 会去相关。 |

## 延伸阅读
- [Du et al. — 通过 Multiagent Debate 提升 Language Models 的事实性与推理能力](https://arxiv.org/abs/2305.14325) papier de référence,ICML 2024
- [Zhuge et al. — Mindstorms in Natural Language-Based Societies of Mind](https://arxiv.org/abs/2305.17066) 129-agent NLSOM
- [Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs](https://arxiv.org/abs/2311.17371) Variantes de débat de référence
- [Debate project page](https://composable-models.github.io/llm_debate/) Le code du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe du groupe des dé dé dé dé dé dé dé dé dé
