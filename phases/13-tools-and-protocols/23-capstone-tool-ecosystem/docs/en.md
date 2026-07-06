# Capstone — 构建完整 Tool Ecosystem

> Phase 13 讲授了每个组成部分。这个 capstone 会把它们连接成一个具备 production 形态的系统：一个包含 tools + resources + prompts + tasks + UI 的 MCP server，边界处的 OAuth 2.1，一个 RBAC gateway，一个 multi-server client，一次 A2A sub-agent 调用，进入 collector 的 OTel tracing，CI 中的 tool-poisoning 检测，以及一个 AGENTS.md + SKILL.md bundle。完成后，你将能够为每个架构选择给出充分解释。

**Type:** 构建
**Languages:** Python (stdlib, end-to-end ecosystem harness)
**Prerequisites:** Phase 13 · 01 through 21
**Time:** ~120 minutes

## 学习目标
- 组合一个暴露 tools、resources、prompts，以及带有 `ui://` app 的 task 的 MCP server。
- 在 server 前接入一个 OAuth 2.1 gateway，用于强制执行 RBAC 和 pinned hashes。
- 编写一个 multi-server client，使用 OTel GenAI attributes 进行端到端 tracing。
- 将部分 workload 委托给 A2A sub-agent；验证不透明性得到保留。
- 使用 AGENTS.md + SKILL.md 打包整个 stack，使其他 agents 能够驱动它。

## 问题
交付这个 “research and report” 系统：

- 用户提问: "总结 2026 年关于 agent protocols 的三篇被引用最多的 arXiv 论文。"
- System: 通过 MCP 搜索 arXiv；通过 A2A 将论文摘要委托给专门的 writer agent；聚合结果；将交互式报告渲染为 MCP Apps `ui://` resource；把每一步记录到 OTel。

Phase 13 的所有 primitives 都会出现。这不是玩具示例 — Anthropic（Claude Research product）、OpenAI（带 Apps SDK 的 GPTs）以及第三方在 2026 年交付的 production research-assistant systems，正是这种形态。

## 概念
### Architecture

```
[user] -> [client] -> [gateway (OAuth 2.1 + RBAC)] -> [research MCP server]
                                                      |
                                                      +- MCP tool: arxiv_search (pure)
                                                      +- MCP resource: notes://recent
                                                      +- MCP prompt: /research_topic
                                                      +- MCP task: generate_report (long)
                                                      +- MCP Apps UI: ui://report/current
                                                      +- A2A call: writer-agent (tasks/send)
                                                      |
                                                      +- OTel GenAI spans
```

### Trace hierarchy

```
agent.invoke_agent
 ├── llm.chat (kick off)
 ├── mcp.call -> tools/call arxiv_search
 ├── mcp.call -> resources/read notes://recent
 ├── mcp.call -> prompts/get research_topic
 ├── a2a.tasks/send -> writer-agent
 │    └── task transitions (opaque internals)
 ├── mcp.call -> tools/call generate_report (task-augmented)
 │    └── tasks/status polling
 │    └── tasks/result (completed, returns ui:// resource)
 └── llm.chat (final synthesis)
```

一个 trace id。每个 span 都带有正确的 `gen_ai.*` attributes。

### Security posture

- OAuth 2.1 + PKCE，并通过 resource indicator 将 audience 固定到 gateway。
- Gateway 持有 upstream credentials；user 永远看不到它们。
- RBAC: `alice` 拥有 `research:read`、`research:write`，可以调用所有 tools。`bob` 拥有 `research:read`，不能调用 `generate_report`。
- Pinned description manifest: 丢弃任何 tool hashes 发生变化的 server。
- Rule of Two audit: 不允许任何 tool 同时组合 untrusted input、sensitive data 和 consequential action。

### Rendering

最终的 `generate_report` task 会返回 content blocks 以及一个 `ui://report/current` resource。client 的 host（Claude Desktop 等）会在 sandbox iframe 中渲染这个交互式 dashboard。dashboard 包含一个排序后的论文列表、citation counts，以及一个按钮；user 点击任意论文时，该按钮会调用 `host.callTool('summarize_paper', {arxiv_id})`。

### Packaging

整个系统以如下形式交付：

