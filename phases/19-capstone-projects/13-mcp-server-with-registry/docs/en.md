# Capstone 13 — 带 Registry 和治理的 MCP Server

> Model Context Protocol 不再是未来，而是在 2026 年成为默认的工具使用规范。Anthropic、OpenAI、Google 以及每个主要 IDE 都内置 MCP client。Pinterest 发布了其内部 MCP servers 生态。AAIF Registry 在 `.well-known` 中正式定义了 capability metadata。AWS ECS 发布了参考 stateless 部署方案。Block 的 goose-agent 将同一协议放进了 hosted assistant。2026 年的生产形态是：StreamableHTTP transport、OAuth 2.1 scopes、OPA policy gating，以及一个让平台团队能够发现、验证和启用 servers 的 registry。端到端把它构建出来。

**类型：** Capstone
**语言：** Python（server，通过 FastMCP）或 TypeScript（@modelcontextprotocol/sdk），Go（registry service）
**先修要求：** Phase 11（LLM engineering）、Phase 13（tools and MCP）、Phase 14（agents）、Phase 17（infrastructure）、Phase 18（safety）
**覆盖阶段：** P11 · P13 · P14 · P17 · P18
**时间：** 25 小时

## 问题

MCP 已经成为工具使用的通用语言。Claude Code、Cursor 3、Amp、OpenCode、Gemini CLI，以及每个 managed agent 现在都会消费 MCP servers。生产挑战不在于编写 servers（FastMCP 让这件事很简单），而在于用企业级要求进行规模化部署：per-tenant OAuth scopes、针对破坏性工具的 OPA policy、StreamableHTTP stateless scaling、用于发现的 registry、每次 tool call 的 audit logs。Pinterest 的内部 MCP 生态和 AAIF Registry spec 设定了 2026 年的标准。

你将构建一个暴露 10 个内部工具的 MCP server（Postgres read-only、S3 listing、Jira、Linear、Datadog 等）、一个用于平台发现的 registry UI，以及一个针对破坏性工具的人工审批 gate。load test 会展示 StreamableHTTP horizontal scaling。audit trail 会满足企业安全审查。

## 概念

MCP 2026 revision 要求 StreamableHTTP 作为默认 transport。不同于早期 stdio-and-SSE 形态，StreamableHTTP 默认是 stateless：一个 HTTP endpoint 接收 JSON-RPC requests、stream responses，并支持用于 notifications 的 long-lived connections。Stateless 意味着可以在 load balancer 后面进行水平扩展。

Authorization 使用 OAuth 2.1，并带有 per-tool scopes。Token 携带类似 `jira:read`、`s3:list`、`postgres:query:readonly` 的 scopes。MCP server 在 tool-call 时检查 scopes，而不只是 session start 时检查。对于高风险工具，server 会拒绝任何在最近 N 分钟内未被提升到 `approved:by:human` scope 的调用；这个提升来自 Slack review card。

Registry 是一个独立服务。每个 MCP server 都会暴露一个 `.well-known/mcp-capabilities` document，其中包含 tool manifest、transport URL、auth requirements。Registry 会轮询、验证并建立索引。平台团队使用 registry UI 查看可用工具、它们需要哪些 scopes，以及它们由哪些团队拥有。

## 架构

```
MCP client (Claude Code, Cursor 3, ...)
          |
          v
StreamableHTTP over HTTPS (JSON-RPC + streaming)
          |
          v
MCP server (FastMCP) behind load balancer
          |
   +------+------+---------+----------+------------+
   v             v         v          v            v
Postgres    S3 listing  Jira       Linear     Datadog
(read-only) (paged)     (read)     (read)     (query)
          |
   +------+-------------+
   v                    v
 OPA policy gate   destructive tool MCP (separate server)
                        |
                        v
                   human approval via Slack
                        |
                        v
                   audit log (append-only, per-tenant)

  registry service
     |
     v  GET /.well-known/mcp-capabilities from each server
     v
     UI: search / validate / enable-disable / ownership
```

## 技术栈

- Server framework: FastMCP (Python) 或 `@modelcontextprotocol/sdk` (TypeScript)
- Transport: StreamableHTTP over HTTPS (stateless)
- Auth: OAuth 2.1，workload identity 通过 SPIFFE / SPIRE 实现
- Policy: 每个工具使用 OPA / Rego rules；每个 request 都调用 policy decision service
- Registry: self-hosted，消费 `.well-known/mcp-capabilities` manifests
- Human approval: 针对破坏性工具的 Slack interactive message
- Deployment: AWS ECS Fargate 或 Fly.io，每个 tenant 一个 server，或共享但带 tenant scoping
- Audit: per-tenant bucket 中的 structured JSONL，带 per-call lineage

## 构建

1. **工具表面。** 暴露 10 个内部工具：Postgres read-only query、S3 list objects、Jira search/fetch、Linear search/fetch、Datadog metric query、PagerDuty on-call lookup、GitHub read-only、Notion search、Slack search、Salesforce read。每个工具都有 typed schema 和 scope label。

2. **FastMCP server。** 挂载这些工具。配置 StreamableHTTP transport。添加用于 OAuth Token introspection 和 scope enforcement 的 middleware。

