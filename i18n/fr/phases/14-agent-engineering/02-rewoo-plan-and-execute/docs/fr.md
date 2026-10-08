# Révision et planification et exécution:

> ReAct dans un flux de pensée et d'action. ReWOO les séparera: d'abord élaborer un plan complet, puis exécuter.

**类型：**Construction
**语言：**Python (stdlib)
**先修要求：**Phase 14 · 01 (loupage de l'agent)
**时间：**- 60 minutes

## Objectif de l'apprentissage
- 解释为什么 ReWOO 的规划者 / 工作者 / 解决者 拆分相比 ReAct 的交错循环 能省代币并提升强度──
- 实现 un plan DAG、 un exécuteur selon l'ordre d'exécution, ainsi qu'un résolveur de sorties de travail de groupe  全部使用 stdlib。
- Utilisation de cinq modèles de flux de travail en 2026  Framework  Anthropic), les tâches de jugement doivent être prises en compte dans le plan d'exécution ou dans le processus de réaction.
- Identifier les données synthétiques du plan de planification et d'action pour les tâches Web ou mobiles à long terme est nécessaire.

##  problématique
Le cycle de réaction-pensée-observation de ReAct est simple et flexible, mais chaque appel à l'outil doit être accompagné d'un contexte complet précédent  y compris chaque pensée précédente. L'utilisation des tokens augmente à la fois avec la profondeur.

ReWOO(Xu et al., arXiv:2305.18323, mai 2023) ont remarqué ce point, et ont fait un interchange: prévoir un plan complet, parallèlement obtenir des preuves, finale assemblage de réponse.

## 概念
### Les trois rôles

```
Planner:  user_question -> [plan_dag]
Workers:  [plan_dag]     -> [evidence]        (tool calls, possibly parallel)
Solver:   user_question, plan_dag, evidence -> final_answer
```

Le planificateur génère un DAG. Chaque nœud spécifie un outil, ses arguments, ainsi que ses dépendances à certains nœuds plus anciens.`#E1`- Je suis là.`#E2`Les travailleurs, selon l'ordre topologique, exécutent les nœuds.

### Pourquoi 5 fois moins de jetons

La longueur du prompt de réaction Va avec le nombre d'étapes 线性增长──在第十步,prompt 包含 thought 1加 action 1加 observation 1加 thought 2加 action 2加 observation 2,依此类推──每一步还会冗余包含原始 prompt──

ReWOO ne paie qu'une seule fois le prompt du planificateur, chaque appel d'outil, sans chaîne, et une seule fois le prompt du résolveur.

### Pourquoi il est plus robuste

Si le travailleur 3 dans ReAct ne parvient pas, le circuit doit être en cours de route en raison d'une erreur. Dans ReWOO, le travailleur 3 retourne à une chaîne d'erreur.

### Destillation par planificateur

Deuxième résultat du thème: Parce que le planificateur ne fait pas de remarques, vous pouvez utiliser les résultats du planificateur du professeur 175B pour affiner un modèle 7B.

### Le plan et l'exécution (LangChain, 2023)

LangChain 团队 dans un article de l'août 2023 de ReWOO 泛化为一个模式名称:Plan-and-Execute──Up-front planner 输出一个步骤列表,执行人 执行每个步骤,可选的重组规划员可以在观察结果后进行修改──这比 ReWOO更接近 ReAct(replanner 会把观察带回规划),但保留了代币节省──

### Le projet de loi (Erdogan et coll., arXiv:2503.09572, ICML 2025)

Plan-and-Act va étendre ce modèle à long-horizon web et agents mobiles. Une contribution clé est les données de plan synthétique: un générateur de trajectoires étiquetées.

### Quand choisir lequel

| Pattern | When |
|---------|------|
| ReAct | 短任务、未知 environment、需要 reactive exception handling |
| ReWOO | 具备已知 tools 的结构化任务、对 token 敏感、evidence 可 parallelize |
| Plan-and-Execute | 类似 ReWOO，但在 partial execution 后支持 replanning |
| Plan-and-Act | Long-horizon（>30 步）、web/mobile/computer-use |
| Tree of Thoughts | Search 值得付出成本（Lesson 04） |

