---
id: autonomous-agents
title: Autonomous Agents and Permissions
code: AA
subtitle: 在有限制的前提下让 agent 无人值守地运行。权限模式、预算、紧急停止开关、持久化执行、审批与回滚。
hue: 330
sources: phases/15-autonomous-systems/01-long-horizon-agents, phases/15-autonomous-systems/08-bounded-self-improvement, phases/15-autonomous-systems/10-claude-code-permission-modes, phases/15-autonomous-systems/12-durable-execution, phases/15-autonomous-systems/13-cost-governors, phases/15-autonomous-systems/14-kill-switches-canaries, phases/15-autonomous-systems/15-propose-then-commit, phases/15-autonomous-systems/16-checkpoints-rollback
source_hash: 103b764609d13d4e
---

## 运维任务
type: task-table
from: phases/15-autonomous-systems/10-claude-code-permission-modes/docs/en.md, phases/15-autonomous-systems/13-cost-governors/docs/en.md, phases/15-autonomous-systems/14-kill-switches-canaries/docs/en.md, phases/15-autonomous-systems/14-kill-switches-canaries/code/main.py, phases/15-autonomous-systems/12-durable-execution/code/main.py, phases/15-autonomous-systems/15-propose-then-commit/code/main.py

| 任务 | 代码 |
|---|---|
| 先审阅计划 | 权限模式 `plan` |
| 只自动批准文件编辑 | 权限模式 `acceptEdits` |
| 限制花费和循环轮数 | `max_budget_usd`、`max_turns` |
| 限制工具集 | `allowed_tools` / `disallowed_tools` |
| 终止 agent 容器 | `kubectl delete pod` |
| 重复调用时跳闸 | `CircuitBreaker(threshold=5)` |
| 崩溃后重放 | `workflow(EventLog(<path>), <query>)` |
| 让审批可安全重试 | `k = p.key()` |

## 控制层
type: architecture
from: phases/15-autonomous-systems/10-claude-code-permission-modes/docs/en.md, phases/15-autonomous-systems/13-cost-governors/docs/en.md, phases/15-autonomous-systems/14-kill-switches-canaries/docs/en.md, phases/15-autonomous-systems/15-propose-then-commit/docs/en.md, phases/15-autonomous-systems/12-durable-execution/docs/en.md

```arch
node | loop | 1,1 | Agent loop | turns, tool calls
node | perm | 2,1 | Permission mode | plan to bypassPermissions
node | gov | 3,1 | Cost governor | stack of caps
node | kill | 4,1 | Kill switch | agent cannot write it
node | breaker | 1,2 | Circuit breaker | closed, open, half-open
node | canary | 2,2 | Canary token | access is the alarm
node | prop | 3,2 | Proposal store | propose, commit, verify
node | log | 4,2 | Event log | keyed by thread_id
edge | loop | perm | action
edge | perm | gov | spend
edge | gov | kill | breach
edge | loop | breaker | calls
edge | loop | canary | reads
edge | perm | prop | approve
edge | prop | log | persist
```

## 提议、提交、验证
type: flow
from: phases/15-autonomous-systems/15-propose-then-commit/docs/en.md, phases/15-autonomous-systems/15-propose-then-commit/code/main.py, phases/15-autonomous-systems/16-checkpoints-rollback/docs/en.md, phases/15-autonomous-systems/16-checkpoints-rollback/code/main.py

1. **提议**：存储意图、来源链路、影响范围和回滚方案。状态 `waiting`。
2. **呈现**：由人而不是 agent 审阅这些元数据。
3. **批准**：`checklist_approve` 需要三项检查全部通过。状态 `approved`。
4. **前置条件**：状态仍与批准时一致，否则 `aborted-precondition`。
5. **提交**：先持久化意图，再执行副作用。
6. **验证**：重新读取目标。失败则执行回滚。
7. **重试**：终止状态直接返回已存储的结果，不会第二次执行。

## 持久化 activity
type: annotated-code
lang: python
from: phases/15-autonomous-systems/12-durable-execution/code/main.py

```python
def activity(name: str):
    def deco(fn):
        @functools.wraps(fn)
        def wrapper(log: EventLog, *args):
            hit = log.lookup(name, args)  # done event in log?
            if hit:
                return hit["result"]  # replay, no re-run
            log.append({"name": name, "args": list(args), "status": "started"})
            result = fn(*args)  # the real side effect
            log.append({"name": name, "args": list(args),
                        "status": "done", "result": result})  # log output
            return result
        return wrapper
    return deco
```

## 调控器与熔断器
type: annotated-code
lang: python
from: phases/15-autonomous-systems/13-cost-governors/code/main.py, phases/15-autonomous-systems/14-kill-switches-canaries/code/main.py

```python
gov = Governor(max_turns=200, max_budget_usd=50.0)  # session caps
if gov.enable_iter_cap and turn >= gov.max_turns:
    run.stopped_by = "max_turns"  # iteration cap
if gov.enable_session_cap and run.dollars >= gov.max_budget_usd:
    run.stopped_by = "max_budget_usd"  # dollar cap
if gov.enable_velocity and velocity_exceeded(run, gov, now_min):
    run.stopped_by = "velocity_limit"  # rolling spend rate
if kill_switch["enabled"]:
    break  # external off-button
allowed = breaker.record(f"{a.kind}:{a.payload}")
if not allowed:
    break  # 5 identical calls opened it
```

## 权限模式
type: concepts
from: phases/15-autonomous-systems/10-claude-code-permission-modes/docs/en.md

