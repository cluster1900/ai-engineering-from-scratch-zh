---
id: agent-planning
title: Agent Planning: Workflows, HTN, Plan-Execute
code: AW
subtitle: 选择 workflow、HTN 或进化式 planner，或者会重新规划的 executor。代码为课程中的纯标准库 Python。
hue: 32
sources: phases/14-agent-engineering/11-planning-htn-and-evolutionary, phases/14-agent-engineering/12-anthropic-workflow-patterns, phases/19-capstone-projects/24-plan-execute-control-flow, phases/14-agent-engineering/44-plan-from-evidence
source_hash: 28f779dbd6acbd70
---

## 选择 planner
type: comparison
from: phases/14-agent-engineering/11-planning-htn-and-evolutionary/docs/en.md, phases/14-agent-engineering/12-anthropic-workflow-patterns/docs/en.md

| 维度 | Workflow | HTN + ChatHTN | AlphaEvolve | ReAct / ReWOO |
|---|---|---|---|---|
| 谁做决定 | 工程师 | 符号层 | 评估器挑选 | 模型 |
| 保证 | 步数有界 | 可证明的正确性 | 按适应度选最佳计划 | 没有形式化保证 |
| 需要 | 能枚举的步骤 | 算子 schema | 可机器检验的适应度 | 循环中的 LLM |
| 适合 | 可预测、受合规约束 | 排程、受策略约束 | 编译器优化 | 开放式研究 |
| LLM 角色 | 在固定代码路径上被调用 | 兜底分解 | 提出变异 | 挑选每一步 |

## 代码中的五种 workflow 模式
type: task-table
from: phases/14-agent-engineering/12-anthropic-workflow-patterns/code/main.py, phases/14-agent-engineering/12-anthropic-workflow-patterns/docs/en.md
span: 2

| 任务 | 代码 |
|---|---|
| Prompt chaining：第 N 步输出是第 N+1 步输入 | `prompt_chain(input_text, llm, steps)` |
| Routing：先分类，再分发 | `route(input_text, classifier, handlers)` |
| Parallelization：运行 N 次，多数投票 | `parallel_vote(prompt, llm, n=5)` |
| Orchestrator-workers：挑选专家 | `orchestrator_workers(task, workers, synth)` |
| Evaluator-optimizer：循环直到 PASS | `evaluator_optimizer(task, proposer, evaluator, max_iter=5)` |
| 未知路由标签 | `handlers.get("default")` 返回 "escalate to human" |
| 运行全部五个 demo | `python3 code/main.py` |

## Plan-execute 执行器
type: flow
from: phases/19-capstone-projects/24-plan-execute-control-flow/docs/en.md, phases/19-capstone-projects/24-plan-execute-control-flow/code/main.py

1. **Planner**：`planner(goal, history, None)` 返回第一个计划。事件 `plan.commit`。
2. **Executor**：通过 dispatcher 运行 `plan[cursor]`。事件 `step.start` 和 `step.end`。
3. **Executor**：成功时追加到历史，并把游标移到下一步。
4. **Executor**：发生异常时保存 `step.error` 并设置 `last_error`。
5. **预算检查**：`replans_used >= self.max_replans` 返回 failed，原因为 `replan_budget`。
6. **Planner**：`planner(goal, history, last_error)` 给出新计划。事件 `plan.draft`。
7. **Executor**：发出 `plan.diff`，提交新计划并设置 `cursor = 0`。
8. **Executor**：最后一步成功。事件 `session.complete`，带 `goal_met`。

## Evidence plan 的波次
type: architecture
from: phases/14-agent-engineering/44-plan-from-evidence/docs/en.md, phases/14-agent-engineering/44-plan-from-evidence/code/main.py

```arch
node | contract | 1,1 | contract | wave 1, review contract | process
node | impl | 2,1 | implementation | wave 2, unittest | process
node | docs | 2,2 | docs | wave 2, check_links.py | process
node | integ | 3,1 | integration | wave 3, acceptance gate | process
edge | contract | impl | depends_on
edge | contract | docs | depends_on
edge | impl | integ |
edge | docs | integ |
```

## 运行一个会重新规划的 agent
type: annotated-code
lang: python
from: phases/19-capstone-projects/24-plan-execute-control-flow/code/main.py

```python
agent = PlanExecuteAgent(
    planner=make_deterministic_planner(fail_step_id=2, recovery="route_around"),
    executor=executor,              # (tool_name, args) -> result, raises ToolFailure
    max_steps=12, max_replans=5,    # both budgets are hard
)
res = agent.run("ship the report")
res.status, res.reason              # "completed" and "goal_met"
res.revisions                       # list of PlanDiff
r.to_dict()                         # revision, removed, added, revised
Step(2, "transform", {"mode": "v2"}, "computed via fallback")
```

## 带 LLM 兜底的 HTN planner
type: annotated-code
lang: python
from: phases/14-agent-engineering/11-planning-htn-and-evolutionary/code/main.py

