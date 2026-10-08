# Utilisation de la recherche et de l'évolution

> Le plan de planification symbolique  traitement de la situation  Réalisation de la situation  Réalisation de la fonction de traitement de la condition physique  Réalisation de la fonction de traitement de la condition physique  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation de la situation  Réalisation  Réalisation de la situation  Réalisation  Réalisation de la situation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation  Réalisation

**类型:**Construction
**语言:**Python (stdlib)
**先修要求:**Phase 14 · 02 (ReWOO et planification et exécution)
**时间:**- 75 minutes

## Objectif de l'apprentissage

- 解释 Hierarchical Task Networks:tasks、methodes、opérateurs、préconditions、effets。
- 描述 ChatHTN's loop hybride  recherche symbolique 加 LLM décomposition de la chute de la télévision".""
- Expliquer la boucle évolutionnaire d'AlphaEvolve, ainsi que pourquoi elle ne s'applique qu'à l'évaluateur programmatique.
- Utilisez un plan d'utilisation de jouets et recherche évolutionnaire de jouets.

##  problématique

ReWOO (Létion 02) 、Plan-et-Execute 和 ReAct 覆盖了大多数agent planning──它们不太擅长覆盖两个场景:

1. **可证明正确的 plans。**Le plan de planification, le parcours de vol, les flux de travail de conformité, le plan, doit être construit en fonction du son, mais il est parfois illusoire de le faire.
2. **带有机器可检查 fitness function 的优化。**La multiplication de matrice, l'heuristique de planification, le compilant passe  目标不是一个正确的计划,而是最好的计划──

La planification HTN et AlphaEvolve résolvent deux problèmes différents.

## 概念

### Réseaux hiérarchiques de tâches

HTN incluant:

