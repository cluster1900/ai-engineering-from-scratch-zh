# Parallel / Swarm / Networked Architectures

> 与 supervisor 对比：没有中央 decider。Agents 读取共享 event bus，异步领取工作，并写回结果。LangGraph 明确支持面向去中心化、动态环境的 "Swarm Architecture"。Matrix (arXiv:2511.21686) 将 control flow 和 data flow 都表示为通过 distributed queues 传递的 serialized messages，以消除 orchestrator 瓶颈。权衡很明确：用 determinism 和 traceability 换 scalability。Swarm 适合包含许多独立子问题的任务；不适合需要单一连贯计划的任务。

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`, `queue`)
**前置要求：** Phase 16 · 05 (Supervisor Pattern), Phase 16 · 04 (Primitive Model)
**Time:** ~75 minutes

## 问题
Supervisor 可以扩展到少数几个 workers。那几百个呢？Supervisor 本身会成为瓶颈：谁做什么的每个 decision 都要通过一个 agent。一个缓慢的 plan step 会拖住整个 system。

Swarm architectures 反转了这个设计。不是由 central planner 分发工作，而是 workers 从 shared queue 中领取工作。"coordination" 被内置在 event bus semantics 中。没有 orchestrator；system 会一直扩展，直到 queue 成为限制。

## 概念
### The shape

```
                ┌──── shared queue ────┐
                │                      │
       ┌────────┼────────┐  ◄──────┬───┘
       ▼        ▼        ▼         │
     Worker  Worker  Worker   Worker
      A       B       C        D
       │        │        │         │
       └────────┴────────┴─────────┘
                 │
                 ▼
            results pool
