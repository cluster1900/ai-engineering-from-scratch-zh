# Agents génératifs et émergents

> Parque et coll. 2023 (UIST '23, arXiv:2304.03442) Uzh三部分架构填充了 **Smallville**, une boîte à sable contenant 25 agents:**memory stream**(en anglais)**reflection**(agent basé sur son propre flux de production plus haut niveau)**plan**(日级行为,然后是子计划) ―― le résultat de la fête de la Saint-Valentin est l'émergence d'un agent implanté qui veut organiser une fête de la Saint-Valentin, sans plus de scénarios, il a généré une invitation à se propager dans le groupe, coordonnant la journée, et finalement organisant une fête provenant de 24 personnes qui commencent à ne pas connaître cet agent Les accusations montrent que trois composants sont indispensables à la crédibilité Les erreurs du dossier sont des erreurs de norme spatiale dans les magasins fermés, les centres de santé individuels communs.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Phase 16 · 04 (modèle primitif), phase 16 · 13 (mémoire partagée)
**Time:** ~75 minutes

##  problématique

La plupart des systèmes multi-agents sont des équipes strictement scripté: planificateur, élaborer des plans, coder, rédiger des codes, réviser des réviseurs, faire des examens. Ceci est utilisé pour définir des tâches claires. Il est impossible de saisir comme agent les influences, les comportements non scriptés et les effets de la mémoire et de la priorité sur le monde ouvert.

Smallville Architecture est son fondement. Avant Park 2023, le meilleur agent 模拟是浅层脚本跟随者; après cela, ce modèle est devenu l'architecture par défaut des agents génératifs dans le monde ouvert. Si vous construisez un agent 模拟 en 2026, soit en utilisant les trois composants de Smallville, soit vous devez expliquer clairement pourquoi il n'est pas utilisé.

## 概念

### Trois composants

**Memory stream。**Un seul ajout de l'observation, de l'action, de la réflexion et du plan 日志── chaque article a un temps、 un type、 une description ([[langue naturelle]]) et des données de la vie:**recency**- Je suis là.**importance**(agent 自评 1-10)**relevance**(par rapport à la comparaison avec les autres questions)

```
[2026-02-14 09:12:03] observation: Isabella Rodriguez asked me if I like jazz
[2026-02-14 09:14:22] reflection:   I enjoy long conversations about music
[2026-02-14 10:05:00] plan:         Attend Isabella's Valentine's Day party tonight
```

Réservation de mémoire 组合三个分数:`score = w_recency * e^(-decay * age) + w_importance * importance + w_relevance * cos_sim`✿ Top-k 条目 entrer dans le moment présent prompt✿

**Reflection。**周期性地(每 N 条记忆或发生重要事件时),agent De la mémoire récente 生成更高阶综合──Réflexion 条目会写回流,并像其他记忆 一样可检查──这就是代理 构建理解的方式,也就是该架构中长期信念等价──

**Plan。**Autonomie: le plan peut être modifié: lorsque l'observation est contradictoire avec le plan, l'agent va replanifier les parties affectées.

### Pourquoi trois choses importantes ?

Parque et al. ont fait des ablations de l'observation, de la réflexion et du plan.

- Il n' y a pas de**observation**, agent 会错过上下文,并基于过去的信念行动.
- Il n' y a pas de**reflection**,agent ne peut pas former de plus haute croyance; les interactions resteront à basse échelle.
- Il n' y a pas de**plan**Le comportement devient un bruit réactif; l'objectif est de se dissiper.

Le score de crédibilité donné par les évaluateurs humains est le plus élevé de tous les trois composants; en éliminant tout épisode, une décomposition mesurable est produite.

### La journée de la Saint-Valentin

Une agent, Isabella Rodriguez, a été implantée dans le but de donner une fête de la Saint-Valentin au Hobbs Cafe le 14 février à 17h.

1. Le plan d'Isabella inclut d'inviter les autres.
2. Chaque invitation devient une observation dans le flux de mémoire du voisinage.
3. La réflexion du voisin a été créée en croyant qu'Isabella organise une fête.
4. Le plan du voisin est d'assister à la fête le 14 février.
5. Les voisins disent aux autres voisins. Ils invitent à se propager sans coordination centrale.
6. 2 月 14 日下午 5 点, plusieurs agents se sont rassemblés au café Hobbs.

C'est une tendance à venir du point de vue technique: système de comportement (un parti) provient de la communication locale (un invité à deux côtés + un programme individuel), sans orchestrateur central (un orchestre central).

### 文档记录的失败模式

Park et al. 明确记录了:

- **空间规范错误。**L'agent entre dans une boutique fermée. L'agent tente d'utiliser le même hôpital. L'agent n'est pas adapté à la nourriture. Le modèle ne peut être défini que par l'environnement.
- **Memory overflow。**La réaction de la mémoire est une réaction de la mémoire.
- **Reflection hallucination。**Réflexion peut créer un flux de mémoire 中不存在的关系──缓解方式:

Ce sont tous des défauts liés à la production: tout agent de 2026 est censé les hériter.

### 3 组件 réalisation des règles

1. **Memory 是 append-only。**Ne modifiez jamais la mémoire.
2. **Importance 分数要便宜。**写入时调用 LLM 评估 1-10 de l'importance.
3. **Retrieval 是排序，不是过滤。**按组合分数取 Top-k; ne pas utiliser un appareil de traitement dur (will lose on down)
4. **Reflection 周期性运行。**Lorsque l'importance de la mémoire non traitée 总和超过值时触发(exemple 150)。
5. **Plans 可以修订。**Lorsque la nouvelle observation est en contradiction avec le plan, il ne se produit que des fragments affectés, et non l'ensemble du plan.

### Agents génératifs à l'extérieur de Smallville

La littérature ultérieure des années 2024-2026 étend cette structure:

- **用于政策 / 市场研究的 multi-agent 社会模拟。**类 Smallville 群体模拟用户对功能的行为响应──比A/B tests更快; précision est encore en dispute──
- **游戏中的 NPC AI。**Avec un agent de Smallville, le RPG va se produire en ligne de scène, et non en mission de scripting.
- **Generative-agent 评估基准。**L'indicateur n'est plus le taux de précision des tâches, mais la fiabilité + la cohérence des comportements dans le fonctionnement à long terme.

Cette structure est une référence standard, mais conserve trois parties de la structure.

### Pourquoi c' est important pour l' ingénierie multi-agents

Smallville est une preuve de concept: lorsque le composé est correct, l'émergence de plusieurs agents peut être très abordable. Cette architecture est déjà présente sur les modèles open source.**emergent social behavior**Le système de production utilise cette forme.**tight task execution**Le système est utilisé dans cette phase de la supervision / rôle / mode primitifs.


```figure
a5-memory-reflection
```

## - Je le construis.

`code/main.py`Utilisation de la politique de Python et de l'écriture des agents de l'entreprise (en anglais seulement)

- `MemoryStream` 带 récente/importance/relevance récupération  带  日志。
- `reflect(stream)` Réflexion sur la mémoire de haute importance récente 
- `plan(agent_state)`  basé sur les croyances actuelles de jour et heure de plan 
- L'agent 1 émet une fête à 17h commencé

运行:

```
python3 code/main.py
```

预期输出: trace par tirage. Jusqu'à la dernière tirage. 5 agents parmi au moins 3 apparaissent dans le plan, et ils se rassemblent à l'emplacement du parti.

## Utilisez-le

`outputs/skill-simulation-designer.md`Œuvre d'une simulation générative-agent:agent numéros, schémas de mémoire, cadence de réflexion, horizon de plan et métriques d'évaluation

##  La publier

Règles de production:

- **Memory 就是数据库。**Dans la mémoire, le stockage est uniquement adapté au prototype.
- **记录 retrieval trace。**Pour chaque action, le record déplace ses souvenirs top-k.
- **为每个 agent 预算 tokens。**Chaque tique Entraînez chaque agent de récupérer + refléter + plan est O(k) LLM appels;;
- **周期性 compact memory。**Résumé-et-réduction 条目――Rétention politique est la décision de conception, pas les détails.
- **显式检测空间 / 社会规范违规。**L'architecture ne les apprendra pas.

## 练习

1. 运行  référencement`code/main.py`Confirmer que 3+ agents se rassemblent pour la fête.
2. 移除反思步骤──行为会是什么样样? 映射到Park 2023 中的放弃 发现──
3. Klaus veut donner une conférence de recherche à 17h) Agent 会分流, il y a aussi un objectif qui domine ?
4. Le café Hobbs peut accueillir 4 agents.
5. 阅读 Park et al. (arXiv:2304.03442) Section 6 (expériences comportementales émergentes)                                                                                                                                                                                                                                               

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Memory stream | “agent 的日记” | 观察、动作、reflection、plan 的 append-only 日志。 |
| Recency | “这条 memory 有多新” | 按年龄计算的指数衰减分数。 |
| Importance | “agent 有多在意” | 写入时自评 1-10。已缓存。 |
| Relevance | “与当前查询有多相关” | 余弦相似度（Embedding-based）。 |
| Reflection | “更高阶信念” | 从最近 memories 生成的综合，并作为新 memory 重新摄入。 |
| Plan | “日/小时/动作分解” | 自顶向下的 plan tree。当 observation 矛盾时可修订。 |
| Smallville | “Park 2023 的 sandbox” | 产生 Valentine's Day 涌现的 25-agent 模拟。 |
| Believability | “质量指标” | 人类评分者对行为是否像一个可信 agent 的评分。 |

## 延伸阅读

- [Park et al. — Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442) 参考架构
- [UIST '23 paper page](https://dl.acm.org/doi/10.1145/3586183.3606763) 发表场所
- [Smallville code release](https://github.com/joonspk-research/generative_agents) 参考 Python 实现
- [Hayes-Roth 1985 — A Blackboard Architecture for Control](https://www.sciencedirect.com/science/article/abs/pii/0004370285900639) 结构isé des agents de mémoire
