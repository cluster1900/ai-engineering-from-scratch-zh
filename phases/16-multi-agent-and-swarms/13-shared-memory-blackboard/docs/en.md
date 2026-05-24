# Shared Memory 和 Blackboard 模式

> 2026 年的 Multi-Agent 系统中并存两种方法：**message pool**（所有人都能看到所有人的消息，如 AutoGen GroupChat 或 MetaGPT）和**带 subscription 的 blackboard**（Agent 订阅相关事件，如 Context-Aware MCP 或 Matrix framework）。两者都是 Multi-Agent 系统中唯一有状态的部分 — 这意味着有趣的 bug 也都藏在这里。参考故障模式是 **memory poisoning**：一个 Agent 幻觉出一个“事实”，其他 Agent 把它当作已验证内容，准确性逐渐衰减，而且这种衰减比立即崩溃更难 debug。本课会用 stdlib 构建这两种结构，注入一次 poisoning attack，并展示三种在生产中真正有效的缓解措施。

**类型：** Learn + Build
**语言：** Python（stdlib，`threading`）
**先修：** Phase 16 · 04（Primitive Model），Phase 16 · 09（Parallel Swarm Networks）
**时间：** 约 75 分钟

## 问题

Multi-Agent 系统需要一个地方让 Agent 共享事实。一个字面上的选项是“把所有内容都通过消息传递” — 但这相当于用额外复制重新发明共享状态。另一个选项是“给所有人一个全局日志” — 但全局日志会无限增长，而且很容易被 poison。第三个选项是“为每个 Agent 投影一个 view” — 可扩展，但 schema 很重。

当其中一个 Agent 产生幻觉并把幻觉写入共享状态时，之后每个读取该状态的下游 Agent 都会把这个幻觉当作事实。等人类注意到时，推理链已经深入五步，而根因是写入的第三条消息。debug Multi-Agent 准确性衰减比 debug 崩溃更难。

这就是 memory poisoning。它是 MAST taxonomy（Cemri et al., arXiv:2503.13657）中第二多被记录的故障家族，而且它是结构性的：任何没有 provenance 和不可写 verifier 的 shared-memory 设计，最终都会表现出这个问题。

## 概念

### 两种主要拓扑

**Full message pool。** 每个 Agent 读取每条消息。AutoGen GroupChat 和 MetaGPT 使用这种方式。简单、透明、可检查，但无法扩展到超过约 10 个 Agent，因为每个 Agent 的上下文都会被其他 Agent 的工作填满。

```
agent-A ──write──▶ ┌────────────────┐ ◀──read── agent-D
                   │ message pool   │
agent-B ──write──▶ │                │ ◀──read── agent-E
                   │ (global log)   │
agent-C ──write──▶ └────────────────┘ ◀──read── agent-F
```

**带 subscription 的 Blackboard。** Agent 声明自己感兴趣的 topics；底层 substrate 只路由相关消息。CA-MCP（arXiv:2601.11595）和 Matrix decentralized framework（arXiv:2511.21686）使用这种方式。扩展性更强，但需要预先设计 schema，才能让 subscriptions 有意义。

```
                   ┌─ topic: prices ──┐
agent-A ──pub────▶ │                  │ ──▶ agent-D (subscribed)
                   ├─ topic: orders ──┤
agent-B ──pub────▶ │                  │ ──▶ agent-E (subscribed)
                   ├─ topic: alerts ──┤
agent-C ──pub────▶ │                  │ ──▶ agent-F (subscribed)
                   └──────────────────┘
```

### 各自适用场景

- **Full pool** 适合 Agent 数量少（< 10）、角色异构、对话是短周期的情况。当所有人都能看到所有内容时，推理“谁说了什么”非常直接。
- **Blackboard** 适合 Agent 数量多、角色同质但实例众多（swarms）、对话长期运行的情况。Routing 能节省 Token 成本并减少上下文污染。

生产系统通常混合使用：顶部使用一个小型 full pool（planning layer），下方使用 blackboards（worker layer）。

### 一个 memory poisoning 场景

三个 Agent 执行一个研究任务。Agent A 是 retrieval agent。Agent B 是 summarizer。Agent C 是 analyst。

