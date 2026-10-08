# 并行/集群/网络架构

> 与监管者对比:没有中央决定者――代理人 读取共享事件巴士,异步领取工作,并写回结果――长图 明确支持面向去中心化、动态环境的"群众架构"――矩阵 (arXiv:2511.21686) 将控制流和数据流都表示通过分布式排列传递串联信息,以消除主管 瓶──权衡很明确:使用确定性和可追溯性 改变可扩展性――群众 适合包含许多独立子任务;不适合需要单连贯计划的任务――

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`, `queue`)
**前置要求：**监管者模式 (第16期)
**Time:** ~75 minutes

## 问题
监督员可以扩展到少数工人. 监督员本身将成为一个瓶:谁做什么的每一个决定都必须通过一个代理人.

群众架构反转了这个设计――不是由中央规划者分发工作,而是从共享队列中领取工作――"协调"被内置在事件巴士语义中――没有管弦;系统会一直扩展,直到队列成为限制――

## 概念
### 形状

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

没有管弦乐器──每个工人 反复执行:拉取一个任务,处理,写入结果(并可选地排列后续)──

### 当群众相应时

- **许多独立 tasks。**除,转化,分类,任务不依赖于彼此.
- **可变时长的工作。**如果有些任务需要100ms,而其他需要10ms,群体会自动平衡负载 快速工人会拉取后续工作.
- **Throughput 优先于 determinism。**你关心的是总完成时间,而不是严格的订单.

### 当群众失败时

- **有序 workflows。**如果步骤3需要步骤2的输出,群体可能让步骤3在步骤2完成前触发.
- **Global-plan tasks。**复杂的研究问题受益于规划者――一个研究人员群集会产出独立的事实,而不是连贯报告――
- **Debugging。**没有中央记录 且工作 异步时,复现错误 成本很高.

### 矩阵 (arXiv:2511.21686)

矩阵是2025年的一篇论文,它将涌现 推向自然结论:控制流和数据流都在分布式排列上串行信息――没有中央协调员――错误容忍来自信息耐用性――可扩展性是信息经纪人的问题,而不是系统的问题――

贡献:一种编程模式,其中多代理协调是这个代理订阅哪个消息主题?,而不是监督者 下一步选择哪个代理? 这让系统看起来像一个公寓/子活动网──

### 兰格拉夫的群众建筑

长图 2025 文档 明确将"群众架构"描述为多代理模式 之一:代理是节点,但边缘形成带周期的导向图,并且任何节点都可以从池中被激活.

### 失效模式:饥饿和热点

如果所有工人都能完成最快的任务, 长期的任务直到剩下的时间才会得到.

减轻:
- 带显式老龄化的优先排队 随着等待时间提高优先)
- 工人专业化:一些工人只接受"长时间"的任务.
- 逆压:限制进入队列的快速任务 数量――

### 基于内容的路由链接

专业人员只订阅自己的类型――这是可以扩展到数千个代理的消息巴士架构的基础――


```figure
sw-work-stealing
```

## 构建它
`code/main.py`实现一个由4个工人线程组成的群众,它们从共享中`queue.Queue`中拉取任务──任务 具有可变的持续时间(有些快,有些慢)──该演示对比:

- **Sequential baseline:**一个工人处理所有任务.
- **Fixed assignment:**每个任务都预先分配给特定的员工 (监督员类型)
- **Swarm:**工人从共享队列中拉取.

群集会自动平衡负载;固定任务会在某个分配任务中 很慢时让快速的工人 置.

运行:

```
python3 code/main.py
```

产量 会显示每个工人的任务数量,

## 使用它
`outputs/skill-swarm-fit.md`评估一个任务 应该使用群群 还是监督者──输入:任务独立性、时间变异、订单要求、可调试性需求──

## 交付它
检查列表:

- **带 aging 的 Priority queue。**防止长期的饥饿.
- **Worker idempotency。**如果工人在中期条,一个任务可能会被多次拉取.
- **Durable queue。**生产环境使用卡夫卡、Redis流或数据库支持的队列──`queue.Queue`只有内存中.
- **每个 task 的 observability。**每个任务都有一个标记,每个员工都用它记录开始/结束.
- **Back-pressure。**如果排队的速度快于工人排水,

## 练习
1. 运行`code/main.py`在变量时间工作负载上,积比连续的快多少?比固定的任务快多少?
2. 添加一个优先排列变量(使用 `queue.PriorityQueue`按任务的"重要"字段 分配优先级.
3. 实现热点检测器:当任何工人处理任务 数量达到最慢工人的3×时记录日志.
4. 阅读矩阵论文 (arXiv:2511.21686) 的摘要 和 第3节──识别矩阵 接受一个具体的交易缩性获益) 以及放弃一个交易溯性、确定性)──
5. 将群体演示 改为使用由 (任务类型,有效载荷) 双组 组成 `queue.Queue`工作者只订阅特定类型. 当任务构建时,哪些路由规则是合理的?

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
- [LangGraph workflows and agents — Swarm Architecture](https://docs.langchain.com/oss/python/langgraph/workflows-agents) 明确支持群群
- [Matrix — A Decentralized Framework for Multi-Agent Systems](https://arxiv.org/abs/2511.21686) 完整的传递信息群
- [Anthropic engineering — why supervisor not swarm in Research](https://www.anthropic.com/engineering/multi-agent-research-system)什么是一个具体的生产系统 明确选择监督者而不是群众
- [AutoGen v0.4 actor-model docs](https://microsoft.github.io/autogen/stable/)事件驱动演员重写,比 v0.2 的群体聊天更接近群众
