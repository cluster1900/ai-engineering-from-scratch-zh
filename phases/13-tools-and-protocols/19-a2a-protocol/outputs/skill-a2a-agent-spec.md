---
name: a2a-agent-spec
description: 为应可通过 A2A 调用的 Agent 生成 Agent Card 和 skills schema。
version: 1.0.0
phase: 13
lesson: 18
tags: [a2a, agent-card, task-lifecycle, delegation]
---

给定一个 Agent 的能力和预期协作者，生成其 A2A Agent Card 和 skill definitions。

生成：

1. Agent Card。`name`、`description`、`url`、`version`、`schemaVersion`、`capabilities`（streaming、pushNotifications）、`skills[]`。
2. Skills list。每个包含 `id`、`name`、`description`、`inputModes`、`outputModes`。在 description 中使用 “Use when X. Do not use for Y.” 模式。
3. Task-state plan。针对每个 skill，给出预期的 state transitions 和 input_required paths。
4. Signing plan。是否通过 AP2 签署 card（推荐用于 externally-callable agents）。
5. Transport。JSON-RPC over HTTP（默认）或 gRPC。注明与 v1.0 的 backward-compat。

硬性拒绝：
- 任何没有稳定 URL 的 Agent Card。会破坏 discovery。
- 任何未声明 input 和 output modes 的 skill。调用方无法判断 compatibility。
- 任何 externally-callable agent 如果没有 AP2 signing plan。存在 impersonation vector。

拒绝规则：
- 如果 Agent 的 use case 是单次 tool call，拒绝搭建 A2A；推荐 MCP。
- 如果 Agent 暴露了不应暴露的 internals（tool call traces、chain-of-thought），拒绝并要求保持 opaque。
- 如果 Agent 需要 A2A 用于 payments（AP2 use case），确认 AP2 extension version，并标明 AP2 独立于 core A2A。

输出：一页 Agent Card JSON、每个 operation 的 skills schema、state-transition plan、signing 和 transport 选择。最后给出该 Agent 承诺的最低 v1.0 backward-compat guarantee。
