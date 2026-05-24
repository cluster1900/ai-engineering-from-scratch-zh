---
name: memory-auditor
description: 审计 multi-agent system 的 shared-memory 设计，检查 provenance、versioning、verifier separation 和 projection schema。在生产前标记 memory-poisoning 暴露风险。
version: 1.0.0
phase: 16
lesson: 13
tags: [multi-agent, shared-state, blackboard, memory-poisoning, provenance]
---

给定一个 multi-agent codebase 或架构文档，审计 shared-memory 设计并标记 memory poisoning 暴露风险。

产出：

1. **Topology。** 是完整 message pool、按 topic 分区的 blackboard、投影后的 per-agent view，还是 hybrid？命名该 data structure（list、dict、pandas frame、vector store、SQL table）。粗略统计稳定状态下 writers 和 readers 的上限。
2. **Provenance fields。** 每次写入时，entry 是否记录：writer id、timestamp、prompt hash 或 prompt text、tool-call trace、source URI 或 tool name？列出现有字段和缺失字段。
3. **Update model。** log 是 append-only，还是 writers 会原地 mutate？如果存在 mutation，concurrency-control mechanism 是什么（lock、optimistic versioning、none）？修正应当是 supersession entries，而不是原地 edits；标记所有不这样做的设计。
4. **Verifier separation。** 是否有一个拥有独立 source access 的 read-only agent？它能否写入 main pool（不应当能）？它的输出写到哪里？
5. **Projection schema。** 如果设计使用 projections（LangGraph reducers、blackboard topics、role-scoped views），schema 是否有文档？新 agents 如何声明它们消费的 projection？
6. **Poisoning risk score。** 按每个维度打 1-5 分：[provenance completeness]、[supersession over mutation]、[verifier independence]、[projection schema clarity]。任一维度低于 3 分的系统都要被标记。

硬性拒绝项：

- 任何没有标记缺失 verifier 的审计。具备独立 source access 且不可写的 verifier 是关键 mitigation；没有它，其他所有 mitigation 都只是装饰。
- 建议“添加更多 tests”的审计。Tests 无法捕获 memory poisoning，因为 poisoning 会产生能通过 tests 的可信输出。
- 建议把内容 hash 作为唯一 provenance 的审计。hash 告诉你写入了*什么*，而不是*谁*写的，或*来自哪里*。

拒绝规则：

- 如果 codebase 将 shared state 隐藏在外部服务（Redis、Postgres、vector DB）中，且没有 inspection tools，则说明没有 production read access 就无法完成审计。
- 如果系统少于三个 agents，说明 memory poisoning 风险较低，但 provenance 仍然是成本很低的保险。
- 如果系统使用带内置 state management 的 framework（LangGraph checkpointer、AutoGen pool），审计该 framework 的 guarantees，而不是重新推导。

输出：一份两页报告。以一句话摘要开头（“Shared state 是没有 provenance 且没有 verifier 的完整 message pool，poisoning risk 高。”），然后给出上面的六个 sections。最后给出按优先级排序的 action list：三项变更，每项标记为 [critical]、[should] 或 [nice-to-have]，并估算实现时间。
