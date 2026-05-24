# Capstone 10 — Multi-Agent Software Engineering Team

> SWE-AF 的 factory 架构、MetaGPT 的基于角色的 prompting、AutoGen 0.4 的 typed actor graph、Cognition 的 Devin，以及 Factory 的 Droids，都在 2026 年收敛到了同一种形态：architect 负责规划，N 个 coders 在并行 worktrees 中工作，reviewer 负责 gate，tester 负责验证。并行 worktrees 把 wall-clock 转换为 throughput。共享状态和 handoff protocols 成为 failure surface。这个 capstone 的目标是构建这个团队，在 SWE-bench Pro 上评估，并报告哪些 handoffs 会失败以及失败频率。

**Type:** Capstone
**Languages:** Python / TypeScript (agents), Shell (worktree scripts)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 16 (multi-agent), Phase 17 (infrastructure)
**Phases exercised:** P11 · P13 · P14 · P15 · P16 · P17
**Time:** 40 小时

## 问题
单 Agent coding harnesses 在大型任务上会碰到上限。原因不是任何单个 agent 很弱，而是 200k-Token context 无法同时容纳 architecture plan、四个并行 codebase slices、reviewer commentary 和 test output。Multi-agent factories 会拆分问题：architect 负责 plan，coders 在并行 worktrees 中负责实现，reviewer 负责 gate，tester 负责验证。SWE-AF 的 "factory" architecture、MetaGPT 的 roles、AutoGen 的 typed actor graph，这三种框架描述的是同一种形态。

failure surface 是 handoff。Architect 规划了 coders 无法实现的内容。Coders 产生相互冲突的 diffs。Reviewer 批准了一个 hallucinated fix。Tester 与仍在写入的 coder 发生 race。你将构建这样一个团队，在 50 个 SWE-bench Pro issues 上运行它，跟踪每一次 handoff，并发布 post-mortem。

## 概念
Roles 是 typed agents。**Architect** (Claude Opus 4.7) 读取 issue，编写 plan，并将其拆分为带有显式 interfaces 的 subtasks。**Coders** (Claude Sonnet 4.7，N 个并行实例，每个实例在一个 `git worktree` + Daytona sandbox 中) 独立实现 subtasks。**Reviewer** (GPT-5.4) 读取合并后的 diff，并批准或请求具体修改。**Tester** (Gemini 2.5 Pro) 在隔离环境中运行 test suite，并用 artifacts 报告 pass/fail。

通信通过共享 task board（file-backed 或 Redis）完成。每个 role 消费它被允许处理的 tasks。Handoffs 是 A2A-protocol-typed messages。协调问题包括：merge-conflict resolution（coordinator role 或自动 three-way merge）、shared-state synchronization（coders 开始后 plan 被冻结；replans 是独立事件），以及 reviewer gatekeeping（reviewer 不能批准它自己做出的更改或它提出的更改）。

Token amplification 是隐藏成本。每个 role boundary 都会增加 summary prompts 和 handoff context。一个 40-turn single-agent run 会变成跨四个 roles 的 160 个 total turns。rubric 会特别权衡 token efficiency 与 single-agent baseline，因为问题不是“multi-agent 是否有效”，而是“它是否按每美元计算更划算”。

## 架构
```
GitHub issue URL
      |
      v
Architect (Opus 4.7)
   reads issue, produces plan with subtasks + interfaces
      |
      v
Task board (file / Redis)
      |
   +-- subtask 1 ---+-- subtask 2 ---+-- subtask 3 ---+-- subtask 4 ---+
   v                v                v                v                v
Coder A          Coder B          Coder C          Coder D          (4 parallel)
 (Sonnet)         (Sonnet)         (Sonnet)         (Sonnet)
 worktree A       worktree B       worktree C       worktree D
 Daytona          Daytona          Daytona          Daytona
      |                |                |                |
      +--------+-------+-------+--------+
               v
           merge coordinator  (three-way merge + conflict resolution)
               |
               v
           Reviewer (GPT-5.4)
               |
               v
           Tester  (Gemini 2.5 Pro)  -> passes? -> open PR
                                     -> fails?  -> route back to coder
```

## 技术栈
- Orchestration: LangGraph with shared state + per-agent sub-graphs
- Messaging: A2A protocol (Google 2025) for typed inter-agent messages
- Models: Opus 4.7 (architect), Sonnet 4.7 (coders), GPT-5.4 (reviewer), Gemini 2.5 Pro (tester)
- Worktree isolation: `git worktree add` per coder + Daytona sandbox
- Merge coordinator: custom three-way merge + LLM-mediated conflict resolution
- Eval: SWE-bench Pro (50 issues), SWE-AF scenarios, HumanEval++ for unit tests
- Observability: Langfuse with role-tagged spans, per-agent token accounting
- Deployment: K8s with each role as a separate Deployment + HPA on backlog

## 构建它
1. **Task board.** File-backed JSONL，包含 typed messages：`plan_request`、`subtask`、`diff_ready`、`review_needed`、`test_needed`、`approved`、`rejected`、`replan_needed`。Agents 订阅 tags。

2. **Architect.** 读取 GitHub issue，使用带有 plan template 的 Opus 4.7，要求显式 subtask interfaces（触及的文件、public functions、test impact）。发出一个包含 subtasks DAG 的 `plan_request`。

