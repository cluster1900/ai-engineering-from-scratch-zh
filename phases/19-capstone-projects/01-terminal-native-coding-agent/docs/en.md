# Capstone 01 — 终端原生 Coding Agent

> 到 2026 年，coding Agent 的形态已经定型。一个 TUI harness、一个有状态的 plan、一个沙箱化的 Tool surface、一个负责 plan、act、observe、recover 的循环。Claude Code、Cursor 3 和 OpenCode 从远处看都差不多。本 capstone 要求你端到端构建一个这样的系统——从 CLI 输入，到 pull request 输出——并在 SWE-bench Pro 上与 mini-swe-agent 和 Live-SWE-agent 对比。你将理解为什么难点不是 Model call，而是 Tool loop、sandbox，以及一次 50-turn 运行中的成本上限。

**类型：** Capstone
**语言：** TypeScript / Bun (harness), Python (评估脚本)
**先修要求：** Phase 11 (LLM 工程), Phase 13 (Tools 和协议), Phase 14 (Agents), Phase 15 (自主系统), Phase 17 (基础设施)
**覆盖阶段：** P0 · P5 · P7 · P10 · P11 · P13 · P14 · P15 · P17 · P18
**时间：** 35 小时

## 问题
到 2026 年，coding Agents 已成为占主导地位的 AI 应用类别。Claude Code (Anthropic)、带 Composer 2 和 Agent Tabs 的 Cursor 3 (Cursor)、Amp (Sourcegraph)、OpenCode (112k stars)、Factory Droids 和 Google Jules 都发布了同一架构的不同变体：一个 terminal harness、一个带权限的 Tool surface、一个 sandbox，以及一个围绕 frontier Model 构建的 plan-act-observe loop。前沿很窄——Live-SWE-agent 使用 Opus 4.5 在 SWE-bench Verified 上达到 79.2%——但工程工艺很宽。大多数失败模式不是 Model 错误。它们是 Tool-loop 不稳定、Context poisoning、Token 成本失控，以及破坏性的 filesystem 操作。

你无法从外部理解这些 Agents。你必须亲手构建一个，观察 loop 在第 47 轮因为 ripgrep 返回 8MB 匹配而崩溃，然后重建截断层。这就是本 capstone 的意义。

## 概念
harness 有四个 surface。**Plan** 维护一个 TodoWrite 风格的状态对象，由 Model 每一轮重写。**Act** 分发 Tool calls (read, edit, run, search, git)。**Observe** 捕获 stdout / stderr / exit codes，进行截断，并把摘要反馈回去。**Recover** 处理 Tool errors，同时避免撑爆 Context window 或无限循环。2026 年的形态又增加了一样东西：**hooks**。`PreToolUse`, `PostToolUse`, `SessionStart`, `SessionEnd`, `UserPromptSubmit`, `Notification`, `Stop`, 和 `PreCompact`——这些是可配置的扩展点，运维人员可以在其中注入 policy、telemetry 和 guardrails。

sandbox 使用 E2B 或 Daytona。每个任务都在一个全新的 devcontainer 中运行，并挂载一个可读写的 git worktree。harness 永远不会触碰 host filesystem。worktree 在成功或失败后都会被销毁。成本控制在三层强制执行：每轮 Token 上限、每 session 美元预算，以及硬性 turn 限制（通常为 50）。observability layer 是采用 GenAI semantic conventions 的 OpenTelemetry spans，并发送到 self-hosted Langfuse。

## 架构
```
  user CLI  ->  harness (Bun + Ink TUI)
                  |
                  v
           plan / act / observe loop  <--->  Claude Sonnet 4.7 / GPT-5.4-Codex / Gemini 3 Pro
                  |                          (via OpenRouter, model-agnostic)
                  v
           tool dispatcher (MCP StreamableHTTP client)
                  |
     +------------+------------+----------+
     v            v            v          v
  read/edit    ripgrep     tree-sitter   git/run
     |            |            |          |
     +------------+------------+----------+
                  |
                  v
           E2B / Daytona sandbox  (worktree isolated)
                  |
                  v
           hooks: Pre/Post, Session, Prompt, Compact
                  |
                  v
           OpenTelemetry -> Langfuse (spans, tokens, $)
                  |
                  v
           PR via GitHub app
```

