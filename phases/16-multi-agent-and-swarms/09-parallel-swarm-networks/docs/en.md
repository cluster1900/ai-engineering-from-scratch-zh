# Parallel / Swarm / Networked Architecture

> 与 supervisor 对比：这里没有中央决策者。Agent 从共享 event bus 读取消息，异步领取工作，再将结果写回。LangGraph 明确支持面向去中心化动态环境的“Swarm Architecture”。Matrix（arXiv:2511.21686）将控制流和数据流都表示为通过分布式队列传递的序列化消息，以消除 orchestrator 瓶颈。其取舍很明确：用确定性和可追踪性换取可扩展性。Swarm 适合包含大量独立子问题的任务；不适合需要单一连贯计划的任务。

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`, `queue`)
**Prerequisites:** Phase 16 · 05 (Supervisor Pattern), Phase 16 · 04 (Primitive Model)
**Time:** ~75 分钟

## 问题

Supervisor 可以扩展到少量 worker。如果有数百个 worker 呢？Supervisor 本身会成为瓶颈：所有“由谁做什么”的决策都要经过同一个 Agent。一个缓慢的规划步骤就会阻塞整个系统。

Swarm architecture 颠倒了这种设计。工作不再由中央规划器分发，而是由 worker 从共享队列中自行领取。“协调”被内置于 event bus 的语义中。系统没有 orchestrator，其扩展上限取决于队列。

## 概念

### 结构

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

没有 orchestrator。每个 worker 都会重复以下流程：提取任务、处理任务、写入结果，并可选择将后续任务加入队列。

### Swarm 的适用场景

- **大量独立任务。** 抓取、转换、Classification。任务之间互不依赖。
- **执行时长不同的工作。** 如果部分任务耗时 100ms，另一些耗时 10s，swarm 会自动平衡负载：速度快的 worker 会继续领取下一个任务。Supervisor 则必须预估任务时长。
- **吞吐量优先于确定性。** 你关心的是总体完成时间，而不是严格的执行顺序。

### Swarm 的失效场景

- **有序工作流。** 如果第 3 步需要第 2 步的输出，swarm 可能会在第 2 步完成前启动第 3 步。
- **需要全局计划的任务。** 复杂研究问题能够从规划器中受益。由研究型 Agent 组成的 swarm 会产出彼此独立的事实，而不是一份连贯的报告。
- **调试。** 在缺少中央日志且工作异步执行的情况下，复现 bug 的成本很高。

### Matrix（arXiv:2511.21686）

Matrix 是一篇发表于 2025 年、将 swarm 推向自然极致的论文：控制流和数据流都是分布式队列上的序列化消息。系统没有中央协调器。容错能力来自消息持久化。可扩展性是 message broker 需要解决的问题，而不是系统本身的问题。

其贡献是提出一种编程 Model：Multi-Agent 协调不再是“supervisor 接下来选择哪个 Agent？”，而是“这个 Agent 订阅哪个消息主题？”这使系统呈现为一个 pub/sub event mesh。

### 图框架中的 Swarm

LangGraph 2025 文档明确将“Swarm Architecture”描述为一种 Multi-Agent 模式：Agent 是节点，但边会构成一个包含环路的有向图，池中的任意节点都可以被激活。Worker 根据条件从可用工作中进行选择，而不是等待 supervisor 分配。

### 失效模式：starvation 与 hot-spotting

如果所有 worker 都提取最快可用的任务，长时间运行的任务就永远不会被选中，直到队列里只剩下这些任务。这就是典型的队列 starvation。

缓解措施：
- 使用带显式 aging 的优先级队列（等待时间越长，优先级越高）。
- Worker 专业化：部分 worker 只接收“长”任务。
- Back-pressure：限制进入队列的快速任务数量。

### 与基于内容路由的联系

Swarm 与基于内容的路由（Lesson 22）天然契合。不要使用通用队列，而是为每种消息类型设置一个队列。专业 worker 只订阅其对应的类型。这是可扩展至数千个 Agent 的 message-bus architecture 的基础。

```figure
sw-work-stealing
```

## 动手构建

`code/main.py` 实现了一个由 4 个 worker thread 组成的 swarm，它们从共享的 `queue.Queue` 中提取任务。任务具有不同的执行时长（有些快，有些慢）。Demo 会对比：

- **Sequential baseline：** 一个 worker 串行处理所有任务。
- **Fixed assignment：** 每个任务都预先分配给特定 worker（supervisor 风格）。
- **Swarm：** worker 从共享队列中提取任务。

Swarm 会自动平衡负载；在 fixed assignment 中，如果分配的任务很慢，速度快的 worker 就会处于空闲状态。

运行：

```
python3 code/main.py
```

输出会显示每个 worker 的任务数量（swarm 的分配并不均匀，但达到最优）和实际运行时间。

## 实际使用

`outputs/skill-swarm-fit.md` 用于评估任务应使用 swarm 还是 supervisor。输入：任务独立性、执行时长差异、顺序要求、可调试性需求。

## 交付上线

检查清单：

- **带 aging 的优先级队列。** 防止长任务 starvation。
- **Worker 幂等性。** 如果 worker 在运行途中崩溃，同一个任务可能被提取多次。Worker 必须是幂等的。
- **持久化队列。** 生产环境应使用 Kafka、Redis Streams 或数据库支持的队列。`queue.Queue` 仅存储于内存。
- **按任务提供可观测性。** 每个任务都有一个 trace ID；每个 worker 都使用该 ID 记录开始和结束。
- **Back-pressure。** 如果队列增长速度超过 worker 的处理速度，就降低生产者的速度。

## 练习

1. 运行 `code/main.py`。在执行时长不同的工作负载上，swarm 比 sequential 快多少？比 fixed assignment 快多少？
2. 添加一个优先级队列变体（使用 `queue.PriorityQueue`）。根据任务的“importance”字段分配优先级。观察在持续负载下，低优先级任务是否会发生 starvation。
3. 实现 hot-spot 检测器：当任意 worker 处理的任务数量达到最慢 worker 的 3 倍时进行记录。这反映了任务时长分布的什么特征？
4. 阅读 Matrix 论文（arXiv:2511.21686）的摘要和第 3 节。找出 Matrix 接受的一项具体取舍：它获得了什么（可扩展性），又放弃了什么（可追踪性、确定性）？
5. 修改 swarm Demo，使用由 `(task_type, payload)` tuple 组成的 `queue.Queue`，并让 worker 只订阅特定类型。当任务类型各不相同时，哪些路由规则较为合理？

## 关键术语

| 术语 | 人们通常怎么说 | 实际含义 |
|------|----------------|------------------------|
| Swarm architecture | “去中心化 Agent” | Worker 从共享队列中提取任务；没有中央 orchestrator。 |
| Event bus | “Agent 订阅主题” | 根据类型或内容将任务路由给 worker 的 message broker。 |
| Starvation | “任务永远不运行” | 由于优先级更高的工作不断到达，低优先级任务始终无法被选中。 |
| Hot-spotting | “一个 worker 被压垮” | 一个 worker 获得大多数任务的负载不均衡现象。 |
| Back-pressure | “让生产者减速” | 当队列填满时，向上游发出停止生产信号的机制。 |
| Idempotent worker | “可以安全地重新运行” | 同一任务处理两次会产生相同结果。之所以需要这一特性，是因为 worker 可能在运行途中崩溃。 |
| Durable queue | “崩溃后仍然存在” | 由磁盘或复制存储支持的队列；worker 崩溃时任务不会丢失。 |
| Matrix framework | “完全基于消息传递的 swarm” | 数据流和控制流都是分布式队列上的序列化消息。 |

## 延伸阅读

- [LangGraph workflows and agents — Swarm Architecture](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — 明确支持 swarm
- [Matrix — A Decentralized Framework for Multi-Agent Systems](https://arxiv.org/abs/2511.21686) — 完全基于消息传递的 swarm
- [Anthropic engineering — why supervisor not swarm in Research](https://www.anthropic.com/engineering/multi-agent-research-system) — 一个具体生产系统为何明确选择 supervisor 而非 swarm
- [AutoGen v0.4 actor-model 文档](https://microsoft.github.io/autogen/stable/) — event-driven actor 重写，比 v0.2 的 GroupChat 更接近 swarm
