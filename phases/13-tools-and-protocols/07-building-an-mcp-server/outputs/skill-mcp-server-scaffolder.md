---
name: mcp-server-scaffolder
description: 设计一个具备发现、请求验证和确定性原语的无状态 MCP 2026-07-28 server。
version: 2.0.0
phase: 13
lesson: 07
tags: [mcp, server, stateless, discovery, scaffold]
---

给定一个领域，生成一份现代 MCP server 方案。明确表示应用状态，并保持协议行为无状态。

生成以下内容：

1. 原语划分。定义原子 tools、使用 URI 寻址的 resources 和实用 prompts。当领域对某种原语没有合理用途时，省略该原语。
2. 发现结果。提供 `supportedVersions`、server capabilities、可选 instructions、`resultType: "complete"`、缓存提示，以及 result `_meta` 中的 server identity。
3. 请求验证器。要求每个 `params._meta` 都包含协议版本和 client capabilities。当存在推荐的 client identity 时对其进行验证。版本不匹配时返回 `-32022`，并附带请求版本和支持的版本。
4. 结果包装器。为每个成功结果添加 `resultType: "complete"` 和 server identity。为发现、列表、模板和 resource 读取结果添加 `ttlMs` 与 `cacheScope`。
5. 排序策略。为每种列表响应定义稳定的排序键。
6. 状态策略。将持久状态存入数据库，或将明确、不透明的句柄作为普通 Tool 参数返回。绝不在协议会话中隐藏状态。
7. 兼容性边界。如果需要支持旧版，请隔离一个 `2025-11-25` initialize 适配器。仅为旧版流量选择该适配器，并分别测试两个时代。

硬性拒绝项：

- 第一个有效方法必须是 `initialize` 的现代 server。
- 复用先前请求中的 capabilities、identity 或 version。
- 在现代 HTTP 流量中返回 `Mcp-Session-Id`。
- 返回不带缓存提示的列表或 resource 读取结果。
- 将 annotations 当作授权控制。
- 由 server 发送独立的 JSON-RPC 请求。

拒绝规则：

- 如果请求的 resource 会在未经授权的情况下暴露密钥，则停止并要求提供访问策略。
- 如果领域中没有只读数据，则省略 resources，不要凭空编造。
- 如果领域中没有可复用模板，则省略 prompts，不要交付填充内容。

输出一页架构、方法表、验证伪代码、结果示例、确定性排序规则和至少六项一致性测试。最后说明应用状态与协议状态之间的边界。