3. **Coders.** N 个并行 workers，每个 worker 从 board 中 claim 一个 subtask。每个 worker 启动一个新的 `git worktree add` branch 和一个 Daytona sandbox。实现 subtask。发出带有 patch + test deltas 的 `diff_ready`。

4. **Merge coordinator.** 当所有 coders 完成后，将 N 个 branches 通过 three-way merge 合并到 staging branch。只有存在 file-level overlap 时，才使用 LLM-mediated conflict resolution。

5. **Reviewer.** GPT-5.4 读取合并后的 diff。不能批准它自己编写的 diffs。发出 `approved`（no-op）或带有具体 change requests 的 `review_feedback`，并路由回相关 coder。

6. **Tester.** Gemini 2.5 Pro 在干净的 sandbox 中运行 test suite。捕获 artifacts。发出带有 stacktraces 的 `test_passed` 或 `test_failed`。失败 tests loop back 到拥有失败 subtask 的 coder。

7. **Handoff accounting.** 每条跨越 role boundary 的 message 都会在 Langfuse 中获得一个 span，记录 payload size 和使用的 model。计算每个 subtask 的 token amplification（coder_tokens + reviewer_tokens + tester_tokens + architect_share / coder_tokens）。

8. **Eval.** 在 50 个 SWE-bench Pro issues 上运行。将 pass@1 和 $-per-solved-issue 与 single-agent baseline（一个 Sonnet 4.7，在单个 worktree 中）比较。

9. **Post-mortem.** 对每个失败的 issue，识别出失败的 handoff（plan too vague、merge conflict、reviewer false-approve、tester flake）。生成 handoff-failure histogram。

## 使用它
```
$ team run --issue https://github.com/acme/widget/issues/842
[architect] plan: 4 subtasks (parser, cache, api, migration)
[board]     dispatched to 4 coders in parallel worktrees
[coder-A]   subtask parser  -> 42 lines, tests pass locally
[coder-B]   subtask cache   -> 88 lines, tests pass locally
[coder-C]   subtask api     -> 31 lines, tests pass locally
[coder-D]   subtask migration -> 19 lines, tests pass locally
[merge]     3-way merge: 0 conflicts
[reviewer]  comments on cache (thread pool sizing); routed to coder-B
[coder-B]   revision: 92 lines; submits
[reviewer]  approved
[tester]    all 412 tests pass
[pr]        opened #3382   4 coders, 1 revision, $4.90, 18m
```

## 交付它
`outputs/skill-multi-agent-team.md` 是 deliverable。给定一个 issue URL 和 parallelism level，这个团队会生成一个 merge-ready PR，并提供 per-role token accounting。

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | 匹配的 50-issue subset，pass@1 |
| 20 | Parallel speedup | Wall-clock vs single-agent baseline |
| 20 | Review quality | injected-bug probe 上的 false-approval rate |
| 20 | Token efficiency | 每个 solved issue 的 total tokens vs single-agent |
| 15 | Coordination engineering | Merge-conflict resolution、handoff-failure histogram |
| **100** | | |

## 练习
1. 在运行中途向 diff 注入一个明显 bug（main body 前额外添加 `return None`）。测量 reviewer 的 false-approve rate。调优 reviewer prompt，直到 false-approval 低于 5%。

2. 减少到两个 coders（architect + coder + reviewer + tester，coder 顺序运行两个 subtasks）。比较 wall-clock 和 pass rate。

3. 用 single-writer constraint 替换 merge coordinator（subtasks 触及不相交的 file sets）。测量 architect 的 planning burden。

4. 将 reviewer 从 GPT-5.4 换成 Claude Opus 4.7。测量 false-approval rate 和 token cost delta。

5. 添加第五个 role：documenter (Haiku 4.5)。review 之后，它会生成 changelog entry。衡量 documentation quality 是否值得额外的 token spend。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Parallel worktree | "隔离分支" | `git worktree add` 为每个 coder 生成一个新的 working tree |
| Task board | "共享 message bus" | 存储 typed messages 的 File 或 Redis store，agents 会订阅它 |
| Handoff | "Role boundary" | 从一个 role 的 context 跨到另一个 role 的任何 message |
| Token amplification | "Multi-agent overhead" | 同一任务下跨 roles 的 total tokens / single-agent tokens |
| A2A protocol | "Agent-to-agent" | Google 2025 年用于 typed inter-agent messages 的 spec |
| Merge coordinator | "Integrator" | 运行 three-way merge 并调解 conflicts 的组件 |
| False approval | "Reviewer hallucination" | Reviewer 批准带有已知 bugs 的 diff |

## 延伸阅读
- [SWE-AF factory architecture](https://github.com/Agent-Field/SWE-AF) — 2026 multi-agent factory 的参考实现
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT) — 基于 role 的 multi-agent framework
- [AutoGen v0.4](https://github.com/microsoft/autogen) — Microsoft 的 typed actor framework
- [Cognition AI (Devin)](https://cognition.ai) — 参考产品
- [Factory Droids](https://www.factory.ai) — 另一种参考产品
- [Google A2A protocol](https://developers.google.com/agent-to-agent) — inter-agent messaging spec
- [git worktree documentation](https://git-scm.com/docs/git-worktree) — isolation substrate
- [SWE-bench Pro](https://www.swebench.com) — evaluation target
