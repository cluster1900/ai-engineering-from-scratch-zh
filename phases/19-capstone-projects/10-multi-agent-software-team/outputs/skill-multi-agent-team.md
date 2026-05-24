---
name: multi-agent-team
description: 构建一个 multi-agent 软件团队，包含 architect、并行 coders、reviewer 和 tester；使用 SWE-bench Pro 衡量，并产出 handoff post-mortem。
version: 1.0.0
phase: 19
lesson: 10
tags: [capstone, multi-agent, swe-bench, langgraph, a2a, worktree, roles]
---

给定一个 GitHub issue URL 和 parallelism level，部署一个 multi-agent 软件团队，产出 merge-ready PR。基于 50 个 SWE-bench Pro issues 评估，并发布 handoff-failure histogram。

构建计划：

1. Task board：基于文件（或 Redis）的 typed messages JSONL 存储。Message kinds: plan_request, subtask, diff_ready, review_needed, review_feedback, approved, test_needed, test_passed, test_failed, replan_needed。
2. Architect (Opus 4.7)：读取 issue，编写计划，并产出一个 subtasks 的 DAG，包含明确接口（触及的文件、public functions、test impact）。
3. N coders (Sonnet 4.7)：每个 coder 领取一个 subtask，启动一个全新的 `git worktree add` + Daytona sandbox，并独立实现。
4. Merge coordinator：three-way merge；仅在 file-level overlap 时使用 LLM-mediated conflict resolution。
5. Reviewer (GPT-5.4)：读取合并后的 diff；不能批准自己编写或提出的 diffs；产出 approved 或 review_feedback，并路由给相关 coder。
6. Tester (Gemini 2.5 Pro)：在干净 sandbox 中运行 test suite；产出 test_passed 或 test_failed，并附带 artifacts。
7. Handoff accounting：每条跨 role message 都成为 Langfuse span，记录 payload size 和 model。计算 token amplification = total_tokens / single_agent_baseline_tokens。
8. 注入一个明显的 bug probe（10% 的运行）来衡量 reviewer false-approve rate。
9. 在 50 个 SWE-bench Pro issues 上运行；发布 pass@1、wall-clock vs single-agent baseline、per-role token breakdown、handoff-failure histogram。

评估 rubric：

| Weight | Criterion | Measurement |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | 50-issue subset pass@1 |
| 20 | Parallel speedup | Wall-clock vs single-agent baseline |
| 20 | Review quality | False-approval rate on injected-bug probe |
| 20 | Token efficiency | Total tokens per solved issue vs single-agent |
| 15 | Coordination engineering | Merge-conflict resolution, handoff-failure histogram |

硬性拒收：

- Reviewer 可以批准自己编写或提出的 diffs。硬性约束。
- 没有匹配 single-agent baseline run 的报告。Multi-agent 必须在 *per dollar* 上获胜，而不只是 pass@1。
- Task boards 中 messages 是 free-form strings，而不是 typed A2A messages。
- Merge coordinators 静默丢弃冲突 diffs，而不是路由回去 replan。

拒绝规则：

- 如果没有 per role 的 budget ceilings（token + dollar），拒绝运行。
- 如果 tester 尚未在干净 sandbox 中验证，拒绝打开 PR。
- 拒绝在单次运行中将 coders 扩展到 8 个以上。超过这个数量后 coordination overhead 会占主导。

输出：一个包含 task board + role workers 的 repo、50-issue SWE-bench Pro run log、匹配的 single-agent baseline run、一个带 role-tagged spans 和 per-role token breakdowns 的 Langfuse dashboard、一个 injected-bug probe report，以及一份 post-mortem，指出最常失败的三个 handoffs，以及减少各自失败的 message-schema 或 prompt change。
