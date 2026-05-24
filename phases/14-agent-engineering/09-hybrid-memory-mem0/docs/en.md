# Hybrid Memory: Vector + Graph + KV (Mem0)

> Mem0 (Chhikara et al., 2025) 将记忆视为三个并行存储：Vector 用于语义相似性，KV 用于快速事实查找，Graph 用于实体关系推理。一个评分层会在检索时融合三者。这是 2026 年外部记忆的生产标准。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT), Phase 14 · 08 (Letta Blocks)
**Time:** ~75 minutes

## 学习目标
- 解释为什么单一存储（仅 Vector、仅 Graph、仅 KV）不足以支撑 agent 记忆。
- 说出 Mem0 的三个并行存储，以及每个存储优化的目标。
- 描述 Mem0 的融合评分：相关性、重要性、近期性，并解释为什么它是加权和，而不是层级结构。
- 用 stdlib 实现一个玩具级三存储记忆，其中 `add()` 写入全部三个存储，`search()` 融合结果。

## 问题
对于三类查询中的某一类，单一存储总会出错：

- **语义相似性** — “上周我们关于 agent drift 讨论了什么？”Vector 胜出；KV 和 Graph 会漏掉。
- **事实查找** — “用户的电话号码是什么？”KV 胜出；Vector 浪费资源，Graph 过于复杂。
- **关系推理** — “哪些客户共享同一个 billing entity？”Graph 胜出；Vector 和 KV 无法回答。

生产环境中的 agents 会在同一个 session 中发出全部三类查询。单一存储记忆对其中两类总是不合适。Mem0 的贡献，是把三者接到一个统一的 `add`/`search` 表面之后，并用评分函数融合它们。

## 概念
### 三个并行存储

Mem0 (arXiv:2504.19413, April 2025) 在 `add(text, user_id, metadata)` 时：

1. 从文本中提取候选事实（一个 LLM 驱动的步骤）。
2. 将每个事实写入 Vector store（Embedding），用于语义搜索。
3. 将每个事实写入 KV store，以 (user_id, fact_type, entity) 为 key，用于 O(1) 查找。
4. 将每个事实作为 typed edges 写入 Graph store (Mem0g)，用于关系查询。

在 `search(query, user_id)` 时：

1. Vector store 按 Embedding cosine 返回 top-k。
2. KV store 返回基于查询派生的 (user_id, type, entity) key 的直接命中。
3. Graph store 返回可从查询实体到达的 subgraph。
4. 一个评分层融合三者。

### Fusion scoring

```
score = w_relevance * relevance(q, record)
      + w_importance * importance(record)
      + w_recency * recency(record)
```

- **相关性** — Vector cosine、KV 精确匹配、Graph path weight。
- **重要性** — 在写入时打标签或学习得到（某些事实更重要：姓名、ID、政策）。
- **近期性** — 基于距离上次写入或读取的时间做指数衰减。

权重按产品调优。聊天 agents 使用更高的 `w_recency`；合规 agents 使用更高的 `w_importance`；检索 agents 使用更高的 `w_relevance`。

### Mem0g 与 temporal reasoning

Mem0g 增加了冲突检测器。当新事实与现有 edge 矛盾时，现有 edge 会被标记为 invalid，但不会删除。时间查询（“用户三月份住在哪个城市？”）会遍历在指定时间有效的 subgraph。

这是 Letta 的 invalidation pattern 所泛化出的合规级行为。

### Benchmark numbers

Mem0 paper 报告了以下结果（2025）：

- **LoCoMo**（长篇对话记忆）：91.6
- **LongMemEval**（长时间跨度 episodic memory）：93.4
- **BEAM 1M**（1M-token 记忆 benchmark）：64.1

对比 baselines（full-context 128k LLM、flat vector store、flat KV）都落后 10+ 分。仅靠 benchmark 不能证明选择合理，运营形态才是关键，但这些数字说明融合设计不是舍入误差。

### Scope taxonomy

Mem0 按 scope 划分记忆：

- **用户记忆** — 跨 sessions 持久化，以 `user_id` 为 key。
- **Session 记忆** — 在一个 thread 内持久化。
- **Agent 记忆** — 每个 agent instance 的状态。

每次写入都会选择一个 scope。检索可以用每个 scope 的权重跨 scopes 查询。不加思考地混合 scopes，正是“assistant 把 Bob 的项目告诉了 Alice”这类事故的来源。

### 这个模式容易出错的地方

- **Embedding drift.** Vector 结果在前一百个查询上看起来正确，但会随着 corpus 增长而退化。为 top-N-used records 添加周期性 re-embedding。
- **KV schema creep.** `(user_id, type, entity)` 看起来简单，直到每个团队都加入自己的 `type`。每季度审计 type 集合。
- **Graph explosion.** 一个噪声 extractor 每条 message 添加 50 条 edges。限制每次 `add` 调用的 graph 写入数；丢弃低置信度 edges。

## 构建它
`code/main.py` 用 stdlib 实现三存储模式：

- `VectorStore` — 用朴素 token-overlap similarity 作为 Embedding 替身。
- `KVStore` — 以 `(user_id, fact_type, entity)` 为 key 的 dict。
- `GraphStore` — typed edges（subject, relation, object, valid）。
- `Mem0` — 顶层 facade，包含 `add()`、`search()`、fusion scoring 和 scope-aware retrieval。
- 一个多用户、多 session 对话的完整 trace。

运行：

```
python3 code/main.py
```

输出会显示三条独立 recall paths，以及融合后的 top-k。修改 `main()` 顶部的 scoring weights，观察排名如何变化。

## 使用它
- **Mem0 (Apache 2.0)** — 生产就绪。可用 Postgres + Qdrant + Neo4j 自托管，也可使用 managed cloud。
- **Letta** — 三层 core/recall/archival；自带 Vector 和 Graph backends。
- **Zep** — 商业替代方案，带 temporal KG 和 fact extraction。
- **Custom builds** — 当你需要对 extractor（合规）或 fusion weights（近期性占主导的 voice agents）做精确控制时。

## 交付它
`outputs/skill-hybrid-memory.md` 会生成一个三存储记忆 scaffold，其中接入 fusion scorer、scope taxonomy 和 temporal invalidation。

## 练习
1. 将玩具级 Vector similarity 替换为真实 Embedding model（sentence-transformers、Ollama、OpenAI embeddings）。在合成长对话上测量 recall@10。排名会在 1000 次写入后 drift 吗？
2. 添加时间查询：`search(query, as_of=timestamp)`。只返回在该时间或之前有效的 records。哪个存储需要最多改动？
3. 实现冲突检测器：如果传入事实与 graph edge 矛盾，invalidate 旧 edge，并同时记录两者。在 “user lives in Berlin” -> “user lives in Lisbon” 上测试。
4. 扩展 fusion scorer，加入 `user_feedback` 维度（对检索 records 点赞）。你如何防止 gaming（agent 只返回它已经喜欢过的 records）？
5. 阅读 Mem0 docs (`docs.mem0.ai`)。把玩具实现移植为 `mem0` client calls。在相同的 20 个测试查询上比较检索质量。

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
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) — 原始 paper
- [Mem0 docs](https://docs.mem0.ai/platform/overview) — 生产 API、SDKs、managed cloud
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) — virtual-context 前身
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) — 三层 sibling design