```

没有 orchestrator。每个 worker 反复执行：拉取一个 task，处理，写入 result（并可选地 enqueue follow-ups）。

### When swarm fits

- **许多独立 tasks。** Scraping、transforming、classifying。Tasks 彼此不依赖。
- **可变时长的工作。** 如果有些 tasks 需要 100ms，而另一些需要 10s，swarm 会自动平衡 load —— 快速 workers 会拉取后续 jobs。Supervisor 必须提前预测 duration。
- **Throughput 优先于 determinism。** 你关心的是总 completion time，而不是严格 ordering。

### When swarm fails

- **有序 workflows。** 如果 step 3 需要 step 2 的 output，swarm 可能让 step 3 在 step 2 完成前触发。
- **Global-plan tasks。** 复杂 research questions 受益于 planner。一个 researchers swarm 会产出独立事实，而不是连贯 report。
- **Debugging。** 没有 central log 且 work 异步时，复现 bug 成本很高。

### Matrix (arXiv:2511.21686)

Matrix 是 2025 年的一篇 paper，它将 swarm 推向自然结论：control flow 和 data flow 都是在 distributed queues 上的 serialized messages。没有 central coordinator。Fault tolerance 来自 message durability。Scalability 是 message broker 的问题，而不是 system 的问题。

贡献：一种 programming model，其中 multi-agent coordination 是“这个 agent 订阅哪个 message topic?”，而不是“supervisor 下一步选择哪个 agent?” 这让 system 看起来像一个 pub/sub event mesh。

### LangGraph 的 Swarm Architecture

LangGraph 2025 docs 明确将 "Swarm Architecture" 描述为 multi-agent patterns 之一：agents 是 nodes，但 edges 形成带 cycles 的 directed graph，并且任何 node 都可以从 pool 中被激活。Worker 根据 condition 从 available work 中选择，而不是由 supervisor assignment 指派。

### Failure mode: starvation and hot-spotting

如果所有 workers 都拉取最快可用的 task，long-running tasks 直到只剩它们时才会被领取。经典 queue starvation。

Mitigations:
- 带显式 aging 的 Priority queues（随 wait time 提高 priority）。
- Worker specialization：一些 workers 只接收 "long" tasks。
- Back-pressure：限制进入 queue 的 fast tasks 数量。

### The content-based routing link

Swarm 与 content-based routing（Lesson 22）天然配对。不要使用 generic queue，而是为每种 message type 准备一个 queue。Specialist workers 只订阅自己的 type。这是可扩展到数千 agents 的 message-bus architectures 的基础。

## 构建它
`code/main.py` 实现了一个由 4 个 worker threads 组成的 swarm，它们从共享 `queue.Queue` 中拉取 tasks。Tasks 具有可变 durations（有些快，有些慢）。该 demo 对比：

- **Sequential baseline:** 一个 worker 串行处理所有 tasks。
- **Fixed assignment:** 每个 task 预先分配给特定 worker（supervisor-style）。
- **Swarm:** workers 从 shared queue 中拉取。

Swarm 会自动平衡 load；fixed assignment 会在某个 assigned task 很慢时让 fast workers 闲置。

Run:

```
python3 code/main.py
```

Output 会显示每个 worker 的 task counts（swarm 分布不均但最优）和 wall-clock times。

## 使用它
`outputs/skill-swarm-fit.md` 评估一个 task 应该使用 swarm 还是 supervisor。Inputs：task independence、duration variance、ordering requirements、debuggability needs。

## 交付它
Checklist:

- **带 aging 的 Priority queue。** 防止 long-task starvation。
- **Worker idempotency。** 如果 worker 在 mid-run 崩溃，一个 task 可能被拉取多次。Workers 必须是 idempotent。
- **Durable queue。** 生产环境使用 Kafka、Redis Streams 或 database-backed queue。`queue.Queue` 仅在内存中。
- **每个 task 的 observability。** 每个 task 都有 trace ID；每个 worker 都用它记录 start/end。
- **Back-pressure。** 如果 queue 增长速度快于 workers drain 它的速度，就减慢 producer。

## 练习
1. 运行 `code/main.py`。在 variable-duration workload 上，swarm 比 sequential 快多少？比 fixed assignment 快多少？
2. 添加一个 priority queue variant（使用 `queue.PriorityQueue`）。按 task 的 "importance" field 分配 priority。观察在 continuous load 下 low-priority tasks 是否会 starve。
3. 实现一个 hot-spot detector：当任何 worker 处理的 tasks 数量达到最慢 worker 的 3× 时记录日志。这说明 task-duration distribution 存在什么情况？
4. 阅读 Matrix paper (arXiv:2511.21686) 的 abstract 和 Section 3。识别 Matrix 接受的一个具体 tradeoff（scalability gain）以及它放弃的一个 tradeoff（traceability、determinism）。
5. 将 swarm demo 改为使用由 (task_type, payload) tuples 组成的 `queue.Queue`，workers 只订阅特定 types。当 tasks 异构时，哪些 routing rules 是合理的？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Swarm architecture | "Decentralized agents" | Workers 从 shared queue 中拉取；没有 central orchestrator。 |
| Event bus | "Agents subscribe to topics" | 按 type 或 content 将 tasks 路由给 workers 的 message broker。 |
| Starvation | "Task never runs" | 因为 higher-priority work 持续到达，low-priority task 永远不会被选中。 |
| Hot-spotting | "One worker drowns" | 一个 worker 获得大多数 tasks 的 load imbalance。 |
| Back-pressure | "Slow down the producer" | 当 queue 填满时，向 upstream 发出停止生产信号的 mechanism。 |
| Idempotent worker | "Safe to re-run" | 一个 task 被处理两次会产生相同 result。因为 workers 可能在 mid-run 崩溃，所以这是必需的。 |
| Durable queue | "Survives crashes" | 由 disk 或 replicated storage 支持的 queue；worker 崩溃时 tasks 不会丢失。 |
| Matrix framework | "Full message-passing swarm" | Data 和 control flow 都是在 distributed queues 上的 serialized messages。 |

## 延伸阅读
- [LangGraph workflows and agents — Swarm Architecture](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — 明确支持 swarm
- [Matrix — A Decentralized Framework for Multi-Agent Systems](https://arxiv.org/abs/2511.21686) — 完整 message-passing swarm
- [Anthropic engineering — why supervisor not swarm in Research](https://www.anthropic.com/engineering/multi-agent-research-system) — 为什么一个具体 production system 明确选择 supervisor 而不是 swarm
- [AutoGen v0.4 actor-model docs](https://microsoft.github.io/autogen/stable/) — event-driven actor rewrite，比 v0.2 的 GroupChat 更接近 swarm
