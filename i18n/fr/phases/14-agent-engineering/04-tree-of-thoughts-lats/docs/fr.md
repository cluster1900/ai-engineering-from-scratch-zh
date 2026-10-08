# Arbre des pensées et LATS: Recherche délibérée

> 单条链-of-thought trajectory 没有回溯空间──ToT(Yao et al., 2023) va le raisonnement 变成 un arbre, et à chaque nœud effectuer une auto-évaluation──LATS(Zhou et al., 2024)

**类型：**Construire
**语言：**Python (stdlib)
**先修：**Phase 14 · 01 (loculier d'action), phase 14 · 03 (réflexion)
**时间：**- 75 minutes

## Objectif de l'apprentissage

- Le raisonnement exprime la recherche: le nœud est la pensée, l'extension est l'expansion, la valeur est l'espoir.
- 实现一个stdlib ToT-style BFS tree search,并使用自评分点子──
- 扩展为一个玩具 LATS MCTS loop,包含选择/扩展/模拟/反扩散──
- Jeu de génération de code 24), jeu de génération de code 24 (en anglais seulement)

##  problématique

La chaîne de pensée est une ligne de conduite. Si la première étape est erronée, chaque étape suivante sera construite sur une erreur de prémisse.

Le raisonnement 需要的是提出多个候选,评估它们,选择有希望的候选,并出现死角 时回溯的能力──这就是搜索──Tree of Thoughts 和 LATS sont deux formulassions canoniques──

## 概念

### L'arbre des pensées (Yao et coll., NeurIPS 2023)

Chaque nœud est un étape intermédiaire de la réflexion. Chaque nœud peut être étendu pour une pensée de K.

```
                     (root: "find 24 from 4 6 4 1")
                    /               |            \
           ("6 - 4 = 2")    ("4 + 1 = 5")    ("4 * 6 = 24")  <- Score: HIGH
              /   \              |                  |
          ...    ...          ...                finish
```

L'auto-évaluation est une partie importante du thèse.`sure / likely / impossible`classification,`1..10`Le score numérique, ainsi que le vote entre les candidats, sont nettement supérieurs à ceux du CoT (GPT-4) de 4% à 74%.

### LATS (Zhou et coll., ICML 2024)

LATS dans MCTS a été créé pour la TOT, la réaction et la réflexion.

- **Policy**: proposer candidat à la prochaine action (react style)
- **Value function**:为 partielle trajectoire 打分(T-style auto-évalue)
- **Self-reflector**Il est également utilisé pour la réflexion sur les concepts de la nature.

Les résultats de la recherche sont les suivants: utilisation de la passerelle HumanEval du GPT-4 pour 92,7% (SOTA), utilisation de la moyenne WebShop du GPT-3.5 pour 75,9 (approximative de l'ajustement fin basé sur les gradients)

### MCTS, forme minimale

Chaque itération a quatre étapes:

1. **Select** Utilisation de l'UCT (confiance supérieure liée aux arbres) de la racine à la feuille
2. **Expand**  通过政策 生成 K 个孩子──
3. **Simulate** Utilisation politique de déploiement de l'enfant à la feuille,并用值函数 (ou environnement récompense)
4. **Backpropagate** 沿路径向上更新 visite et estimation de la valeur

Formule de l'UCT:`Q(s, a) + c * sqrt(ln N(s) / N(s, a))` La première est l'exploitation; la seconde est l'exploration.`c`Il y a une autre.

### 成本现实

Recherche 会让 Token 爆炸──Le jeu de 24 上的 ToT 使用的 Token 是 CoT 的 1001000 倍──LATS 类似──

- 单条轨迹 被证明不足的任务 24 复杂代码的游戏)
- Le mur-horloge n'est pas comme la précision.
- Il y a une fonction de valeur facile et fiable de la tâche de test unitaire du code, cible explicite de la mathématique)

