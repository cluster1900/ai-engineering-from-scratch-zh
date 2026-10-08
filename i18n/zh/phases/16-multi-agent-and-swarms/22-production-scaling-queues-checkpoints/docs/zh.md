# 生产扩展  队列 检查点 耐用性

> 需要扩大到数千个发行系统.**durable execution**◎长度图的运行时间 会在每个超级步骤后写入一个由`thread_id`标识的检查点 (默认使用 Postgres);工人 崩会释放租,另一个工人 会接手恢复――代理人可以无限休息,等待人工输入――**MegaAgent**运行一个按代理分分的生产者-消费者队列,包含三种状态 (Idle / Processing / Response) 和两层协调 (组内聊天 +组间管理聊天)**Fiber/async**优于每工作线程:线程 99% 的时间都在空等待代币,而纤维会在 I/O 上协作式让出.**FastAPI + Postgres + nothing else**简单架构比预期走得更远. 本课程将构建一个持久的检查点日志,一个随状态转换的每个代理工作队列,一个异步对线程演示,并落地务实.

**Type:** Learn + Build
**Languages:** Python (stdlib, `asyncio`, `sqlite3`)
**前置要求：**16 · 09 阶段 (并行群网络), 16 · 13 阶段 (共享内存)
**Time:** ~75 minutes

## 问题

一个原型多代理系统在一个笔记本电脑上使用三个代理和一个内存事件循环能正常工作.

- 代理有时会运行数小时.
- 工人进程会崩――重启会失败状态――
- 峰值负载是平均负载的10倍;你需要水平扩展.
- 根据代理运营的用户支付费用;你需要用于计算费用的精确一次性语义.

您需要在底层增加一个持久的执行层.

1. 带检查站的工作流动引擎 (时间,长度图运行时间)
2. 带州商店的消息队列(Postgres + SQS/RabbitMQ)
3. 演员模式框架 (MegaAgent的每代理生产者消费者)
4. 手写 快API + 后生(Bedi 的观点) 』

本课程将构建每种方案的微型版本.

## 概念

### 持续执行,这个模式

持续执行引擎 会在每个"步骤" (长图术语中的超级步骤) 之后持久化完整程序状态――崩时:

```
worker crashes mid-step
  -> lease timeout
  -> another worker picks up the thread_id
  -> resumes from last checkpoint
  -> no duplicate side effects
```

为了让它工作,需要满足:

- **Serializable state。**所有代理状态都必须可持久化. 带有实时数据库连接的功能关闭无法存活.
- **Deterministic resume。**给定相同状态和相同的输入,代理会产生相同的行动,或者将LLM调用 委托给外部的确定性 Oracle.
- **Idempotent side effects。**外部调用 (工具调用,支付) 必须是无效的,或者使用减倍键.

长度图在每个超级步骤后写检查点;暂时在每个活动后写;休息使用事件来源的期刊──三者实现的是同一个模式──

### 兰格拉夫的运行时间

每个代理都有一个.`thread_id`状态是输入的命令;每个超级步骤都向检查点表 写入一行.恢复时,从最后一个检查点 继续,而不是从头开始.`interrupt()`工作时间会持续并释放工人.

这是一个2026年4月的参考生产设计.

### 对于每位代理人来说,MegaAgent的排队

描述一个规模实验:一个集群中有数千个并发代理.

```
agent i:
  state ∈ {Idle, Processing, Response}
  in_queue   <- messages addressed to agent i
  out_queue  -> replies + side effects

coordinators:
  intra-group chat  (agents in the same group)
  inter-group admin chat  (high-level routing)
```

两层协调允许组内对话发生高密度,而组间保持稀疏――这是数千个代理中保持成本线性模式――

### 同比对每项工作的线程

在每一个线程中,需要10GB的光堆.

石`asyncio`,去做日常生活,去`tokio`通过通过网络网络,我们可以通过网络网络网络来实现网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络网络

其他类型的处理器 (如:CPU-bound post-processing,嵌入式,托肯化器,技巧) 仍然需要线程或过程.

### 贝迪的反方观点

据"规模化代理软件" (Ashpreet Bedi,2026) 认为,大多数团队在测量负载之前就过度工程化――务实默认方案是:

- 快速API+毕业后的士
- 每个代理运行是一行;状态使用乐观的同时原地更新.
- 通过`pg_notify`或简单的菜工人 执行背景工作.
- 在应用程序代码中实现重试政策.

对于低于100个并发代理运行任务可控负载,这通常已经足够了.

规则是:当你遇到简单架构无法解决的具体问题时,再采用持久执行框架――过早采用会在没有回报的仪式上浪费时间――

### 精确的语义

对于付费代理运行,你需要"一次有效" (至少一次交付+无权消费者) 工程做法包括:

- **每个 run 一个 dedup key。**在每个副作用调用中包含它.
- **Outbox pattern。**副作用先写入一个表,再由独立过程执行.
- **Compensating transactions。**当副作用成功但跟踪写失败时,安排补偿操作.

