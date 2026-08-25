# Hybrid Memory：Vector + Graph + KV

> Hybrid Memory 并行运行三种存储——Vector 用于语义相似度、KV 用于快速事实查找、graph 用于实体关系推理——并通过一个评分层在检索时融合结果。这是外部记忆中广泛使用的生产模式；Mem0（Chhikara et al., 2025）是其中一个参考实现。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT), Phase 14 · 08 (Letta Blocks)
**Time:** ~75 分钟

## 学习目标

- 解释为什么单一存储（仅 Vector、仅 graph 或仅 KV）不足以支持 Agent 记忆。
- 说出 Mem0 的三个并行存储及各自优化的目标。
- 描述 Mem0 的融合评分——相关性、重要性、时效性——并解释为什么它是加权和，而不是层级结构。
- 使用 stdlib 实现一个玩具级三存储记忆系统，其中 `add()` 写入全部三种存储，`search()` 融合结果。

## 问题

对于以下三类查询，总有一类不适合使用单一存储：

- **语义相似度**——“上周我们讨论了哪些关于 Agent 漂移的内容？”Vector 最合适；KV 和 graph 无法命中。
- **事实查找**——“用户的电话号码是什么？”KV 最合适；Vector 会浪费资源，graph 则过于复杂。
- **关系推理**——“哪些客户共享同一个计费实体？”graph 最合适；Vector 和 KV 无法回答。

生产环境中的 Agent 会在同一个 session 中发出全部三类查询。单一存储对于其中两类查询始终不合适。Mem0 的贡献是将三种存储统一接入同一个 `add`/`search` 接口，并使用评分函数融合它们。

## 概念

### 并行的三种存储

Mem0（arXiv:2504.19413，2025 年 4 月）执行 `add(text, user_id, metadata)` 时：

1. 从文本中提取候选事实（由 LLM 驱动的步骤）。
2. 将每条事实写入 Vector store（Embedding），用于语义搜索。
3. 将每条事实写入 KV store，并以 (user_id, fact_type, entity) 为 key，实现 O(1) 查找。
4. 将每条事实以 typed edge 的形式写入 graph store（Mem0g），用于关系查询。

执行 `search(query, user_id)` 时：

1. Vector store 按 Embedding cosine 返回 top-k。
2. KV store 根据从查询推导出的 (user_id, type, entity) key 返回直接命中。
3. Graph store 返回从查询实体可达的 subgraph。
4. 评分层融合三者。

### 融合评分

```
score = w_relevance * relevance(q, record)
      + w_importance * importance(record)
      + w_recency * recency(record)
```

- **相关性**——Vector cosine、KV 精确匹配、graph 路径权重。
- **重要性**——在写入时添加标签或通过学习获得（某些事实更重要，例如姓名、ID、政策）。
- **时效性**——根据距上次写入或读取所经过的时间进行指数衰减。

权重需要针对不同产品进行调优。聊天 Agent 使用更高的 `w_recency`；合规 Agent 使用更高的 `w_importance`；检索 Agent 使用更高的 `w_relevance`。

### Mem0g 与时间推理

Mem0g 增加了冲突检测器。当新事实与现有 edge 冲突时，现有 edge 会被标记为无效，但不会删除。时间查询（“用户在三月份居住在哪座城市？”）会遍历在指定时间有效的 subgraph。

这是 Letta 的失效模式所推广的合规级行为。

### Benchmark 数据

Mem0 论文报告了以下结果（2025）：

- **LoCoMo**（长篇对话记忆）：91.6
- **LongMemEval**（长时间跨度的 episodic memory）：93.4
- **BEAM 1M**（100 万 Token 记忆 benchmark）：64.1

比较 baseline（完整 Context 的 128k LLM、扁平 Vector store、扁平 KV）的得分均低 10 分以上。仅凭 benchmark 不足以证明应当选择某个方案——运行形态才是关键——但这些数字表明，融合设计带来的差异绝非舍入误差。

### Scope 分类

Mem0 按 scope 拆分记忆：

- **User memory**——跨 session 持久存在，以 `user_id` 为 key。
- **Session memory**——在单个 thread 内持久存在。
- **Agent memory**——每个 Agent instance 的状态。

