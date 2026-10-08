# Réponses à la question

> Le bloc décide ce que le référentiel peut voir. Une fois que la frontière est erronée, aucun modèle intégré, référentiel ou LLM ne peut être réparé en bas de la ligne.

**Type:** Build
**Languages:** Python
**Prerequisites:** 第 11 阶段课程 04（嵌入）、06（RAG）、07（高级 RAG）；第 19 阶段 B 轨基础（第 20-29 课）
**Time:** ~90 分钟

## Objectif de l'apprentissage
- Depuis le début, la mise en œuvre de cinq stratégies de blocage: fenêtre fixe, phrase, répartition, synonymes et marquages structurels.
- Dans le cadre de la rédaction de la revue, le nombre de rédacteurs est de plus de 500 personnes.
- 读取块长度分布并识别每个策略注入的故障模式: isolation句子、中间符号剪切、仅标题块、语义漂移──
-  En examinant trois attributs pour sélectionner la valeur par défaut de la nouvelle bibliothèque de langage, il n'est pas nécessaire de réaliser un test de base: type de document, longueur moyenne de la section et structure de format.

##  problématique

Chaque tuyau RAG coupe d'abord le fichier source en un morceau: un morceau doit être petit pour pouvoir le placer dans un modèle, mais aussi grand pour supporter une idée indépendante.

 seulement lorsque la conservation de la pièce suspenduevalue est disponible, la requête  budgétaire suspenduevalue est de quel type                                                                                                                                                                                                                                              

Le cours comporte cinq stratégies, les mettez sur une base de texte fixe avec des réponses étiquetées en or et laissez-vous lire vous-même.

## 概念

```mermaid
flowchart LR
  Doc[Source Document] --> S1[Fixed Window]
  Doc --> S2[Sentence]
  Doc --> S3[Recursive Split]
  Doc --> S4[Semantic Cluster]
  Doc --> S5[Structural Markdown]
  S1 --> Chunks1[Chunks]
  S2 --> Chunks2[Chunks]
  S3 --> Chunks3[Chunks]
  S4 --> Chunks4[Chunks]
  S5 --> Chunks5[Chunks]
  Chunks1 --> Index[Embedding Index]
  Chunks2 --> Index
  Chunks3 --> Index
  Chunks4 --> Index
  Chunks5 --> Index
  Index --> Eval[Recall@k vs Gold Spans]
```

### Ventile fixe

蛮力基线── chaque N 个字符 est coupé une fois──可选地重叠, de sorte que dans la position N 处剪切的句子完整地出现从位置 N 开始的块内 - 重叠──快速、确定性、边界糟糕──, et non pas par défaut, être utilisé comme un élément de contrôle──

### 句子

Utiliser une expression ordinaire ou un simple état de l'état de l'écriture pour diviser les phrases en un seul et même bloc.

### 递归分割

L'écriture est une structure de type type type type, qui est très adaptée aux documents structurels, car elle doit être ajustée en fonction de la région.

### 语义聚类

嵌入每句子──将共享主题质心的连续句句聚类──每当与质心的运行相似度下降到值以下时就进行切割──边界反映了意义,而不是字符──construction速度较慢,依赖于嵌入模型,但对于在段落内切换主题的文档具有弹性──

###  structurée Markdown 标题

Pour les documents ayant une structure définie (Markdown, RestructuredText, RFC, Numeration de la section), veuillez effectuer des coupes à la limite des titres. Chaque section contient le titre et tout ce qui en suit, jusqu'à ce que le titre suivant soit identique ou plus haut de gamme.

### recall@k 如何衡量边界选择

Après avoir examiné les éléments de l'enregistrement, vous vous demandez: les éléments de l'enregistrement de l'enregistrement sont-ils en surpoids avec l'enregistrement de l'enregistrement de l'enregistrement de l'enregistrement.


```figure
ci-chunk-boundaries
```

## - Je le construis.

`code/main.py`实现:

- `fixed_window(text, size, overlap)`- Je suis là.
- `sentence_chunks(text, target)`- Je suis un homme de guerre.
- `recursive_split(text, separators, target)`- Une fois de plus.
- `semantic_chunks(text, similarity_threshold)`- les classes de qualités fondées sur les modèles de détermination
- `structural_markdown(text)`- Le premier à se séparer.
- `mock_embed(text, dim)`- basé sur l'intégration de hash, le cycle peut donc fonctionner hors ligne.
- `DenseIndex`- la même forme que celle utilisée dans le cours de recherche mixte de la 19e étape de la voie B.
- `eval_recall(strategy, corpus, queries, k)`- Comparé au cycle.
- `main()`, dans l'appareil 语料库上运行每个策略并印回忆@k 表。

