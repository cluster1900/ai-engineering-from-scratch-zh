# MCP Gateways and Registries — 企业控制平面

> 企业不能允许每个 dev 随意安装随机 MCP servers。gateway 会集中 auth、RBAC、audit、rate limiting、caching 和 tool-poisoning detection，然后把合并后的工具表面作为单个 MCP endpoint 暴露出去。Official MCP Registry（Anthropic + GitHub + PulseMCP + Microsoft，namespace-verified）是规范 upstream。本课说明 gateway 的位置，走查一个最小实现，并概览 2026 年 vendor 格局。

**Type:** Learn
**Languages:** Python (stdlib, minimal gateway)
**前置要求:** Phase 13 · 15 (tool poisoning), Phase 13 · 16 (OAuth 2.1)
**Time:** ~45 minutes

## 学习目标

- 解释 MCP gateway 所在的位置（位于 MCP clients 与多个 backend MCP servers 之间）。
- 实现五项 gateway 职责：auth、RBAC、audit、rate limit、policy。
- 在 gateway 层强制执行 pinned-tool-hash manifest。
- 区分 Official MCP Registry 与 metaregistries（Glama、MCPMarket、MCP.so、Smithery、LobeHub）。

## 问题

一家 Fortune 500 公司有 30 个已批准的 MCP servers、5000 名 developers、compliance 和 audit 要求，以及一个希望集中化 policy 的安全团队。让每个 developer 在自己的 IDE 中安装任意 servers 是不可接受的。

gateway 模式：

1. Gateway 作为 developers 连接的单个 Streamable HTTP endpoint 运行。
2. Gateway 持有每个 backend MCP server 的凭据。
3. 每个 developer request 都通过 gateway 自己的 OAuth 进行认证并限定 scope。
4. Gateway 将调用路由到 backend server，同时应用 policy。
5. 所有调用都会记录用于 audit。

Cloudflare MCP Portals、Kong AI Gateway、IBM ContextForge、MintMCP、TrueFoundry、Envoy AI Gateway 都在 2025-2026 年发布了 gateways 或 gateway 功能。

与此同时，Official MCP Registry 作为规范 upstream 启动：curated、namespace-verified、reverse-DNS 命名的 servers，gateway 可以从中拉取。Metaregistries（Glama、MCPMarket、MCP.so、Smithery、LobeHub）会聚合来自多个来源的 servers。

## 概念

### 五项 gateway 职责

1. **Auth.** OAuth 2.1 用于识别 developer；映射到用户角色。
2. **RBAC.** 每用户 policy：哪些 servers、哪些 tools、哪些 scopes。
3. **Audit.** 记录每次调用的 who、what、when、result。
4. **Rate limit.** 按用户 / 工具 / server 设置上限，防止滥用。
5. **Policy.** 拒绝 poisoned descriptions，强制执行 Rule of Two，脱敏 PII。

### Gateway 作为单个 endpoint

对 developers 来说，gateway 看起来像一个 MCP server。内部则路由到 N 个 backends。Session ids（Phase 13 · 09）会在边界处重写。

### Credential vaulting

Developers 永远看不到 backend tokens。Gateway 持有它们（或代理到持有它们的 identity provider）。在 gateway 上拥有 `notes:read` 的 developer 可以传递式访问 notes MCP server，并使用 gateway 自己的 backend credentials，但前提是受绑定该传递式访问的 policy 约束。

### Gateway 上的 tool-hash pinning

Gateway 持有一个已批准工具描述的 manifest（SHA256 hashes）。在 discovery 时，它获取每个 backend 的 `tools/list`，将 hashes 与 manifest 比较，并移除任何描述已发生变化的工具。这是 Phase 13 · 15 中的 rug-pull 防御，被集中应用。

### Policy-as-code

高级 gateways 使用 OPA/Rego、Kyverno 或 Styra 表达 policy。像“用户 `alice` 只能在 org `acme` 的 repos 上调用 `github.open_pr`”这样的规则会以声明式方式编码。简单 gateways 使用手写 Python。两种形态都有效。

### Session-aware routing

当用户的 session 包含混合 servers 时，gateway 会进行 multiplex：developer 的单个 MCP session 持有 N 个 backend sessions，每个 server 一个。来自任何 backend 的 notifications 都会通过 gateway 路由到 developer 的 session。

### Namespace merging

Gateways 会合并来自所有 backends 的工具 namespaces，通常在冲突时加前缀。`github.open_pr`、`notes.search`。这让路由没有歧义。

### Registries

