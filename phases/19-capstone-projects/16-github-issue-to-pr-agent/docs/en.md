# 综合项目 16 — GitHub Issue-to-PR 自主 Agent

> 给 issue 添加 label，即可获得 PR——这是 2026 年自主编码 Agent 的产品形态：在云端 sandbox 中运行 Agent，验证测试通过，并提交附带决策依据、可供 review 的 PR。AWS Remote SWE Agents、Cursor Background Agents、OpenAI Codex cloud 和 Google Jules 都已提供这一能力。真正困难的部分是自动复现 repo 的构建环境、防止 credential 泄漏、强制执行每个 repo 的预算，以及确保 Agent 无法 force-push。本综合项目将构建 self-hosted 版本，并从成本和通过率两个方面与 hosted 替代方案进行比较。

**Type:** Capstone
**Languages:** Python (Agent), TypeScript (GitHub App), YAML (Actions)
**Prerequisites:** Phase 11（LLM engineering）、Phase 13（Tool）、Phase 14（Agent）、Phase 15（自主运行）、Phase 17（基础设施）
**Phases exercised:** P11 · P13 · P14 · P15 · P17
**Time:** 30 小时

## 问题

异步云端编码 Agent 与交互式编码 Agent（综合项目 01）属于不同的产品类别。它的 UX 就是一个 GitHub label。你为 issue 添加 `@agent fix this` label，worker 随即在云端 sandbox 中启动，clone repo、运行测试、编辑文件、执行验证，然后创建 PR，并在 PR 正文中写入 Agent 的决策依据。没有交互循环，也没有终端。AWS Remote SWE Agents、Cursor Background Agents、OpenAI Codex cloud、Google Jules 和 Factory Droids 都在向这一形态靠拢。

工程挑战非常具体：环境复现（Agent 必须在没有缓存 dev image 的情况下从零构建 repo）、不稳定测试（必须重新运行或隔离）、credential scope 控制（使用具有最小细粒度权限的 GitHub App）、强制执行每个 repo 的每日预算，以及禁止 force-push 的策略。本综合项目将衡量其通过率、成本与安全性，并与 hosted 替代方案进行比较。

## 概念

触发器是 GitHub webhook（issue label 或 PR comment）。dispatcher 将任务加入 ECS Fargate 或 Lambda 队列。worker 将 repo 拉取到 Daytona 或 E2B sandbox 中，并使用根据 repo 推断出的通用 Dockerfile（语言、framework）。Agent 使用 Claude Opus 4.7 或 GPT-5.4-Codex 运行 mini-swe-agent 或 SWE-agent v2 循环。它会反复执行：读取代码、提出修复方案、应用 patch、运行测试。

验证是 gate 步骤。只有在 sandbox 内完整 CI 通过后才能创建 PR。系统会计算 coverage delta；如果负向变化超过阈值，仍会创建 PR，但会添加 `needs-review` label。Agent 将决策依据作为 PR 描述发布，并创建一个 reviewer 可以通过 `@agent` 请求后续处理的 thread。

安全性由两个不同的 GitHub surface 共同限定：App 提供短期 installation token，具有 `workflows: read` 以及范围受限的 repo contents/PR 权限；branch protection（而不是 App 权限）强制执行“禁止直接写入 `main`”和“禁止 force-push”——App 永远不会被加入 bypass list。GitHub App 并不提供针对 `.github/workflows` 的 path-scoped read-only access，因此必须由 worker 中针对文件编辑的 allow-list 强制执行这一限制。每个 repo 的每日预算上限由 dispatcher 强制执行（例如，每个 repo 每天最多 5 个 PR，每个 PR 最多 $20）。

## 架构

```
GitHub issue 被添加 `@agent fix` label，或收到 PR comment
            |
            v
    GitHub App webhook -> AWS Lambda dispatcher
            |
            v
    ECS Fargate task（或 GitHub Actions self-hosted runner）
       - 拉取 repo
       - 推断 Dockerfile（语言、package manager）
       - 带有目标 runtime 的 Daytona / E2B sandbox
       - clone -> git worktree -> Agent branch
            |
            v
    mini-swe-agent / SWE-agent v2 循环
       Claude Opus 4.7 或 GPT-5.4-Codex
       Tool：ripgrep、tree-sitter、read/edit、run_tests、git
            |
            v
    验证 sandbox 内 CI 通过 + coverage delta 检查
            |
            v（验证通过）
    git push + 通过 GitHub App 创建 PR
       PR 正文 = 决策依据 + diff 摘要 + trace URL
       label：needs-review
            |
            v
    operator 执行 review；可通过 @-mention Agent 请求后续处理
```

## 技术栈

- 触发器：使用细粒度 Token 的 GitHub App；通过 Lambda 或 Fly.io 接收 webhook
- Worker：ECS Fargate task（或 GitHub Actions self-hosted runner）
- Sandbox：每个 task 使用 Daytona devcontainer 或 E2B sandbox
- Agent 循环：基于 Claude Opus 4.7 / GPT-5.4-Codex 的 mini-swe-agent baseline 或 SWE-agent v2
- Retrieval：tree-sitter repo-map + ripgrep
- 验证：sandbox 内完整 CI + coverage delta gate
- Observability：Langfuse，提供每个 PR 的 trace archive，并从 PR 正文链接
- 预算：每个 repo 的每日金额上限；每个 repo 每日最大 PR 数量

```figure
cf-issue-to-pr
```

## 构建它

