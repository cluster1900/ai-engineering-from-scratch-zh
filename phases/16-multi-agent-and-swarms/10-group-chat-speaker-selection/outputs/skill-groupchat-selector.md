---
name: groupchat-selector
description: 为任务配置 AutoGen/AG2 风格的 GroupChat selector，命名 selector 变体、终止条件和防 hot-speaker 规则。
version: 1.0.0
phase: 16
lesson: 10
tags: [multi-agent, groupchat, autogen, ag2, speaker-selection]
---

给定一个任务和一个 Agent 名单，生成一份 GroupChat 配置：selector 选择、selector 输入、终止规则和 guardrails。

生成：

1. **Selector 变体。** Round-robin（便宜、公平、不了解上下文）、LLM-selected（具备上下文感知、昂贵），或 custom（LLM + rule-based fallback）。
2. **Selector 输入。** 如果是 LLM-selected：最近 N 条消息、Agent 专长、轮次计数。如果是 custom：显式规则。
3. **终止规则。** 最大轮数、TERMINATE Token、goal-reached verifier，或组合。
4. **Hot-speaker 缓解。** 每个 Agent 的轮次上限、selector 输入中的 speaker-balance 分数、连续 K 轮后强制轮换。
5. **上下文膨胀缓解。** Projection 计划（按角色划分的 scoped views）、summarization checkpoints、每个 Agent 的上下文上限。
6. **Observability。** 记录 selector 的输入、selector 的选择、每轮 Agent latency。

硬性拒绝：

- 任何未记录 selector 输入/输出的 LLM-selected 配置。否则调试会变得不可能。
- 没有 max_rounds 上限的配置。
- 推理任务中的对称聊天（无专业分工）——改用 debate（Lesson 07）。

拒绝规则：

- 如果任务有已知 DAG 结构，拒绝 GroupChat，并推荐使用 LangGraph static graph 以获得确定性。
- 如果任务需要严格 audit trails，拒绝 GroupChat；推荐带 checkpointer 的 LangGraph。
- 如果 Agent 数量超过 5-6 个，拒绝扁平 GroupChat，并推荐 nested groups 或 hierarchical pattern。

输出：一页 GroupChat 配置简报。最后给出成本估算（LLM-selected 每轮会产生一次 selector call）。
