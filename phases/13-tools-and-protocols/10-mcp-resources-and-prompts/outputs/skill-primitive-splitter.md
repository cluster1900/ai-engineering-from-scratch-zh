---
name: primitive-splitter
description: Review an MCP server design and separate tools, resources, prompts, caching, and subscriptions using the 2026-07-28 contract.
version: 2.0.0
phase: 13
lesson: 10
tags: [mcp, resources, prompts, subscriptions, caching]
---

从使用方的角度审查拟议的 MCP 服务器。

请给出：

1. 一个 `server/discover` 结果，声明协议修订版 `2026-07-28`，以及准确的资源与提示词能力。
2. 一张包含 `name`、`chooser`、`primitive` 和 `reason` 的表格。
3. 稳定的资源 URI 格式，以及有明确边界的资源模板。
4. 提示词的名称、描述，以及必填或可选参数。
5. 每个列表方法的确定性排序规则。
6. 每项可缓存结果的缓存策略，包括 `ttlMs` 和 `cacheScope`。
7. 针对需要更新的资源或列表变化，给出 `subscriptions/listen` 过滤器。
8. 一个返回 JSON-RPC `-32602` 的无效资源示例，以及一个返回 `-32022`、包含 `supported` 和 `requested` 的不支持修订版示例。

采用以下判断规则：

- 由模型选择的操作是工具。
- 可由宿主读取、通过 URI 寻址的内容是资源。
- 由用户选择的消息工作流是提示词。
- 更新流由客户端通过 `subscriptions/listen` 打开。
- 监听请求的 ID 成为 `io.modelcontextprotocol/subscriptionId`。
- 确认响应必须先于该订阅上的所有事件。
- 通知绝不能绕过后续读取的授权检查。
- 即使客户端选择先调用其他方法，`server/discover` 仍是必需的。

出现以下情况时，否决设计：

- 列表内容因连接历史而变化。
- 私有结果被放入公共缓存。
- 未经解析、授权和边界检查就接受资源 URI。
- 设计使用 `resources/subscribe`，或将订阅视为协议会话。
- 允许提示词覆盖可信的宿主指令。

返回一页契约审查报告。最后指出风险最高的原语、缓存或订阅错误，以及最小修正方案。