这些是数据库工程模式,不是LLM特定的.LLM税只依赖于LLM调用很慢.

### 彩虹部署

人类的多代理研究系统使用"彩虹部署":多个代理运行时间 版本并发行运行,这样长时间运行的代理 不必在每次部署代码时被杀掉;;对一小部分流量加拿大新版本;当旧版本的代理 结束后再淘汰旧版本;;

这就是长期的状态系统的标准做法;2026年适配点是代理可以存活数小时,因此部署周期必须兼容这一点.

### 典型生产检查清单

- 持久状态:查询点,快照,或输出箱+可播放日志.
- 无效的副作用──
- 用于LLM电话的无同步I/O层.
- 带 dedup 的至少一次交付.
- 面向重工作负载的彩虹/加拿大部署――
- 观察性:每位代理的痕迹,超级审计,退休计量器.


```figure
sw-checkpoint-replay
```

## 构建它

`code/main.py`实现了:

- `CheckpointStore` SQLite支持的检查点日志,使用线程ID键──每个超级步骤──添加一行──
- `run_with_checkpoint(agent, thread_id)`模拟中期崩;第二个从最后一个检查点恢复.
- `AgentQueue`每代理                                                                                                                                                                                                                                                             
- `demo_async_vs_threads()` 通过无同步和线程运行 500 个并发模拟"LLM调用";报告墙钟和峰值内存(近似) 』

运行:

```
python3 code/main.py
```

预期输出:模拟崩后检查点恢复成功;async版本 在 < 1s 内处理 500 个并发电话;线程版本 需要几秒钟,并且每个并发单元使用的内存 高出数量级──

## 使用它

`outputs/skill-scaling-advisor.md`根据负载,状态保留,需求和部署频率,建议持续执行,选择:快API+后期,长图运行时间,暂时或定制.

## 发布它

典型生产加固:

- **从简单开始（Bedi 的规则）。**使用快API+后退,直到你测到它失败.
- **在优化之前 instrument everything。**按运行延迟历史图,按步骤时间,反复计数,故障分类.
- **为 side effects 使用 outbox pattern。**特别是支付和外部API调用.
- **Rainbow deploys。**在部署期间永远不要杀死飞行中的代理人.
- **当你遇到具体问题时采用 durable-execution engines（Temporal / LangGraph / Restate）：**经过一个小时的候选人局,跨地区协调,复杂的反试/补偿政策.
- **I/O layer 使用 async。**线程只用于处理后处理.

## 练习

1. 运行`code/main.py`△确认检查点恢复 生效;测量异步与线程同步差异
2. 实现一个**outbox**通过运行两次工具调用来验证无力性.
3. 模拟一个**rainbow deploy**两个并发的运行时间版本;将一半新的线程_ID 路由到各自版本;确认旧版本的飞行线程不会被中断.
4. 阅读下面链接中的LangGraph运行时间文档――识别运行时间 中哪些功能在手写 FastAPI + Postgres 版本中最耗时――这是采用它的理由,还是可以延迟?
5. 阅读MegaAgent (arXiv:2408.09955) 第3节──两层协调──集团内部+集团间管理员聊天) 是显式──画出你会如何将它映射到带两类队列家庭的消息队列──

## 关键术语

| Term | 人们的说法 | 它实际的含义 |
|------|----------------|------------------------|
| Durable execution | "Persist the program state" | Engine 在每个 super-step 后写入 state；crash recovery 是 deterministic 的。 |
| Super-step | "Transactional boundary" | Checkpoints 之间的 work unit。LangGraph 术语。 |
| thread_id | "Agent run identifier" | 绑定 checkpoints 和 resume logic 的 key。 |
| Idempotency | "Safe to retry" | 重复一个 side effect 产生的结果与一次尝试相同。 |
| Outbox pattern | "Decouple side effects" | 将 intent 写入 table；独立 executor 执行并标记完成。 |
| At-least-once delivery | "Possible duplicates" | Message queue semantics；dedup key 让 consumer 达到 effective-once。 |
| Rainbow deploy | "Overlapping versions" | 长时间运行 workloads 期间多个 runtime versions 并发存在。 |
| Async fiber | "Cooperative yielding" | User-mode concurrency；对于 I/O-bound loads，相比 threads 成本很低。 |
| Checkpoint | "State snapshot" | super-step 边界处的 serialized state；是 resume 的 key。 |

## 延伸阅读

- [LangChain — The runtime behind production deep agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) 兰格拉夫运行时间设计
- [MegaAgent](https://arxiv.org/abs/2408.09955)每代理生产者-消费者队列;数千个并发代理 下面的两层协调
- [Matrix](https://arxiv.org/abs/2511.21686) 使用消息队列 作为协调基层的分散框架
- [Temporal docs](https://docs.temporal.io/)耐用执行的参考工作流动引擎
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)包括彩虹部署在内的生产经验
