# 将 Harness 作为库 — Subagent 与 Session Store

> 一个可以 import 的 harness：内置 Tool、用于 Context 隔离的 subagent、hook、W3C trace propagation、session 持久化。Claude Agent SDK 是参考示例 — 它是 Claude Code harness 的 library 形式 — 而 Claude Managed Agents 则是面向长时间异步工作的托管替代方案。

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 10 (Skill Libraries)
**Time:** ~75 分钟

## 学习目标

- 解释 Anthropic Client SDK（原始 API）与 Claude Agent SDK（harness 结构）之间的区别。
- 描述 subagent — 并行化与 Context 隔离 — 以及何时应当使用它们。
- 说出 Python SDK 的 session store 功能界面（`append`、`load`、`list_sessions`、`delete`、`list_subkeys`）以及 `--session-mirror` 的作用。
- 实现一个基于 stdlib 的 harness，其中包含内置 Tool、使用隔离 Context 创建 subagent、lifecycle hook 和 session store。

## 问题

原始 LLM API 只能提供一次往返调用。面向生产环境的 Agent 还需要 Tool 执行、MCP server、lifecycle hook、subagent 创建、session 持久化和 trace propagation。Claude Agent SDK 以 library 形式提供了这种结构 — 即 Claude Code 使用的同一套 harness，并将其开放给自定义 Agent。

## 概念

### Client SDK 与 Agent SDK

- **Client SDK (`anthropic`)。** 原始 Messages API。循环、Tool 和 state 均由你负责。
- **Agent SDK (`claude-agent-sdk`)。** 内置 Tool 执行、MCP 连接、hook、subagent 创建和 session store。它是 library 形式的 Claude Code 循环。

### 内置 Tool

SDK 默认提供 10 多种 Tool：文件读写、shell、grep、glob、web fetch 等。自定义 Tool 通过标准 tool-schema interface 注册。

### Subagent

Anthropic 文档说明了两个用途：

1. **并行化。** 并发运行相互独立的工作。“为这 20 个 module 分别查找 test 文件”可以拆分成 20 个并行的 subagent Task。
2. **Context 隔离。** subagent 使用自己的 Context window；只有结果会返回 orchestrator。这样可以保留 orchestrator 的预算。

Python SDK 近期新增了 `list_subagents()`、`get_subagent_messages()`，用于读取 subagent transcript。

### Session store

与 TypeScript 保持协议一致：

- `append(session_id, message)` — 添加一轮对话。
- `load(session_id)` — 恢复对话。
- `list_sessions()` — 枚举 session。
- `delete(session_id)` — 删除 session，并级联删除 subagent session。
- `list_subkeys(session_id)` — 列出 subagent key。

`--session-mirror`（CLI flag）会在 transcript 流式传输时，将其同步写入外部文件，以便调试。

### Hook

可以注册以下 lifecycle hook：

- `PreToolUse`、`PostToolUse` — 管控或审计 Tool 调用。
- `SessionStart`、`SessionEnd` — 执行初始化和清理。
- `UserPromptSubmit` — 在 Model 看到用户输入之前对其进行处理。
- `PreCompact` — 在 Context compaction 前运行。
- `Stop` — 在 Agent 退出时清理。
- `Notification` — 发送侧信道通知。

pro-workflow（Phase 14 课程参考）及类似系统通过 hook 添加横切行为。

### W3C trace context

调用方上处于活动状态的 OTel span 会通过 W3C trace context header 传播到 CLI subprocess。整个多进程 trace 会在你的 backend 中显示为一条 trace。

### Claude Managed Agents

托管替代方案（beta header `managed-agents-2026-04-01`）。支持长时间运行的异步工作、内置 Prompt caching 和内置 compaction。它以降低控制能力为代价，换取托管基础设施。

### 此模式会在哪些地方出错

- **创建过多 subagent。** 为 100 个微小 Task 创建 100 个 subagent。开销会占据主导。应改为批量处理。
- **hook 蔓延。** 每个团队都在添加 hook；启动时间不断增长。每季度审查一次 hook。
- **session 膨胀。** session 不断累积，体积持续增长。使用 `list_sessions` 配合过期策略。

```figure
ae-subagent-isolation
```

## 动手构建

`code/main.py` 使用 stdlib 实现了 SDK 结构：

- `Tool`、`ToolRegistry`，包含内置的 `read_file`、`write_file`、`list_dir`。
- `Subagent` — 私有 Context、隔离运行并返回结果。
- `SessionStore` — append、load、list、delete、list_subkeys。
- `Hooks` — `pre_tool_use`、`post_tool_use`、`session_start`、`session_end`。
- 一个演示：main Agent 并行创建 3 个 subagent（各自相互隔离）、汇总结果并持久化 session。

运行：

```
python3 code/main.py
```

trace 展示了 subagent Context 隔离（orchestrator Context 大小保持有界）、hook 执行和 session 持久化。

## 实际使用

- **Claude Agent SDK** 适用于希望采用 Claude Code harness 结构的 Claude-first 产品。
- **Claude Managed Agents** 适用于托管的长时间异步工作。
- **OpenAI Agents SDK**（Lesson 16）适用于 OpenAI-first 的对应场景。
- 如果希望使用图结构的 state machine，请选择 **LangGraph + custom tools**。

## 交付成果

`outputs/skill-claude-agent-scaffold.md` 可生成一个 Claude Agent SDK 应用脚手架，其中包含 subagent、hook、session store、MCP server 接入和 W3C trace propagation。

## 练习

1. 添加一个 subagent spawner，将 20 个 Task 分成若干组，每组由 5 个并行 subagent 处理。比较 orchestrator Context 大小与每个 Task 使用一个 subagent 时的差异。
2. 实现一个 `PreToolUse` hook，对 `write_file` 调用进行限流（每个 session 每分钟 5 次）。记录行为 trace。
3. 接入 `list_subkeys` 以渲染 subagent tree。深层嵌套是什么样子？
4. 将 toy 实现迁移到真正的 `claude-agent-sdk` Python package。Tool 注册方式发生了什么变化？
5. 阅读 Claude Managed Agents 文档。你会在什么情况下从 self-hosted 切换到 managed？

## 关键术语

| Term | 人们通常怎么说 | 它实际表示什么 |
|------|----------------|------------------------|
| Agent SDK | “作为 library 的 Claude Code” | Harness 结构：Tool、MCP、hook、subagent、session store |
| Subagent | “子 Agent” | 独立 Context、独立预算；结果向上返回 |
| Session store | “对话 DB” | 持久化、加载、列出和删除对话轮次，并级联处理 subagent |
| Hook | “Lifecycle callback” | Tool 前后、session、Prompt submit、compact、stop |
| W3C trace context | “跨进程 trace” | parent span 传播到 CLI subprocess |
| Managed Agents | “托管 harness” | 由 Anthropic 托管的长时间异步工作 |
| `--session-mirror` | “Transcript mirror” | 在 session 对话轮次流式传输时，将其写入外部文件 |
| MCP server | “Tool 功能界面” | 附加到 Agent 的外部 Tool / resource 来源 |

## 延伸阅读

- [Claude Agent SDK 概览](https://platform.claude.com/docs/en/agent-sdk/overview) — library 形式的 Claude Code
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) — 生产环境模式
- [Claude Managed Agents 概览](https://platform.claude.com/docs/en/managed-agents/overview) — 托管替代方案
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) — 对应方案
