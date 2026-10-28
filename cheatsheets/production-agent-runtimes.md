---
id: production-agent-runtimes
title: Production Agent Runtimes and Queues
code: PA
subtitle: 选运行时形状、检查点与重放、租约与围栏作业、重试有界读取。Python 与 Go。
hue: 30
sources: phases/14-agent-engineering/29-production-runtimes, phases/15-autonomous-systems/12-durable-execution, phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints, projects/durable-agent-jobs, projects/cloud-agent-with-aws-strands
source_hash: e1799546605e724e
---

## 选择运行时形状
type: concepts
from: phases/14-agent-engineering/29-production-runtimes/docs/en.md, phases/15-autonomous-systems/12-durable-execution/docs/en.md, phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints/docs/en.md

- **Request-response**：同步 HTTP。用户等待。只用于短任务（<30s）。
- **Streaming**：SSE 或 WebSocket。盯住首 token 延迟与尾延迟。
- **Durable execution**：每一步后检查点状态。失败时自动恢复。
- **Queue-based**：生产者、工作池、DLQ。盯住队列深度与 DLQ 大小。
- **Event-driven**：智能体订阅触发器。盯住事件到启动延迟。
- **Scheduled**：cron 形。与 durable execution 组合。
- **Workflow and activity**：确定性编排代码。每一次 LLM 或工具调用是一条已记录的活动。
- **Exactly-once effective**：至少一次投递加上幂等消费者。

## 持久作业存储
type: architecture
from: projects/durable-agent-jobs/API.md, projects/durable-agent-jobs/README.md

```arch
node | enq | 1,1 | enqueue | --store, --input | client
node | lock | 2,1 | ledger.lock | advisory lock | store
node | jobs | 3,1 | jobs.json | ID, State, Version | store
node | wrk | 1,2 | worker | claim, effect, complete | process
node | inp | 2,2 | inputs/<id>.json | immutable input | store
node | eff | 3,2 | effects/<id>.json | immutable receipt | store
edge | enq | lock | read-modify-write
edge | lock | jobs | snapshot
edge | enq | inp | text
edge | wrk | lock | ClaimNext
edge | wrk | eff | receipt
```

## 各阶段中的作业生命周期
type: flow
from: projects/durable-agent-jobs/solution/stage1.go, projects/durable-agent-jobs/solution/stage2.go, projects/durable-agent-jobs/solution/stage3.go, projects/durable-agent-jobs/solution/stage4.go

1. **NewJob**：ID 必须匹配 `^[a-z][a-z0-9-]{0,63}$`。状态是 queued，版本 0。
2. **ClaimJob**：需要期望版本且状态为 queued。否则 `ErrConflict`。
3. **ClaimJob**：`Attempts >= maxAttempts` 给出 `ErrLimit`。
4. **ClaimJob**：`Version++`，`Attempts++`，`LeaseUntil = now + ttl`，状态 running。
5. **Finish**：当前版本、状态 running 且 `now < LeaseUntil`。状态 completed。
6. **Reclaim**：running 且 `now >= LeaseUntil`。状态 queued，`Version++` 围栏旧 worker。
7. **Save**：`ValidateJobs`，写临时文件，`f.Sync()`，`os.Rename`。上限 4 MiB。

## 持久作业 CLI
type: command-table
from: projects/durable-agent-jobs/README.md, projects/durable-agent-jobs/API.md

| Command | What it does |
|---|---|
| `go build -o /tmp/durable-jobs .` | 在 `solution` 里构建参考二进制 |
| `enqueue --store <dir> --input <file>` | 添加作业。相同重投递是安全的 |
| `worker --store <dir> --max-jobs 100` | 认领并跑最多 100 个作业 |
| `status --store <dir>` | 显示作业、可用 effect 与范围 |
| `--crash-after effect` | 在收据存在后以 86 退出 |
| `--crash-after claim` | 在输出存在之前以 86 退出 |
| `--now-ms 111 --lease-ms 10` | 逻辑时钟。旧租约已过期 |
| `go run . demo` | 跑 effect-crash 序列 |

## 跑演示
type: task-table
from: phases/14-agent-engineering/29-production-runtimes/docs/en.md, projects/durable-agent-jobs/README.md, projects/cloud-agent-with-aws-strands/README.md, projects/cloud-agent-with-aws-strands/requirements-framework.txt

| Task | Code |
|---|---|
| 跑课文演示 | `python3 code/main.py` |
| 给项目参考打分 | `--all --solution --strict` |
| 跑云读取器 | `python3 cli.py samples/input.json` |
| 改为读线上 AWS | `python3 cli.py <input> --mode aws` |
| 钉住可选 SDK | `strands-agents==1.57.1` |

## 从事件日志重放活动
type: annotated-code
lang: python
from: phases/15-autonomous-systems/12-durable-execution/code/main.py

```python
@activity("call_llm")                    # each LLM call is an activity
def call_llm(doc_count: int) -> str:
    return f"summary({doc_count}_docs)"
hit = log.lookup(name, args)             # done event with the same args
if hit:
    return hit["result"]                 # replay, no new execution
log.append({"name": name, "args": list(args), "status": "started"})
result = fn(*args)                       # runs only when not in the log
log.append({"name": name, "args": list(args),
            "status": "done", "result": result})
```

