---
name: tool-registry
description: 构建一个生产级工具目录和注册表，包含 JSON Schema 验证、并行分发和可观测性。
version: 1.0.0
phase: 14
lesson: 06
tags: [function-calling, tools, schema, validation, bfcl, parallel-tools]
---

给定一个任务领域，生成一个 agent 可以在 BFCL V4 各轴（agentic、multi-turn、live、non-live、hallucination）上可靠使用的工具目录。

生成：

1. 工具定义。对每个工具：`name`（snake_case）、`description`（告诉模型何时使用它以及何时不要使用）、带类型属性的 JSON Schema 输入、必填字段、适用时的 enums、数值的 minimum/maximum、每个工具的 timeout、每个工具的 sandbox policy（fs surface、network、memory cap）。
2. description 质量检查。对每个 description 运行“这是否告诉模型何时选择这个工具而不是其他工具？”如果两个工具的 description 重叠，拒绝并重写。
3. 并行分发计划。对每个现实任务，识别哪些工具调用是独立的（可以并行化），哪些必须顺序执行。输出预期的分发图。
4. 验证策略。Enum 检查、类型强制转换规则（例如“接受 int-as-string，拒绝 float-as-string”）、必填字段强制执行。每次失败都返回结构化 observation 字符串，绝不向 loop 抛出异常。
5. 可观测性。每个工具都会发出一个 OpenTelemetry GenAI `tool_call` span，带有属性 `gen_ai.tool.name`、`gen_ai.tool.call.id`、`gen_ai.tool.call.arguments`、`gen_ai.tool.call.result`（当内容策略要求时使用引用，不内联）。

硬性拒绝：

- 通用 shell/command-exec 工具。拒绝并拆分为具体动词（`git_status`、`fs_read`、`npm_test`）。
- 当参数有封闭取值集合时缺少 enums。Enum 验证是捕获 drift 成本最低的方式。
- 两个不同工具使用相同 description。模型无法可靠地在它们之间选择。
- 只说出工具名称的 `description`（“Adds two numbers”）。要包含何时选择它而不是替代项。
- 没有 timeout。每次工具调用都必须有上限。

拒绝规则：

- 如果单个 agent 的工具列表超过 30 个工具，拒绝并建议 subagent delegation（Lesson 17）。
- 如果任何工具在没有 confirmation gate 的情况下执行破坏性操作，拒绝并指向 Lesson 09（permissions、sandboxing）。
- 如果任务是 computer use（click、type、screenshot），拒绝并指向 Lesson 21 —— 那是另一种带有 vision-based actions 的工具形态。

输出：一个可直接粘贴到 Anthropic / OpenAI / Gemini SDK 调用中的 JSON 工具目录、一个 dispatch-graph 图、一个 validation-policy 文档，以及一个注册表应通过的 BFCL 风格 mini-eval。

最后附上“what to read next”指引：Lesson 09（sandboxing）、Lesson 23（OTel GenAI spans）或 Lesson 30（eval-driven）。
