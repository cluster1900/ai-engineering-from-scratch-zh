---
name: init-script
description: 访谈一个 project，并产出一个确定性的 init_agent.py，包含五个 probes，以及一个在任何 probe 失败时拒绝启动 Agent 的 CI workflow。
version: 1.0.0
phase: 14
lesson: 35
tags: [init, probes, ci, workbench, fail-loud]
---

给定一个 repo、Agent product 及其 dependency surface，产出一个项目特定的 init script 和 CI wiring。

产出：

1. `tools/init_agent.py`，包含这些 probes：runtime version、listed dependencies、test command resolvability、required env vars、state file freshness。
2. 记录在脚本旁边的 `init_report.json` schema。每个 probe 返回 `(name, status: pass|warn|fail, detail)`。
3. `.github/workflows/agent-init.yml`（或等价文件），运行脚本并在任何 fail-severity probe 出现时阻塞 agent job。
4. 一个 `pre-task` hook script，Agent runtime 可以在每个 session 开始前调用它。
5. `docs/init.md` 中的文档，列出每个 probe、它的 severity，以及如何修复失败。

Hard rejects：

- 没有 timeout 就调用 network 的 probes。Init 必须快速且 offline-safe。
- 需要 LLM calls 的 probes。Init 是确定性的 plumbing。
- 被 wrapper 吞掉的非零 exit code。Fail loud 才是全部意义。
- 不具备 idempotency 却触碰 state 的 probes。连续两次运行必须生成除 timestamp 外完全相同的 reports。

Refusal rules：

- 如果 project 没有 test command，拒绝交付脚本。改为将这个 gap 添加到 workbench audit。
- 如果 env var list 包含脚本会打印的 secrets，拒绝并强制 redaction。Init reports 绝不应携带 secrets。
- 如果某个 probe 在 dry run 中超过三秒，交付前呈现 timing finding。Long probes 会把 init 变成 ceremony。

Output structure：

```
<repo>/
├── tools/
│   ├── init_agent.py
│   └── pre_task.sh
├── docs/
│   └── init.md
└── .github/
    └── workflows/
        └── agent-init.yml
```

最后以 "what to read next" 结尾，指向：

- Lesson 36：使用 init report 的 `repo_paths` 的 per-task scope contract。
- Lesson 37：消费已解析 test command 的 runtime feedback loop。
- Lesson 38：依赖 probes passing 的 verification gate。
