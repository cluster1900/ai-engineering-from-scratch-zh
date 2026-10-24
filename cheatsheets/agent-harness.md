---
id: agent-harness
title: Agent Harness Engineering
code: AH
subtitle: 模型周围的代码。循环契约、hook、预算、工具、关卡、沙箱、trace 与 workbench 文件。
hue: 248
sources: phases/14-agent-engineering/01-the-agent-loop, phases/14-agent-engineering/31-agent-workbench-why-models-fail, phases/14-agent-engineering/32-minimal-agent-workbench, phases/14-agent-engineering/33-instructions-as-executable-constraints, phases/14-agent-engineering/36-scope-contracts, phases/14-agent-engineering/37-runtime-feedback-loops, phases/14-agent-engineering/38-verification-gates, phases/14-agent-engineering/40-multi-session-handoff, phases/14-agent-engineering/42-agent-workbench-capstone, phases/15-autonomous-systems/10-claude-code-permission-modes, phases/19-capstone-projects/20-agent-harness-loop-contract, phases/19-capstone-projects/21-tool-registry-schema-validation, phases/19-capstone-projects/23-function-call-dispatcher, phases/19-capstone-projects/25-verification-gates-observation-budget, phases/19-capstone-projects/26-sandbox-runner-denylist, phases/19-capstone-projects/27-eval-harness-fixture-tasks, phases/19-capstone-projects/28-observability-otel-traces, phases/19-capstone-projects/29-end-to-end-coding-task-demo
source_hash: 47bbeb6e730c72a6
---

## Harness 架构
type: architecture
from: phases/19-capstone-projects/20-agent-harness-loop-contract/docs/en.md, phases/19-capstone-projects/20-agent-harness-loop-contract/code/main.py, phases/19-capstone-projects/23-function-call-dispatcher/docs/en.md, phases/19-capstone-projects/25-verification-gates-observation-budget/docs/en.md, phases/19-capstone-projects/26-sandbox-runner-denylist/docs/en.md, phases/19-capstone-projects/28-observability-otel-traces/docs/en.md

```arch
node | caller | 1,1 | Caller | run, resume | client
node | loop | 2,1 | HarnessLoop | 6 states | process
node | hooks | 3,1 | HookRegistry | 10 topics | queue
node | budget | 4,1 | Budget | turns, tool_calls | store
node | policy | 1,2 | Planner | plan steps | model
node | gates | 2,2 | GateChain | first deny wins | process
node | tools | 3,2 | Dispatcher + Sandbox | registry, retry, jail | process
node | trace | 4,2 | Events + spans | traces.jsonl | store
edge | caller | loop | run
edge | loop | hooks | fire
edge | hooks | budget |
edge | loop | policy | plan
edge | loop | gates | tool call
edge | gates | tools | ALLOW
edge | tools | trace | span
```

## 循环的一步
type: flow
from: phases/19-capstone-projects/20-agent-harness-loop-contract/code/main.py, phases/19-capstone-projects/20-agent-harness-loop-contract/docs/en.md

1. **IDLE**：`run(goal)` 发出 `session.start`。这是唯一合法的入口。
2. **PLANNING**：planner 起草步骤。循环发出 `plan.draft` 和 `plan.commit`。
3. **预算检查**：每一步调用 `_check_budget()`。触限则暂停回到 IDLE。
4. **EXECUTING**：循环触发 `before_step`。不需要工具的步骤进入 REFLECTING。
5. **工具步骤**：循环发出 `tool.call`，并向调用方返回 `PullRequest`。
6. **AWAITING_TOOL**：调用方运行工具并调用 `resume(payload)`。
7. **REFLECTING**：进入下一步，或在最后一步后以 `goal_met` 进入 DONE。

## 核心循环：HarnessLoop._step
type: annotated-code
lang: python
from: phases/19-capstone-projects/20-agent-harness-loop-contract/code/main.py

```python
def _step(self) -> PullRequest | SessionResult:
    budget_hit = self._check_budget()        # on every step
    if budget_hit is not None:
        return budget_hit                    # pause, back to IDLE
    if self.state == State.REFLECTING:
        self._cursor += 1                    # turns += 1 also
        if self._cursor >= len(self._plan):
            return self._complete("goal_met")
    step = self._plan[self._cursor]
    if step.requires_tool:
        self.hooks.fire("before_tool_call", {"step": step})
        self.budget.tool_calls += 1          # count before yield
        self._transition(State.AWAITING_TOOL)
        return PullRequest(reason="tool_call", ...)  # pull point
```

## 驱动循环
type: task-table
from: phases/19-capstone-projects/20-agent-harness-loop-contract/code/main.py

