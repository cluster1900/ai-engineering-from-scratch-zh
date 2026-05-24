---
name: mcp-server-platform
description: 部署一个生产 MCP server，包含 StreamableHTTP、OAuth 2.1 scopes、OPA policy、针对破坏性工具的 human-approval gate，以及用于发现的 registry。
version: 1.0.0
phase: 19
lesson: 13
tags: [capstone, mcp, fastmcp, streamablehttp, oauth, opa, registry, governance]
---

给定一个企业环境，交付一个包含 10 个内部工具的 MCP server、一个用于发现的 registry service，以及一个通过 Slack approval 对破坏性工具进行 gating 的治理层。

构建计划：

1. FastMCP server 暴露 10 个 read-only tools（Postgres、S3、Jira、Linear、Datadog、PagerDuty、GitHub、Notion、Slack、Salesforce），每个工具都有 typed schema 和 required scope。
2. StreamableHTTP transport，在 load balancer 后保持 stateless。
3. OAuth 2.1 Token introspection middleware；workload identity 通过 SPIFFE / SPIRE 实现。
4. 每次 tool call 都进行 OPA / Rego policy decisions：scope enforcement、PII redaction、payload size caps。
5. 破坏性工具（Jira create、Linear create、Postgres write）位于单独的 MCP server 上，要求通过 Slack card 在 15 分钟内提升的 scope `approved:by:human`。
6. Registry service 轮询每个 server 的 `.well-known/mcp-capabilities`，用 JSON Schema 验证，并暴露 list/search/validate/enable UI。
7. Per-tenant JSONL audit log，写入前使用 Presidio PII redaction。
8. 100-client load test 展示 horizontal scale；通过 MCP conformance suite。

评估 rubric：

| 权重 | 标准 | 衡量方式 |
|:-:|---|---|
| 25 | Spec conformance | StreamableHTTP + capability manifest 通过 MCP conformance tests |
| 20 | Security | Scope enforcement、每个工具的 OPA coverage、secret hygiene |
| 20 | Observability | 写入时带 PII redaction 的 per-tool-call audit log |
| 20 | Scale | 带 horizontal scale demonstration 的 100-client load test |
| 15 | Registry UX | 执行 Discover / validate / enable-disable workflow |

硬性拒收：

- 需要 stateful sessions 的 servers（违反 2026 StreamableHTTP stateless contract）。
- 破坏性工具与 read-only 工具共享同一 auth surface 的 single-server topology。
- 持久化原始 PII 的 audit logs。
- 忽略 capability manifest；registry integration 是硬性要求。

拒绝规则：

- 没有 OAuth 就拒绝部署；anonymous access 不合格。
- 没有 Slack approval flow 就拒绝交付破坏性工具。
- 如果某个工具的 scope 或 description 不在 capability manifest 中，则拒绝暴露该工具。

输出：一个 repo，包含两个 MCP servers（read-only + destructive）、registry service、Slack approval integration、OPA policies、100-client load-test harness、conformance-test results，以及一份 write-up，描述你曾考虑暴露但最终没有暴露的工具（以及原因），再加上 dry-run 期间捕获 near-misses 的前三条 OPA rules。