Les résultats de l'étude ont été obtenus en 2024, avec la réalisation de la première étude de réflexion sur les résultats de la recherche.


```figure
rewoo-plan
```

## - Je le construis.
`code/main.py`实现一个玩具版 ReWOO:

- `Planner` Une politique scriptée, selon le plan de sortie rapide DAG。
- `Worker`  par le registre 分发每个节点的工具调用──
- `Solver` composition scriptée, lire des preuves et générer une réponse finale.
- Résolution de dépendance  类似 `#E1`Les références seront remplacées par des résultats de travail plus tôt.

Cette démo  réponse Quelle est la population de la capitale de la France, arrondie à des millions?, utiliser le plan de deux étapes:

Je vais le faire.

```
python3 code/main.py
```

trace 会先显示完整计划, puis afficher les résultats des travailleurs, enfin afficher la composition du solveur──将代币计数((我们印打粗略的字符计数) avec ReAct style 交错运行进行比较  在这种结构化任务上 ReWOO 胜出──

## Utilisez-le
LangGraph va planifier et exécuter  comme recette  fournir(`create_react_agent`Utilisé pour ReAct, graphiques personnalisés Utilisé pour exécuter le plan) ――CrewAI's Flow  directement codé le modèle: vous définissez les tâches à l'avance, puis Flow DAG  les exécuter──Plan-and-Act's synthétiques données  méthode actuellement encore principalement appartenant à la recherche; runtime pattern (Plan DAG) via LangGraph 和 CrewAI Flow 在生产提供──

## Je le livre.
`outputs/skill-rewoo-planner.md`Dans le cas d'un catalogue d'outils donné, selon la demande de l'utilisateur 生成 ReWOO plan DAG── il sera livré à l'exécuteur 之前验证计划(acyclic、 chaque référence ont été résolu、 chaque outil existent)。

## 练习
1. Pour les nœuds de plan indépendants  effectuer l'exécution parallèle du travailleur  Dans un DAG de 6 nœuds de 2 groupes parallèles, quels sont les avantages que cela peut apporter ?
2. Ajouter un nœud de réaménagement, lorsque tout travailleur retourne à l'erreur 时触发── faire ReWOO 变成 Plan-and-Execute minimale modification est-ce?
3. Avec un petit modèle de classe 7B)`Planner`,并让 `Solver`Utilisez le modèle frontalier. Comparer la qualité de bout en bout.
4. 阅读 ReWOO 论文中关于计划器蒸化的第4节──从概念上复现 175B -> 7B 的结果:你需要什么培训数据,以及如何评估计划质量?
5. Pour réaliser ce jouet, il est transféré dans la forme de la trajectoire du Plan-et-Act: le plan est la séquence, et non le DAG.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ReWOO | “Reasoning without observations” | 先 plan，然后 parallel 获取 evidence，最后 solve —— planning prompt 中没有 observations |
| Plan-and-Execute | “LangChain's plan-execute pattern” | ReWOO 加上 execution 后可选的 replanner node |
| Plan-and-Act | “Scaled plan-execute” | 显式 planner/executor 拆分，并用 synthetic plan training data 支持 long-horizon tasks |
| Evidence reference | “#E1, #E2, ...” | plan-node placeholder，在 dispatch 时用先前的 worker output 替换 |
| Planner distillation | “Small planner, big executor” | 用 large teacher 的 planner traces 来 fine-tune small model |
| Token efficiency | “Fewer round trips” | 论文中在 HotpotQA 上相对 ReAct 减少 5x tokens |
| DAG executor | “Topological dispatcher” | 按 dependency order 运行 plan nodes；每一层可 parallel |

## 延伸阅读
- [Xu et al., ReWOO: Decoupling Reasoning from Observations (arXiv:2305.18323)](https://arxiv.org/abs/2305.18323) 经典论文
- [Erdogan et al., Plan-and-Act (arXiv:2503.09572)](https://arxiv.org/abs/2503.09572) 带 synthétiques plans  的 planificateur-exécuteur à grande échelle
- [LangGraph Plan-and-Execute tutorial](https://docs.langchain.com/oss/python/langgraph/overview) recette de cadre
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 选择能工作的最简单模式  选择能工作的最简单模式  选择能工作的最简单模式
