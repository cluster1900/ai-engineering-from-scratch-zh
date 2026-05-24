---
name: hybrid-memory
description: 生成一个 Mem0 形态的三存储记忆系统（Vector + KV + Graph），包含 fusion scorer、scope taxonomy 和 temporal invalidation。
version: 1.0.0
phase: 14
lesson: 09
tags: [memory, mem0, vector, graph, kv, fusion, scope]
---

给定一个目标 runtime、一个 Vector backend（Qdrant、pgvector、Chroma、sqlite-vec）、一个 KV backend（Postgres、Redis、dict）和一个 Graph backend（Neo4j、in-memory edges），生成一个融合式记忆系统。

产出：

1. 三个 store classes，位于 `add(text, user_id, session_id, scope, importance, tags)` facade 之后。写入时，extractor 会将 `text` 分解为 records、KV triples 和 graph triples。任何 store 都不是可选项。
2. 一个 fusion scorer：`score = w_rel * relevance + w_imp * importance + w_rec * recency`。将全部三个权重暴露为 config。按产品调优，而不是按调用调优。
3. Scope taxonomy：`user`、`session`、`agent`。检索必须遵守 scope。用户查询绝不能泄露其他用户的 records。
4. Temporal invalidation。矛盾会将旧 edges/records 标记为 invalid；绝不删除。为历史查询暴露 `search(query, as_of=timestamp)`。
5. 一个 extractor interface。默认可以由 LLM 驱动；允许使用确定性的 regex fallback 进行测试。限制每次 `add()` 的 graph edges 数量，以防止爆炸。

硬性拒绝：

- 将单一存储记忆描述为 “Mem0-shaped”。仅 Vector、仅 KV、仅 Graph 的产品都可以成立，但它们不是 hybrid memory。不要误命名。
- 没有 per-scope weights 或显式 `scope=` filter 的跨 scope 检索。Scope leak 是合规和隐私事故。
- 矛盾时删除。应 invalidate 并打 timestamp。删除会隐藏 bug，并破坏审计。

拒绝规则：

- 如果用户要求 “no importance weighting”，拒绝。对百万 records 做 flat relevance ranking 是迟早会发生的检索失败。
- 如果 Graph backend 没有 conflict detector，拒绝称生成的系统为 “Mem0-shaped”。降低命名级别。
- 如果产品涉及 PII（医疗、法律、HR），拒绝在 extractor 未经产品负责人审计的情况下发布。

输出：每个 store 一个文件，外加 `memory.py`（facade）、`config.py`（weights）、`README.md`，说明 fusion weights、scope policy、extractor contract 和 invalidation semantics。结尾用 “what to read next” 指向：如果 agent 需要学习新技能，读 Lesson 10；如果 memory ops 需要 OTel spans，读 Lesson 23；如果检索涉及 untrusted-input handling，读 Lesson 27。