## 技术栈
- Harness runtime: Bun 1.2 + Ink 5 (终端中的 React)
- Model 访问：OpenRouter 统一 API，支持 Claude Sonnet 4.7、GPT-5.4-Codex、Gemini 3 Pro、Opus 4.5（用于最难任务）
- Tool transport: Model Context Protocol StreamableHTTP (MCP 2026 修订版)
- Sandbox: E2B sandboxes (JS SDK) 或 Daytona devcontainers
- 代码搜索：ripgrep subprocess，适用于 17 种语言的 tree-sitter parsers (预编译)
- 隔离：每个任务使用 `git worktree add`，成功 / 失败时清理
- 评估 harness: SWE-bench Pro (已验证子集) + Terminal-Bench 2.0 + 你自己的 30-task holdout
- 可观测性：采用 `gen_ai.*` semconv 的 OpenTelemetry SDK → 自托管 Langfuse
- PR 发布：GitHub App 使用 fine-grained Token，scope 限制在目标 repo

```figure
ce-agent-loop
```

## 构建它
1. **TUI 和命令循环。** 搭建一个使用 Ink 的 Bun 项目。接收 `agent run <repo> "<task>"`。打印一个分屏视图：plan pane（顶部）、Tool-call stream（中部）、Token budget（底部）。添加 Ctrl-C 取消逻辑，在退出前触发 `SessionEnd` hook。

2. **Plan 状态。** 定义一个带类型的 TodoWrite schema（包含 pending / in_progress / done items 和 notes）。Model 每一轮通过 Tool call 重写完整状态——不要让它增量修改。将 plan 持久化到 `.agent/state.json`，这样崩溃后可以 resume。

3. **Tool surface。** 定义六个 Tools：`read_file`, `edit_file`（带 diff preview）, `ripgrep`, `tree_sitter_symbols`, `run_shell`（带 timeout）, `git`（status / diff / commit / push）。通过 MCP StreamableHTTP 暴露，使 harness 与 transport 解耦。每个 Tool 都返回截断后的输出（每次调用最多 4k Tokens）。

4. **Sandbox 封装。** 每个任务都会启动一个 E2B sandbox。用 `git worktree add -b agent/$TASK_ID` 创建一个新 branch。所有 Tool calls 都在 sandbox 内执行。host filesystem 不可访问。

5. **Hooks。** 实现全部八种 2026 hook 类型。至少接入四个用户编写的 hooks：(a) `PreToolUse` destructive-command guard，阻止 worktree 外的 `rm -rf`，(b) `PostToolUse` Token accounting，(c) `SessionStart` budget initialization，(d) `Stop` 写入 final trace bundle。

6. **评估循环。** Clone 一个包含 30 个 issue 的 SWE-bench Pro Python 子集。对每个 issue 运行你的 harness。与 mini-swe-agent（最小 baseline）比较 pass@1、turns-per-task 和 $-per-task。将结果写入 `eval/results.jsonl`。

7. **成本控制。** 硬性截断：50 turns、200k Context、每任务 $5。`PreCompact` hook 在 150k 处将较早的 turns 摘要为 prior-state block，为新的 observations 腾出空间，同时不丢失 plan。

8. **PR 发布。** 成功后，最后一步是 `git push`，然后调用 GitHub API 打开一个 PR，并在正文中包含 plan 和 diff summary。

## 使用它
```
$ agent run ./my-repo "Fix the race condition in worker.rs"
[plan]  1 locate worker.rs and enumerate mutex uses
        2 identify shared state under contention
        3 propose fix, verify tests
[tool]  ripgrep mutex.*lock -t rust           (44 matches, truncated)
[tool]  read_file src/worker.rs 120..180
[tool]  edit_file src/worker.rs (+8 -3)
[tool]  run_shell cargo test worker::          (passed)
[plan]  1 done · 2 done · 3 done
[done]  PR opened: #482   turns=9   tokens=38k   cost=$0.41
```