- **Official MCP Registry (`registry.modelcontextprotocol.io`).** 在 Anthropic、GitHub、PulseMCP、Microsoft 的 stewardship 下启动。Namespace-verified（reverse-DNS：`io.github.user/server`）。已针对基本质量预过滤。
- **Glama.** 以搜索为中心的 metaregistry，聚合许多来源。
- **MCPMarket.** 偏商业的目录，带 vendor listings。
- **MCP.so.** 社区目录；开放提交。
- **Smithery.** Package-manager-style 安装流程。
- **LobeHub.** 在其 LobeChat app 中 UI-integrated 的 registry。

企业 gateways 默认从 Official Registry 拉取，允许 admin-curated 的 metaregistries 追加项，并拒绝任何未 pinned 的内容。

### Reverse-DNS naming

Official Registry 要求 public servers 使用 reverse-DNS 名称：`io.github.alice/notes`。Namespaces 防止 squatting，并让信任委托更清晰。

### Vendor 概览，2026 年 4 月

| Vendor | Strength |
|--------|----------|
| Cloudflare MCP Portals | Edge-hosted；OAuth integrated；free tier |
| Kong AI Gateway | K8s-native；细粒度 policy；记录到 OpenTelemetry |
| IBM ContextForge | 企业 IAM；compliance；audit export |
| TrueFoundry | 偏 DevOps；metrics-first |
| MintMCP | 面向 developer-platform |
| Envoy AI Gateway | Open-source；可自定义 filters |

Phase 17（production infrastructure）会更深入讲解 gateway operations。

## 使用它

`code/main.py` 提供一个约 150 行的最小 gateway：用假的 Bearer token 认证 users，持有每用户 RBAC policy，将 requests 路由到两个 backend MCP servers，把每次调用写入 audit log，强制执行 rate limit，并拒绝任何描述 hash 与 pinned manifest 不匹配的 backend tool。

需要关注：

- `RBAC` dict 以 `user_id` 为 key，包含允许的 `server_tool` entries。
- `AUDIT_LOG` 是仅追加的事件列表。
- Rate limit 使用按用户的 token bucket。
- Pinned manifest 是 `server::tool -> hash` 的 dict。

## 交付它
本课产出 `outputs/skill-gateway-bootstrap.md`。给定一个企业 MCP plan（users、backends、compliance），该 skill 会生成 gateway configuration spec。

## 练习

1. 运行 `code/main.py`。以允许的用户发起一次调用；再以不允许的用户发起一次调用；再发起一次超过 rate-limit 的 burst。验证三个流程。

2. 添加一个 policy，在结果返回给 client 之前脱敏 PII。对 SSN 形状的字符串使用简单 regex pass；记录缺口（emails、phone numbers）。

3. 扩展 audit log，使其发出 OpenTelemetry GenAI spans。Phase 13 · 20 覆盖确切 attributes。

4. 为一个 50 人 developer team 设计 RBAC policy，包含五个 backends（notes、github、postgres、jira、slack）。谁获得各项 read-only？谁获得 write？

5. 从头到尾阅读 Cloudflare enterprise MCP 文章。识别一个 Cloudflare 已提供、而这个 stdlib gateway 没有的功能。

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Gateway | “MCP proxy” | clients 和 backends 之间的集中化 server |
| Credential vaulting | “Backend tokens stay server-side” | Developers 永远看不到 upstream tokens |
| Session-aware routing | “Multi-backend session” | Gateway 为每个 developer session multiplex N 个 backend sessions |
| Tool-hash pinning | “Approved manifest” | 每个已批准工具描述的 SHA256；集中阻断 rug-pulls |
| RBAC | “Per-user policy” | 面向 tools 和 servers 的 role-based access control |
| Policy-as-code | “Declarative rules” | 在 gateway 执行的 OPA/Rego、Kyverno、Styra policies |
| Audit log | “Who, what, when” | 用于 compliance 的仅追加事件日志 |
| Rate limit | “Per-user token bucket” | 防止滥用的每分钟上限 |
| Official MCP Registry | “Canonical upstream” | `registry.modelcontextprotocol.io`，namespace-verified |
| Reverse-DNS naming | “Registry namespace” | `io.github.user/server` 约定 |

## 延伸阅读

- [Official MCP Registry](https://registry.modelcontextprotocol.io/) — 规范 upstream，namespace-verified
- [Cloudflare — Enterprise MCP](https://blog.cloudflare.com/enterprise-mcp/) — 带 OAuth 和 policy 的 gateway pattern
- [agentic-community — MCP gateway registry](https://github.com/agentic-community/mcp-gateway-registry) — open-source 参考 gateway
- [TrueFoundry — What is an MCP gateway?](https://www.truefoundry.com/blog/what-is-mcp-gateway) — 功能对比文章
- [IBM — MCP context forge](https://github.com/IBM/mcp-context-forge) — IBM 的 enterprise gateway
