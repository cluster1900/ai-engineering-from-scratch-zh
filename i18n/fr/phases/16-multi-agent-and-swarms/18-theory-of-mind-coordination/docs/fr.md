# La théorie de l'esprit et la coordination de l'émergence

> Li et coll. (arXiv:2310.10701) 表明,合作型文本游戏中的 LLM agents 会表现出**涌现式高阶 Theory of Mind**(ToM)                                                                                                                                                                                                                                                             **只有**Les conditions de coordination ne sont pas gratuites. Il s'agit de réaliser un agent minimal conscient de la gestion de la gestion de la gestion, qui, en cas de nécessité, peut mener une mission de coopération et, selon le protocole Riedl 2025, mesurer les différences de coordination.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Phase 16 · 07 (Société de l'esprit et du débat), phase 16 · 17 (Agent générateur)
**Time:** ~75 minutes

##  problématique

Les agents se divisent, se précipitent, évitent de se répéter.

Les résultats de l'enquête 2025 sont plus stricts: dans des conditions contrôlées, seuls les agents sont invités à prendre des décisions.**其他 agents 的 minds**(ToM) 时, coordonnée才会涌现――没有ToM prompt, même si un modèle fort se révèle incapable de passer par un mode de coordination contrôlé par la statistique―― ceci est important pour l'environnement de production: les fonctions de coordination multi-agents publiées par l'équipe dépendent souvent de la rapidité et sont très fragiles――

Le cours est consacré à la formation et à la formation de la formation professionnelle.

## 概念

### Tu es quoi ?

发展心理学:3 岁儿童认为任何人的内在世界都和自己一致──5 岁儿童理解他人有不同信仰──7 岁儿童会推论关于信仰的信念──她认为我认为球在杯子下面)──这些分别是零阶段、一阶段和二阶段 ToM──

Pour les agents de LLM, le nombre de stages de traitement est:

- **Zeroth-order:**Il n'y a pas de modèle pour les autres.
- **First-order:**L'agent possède le modèle de foi de chaque autre agent. Alice croit à X.
- **Second-order:**Alice croit que Bob croit à X.

Li et collègues ont découvert que les agents de la LLM dans le jeu de coopération sont en vogue, mais qu'ils se détériorent avec un long horizon et une communication indépendante.

### Teste Sally-Anne 简述

Un test de fausses croyances de 1985: Sally met une boule de perle dans le panier A, puis elle partit. Anne la met dans le panier B. Sally revient et va où chercher ?

Les LLM de la période GPT-4 peuvent être passés dans les tests de style Sally-Anne directement proposés. Lorsque les histoires sont longues, les scénarios changent souvent, ou les problèmes sont exprimés de manière indirecte, ils échouent.

### Coordonmeurage de la Riedl

Riedl (arXiv:2510.05174) 构建一个群体规模测试:N 个代理,一个合作目标,可变快速条件――测量:

1. **Identity-linked differentiation.**Les agents ont-ils formé un rôle stable au fil du temps ?
2. **Goal-directed complementarity.**Les actions des agents sont-elles complémentaires à leurs tâches, plutôt que répétées ?
3. **Higher-order synergy.**Une mesure statistique, utilisée pour déterminer si un groupe a réalisé des résultats que tout groupe ne peut atteindre.

结果: seulement dans les conditions de prompt ToM, trois indicateurs ne produisent pas tous des signaux supérieurs à la ligne de base.  Lorsque le modèle de capacité moyenne est approximatif sans prompt ToM, le modèle de capacité moyenne se rapproche de l'occasion.

### 协调幻觉

                                                                                                                                                                                                                                                              

- L'ingénierie rapide, mettre en place des coordonnements, les systèmes sont invités à travailler ensemble.
-  observer parcours ⋅ nous verrons notre propre modèle d'attente
- Fait après sélection réussit.

Si le système de production proclame une coordination émergente sans signal de détection, il devrait être considéré comme un marketing.

### Un agent conscient du minimum de TOM

结构:

```
agent state:
  own_beliefs:    {facts the agent believes}
  other_models:   {other_agent_id -> {beliefs_the_agent_attributes_to_them}}
  actions_last_N: [history of others' actions]

observation update:
  - update own_beliefs from direct observation
  - update other_models[agent_id] from their action + prior beliefs

action selection:
  - enumerate candidate actions
  - for each, predict what each other agent will do next given their modeled beliefs
  - pick action that maximizes joint outcome under those predictions
```

`other_models`L'attribut est l'état de la TOM.`other_models[i][other_models_of_j]`Je pense que l'agent j'ai confiance en quoi.

### Pourquoi le long horizon serait endommagé

Li et al. ont enregistré: les limites de contexte conduisent les agents à oublier quelles croyances appartiennent à qui.

论文和 2024-2026 后续研究中记录的缓解方式:

- **在 prompt 中显式写出 ToM state.**结构化格式:`{agent_id: belief_list}`❖ La récupération forcée ❖ La mise en place d'un statut de confiance
- **更短的 reasoning chains.**Chaque fois que les mises à jour de ToM sont moins fréquentes, on peut réduire les hallucinations.
- **外部 ToM store.**Dans le cadre de la LLM, chaque cycle ne peut être inséré que dans des sections connexes.