1. A 获取一个页面，并向共享状态写入消息：“The study reports a 42% accuracy improvement.”
2. 被获取的页面实际写的是 “4.2% improvement.” A 幻觉出了小数点。
3. B 读取共享状态后写入：“Large 42% accuracy gain reported (source: A).”
4. C 读取共享状态后写入：“Recommend adoption — 42% lift is transformative.”
5. 最终报告引用了一个从未存在过的 42% 数字。

没有 Agent 崩溃。没有测试失败。系统“工作正常”。这个幻觉通过共享状态，从一个 Agent 的上下文进入了每个下游 Agent 的推理中。

### 为什么这是结构性问题

没有共享状态时，Agent A 的幻觉会留在 A 的上下文中。下游 Agent 会重新获取或重新推导，可能会发现错误。有了天真的共享状态后，A 的上下文变成了所有人的上下文，幻觉被洗成了事实。

问题不在共享状态本身 — 而在于共享状态**没有 provenance，也没有独立 verifier**。三种缓解措施可以处理这个问题：

1. **每次写入都标注 provenance。** 共享状态中的每个 entry 都记录是谁写入、何时写入、在什么 prompt 下写入，以及（如适用）Agent 引用了什么 source。下游 Agent 根据 provenance 带着怀疑读取。
2. **对写入做 versioning；把它们视为 append-only。** 修正是一个新的 entry，用来 supersede 旧 entry，而不是原地更新。audit trail 会被保留。
3. **至少保留一个无法写入共享状态的 Agent。** read-only verifier agent 抽样 entries、重新获取 sources，并标记不一致。因为它不能写入 pool，所以它不会被 pool poison。

### Blackboard 先例（Hayes-Roth, 1985）

Blackboard 模式比 LLM agents 早了四十年。Hayes-Roth（1985，“A Blackboard Architecture for Control”）描述了专家 Knowledge Sources：它们观察一个全局 blackboard，贡献 partial solutions，并触发其他 sources。2026 年的 blackboard（CA-MCP、Matrix）是同一种模式，只是用 LLM agents 作为 Knowledge Sources，用 JSON blobs 作为 partial solutions。旧文献已经记录了 write contention、opportunistic control 和 consistency 的解决方案，而现代系统正在重新发现它们。

### Projection vs full view

纯 blackboard 会给每个 subscriber 相同的 projection（按 topic 限定）。更激进的设计是 **per-agent projection**：每个 Agent 得到一个按其角色定制的 view。LangGraph 的 state reducers 是 2026 年的规范实现 — reducer function 将 global state 折叠为 role-specific slice。

Per-agent projection 扩展性更强，但需要 schema。没有 schema 时，你会在每个 Agent 的 prompt 中重新构建 ad-hoc projection。

### Write-contention 模式

多个 Agent 同时写入是一个 concurrency 问题，不只是 LLM 问题。三种模式有效：

- **Sequential writer（single producer）。** 所有写入都通过一个 coordinator agent 串行化。简单，但会成为瓶颈。
- **带 versioning 的 optimistic concurrency。** 每个 entry 都有 version；writer 在 version mismatch 时失败并重试。经典数据库技术。
- **Topic partitioning。** 不同 Agent 拥有不同 topics。没有跨 topic contention。需要设计好的 partition boundaries。

大多数 2026 年框架默认使用 sequential writer，因为 LLM 调用足够慢，使得 contention 很少见，而瓶颈影响不大。

### 不可写 verifier

最关键的缓解措施是 read-only verifier。实现规则：

- Verifier 与团队共享状态（读取 blackboard 或 pool）。
- Verifier 没有共享状态的 write handle — 只能写入单独的 verification channel。
- Verifier 独立获取 writes 中引用的 sources。标记分歧。
- Verifier 自己的输出会被路由给人类或单独的 decision agent，绝不反馈回 pool。

没有这种隔离时，verifier 的输出会成为 pool 中的新 entries，这意味着被 poison 的 pool 会 poison verifier，而 verifier 又会 poison 它自己的 verifications。

## 构建它