- **`plan`**：用户批准计划。每个动作都先经审阅。
- **`default`**：“手动”。shell、破坏性和网络动作都会询问。
- **`acceptEdits`**：文件写入自动批准。shell 和网络仍会询问。
- **`auto`**：由分类器模型审阅每个动作。阻止权限升级。
- **`dontAsk`**：从不询问。未批准的动作一律拒绝。
- **`bypassPermissions`**：全部批准。只用于一次性容器。

## 模拟器中的默认值
type: defaults
from: phases/15-autonomous-systems/13-cost-governors/code/main.py, phases/15-autonomous-systems/14-kill-switches-canaries/code/main.py, phases/15-autonomous-systems/14-kill-switches-canaries/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `max_tokens_per_request` | 10_000 | 每次调用的补全上限 |
| `max_turns` | 200 | 每个会话的循环迭代次数 |
| `max_budget_usd` | 50.0 | 会话金额（美元），超出即中止 |
| `velocity_usd_per_min` | 5.0 | 滚动花费速率阈值 |
| `velocity_window_min` | 10.0 | 计算速率的窗口 |
| `monthly_cap_usd` | 500.0 | 较晚才能抓住慢性泄漏 |
| `threshold` | 5 | 触发熔断的相同调用次数 |
| 半开探测次数 | 默认 1 | 冷却后 1 到 3 次 |

## 哪道上限拦住什么
type: concepts
from: phases/15-autonomous-systems/13-cost-governors/docs/en.md, phases/15-autonomous-systems/14-kill-switches-canaries/docs/en.md

- **失控循环**：由速率限制拦住。
- **慢性泄漏**：约为预期工作量的 2x。由每日上限拦住。
- **有问题的发布**：新版本消耗 5x 的 token。由每周或每月上限拦住。
- **合理的激增**：由小时或日上限拦住，并留下清晰的日志。
- **缓慢的对抗性漂移**：能骗过统计检测器。硬性上限能拦住。
- **安全动作的组合**：没有检测器能拦住。

## 故障排查
type: troubleshooting
from: phases/15-autonomous-systems/12-durable-execution/docs/en.md, phases/15-autonomous-systems/13-cost-governors/docs/en.md, phases/15-autonomous-systems/14-kill-switches-canaries/docs/en.md, phases/15-autonomous-systems/15-propose-then-commit/docs/en.md, phases/15-autonomous-systems/16-checkpoints-rollback/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 崩溃后所有工具调用被重跑 | 朴素的 `while True` 循环 | activity 加事件日志 |
| 重放结果分叉 | workflow 中用了墙钟时间或随机数 | 把它注册为副作用 |
| 已批准的动作执行了两次 | 没有幂等键 | 每个提议一个键 |
| 恢复后透支 | 只做了幂等检查 | 加上前置条件检查 |
| 显示“已提交”但没有副作用 | 状态已保存，动作丢失 | 通过重新读取来验证，失败则回滚 |
| 审批流于形式 | 只有一个普通的批准按钮 | 质询-应答式检查清单 |
| 新增一个工具后账单翻了三倍 | 没有按工具设上限 | 按工具设上限，加每日增长告警 |
| agent 关掉了自己的金丝雀 | 检测器在 agent 可触及的范围内 | 把它放在 agent 无法写入的位置 |

## 术语表
type: glossary
from: phases/15-autonomous-systems/01-long-horizon-agents/docs/en.md, phases/15-autonomous-systems/12-durable-execution/docs/en.md, phases/15-autonomous-systems/13-cost-governors/docs/en.md, phases/15-autonomous-systems/15-propose-then-commit/docs/en.md, phases/15-autonomous-systems/16-checkpoints-rollback/docs/en.md

- **HITL**：Human-in-the-loop（人在回路）。动作执行前由人批准。
- **METR 时间跨度**：模型能以 50% 可靠性完成的任务时长。
- **Denial of Wallet**：没有上限阻止、持续花钱的 agent 循环。
- **thread_id**：为单个会话划定持久化状态范围的键。
- **租约（Lease）**：声明由某个 worker 执行某次运行的短期占用。崩溃时过期。
- **影响范围（Blast radius）**：动作出错时受影响的范围。
- **SAGA**：抵消原始动作的补偿事务。

## 问答
type: qa
from: phases/15-autonomous-systems/01-long-horizon-agents/docs/en.md, phases/15-autonomous-systems/13-cost-governors/docs/en.md, phases/15-autonomous-systems/12-durable-execution/docs/en.md, phases/15-autonomous-systems/16-checkpoints-rollback/docs/en.md, phases/15-autonomous-systems/10-claude-code-permission-modes/docs/en.md

- **每步 99%，共 70 步？** agent 仍有一半的概率失败。
- **为什么要叠加多道上限？** 只有月度上限的话，触发时钱包已经空了。
- **为什么每次状态转换都要持久化？** 重放可以落在任意位置，租约恢复也能做到精确。
- **什么时候可以不用持久化执行？** 不需要人工输入的短运行，或只读工作。
- **`auto` 会漏掉什么？** 隐蔽的注入，以及由安全动作组成的有害序列。

## 提示
type: tips
from: phases/15-autonomous-systems/13-cost-governors/docs/en.md, phases/15-autonomous-systems/14-kill-switches-canaries/docs/en.md, phases/15-autonomous-systems/15-propose-then-commit/docs/en.md, phases/15-autonomous-systems/16-checkpoints-rollback/docs/en.md, phases/15-autonomous-systems/12-durable-execution/docs/en.md

- 绝不在没有 `max_budget_usd` 的情况下运行 `auto`。
- 每个有后果的动作都检查紧急停止开关。
- 只能通过人的显式操作重新启用紧急停止开关。
- 给每个新工具单独设上限和告警。
- 不可逆的写入一律 HITL，读取则从不需要。
- 每种回滚至少端到端演练一次。
