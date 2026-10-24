---
id: graphs-knowledge-graphs
title: Graphs and Knowledge Graphs
code: GK
subtitle: 图矩阵、Laplacian 与消息传递、实体链接、关系抽取和混合图记忆。
hue: 160
sources: phases/01-math-foundations/21-graph-theory, phases/05-nlp-foundations-to-advanced/25-entity-linking, phases/05-nlp-foundations-to-advanced/26-relation-extraction-kg, phases/14-agent-engineering/09-hybrid-memory-mem0
source_hash: 3bbbf6cfcfc85a68
---

## 图矩阵
type: concepts
from: phases/01-math-foundations/21-graph-theory/docs/en.md

- **邻接矩阵**：有边时 $A[i][j] = 1$。无向图的邻接矩阵是对称的。
- **度矩阵**：$D$ 是对角阵，对角元是各节点的度。三角形给出 diag(2, 2, 2)。
- **Laplacian**：$L = D - A$。它是半正定的。所有特征值 $\ge 0$。
- **零特征值**：其个数等于连通分量的个数。
- **Fiedler 值**：最小的非零特征值。值小说明存在瓶颈。
- **消息传递**：$H^{(k+1)} = \sigma(A_{\text{norm}} H^{(k)} W)$。$A_{\text{norm}}$ 每行之和为 1。
- **GCN 层**：$\sigma(\hat{D}^{-1/2} \hat{A} \hat{D}^{-1/2} H W)$，带自环 $\hat{A} = A + I$。
- **PageRank**：$(1-d)/n + d \sum \text{score}(u) / \text{out}(u)$，d=0.85。

## 代码中的图任务
type: task-table
span: 2
from: phases/01-math-foundations/21-graph-theory/code/graph_theory.py, phases/01-math-foundations/21-graph-theory/docs/en.md

| 任务 | 代码 |
|---|---|
| 构建图 | `Graph(n_nodes, directed=False)` |
| 添加边 | `add_edge(u, v, weight=1.0)` |
| 跳数距离与访问顺序 | `bfs(graph, start)` 返回 order、distances |
| 查找连通分量 | `connected_components(graph)` |
| 划分为两个簇 | `spectral_clustering(graph, k=2)` |
| 一轮 GNN | `message_passing(graph, features, weight_matrix)` |
| 节点排序 | `pagerank(graph, damping=0.85, max_iter=100, tol=1e-6)` |
| Laplacian 特征值，升序 | `np.linalg.eigvalsh(L)` |

## 用 numpy 做谱划分
type: annotated-code
lang: python
from: phases/01-math-foundations/21-graph-theory/docs/en.md

```python
D = np.diag(A.sum(axis=1))                       # degree matrix
L = D - A                                        # Laplacian
eigenvalues, eigenvectors = np.linalg.eigh(L)    # ascending order
eigenvalues[1]                                   # Fiedler value
fiedler = eigenvectors[:, 1]                     # Fiedler vector
group_a = np.where(fiedler >= 0)[0]              # one cluster
group_b = np.where(fiedler < 0)[0]               # the other cluster
G = nx.karate_club_graph()                       # 34 nodes, 78 edges
nx.number_connected_components(G)
nx.pagerank(G)                                   # node importance
```

## 从文本到知识图谱
type: flow
from: phases/05-nlp-foundations-to-advanced/26-relation-extraction-kg/docs/en.md, phases/05-nlp-foundations-to-advanced/25-entity-linking/docs/en.md

1. **NER**：找出文本中的实体提及。
2. **共指消解**：在 RE 之前把 "he" 解析到正确的实体。
3. **实体链接**：把每个提及映射到一个 KB id。
4. **关系抽取**：输出带片段位置的 (subject, relation, object) 三元组。
5. **校验**：把三元组的每个元素与原文匹配。拒绝没有依据的三元组。
6. **本体映射**：把关系映射到规范 id，例如 `P108` employer。
7. **载入图**：每个三元组连同其 doc id 和字符区间一起存储。

## 链接一个提及
type: flow
from: phases/05-nlp-foundations-to-advanced/25-entity-linking/docs/en.md, phases/05-nlp-foundations-to-advanced/25-entity-linking/code/main.py

1. **别名索引**：查找小写化后的提及。典型索引给出 10-30 个候选。
2. **没有候选**：`disambiguate` 返回 `None, 0.0`。
3. **上下文得分**：上下文 token 与描述 token 的 Jaccard 重叠。
4. **先验**：得分为来自 `PRIORS` 的 `jac + 0.1 * prior`。
5. **Embedding 方案**：用 [MENTION] 标签标出片段。选余弦最大的。
6. **NIL**：没有匹配的 KB 条目。对最高分设阈值。
7. **合并**：每个共指簇只保留一个 KB id。

## 抽取、校验、构建
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/26-relation-extraction-kg/code/main.py

```python
def verify(triples, text):
    verified = []
    for t in triples:
        s, e = t["span"]
        if text[s:e] != t["evidence"]:          # span must match the source
            continue
        verified.append(t)
    return verified

triples = extract(doc)                          # regex PATTERNS, one P id each
graph = build_graph(verify(triples, doc))       # subject to relation, object
for rel, obj, ev in graph.get("Tim Cook", []):  # ev is the source sentence
    if rel == "P169":                           # CEO of
```

