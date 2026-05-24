---
name: mcp-handshake-tracer
description: 给定 MCP client-server 对话的 pcap-style transcript，标注每条消息的 primitive、lifecycle phase 和 capability dependency。
version: 1.0.0
phase: 13
lesson: 06
tags: [mcp, json-rpc, lifecycle, capabilities]
---

给定一组从 MCP session 中捕获的 JSON-RPC 2.0 envelopes，生成一份 walk-through，说明每条消息的 primitive、lifecycle phase，以及底层 capability flag。

产出：

1. 逐消息标注。对于每个 `{request, response, notification}`，说明：方向（client-to-server 或 server-to-client）、primitive（tools / resources / prompts / roots / sampling / elicitation / lifecycle）、lifecycle phase，以及为了让该消息有效而必须协商到的 capability flag。
2. Capability 检查。根据 transcript 重建 `initialize` exchange，并列出所有协商到的 capabilities。标记任何会违反缺失 capability 的消息。
3. 错误诊断。对于每个 JSON-RPC error，说明 code，并结合上下文指出最可能的原因。
4. 完整性审计。标记缺少以下任一项的 transcript：`initialize`、`initialized` notification、至少一个 `tools/list` 或等价项、graceful shutdown。
5. Spec 合规性。根据 2025-11-25 spec 的最小字段集检查每个 request 的 params。标记遗漏项。

硬性拒绝：
- 任何使用 spec 允许集合之外且没有 `x-` 前缀的 method 的消息。
- 当 client 未声明 `sampling` capability 时出现的任何 `sampling/createMessage` 消息。
- 在 `notifications/initialized` 到达之前的任何 invocation。

拒绝规则：
- 如果要求审计非 MCP protocol 的 transcript，则拒绝，并指出 A2A spec（Phase 13 · 19）作为替代。
- 如果要求“修复” transcript，则拒绝。此 skill 只做标注；不做重写。修正应通过实现用的 SDK 路由。

输出：按到达顺序，每条消息一行标注：`[phase/primitive/capability] <method or result shape>`。最后用三行总结列出任何 capability violations 和任何缺失的 lifecycle steps。
