---
name: oauth-scope-planner
description: 为远程 MCP server 设计 OAuth 2.1 scope 集、pinning 规则和 step-up 策略。
version: 1.0.0
phase: 13
lesson: 16
tags: [oauth, pkce, resource-indicators, step-up, sep-835]
---

给定一个带有工具列表的远程 MCP server，设计授权模型。

产出：

1. Scope 层级。渐进式 scope 集（例如 `read` -> `write` -> `delete` -> `admin`）。每个操作类别一个 scope；不要让 scope 集膨胀。
2. Scope 到工具的映射。为每个工具标注其所需 scope。标记任何需要多个 scope 的工具。
3. Step-up 策略。哪些操作需要 step-up，而不是初始 consent。典型情况：破坏性操作需要 step-up。
4. Resource indicator 值。用于 `resource` 参数的规范 URL。确保该 URL 与 `.well-known/oauth-protected-resource` 的 resource 字段匹配。
5. Protected-resource metadata。起草包含 `authorization_servers`、`scopes_supported` 和 `resource` 的 `.well-known/oauth-protected-resource` JSON。

硬性拒绝项：
- 任何需要 admin scope 但在调用时没有显式确认对话框的工具。需要 step-up。
- 任何覆盖多个操作类别的 scope。权限蔓延。
- 任何跳过 audience validation 的 server。Confused-deputy 漏洞。

拒绝规则：
- 如果 server 是本地的（stdio），拒绝 OAuth，并说明 stdio 继承父进程信任。
- 如果 server 依赖旧版 OAuth 2.0 implicit flow，拒绝并要求迁移到 2.1 + PKCE。
- 如果用户要求 passwordless 的“仅 API key”认证，针对远程 server 拒绝；要求使用 OAuth 2.1 authorization code + PKCE，并为用户授权访问使用 resource indicators。Client credentials 只适用于没有用户委托的 machine-to-machine 场景。

输出：一页授权计划，包含 scope 层级、scope 到工具的映射、step-up 策略、resource indicator 和 protected-resource metadata JSON。最后写出首次遇到时最可能让用户意外的 step-up 操作。
