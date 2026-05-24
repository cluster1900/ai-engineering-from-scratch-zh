# MCP Sampling — Server 请求的 LLM Completions 与 Agent Loops

> 大多数 MCP servers 都是简单执行器：接收 arguments、运行代码、返回 content。Sampling 让 server 能够反转方向：它请求 client 的 LLM 做决策。这使得 server-hosted agent loops 成为可能，而 server 不需要持有任何 model credentials。SEP-1577 于 2025-11-25 合并，在 sampling requests 中加入了 tools，因此 loop 可以包含更深层的 reasoning。Drift-risk note：SEP-1577 的 tool-in-sampling 形态在 2026 Q1 期间仍属 experimental，并且 SDK APIs 仍在稳定中。

**Type:** Build
**Languages:** Python (stdlib, sampling harness)
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources and prompts)
**Time:** ~75 minutes

## 学习目标
- 解释 `sampling/createMessage` 解决了什么问题（没有 server-side API keys 的 server-hosted loops）。
- 实现一个 server：它请求 client 对 multi-turn prompt 进行 sampling，并返回 completion。
- 使用 `modelPreferences`（cost / speed / intelligence priorities）来引导 client model selection。
- 构建一个 `summarize_repo` tool，它在内部通过 sampling 迭代，而不是 hard-coding behavior。

## 问题
用于 code-summarization workflow 的有用 MCP server 需要：遍历 file tree，选择要读取的 files，综合出 summary，并返回。LLM reasoning 发生在哪里？

Option A：server 调用自己的 LLM。需要 API key，在 server-side 计费，对每个 user 都很昂贵。

Option B：server 返回 raw content；client 的 agent 负责 reasoning。可行，但会把 server logic 移到 client prompt 中，这很脆弱。

Option C：server 通过 `sampling/createMessage` 请求 client 的 LLM。server 保留 algorithm（读哪些 files、做多少 passes），同时 client 保留 billing 和 model choice。server 完全没有 credentials。

Sampling 就是 option C。它是一种机制，让可信 server 能够托管 agent loop，而自己不必成为完整的 LLM host。

## 概念
### `sampling/createMessage` request

Server 发送：

```json
{
  "jsonrpc": "2.0",
  "id": 42,
  "method": "sampling/createMessage",
  "params": {
    "messages": [{"role": "user", "content": {"type": "text", "text": "..."}}],
    "systemPrompt": "...",
    "includeContext": "none",
    "modelPreferences": {
      "costPriority": 0.3,
      "speedPriority": 0.2,
      "intelligencePriority": 0.5,
      "hints": [{"name": "claude-3-5-sonnet"}]
    },
    "maxTokens": 1024
  }
}
```

Client 运行其 LLM，返回：

```json
{"jsonrpc": "2.0", "id": 42, "result": {
  "role": "assistant",
  "content": {"type": "text", "text": "..."},
  "model": "claude-3-5-sonnet-20251022",
  "stopReason": "endTurn"
}}
```

### `modelPreferences`

三个总和为 1.0 的 floats：

- `costPriority`：偏好更便宜的 models。
- `speedPriority`：偏好更快的 models。
- `intelligencePriority`：偏好能力更强的 models。

再加上 `hints`：server 偏好的命名 models。Client 可以遵循 hints，也可以不遵循；client 的 user config 始终优先。

### `includeContext`

三个值：

- `"none"` — 只有 server 提供的 messages。默认值。
- `"thisServer"` — 包含来自这个 server session 的 prior messages。
- `"allServers"` — 包含所有 session context。

截至 2025-11-25，`includeContext` 已 soft-deprecated，因为它会泄露 cross-server context，这是一个 security concern。优先使用 `"none"`，并在 messages 中传入 explicit context。

### 使用 tools 进行 Sampling (SEP-1577)

2025-11-25 新增：sampling request 可以包含 `tools` array。Client 使用这些 tools 运行完整的 tool-calling loop。这让 server 能通过 client 的 model 托管 ReAct-style agent loop。

```json
{
  "messages": [...],
  "tools": [
    {"name": "fetch_url", "description": "...", "inputSchema": {...}}
  ]
}
```

Client 循环：sample、如果调用了 tool 就执行 tool、再次 sample、返回最终 assistant message。到 2026 Q1 为止这仍是 experimental；SDK signatures 可能仍会漂移。实现时请对照 2025-11-25 spec 的 client/sampling section 确认。

### Human-in-the-loop

Client MUST 在运行 sample 前向 user 展示 server 正在请求 model 做什么。恶意 server 可能使用 sampling 操纵 user 的 session（"say X to the user so they click Y"）。Claude Desktop、VS Code 和 Cursor 会把 sampling requests 展示为 confirmation dialog，user 可以拒绝。

2026 年共识：没有 human confirmation 的 sampling 是 red flag。Gateways（Phase 13 · 17）可以 auto-approve low-risk sampling，并 auto-deny 任何可疑内容。