```
research-system/
  AGENTS.md                     # project conventions
  skills/
    run-research/
      SKILL.md                  # the top-level workflow
  servers/
    research-mcp/               # the MCP server
      pyproject.toml
      src/
  agents/
    writer/                     # the A2A agent
  gateway/
    config.yaml                 # RBAC + pinned manifest
```

Users 通过 `docker compose up` 部署。Claude Code、Cursor、Codex 和 opencode users 可以通过调用 `run-research` skill 来驱动系统。

### 每节 Phase 13 课程贡献了什么

| Lesson | What the capstone uses |
|--------|------------------------|
| 01-05 | Tool interface、provider-portability、parallel calls、schemas、linting |
| 06-10 | MCP primitives、server、client、transports、resources + prompts |
| 11-14 | Sampling、roots + elicitation、async tasks、`ui://` apps |
| 15-17 | Tool poisoning、OAuth 2.1、gateway + registry |
| 18 | A2A sub-agent delegation |
| 19 | OTel GenAI tracing |
| 20 | LLM layer 的 routing gateway |
| 21 | SKILL.md + AGENTS.md packaging |

## 使用它
`code/main.py` 会把前面 lessons 中的模式拼接成一个可运行 demo。全部使用 stdlib，全部 in-process，因此你可以端到端阅读。它会为 research-and-report 场景运行完整流程：与 gateway handshake、模拟 OAuth 2.1、合并 tools/list、将 generate_report 作为 task、对 writer 进行 A2A call、返回 ui:// resource、发出 OTel spans。

需要关注的点：

- 每一跳共享一个 trace id。
- Gateway policy 会阻止第二个 user 写入。
- Task lifecycle 从 working → completed，并同时返回 text 和 ui:// content。
- A2A call 的内部状态对 orchestrator 不透明。
- AGENTS.md 和 SKILL.md 是另一个 agent 复现该 workflow 所需的唯一文件。

## 交付它
本课会生成 `outputs/skill-ecosystem-blueprint.md`。给定一个 product need（research、summarization、automation），该 skill 会产出完整 architecture：使用哪些 MCP primitives、哪些 gateway controls、哪些 A2A calls、哪些 telemetry、哪些 packaging。

## 练习
1. 运行 `code/main.py`。注意单一 trace id 以及 spans 如何嵌套。统计这个 demo 触及了 Phase 13 中多少 primitives。

2. 扩展 demo：添加第二个 backend MCP server（例如 `bibliography`），并确认 gateway 会把它的 tools 合并到同一个 namespace 中。

3. 将假的 A2A writer agent 替换为在 subprocess 上运行的真实 agent。使用 Lesson 19 harness。

4. 在 orchestrator 和 LLM 之间的 routing gateway 中添加一个 PII redaction 步骤。确认 user query 中的 emails 会被清理。

5. 为将维护该系统的 teammate 编写一个 AGENTS.md。它应当能在五分钟内读完，并为他们提供在 Cursor 或 Codex 中驱动 capstone 所需的一切。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Capstone | "Phase-13 integration demo" | 使用每个 primitive 的 end-to-end system |
| Research and report | "The scenario" | Search、summarize、render pattern |
| Ecosystem | "All the pieces together" | Server + client + gateway + sub-agent + telemetry + package |
| Trace hierarchy | "Single trace id" | 每一跳的 span 共享同一个 trace；通过 span ids 建立 parent-child 关系 |
| Gateway-issued token | "Transitive auth" | Client 只看到 gateway 的 token；gateway 持有 upstream creds |
| Merged namespace | "All tools in one flat list" | 在 gateway 进行 multi-server merge，发生冲突时添加 prefix |
| Opacity boundary | "A2A call hides internals" | Sub-agent 的 reasoning 对 orchestrator 不可见 |
| Three-layer stack | "AGENTS.md + SKILL.md + MCP" | Project context + workflow + tools |
| Defense-in-depth | "Multiple security layers" | Pinned hashes、OAuth、RBAC、Rule of Two、audit log |
| Spec compliance matrix | "What we ship that the spec requires" | 将 deliverables 映射到 2025-11-25 requirements 的 checklist |

## 延伸阅读
- [MCP — Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) — 综合 reference
- [MCP blog — 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) — protocol 的发展方向
- [a2a-protocol.org](https://a2a-protocol.org/latest/) — A2A v1.0 reference
- [OpenTelemetry — GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — 权威 tracing conventions
- [Anthropic — Claude Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview) — production agent runtime patterns