每次写入都必须选择一个 scope。检索可以使用不同 scope 对应的权重跨 scope 查询。未经思考就混合 scope，会导致“助手把 Bob 的项目信息告诉了 Alice”之类的事故。

### 此模式容易出错的地方

- **Embedding 漂移。** 在最初一百次查询中表现良好的 Vector 结果，会随着语料库增长而退化。定期为使用次数最多的前 N 条记录重新生成 Embedding。
- **KV schema 膨胀。** `(user_id, type, entity)` 看起来很简单，直到每个团队都添加自己的 `type`。每季度审计一次 type 集合。
- **Graph 爆炸。** 一个噪声较大的 extractor 每条消息会添加 50 条 edge。限制每次 `add` 调用可执行的 graph 写入数量；丢弃低置信度 edge。

```figure
ae-memory-fusion
```

## 动手构建

`code/main.py` 使用 stdlib 实现三存储模式：

- `VectorStore`——使用朴素的 Token 重叠相似度代替 Embedding。
- `KVStore`——以 `(user_id, fact_type, entity)` 为 key 的 dict。
- `GraphStore`——typed edge（subject、relation、object、valid）。
- `Mem0`——顶层 facade，提供 `add()`、`search()`、融合评分和感知 scope 的检索。
- 一段基于多用户、多 session 对话的完整 trace。

运行：

```
python3 code/main.py
```

输出会展示三条独立的 recall 路径，以及融合后的 top-k。修改 `main()` 顶部的评分权重，观察排序如何变化。

## 实际使用

- **Mem0（Apache 2.0）**——已可用于生产环境。可以使用 Postgres + Qdrant + Neo4j 自行托管，或使用 managed cloud。
- **Letta**——三层 core/recall/archival；可以接入自己的 Vector 和 graph 后端。
- **Zep**——提供 temporal KG 和事实提取能力的商业替代方案。
- **自定义实现**——适用于需要精确控制 extractor（合规场景）或融合权重（时效性占主导的语音 Agent）的情况。

## 交付成果

`outputs/skill-hybrid-memory.md` 可生成三存储记忆 scaffold，并接入融合评分器、scope 分类和时间失效机制。

## 练习

1. 用真实的 Embedding Model（sentence-transformers、Ollama、OpenAI embeddings）替换玩具级 Vector 相似度。在一段合成的长对话上测量 recall@10。经过 1000 次写入后，排序是否发生漂移？
2. 添加时间查询：`search(query, as_of=timestamp)`。只返回在该时间或之前有效的记录。哪一种存储需要完成最多工作？
3. 实现冲突检测器：如果传入事实与某条 graph edge 冲突，则将旧 edge 标记为无效并记录两者。使用“user lives in Berlin” -> “user lives in Lisbon”进行测试。
4. 扩展融合评分器，加入 `user_feedback` 维度（用户对检索记录点赞）。如何防止系统被操纵（Agent 只返回自己已经偏好的记录）？
5. 阅读 Mem0 docs（`docs.mem0.ai`）。将玩具实现移植为使用 `mem0` client 调用。在相同的 20 条测试查询上比较检索质量。

## 关键术语

| 术语 | 人们通常怎么说 | 它的实际含义 |
|------|----------------|------------------------|
| Hybrid memory | “Vector 加 graph 加 KV” | 三种存储并行写入，并在检索时融合 |
| Fact extraction | “记忆摄取” | 将文本拆分为 (entity, relation, fact) tuple 的 LLM 步骤 |
| Fusion scoring | “相关性排序” | 相关性、重要性和时效性的加权和 |
| Scope | “记忆 namespace” | user / session / agent——决定谁能看到什么 |
| Mem0g | “记忆 graph” | 具有时间有效性的 typed edge，用于关系查询 |
| Temporal invalidation | “软删除” | 将冲突 edge 标记为无效；永不删除 |
| Embedding drift | “检索腐化” | Vector 质量随语料库增长而下降；需要定期重新生成 Embedding |

## 延伸阅读

- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413)——原始论文
- [Mem0 docs](https://docs.mem0.ai/platform/overview)——生产 API、SDK 和 managed cloud
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560)——虚拟 Context 的前身
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks)——与之并列的三层设计