| 任务 | 代码 |
|---|---|
| 开始一个会话 | `out = loop.run("<goal>")` |
| 订阅一个 hook | `loop.hooks.on("<topic>", <fn>)` |
| 拦截一次工具调用 | `raise HookAbort("<reason>")` |
| 返回工具结果 | `loop.resume({"result": <value>})` |
| 预算暂停后恢复 | `loop.resume()` |
| 设置预算 | `Budget(max_turns=<n>, max_tool_calls=<n>)` |

## 工具、关卡与 trace
type: task-table
from: phases/19-capstone-projects/21-tool-registry-schema-validation/code/main.py, phases/19-capstone-projects/23-function-call-dispatcher/code/main.py, phases/19-capstone-projects/25-verification-gates-observation-budget/code/main.py, phases/19-capstone-projects/26-sandbox-runner-denylist/code/main.py, phases/19-capstone-projects/28-observability-otel-traces/code/main.py

| 任务 | 代码 |
|---|---|
| 注册工具 | `registry.register(<name>, <schema>, <fn>)` |
| 替换工具 | `registry.register(..., override=True)` |
| 分发一次调用 | `await disp.dispatch("<name>", <args>)` |
| 合并重复调用 | `disp.dispatch(..., idempotency_key="<key>")` |
| 对调用做关卡检查 | `chain.evaluate(<call>, <ctx>)` |
| 在沙箱中运行 | `sandbox.run([<exe>, "<arg>"])` |
| 为工具调用建 span | `builder.span("gen_ai.tool.execution")` |

## 关卡链，然后沙箱
type: annotated-code
lang: python
from: phases/19-capstone-projects/25-verification-gates-observation-budget/code/main.py, phases/19-capstone-projects/26-sandbox-runner-denylist/code/main.py

```python
chain = GateChain(gates=(
    WhitelistGate(allowed=frozenset({"read_file"})),  # allow-set
    RegexGate.from_strings(patterns=(r"\bsudo\b",)),  # argv pattern
    RecencyGate(window=3),                  # stale observation
    BudgetGate(max_tokens=200),             # ledger total
))
outcome = chain.evaluate(call, ctx)         # stops at first deny
if not outcome.allow:
    refused += 1                            # see outcome.deny_reason
ledger.record(obs)                          # BudgetGate reads it
config = SandboxConfig(project_root=root)
result = Sandbox(config=config).run(["rm", "-rf", "."])
result.denied                               # True: rm on denylist
```

## Workbench 脚本
type: command-table
from: phases/14-agent-engineering/42-agent-workbench-capstone/outputs/agent-workbench-pack/bin/install.sh, phases/14-agent-engineering/42-agent-workbench-capstone/outputs/agent-workbench-pack/scripts/init_agent.py, phases/14-agent-engineering/42-agent-workbench-capstone/outputs/agent-workbench-pack/scripts/run_with_feedback.py, phases/14-agent-engineering/42-agent-workbench-capstone/outputs/agent-workbench-pack/scripts/verify_agent.py, phases/14-agent-engineering/42-agent-workbench-capstone/outputs/agent-workbench-pack/scripts/generate_handoff.py, phases/14-agent-engineering/42-agent-workbench-capstone/docs/en.md

| 命令 | 作用 |
|---|---|
| `bin/install.sh` | 把 pack 复制到仓库。 |
| `bin/install.sh --force` | 覆盖已有的 `AGENTS.md`。 |
| `python3 scripts/init_agent.py` | 探测运行时、依赖、环境、状态新旧。 |
| `python3 scripts/run_with_feedback.py <cmd>` | 向 `feedback_record.jsonl` 记录一条。 |
| `python3 scripts/verify_agent.py <task_id>` | 关卡裁决。被拦截时退出码为 1。 |
| `python3 scripts/generate_handoff.py <task_id>` | 写出 `handoff.json` 和 `handoff.md`。 |

## Workbench 的七个面
type: concepts
from: phases/14-agent-engineering/31-agent-workbench-why-models-fail/docs/en.md

- **Instructions**：启动规则、禁止的操作、完成的定义。
- **State**：当前任务、改动过的文件、阻塞项、下一步。
- **Scope**：允许的文件、禁止的文件、验收标准。
- **Feedback**：把真实命令输出采集回循环。
- **Verification**：测试、lint、冒烟运行、范围检查。
- **Review**：换一个角色再过一遍。
- **Handoff**：改了什么、为什么、还剩什么。

