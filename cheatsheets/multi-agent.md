---
id: multi-agent
title: Multi-Agent Systems
code: MA
subtitle: 智能体、交接、共享状态与编排器。选择模式、投票、设检查点，并修复已知故障。
hue: 290
sources: phases/16-multi-agent-and-swarms/01-why-multi-agent, phases/16-multi-agent-and-swarms/04-primitive-model, phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern, phases/16-multi-agent-and-swarms/06-hierarchical-architecture, phases/16-multi-agent-and-swarms/10-group-chat-speaker-selection, phases/16-multi-agent-and-swarms/11-handoffs-and-routines, phases/16-multi-agent-and-swarms/13-shared-memory-blackboard, phases/16-multi-agent-and-swarms/14-consensus-and-bft, phases/16-multi-agent-and-swarms/15-voting-debate-topology, phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints, phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink, phases/16-multi-agent-and-swarms/24-evaluation-coordination-benchmarks
source_hash: a1efdb13bbf6ade7
---

## 四个原语
type: architecture
from: phases/16-multi-agent-and-swarms/04-primitive-model/docs/en.md, phases/16-multi-agent-and-swarms/04-primitive-model/code/main.py, phases/16-multi-agent-and-swarms/13-shared-memory-blackboard/docs/en.md, phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints/docs/en.md, phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints/code/main.py

```arch
node | orch | 2,1 | Orchestrator | static, handoff, selector
node | ckpt | 4,1 | CheckpointStore | thread_id, super_step
node | a | 1,2 | Agent: researcher | prompt + tools
node | b | 2,2 | Agent: writer | stateless
node | c | 3,2 | Agent: reviewer | stateless
node | pool | 2,3 | SharedState | message pool
node | bb | 1,3 | Blackboard | topic pub/sub
node | ver | 3,3 | Verifier | read only
edge | orch | b | runs
edge | orch | ckpt | each step
edge | a | b | handoff
edge | b | c | handoff
edge | b | pool | append
edge | a | bb | publish
edge | pool | ver | read
```

## 协调智能体
type: task-table
from: phases/16-multi-agent-and-swarms/04-primitive-model/code/main.py, phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/code/main.py, phases/16-multi-agent-and-swarms/10-group-chat-speaker-selection/code/main.py, phases/16-multi-agent-and-swarms/11-handoffs-and-routines/code/main.py, phases/16-multi-agent-and-swarms/13-shared-memory-blackboard/code/main.py

| 任务 | 代码 |
|---|---|
| 共享消息池 | 先 `state = SharedState()` 再 `state.append(<msg>)` |
| 按固定顺序运行 | `StaticOrchestrator(<order>).run(team, state)` |
| 由智能体决定下一个 | `HandoffOrchestrator("<start>").run(team, state)` |
| 由选择器决定下一个 | `LLMSelectorOrchestrator("<start>", round_robin_selector)` |
| 用工具交接 | `def transfer_to_refunds() -> "Agent": return refund_agent` |
| 运行群聊 | `run_groupchat(AGENTS, <selector>, max_rounds=8, label="<label>")` |
| 扇出工作者 | `threading.Thread(target=w.run, args=(sq, results, i))` |
| 发布到主题 | `bb.publish("<writer>", "<topic>", "<content>", "<prompt>")` |

## 投票、持久化与防护
type: task-table
from: phases/16-multi-agent-and-swarms/14-consensus-and-bft/code/main.py, phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints/code/main.py, phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/code/main.py

| 任务 | 代码 |
|---|---|
| 计票 | `plurality(votes)` |
| 按置信度加权投票 | `cp_wbft(votes, threshold=0.5)` |
| 无领导者选择 | `decentllms(votes)` |
| 保存检查点 | `store.write(thread_id, super_step, dict(state))` |
| 崩溃后恢复 | `store.latest(thread_id)` |
| 给智能体一个队列 | `AgentQueue("<agent_id>").enqueue(<msg>)` |
| 阻止重试风暴 | 先 `if not breaker.allow(): ...` 再 `breaker.record(ok)` |

## 一次监督者运行
type: flow
from: phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/code/main.py, phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/docs/en.md