Je vais le faire.

```bash
python3 code/main.py
```

输出是一个小表,每个策略一行,每个 k 一列──句子策略在结构化 fixture上失败──结构化 Markdown 在 Markdown fixture上胜──递归策略在混合 fixture上有一席之地,因为递归会自适应──语义聚类在没有有用结构线索的散文 fixture上胜──

## Mode de décès caché

**孤立句子。**句打包会产生错过主题句的块──然后嵌入指向错误的──

**中间符号剪切。**Le code ou la fenêtre fixe de YAML divisera l'identifiant en deux parties.

**仅包含标题的 chunk。** Structured Markdown 会发发出只包含 `## Title`Il y a une partie de ce contenu, ou il y a un autre élément.

**语义漂移。**Lorsque le matériel de référence est concentré sur un sujet, le groupe de référence est affaibli. Les blocs de 5000 caractères constituent une multitude de réponses spécifiques.

**过时的嵌入。**语义聚类使用嵌入模型──如果改模型,你也将改块──将块模型与检索模型分开固定,或一起重建索引──

## 选择默认值而不运行基准测试 选择默认值而不运行基准测试 选择默认值而不运行基准测试 选择默认值而不运行基准测试 选择默认值而不运行基准测试

Trois attributs décident des blocs par défaut de la nouvelle bibliothèque de langage:

|属性 |值|默认|
|----------|-------|---------|
|文件类型|没有结构的散文 |递归分割，目标 800 |
|文件类型| Markdown / RFC / API 文档 |结构化 Markdown |
|文件类型|代码| AST 感知（超出范围；请参阅第 19 阶段第 02 课）|
|段落长度|长而单一的主题 |句子，目标500 |
|段落长度|简短、混合的主题 |语义，阈值 0.6 |

Si vous avez des questions, veuillez choisir le processus de décomposition.

## Utilisez-le

Mode de production:

- Avant de publier un nouveau pipeline, évaluer le fonctionnement; ne vous fiez pas aux stratégies de votre bibliothèque.
- Chaque fois que vous modifiez votre modèle ou votre ensemble de bases de données, veuillez réutiliser l'évaluation; le gagnant dépend de la base de données de données.
- Le nom de la stratégie sera conservé dans les données de chaque bloc afin que vous puissiez le retrouver plus tard.

## 发货

Le système RAG utilise ici le dispositif de sélection des blocs comme premier élément.`eval_recall`返回的相同形状中读取recall@k。选择在你的语料库中获胜策略并将其向前推进──

## 练习

1. 添加第六种策略: utiliser `tiktoken`Il est préférable de comparer la fenêtre de jeton au lieu de la fenêtre de chiffrement avec la fenêtre fixe sur le même fixture.
2. Pour les autres, il est important de mettre 30% des blocs de code dans le fichier de texte.
3. Les investissements de détermination seront remplacés par des investissements de détermination provenant d'un fournisseur réel de projet.
4. Pour chaque bloc 添加一个`summary`字段: 一句质心描述──重新运行 eval,并将摘要附加到块主体──测量召回提升──

## 关键术语

|术语 |人们怎么说|它实际上意味着什么 |
|------|-----------------|------------------------|
|recall@k | “我们拿到正确 chunk 了吗？” |任何前 k 个 chunk 与 gold answer span 重叠的查询比例 |
|块重叠| “滑动窗口”|将前一个块的最后 N 个字符重新包含在下一个块中 |
|结构分割器| “标题感知块” |在 H1/H2/H3 边界处切分；标题文本也是 chunk 的一部分 |
|语义分块器 | “主题感知块” |嵌入句子、按质心相似度聚类、漂移剪切 |
|质心漂移| 「话题转移」|运行平均值与下一个句子之间的余弦相似度下降超过阈值 |

##  ultérieur

- [LongRAG: Enhancing Retrieval-Augmented Generation with Long-context LLMs (arXiv 2406.15319)](https://arxiv.org/abs/2406.15319)
- [人择、上下文检索](https://www.anthropic.com/news/contextual-retrieval)
- [LlamaIndex，生产组块策略 RAG](https://docs.llamaindex.ai/en/stable/optimizing/production_rag/)
- 第 11 阶段 第 06 课 - RAG 基础知识
- 第11 阶段 第07 课 - Haut niveau RAG
- 19ème étape 65ème étape - Recherche mixte de classement des blocs générés
- 19° étape 68° - outil d' évaluation de la sélection des stratégies de production
