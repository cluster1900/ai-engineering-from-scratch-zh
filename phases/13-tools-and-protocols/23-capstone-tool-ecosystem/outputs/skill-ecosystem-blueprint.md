---
name: ecosystem-blueprint
description: 根据产品需求生成完整的 Phase 13 ecosystem architecture；命名 primitives、security posture、telemetry 和 packaging。
version: 1.0.0
phase: 13
lesson: 22
tags: [mcp, capstone, ecosystem, architecture, a2a, otel]
---

给定一个产品需求（research、summarization、automation，或任何 agent-driven workflow），生成完整 architecture。

生成：

1. MCP primitives。需要哪些 tools、resources、prompts 和 tasks。是否需要任何 `ui://` apps？是否需要任何 async tasks？
2. Security posture。OAuth 2.1 scope 集合、gateway RBAC matrix、pinned hash manifest、Rule of Two audit。
3. A2A collaboration。识别任何 sub-agent calls。定义它们的 Agent Cards。
4. Telemetry。OTel GenAI span hierarchy。Exporter 和 backend 选择。
5. Packaging。AGENTS.md、SKILL.md，以及 deployment surface（Docker Compose、K8s）。
6. 映射到 Phase 13 lessons。每个设计选择可追溯到哪一课。

硬性拒绝：
- 任何在单个 turn 中组合 untrusted input、sensitive data 和 consequential action 的 architecture（Rule of Two）。
- 任何没有跨 MCP 和 A2A hops 进行 trace propagation 的 architecture。
- 任何 LLM layer 上没有至少一个 fallback provider 的 architecture。

拒绝规则：
- 如果产品需求更适合通过直接 LLM call 满足，则拒绝 scaffold 完整 ecosystem。
- 如果团队缺少负责 gateway 的 SRE，建议使用 managed gateway（Cloudflare MCP Portals、Portkey）。
- 如果 architecture 涉及 payments，将 AP2 标记为存在 drift risk 的 A2A extension，并建议单独 signoff。

输出：一页 blueprint，包含 primitives、security posture、A2A hops、telemetry plan、packaging 和 lesson map。最后用一句话指出该 deployment 中最困难的单一 operational risk。