1. **主管**：`plan(query)` 把查询拆成子问题。
2. **主管**：为每个子问题启动一个 `Worker` 线程。
3. **工作者**：从全新上下文开始，只处理一个窄问题。
4. **工作者**：写出一个带摘要和 `tokens_spent` 的 `WorkerResult`。
5. **主管**：汇合所有线程。墙钟时间约等于最慢的工作者。
6. **主管**：`synthesize(query, results)` 合并各个答案。
7. **主管**：报告 `wall_clock_seconds`、`total_tokens` 和 `worker_count`。

## 交接循环（Swarm 风格）
type: annotated-code
lang: python
from: phases/16-multi-agent-and-swarms/11-handoffs-and-routines/code/main.py

```python
def run_swarm(start_agent: Agent, user_messages: list[str]) -> list[Msg]:
    history: list[Msg] = []
    active = start_agent                      # who holds the chat
    for user in user_messages:
        history.append(Msg(role="user", content=user))
        out = scripted_router(active, user)   # stands in for an LLM
        if isinstance(out, Agent):            # a tool returned an agent
            history.append(
                Msg(role="assistant", content=f"(handoff to {out.name})", sender=active.name)
            )
            active = out                      # switch the active agent
            out = scripted_router(active, user)
        history.append(Msg(role="assistant", content=str(out), sender=active.name))
    return history                            # nothing persists
```

## 置信度加权投票
type: annotated-code
lang: python
from: phases/16-multi-agent-and-swarms/14-consensus-and-bft/code/main.py

```python
def cp_wbft(votes: list[Vote], threshold: float = 0.5):
    weights: dict[str, float] = {}
    rep: dict[str, str] = {}
    for v in votes:
        key = v.canonical()                   # cluster equal answers
        weights[key] = weights.get(key, 0.0) + v.confidence
        rep.setdefault(key, v.answer)
    total = sum(weights.values()) or 1.0
    winner_key = max(weights, key=weights.get)
    if weights[winner_key] / total < threshold:
        return None, weights                  # too weak: retry or escalate
    return rep[winner_key], weights
```

## 选择模式
type: concepts
from: phases/16-multi-agent-and-swarms/01-why-multi-agent/docs/en.md, phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/docs/en.md, phases/16-multi-agent-and-swarms/06-hierarchical-architecture/docs/en.md, phases/16-multi-agent-and-swarms/10-group-chat-speaker-selection/docs/en.md, phases/16-multi-agent-and-swarms/11-handoffs-and-routines/docs/en.md, phases/16-multi-agent-and-swarms/13-shared-memory-blackboard/docs/en.md

- **流水线**：每个智能体做变换后往下传。一个阶段失败就阻塞后续所有阶段。
- **扇出 / 扇入**：拆给并行的智能体，再合并。适合相互独立的子任务。
- **监督者**：主管负责规划、委派和综合。不适合顺序性任务。
- **层级式**：监督者之上还有监督者。只有叶子节点干活。
- **群聊**：对等方共享一个消息池。由选择器挑下一个发言者。
- **交接**：当前活跃的智能体调用一个返回下一个智能体的工具。
- **黑板**：按主题发布/订阅。智能体多、运行时间长时占优。
- **单智能体**：工具调用少于 20 次且 token 少于 100k 时，保持单智能体。

## 代码中的默认值
type: defaults
from: phases/16-multi-agent-and-swarms/04-primitive-model/code/main.py, phases/16-multi-agent-and-swarms/10-group-chat-speaker-selection/code/main.py, phases/16-multi-agent-and-swarms/14-consensus-and-bft/code/main.py, phases/16-multi-agent-and-swarms/15-voting-debate-topology/code/main.py, phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `max_steps` | 10 | 每个编排器的 `run` |
| `max_rounds` | 8 | 群聊演示的上限 |
| `TERMINATE` | TERMINATE | 结束群聊的 token |
| `threshold` | 0.5 | `cp_wbft` 的接受比例 |
| `rounds` | 2 | 图拓扑辩论的轮数 |
| `failure_threshold` | 0.5 | 错误率高于此值时熔断器打开 |
| `window_size` | 20 | 窗口内熔断器统计的结果数 |
| `open_cooldown_s` | 0.5 | 进入半开状态前的秒数 |

