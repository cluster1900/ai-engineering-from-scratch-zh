# Réflexion: Apprentissage par le renforcement verbal

>  Basé sur un RL de Gradient  nécessite des milliers d'essais et un cluster de GPU 才能修复一种 défaillance mode──Réflexion(Shinn et al., NeurIPS 2023) avec un langage naturel pour terminer cette chose: après chaque défaillance de l'essai, agent 写下一段反思,将其存储在节目内存,并让下一次试验基于这个段内存──这是Letta's sleep-time computation、Claude Code's CLAUDE.md apprentissages, ainsi que le modèle d'apprentissage du pro-workflow 背后模式──

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 02 (ReWOO)
**Time:** ~60 minutes

## Objectif de l'apprentissage
- Il est également possible de trouver des informations sur les différents types de mémoire.
- 实现 un stdlib Reflexion loop, contenant un évaluateur binaire, un tampon de réflexion et de nouvelles tentatives de ré-réflexion.
-  à la réalisation de certaines tâches, entre des sources de commentaires à l'échelle, hérétiques et auto-évaluées  à faire des choix 
- Expliquer pourquoi le renforcement verbal peut être capturé à partir de RL basé sur le gradient. Il faut des milliers d'essais pour corriger les erreurs.

##  problématique
Un agent  mission a échoué ⋅ Dans la norme RL, vous réutiliserez des milliers de tests, calculer des gradients, mettre à jour des poids ⋅ coût élevé ⋅ vitesse lente, et la plupart des agents de production ne sont pas prêts à effectuer des exercices de formation pour chaque échec ⋅

