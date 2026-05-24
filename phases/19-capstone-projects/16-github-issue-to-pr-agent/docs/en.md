# 综合项目 16 — GitHub Issue-to-PR Autonomous Agent

> AWS Remote SWE Agents、Cursor Background Agents、OpenAI Codex cloud 和 Google Jules 都交付了同一种 2026 产品形态：给 issue 打 label，就得到一个 PR。在 cloud sandbox 中运行 agent，验证 tests 通过，并发布一个带有 rationale、可供 review 的 PR。难点在于自动复现 repo 的 build environment、防止 credential leakage、强制执行 per-repo budgets，以及确保 agent 无法 force-push。这个 capstone 会构建 self-hosted 版本，并在 cost 和 pass rate 上与 hosted alternatives 对比。

**Type:** Capstone
**Languages:** Python (agent), TypeScript (GitHub App), YAML (Actions)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:** P11 · P13 · P14 · P15 · P17
**Time:** 30 小时

## 问题
async cloud coding agent 是一个不同于 interactive coding agents (capstone 01) 的独立产品类别。UX 是一个 GitHub label。你给 issue 标记 `@agent fix this`，worker 会在 cloud sandbox 中启动、clone repo、运行 tests、编辑文件、验证，并打开一个在正文中包含 agent rationale 的 PR。没有 interactive loop，也没有 terminal。AWS Remote SWE Agents、Cursor Background Agents、OpenAI Codex cloud、Google Jules 和 Factory Droids 都在向这一形态收敛。

工程挑战很具体：environment reproduction（agent 必须在没有 cached dev image 的情况下从零 build repo）、flaky tests（必须重新运行或隔离）、credential scoping（具备最小 fine-grained permissions 的 GitHub App）、按 repo 按天执行 budget，以及 no-force-push policy。这个 capstone 会衡量 pass rate、cost 和 safety，并与 hosted alternatives 对比。

## 概念
触发器是 GitHub webhook（issue label 或 PR comment）。dispatcher 将 work 入队到 ECS Fargate 或 Lambda。worker 将 repo 拉入 Daytona 或 E2B sandbox，并使用从 repo 推断出的通用 Dockerfile（language、framework）。agent 运行一个面向 Claude Opus 4.7 或 GPT-5.4-Codex 的 mini-swe-agent 或 SWE-agent v2 loop。它会迭代执行：read code、propose fix、apply patch、run tests。

Verification 是 gating step。PR 打开前，完整 CI 必须在 sandbox 中通过。计算 coverage delta；如果超过阈值为负，PR 仍会打开，但会被标记为 `needs-review`。agent 会把 rationale 作为 PR description 发布，并添加一个 reviewer 可 ping 以进行 follow-ups 的 `@agent` thread。

Safety 通过两个不同的 GitHub surfaces 进行限定：App 提供一个短期 installation token，具备 `workflows: read` 和较窄的 repo contents/PR scopes；branch protection（而不是 app permissions）强制执行“禁止直接写入 `main`”和“禁止 force-push”，且 app 永远不会被加入 bypass list。对 `.github/workflows` 的 path-scoped read-only access 不是实际的 GitHub App primitive，因此 agent 的 file edits allow-list 必须在 worker 中强制执行。按 repo 按天的 budget ceilings 在 dispatcher 中强制执行（例如每个 repo 每天最多 5 个 PR，每个 PR $20）。

## 架构
```
GitHub issue 被标记为 `@agent fix` 或 PR comment
            |
            v
    GitHub App webhook -> AWS Lambda dispatcher
            |
            v
    ECS Fargate task（或 GitHub Actions self-hosted runner）
       - pull repo
       - infer Dockerfile（language、package manager）
       - Daytona / E2B sandbox，带 target runtime
       - clone -> git worktree -> agent branch
            |
            v
    mini-swe-agent / SWE-agent v2 loop
       Claude Opus 4.7 或 GPT-5.4-Codex
       tools: ripgrep, tree-sitter, read/edit, run_tests, git
            |
            v
    verify CI passes in-sandbox + coverage delta check
            |
            v（已验证）
    git push + 通过 GitHub App open PR
       PR body = rationale + diff summary + trace URL
       label: needs-review
            |
            v
    operator review；可以 @-mention agent 进行 follow-ups
```

## 技术栈
- Trigger: 具备 fine-grained token 的 GitHub App；通过 Lambda 或 Fly.io 的 webhook receiver
- Worker: ECS Fargate task（或 GitHub Actions self-hosted runner）
- Sandbox: 每个 task 一个 Daytona devcontainer 或 E2B sandbox
- Agent loop: 基于 Claude Opus 4.7 / GPT-5.4-Codex 的 mini-swe-agent baseline 或 SWE-agent v2
- Retrieval: tree-sitter repo-map + ripgrep
- Verification: full CI in-sandbox + coverage delta gate
- Observability: Langfuse，带 per-PR trace archive，并从 PR body 链接
- Budget: per-repo daily dollar ceiling；每个 repo 每天最多 PR 数

