---
name: terminal-coding-agent
description: 构建并评估一个 terminal-native coding agent，在有界成本、沙箱化 tools 和完整 2026 hook surface 下对标 SWE-bench Pro。
version: 1.0.0
phase: 19
lesson: 01
tags: [capstone, coding-agent, claude-code, swe-bench, mcp, hooks, sandbox]
---

给定一个目标 repository 和一个自然语言任务，构建一个能够 plan、在 sandbox 中执行并打开 pull request 的 harness。在 30-task SWE-bench Pro 子集上达到或超过 mini-swe-agent baseline，同时保持在每任务 $5 预算以内。

Build plan:

1. 搭建一个 Bun + Ink TUI harness，包含 plan pane、tool-call stream，以及实时 Token/美元 budget。
2. 通过 Model Context Protocol StreamableHTTP 定义六个 tools (read_file, edit_file, ripgrep, tree_sitter_symbols, run_shell, git)。每次调用最多返回 4k Tokens。
3. 在全新的 `git worktree add` branch 上，将每个 tool call 都放入 E2B 或 Daytona sandbox 内运行。永远不要触碰 host filesystem。
4. 接入全部八个 2026 hook events：SessionStart, SessionEnd, PreToolUse, PostToolUse, UserPromptSubmit, Notification, Stop, PreCompact。交付至少四个用户编写的 hooks（destructive-command guard、Token accounting、OTel span emitter、trace bundle writer）。
5. 强制执行三个 budgets：50 turns、200k Tokens、$5。PreCompact 在 150k 触发，并摘要较早的 turns。
6. 使用 GenAI semantic conventions 发送 OpenTelemetry spans 到 self-hosted Langfuse。
7. 成功后，push branch 并打开 PR，在正文中包含 plan 和 trace bundle。
8. 在 30-issue SWE-bench Pro Python 子集上与 mini-swe-agent 对比评估，并记录每个任务的 pass@1、turns、Tokens 和 dollars。

Assessment rubric:

| Weight | Criterion | Measurement |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | 匹配的 30-task 子集 vs mini-swe-agent baseline |
| 20 | Architecture clarity | Plan/act/observe 分离、hook surface、tool schema 可读性 |
| 20 | Safety | Sandbox escape red-team + destructive-command guard audit |
| 20 | Observability | 100% 的 tool calls 都有 span、每轮 Token accounting |
| 15 | Developer UX | Cold-start 低于 2s、crash recovery、Ctrl-C cancel semantics |

Hard rejects:

- 在 host filesystem 上 shell out to git，而不是在 sandbox 内执行的 harness。
- 任何可以写入 worktree 外部，或在没有 explicit allowlist hook 的情况下 curl 外部 URL 的 agent。
- 没有在相同 30 issues 上运行匹配 baseline 就报告的 eval numbers。
- 依赖重试之间 `git reset --hard` 的 “Pass rate” 声称；SWE-bench Pro 是 pass@1。

Refusal rules:

- 在任何配置下都拒绝直接 push 到 main。只允许 PR branches。
- 拒绝禁用 destructive-command guard。它是 rubric 的硬性要求。
- 拒绝在没有 budget ceiling 的情况下运行。Open-ended runs 会污染 eval comparison。

Output: 一个包含 harness 的 repo；一个固定的 30-task SWE-bench Pro eval harness，并带有匹配的 mini-swe-agent baseline run；至少 5 次完整运行的 OpenTelemetry trace archive；以及一份 write-up，说明你的 harness 解决了 baseline 未解决的哪些 tasks，反之亦然。最后用一个 section 说明你观察到的前三个 failure modes，以及修复每个问题的 hook change。
