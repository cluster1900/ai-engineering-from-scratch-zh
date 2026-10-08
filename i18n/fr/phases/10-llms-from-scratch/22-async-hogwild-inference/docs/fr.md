# Synchronisez avec Hogwild !

> Le décoding spéculatif (Phase 10 · 15) se déroulera dans une seule séquence de jetons de mise en ligne. Inference(Rodionov et coll., arXiv:2504.06261) fait une autre chose:并行运行同一个LLM的 N 个实例,并让它们共享一个关键值缓存──每个工人都能立即看到其他工 生成的代币──现代推理模型QwQ、DeepSeek-R1无需任何细节调整,就能通过这个共享缓存自我协调── cette méthode est encore en phase d'expérimentation, mais elle ouvre une nouvelle dimension du parallélisme des inferences, et décode correctement avec le spécifique──本课程使用 stdlib Python 实现一个两个工人Hogwild! La collaboration partagée de cache apparaît dans les capacités de raisonnement du modèle existant.

**类型：**Construire
**语言：**Python (stdlib)
**先修：**Phase 10 · 12 ((optimisation de l'inférence),Phase 10 · 15 ((décodage spéculatif)
**时间：**- 60 minutes

## Objectif de l'apprentissage

- 描述三种常见的平行LLM topologies(voting、sub-task、Hogwild!),并说明每一个针对的问题──
- Pour le projet, le projet de loi de la gestion des ressources humaines est un projet de loi de la gestion des ressources humaines.
- Selon le nombre de travailleurs.`N`、parallélisme au niveau des tâches `p`et coordonnées`c`計算 Hogwild! de l'accélération du temps du mur.
- Dans le jeu de jeu, il faut mettre en place un simulateur Hogwild à deux ouvriers, et observer la division des tâches émergentes.

##  problématique

Les LLM modernes 通过生成长时间的推理链来解决困难问题5000 tokens 步骤逻辑 很常见,深度数学问题出现数万代币也不少见―― dans le modèle 70B 上以35代币/秒解码,50k代币 需要24分钟―― un tel modèle n'a pas de connectivité――

Le décoding spéculatif (Phase 10 · 15) en se déroulant dans une seule séquence, peut entraîner un accélération de 3-5 fois.

La question est évidemment: pouvons-nous transcender les séquences et les aligner ?

已有工作包括: vote ensembles(运行 N 个模型,选择多数答案) 、tree-of-thought (tree of thought) 、分支出推理路径 并重新组合) ainsi que des cadres multi-agent (for each agent, distribue sub-task,并 use coordinator) ⋅

Hogwild! Inference  a adopté différentes méthodes。N 个工共享一个KV cache。 chaque travailleur sera immédiatement voir d'autres travailleurs 生成的代币,就像这些代币 已经在自己的背景中一样──workers 没有任何培训或细调的情况下,会自己弄清楚如何分工──现代推理模式 ((QwQ、DeepSeek-R1、Claude-family reasoning mode) 能够读取共享缓存,并说出类似我看到工人2 已经处理了基案,所以我来处理诱导步这样的话──

Jusqu'en 2026, la vitesse dépend de la charge de travail, et est encore à la phase expérimentale. Mais cette idée mérite d'être comprise, car elle ouvre une nouvelle dimension du parallélisme des inférences.

## 概念

###  définition

Premiérisez N 个 processus de travail,全部运行同一个LLM── ne pas utiliser des caches KV par travailleur, mais maintenir un caché partagé──当 worker`i`Le symbole de la vie`t_j`时, ce symbole sera écrit dans le cache partagé de la prochaine position.`k`执行下一步时,它读取缓存的当前状态 (), qui contient jusqu'à présent tout le contenu de N 个员工生成) ⋅

Dans le temps de l'étape, les travailleurs seront en concurrence pour écrire des jetons. Il n'y a pas d'indice de position par travailleur.

### Pourquoi la coordination aura lieu ?

Les travailleurs 共享一个缓存. Vous êtes l'une des N instances travaillant ensemble sur ce problème. Chaque instance lit la mémoire partagée et peut voir ce que les autres instances ont écrit. Évitez le travail redondant.

Le journal Hogwild! (Rodionov et coll., 2025) a rapporté:

- Les travailleurs élaborent des plans, les mettent en cache et les transmettent aux autres travailleurs.
- Les travailleurs remarqueront les erreurs des autres travailleurs en raisonnant, et souligneront ces problèmes.
- Les travailleurs seront en train de planifier la situation de défaillance et de proposer des alternatives.
- Lorsque les travailleurs demandent rapidement un contrôle de la redondance, ils vérifient qu'il est transféré vers d'autres emplois.

Ces éléments ne nécessitent pas d'ajustement. Le comportement émergent du modèle possède déjà des capacités de raisonnement.

### Nom de famille

Le nom de ce document a été emprunté à Hogwild! SGD(Recht et al., 2011), un optimisateur de mise à jour asynchrone.

### Rope  Fais que ça soit possible

Embeddings de position rotative ((RoPE, Su et al. 2021) par la rotation de Q 和 K vecteurs 编码 position information──因为 positions sont des rotations, et non des compensations de fixation, donc la position du jeton peut être déplacée, sans avoir besoin de recalculer KV cache entrée── être un travailleur `i`写入 position du cache partagé `p`时,读取该职位的其他员工可以直接使用缓存输入不需要重转

Dans le modèle de position apprise ou de position absolue, Hogwild !

### Temps de mur

设 `T_serial`Il est un travailleur qui a besoin de temps pour résoudre le problème.`p`∈ R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R = R =`c`Il y a une coordonnée de coordonnées à chaque étape.

Temps de travail à titre monoparental:`T_serial`Il y a une autre.
Si la coordination est gratuite, le temps de Hogwild est:`T_serial * ((1 - p) + p / N)`C'est le classique Amdahl.
加入 coordonnées générales 后:`T_serial * ((1 - p) + p / N) + c * steps_per_worker`Il y a une autre.

Pour que le travailleur ait une production,`c`Pour la génération de 5k+ tokens, les travailleurs peuvent supporter des centaines de tokens de coordination en tête, et ils sont toujours en tête. Pour les tâches de chat court, la coordination sera la principale, Hogwild!

### exemple spécifique

Problème de raisonnement: 10k tokens de chaîne de pensée.`p = 0.7`Les différents types de travail sont les suivants:`c = 200`Les symboles`N = 4`les travailleurs:

- Temps de série: 10000 étapes de décode.
- Temps de décode: 10000 * (0,3 + 0,7 / 4) + 200 * 4 = 10000 * 0,475 + 800 = 5550 étapes de décode:
- Accélération: 10000 / 5550 = 1,8 fois

C'est juste un gain moyen. Mais dans les problèmes de raisonnement plus longs, les frais de coordination seront réduits, la vitesse sera redirigée vers 2,5 à 3 fois.

### - Je suis pas un bon gars.

- 长 raisonnement problèmes ((1000 tokens), dont la tâche peut être transversée sous-objectifs indépendants并行化。
- 已被训练为步骤思考的推理模型──non-réasonning models 无法很好地自我协调──
- Les déploiements de nœuds uniques, et il y a suffisamment de VRAM 容纳 cache partagée plus N 个 processus de travail── le cache est partagé, mais chaque travailleur a sa propre mémoire d'activation──

### 什么时候不使用

- 短交互聊天──Coordination des frais généraux 会占主导──
- 无法并行化任务(单一线性证明、单一编译) ――N=1 是上限──
- Les modèles non rationnels ne seront pas coordonnées.
- Les déploiements multi-nœuds;. le cache partagé 需要非常快的跨工作者同步──Intra-nœud 可以;cross-nœud 会成为延迟灾──

###  État de l'expérimentation

截至 2026 年 4 月,Hogwild! est une méthode de recherche,并有开源 PyTorch implementation── pas encore apparue adoption de la production──三个 obstacles:

1. 跨 concurrent processes 管理 shared KV cache                                                                                                                                                                                                                                                          
2. La coordination d'urgence dépend de la tâche; les points de référence sont encore en construction.
3. Par rapport aux avantages que le décoding spéculatif a déjà apportés, les accélérations sont plus modestes; les deux peuvent être combinés, mais la complexité de l'architecture après la combinaison est également étroite.

Il vaut la peine de savoir. Il vaut la peine d'expérimenter.


```figure
continuous-batching
```

## - Je le construis.

`code/main.py`Il a réalisé un simulateur de jouets Hogwild !

- Les deux processus de travail, chacun étant déterminé, génèrent plusieurs types de jetons avec une probabilité connue.
- Une cache partagée, une liste de jetons, deux travailleurs sont prêts à lire et à écrire.
- Une logique de coordination simple: quand un travailleur voit un autre travailleur, il a déjà généré suffisamment de jetons de travail dans une catégorie, il choisit une catégorie différente.

Le simulateur sera fixé dans le budget de l'étape suivante:

- 总数── les jetons de travail qui se produisent
- 总 temps de mur(pas de travail 数量)。
- Rapidité efficace par rapport à un travailleur célibataire.
- Quel ouvrier a écrit une trace de la marque ?

### 步骤 1: cache partagé

Une liste de deux travailleurs qui vont être ajoutés à la liste.`threading.Lock`); ici nous utilisons le compteur 模拟。

### 步骤 2: boucle du travailleur

Chaque travailleur à chaque étape:

- 读取当前 cache partagée
- Selon le contenu, on décide de l'écriture de quel type de jeton.
- - Je suis un symbole.

### 步骤 3: heuristique de coordination

Si la catégorie X est déjà en cache et que le travailleur a écrit la catégorie X, alors le travailleur passera à la catégorie Y. C'est un jouet en place, utilisé pour indiquer le comportement du modèle de raisonnement:

### 步骤 4: accélération de la mesure

Les synonymes de travail sont les mêmes: les synonymes de travail sont les mêmes: les synonymes de travail sont les mêmes: les synonymes de travail sont les mêmes: les synonymes de travail sont les mêmes: les synonymes de travail sont les mêmes: les synonymes de travail sont les mêmes: les synonymes de travail sont les mêmes: les synonymes de travail sont les mêmes: les synonymes de travail sont les mêmes: les synonymes de travail sont les mêmes: les synonymes de travail sont les mêmes: les synonymes de travail sont les mêmes: les synonymes de travail sont les mêmes: les synonymes de travail sont les mêmes: les synonymes sont les synonymes de travail sont les mêmes: les synonymes de travail sont les mêmes: les synonymes sont les synonymes de travail sont les mêmes: les synonymes sont les synonymes de travail sont les synonymes de travail sont les synonymes de travail sont les synonymes de travail sont les synonymes de travail sont les synonymes de travail sont les synonymes sont les synonymes de travail sont les synonymes sont les synonymes de travail sont les synonymes de travail sont les synonymes sont les synonymes et les synonymes sont les synonymes sont les synonymes sont les synonymes.

### 步骤 5: à la coordination 施压

 Réduire la sensibilité de l'héuristique de coordination  Réappliquer  Observer Si la coordination n'est pas bonne, N=2 aura de la place pour produire les mêmes jetons, la vitesse va tomber à 1 

## Utilisez-le

截至 2026 年 4 月, l'intégration de Hogwild! est toujours en production.

务实的 adoption route:

1. Profil de votre charge de travail de travail de raisonnement-tâche──mesure de jetons Dans exploratoire(multiple stratégies、analyse de cas、recherche) et la proportion de ligne
2. Si l'exploration 占主导,运行 Hogwild! expérimentation à deux ouvriers 
3. Si l'amélioration est inférieure à 1,3 fois, indique que vous êtes dans un régime de coordination dominé.
4. Si l'amélioration dépasse 1,5x, progressez jusqu'à N=4 et repétez la mesure.

Avec le décodeur spéculatif 组合: chaque Hogwild! travailleur peuvent utiliser indépendamment le décodeur spécifique.

## Je le livre.

本课会生成 `outputs/skill-parallel-inference-router.md` donner un profil de travail de raisonnement (voir le profil de parallélisme des tokens budgétaire, des tâches, des familles de modèles, des objectifs de déploiement), il sera effectué en votant, en utilisant un arbre de pensée, un multi-agent, Hogwild et des stratégies de décoding spéculatives.

## 练习

1. Utilisation de paramètres de fonctionnement`code/main.py`Confirmer dans le même temps de mur, N=2 Hogwild! configuration par rapport à N=1 baseline  générer plus de jetons de travail

2. réduire la force de l' heuristique de coordination `coordination_weight=0.1`••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••

3. Calculer une tâche de raisonnement 50K-token en`p=0.8, c=500`且 N=4 travailleurs 时的预期 Hogwild! accélération──再对一个1k-tokenchat tâche 在 `p=0.3, c=200`Pourquoi l'un est un gain et l'autre une perte ?

4. 阅读Hogwild! paper's Section 4 (évaluation préliminaire)  Découvrez les auteurs  Décrire les deux modes d'échec du rapport  Décrire un meilleur rappel de coordination  Comment soulager chaque problème 

5. Dans le jeu, Hogwild! avec le décodeur spéculatif 组合: chaque travailleur utilise à l'intérieur un décodeur spécifique à 2 jetons.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Hogwild! | “Parallel workers, shared cache” | 同一个 LLM 的 N 个 instances 并发运行，并共享一个 KV cache；通过 self-prompting 实现 emergent coordination |
| Shared KV cache | “The coordination medium” | 一个不断增长的 KV buffer，所有 workers 都会读取和写入；让 tokens 能在 workers 之间立即可见 |
| Emergent coordination | “No training needed” | 具备 reasoning 能力的 LLMs 可以读取 shared cache，并在没有任何 fine-tuning 或显式 protocol 的情况下分工 |
| Coordination overhead (c) | “Tokens spent orienting” | 每个 worker 读取扩展后的 cache 并决定下一步做什么的成本；相对于总 decode time 必须保持较小 |
| Parallelizable fraction (p) | “What can run in parallel” | Task-level parallelism：总工作中并非内在 sequential 的比例 |
| RoPE enables Hogwild! | “Rotary positions are shift-invariant” | 因为 positions 是 rotations，写入 shared cache 不需要重新计算之前的 tokens |
| Voting ensemble | “Run N, pick the majority” | 最简单的 parallel inference topology；适用于 classification，对 long-form reasoning 帮助较小 |
| Tree of thought | “Branch and prune” | 探索多个 branches 并进行 pruning 的 reasoning strategy；使用显式 coordination logic |
| Multi-agent framework | “Assign sub-tasks” | 每个 agent 获得一个 role；由 coordinator 编排；protocol overhead 很重 |

## 延伸阅读

- [Rodionov et al. — Hogwild! Inference: Parallel LLM Generation via Concurrent Attention (arXiv:2504.06261)](https://arxiv.org/abs/2504.06261) Hogwild! papier, dans QwQ et DeepSeek-R1
- [Recht, Re, Wright, Niu — Hogwild!: A Lock-Free Approach to Parallelizing Stochastic Gradient Descent (arXiv:1106.5730, NeurIPS 2011)](https://arxiv.org/abs/1106.5730) 原始 Hogwild !,名称来源
- [Su et al. — RoFormer: Enhanced Transformer with Rotary Position Embedding (arXiv:2104.09864)](https://arxiv.org/abs/2104.09864) RoPE, rendant possible la déduction partagée de la cache
- [Yao et al. — Tree of Thoughts: Deliberate Problem Solving with Large Language Models (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601)La stratégie de raisonnement de l'arbre de pensée, Hogwild !
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192) Décodage spéculatif, Hogwild!
- [Hogwild! reference PyTorch implementation](https://github.com/eqimp/hogwild_llm) Les expériences sur papier sont la seule source de vérité