## 交付它
交付的 Skill 位于 `outputs/skill-terminal-coding-agent.md`。给定一个 repo path 和 task description，它会在 sandbox 中运行完整的 plan-act-observe loop，并返回 PR URL 和 trace bundle。本 capstone 的评分标准：

| 权重 | 标准 | 衡量方式 |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 与 baseline 对比 | 你的 harness 与 mini-swe-agent 在 30 个匹配的 Python tasks 上对比 |
| 20 | 架构清晰度 | Plan/act/observe 分离、hook surface、Tool schema——对照 Live-SWE-agent layout 评审 |
| 20 | 安全性 | Sandbox escape tests、permission prompts、destructive-command guard 通过 red-team |
| 20 | 可观测性 | Trace completeness（100% 的 Tool calls 都有 span）、每轮 Token accounting |
| 15 | 开发者体验 | Cold-start < 2s，crash recovery resumes plan，Ctrl-C 能干净地取消 mid-tool |
| **100** | | |

## 练习
1. 将 backing Model 从 Claude Sonnet 4.7 切换为运行在 vLLM 上的 Qwen3-Coder-30B。比较 pass@1 和 $-per-task。报告 open Model 表现较差的地方。

2. 添加一个 `reviewer` sub-Agent，在 PR 发布前读取 diff，并可以请求一个 revision loop。衡量 false-positive reviews 是否会让 SWE-bench pass rate 低于 single-Agent baseline（提示：通常会）。

3. 压测 sandbox：编写一个尝试 `curl` 外部 URL 的任务，以及一个尝试写入 worktree 外部的任务。确认二者都被 PreToolUse hook 阻止。记录这些 attempts。

4. 使用较小的 Model (Haiku 4.5) 实现 `PreCompact` summarization。衡量在 3x compaction 下损失了多少 plan fidelity。

5. 将 MCP StreamableHTTP transport 替换为 stdio。Benchmark cold-start 和 per-call latency。为仅限本地的使用场景选择胜者。

## 关键术语
| 术语 | 人们怎么说 | 它的实际含义 |
|------|-----------------|------------------------|
| Harness | “Agent loop” | 围绕 Model 的代码，负责分发 Tools、维护 plan state，并强制执行 budgets |
| Hook | “Agent 事件监听器” | 由 harness 在八种 lifecycle events 之一上运行的用户编写脚本 |
| Worktree | “Git sandbox” | 位于独立路径的 linked git checkout；可以丢弃而不触碰 main clone |
| TodoWrite | “Plan state” | Model 每轮都会重写的 typed list，包含 pending/in-progress/done items |
| StreamableHTTP | “MCP transport” | 2026 MCP 修订版：具备双向 streaming 的 long-lived HTTP connection；取代 SSE |
| Token ceiling | “Context budget” | 对 input+output Tokens 设置的每轮或每 session 上限；触发 compaction 或 termination |
| pass@1 | “单次尝试通过率” | SWE-bench tasks 在第一次运行中解决的比例，不包含 retry 或 test-set peeking |

## 延伸阅读
- [Claude Code 文档](https://docs.anthropic.com/en/docs/claude-code) — 来自 Anthropic 的参考 harness
- [Cursor 3 更新日志](https://cursor.com/changelog) — Agent Tabs 和 Composer 2 产品说明
- [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) — 用于 SWE-bench harness 对比的最小 baseline
- [Live-SWE-agent](https://github.com/OpenAutoCoder/live-swe-agent) — 使用 Opus 4.5 在 SWE-bench Verified 上达到 79.2%
- [OpenCode](https://opencode.ai) — 开放式 harness，112k stars
- [SWE-bench Pro 排行榜](https://www.swebench.com) — 本 capstone 面向的 Evaluation
- [Model Context Protocol 2026 路线图](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) — StreamableHTTP，capability metadata
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — Tool calls 和 Token usage 的 span schema
