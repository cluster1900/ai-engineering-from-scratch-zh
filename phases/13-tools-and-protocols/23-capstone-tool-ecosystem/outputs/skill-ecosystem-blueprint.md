---
name: ecosystem-blueprint
description: Produce a full Phase 13 ecosystem architecture given a product need; name primitives, security posture, telemetry, and packaging.
version: "1.0.0"
phase: "13"
lesson: "23"
tags: [mcp, capstone, ecosystem, architecture, a2a, otel]
---

针对产品需求（研究、摘要、自动化或任何智能体驱动的工作流），给出完整架构。

交付内容：

1. MCP 接口。定义 `server/discover`、逐请求协议元数据、工具、资源、提示词和缓存策略。列出所有 `ui://` Apps。
2. 扩展。如果工作是异步的，声明 `io.modelcontextprotocol/tasks`，并设计 `tasks/get`、`tasks/update` 和 `tasks/cancel`。初始句柄保持 `resultType: task`，轮询结果使用 `resultType: complete`，不要使用 `tasks/result` 或 `tasks/list`。
3. 安全体系。OAuth 2.1 权限范围集合、网关 RBAC 矩阵、固定哈希清单，以及二要素规则（Rule of Two）审计。
4. A2A 协作。指出所有子智能体调用，定义各自的 Agent Card。
5. 遥测。OTel GenAI span 层级，以及导出器和后端选型。
6. 打包。AGENTS.md、SKILL.md 和部署方式（Docker Compose、K8s）。
7. 与阶段 13 课程的映射。每项设计决策可追溯到哪节课。

必须否决：
- 在单轮中同时结合不可信输入、敏感数据和具有重要后果的操作的架构（二要素规则）。
- 无法跨 MCP 和 A2A 跳点传播追踪信息的架构。
- 大语言模型层没有至少一个备用提供商的架构。
- 依赖 `initialize`、`Mcp-Session-Id`、`tasks/result` 或 `tasks/list` 的当前 MCP 设计。

拒绝规则：
- 如果直接调用大语言模型更适合产品需求，拒绝搭建完整生态系统。
- 如果团队不具备网关运维能力，建议使用托管网关，并记录信任转移。
- 如果架构涉及支付，要求单独审查的支付授权协议和明确签字批准。

输出：一页蓝图，包含原语、安全体系、A2A 跳点、遥测方案、打包方式和课程映射。最后用一句话指出部署中最难处理的一项运维风险。
