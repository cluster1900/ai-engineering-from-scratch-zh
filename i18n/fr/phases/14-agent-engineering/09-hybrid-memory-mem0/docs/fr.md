# Mémoire hybride: vecteur + graphe + KV (Mem0)

> Mem0 (Chhikara et coll., 2025) va considérer la mémoire comme trois lignes de stockage: vecteur utilisé pour la synonymie, KV utilisé pour la recherche rapide de faits, graphe utilisé pour la théorie de relations physiques.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT), Phase 14 · 08 (Letta Blocks)
**Time:** ~75 minutes

## Objectif de l'apprentissage
- 解释为什么单一存储(仅矢量、仅图、仅KV) est insuffisant pour financer l'agent 记忆──
- Définir les trois mémoires de stockage, ainsi que l'objectif d'optimisation de chaque stockage.
- 描述 Mem0的融合评分:相关性,重要性,近期性,并解释为什么它是加权和,而不是层级结构──
- Avec un peu de temps, je peux réaliser un jeu de trois mémoires de stockage, parmi lesquelles`add()`写入全部三个存储,`search()`Le résultat de la fusion

##  problématique
Pour une catégorie de trois types de requêtes, un seul stockage a été émis:

- **语义相似性**                                                                                                                                                                                                                                                              
- **事实查找**    用户的电话号码是什么? KV 胜出; Vecteur 浪费资源,Graph 过复杂──
- **关系推理**   quels clients partagent la même entité de facturation?Graphe 胜出; Vector 和 KV 无法回答──

Les agents de l'environnement de production vont envoyer toutes les trois catégories de requêtes en même séance.`add`- Je suis là.`search`表面后,并使用评分函数融合它们──

## 概念
### 3 dépôts

Mem0 (arXiv:2504.19413, avril 2025) Location:`add(text, user_id, metadata)`时:

1. Une procédure de candidature à l'LLM
2. Pour chaque fact write into Vector store, utilisez le langage de recherche.
3. Pour chaque fact write into KV store,以 (user_id, fact_type, entity) comme clé, pour O(1) 查找。
4. Pour chaque facteur, il faut saisir les bornes de la page.

Dans le`search(query, user_id)`时:

1. Vétorial stockage 按 Embedding cosine 返回 top-k。
2. KV store 返回基于查询派生的 (user_id, type, entité) clé de la décision directe.
3. magasin de graphes  retour à la recherche de l'objet jusqu'à la sous-graphe de l'objet
4. Une évaluation de la composition de l'équipe

### Scoring de fusion

```
score = w_relevance * relevance(q, record)
      + w_importance * importance(record)
      + w_recency * recency(record)
```

- **相关性** Vétérons cosine, KV, précision, poids de la trajectoire du graphique,
- **重要性** Dans l'écriture, on peut trouver des informations ou des informations sur certains faits plus importants:
- **近期性**  Réduction de l'indice en fonction de la distance entre les heures d'écriture ou de lecture précédentes.

权重按产品调优──聊天代理 使用更高的 `w_recency`; agents de conformité`w_importance`; agents de recherche`w_relevance`Il y a une autre.

### Mem0g et le raisonnement temporel

Mem0g  augmenté le contrôleur de conflit.  Lorsque les nouveaux faits sont en contradiction avec les avantages actuels, les avantages actuels seront marqués comme non valides, mais ne seront pas supprimés.

C'est le modèle d'invalidation de Letta qui a été généralisé.

### Numéros de référence

Rapport du mémoire 报告了以下结果(2025):

- **LoCoMo**(长篇对话记忆): 91.6
- **LongMemEval**(长时间跨度 mémoire épisodique): 93.4
- **BEAM 1M**(indice de référence de mémoire)

Pour les lignes de base, les résultats de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de

### Taxonomie de portée

Mem0 按范围 划分记忆:

- **用户记忆**  跨会议 持久化,以 `user_id`Pour la clé.
- **Session 记忆** Dans un fil, dans une durée de vie.
- **Agent 记忆** État de chaque instance d'agent

Chaque fois que vous écrivez, vous choisissez un champ de travail. La recherche peut être utilisée pour chaque champ de travail.

### Cette façon est facile à trouver

- **Embedding drift.**Le résultat vectoriel semble exact sur les 100 premières requêtes, mais se répertorie avec le corpus de croissance et de déformation.
- **KV schema creep.** `(user_id, type, entity)`Ça a l'air simple, jusqu'à ce que chaque équipe se joigne à la sienne.`type`◊ Type de vérification de chaque trimestre 集合。
- **Graph explosion.**Un extracteur de bruit pour chaque message, 50 bordes.`add`调用图 写入数;丢弃低置信度边缘──


```figure
ae-memory-fusion
```

## - Je le construis.
`code/main.py`Udddlib 实现三存储模式:

- `VectorStore` Utilisation de la similitude simple de la superposition des symboles 作为 Embedding 替换.
- `KVStore` 以 `(user_id, fact_type, entity)`Pour le dicton de la clé.
- `GraphStore` bordes typées(objet, relation, objet, valide)
- `Mem0` 顶层 facade,包含 `add()`- Je suis là.`search()`、Précédents de fusion 和 récupération consciente de la portée
- Une session multi-utilisateurs pour suivre la conversation.

运行:

```
python3 code/main.py
```

输出会显示三条独立回忆路,以及融合后的上-k---修改 `main()`顶部的分分权,观察排名如何变化──

## Utilisez-le
- **Mem0 (Apache 2.0)** 生产就绪──可用 Postgres + Qdrant + Neo4j 自托管, également utilisable dans le cloud géré──
- **Letta** trois niveaux de noyau/reprise/archivage;
- **Zep** 商业替代方案,带时间KG 和 fact extraction
- **Custom builds** Lorsque vous avez besoin de contrôler précisément les poids de l'extracteur (conférence) ou de la fusion (résistance à la pression)

## Je le livre.
`outputs/skill-hybrid-memory.md`Il va générer un échafaudage de mémoire de trois réserves, qui comprend le scorer de fusion, la taxonomie de la portée et l'invalidation temporelle.

## 练习
1. Pour les autres, il est possible de modifier le modèle de conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de la conception de conception de conception de conception de conception.
2. 添加时间查询:`search(query, as_of=timestamp)` Retourner uniquement les dossiers valides à ce moment ou auparavant.
3. 实现冲突检测器: si传入事实与图边缘 矛盾,invalidate 旧边缘,并同时记录两者──在 user vit à Berlin -> user vit à Lisbonne 上测试──
4. 扩展 fusion scorer,加入 `user_feedback`Comment empêcher les jeux de hasard ?
5. 阅读 Mem0 docs (`docs.mem0.ai`)¬                                                                                                                                                                                                                                                              `mem0`Les appels clients sont effectués sur 20 enquêtes de test similaires.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Hybrid memory | “Vector plus graph plus KV” | 三个并行写入的存储，在检索时融合 |
| Fact extraction | “Memory ingestion” | 将文本拆解为 (entity, relation, fact) tuples 的 LLM 步骤 |
| Fusion scoring | “Relevance ranking” | 相关性、重要性、近期性的加权和 |
| Scope | “Memory namespace” | user / session / agent，决定谁能看到什么 |
| Mem0g | “Memory graph” | 带时间有效性的 typed edges，用于关系查询 |
| Temporal invalidation | “Soft delete” | 将矛盾 edges 标记为 invalid；绝不删除 |
| Embedding drift | “Retrieval rot” | Vector 质量随 corpus 增长而下降；周期性 re-embed |

## 延伸阅读
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) papier original
- [Mem0 docs](https://docs.mem0.ai/platform/overview) Produire des API, des SDK, du cloud géré
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) contexte virtuel 前身
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) Design de trois couches