## 混合记忆：Mem0
type: architecture
from: phases/14-agent-engineering/09-hybrid-memory-mem0/docs/en.md, phases/14-agent-engineering/09-hybrid-memory-mem0/code/main.py

```arch
node | add | 1,2 | add() | text, user_id, metadata | client
node | vec | 2,1 | VectorStore | semantic similarity | store
node | kv | 2,2 | KVStore | user_id, fact_type, entity | store
node | graph | 2,3 | GraphStore | typed edges, valid flag | store
node | fuse | 3,2 | Fusion score | relevance, importance, recency | process
node | out | 4,2 | search() | fused top_k |
edge | add | vec |
edge | add | kv |
edge | add | graph |
edge | vec | fuse | cosine
edge | kv | fuse | exact hit
edge | graph | fuse | subgraph
edge | fuse | out |
```

## Mem0Config 与默认值
type: defaults
from: phases/14-agent-engineering/09-hybrid-memory-mem0/code/main.py, phases/14-agent-engineering/09-hybrid-memory-mem0/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `w_relevance` | 0.6 | 检索型 agent 可调高 |
| `w_importance` | 0.2 | 合规型 agent 可调高 |
| `w_recency` | 0.2 | 聊天型 agent 可调高 |
| `recency_halflife_s` | 86400.0 | 每过一个半衰期新近度减半 |
| `importance` | 0.5 | 添加时设置在每条记录上 |
| `scope` | user | 或 session、agent |
| `top_k` | 5 | 向量检索先取 3 倍数量 |
| KV 命中相关度 | 0.4 | 仅 KV 记录的固定相关度 |

## 失败与修复
type: troubleshooting
from: phases/05-nlp-foundations-to-advanced/25-entity-linking/docs/en.md, phases/05-nlp-foundations-to-advanced/26-relation-extraction-kg/docs/en.md, phases/14-agent-engineering/09-hybrid-memory-mem0/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 高频实体总是胜出 | 流行度偏差 | 在领域数据上微调 |
| 正确实体从未被打分 | 候选召回低 | 先测量 mention recall @ 30 |
| 新名字被链到错误实体 | 提及不在 KB 中 | 预测 NIL |
| "He founded Apple" 丢失 | RE 之前没做共指消解 | 先运行共指消解 |
| 文本不支持的三元组 | LLM 幻觉 | 对照原文校验每个片段 |
| 图无法查询 | Open IE 关系漂移 | 合并到规范 id |
| 向量召回下降 | 语料增长导致 embedding 漂移 | 重新嵌入最常用的 top-N 记录 |
| 每条消息 50 条边 | 抽取器噪声大 | 限制每次 `add` 调用的图写入数 |

## 缩写
type: glossary
from: phases/01-math-foundations/21-graph-theory/docs/en.md, phases/05-nlp-foundations-to-advanced/25-entity-linking/docs/en.md, phases/05-nlp-foundations-to-advanced/26-relation-extraction-kg/docs/en.md, phases/14-agent-engineering/09-hybrid-memory-mem0/docs/en.md

- **BFS / DFS**：用队列的广度优先，用栈的深度优先。都是 $O(V + E)$。
- **GCN**：图卷积网络。带对称归一化的消息传递。
- **EL**：实体链接。把提及映射到唯一的 KB 条目。
- **KB**：知识库。Wikidata、Wikipedia、DBpedia 或领域 KB。
- **NIL**：预测没有匹配的 KB 条目。
- **RE**：关系抽取。从文本得到 (subject, relation, object) 三元组。
- **AEVS**：Anchor-Extraction-Verification-Supplement。经片段校验的抽取。
- **Open IE**：任何动词短语都是关系。召回高，精度低。
- **Mem0g**：带时间有效性的类型化边，用于关系查询。

## 问答
type: qa
from: phases/01-math-foundations/21-graph-theory/docs/en.md, phases/05-nlp-foundations-to-advanced/25-entity-linking/docs/en.md, phases/14-agent-engineering/09-hybrid-memory-mem0/docs/en.md

- **为什么用 BFS 求跳数距离？** 在无权图中，节点的 BFS 层级就是其最短路径。
- **Fiedler 向量如何划分？** 正分量归入一个簇，负分量归入另一个。
- **K 轮消息传递能看到什么？** 每个节点的 K 跳邻域。
- **为什么报告两个 EL 数字？** 候选召回 80% 时 99% 的消歧准确率，整条 pipeline 只有 80%。
- **为什么把边标记为失效？** 时间查询遍历在该时刻有效的子图。
- **为什么要三个记忆存储？** 单一存储对三类查询中的两类都不合适。

## 技巧
type: tips
from: phases/01-math-foundations/21-graph-theory/docs/en.md, phases/05-nlp-foundations-to-advanced/26-relation-extraction-kg/docs/en.md, phases/05-nlp-foundations-to-advanced/25-entity-linking/docs/en.md, phases/14-agent-engineering/09-hybrid-memory-mem0/docs/en.md

- 生产中用 networkx。用从零实现的代码理解它在做什么。
- 给每个三元组附上来源字符区间和 doc id。
- 合并之前，把 open IE 关系映射到封闭本体上。
- 把 60-80% 的工程量预留给规范化。
- 给有时间边界的关系加上 `P580` 开始时间和 `P582` 结束时间。
- 在 AIDA-CoNLL 上报告 KB 内准确率（`P@1`）和 NIL 检测率。
- 每次记忆写入只选一个范围：user、session 或 agent。
