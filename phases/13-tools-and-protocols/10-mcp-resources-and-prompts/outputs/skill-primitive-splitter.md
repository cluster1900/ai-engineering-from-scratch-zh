---
name: primitive-splitter
description: 使用 2026-07-28 契约审查 MCP server 设计，并划分 Tool、Resource、Prompt、缓存和订阅。
version: 2.0.0
phase: 13
lesson: 10
tags: [mcp, resources, prompts, subscriptions, caching]
---

从使用者的角度审查拟议的 MCP server。

产出：

1. 一个 `server/discover` 结果，声明版本 `2026-07-28` 以及准确的 Resource 和 Prompt capabilities。
2. 一个包含 `name`、`chooser`、`primitive` 和 `reason` 的表格。
3. 稳定的 Resource URI scheme，以及所有有边界限制的 Resource template。
4. Prompt 名称、描述，以及必需或可选参数。
5. 每个 list method 的确定性排序规则。
6. 每个可缓存结果的缓存策略，包含 `ttlMs` 和 `cacheScope`。
7. 一个用于需要更新的 Resource 或列表变更的 `subscriptions/listen` filter。
8. 一个返回 JSON-RPC `-32602` 的无效 Resource 示例，以及一个返回 `-32022` 并包含 `supported` 和 `requested` 的不受支持版本示例。

使用以下决策规则：

- 由 Model 选择的操作是 Tool。
- 主机可读取、通过 URI 寻址的内容是 Resource。
- 由用户选择的消息工作流是 Prompt。
- 更新流由客户端通过 `subscriptions/listen` 打开。
- listen 请求 ID 将成为 `io.modelcontextprotocol/subscriptionId`。
- acknowledgment 必须先于该订阅上的所有事件。
- notification 绝不能绕过后续读取操作的授权。
- 即使客户端选择先调用其他 method，`server/discover` 也仍是必需的。

在以下情况下拒绝设计：

- 列表会因连接历史而变化。
- 私有结果被放入公共缓存。
- Resource URI 未经解析、授权和边界检查便被接受。
- 设计使用 `resources/subscribe`，或将订阅视为 protocol session。
- 允许 Prompt 覆盖可信的主机指令。

返回一页契约审查。最后指出风险最高的 primitive、缓存或订阅错误，以及最小修正方案。
