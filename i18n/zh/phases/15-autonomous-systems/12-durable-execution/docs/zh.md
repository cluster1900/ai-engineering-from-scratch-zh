# 长时间运行的后台 代理:持久化执行

> 生产阶级长周期 代理 不会运行`while True`中──每次LLM调用都将成为一个带有检查点、退休和重播的活动──暂时的OpenAI代理SDK 集成已于2026年3月 GA──Claude Code 程序 (人类) 可以运行定时的Claude Code 调用,不需要持续的本地进程──会议会在等待人工输入暂停,能在部署后继续存在,并从`thread_id`为关键的最新检查点 恢复. 新的易用性背后,是一种旧模式. 工作流量 编排. 只是一个新的输入.

**Type:** Learn
**Languages:** Python (stdlib, minimal durable-execution state machine)
**先修要求：**阶段15·10 (许可模式),阶段15·01 (长视线剂)
**Time:** ~60 minutes

## 问题

设想一个运行四小时的代理. 它调用三个工具,两个提示用户,并进行四十次的 LLM调用.

- 在朴素的`while True`循环中:一切都会丢失――从头开始就跑了――三次工具调用 (带有真实副作用) 将再次执行――用户会再次被要求批准已经批准的事项――四十次 LLM 调用会被重新计费――
- 使用持久化执行:从最近的检查点运行会恢复.已完成的活动不会再执行;它们的结果将从持久化日志中重复执行.用户不需要再次批准已批准的项目.已完成的LLM调用不会再计费.

这就是10年来一直在交付的工作流动引擎模式. 新变化是LLM,现在也成为一种活动不确定性昂贵带有副作用,并且它们很自然地适应这种模式.

本课的主线是:长周期可靠性会衰退(METR 观察到35分钟的退化成功率大致随周期呈二次下降) 持久化执行让运行可以超过可靠性曲线所支持的时间长;如果设计正确,这是一个新的安全失败方式,如果设计错误,则会以不安全的方式失败;;

## 概念

### 活动,工作流程和重播

- **Workflow**确定性的编排代码――定义活动的顺序、分支和等待――它必须是确定性的,以便从事件日志中重复,而不会出现意外分歧――
- **Activity**作为一个非确定性、可能失败的工作单元──LLM电话、工具电话、文件写字、HTTP请求──每个活动都会连接其输入,以及完成后的输出,一起被记录──
- **Event log**工作流程的每一个决定都会被记录下来.
- **Replay**恢复时,工作流程代码将从头开始运行;每一个已完成的活动都将返回已记录的结果,而不会再执行.

这与 React 针对虚拟DOM重新染,或 Git 从重建工作树的形状相同.

### 为什么 LLM 调用适合这种模式

调用 LLM具有以下特点:
- 不确定性:温度 > 0;即使温度 0 也会因模型版本变化而漂移)
- 昂贵(成本和延迟)
- 可能失败了.
- 带有副作用,如果它们使用工具.

这就是活动的典型图像. 每次调用装为活动,可以获得复试,跨重启检查,以及可重复调试的痕迹.

### 以 `thread_id`为关键的检查点

长度图,微软代理框架,云耐用物体和克劳德代码程序都收到了相同的API形态:一个`thread_id`(或等价物) 标识会话;每次状态过渡都持久化到后端(PostgreSQL默认,SQLite 用于 dev,Redis 用于缓存);resume 会读取最新检查点。

后端选择很重要:

- **PostgreSQL**长度图的默认选择.
- **SQLite**仅用于本地开发;跨主机会丢失数据――
- **Redis**速度快,但如果未配置AOF/快照则是临时性的.
- **Cloudflare Durable Objects**透明分布式;由唯一关键 限范围;可存活数小时到数周.

### 人工输入作为一等状态

建议后承诺 (课 15) 需要持续的待在人类状态下. 工作流动暂停,外部队列保存, 保留等待请求,批准会从精确位置恢复执行.

### 35分钟的降解

测量器观察到,所有被测量的代理类别在连续运行超过35分钟后都会出现可靠性衰退.任务时间长度翻倍,失败率大致变为四倍.持久性执行不会修复这一点;它只是让你能够运行超过可靠性曲线支持的时间长度.安全模式是将耐久性与重入时需要新的HITL检查点结合,并无论配合预算杀开关,都不管如何限制总计算.

### 什么时候持久执行不是正确的答案

- 运行时间短于几分钟,没有人工输入.
- 严格只读的信息检查.
- 正确性要求在一个文本窗口内端到端完成的任务 (某些推理任务;某些一次性生成任务)


```figure
memory-consolidation
```

## 使用它

`code/main.py`使用Stdlib Python 实现最小持久化执行引擎.

- `@activity`装饰器将输入和输出记录到JSON事件日志.
- 一个用于排列活动 顺序的工作流函数──
- 一个`run_or_replay(workflow, event_log)`功能,可以重复完成的活动,而不再执行它们.

驾驶员会模拟一个三活动的工作流程,在中途崩,并展示 (a) 简单重复尝试会重新执行所有内容,而 (b) 重播只运行缺失的活动──

## 交付它

`outputs/skill-durable-execution-review.md`会审查拟议的长时间运行 署是否具有正确的持久化执行形式:活动,确定性,检查点后台,人输入状态以及HITL在恢复政策

## 练习

1. 运行`code/main.py`〔观察简单的重试与重播 之间 活动 执行次数的差异──修改崩点,并显示重播数 会相应变化──

2. 将玩具机器 改为显式使用`thread_id`模拟两个共享相同引擎的发射会议,并确认它们的事件日志 不会冲突.

3. 在玩具机中选择一个活动――引入一个非决定性行为――工作流决定中壁表时刻标志――演示重播时的分歧――解释真机如何处理这一点――副作用注册――`Workflow.now()`通过"

4. 阅读 长链的  运行时间背后的生产深度代理 文章──列出运行时间 持久化的每种状态,并说明每种覆盖了哪种失败模式──

5. 为了一个6小时的自主编码任务 设计检查点政策. 你会在哪个检查点?

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|---|---|---|
| Workflow | “Agent 的脚本” | 确定性编排代码；可从 event log replay |
| Activity | “一个步骤” | 非确定性单元（LLM call、tool call）；执行前后都会被记录 |
| Event log | “backing store” | 每一次 state transition 的持久化记录 |
| Replay | “恢复” | 重新运行 Workflow；已完成 Activities 返回已记录结果，不重新执行 |
| Checkpoint | “保存点” | 以 thread_id 为 key 的持久化 state；resume 时最新状态胜出 |
| thread_id | “Session key” | 用来限定 durable state 范围的 identifier |
| 35-minute degradation | “可靠性衰减” | METR：成功率随周期大约呈二次下降 |
| Non-determinism | “replay 漂移” | Wall clock、random、LLM output；必须注册为 side effect |

## 延伸阅读

- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop)预算,轮回与简历
- [Microsoft — Agent Framework: human-in-the-loop and checkpointing](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) 要求信息事件形态
- [LangChain — The Runtime Behind Production Deep Agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) 具体运行时间要求――
- [OpenAI Agents SDK + Temporal integration (Trigger.dev announcement)](https://trigger.dev) LLM 调用活动 形态。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy)35分钟的降解 参考――
