# 机器人4.0.4:演员模型与代理框架

> 微软研究,2025年1月) 围绕演员模型 重新设计了代理配套――异步信息交换、事件驱动的代理、故障隔离、自然并发──该框架现在处于维护模式,而微软代理框架,2025年10月公开预览) 正成为其继任者──

**类型：**学习 + 构建
**语言：**字符串 (stdlib)
**先修：**阶段14 · 01 (代理循环),阶段14 · 12 (工作流程模式)
**时间：**约75分钟

## 学习目标

- 描述演员模式:代理 作为演员,信息是唯一的IPC,每个演员都是独立隔离故障.
- 描述了AutoGen v0.4的三个API层级:核心,代理聊天,扩展以及各自的用途.
- 解释为什么将消息传递与处理 解会带来故障隔离和自然并发.
- 在Python中实现一个 stdlib演员运行时间,并将一个双代理代码审查流转到其上.

## 问题

大多数代理框架都是一步的:一个代理 产生内容,一个代理 消费内容,运行在一个电话堆中──失败会让堆崩──并发是后来加上──分布式需要重写──

答案是:演员模型――每个代理都是一名拥有私有收件箱的演员――消息是唯一的交互方式――运行时间将交付与处理 解――故障被隔离到单个演员――并发是原生能力――分布式只是一种转运的另一种方式――

## 概念

### 演员

一个演员拥有:

- 没有任何直接接触的外部.
- 一个收件箱 (消息排队)
- 一个处理员:`receive(message) -> effects`其他演员                                                                                                                                                                                                                                                             

两个演员无法分享记忆.

### 汽车代码v0.4 中的三个API层

1. **Core.**低层演员框架.`AgentRuntime`,我知道.`Agent`,我知道.`Message`,我知道.`Topic`△非同步的消息交换,以事件为主.
2. **AgentChat.**面向任务的高层API (替代v0.2的可对话的代理)`AssistantAgent`,我知道.`UserProxyAgent`,我知道.`RoundRobinGroupChat`,我知道.`SelectorGroupChat`,我知道.
3. **Extensions.**集成:开放AI、人类、蓝色、工具、记忆──

### 为什么解答很重要

在 v0.2 模型中,同步调用`agent_a.chat(agent_b)`在4.0中,`send(agent_b, msg)`快速返回. 运行时间 稍后交付.

- **Fault isolation.**机关B 崩不会导致A 崩,运行时间会捕获B的经理中的失败,并决定如何处理(log、retry、dead-letter)
- **自然并发。**很多信息可以同时在路上;演员并发送处理自己的收件箱.
- **面向分布式。**无论演员是正在进行的还是在另一个主机上,收件箱+运输都是一样的抽象.

### 拓

- **RoundRobinGroupChat.**代理以固定轮转顺序轮流发言.
- **SelectorGroupChat.**根据对话背景选择下一位.
- **Magentic-One.**为了使用网页浏览,执行代码,处理文件的参考多代理团队.

### 可观测性

内置支持开放电气. 每个消息都会发出一个跨度;工具调用根据2026年OTel GenAI语义公约 ((23课) 携带`gen_ai.*`属性

### 状态:维护模式

2026年初:AutoGen v0.7.x 对研究和原型设计 来说是稳定的.微软已将积极开发转向微软代理框架.


```figure
actor-mailbox
```

## 构建它

`code/main.py`实现一个幕演员运行时间:

- `Message`带有`sender`,我知道.`recipient`,我知道.`topic`,我知道.`body`类型化有效载荷
- `Actor`带有`receive(message, runtime)`抽象的.
- `Runtime`带有共享队列,交付,故障隔离的事件循环.
- 一个双演员演示:`ReviewerAgent`审查代码`ChecklistAgent`运行检查列表;它们交换信息,直到达成共识.

运行:

```
python3 code/main.py
```

追踪会显示一个演员在传递信息中不会让另一个演员崩的模拟失败,以及它们获得共同判决的过程.

## 使用它

- **AutoGen v0.4/v0.7**设计,设计,设计,设计,设计,设计,设计,设计,设计,设计,设计,设计,设计,设计,设计,设计,设计,设计,设计等.
- **Microsoft Agent Framework**未来路径;同样演员模式思想,刷新后的API──
- **LangGraph swarm topology**通过分享工具交付实现类似模式.
- **Custom actor runtime**您需要特定的运输.

## 交付它

`outputs/skill-actor-runtime.md`作为一个特定的多代理任务 生成一个最小的演员运行时间和一个团队模板 ((RoundRobin或选择器) 

## 练习

1. 加入死字母队列:当处理者抛出异常时,把失败消息停放起来为人工检查. 在你的玩具中,DLQ 多久会被打一次?
2. 实现`SelectorGroupChat`根据对话状态选择谁处理下一条信息──
3. 添加分布式运输:把进程中的队列替换为JSON-over-HTTP服务器,让演员可以运行在独立进程中.
4. 为每条消息 接入一个 OTel 跨度 (或没有操作的替代) 根据23课程发出`gen_ai.agent.name`,我知道.`gen_ai.operation.name`,我知道.
5. 阅读AutoGen v0.4的架构帖子.`autogen_core`你跳过了哪些重要的生产?

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Actor | "Agent" | 私有 state + inbox + handler；没有共享 memory |
| Message | "Event" | 类型化 payload；actor 交互的唯一方式 |
| Inbox | "Mailbox" | 每个 actor 的 pending message queue |
| Runtime | "Agent host" | 路由 message 并隔离失败的 event loop |
| Topic | "Channel" | actor 之间命名的 publish-subscribe route |
| Fault isolation | "Let it crash" | 一个 actor 失败不会让其他 actor 崩溃 |
| RoundRobinGroupChat | "固定轮转 team" | Agent 按顺序轮流行动 |
| SelectorGroupChat | "按 context 路由的 team" | Selector 选择下一位 |
| Magentic-One | "参考 team" | 用于 web + code + files 的 multi-agent squad |

## 延伸阅读

- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/)重新设计 文章
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)图形替代品
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)自动生成默认发射时间