## 构建它
1. **GitHub App.** Fine-grained installation token：issues read+write、pull_requests write、contents read+write、workflows read。Branch protection（唯一能做到这一点的 surface）强制执行“禁止 direct push 到 `main`”和“禁止 force-push”；app 不在 bypass list 中。worker 对 proposed diff 执行“禁止写入 `.github/workflows` 下的内容”的 allow-list check，因为 GitHub App permissions 不是 path-scoped。

2. **Webhook receiver.** Lambda function 接收 issue label / PR comment webhooks。按 label `@agent fix this` 过滤。入队到 SQS。

3. **Dispatcher.** 从 SQS 弹出 tasks。强制执行 per-repo per-day budget。用 repo URL、issue body 和一个全新的 Daytona sandbox 启动 ECS Fargate task。

4. **Environment inference.** 检测 language（Python、Node、Go、Rust）和 package manager（uv、pnpm、go mod、cargo）。如果不存在 Dockerfile，则动态生成一个。

5. **Agent loop.** 使用 Claude Opus 4.7 的 mini-swe-agent 或 SWE-agent v2。Tools: ripgrep、tree-sitter repo-map、read_file、edit_file、run_tests、git。硬限制：$20 cost、30 min wall-clock、30 agent turns。

6. **Verification.** loop 结束后，在 sandbox 中运行完整 test suite。通过 jacoco / coverage.py 计算 coverage delta。如果 CI red：停止，不打开 PR。如果 coverage 下降超过 2%：打开带 `needs-review` label 的 PR。

7. **PR posting.** Push agent branch。通过 GitHub API 打开 PR，包含：title、rationale、diff summary、trace URL、cost、turns。

8. **Credential hygiene.** Worker 使用短期 GitHub App installation token 运行。Logs 在归档前会 scrub secrets。

9. **Eval.** 30 个不同难度的 seeded internal issues。衡量 pass rate、PR quality（diff size、style、coverage）、cost、latency。在相同 issues 上与 Cursor Background Agents 和 AWS Remote SWE Agents 对比。

## 使用它
```
# on github.com
  - user 用 `@agent fix this` 标记 issue #842
  - 14 分钟后出现 PR #1903
  - body:
    > 修复了 widget.dedupe() 中由 null comparator entry 导致的 NPE。
    > 添加了 regression test widget_test.go::TestDedupeNullComparator。
    > Coverage delta: +0.12%
    > Turns: 7  Cost: $1.80  Trace: langfuse:...
    > Label: needs-review
```

## 交付它
`outputs/skill-issue-to-pr.md` 是 deliverable。一个 GitHub App + async cloud worker，可将被标记的 issues 转换为有 bounded cost 和 scoped credentials、可供 review 的 PR。

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 30 个 issues 上的 pass rate | End-to-end success（CI green + coverage OK） |
| 20 | PR quality | Diff size、coverage delta、style conformance |
| 20 | 每个已解决 issue 的 cost 和 latency | 每个 PR 的 $ 和 wall-clock |
| 20 | Safety | Scoped token、per-repo budget、no force-push、credential hygiene |
| 15 | Operator UX | Rationale comments、retry affordance、@-mention follow-up |
| **100** | | |

## 练习
1. 添加一个“fix flaky test”模式：label `@agent stabilize-flake TestX` 会在 sandbox 中运行该 test 50 次，并提出一个能稳定它的最小改动。

2. 在三个 shared issues 上对比与 Cursor Background Agents 的 cost。报告哪些 tools 在哪些地方胜出。

3. 实现一个 budget dashboard：per-repo per-day cost、per-user cost。对 anomaly 发出 alert。

4. 构建一个“dry-run”模式：不运行 CI 就打开 draft PR，这样 reviewers 可以低成本检查 plan。

5. 添加 retention policy：超过 7 天未 merge 的 PR branches 会自动删除。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GitHub App | “Scoped bot identity” | 具备 fine-grained permissions + short-lived installation token 的 App |
| Async cloud agent | “Background agent” | 在 cloud sandbox 中运行的 non-interactive worker，而不是 terminal |
| Environment inference | “Dockerfile synthesis” | 检测 language + package manager，若缺失则生成 Dockerfile |
| Verification | “CI-in-sandbox” | 打开 PR 前在 worker 内运行完整 test suite |
| Coverage delta | “Coverage preservation” | 从 base 到 agent branch 的 test coverage % 变化 |
| Per-repo budget | “Daily ceiling” | 在 dispatcher 强制执行的 dollar 和 PR-count cap |
| Rationale | “PR body explanation” | agent 对变更内容及原因的总结；PR body 中必须包含 |

## 延伸阅读
- [AWS Remote SWE Agents](https://github.com/aws-samples/remote-swe-agents) — 标准 async cloud agent reference
- [SWE-agent](https://github.com/SWE-agent/SWE-agent) — CLI reference
- [Cursor Background Agents](https://docs.cursor.com/background-agent) — commercial alternative
- [OpenAI Codex (cloud)](https://openai.com/codex) — hosted competitor
- [Google Jules](https://jules.google) — Google 的 hosted version
- [Factory Droids](https://www.factory.ai) — alternate commercial reference
- [GitHub App documentation](https://docs.github.com/en/apps) — scoped bot identity
- [Daytona cloud sandboxes](https://daytona.io) — reference sandbox
