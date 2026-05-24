---
name: durable-execution-review
description: 审查一个拟议的长时间运行 Agent 部署是否具备正确的持久化执行形态（activities、determinism、checkpoint backend、human-input state、HITL-on-resume）。
version: 1.0.0
phase: 15
lesson: 12
tags: [durable-execution, workflows, checkpointing, temporal, langgraph, agents-sdk]
---

给定一个拟议的长时间运行 Agent 部署（Temporal + OpenAI Agents SDK、带 PostgreSQL checkpointer 的 LangGraph、Microsoft Agent Framework、Claude Code Routines、Cloudflare Durable Objects，或内部等价方案），请根据持久化执行模式审计该设计。

产出：

1. **Activity inventory.** 列出每一个 Activity（LLM call、tool call、HTTP request、file write）。对每一个 Activity，确认它都被封装为带有 retry policy、timeout 和 idempotency key 的 Activity。Activity envelope 之外的原始 LLM 调用是可靠性漏洞。
2. **Workflow determinism.** 识别 Workflow 代码中的每一个非确定性读取（wall clock、random、external state）。每一个都必须注册为 side-effect Activity，这样 replay 才会返回相同值。隐藏的 non-determinism 是 replay drift 最常见的原因。
3. **Checkpoint backend.** 说明 backend（PostgreSQL、SQLite、Redis、Durable Objects）。确认它能在部署后继续存在。SQLite 仅用于 dev。Redis 需要 AOF 或 snapshot config。Cloudflare Durable Objects 是透明的，但需要唯一 key 纪律。
4. **Human-input state.** 确认 HITL 暂停是一等 Workflow state，而不是 polling loop。Workflow 应该阻塞在外部 signal 上（approval queue、webhook、`interrupt()` primitive），并在 approval 到达时精确恢复。
5. **HITL-on-resume policy.** 对于 crash 后的任何 resume，说明在执行下一个 Activity 之前是否需要 fresh HITL。没有这一点，持久化执行加上 crash 前授予的 approval，可能会在 context 已经改变时重新触发已批准的动作。对长周期任务来说至关重要。

硬性拒绝：
- Agent SDK 使用中，LLM 调用未被封装为 Activities。
- Checkpoint backends 无法在部署后继续存在。
- Workflows 中Embedding wall clock 或 random，却没有 Activity wrapping。
- Human-input 被建模为 polling loop，而不是 signal。
- 长周期 runs（一小时以上）没有 HITL-on-resume policy。
- 没有在 durability 之上叠加 budget kill switch（Lesson 13）的 runs。

拒绝规则：
- 如果用户提出的 durable Workflow 对带 side effects 的 Activities 没有显式 idempotency，则拒绝并要求先提供 idempotency keys。否则 retries 会重复执行。
- 如果用户无法展示 replay test（运行 Workflow、中途 crash、replay、断言没有重复 side effects），则拒绝，并要求在生产前提供该测试。
- 如果用户提出一个没有 HITL checkpoint 的 24 小时无人值守 run，则拒绝。35-minute degradation（Lesson 12 notes）使这成为可靠性问题，即使 durability 本身是正确的。

输出格式：

返回一份 design-review memo，包含：
- **Activity table**（activity、retry policy、timeout、idempotency key）
- **Determinism audit**（非确定性读取，以及每个读取如何处理）
- **Checkpoint backend**（name、survives-deploy y/n、replay-test status）
- **HITL state 形态**（first-class state / polling / missing）
- **HITL-on-resume policy**（明确说明，并给出 rationale）
- **就绪度**（production / staging / research-only）