Réflexion ((Shinn et al., arXiv:2303.11366) pose un autre problème: si un agent  pense simplement à lui-même pourquoi il a échoué,  met cette idée dans le prompt 里再试一次,会怎么?

Le résultat est: dans ALFWorld, il a dépassé ReAct et d'autres lignes de base non finement ajustées. Dans HotpotQA, il a été amélioré par rapport à ReAct.

## 概念
### Les trois composantes

```
Actor         : generates a trajectory (ReAct-style loop)
Evaluator     : scores the trajectory — binary, heuristic, or self-eval
Self-Reflector: writes a natural-language reflection on the failure
```

Retour sur une structure de données:

```
Episodic memory: list of prior reflections, prepended to the next trial's prompt
```

Une fois, un essai sera effectué par l'acteur. L'évaluateur le fera. Si le score est plus bas, l'auto-réflecteur produira une réflexion.

### Trois types d'évaluateurs

1. **Scalar** Signal binaire de l'extérieur ∙ ALFWorld Success ou Failure ∙ HumanEval tests 通过或失败 ∙ 最简单,signal 最强──
2. **Heuristic** 预定义的失败签名──如果代理连续两次产生相同行动,就标记为卡卡──如果轨迹超过50步,就标记为不效──
3. **Self-evaluated** LLM à sa propre trajectoire 打分──当没有基础真理 时需要它──Signal 较弱;适合与工具基认证 搭配使用(L'enseignement 05  CRITIC) ──

La pratique standard de 2026 est la combinaison: utilisation à l'échelle, utilisation à l'auto-évaluation, heuristique comme rails de sécurité.

### Pourquoi cela généralise-t-il

La réflexion est plutôt un nouvel algorithme, non comme un modèle nommé.

- Letta's sleep-time computation (Léction 08): un agent indépendant Réfléchissez aux conversations passées,并写入记忆块──
- Claude Code `CLAUDE.md`/ save memory 模式:将反思 捕获为学习,并预pendi到未来的会议──
- Pro-flux de travail `/learn-rule`command:将 corrections 捕获为显式规则──
- Nœuds de réflexion de LangGraph: un nœud à la sortie 打分, et à la nécessité de temps de route jusqu'à raffinage。

Elles viennent toutes du même point de vue: le langage naturel est un moyen suffisamment riche, que je peux porter entre les deux.

### Quand est-ce que ça marche ? Quand est-ce que ça marche ?

Réflexion  s'adresse à:

- Il y a un signal de défaillance clair.
- classe de tâches 可复现(le même type de problèmes apparaîtra à nouveau)。
- Réflexion Il y a de la place pour améliorer la trajectoire (voir le budget d'action adéquat).

Réflexion non applicable:

- L'agent a réussi la première fois.
- 失败来自外部因素(réseau en panne 工具破碎) 反思 网络失败 对未来运行 没有帮助──
- Réflexion  devenir un fanatic   pour une fois occasionnellement de courte durée  stockage un passage narratif ⋅

2026 年的陷:memory rot──Reflections 会累积; parmi lesquelles certaines sont déjà passées de temps ou errées; avec l'épisode tampon 变大, re-runs 会变慢──缓解方法: périodique compaction(Léction 06)、对reflections 设置 TTL,或使用单独的睡眠时间清洁剂(Letta)。


```figure
react-trace
```

## - Je le construis.
`code/main.py`Dans un puzzle jouet 上实现 Réflexion: générer une liste de 3 éléments, en faisant la somme 等等到目标值。Acteur 产出候选人列表;Evaluateur 检查 sum;Self-Reflector 写一行关于哪里出错的诊断──Réflexion 会进入 剧情记忆,供下一次试用──

Components:

- `Actor`Une politique écrite, en regardant les réflexions,
- `Evaluator.binary()`  Basé sur la somme cible de la réussite/échec.
- `SelfReflector` 生成一行 diagnostic d'échec
- `EpisodicMemory` Une liste limitée de la sémantique TTL 

运行:

```
python3 code/main.py
```

Trace 展示三次试点──Trial 1 失败,存储一段反思;Trial 2 看到反思 后有改进但仍失败;Trial 3 成功──与基线运行(无反思)对比它会卡在试点1的答案上──

## Utilisez-le
LangGraph va refléter  comme modèle de nœud  fournir。Claude Code `/memory`commandement 和 pro-workflow `/learn-rule`L'opération de calcul de temps de sommeil de Letta est effectuée en temps d'arrêt, en fonctionnement de l'auto-réflecteur, permettant à l'agent principal de continuer à être en retard.`Session`Pour le construire.

## Je le livre.
`outputs/skill-reflexion-buffer.md`创建并维护一个节目缓冲,包含反思捕获、TTL 和减复式――给定一个任务类 和一次失败,它会产出一段真正帮助下一次试验的反思(而不是泛泛的要更小心) 

## 练习
1. De l'évaluateur binaire 切换到返回距离米τρ离目标 有多远) de l'évaluateur scalaire──¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
2. Pour les réflexions ajouter 10 essais de TTL ∙ Après ce point, les réflexions plus anciennes sont-elles nocives ou bénéfiques ?
3. 实现 heuristique evaluator: si la même action se répète, nous allons essayer de nous faire remarquer comme coincés.
4. Utilisation de l'acteur adversaire 运行 Reflexion― afin de forcer l'acteur à les remarquer, le moindre prompt de réflexion est-il ?
5. 阅读反思论文 中关于AlfWorld的第4节 从概念上复现 130% amélioration du taux de réussite: par rapport à la vanille ReAct, quel est le delta clé ?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Reflexion | “Self-correction” | Shinn et al. 2023 — Actor、Evaluator、Self-Reflector 加 episodic memory |
| Verbal reinforcement | “Learning without gradients” | prepend 到下一次 trial prompt 的自然语言 reflection |
| Episodic memory | “Per-task reflections” | 针对一个 task class 的 prior reflections bounded buffer |
| Scalar evaluator | “Binary success signal” | 来自 ground truth 的 pass/fail 或 numeric score |
| Heuristic evaluator | “Pattern-based detector” | 预定义 failure signatures（例如 stuck-loop、too-many-steps） |
| Self-evaluator | “LLM-as-judge on own trace” | 没有 ground truth 时使用的 lower-signal fallback — 与 tool-grounded verification 搭配 |
| Memory rot | “Stale reflections” | Episodic buffer 被过时 entries 填满；用 compaction/TTL 修复 |
| Sleep-time reflection | “Async self-reflection” | 在 hot path 之外运行 Self-Reflector，使 primary agent 保持快速 |

## 延伸阅读
- [Shinn et al., Reflexion: Language Agents with Verbal Reinforcement Learning (arXiv:2303.11366)](https://arxiv.org/abs/2303.11366) 经典 papier
- [Letta, Sleep-time Compute](https://www.letta.com/blog/sleep-time-compute) production 中的异步反射
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) Gérer le tampon épisodique  comme partie du contexte
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) modèle de nœud de réflexion