1. **GitHub App。** 细粒度 installation token：issues read+write、pull_requests write、contents read+write、workflows read。Branch protection（唯一能够做到这一点的 surface）强制执行“禁止直接 push 到 `main`”和“禁止 force-push”；App 不在 bypass list 中。由于 GitHub App 权限无法按路径限定，worker 会对提出的 diff 执行 allow-list 检查，从而强制执行“禁止写入 `.github/workflows`”。

2. **Webhook receiver。** Lambda function 接收 issue label / PR comment webhook。按 `@agent fix this` label 进行过滤，并将任务加入 SQS。

3. **Dispatcher。** 从 SQS 中取出 task。强制执行每个 repo 的每日预算。使用 repo URL、issue 正文和全新的 Daytona sandbox 启动 ECS Fargate task。

4. **环境推断。** 检测语言（Python、Node、Go、Rust）和 package manager（uv、pnpm、go mod、cargo）。如果 Dockerfile 不存在，则动态生成。

5. **Agent 循环。** 使用 Claude Opus 4.7 的 mini-swe-agent 或 SWE-agent v2。Tool：ripgrep、tree-sitter repo-map、read_file、edit_file、run_tests、git。硬限制：成本 $20、wall-clock 时间 30 分钟、30 个 Agent turn。

6. **验证。** 循环结束后，在 sandbox 内运行完整 test suite。通过 jacoco / coverage.py 计算 coverage delta。如果 CI 为红色：停止，不创建 PR。如果 coverage 下降超过 2%：创建带有 `needs-review` label 的 PR。

7. **发布 PR。** Push Agent branch。通过 GitHub API 创建 PR，并包含：标题、决策依据、diff 摘要、trace URL、成本、turn 数量。

8. **Credential 卫生。** Worker 使用短期 GitHub App installation token 运行。归档日志前先清除其中的 secret。

9. **Evaluation。** 使用 30 个具有不同难度的预设内部 issue。衡量通过率、PR 质量（diff 大小、coverage、风格）、成本和延迟。在相同 issue 上与 Cursor Background Agents 和 AWS Remote SWE Agents 进行比较。

## 使用它

```
# 在 github.com 上
  - 用户为 issue #842 添加 `@agent fix this` label
  - 14 分钟后出现 PR #1903
  - 正文：
    > 修复了由 null comparator entry 引起的 widget.dedupe() NPE。
    > 添加了回归测试 widget_test.go::TestDedupeNullComparator。
    > Coverage delta：+0.12%
    > Turn：7  成本：$1.80  Trace：langfuse:...
    > Label：needs-review
```

## 交付它

`outputs/skill-issue-to-pr.md` 是交付产物。它由 GitHub App 和异步云端 worker 组成，能够在成本受限、credential scope 明确的前提下，将带 label 的 issue 转换为可供 review 的 PR。

| 权重 | 标准 | 衡量方式 |
|:-:|---|---|
| 25 | 30 个 issue 的通过率 | 端到端成功（CI 绿色 + coverage 合格） |
| 20 | PR 质量 | Diff 大小、coverage delta、风格一致性 |
| 20 | 每个已解决 issue 的成本和延迟 | 每个 PR 的金额和 wall-clock 时间 |
| 20 | 安全性 | 限定 scope 的 Token、每个 repo 的预算、禁止 force-push、credential 卫生 |
| 15 | Operator UX | 决策依据 comment、重试入口、@-mention 后续处理 |
| **100** | | |

## 练习

1. 添加“修复不稳定测试”模式：label `@agent stabilize-flake TestX` 会在 sandbox 内运行测试 50 次，并提出能够稳定测试的最小改动。

2. 在三个共享 issue 上与 Cursor Background Agents 比较成本。报告各 Tool 分别在哪些场景胜出。

3. 实现预算 dashboard：每个 repo 的每日成本、每个用户的成本。出现异常时发出 alert。

4. 构建“dry-run”模式：无需运行 CI 即可创建 draft PR，让 reviewer 能够以较低成本检查计划。

5. 添加保留策略：自动删除超过 7 天仍未 merge 的 PR branch。

## 关键术语

| 术语 | 人们怎么说 | 实际含义 |
|------|-----------------|------------------------|
| GitHub App | “限定 scope 的 bot identity” | 具有细粒度权限和短期 installation token 的 App |
| Async cloud Agent | “Background Agent” | 在云端 sandbox 中运行的非交互式 worker，而不是终端 |
| Environment inference | “Dockerfile synthesis” | 检测语言和 package manager，并在缺失时生成 Dockerfile |
| Verification | “sandbox 内 CI” | 创建 PR 前在 worker 内运行完整 test suite |
| Coverage delta | “Coverage preservation” | 从 base branch 到 Agent branch 的测试 coverage 百分比变化 |
| Per-repo budget | “每日上限” | 由 dispatcher 强制执行的金额和 PR 数量上限 |
| Rationale | “PR 正文说明” | Agent 对改动内容及原因的摘要；必须包含在 PR 正文中 |

## 延伸阅读

- [AWS Remote SWE Agents](https://github.com/aws-samples/remote-swe-agents) — 规范的异步云端 Agent 参考实现
- [SWE-agent](https://github.com/SWE-agent/SWE-agent) — CLI 参考
- [Cursor Background Agents](https://docs.cursor.com/background-agent) — 商业替代方案
- [OpenAI Codex (cloud)](https://openai.com/codex) — hosted 竞品
- [Google Jules](https://jules.google) — Google 的 hosted 版本
- [Factory Droids](https://www.factory.ai) — 另一项商业参考
- [GitHub App documentation](https://docs.github.com/en/apps) — 限定 scope 的 bot identity
- [Daytona cloud sandboxes](https://daytona.io) — sandbox 参考
