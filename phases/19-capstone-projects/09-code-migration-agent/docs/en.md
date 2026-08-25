# Capstone 09 — Code Migration Agent（Repo 级语言 / Runtime 升级）

> Amazon 的 MigrationBench（Java 8 到 17）和 Google 的 App Engine Py2-to-Py3 migrator 设定了 2026 年的标准。Moderne 的 OpenRewrite 能在大规模场景下执行确定性的 AST 重写。Grit 用 codemod 风格的 DSL 解决同一类问题。生产模式会把两者结合起来：用确定性基底完成安全重写，再用 agent 层处理模糊场景，用 sandbox 做逐分支构建，并用 test harness 在 PR 打开前把结果跑绿。本 capstone 的目标是迁移 50 个真实 repo，并发布 pass rate 与失败分类体系。

**Type:** Capstone
**Languages:** Python (agent), Java / Python (targets), TypeScript (dashboard)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:** P5 · P7 · P11 · P13 · P14 · P15 · P17
**Time:** 30 hours

## 问题
大规模代码迁移是 2026 年 coding agents 最清晰的生产级应用之一。ground truth 很明确（迁移后 test suite 是否通过？），收益是真实的（Java-8 fleet 迁移是需要按人力规模投入的项目），benchmark 也是公开的（MigrationBench 50-repo subset）。Moderne 的 OpenRewrite 处理确定性部分。agent 层处理 OpenRewrite recipes 无法覆盖的所有内容：模糊重写、build-system 漂移、长尾语法、传递依赖破坏。

你将构建一个 agent，它接收一个 Java 8 repo（或 Python 2 repo），并产出一个 green-CI 的已迁移分支。你将衡量 pass rate、test-coverage preservation、每个 repo 的成本，并构建失败分类体系。与 deterministic-only baseline 的并排对比，会告诉你 agent 的价值实际在哪里。

## 概念
该 pipeline 有两层。**deterministic substrate**（Java 用 OpenRewrite，Python 用 libcst）安全地执行大量机械重写：imports、method signatures、null-safety edits、try-with-resources、deprecated API replacements。它速度快，并产出可审计的 diffs。**agent layer**（OpenAI Agents SDK 或 LangGraph，基于 Claude Opus 4.7 和 GPT-5.4-Codex）处理 recipes 无法覆盖的情况：build-file upgrades（Maven/Gradle/pyproject）、transitive dependency conflicts、test flakes、custom annotations。

每个 repo 都会获得一个预装目标 runtime 的 Daytona sandbox。agent 迭代执行：运行 build、分类 failures、应用 fix、重新运行。硬性限制：每个 repo 30 分钟、每个 repo $8、20 个 agent turns。如果所有 tests 通过且 coverage delta 不为负，就打开 PR。如果没有通过，就把该 repo 按失败类别归档并附上证据。

失败分类体系是交付物。在 50 个 repo 中，什么坏了？Transitive deps？Custom annotations？Build tool version？与迁移无关的 test flakes？每个类别都需要有 count 和 exemplar diff。未来的 recipe authors 可以优先处理前三类。

## 架构
```
target repo
      |
      v
OpenRewrite / libcst deterministic recipes
   (safe, fast, auditable, ~70-80% of fixes)
      |
      v
Daytona sandbox per branch
      |
      v
agent loop (Claude Opus 4.7 / GPT-5.4-Codex):
   - run build -> capture failures
   - classify failures (build, test, lint)
   - apply fix (patch or retry recipe)
   - rerun
   - budget: 30 min, $8, 20 turns
      |
      v
test + coverage delta gate
      |
      v (passed)
open PR
      |
      v (failed)
file under failure class + attach repro
```

## 技术栈
- 确定性底座: OpenRewrite (Java) or libcst (Python)
- Agent: OpenAI Agents SDK 或 Claude Opus 4.7 + GPT-5.4-Codex 上的 LangGraph
- Sandbox: Daytona devcontainers per branch, pre-installed target runtime (Java 17 / Python 3.12)
- Build systems: Maven, Gradle, uv (Python)
- Benchmarks: Amazon MigrationBench 50-repo subset（Java 8 到 17），Google App Engine Py2-to-Py3 repos
- Test harness: parallel runner，通过 Jacoco (Java) 或 coverage.py (Python) 统计 coverage
- Observability: Langfuse + 每个 repo 一个 trace bundle，包含每个 diff chunk
- Dashboard: failure-taxonomy dashboard，包含每个 class 的计数和 exemplar diffs

```figure
ce-migration-funnel
```

## 构建它
1. **Recipe pass.** 先运行 OpenRewrite（Java）或 libcst（Python）recipes。捕获 70-80% 的机械迁移。作为 "recipe" commit 提交。

2. **Build trial.** Daytona sandbox：安装目标 runtime，运行 build。如果通过，跳到 tests。如果失败，交给 agent。

