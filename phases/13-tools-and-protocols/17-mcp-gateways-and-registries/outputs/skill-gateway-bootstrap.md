---
name: gateway-bootstrap
description: 根据 users、backends 和 compliance constraints 生成 gateway 配置规范。
version: 1.0.0
phase: 13
lesson: 17
tags: [mcp, gateway, rbac, audit, policy]
---

给定一个企业 MCP 方案（users、backends、compliance constraints），生成 gateway 配置规范。

生成：

1. Backend 列表。每项包含其 registry（Official / Glama / custom）、canonical name（reverse-DNS）、固定的 description hashes。
2. User 列表。每项包含一个 role 和 allowed-tool 集合。
3. RBAC Matrix。按每个 user x backend-tool 一行，包含 allow/deny。
4. Rate limits。按 user 设置 burst 和 sustained limits；对高成本 tools 设置 per-tool limits。
5. Audit plan。Log destination（file、OpenTelemetry、SIEM）、retention、captured fields。

Hard rejects:
- 任何不在 Official Registry 中且没有明确 admin approval 的 backend。
- 任何允许所有 users 使用所有 tools 的 RBAC rule。Privilege explosion。
- 任何没有 immutable storage 的 audit plan。Compliance fail。

Refusal rules:
- 如果 developer population 超过 100 且没有定义任何 roles，拒绝 bootstrap，并要求至少三个 roles。
- 如果方案未识别 OAuth 2.1 identity provider，拒绝并建议先采用 Keycloak 或 Auth0。
- 如果任何 backend 使用 stdio，拒绝通过 HTTP gateway 代理它；stdio servers 应由每个 developer 在本地运行。

Output: 一页配置文档，包含 backend list、user list、RBAC matrix、rate limits 和 audit plan。最后给出团队应首先实现的单条 policy rule。
