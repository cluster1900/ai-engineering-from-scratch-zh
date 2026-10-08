# 生产运行时间:排列,事件,时间

> 生产代理运行在六种运行时间形状上:请求响应、流媒体、持久执行、排列基础背景、事件驱动和计划──先选择形状,再选择框架──可观察性 在每个形状中都是负载的──

**类型：**学习 课程
**语言：**字符串 (stdlib)
**先修要求：**阶段14 · 13 (长度图),阶段14 · 22 (声音)
**时间：**时间60分钟

## 学习目标

- 说出六种生产运行时间形状,并将每个形状都匹配到一个框架/产品模式.
- 解释为什么长期执行 (长度图) 对长远任务很重要.
- 描述活动驱动的运行时间以及Claude管理代理 适用的场景.
- 解释多步骤代理 中可观测性作为负载承载 这一说法.

## 问题

产品代理的失败方式,是 Jupyter笔记本 暴露不出来的:第37步出现网络时间,用户在语音电话中 挂,cron工作在机器重启时死亡,后台工人内存耗尽.

## 概念

### 要求-回应

- 交代 HTTP──用户等待完成──
- 只适用于短任务 (短任务)
- 技术:Agno (Python + FastAPI) ‧Mastra (TypeScript + Express/Hono/Fastify/Koa)
- 观察性:标准 HTTP 访问日志 + OTel 跨度──

### 流媒体

- 使用SSE或WebSocket 进行渐进输出.
- 果版将扩展到WebRTC,用于语音/视频.
- 支持流媒体的框架+能处理SSE/WS的前端.
- 观察性:每块的耗时,第一代标记延迟,尾声延迟.

### 持续执行

- 每一步都会检查点状态;失败时自动恢复.
- 机器人4.4演员模型将失败分离到单个代理
- 长度图的核心差异点 (课 13)
- 由于这些问题,我们必须要做好一些.

### 基于队列/背景

- 工作者 通过网关或酒吧/子回流.
- 对于长远的代理是必需的. 每个任务都有几十到几百步,见人类的计算机使用公告.
- 堆:菜 (Python) MQ (节点) SQS + Lambda (AWS) 菜
- 观察性:排列深度,每个工作的延迟分布,DLQ大小.

### 事件驱动

- 代理 订阅触发:新电子邮件,公关开,cron火.
- 克劳德管理代理人 开箱即支持这一点 (课 17)
- 工作人员AI流程 (课 15) 用于组织事件驱动的确定性工作流程.
- 观察性:触发源,事件到启动延迟,代理延迟.

### 时间表

- 周期性运行的时间表形象的代理.
- 通过使用,以此,失败的夜间运行可以在下一次点恢复.
- 技术:Kubernetes CronJob + 持久框架;托管方案(Render cron、Vercel cron) 👇

### 2026部署模式

- **CrewAI Flows**为了实现活动驱动的生产.
- **Agno**无国有FastAPI 用于Python微服务.
- **Mastra**服务器适配器(Express、Hono、Fastify、Koa)用于嵌入──
- **Pipecat Cloud / LiveKit Cloud**通过管理的声音 (教训 22)
- **Claude Managed Agents**用于长期的主机同步.

### 可观测性是承载性

如果没有OpenTelemetry GenAI跨度 (课 23) 以及Langfuse/Phoenix/Opik后台 (课 24) 则你无法调试一个在第40步失败的多步代理――这对生产来说不是可选项――它决定你在快速调试,还是从头部重播并增加更多的登录──

### 失败的位置

- **选错 shape。**为一个 5 分钟任务选择请求-响应.用户挂断.工人堆积.退休 叠加.
- **没有 DLQ。**队员没有死字.失败的工作会消失.
- **不透明的 background work。**经验人员在运行时不导出追踪.直到用户报告问题之前,失败是不可见的.
- **跳过 durable state。**任何超过30秒,你无法承受重启运行,都需要持久的执行.


```figure
wb-runtime-shapes
```

## 构建它

`code/main.py`是一个多形体现:

- 要求-响应终端点 (普通函数)
- 流动处理器 (发器)
- 带DLQ的队列员工──
- 事件触发程序登记器.
- 时间表表

运行:

```bash
python3 code/main.py
```

输出:五条 痕迹,展示同一个任务 在每种形状 下的行为――同一个代理逻辑,不同的外层――可持续执行――第六种形状) 有意放在课13中通过LangGraph检查点 讲解――

## 使用它

- **Request-response**为了聊天式的UX.
- **Streaming**为了进步的反应.
- **Durable**为了长远的任务.
- **Queue**用于批量/同步/长期使用的.
- **Event**用于代理反应性.
- **Cron**为了家庭管理,记忆整合,评估,成本报告.

## 发布它

`outputs/skill-runtime-shape.md`会为一个任务 选择运行时间形状,并连接可观测性要求.

## 练习

1. 让你的课程01 复制循环 移植到你的堆中所有的六种形状――哪种形状 适合哪种产品表面?
2. 给排队的演示 添加DLQ──模拟10%工作失败;暴露DLQ大小──
3. 编写一个 cron-触发的评估代理, 每晚针对当天的前20个追踪运行.
4. 实现带压力的流媒体:如果客户很慢,就暂停代理.
5. 阅读Claude管理代理博士. 你会把自主主持的长视线代理迁移到管理吗?

## 关键术语

| 术语 | 人们怎么说 | 实际含义 |
|------|------------|----------|
| Request-response | “Synchronous” | 用户等待；只适合短任务 |
| Streaming | “SSE / WS” | Progressive output；更好的 UX；每个 chunk 的 latency 可观察 |
| Durable execution | “Resume from failure” | Checkpointed state；从最后一步 restart |
| Queue-based | “Background jobs” | Producer / worker pool / DLQ |
| Event-driven | “Trigger-based” | Agent 对 external event 作出反应 |
| DLQ | “Dead-letter queue” | 失败 job 的停车场 |
| Claude Managed Agents | “Hosted harness” | Anthropic-hosted long-running async，带 caching + compaction |

## 延伸阅读

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)持续执行 细节
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) 托管的长期异步
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use)  每个任务 几十到几百步
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/)演员模型故障隔离
