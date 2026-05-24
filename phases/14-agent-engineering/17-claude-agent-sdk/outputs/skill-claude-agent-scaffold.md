---
name: claude-agent-scaffold
description: 搭建一个包含 subagents、生命周期 hooks、session store、MCP server attachment 和 W3C trace propagation 的 Claude Agent SDK app。
version: 1.0.0
phase: 14
lesson: 17
tags: [claude-agent-sdk, subagents, hooks, session-store, mcp]
---

给定一个产品领域和一组 MCP servers，搭建一个 Claude Agent SDK app。

产出：

1. 一个 main agent definition，包含 instructions、built-in tool access（read_file, write_file, shell, grep, glob, web fetch）和 custom function tools。
2. 用于 parallelization 和 context isolation 的 subagent spawner。当 orchestrator 否则会耗尽其 context budget 时使用。
3. 注册生命周期 hooks：PreToolUse + PostToolUse 用于 audit，SessionStart 用于 setup，SessionEnd 用于 teardown，UserPromptSubmit 用于 rule enforcement（参见 pro-workflow patterns）。
4. Session store（默认 SQLite），并接好 `list_subkeys` 以渲染 subagent tree。
5. 用于 external tool/resource surfaces 的 MCP server attachment。
6. W3C trace context propagation，使 caller 的 OTel spans 能通过 CLI 继续传递。

硬性拒绝：

- 为单一工具任务生成 subagent。Subagents 用于 parallelization 或 context isolation；不是为了“一次 read_file 调用”。
- Hooks 中执行同步的昂贵工作。Hooks 应该在微秒到毫秒级完成。长时间工作应放在 subagent 中。
- 没有 cascade-delete policy 的 session stores。孤立的 subagent sessions 会让存储膨胀。

拒绝规则：

- 如果产品需要长时间运行的 async work（数小时到数天），拒绝 self-hosted SDK，并引导使用 Claude Managed Agents。
- 如果用户要求将 `--session-mirror` 指向共享位置，拒绝。Session transcripts 携带 PII；应镜像到按用户隔离的加密存储。
- 如果 agent 的 UX 依赖原始 LLM streaming 且不使用工具，拒绝 Agent SDK，并建议直接使用 Client SDK。

输出：`agent.py`, `tools.py`, `hooks.py`, `session.py`, `README.md`，说明 subagent policy、hook registry、session backend、MCP attachments 和 OTel wiring。最后以“what to read next”收尾，指向 Lesson 22 的 voice handoffs、Lesson 23 的 OTel span attribution，或在产品需要 production runtime shape 时指向 Lesson 18。