## 默认值
type: defaults
from: phases/19-capstone-projects/20-agent-harness-loop-contract/code/main.py, phases/19-capstone-projects/21-tool-registry-schema-validation/code/main.py, phases/19-capstone-projects/23-function-call-dispatcher/code/main.py, phases/19-capstone-projects/26-sandbox-runner-denylist/code/main.py, phases/19-capstone-projects/29-end-to-end-coding-task-demo/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `max_turns` | 8 | 预算。暂停前的轮数 |
| `max_tool_calls` | 16 | 预算。每个会话的工具调用数 |
| `max_wall_seconds` | 30.0 | 预算。墙钟秒数 |
| `timeout_ms` | 30_000 | 每个工具。单次调用的覆盖值优先 |
| `max_attempts` | 3 | Dispatcher。只对超时和瞬时错误重试 |
| `concurrency` | 8 | Dispatcher 扇出信号量 |
| `DEFAULT_MAX_OUTPUT_BYTES` | 64 * 1024 | 沙箱每个流的上限 |
| `observation_budget` | 4000 | token。端到端运行，第 29 课 |

## 故障排查
type: troubleshooting
from: phases/19-capstone-projects/20-agent-harness-loop-contract/code/main.py, phases/19-capstone-projects/21-tool-registry-schema-validation/code/main.py, phases/19-capstone-projects/23-function-call-dispatcher/docs/en.md, phases/19-capstone-projects/26-sandbox-runner-denylist/code/main.py, phases/14-agent-engineering/42-agent-workbench-capstone/outputs/agent-workbench-pack/scripts/verify_agent.py

| 现象 | 原因 | 解决 |
|---|---|---|
| `illegal transition` | 该边不在合法映射中 | 只在 `_transition` 中改变状态 |
| `requires a payload` | 在工具拉取点调用了 `resume()` | 传入结果或错误 |
| `budget_exceeded:turns` | 达到了预算上限 | 检查后再 `resume()` |
| `kind="schema"` 从不重试 | schema 错误是确定性的 | 修正参数 |
| 一次写入执行了两次 | 重试与进行中的调用竞争 | 传入 `idempotency_key` |
| `feedback.null_exit` 拦截 | 没有采集到退出码 | 重跑。不要推进 |

## 术语表
type: glossary
from: phases/14-agent-engineering/01-the-agent-loop/docs/en.md, phases/14-agent-engineering/01-the-agent-loop/outputs/skill-agent-loop.md, phases/19-capstone-projects/23-function-call-dispatcher/code/main.py, phases/19-capstone-projects/27-eval-harness-fixture-tasks/docs/en.md, phases/19-capstone-projects/28-observability-otel-traces/docs/en.md, phases/15-autonomous-systems/10-claude-code-permission-modes/code/main.py

- **ReAct**：Reason + Act。Thought、Action、Observation 在同一个流中。
- **OTel**：OpenTelemetry。GenAI 约定固定了 `gen_ai.*` 键。
- **JSON-RPC**：错误码 -32601、-32602、-32603。
- **pass@k**：k 个样本上的 `1 - (1 - p)^k`。
- **HITL**：Human in the loop。低置信度的操作交给这里。

## 问答
type: qa
from: phases/19-capstone-projects/20-agent-harness-loop-contract/docs/en.md, phases/19-capstone-projects/23-function-call-dispatcher/docs/en.md, phases/19-capstone-projects/25-verification-gates-observation-budget/docs/en.md, phases/19-capstone-projects/26-sandbox-runner-denylist/docs/en.md, phases/14-agent-engineering/38-verification-gates/docs/en.md

- **为什么预算是一次 yield？** 由调用方决定扩展后恢复，还是关闭。
- **为什么非幂等超时不重试？** 写入可能已经提交。重试会重复写入。
- **为什么先跑便宜的关卡？** 一次拒绝就会在昂贵检查之前终止链条。
- **为什么关卡里不用 LLM 评审？** 相同的产物必须给出相同的裁决。

## 提示
type: tips
from: phases/19-capstone-projects/20-agent-harness-loop-contract/docs/en.md, phases/19-capstone-projects/23-function-call-dispatcher/docs/en.md, phases/14-agent-engineering/01-the-agent-loop/docs/en.md, phases/14-agent-engineering/33-instructions-as-executable-constraints/docs/en.md, phases/14-agent-engineering/36-scope-contracts/docs/en.md

- 只在一个函数里改变状态。这样不变量都集中在一处。
- 在 planner 中派生 key：`f"{step_id}:{tool_name}:{hash(args)}"`。
- 把工具错误作为 observation 字符串返回，而不是崩溃。
- hook 可以修改或中止。event 只做记录。
- `AGENTS.md` 控制在 50 行以内。按需加载主题文档。
- 在每个范围契约中写上 `forbidden_files`。
