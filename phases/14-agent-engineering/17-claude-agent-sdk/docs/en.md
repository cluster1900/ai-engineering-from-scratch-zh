# Claude Agent SDK：Subagents 和 Session Store

> Claude Agent SDK 是 Claude Code harness 的库形态。Built-in tools、用于 context isolation 的 subagents、hooks、W3C trace propagation、session store parity。Claude Managed Agents 是用于 long-running async work 的 hosted 替代方案。

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 10 (Skill Libraries)
**Time:** ~75 分钟

## 学习目标
- 解释 Anthropic Client SDK（raw API）和 Claude Agent SDK（harness shape）之间的区别。
- 描述 subagents：parallelization 和 context isolation，以及何时使用它们。
- 说出 Python SDK 的 session store surface（`append`, `load`, `list_sessions`, `delete`, `list_subkeys`）以及 `--session-mirror` 的作用。
- 实现一个 stdlib harness，包含 built-in tools、带 isolated context 的 subagent spawning、lifecycle hooks 和 session store。

## 问题
Raw LLM API 只给你一次 round-trip。Production agent 需要 tool execution、MCP servers、lifecycle hooks、subagent spawning、session persistence、trace propagation。Claude Agent SDK 将这种形态作为一个库提供出来，也就是 Claude Code 使用的同一个 harness，暴露给 custom agents 使用。

## 概念
### Client SDK vs Agent SDK

- **Client SDK (`anthropic`).** Raw Messages API。你自己负责 loop、tools 和 state。
- **Agent SDK (`claude-agent-sdk`).** Built-in tool execution、MCP connections、hooks、subagent spawning、session store。也就是作为库提供的 Claude Code loop。

### Built-in tools

SDK 开箱随附 10+ tools：file read/write、shell、grep、glob、web fetch 等。Custom tools 通过标准 tool-schema interface 注册。

### Subagents

Anthropic 记录了两个用途：

1. **Parallelization.** 并发运行独立工作。“Find the test file for each of these 20 modules” 是 20 个 parallel subagent tasks。
2. **Context isolation.** Subagents 使用自己的 context window；只有结果返回给 orchestrator。Orchestrator 的预算会被保留。

Python SDK 的近期新增项：`list_subagents()`、`get_subagent_messages()`，用于读取 subagent transcripts。

### Session store

与 TypeScript 的 protocol parity：

- `append(session_id, message)` — 添加一个 turn。
- `load(session_id)` — 恢复 conversation。
- `list_sessions()` — 枚举。
- `delete(session_id)` — 带有对 subagent sessions 的 cascade。
- `list_subkeys(session_id)` — 列出 subagent keys。

`--session-mirror`（CLI flag）会在 transcript streaming 时将其 mirror 到外部文件，便于 debugging。

### Hooks

你可以注册的 lifecycle hooks：

- `PreToolUse`, `PostToolUse` — gate 或 audit tool calls。
- `SessionStart`, `SessionEnd` — set up 和 tear down。
- `UserPromptSubmit` — 在 model 看到 user input 之前采取行动。
- `PreCompact` — 在 context compaction 之前运行。
- `Stop` — agent exit 时 cleanup。
- `Notification` — side-channel alerts。

Hooks 是 pro-workflow（Phase 14 curriculum reference）和类似系统添加 cross-cutting behavior 的方式。

### W3C trace context

调用方上活跃的 OTel spans 会通过 W3C trace context headers 传播到 CLI subprocess。整个 multi-process trace 会在你的 backend 中显示为一个 trace。

### Claude Managed Agents

Hosted 替代方案（beta header `managed-agents-2026-04-01`）。Long-running async work、built-in prompt caching、built-in compaction。用 control 换取 managed infrastructure。

### 这个 pattern 容易在哪里出错

- **Subagent over-spawn.** 为 100 个 tiny tasks spawn 100 个 subagents。Overhead 会占主导。改为 batch。
- **Hook creep.** 每个团队都会添加 hooks；startup time 膨胀。每季度 review hooks。
- **Session bloat.** Sessions 持续累积；size 增长。使用 `list_sessions` + expiry policy。

## 构建它
`code/main.py` 用 stdlib 实现 SDK shape：

- `Tool`, `ToolRegistry`，包含 built-in `read_file`, `write_file`, `list_dir`。
- `Subagent` — private context、isolated run、返回 results。
- `SessionStore` — append、load、list、delete、list_subkeys。
- `Hooks` — `pre_tool_use`, `post_tool_use`, `session_start`, `session_end`。
- 一个 demo：main agent parallel spawn 3 个 subagents（每个都 isolated），aggregate results，并 persist session。

运行：

```
python3 code/main.py
```

Trace 会展示 subagent context isolation（orchestrator context size 保持 bounded）、hook execution 和 session persistence。

## 使用它
- **Claude Agent SDK** 用于想要 Claude Code harness shape 的 Claude-first products。
- **Claude Managed Agents** 用于 hosted long-running async work。
- **OpenAI Agents SDK**（Lesson 16）用于 OpenAI-first counterparts。
- **LangGraph + custom tools** 如果你想要 graph-shaped state machine。

## 交付它
`outputs/skill-claude-agent-scaffold.md` 会 scaffold 一个 Claude Agent SDK app，包含 subagents、hooks、session store、MCP server attachment 和 W3C trace propagation。

## 练习
1. 添加一个 subagent spawner，把 20 个 tasks batch 成每组 5 个 parallel subagents。衡量 orchestrator context size 与 one-per-task 的对比。
2. 实现一个 `PreToolUse` hook，对 `write_file` calls 进行 rate-limit（每个 session 每分钟 5 次）。Trace 该行为。
3. 连接 `list_subkeys` 来渲染 subagent tree。Deep nesting 看起来是什么样？
4. 将这个 toy port 到真实的 `claude-agent-sdk` Python package。Tool registration 会发生什么变化？
5. 阅读 Claude Managed Agents docs。你什么时候会从 self-hosted 切换到 managed？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent SDK | “Claude Code as a library” | Harness shape：tools、MCP、hooks、subagents、session store |
| Subagent | “Child agent” | Separate context、own budget；results bubble up |
| Session store | “Conversation DB” | Persist、load、list、delete turns，并带 subagent cascade |
| Hook | “Lifecycle callback” | Pre/post tool、session、prompt submit、compact、stop |
| W3C trace context | “Cross-process trace” | Parent span propagates into CLI subprocess |
| Managed Agents | “Hosted harness” | Anthropic-hosted long-running async work |
| `--session-mirror` | “Transcript mirror” | 在 session turns streaming 时将它们写入外部文件 |
| MCP server | “Tool surface” | 附加到 agent 的外部 tool/resource source |

## 延伸阅读
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — Claude Code 的库形态
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) — 生产模式
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) — hosted 替代方案
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) — counterpart
