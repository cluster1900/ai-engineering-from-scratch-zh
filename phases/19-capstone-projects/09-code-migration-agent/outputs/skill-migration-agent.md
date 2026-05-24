---
name: migration-agent
description: 构建一个 repo 级 code migration agent，将 deterministic recipes 与 agent fallback loop 结合起来，通过 MigrationBench，并发布失败分类体系。
version: 1.0.0
phase: 19
lesson: 09
tags: [capstone, code-migration, openrewrite, libcst, migrationbench, agent, sandbox]
---

给定一个 Java 8 或 Python 2 repo，产出一个已迁移分支（迁移到 Java 17 或 Python 3.12），使其 test suite 通过，并尽量减少 coverage regression。在 50-repo MigrationBench subset 上进行评估。

Build plan:

1. Deterministic pass: OpenRewrite（Java）或 libcst（Python）先运行机械重写。以干净 diff 作为 "recipe" commit 提交。
2. Daytona sandbox: 预装目标 runtime；逐分支 build；read-only source mount。
3. Agent loop: LangGraph 或 OpenAI Agents SDK，基于 Claude Opus 4.7 + GPT-5.4-Codex。工具：`run_build`、`read_file`、`edit_file`、`run_test`、`git_diff`。分类 failure（dep、syntax、test、build-tool），应用定向 fix，重新运行。
4. Budget caps: 30 min、$8、20 turns。任何超限都会停止，并以当前 diff 归档到 `budget_exhausted`。
5. Test + coverage gate: build 通过后 tests 也必须通过；coverage 下降不得超过 2%。
6. 打开 PR，包含 recipe-commit + agent commits + summary comment。
7. Failure taxonomy: 每个 repo 从 `{dep_upgrade_required, build_tool_drift, custom_annotation, test_flake, syntax_edge_case, budget_exhausted, coverage_regression}` 中选择 tag。
8. 在 MigrationBench 上执行 50-repo run；发布 per-class pass rate、cost-per-repo 和 coverage-preservation；并与 deterministic-only baseline 对比。

Assessment rubric:

| Weight | Criterion | Measurement |
|:-:|---|---|
| 25 | MigrationBench pass rate | 50-repo subset pass@1 |
| 20 | Test-coverage preservation | Mean coverage delta vs base branch |
| 20 | Cost per migrated repo | Mean $/repo on passing runs |
| 20 | Agent / deterministic-tool integration | OpenRewrite 与 agent 分别处理 fixes 的占比 |
| 15 | Failure analysis write-up | 带 exemplars 的 taxonomy 完整性 |

Hard rejects:

- 跳过 deterministic pass 的 pipelines。OpenRewrite 处理机械性的 70-80% 更便宜，也比任何 agent 更可靠。
- 将超过 2% 的 coverage regressions 视为通过。
- PRs 把机械改动和 agent-authored changes 打包进同一个 commit。必须分离。
- 在同一 50 个 repos 上没有匹配的 deterministic-only baseline，却报告 pass rate。

Refusal rules:

- 拒绝把已迁移分支 force-push 覆盖 base。始终使用新分支 + PR。
- 拒绝打开 CI 尚未在 sandbox 中变绿的 PR。
- 没有明确修改许可时，拒绝在 corporate repos 上运行。

Output: 一个 repo，包含 two-layer migration pipeline、50-repo MigrationBench run logs、failure taxonomy dashboard、匹配的 deterministic-only baseline run，以及关于三类最常见 failure classes 和可以消除每一类的 recipe change 的 write-up。