### Tu es en train de faire une erreur .

- **Adversarial settings.**Œuvrant avec de bons agents, vous pouvez les modeler, puis les utiliser.
- **Heterogeneous teams.**Lorsque le modèle est différent, il est adapté à un modèle ToM de l'adversaire.
- **Ground-truth-dependent tasks.**Pour se concentrer sur la conviction; si la vérité dépend du fait, il est possible de se distraire.

### coordonnations de la mesure de votre puissance réelle

Les trois signes pratiques de la coordination de la décision sont réels plutôt que rapides.

1. **Complementarity over time.**Dans une tâche multi-tours, les actions des agents couvrent-elles des sub-tasques non superposées ?
2. **Anticipation.**L'action de l'agent A à tour T+1 dépend-elle de la prédiction de l'action de B à T+2 et la prédiction est-elle plus tard prouvée vraie ?
3. **Correction.**Quand A est en train de rectifier le point de vue de B, A est-il en train de rectifier le point de vue de T+2 ?

Tout cela peut être mesuré dans le système multi-agent du journal.


```figure
sw-theory-of-mind
```

## - Je le construis.

`code/main.py`实现:

- `ToMAgent`Suivez vos propres croyances et les croyances de chaque agent.
- Une tâche de coopération: trois agents doivent collecter trois Tokens dans trois boîtes; chaque boîte ne peut contenir qu'un seul Token.
- 两种配置:`zeroth_order`(sans détour)`first_order`(avoir une couche de modèle de conviction)
- En 200 fois à l'essai, la mesure est de la cote de finition.

运行:

```
python3 code/main.py
```

预期输出: les agents de commande nulle vont répéter les efforts avec un pourcentage d'environ 35% et terminer environ 60% des essais en 10 rounds.

## Utilisez-le

`outputs/skill-tom-auditor.md`Il s'agit d'une compétence utilisée pour vérifier le système multi-agents de coordination des déclarations émergentes.

##  La publier

协调声明 liste de contrôle:

- **Control condition.**Votre système a été supprimé par coordination prompt.
- **Statistical test.**Dans votre indicateur, la différence entre le système et le contrôle est-elle`p < 0.05`- Ça se voit ?
- **Complementarity measure.**L'action ne se compose pas avec le temps, mais seulement avec le succès final.
- **Failure-case log.**Quand les agents coordonnent l'échec, que fait votre état ?
- **Model-capacity disclosure.**Si les effets disparaissent sur le modèle plus petit, on peut préciser:

## 练习

1. 运行  référencement`code/main.py` Confirmer que la première phase de la RTE réduira le taux de répétition d'environ 7 fois.
2. 实现二阶 ToM agent A 建模 B 如何看待 C) ・・・ Est-ce que c'est mieux que dans un premier étage ?
3. À l' état de l' inscription une fois **hallucination**: chaque tour change d'avis.
4. 阅读 Li et al. (arXiv:2310.10701)。复现long horizon degradation发现:当轮数从10 增加到30 时,你的一阶 ToM 性能如何变化?
5. 阅读 Riedl 2025 (arXiv:2510.05174)── dans votre modèle de journaux réaliser des statistiques de synergie de plus haut ordre──

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|----------------|------------------------|
| Theory of Mind | “理解他人的 minds” | 建模另一个 agent 信念的能力。按阶数分级（0、1、2+）。 |
| Sally-Anne test | “false-belief test” | 1985 年发展心理学；LLMs 能通过简单版本，但会在复杂版本失败。 |
| First-order ToM | “A believes X” | 建模一个他人关于事实的信念。 |
| Second-order ToM | “A believes B believes X” | 更深一层的递归建模。 |
| Identity-linked differentiation | “随时间保持稳定角色” | Riedl 的指标：角色持续存在，而不是随机。 |
| Goal-directed complementarity | “不重叠行动” | agents 目标指向不同子任务，而不是同一个。 |
| Higher-order synergy | “群体超过任何子集” | Riedl 用于真实协调的统计度量。 |
| Coordination illusion | “看起来协调” | 没有可测信号的 prompt 修饰式协调表象。 |

## 延伸阅读

- [Li et al. — Theory of Mind for Multi-Agent Collaboration via Large Language Models](https://arxiv.org/abs/2310.10701) 合作游戏中的涌现式 ToM; modes d'échec à long terme
- [Riedl — Emergent Coordination in Multi-Agent Language Models](https://arxiv.org/abs/2510.05174) 群体规模测量;ToM incitant à la réalisation des conditions
- [Premack & Woodruff — Does the chimpanzee have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-chimpanzee-have-a-theory-of-mind/1E96B02CD9850E69AF20F81FA7EB3595) ToM 概念在 1978 年的起源
- [Baron-Cohen, Leslie, Frith — Does the autistic child have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-autistic-child-have-a-theory-of-mind/) Sally-Anne 论文(1985)