3. **OPA policy。** 每个工具对应 Rego policy：哪些 scopes 允许调用、应用哪些 PII redaction、应用哪些 payload-size caps。每次 tool call 都调用 decision service。

4. **Registry service。** 独立的 Go 或 TS 服务，轮询 registered servers 的 `.well-known/mcp-capabilities`，用 JSON Schema 验证，并暴露 list / search / validate / enable-disable UI。

5. **Capability manifest。** 每个 server 都暴露 `.well-known/mcp-capabilities`，包含：tool list、auth requirements、transport URL、owner team、SLO。

6. **破坏性工具隔离。** 会改变 state 的工具（Jira create、Linear create、Postgres write）放在第二个 MCP server 上，并使用更严格的 auth flow：Token 必须拥有通过 Slack card 在 15 分钟内提升的 `approved:by:human` scope。

7. **Audit log。** 每个 tenant 使用 append-only JSONL：`{timestamp, user, tool, args_redacted, response_redacted, outcome}`。写入前通过 Presidio 执行 PII redaction。

8. **Load test。** 100 个 concurrent clients 连接 StreamableHTTP。通过添加第二个 replica 展示 horizontal scaling；展示 load balancer 无需 session stickiness 即可重新分配流量。

9. **Conformance tests。** 对两个 servers 运行官方 MCP conformance suite。通过所有 mandatory sections。

## 使用

```
$ curl -H "Authorization: Bearer eyJhbGc..." \
       -X POST https://mcp.internal.example.com/ \
       -d '{"jsonrpc":"2.0","method":"tools/call",
            "params":{"name":"postgres.readonly","arguments":{"sql":"SELECT 1"}}}'
[registry]   capability validated: postgres.readonly v1.2
[policy]    scope postgres:query:readonly present; allowed
[audit]     logged: user=u42 tool=postgres.readonly outcome=ok
response:    { "result": { "rows": [[1]] } }
```

## 交付

`outputs/skill-mcp-server.md` 描述交付物。一个生产级 MCP server + registry + audit layer，用于带 OAuth 2.1 scopes 和 OPA gating 的内部工具。

| 权重 | 标准 | 如何衡量 |
|:-:|---|---|
| 25 | Spec conformance | StreamableHTTP + capability manifest 通过 MCP conformance tests |
| 20 | Security | Scope enforcement、每个工具的 OPA coverage、secret hygiene |
| 20 | Observability | 带 PII redaction 的 per-tool-call audit log |
| 20 | Scale | 100-client load test horizontal scale demonstration |
| 15 | Registry UX | Discover / validate / enable-disable workflow |
| **100** | | |

## 练习

1. 添加一个新工具（Confluence search）。在不触碰 core server 的情况下，通过 registry validation flow 交付它。

2. 编写一个 OPA policy，redact 包含名为 `email`、`ssn` 或 `phone` 的列的 Postgres query results。用一个 probe query 练习。

3. 在本地延迟上 benchmark StreamableHTTP vs stdio。报告 per-call p50/p95。

4. 实现 per-tenant quota：每个 tenant、每个 tool 每分钟最多 N 次调用。通过第二条 OPA rule 强制执行。

5. 从 [mcp-conformance-tests](https://github.com/modelcontextprotocol/conformance) 运行 MCP conformance suite，并修复每个失败项。

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|-----------------|------------------------|
| StreamableHTTP | "2026 MCP transport" | Stateless HTTP + streaming；替代 networked servers 的 SSE + stdio |
| Capability manifest | "Well-known doc" | `.well-known/mcp-capabilities`，包含 tool list、auth、transport URL |
| OPA / Rego | "Policy engine" | Open Policy Agent，用于根据外部 rules 授权 tool calls |
| Scope elevation | "Approved-by-human" | 通过 Slack approval 授予的 short-lived scope，破坏性工具必需 |
| Registry | "Tool discovery" | 从 capability manifests 索引 MCP servers 的服务 |
| Workload identity | "SPIFFE / SPIRE" | 用于 OAuth Token issuance 的 cryptographic service identity |
| Conformance suite | "Spec tests" | 用于 StreamableHTTP + tool manifest correctness 的官方 MCP test battery |

## 延伸阅读

- [Model Context Protocol 2026 Roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) — StreamableHTTP、capability metadata、registry
- [AAIF MCP Registry spec](https://github.com/modelcontextprotocol/registry) — 2026 registry spec
- [AWS ECS reference deployment](https://aws.amazon.com/blogs/containers/deploying-model-context-protocol-mcp-servers-on-amazon-ecs/) — 生产参考部署
- [Pinterest internal MCP ecosystem](https://www.infoq.com/news/2026/04/pinterest-mcp-ecosystem/) — 内部部署参考
- [Block `goose` MCP usage](https://block.github.io/goose/) — agent consumption pattern 参考
- [FastMCP](https://github.com/jlowin/fastmcp) — Python server framework
- [Open Policy Agent](https://www.openpolicyagent.org/) — policy engine 参考
- [SPIFFE / SPIRE](https://spiffe.io) — workload identity 参考
