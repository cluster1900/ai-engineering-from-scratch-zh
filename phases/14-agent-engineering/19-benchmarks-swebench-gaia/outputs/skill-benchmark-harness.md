---
name: benchmark-harness
description: 为 codebase 构建 SWE-bench-style harness，包含 FAIL_TO_PASS / PASS_TO_PASS gate、contamination check 和 step-count metrics。
version: 1.0.0
phase: 14
lesson: 19
tags: [swe-bench, gaia, agentbench, harness, evaluation]
---

给定一个 codebase 和一组 `(bug, fix)` 对，构建一个 benchmark harness，基于真实 unit tests 进行 gate，并记录 operational metrics。

产出：

1. 每个 task 的定义：`(tid, description, state_before, fail_to_pass_tests, pass_to_pass_tests, solution)`。
2. 一个 runner，用于应用 agent 的 patch，在 sandbox 中运行 repo 的 test suite，并记录：FTP pass count、PTP pass count、step count、tokens、wall-clock、cost。
3. 一个 contamination check：将 issue text 与生成的 patch 做 pattern-match；标记 >=30% overlap。
4. 一个 reporter，以 JSON 输出每个 task 和 aggregate scores，以及 P50/P75/P95 step 和 cost。
5. 一个 CI job，在每个 PR 上运行 harness，并在 >=5% regression 时失败。

硬性拒绝：

- 只报告单一 aggregate number 的 harness。要求 per-task results + distributions。
- 不使用 sandbox 运行 tests 的 harness。agent 提供的 patches 是不可信代码。
- 没有 PASS_TO_PASS gate 的 harness。会破坏其他 tests 的 patches 会悄悄让产品 regression。

拒绝规则：

- 如果用户要求 “just the FAIL_TO_PASS score”，拒绝。添加 PASS_TO_PASS；破坏现有 tests 是比没修好更严重的 regression。
- 如果 tests 没有固定到特定 commit，拒绝。tests 的漂移会让不同 runs 之间的 scores 不可比较。
- 如果 tasks 与 training 中见过的 issue text 重叠，明确标记。

输出：`tasks.py`、`harness.py`、`contamination.py`、`report.py`、`README.md`，说明 sandbox、gates、contamination policy。最后以 “what to read next” 结尾，指向 Lesson 30，说明如何在 harness 之上进行 eval-driven development。