`code/main.py` 用 stdlib Python 实现了两种拓扑，以及一个 toy poisoning attack 和三种缓解措施。

- `MessagePool` — 线程安全的 append-only log，支持完整读出。
- `Blackboard` — 按 topic keyed 的 pub/sub，支持 per-agent subscriptions。
- `ProvenanceEntry` — 每次写入都记录（writer、timestamp、prompt_hash、source_uri）。
- `PoisoningScenario` — 运行一个三 Agent 研究任务，其中 Agent A 幻觉出小数点。打印最终报告。
- `Verifier` — 一个 read-only Agent，会重新获取 sources 并标记不一致。在 verifier 存在的情况下运行同一场景。

运行：

```
python3 code/main.py
```

预期输出：
- Run 1（无 verifier）：幻觉出的 42% 会传播到最终报告。
- Run 2（有 verifier）：verifier 标记不一致，pool 被标记为 “flagged”，最终报告包含 retraction。

## 使用它

`outputs/skill-memory-auditor.md` 是一个 skill，用于审计任何 Multi-Agent 系统的 shared-memory 设计，检查 provenance、versioning 和 verifier separation。在新的 Multi-Agent 架构进入生产前运行它。

## 发布它

对于任何 shared-memory 设计：

- 每次写入都记录 provenance：`(writer, timestamp, prompt_hash, tool_calls_cited, source_uri)`。
- 让日志保持 append-only。Corrections 是引用被 supersede entry 的新 entries。
- 部署至少一个具有独立 source access 的 read-only verifier agent。
- 将 verifier output 路由到单独 channel，而不是回到 shared pool。
- 记录 supersessions 在 writes 中的比例 — 比例上升是 hallucination patterns 的早期证据。

## 练习

1. 运行 `code/main.py`。确认 run 1 会传播幻觉，而 run 2 会捕获它。
2. 添加第二个幻觉：agent B 编造一个 dataset size。verifier 应该能捕获两者，而不需要针对任一情况手工调优。
3. 将 full pool 切换为带 topic partitions（`prices`、`summaries`、`analyses`）的 blackboard。Topic partitioning 会让哪些 poisoning scenarios 更难实施，又对哪些没有帮助？
4. 阅读 Hayes-Roth（1985，“A Blackboard Architecture for Control”）。找出论文中本课未讨论、但 2026 年系统会受益的两个 control patterns。
5. 阅读 CA-MCP（arXiv:2601.11595）。将其 Shared Context Store 映射到 `code/main.py` 中的 MessagePool 或 Blackboard class。CA-MCP 在其上额外增加了哪些 primitives？

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Message pool | “Shared chat history” | 每个 Agent 都会读取的 append-only log。完全透明，但扩展性差。 |
| Blackboard | “Shared workspace” | 按 topic keyed 的 pub/sub。Agent 订阅相关 topics。扩展更远。 |
| Provenance | “谁写了什么” | 每次写入的 metadata：writer、timestamp、prompt、sources。 |
| Memory poisoning | “幻觉在扩散” | 一个 Agent 的错误进入共享状态，下游 Agent 将其当作事实。 |
| Append-only | “没有原地更新” | Corrections 是用来 supersede 的新 entries。保留 audit trail。 |
| Unwritable verifier | “Independent auditor” | read-only Agent，会重新获取 sources 并标记不一致。 |
| Projection | “Scoped view” | 从 global state 计算出的 per-agent view。LangGraph reducers 是规范案例。 |
| Knowledge Source | “Specialist agent” | Hayes-Roth 在 1985 年对 blackboard participant 的称呼。 |

## 延伸阅读

- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) — MAST taxonomy；memory poisoning 是 coordination-failure 的一个子家族
- [CA-MCP — Context-Aware Multi-Server MCP](https://arxiv.org/abs/2601.11595) — 用于协调 MCP servers 的 Shared Context Store
- [Matrix — decentralized multi-agent framework](https://arxiv.org/abs/2511.21686) — 基于 message-queue 的 blackboard，没有 central orchestrator
- [LangGraph state and reducers](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — 生产中的 per-agent projection 模式
- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — 来自生产部署的 provenance 和 verification notes