- **Tasks** composé (à la décomposition) et primitif (à l'exécution directe)
- **Methods** Répondre les tâches composées en sous-tâches, avec des conditions préalables.
- **Operators** 带有前条件和效果的原始行动──
- **State**Une série de faits.

Planification: donner une tâche de but et un état initial, trouver une décomposition, en faisant des conditions préalables 按顺序满足的原始运算者──

HTN est apparu avant la LLM et reste un moyen de référence pour prouver les plans corrects.

### Le projet de loi de l'Union européenne sur les droits de l'homme (CATHN)

ChatHTN (arXiv:2505.11814) va être symbolique HTN avec LLM requêtes 交错执行:

1. 尝试使用现有方法 分解当前 complément task──
2. Si aucune méthode n'est appliquée, demandez à la M.L.`s`Comment allez-vous vous décomposer ?`task`- Je suis désolé.
3. La réponse à la MLL sera transformée en sous-tâches candidates.
4. 根据运营商方案做验证; refuser des décompositions inefficaces。
5. - Je suis désolé.

论文的核心主张:生成的每一个计划都可证明声音,因为LLM suggestions 进入,永远不会直接编辑计划──图案层 负责正确性;LLM 扩展方法库──

Apprentissage en ligne de méthodes  OpenReview `gwYEDY9j2x`En effet, les résultats de la recherche ont été très positifs et ont permis de réduire la fréquence de recherche de l'LLM à 75%.

### AlphaEvolve (Novikov et coll., 2025)

AlphaEvolve (arXiv:2506.13131, DeepMind, juin 2025) est un autre type de chose: une recherche de code évolutif par l'ensemble de Gemini 2.0 Flash/Pro.

- Le boucle:

1. Depuis le programme de semence + évaluateur de programme 开始(Retourner le score de fitness)。
2. L'ensemble des LLM propose des mutations:
3. Les mutations sont transmises à l'évaluateur.
4. Il faut rester le meilleur, continuer à changer.

 déjà publiés:

- 56 ans à la première modification de la multiplication de matrice complexe 4x4 de Strassen (multipliation à 48 fois)
-  Grâce à la planification heuristique Borg  récupérer 0,7% de Google calcul
- Dans la charge de travail frontalière, la vitesse de FlashAttention est augmentée de 32%.

硬性约束: fonction de fitness 必须可由机器检查── Réponses à la prose faire une recherche évolutionnaire 不会收──

### Quel temps utiliser quel

| 问题类别 | 使用 | 原因 |
|---------------|-----|-----|
| 带硬约束的 Scheduling | HTN + ChatHTN | 可证明的 soundness |
| Compiler optimization | AlphaEvolve | 机器可检查的 fitness |
| Multi-step task execution | ReAct / ReWOO | LLM in the loop，没有 formal guarantees |
| 带 tests 的 Code improvement | AlphaEvolve | Tests 就是 evaluator |
| Policy-bound automation | HTN | Preconditions 编码 policy |

### Ce modèle est facile à éviter

- **没有 operators 的 HTN。**没有前条件/效果方案,soundness 主张就会崩塌──ChatHTN 的LLM suggère la décomposition要求 schema 能拒绝无效运动──
- **没有真实 evaluator 的 AlphaEvolve。**question LLM 代码 代码 否更好不是健身功能──Evaluateur 必须确定性且快──
- **过度工程化。**La plupart des tâches d'agent ne nécessitent pas ces deux choses.


```figure
htn-tree-expand
```

## - Je le construis.

`code/main.py`Œuvrer à deux exemples de jouets:

- Un planificateur HTN stdlib, comprenant les opérateurs, méthodes, préconditions, effets, ainsi que lorsque le méthode n'est pas adaptée à la tâche composée 时触发 `LLMFallback`LLM est un décomposateur scripté, donc le planificateur 可离线运行──
- Une recherche évolutive stdlib de programmes arithmétiques: augmenter les expressions, rendre son output dans l'ensemble de tests 上最小化 `|f(x) - target|`L'évaluateur est déterministe.

运行:

```
python3 code/main.py
```

Trace 会展示 HTN planner 分解一个复合任务 (中途带一次LLM fallback), ainsi qu'une boucle évolutionnaire 收到一个目标表达──

## Utilisez-le

- **HTN planners** `pyhop`- Je suis là.`SHOP3`, ou pour faire respecter des politiques spécifiques à un domaine, construire leur propre.
- **ChatHTN** code de recherche; cette mode (symbolic + LLM fallback) peut être transféré directement à n'importe quel planificateur HTN.
- **AlphaEvolve** Paper DeepMind; cette mode(ensemble + évaluateur)可复现──OpenEvolve 和类似开源叉 正在出现──
- **Agent frameworks** Actuellement, il n'existe pas encore de HTN de première classe ou AlphaEvolve.

## Je le livre.

`outputs/skill-hybrid-planner.md`Il s'agit d'un programme de formation en ligne et de formation en ligne.

## 练习

1. Utiliser le rétractation  étendre le planificateur HTN: lorsque l'opérateur est dans une situation postérieure dans le temps de fonctionnement  défaillance, re-roll并尝试下一个方法──
2. 给 ChatHTN 添加 LLM-méthode cache:当 LLM dans le modèle d'état `P` 中分解 tâche`T`时, stockage résultat── 下一次调用时先重新检查方法库──
3. Évolutionner une fonction de tri des cas de test à travers 20 cas de test; rapport recevoir les générations nécessaires
4. 阅读 AlphaEvolve's evaluator design notes──为你关心的域名 设计一个评价器(SQL requête optimisation、test-suite minimisation、deploiement YAML)──
5. 组合使用: utiliser HTN pour diviser la tâche composée en sous-tâches, puis utiliser la recherche évolutionnaire en utilisant l'opérateur primitif de chaque sous-tâche.

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| HTN | “Hierarchical planner” | 带有 operators、preconditions、effects 的 task decomposition |
| Method | “Decomposition rule” | 将 compound task 拆分为 subtasks 的方式 |
| Operator | “Primitive action” | 带有 precondition 和 effect 的具体步骤 |
| ChatHTN | “LLM + HTN” | 当没有 method 匹配时，symbolic planner 询问 LLM |
| AlphaEvolve | “Evolutionary code search” | Ensemble LLMs mutate code；deterministic evaluator 负责选择 |
| Fitness function | “Evaluator” | 针对 outputs 的 deterministic、机器可检查 score |
| Online method learning | “Cached LLM decomposition” | 存储并泛化 LLM plans，以降低 query cost |

## 延伸阅读

- [Gopalakrishnan et al., ChatHTN (arXiv:2505.11814)](https://arxiv.org/abs/2505.11814) symbolique + LLM 混合 planner
- [Novikov et al., AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) 带 LLM mutations de recherche de code évolutif
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 何時選擇 planificateur,何時選擇 simple boucle
