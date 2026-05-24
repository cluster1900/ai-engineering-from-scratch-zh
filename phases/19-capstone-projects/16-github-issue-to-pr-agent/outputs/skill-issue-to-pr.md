---
name: issue-to-pr
description: 构建一个 async GitHub issue-to-PR agent，它在 cloud sandbox 中运行，复现构建，验证测试，并在严格的按 repo 预算内打开可供 review 的 PR。
version: 1.0.0
phase: 19
lesson: 16
tags: [capstone, async-agent, github, fargate, daytona, swe-bench, budget, safety]
---

给定一个带有 `@agent fix this` label 的 GitHub repository，交付一个 self-hosted cloud agent，将每个带 label 的 issue 转换为一个带有 scoped credentials 且成本有界的、可供 review 的 PR。

构建计划：

1. GitHub App，使用 fine-grained token：issues rw、PRs write、contents rw、workflows read。不允许 force-push。main 上的 branch protection 防止直接写入。
2. Webhook receiver（Lambda 或 Fly.io）过滤 label / PR-comment 事件并入队到 SQS。
3. Dispatcher 强制执行按 repo、按天的金额和 PR 数量上限；为每个允许的 job 启动一个 ECS Fargate task。
4. 环境推断：从 repo 内容中检测 language + package manager + runtime。如果缺失，则即时合成 Dockerfile。
5. 每个 task 使用 Daytona 或 E2B sandbox。将 repo clone 到一个新的 `git worktree` + agent branch 中。
6. Agent loop（mini-swe-agent 或 SWE-agent v2，基于 Claude Opus 4.7 或 GPT-5.4-Codex）。Tools：ripgrep、tree-sitter repo-map、read_file、edit_file、run_tests、git。限制：$20、30 turns、30 min。
7. 验证：在 sandbox 内运行完整 CI；通过 jacoco / coverage.py 计算 coverage delta；如果 delta < -2%，添加 `needs-review` label；如果 CI red，则停止。
8. 通过 GitHub API 打开 PR，包含 rationale、diff summary、trace URL、cost、turns。
9. Observability：每个 PR 一个 Langfuse trace；log scrub 处理 secrets；按 repo 的 budget dashboard。
10. 在 30 个 seeded internal issues 上评估；在一个三 issue 的共享子集上，与 Cursor Background Agents 和 AWS Remote SWE Agents 对比。

评估 rubric：

| Weight | Criterion | Measurement |
|:-:|---|---|
| 25 | 30 个 issues 上的 pass rate | End-to-end success（CI green + coverage OK） |
| 20 | PR 质量 | Diff size、coverage delta、style conformance |
| 20 | 每个已解决 issue 的 cost 和 latency | $/PR 和 wall-clock/PR |
| 20 | Safety | Scoped token、按 repo budget、无 force-push、credential hygiene |
| 15 | Operator UX | Rationale comments、retry affordance、@-mention follow-up |

硬性拒绝：

- 任何可以 force-push 的 agent。硬性排除。
- 跳过 budget checks 的 dispatchers。Runaway loops 是典型故障。
- 未在 sandbox 内通过完整 CI 就打开的 PR。
- Trace archives 包含未 redact 的 tokens 或 PII。

拒绝规则：

- 如果 main 上没有 branch protection，拒绝安装。
- 如果没有按 repo 的每日 budget（dollars 和 PR count），拒绝运行。
- 拒绝自动 retry 失败的 runs；所有 retries 都需要人工重新应用 label。

输出：一个 repo，包含 GitHub App、webhook receiver、dispatcher + budget ledger、Fargate task definition、sandbox lifecycle manager、mini-swe-agent loop、30-issue eval run、与 Cursor Background Agents 和 AWS Remote SWE Agents 的 side-by-side comparison，以及一份 write-up，列出前三个 build-inference failures 和减少每个 failure 的 Dockerfile-synthesis change。
