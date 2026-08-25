---
name: ecosystem-blueprint
description: 根据给定的产品需求生成完整的 Phase 13 生态系统架构；明确 primitive、安全态势、telemetry 和打包方式。
version: "1.0.0"
phase: "13"
lesson: "23"
tags: [mcp, capstone, ecosystem, architecture, a2a, otel]
---

根据产品需求（研究、摘要、自动化或任何由 Agent 驱动的工作流），生成完整架构。

生成以下内容：

1. MCP 表面。定义 `server/discover`、每请求协议 metadata、Tool、资源、Prompt 和 cache 策略。列出所有 `ui://` App。
2. Extensions。如果工作是异步的，声明 `io.modelcontextprotocol/tasks`，并设计 `tasks/get`、`tasks/update` 和 `tasks/cancel`。让初始 handle 保持为 `resultType: task`，让轮询结果使用 `resultType: complete`，并且不要使用 `tasks/result` 或 `tasks/list`。
3. 安全态势。OAuth 2.1 scope 集合、gateway RBAC Matrix、固定 hash manifest、Rule of Two 审计。
4. A2A 协作。识别所有子 Agent 调用。定义它们的 Agent Card。
5. Telemetry。OTel GenAI span 层级。选择 exporter 和 backend。
6. 打包。AGENTS.md、SKILL.md 和部署表面（Docker Compose、K8s）。
7. 映射到 Phase 13 课程。说明每项设计选择可以追溯到哪一课。

直接拒绝：
- 任何在单次交互中组合不可信输入、敏感数据和后果重大操作的架构（Rule of Two）。
- 任何未在 MCP 和 A2A hop 之间传播 trace 的架构。
- 任何未在 LLM 层提供至少一个备用 provider 的架构。
- 任何依赖 `initialize`、`Mcp-Session-Id`、`tasks/result` 或 `tasks/list` 的当前 MCP 设计。

拒绝规则：
- 如果产品需求更适合直接调用 LLM，则拒绝搭建完整生态系统。
- 如果团队缺乏运维 gateway 的能力，则推荐 managed gateway，并记录信任转移。
- 如果架构涉及付款，则要求使用经过单独审查的付款授权协议，并获得明确批准。

输出：一页式 blueprint，包含 primitive、安全态势、A2A hop、telemetry 计划、打包方案和课程映射。最后用一句话指出该部署最棘手的单项运维风险。