3. **Agent loop.** 使用带工具的 LangGraph：`run_build`、`read_file`、`edit_file`、`run_test`、`git_diff`。agent 分类 failure（dep、syntax、test、build-tool），并应用定向 fix。重新运行。

4. **Budget caps.** 每个 repo 30 分钟 wall-clock、$8 成本、20 个 agent turns。任何超限都会停止，并以当前 diff 归档到 "budget_exhausted"。

5. **Test + coverage gate.** build 通过后，运行 test suite。将 coverage 与 base repo 对比。如果 coverage 下降超过 2%，归档到 "coverage_regression"。

6. **PR open.** 成功后，push 分支，打开 PR，附上 diff，以及哪些 recipes 被应用、哪些 commits 由 agent 编写的摘要。

7. **Failure taxonomy.** 对每个失败的 repo，标记一个类别：`dep_upgrade_required`、`build_tool_drift`、`custom_annotation`、`test_flake`、`syntax_edge_case`、`budget_exhausted`。构建 dashboard。

8. **50-repo run.** 在 MigrationBench subset 上执行。报告 per-class pass rate、cost-per-repo、coverage-preservation，并与 deterministic-only baseline 对比。

## 使用它
```
$ migrate legacy-java-service --target java17
[recipe]   27 rewrites applied (JUnit 4->5, HashMap initializer, try-with-resources)
[build]    FAIL: cannot find symbol sun.misc.BASE64Encoder
[agent]    turn 1 classify: removed_jdk_api
[agent]    turn 2 apply: sun.misc.BASE64Encoder -> java.util.Base64
[build]    OK
[tests]    412/412 passing; coverage 84.1% -> 84.3%
[pr]       opened #1841  cost=$3.20  turns=4
```

## 交付它
`outputs/skill-migration-agent.md` 是交付物。给定一个 repo，它会先执行 deterministic recipes，然后运行 agent loop，以产出一个通过的已迁移分支，或将该 repo 归档到某个 taxonomy class 下。

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | MigrationBench pass rate | 50-repo subset pass@1 |
| 20 | Test-coverage preservation | Mean coverage delta vs base |
| 20 | Cost per migrated repo | $/repo on passing runs |
| 20 | Agent / deterministic-tool integration | OpenRewrite 处理的 fixes 与 agent 编写的 fixes 的占比 |
| 15 | Failure analysis write-up | 带 exemplars 的 taxonomy 完整性 |
| **100** | | |

## 练习
1. 只用 OpenRewrite（无 agent）运行 migrate pipeline。将 pass rate 与完整 pipeline 对比。找出那些只有 agent 介入才会改变结果的 cases。

2. 实现一个 "lint-clean" check：迁移后，运行 style linter（Java 用 spotless，Python 用 ruff）。如果出现新的 lint errors，则让 PR 失败。衡量 coverage-preserved-but-style-regressed rate。

3. 添加一个 "minimal-diff" optimizer：agent 的分支通过 tests 后，用第二次 pass 裁剪不必要的 changes。报告 diff-size reduction。

4. 扩展到第三种迁移：Node 18 到 Node 22。复用 sandbox 包装；把 recipe layer 换成自定义 codemod。

5. 将 time-to-first-green-build (TTFGB) 作为 UX metric 来衡量。目标：p50 低于 10 分钟。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Deterministic substrate | "Recipe engine" | OpenRewrite / libcst：带安全保证的声明式 AST rewrites |
| Codemod | "Code-modifying program" | 一条以机械方式修改 source code 的 rewrite rule |
| Build drift | "Tool version skew" | Maven / Gradle / uv 在 major versions 之间的细微行为变化 |
| Failure class | "Taxonomy bucket" | repo 未能迁移的带标签原因：dep、syntax、test、build-tool、budget |
| Coverage delta | "Coverage preservation" | 从 base 到 migrated branch 的 test coverage % 变化 |
| Agent turn | "Tool-call round" | agent loop 中的一次 plan -> act -> observe cycle |
| Budget exhaustion | "Hit the ceiling" | repo 消耗完 30-min / $8 / 20-turn 限制但仍未通过 |

## 延伸阅读
- [Amazon MigrationBench](https://aws.amazon.com/blogs/devops/amazon-introduces-two-benchmark-datasets-for-evaluating-ai-agents-ability-on-code-migration/) — 2026 年权威 benchmark
- [Moderne.io OpenRewrite platform](https://www.moderne.io) — deterministic substrate 参考
- [OpenRewrite documentation](https://docs.openrewrite.org) — recipe 编写
- [Grit.io](https://www.grit.io) — 替代 codemod DSL
- [OpenAI sandboxed migration cookbook](https://developers.openai.com/cookbook/examples/agents_sdk/sandboxed-code-migration/sandboxed_code_migration_agent) — Agents SDK 参考
- [Google App Engine Py2 to Py3 migrator](https://cloud.google.com/appengine) — 替代 migration benchmark
- [libcst](https://github.com/Instagram/LibCST) — Python deterministic substrate
- [Daytona sandboxes](https://daytona.io) — per-branch sandbox 参考
