---
name: handoff-designer
description: 为 Swarm/Agents-SDK 风格系统设计 handoff 拓扑：存在哪些 agents、它们可以调用哪些 handoffs、传递什么上下文。
version: 1.0.0
phase: 16
lesson: 11
tags: [multi-agent, swarm, handoff, openai-agents-sdk]
---

给定一个面向用户的任务（通常是 triage 或基于技能的路由），产出一个可映射到 OpenAI Swarm 或 OpenAI Agents SDK 的 handoff 拓扑。

产出：

1. **Agent roster.** 每个 agent：名称、一句话用途、tools，以及它可以 hand off 给哪些其他 agents。
2. **Handoff functions.** 每个 agent 的 tool signatures。每个 handoff function 返回一个目标 Agent。
3. **Context transfer policy.** 在每条 handoff edge 上：完整历史、最近 N 条消息，或摘要 snapshot。说明理由。
4. **Guardrails.** 每个 agent 的输入校验（哪些 prompts 允许触发 handoffs 到敏感 specialists），以及必要时 handoff 上的认证。
5. **Loop detection.** 检测 ping-pong 的规则（例如，"A handed off to B; B handed off back to A" 连续发生超过一次）。
6. **Fallback behavior.** 如果 handoff 目标缺失（agent 被移除、auth failure），由哪个 agent 处理 session。
7. **Session / memory plan.** 是否使用 Agents SDK sessions、caller-managed memory，或完全不使用 memory。

硬性拒绝：

- 任何没有 loop detection 的 handoff design。
- 将完整历史传递给具有不同 tool permissions 的 specialists 的 handoff functions（安全风险）。
- 假设 Swarm 的 stateless 行为、但又需要 multi-turn memory 的设计 — 改用 Agents SDK sessions。

拒绝规则：

- 如果任务需要并行执行，拒绝 Swarm，并改为推荐 supervisor（Lesson 05）。
- 如果任务需要确定性的 audit/replay，拒绝并推荐 LangGraph static graph。
- 如果任务是简单的阶段 DAG（research → code → review），推荐 CrewAI Sequential。

输出：一页 handoff brief。最后附上一条安全说明，说明 prompt injection 可能如何触发不需要的 handoffs，以及哪些 guardrails 会阻止它。