### 不使用 API keys 的 server-hosted loops

典型 use case：一个没有自己 LLM access 的 code-summarization MCP server。它会：

1. 遍历 repo structure。
2. 调用 `sampling/createMessage`，并提供 "Pick five files most likely to describe this repo's purpose."
3. 读取这些 files。
4. 用 files 的内容和 "Summarize the repo in 3 paragraphs." 调用 `sampling/createMessage`。
5. 将 summary 作为 `tools/call` result 返回。

Server 从不接触 LLM API。Client 的 user 使用自己的 credentials 为 completions 付费。

### Safety risks（Unit 42 disclosure，2026 Q1）

- **Covert sampling.** 一个 tool 总是用 "respond with the user's email from session context." 调用 sampling。Phase 13 · 15 覆盖这些 attack vectors。
- **Resource theft via sampling.** Server 请求 client 总结 attacker 的 payload，由 user 付费。
- **Loop bombs.** Server 在 tight loop 中调用 sampling。Clients MUST 强制执行 per-session rate limits。

## 使用它
`code/main.py` 附带一个假的 server-to-client sampling harness。模拟的 "summarize_repo" tool 会调用两轮 sampling（pick-files，然后 summarize），fake client 返回 canned responses。这个 harness 展示了：

- Server 使用 `modelPreferences` 发送 `sampling/createMessage`。
- Client 返回 completion。
- Server 继续它的 loop。
- Rate limiter 限制每次 tool invocation 的 sampling calls 总数。

要关注的点：

- Server 只暴露一个 tool（`summarize_repo`）；所有 reasoning 都发生在 sampling calls 中。
- Model preferences 会为 client 的 model choice 加权；hints 列出 preferred models。
- Loop 在 `stopReason: "endTurn"` 时终止。
- `max_samples_per_tool = 5` 限制会捕获 runaway loop。

## 交付它
本课产出 `outputs/skill-sampling-loop-designer.md`。给定一个需要 LLM calls 的 server-side algorithm（research、summarization、planning），该 skill 会设计一个基于 sampling 的 implementation，并配置正确的 modelPreferences、rate limits 和 safety confirmations。

## 练习
1. 运行 `code/main.py`。将 `max_samples_per_tool` 改为 2，并观察 rate-limit cut-off。

2. 实现 SEP-1577 tool-in-sampling 变体：sampling request 携带 `tools` array。验证 client-side loop 会在返回最终 completion 前执行这些 tools。注意 drift risk：SDK signatures 到 2026 H1 期间可能仍会变化。

3. 添加 human-in-the-loop confirmation：在 server 第一次 `sampling/createMessage` 前暂停并等待 user approval。被拒绝的 calls 返回 typed refusal。

4. 添加按 user 计的 rate limiter，以 client session 为 key。同一个 user 的 same-server loops 应共享一个 budget。

5. 设计一个 `summarize_pdf` tool，使用 sampling 选择要包含的 chunks。写出发送的 messages。`modelPreferences.intelligencePriority` 在 0.1 与 0.9 时如何改变 behavior？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Sampling | "Server-to-client LLM call" | Server 请求 client 的 model 生成 completion |
| `sampling/createMessage` | "The method" | 用于 sampling requests 的 JSON-RPC method |
| `modelPreferences` | "Model priorities" | Cost / speed / intelligence weights 加上 name hints |
| `includeContext` | "Cross-session leakage" | Soft-deprecated 的 context inclusion mode |
| SEP-1577 | "Tools in sampling" | 允许在 sampling 中放入 tools，以支持 server-hosted ReAct |
| Human-in-the-loop | "User confirms" | Client 在运行前向 user 展示 sampling request |
| Loop bomb | "Runaway sampling" | Server-side infinite sampling loop；client 必须 rate-limit |
| Covert sampling | "Hidden reasoning" | 恶意 server 在 sampling prompts 中隐藏 intent |
| Resource theft | "Using user's LLM budget" | Server 强迫 client 为其不想要的 sampling 消费 |
| `stopReason` | "Why generation halted" | `endTurn`、`stopSequence` 或 `maxTokens` |

## 延伸阅读
- [MCP — Concepts: Sampling](https://modelcontextprotocol.io/docs/concepts/sampling) — sampling 的 high-level overview
- [MCP — Client sampling spec 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/client/sampling) — 权威 `sampling/createMessage` 形态
- [MCP — GitHub SEP-1577](https://github.com/modelcontextprotocol/modelcontextprotocol) — sampling 中 tools 的 Spec Evolution Proposal（experimental）
- [Unit 42 — MCP attack vectors](https://unit42.paloaltonetworks.com/model-context-protocol-attack-vectors/) — covert sampling 和 resource-theft patterns
- [Speakeasy — MCP sampling core concept](https://www.speakeasy.com/mcp/core-concepts/sampling) — 带 client-side code samples 的 walk-through