Si votre tâche a une seule réponse correcte et un évaluateur a du bruit, la recherche rendra les choses plus mauvaises, car elle trouvera des erreurs de réponse.

### 2026 定位

La plupart des agents de production ne travaillent pas dans des laboratoires de production. Ils travaillent avec des outils de vérification basés sur des outils.

- Test 作为值函数的编码代理 (HumanEval-style)
- 探索多条 chemin de requête 探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探究探
- LangGraph subgraph 内部 planning-heavy workflow。

AlphaEvolve (leçon 11) est un exemple extrême de 2025: pour le code, effectuer une recherche évolutionnaire, une recherche de la capacité de vérification par machine, un gain de frontière, pour la première fois en 4x4 (réforme)


```figure
tree-of-thoughts
```

## - Je le construis.

`code/main.py`实现:

- Une tâche de calcul de choix en fonction de la taille de la petite BFS.
- Une seule tâche est de sélectionner le jeu LATS MCTS (Select / Expand / Simulate / Backpropagate), en utilisant la sélection UCT.
- Une fonction de valeur de la note symbolique et du score auto-équivalent.

Je vais le faire.

```
python3 code/main.py
```

trace 会显示 ToT Using BFS Chaque nœud élargit trois candidats,并与LATS 通过MCTS 收到最佳推广 进行对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──对比──

## Utilisez-le

LangGraph va utiliser l'exploration à la mode ToT  comme modèle de sous-graphe 提供;LangChain team 关于 LATS 的博客(2024 年 5 月) 是参考教程──LlamaIndex 提供 `TreeOfThoughts`L'agence ⋅ pour la plupart des agents de production de 2026 ⋅`if task_complexity > threshold: use_search()`Leur conception de l'évaluation et de l'optimisation de l'évaluation

## Je le livre.

`outputs/skill-search-policy.md`Selon la forme de la tâche, le budget et la fidélité de l'évaluateur, on peut choisir entre ReAct, ToT, LATS et recherche évolutionnaire.

## 练习

1. Avec UCT c=0.1 et c=2.0 运行玩具 LATS... qu'est-ce qui a changé dans la trace ?
2. Pour la fonction de valeur 换成噪音更大的得分器 (加入随机震动) ――MCTS encore trouver la meilleure feuille 吗?
3. 实现beam-search ToT( chaque niveau de conservation de top-k)并与BFS对比──在紧张的代币预算下哪一个更好?
4. L'analyse de la trajectorie humaineEval: combien de déploiements sont nécessaires pour atteindre le rapport de passage@1 ?
5. 阅读 LATS paper 中关于when LATS helps less的讨论──写一段决策规则,将任务形状映射到搜索策略──

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Tree of Thoughts | “Branching CoT” | Yao et al. — 带有 self-evaluation 的 thought node 树 |
| LATS | “MCTS for LLMs” | Zhou et al. — 在 MCTS 下统一 ToT + ReAct + Reflexion |
| UCT | “Upper confidence bound” | 在 exploitation (Q) 和 exploration (ln N / n) 之间平衡的 select formula |
| Value function | “这个 state 有多好” | Prompted LLM score 或 environment reward；反馈给 backprop |
| Policy | “Action proposer” | ReAct-style generator；发出候选 next thought/action |
| Rollout | “Simulated trajectory” | 使用 policy 从 node 走到 leaf，并用 value 打分 |
| Backpropagate | “更新 ancestors” | 将 leaf 的 reward 沿路径向上推，更新 visit count 和 Q |
| Search cost | “Token explosion” | Game of 24 上是 CoT 的 100-1000 倍；采用前先做 budget |

## 延伸阅读

- [Yao et al., Tree of Thoughts (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601) 经典论文
- [Zhou et al., LATS (arXiv:2310.04406)](https://arxiv.org/abs/2310.04406) 带有反思反的 MCTS
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) Utilisé pour la recherche du modèle de sous-graphe
- [AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) 带 évaluateur de programmation de la recherche évolutionnaire