```python
op = Operator("open_editor", ("logged_in",), ("editor_open",))
m = Method("ship_change_m1", "ship_change", ("logged_in",),
           ("open_editor", "write_tests", "run_tests", "open_pr"))
planner = HTNPlanner(operators=operators, methods=methods, llm=llm)
plan = planner.plan("ship_change", {"logged_in"})  # list of operators or None
planner.cached_methods      # LLM decompositions kept for the next call
planner.llm.calls           # 0 new calls on a cache hit
```

## 规划术语
type: concepts
from: phases/14-agent-engineering/11-planning-htn-and-evolutionary/docs/en.md, phases/14-agent-engineering/12-anthropic-workflow-patterns/docs/en.md, phases/19-capstone-projects/24-plan-execute-control-flow/docs/en.md

- **Operator**：带前置条件和效果的原子动作。
- **Method**：把复合任务拆成子任务的一种方式，带前置条件。
- **ChatHTN**：没有匹配的 method 时，符号 planner 去问 LLM。
- **Fitness function**：对输出给出确定性的、可机器检验的分数。
- **Augmented LLM**：LLM 加上搜索、工具和记忆。最小单元。
- **expected_outcome**：planner 的成功条件。executor 并不强制它。
- **Replan**：把错误交还给 planner。这让脚本变成 agent。

## 默认值
type: defaults
from: phases/19-capstone-projects/24-plan-execute-control-flow/code/main.py, phases/19-capstone-projects/24-plan-execute-control-flow/docs/en.md, phases/14-agent-engineering/11-planning-htn-and-evolutionary/code/main.py, phases/14-agent-engineering/12-anthropic-workflow-patterns/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `max_steps` | `12` | 所有步骤执行次数，含重新规划 |
| `max_replans` | `5` | 第一个计划之后的 planner 调用次数 |
| `max_depth` | `12` | HTN 递归上限，之后返回 None |
| `max_iter` | `5` | Evaluator-optimizer 轮数 |
| `n` | `5` | `parallel_vote` 中的投票者数 |
| `generations` | `12` | 进化 demo，6 个中保留前 3 |

## 故障与修复
type: troubleshooting
from: phases/19-capstone-projects/24-plan-execute-control-flow/code/main.py, phases/19-capstone-projects/24-plan-execute-control-flow/docs/en.md, phases/14-agent-engineering/44-plan-from-evidence/code/main.py, phases/14-agent-engineering/11-planning-htn-and-evolutionary/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| `failed`，原因 `replan_budget` | planner 返回同一个坏计划 | 传入 `last_error` 并绕开它 |
| `failed`，原因 `step_budget` | 重新规划加的步骤超过 `max_steps` | 缩短计划或复用历史 |
| `failed`，原因 `no_plan` | planner 返回了 `[]` | 为该错误加一个恢复计划 |
| `dependency cycle among:` | 条目互相等待 | 解决其背后的分歧 |
| `has no repository evidence` | 条目的 `evidence` 为空 | 引用一条仓库事实 |
| `has no proof command` | `proof` 为空 | 给出一个确切的检查 |
| HTN 正确性崩塌 | 没有前置条件/效果 schema | 用算子校验 LLM 输出 |
| 进化不收敛 | 让 LLM 判断代码是否更好 | 使用确定性的、快速的评估器 |

## 命令
type: command-table
from: phases/14-agent-engineering/44-plan-from-evidence/docs/en.md, phases/19-capstone-projects/24-plan-execute-control-flow/code/main.py, phases/14-agent-engineering/11-planning-htn-and-evolutionary/docs/en.md

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` | 运行课程 demo 并打印 trace |
| `python3 -m unittest discover code/tests -v` | 运行 evidence plan 测试 |
| `outputs/evidence-plan.json` | 由第 44 课写出，状态为 ready 或 blocked |

## 问答
type: qa
from: phases/14-agent-engineering/12-anthropic-workflow-patterns/docs/en.md, phases/14-agent-engineering/11-planning-htn-and-evolutionary/docs/en.md, phases/19-capstone-projects/24-plan-execute-control-flow/docs/en.md, phases/14-agent-engineering/44-plan-from-evidence/docs/en.md

- **Workflow 还是 agent？** 能枚举步骤时用 workflow。下一步取决于上一步结果时用 agent。
- **为什么要限制重新规划次数和步数？** 有上限的重新规划失败得更快，原因也更清楚。
- **为什么 ChatHTN 是正确的？** LLM 输出只作为候选分解进入。schema 会拒绝无效的分解。
- **哪些步骤一起运行？** 同一波次的步骤。集成要等两个分支都完成。

## 提示
type: tips
from: phases/14-agent-engineering/11-planning-htn-and-evolutionary/docs/en.md, phases/14-agent-engineering/12-anthropic-workflow-patterns/docs/en.md, phases/19-capstone-projects/24-plan-execute-control-flow/docs/en.md, phases/14-agent-engineering/44-plan-from-evidence/docs/en.md

- 从直接 API 调用开始。先考虑 ReAct 或 ReWOO，再考虑 HTN。
- 先定义契约，再写实现。
- 每个工作条目都要有 id、改动、证据、依赖和证明。
- 每次修订都输出计划 diff。不要悄悄重写计划。
- 把计划存放在工作旁边，而不是聊天里的复选框。