## 每超步检查点
type: annotated-code
lang: python
from: phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints/code/main.py

```python
store = CheckpointStore(db_path)         # SQLite table checkpoints
store.write(thread_id, super_step, dict(state))  # one row per step
restored = store.latest(thread_id)       # ORDER BY super_step DESC
super_step, state = restored
super_step += 1                          # resume after the last step
run_agent_with_checkpoint(store, "t-1", crash_at=3, goal=5)
final = run_agent_with_checkpoint(store, "t-1", goal=5)  # worker 2
await asyncio.gather(*(sim_llm_call_async() for _ in range(n)))
```

## 有界云读取器契约
type: annotated-code
lang: python
from: projects/cloud-agent-with-aws-strands/API.md, projects/cloud-agent-with-aws-strands/solution/plan.py, projects/cloud-agent-with-aws-strands/solution/executor.py, projects/cloud-agent-with-aws-strands/solution/retry.py, projects/cloud-agent-with-aws-strands/solution/cli.py

```python
ALLOWED = {"inventory.list", "metrics.read", "logs.read"}
validate_plan(raw, scope)        # one to ten actions, read-only, in scope
execute(plan, provider, max_steps=5, max_chars=4000)
# over budget: state budget_exhausted
request_key(operation, resource) # sha256 of the JSON pair
cached_read(operation, resource, provider, cache, retries=2)
# cache hit: attempts 0. Only TimeoutError retries
run(payload, provider)           # adds receipts with cached, attempts
parse_model_plan(text, scope)    # the model plan goes to validate_plan
```

## 默认值
type: defaults
from: projects/durable-agent-jobs/API.md, projects/durable-agent-jobs/solution/main.go, projects/cloud-agent-with-aws-strands/solution/executor.py, projects/cloud-agent-with-aws-strands/solution/retry.py, projects/cloud-agent-with-aws-strands/solution/cli.py

| Setting | Default | Note |
|---|---|---|
| `--lease-ms` | 30000 | 认领租约，毫秒 |
| `--max-attempts` | 3 | 之后作业等待人工对账 |
| `--max-jobs` | 1 | 一次 worker 调用的作业数 |
| `--delay-ms` | 0 | 范围 0..60000 |
| `--now-ms` | -1 | -1 表示当前墙钟时间 |
| `max_steps` | 5 | 步数预算。`max_chars` 是 4000 |
| `retries` | 2 | 在 `cached_read` 里。CLI `run` 传 1 |

## 排障
type: troubleshooting
from: phases/14-agent-engineering/29-production-runtimes/docs/en.md, phases/15-autonomous-systems/12-durable-execution/docs/en.md, phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints/docs/en.md, projects/durable-agent-jobs/README.md, projects/durable-agent-jobs/API.md, projects/durable-agent-jobs/solution/stage3.go

| Symptom | Cause | Fix |
|---|---|---|
| 用户挂断，重试叠加 | 5 分钟任务用 request-response | 用队列或 durable 形状 |
| 失败作业消失 | 队列 worker 没有死信 | 加 DLQ 并暴露 DLQ 大小 |
| 失败直到用户报告才可见 | 后台跑却没有导出追踪 | 导出 OpenTelemetry GenAI spans |
| 崩溃重跑工具并再计费 LLM 调用 | 朴素 `while True` 循环 | 把每次调用记成活动并重放 |
| 完成返回 conflict | 陈旧 worker：版本或租约已变 | 新认领完成作业 |
| 作业停在尝试上限 | 达到 `--max-attempts` | 人工对账可见作业 |
| 重放发散 | 工作流决策里用了墙钟 | 把它登记为副作用 |
| 10,000 次调用用掉 10GB 栈 | 每一次 LLM 调用一个线程 | I/O 层用 async |

## 问题
type: qa
from: phases/15-autonomous-systems/12-durable-execution/docs/en.md, projects/durable-agent-jobs/README.md, projects/cloud-agent-with-aws-strands/README.md, phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints/docs/en.md

- **用哪种检查点后端？** PostgreSQL 能挺过部署。SQLite 只适合本地开发。Redis 是短暂的，除非配置了 AOF/快照。
- **何时不该用 durable execution？** 短于几分钟且无人工输入的跑法，或严格只读检索。
- **持久性能修好 35 分钟退化吗？** 不能。在重新进入时加新鲜 HITL 与预算熔断。
- **收据是恰好一次吗？** 不是。执行至少一次。收据只让这个本地 effect 幂等。
- **为什么三步只有两次 provider 读？** 重复的 metrics.read 用请求本地缓存。
- **恢复显示什么？** `incident-summary` 是 completed v4，attempts 2，带 `reused_effect: true`。

## 提示
type: tips
from: phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints/docs/en.md, projects/durable-agent-jobs/README.md, projects/durable-agent-jobs/API.md

- 从 FastAPI + Postgres 开始。测到失败再升级。
- 在每一次副作用调用里放去重键。
- 支付与外部 API 调用用 outbox 模式。
- 用彩虹部署。部署期间绝不杀掉飞行中的智能体跑法。
- I/O 用 async。线程只用于 CPU 密集后处理。
- 把作业存储放在一个本地 POSIX 文件系统上。不要放在 NFS 上。
- worker 跑着时不要编辑存储文件。