## 故障排查
type: troubleshooting
from: phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/docs/en.md, phases/16-multi-agent-and-swarms/06-hierarchical-architecture/docs/en.md, phases/16-multi-agent-and-swarms/10-group-chat-speaker-selection/docs/en.md, phases/16-multi-agent-and-swarms/11-handoffs-and-routines/docs/en.md, phases/16-multi-agent-and-swarms/13-shared-memory-blackboard/docs/en.md, phases/16-multi-agent-and-swarms/14-consensus-and-bft/docs/en.md, phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/docs/en.md, phases/16-multi-agent-and-swarms/15-voting-debate-topology/docs/en.md, phases/16-multi-agent-and-swarms/04-primitive-model/code/main.py

| 症状 | 原因 | 修复 |
|---|---|---|
| 一个智能体每轮都发言 | 选择器偏爱某个发言者 | 在选择器中加入发言均衡 |
| 上下文每轮都在增长 | 每个智能体都读所有消息 | 给智能体投影视图 |
| 两个智能体来回交接 | 交接循环 | 在编排器上限制 `max_steps` |
| 一个错误数字扩散到所有智能体 | 共享状态中的记忆投毒 | 溯源、只追加、只读校验器 |
| 多数一起出错 | 单一化，同一个基座模型 | 混用不同基座模型 |
| 工作者研究错了对象 | 管理者的拆分偏离了目标 | 加一个金丝雀问题工作者 |
| 工作者意见不一，一方胜出 | 综合时的冲突被悄悄吞掉 | 重新提问或报告分歧 |
| 下游负载增长 10 倍 | 重试风暴 | 熔断器，限制重试次数 |

## 术语表
type: glossary
from: phases/16-multi-agent-and-swarms/14-consensus-and-bft/docs/en.md, phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/docs/en.md, phases/16-multi-agent-and-swarms/24-evaluation-coordination-benchmarks/docs/en.md, phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints/docs/en.md

- **BFT**：拜占庭容错（Byzantine fault tolerance）。可容忍 `f < n/3` 个故障节点。
- **CP-WBFT**：置信度探测加权 BFT（Confidence-Probed Weighted BFT）。按置信度给投票加权。
- **MAST**：故障分类法。规格、协调、验证。
- **MARBLE**：MultiAgentBench。星形、链形、树形和图拓扑。
- **超步（Super-step）**：两个检查点之间的工作单元。
- **发件箱模式（Outbox pattern）**：先写下副作用的意图。由独立的执行器去执行。

## 问答
type: qa
from: phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/docs/en.md, phases/16-multi-agent-and-swarms/13-shared-memory-blackboard/docs/en.md, phases/16-multi-agent-and-swarms/14-consensus-and-bft/docs/en.md, phases/16-multi-agent-and-swarms/15-voting-debate-topology/docs/en.md, phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/docs/en.md

- **多智能体的成本是多少？** 约为单智能体 token 量的 15 倍。
- **为什么校验器不能写？** 这样被投毒的消息池就无法反过来污染它。
- **5 到 7 个投票者用什么阈值？** 0.5 到 0.67。低于阈值就升级处理。
- **更多智能体还是换别的模型？** 换别的模型。三个不同模型胜过同一模型的五个副本。
- **最常见的故障？** 规格问题，占 MAST 故障的 41.77%。

## 提示
type: tips
from: phases/16-multi-agent-and-swarms/04-primitive-model/docs/en.md, phases/16-multi-agent-and-swarms/06-hierarchical-architecture/docs/en.md, phases/16-multi-agent-and-swarms/14-consensus-and-bft/docs/en.md, phases/16-multi-agent-and-swarms/15-voting-debate-topology/docs/en.md, phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints/docs/en.md

- 共享状态是唯一有状态的部分。查 bug 先看那里。
- 层级深度保持在 2 层以内。
- 辩论轮数限制在 2 或 3 轮。
- 图中智能体超过约 4 个后，协调开销会增长。
- LLM 调用使用异步 I/O。每个线程约占 1MB。
- 每个有副作用的调用都带上去重键。
