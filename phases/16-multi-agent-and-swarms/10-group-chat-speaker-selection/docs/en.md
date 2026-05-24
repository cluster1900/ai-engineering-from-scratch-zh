# Group Chat 和 Speaker Selection

> AutoGen GroupChat 和 AG2 GroupChat 在 N 个 agents 之间共享一个 conversation；一个 selector 函数（LLM、round-robin 或 custom）选择下一个发言者。这是 emergent multi-agent conversation 的原型：agents 并不知道自己在静态 graph 中的角色，它们只是对共享池做出反应。AutoGen v0.2 的 GroupChat 语义在 AG2 fork 中被保留下来；AutoGen v0.4 将其重写为 event-driven actor model。Microsoft 于 2026 年 2 月将 AutoGen 置于维护模式，并将其与 Semantic Kernel 合并为 Microsoft Agent Framework（RC 2026 年 2 月）。GroupChat primitive 在 AG2 和 Microsoft Agent Framework 中都继续存在：学一次，到处用。

**类型：** 学习 + 构建
**语言：** Python (stdlib)
**前置条件：** Phase 16 · 04 (Primitive Model)
**时间：** ~60 分钟

## 问题

当 workflow 已知时，静态 graphs（LangGraph）很好用。真实 conversation 并不是静态的：有时 coder 会问 reviewer，有时会问 researcher，有时会问 writer。硬编码每一种可能的 handoff 会产生 edge 爆炸。你想要的是 *agents 对共享池做出反应*，并由某个函数决定下一个谁说话。

这正是 AutoGen GroupChat 所做的事。

## 概念

### 形状

```
              ┌─── shared pool ────┐
              │   m1  m2  m3  ...  │
              └─────────┬──────────┘
                        │ (everyone reads all)
      ┌───────┬─────────┼─────────┬───────┐
      ▼       ▼         ▼         ▼       ▼
    Agent A  Agent B  Agent C  Agent D  Selector
                                           │
                                           ▼
                                  "next speaker = C"
```

每个 agent 都能看到每条 message。每一轮都会调用一个 selector 函数来选择下一个发言者。

### 三种 selector 风格

**Round-robin。** 固定循环。确定性。按 N 线性扩展，但会忽略上下文：即使话题是法律审查，coder 也会获得轮次。

**LLM-selected。** 调用一个 LLM，它读取最近的池内容并返回最合适的下一个发言者。具备上下文感知能力，但速度慢：每一轮都会增加一次 LLM 调用。AutoGen 的默认方式。

**Custom。** 一个 Python 函数，包含你想要的任何逻辑。典型做法：LLM-selected 加 fallback 规则（例如，“coder 之后总是把轮次交给 verifier”）。

### ConversableAgent API

```
agent = ConversableAgent(
    name="coder",
    system_message="You write Python.",
    llm_config={...},
)
chat = GroupChat(agents=[coder, reviewer, tester], messages=[])
manager = GroupChatManager(groupchat=chat, llm_config={...})
```

`GroupChatManager` 持有 selector。当一个 agent 完成一轮后，manager 会调用 selector，selector 返回下一个 agent。循环持续到满足终止条件。

### 终止

三种常见模式：

- **Max rounds。** 对总轮次数设置硬上限。
- **"TERMINATE" token。** Agents 可以发出一个 sentinel message；manager 在它出现时停止。
- **Goal-reached check。** 一个轻量 verifier 每轮运行一次，并在 chat 完成时停止。

### AutoGen → AG2 分裂，以及 Microsoft Agent Framework 合并

2025 年初，Microsoft 开始围绕 event-driven actor model 对 AutoGen（v0.4）进行重大重写。社区将 AutoGen v0.2 的 GroupChat 语义 fork 为 AG2，保留了早期采用者已经集成的 API。

2026 年 2 月，Microsoft 宣布 AutoGen 将进入维护模式，event-driven actor model 会合并到 **Microsoft Agent Framework**（RC 2026 年 2 月，现在已与 Semantic Kernel 合并）。GroupChat 概念在两条路线中都保留下来；实现细节不同。对于兼容 v0.2 的代码，AG2 是首选 upstream。

### 什么时候适合 GroupChat

- **Emergent conversations。** 你不想预先连好每一个可能的 next-speaker。
- **角色混合任务。** Coder 问 researcher，researcher 问 archivist，archivist 再问回 coder。流程不是 DAG。
- **探索式问题解决。** 想象“头脑风暴会议”，而不是“流水线”。

### 什么时候会失败

- **严格确定性。** LLM selector 可能不一致。同一个 prompt，不同运行，可能得到不同的下一个发言者。
- **Sycophancy cascades。** Agents 会顺从于发言最自信的人。需要显式 counter-prompt。
- **Context bloat。** 每个 agent 都会读取每条 message；10 轮之后 context 会很大。使用 projections（Lesson 15）来限定视图范围。
- **Hot speakers。** 某个 agent 因为 selector 偏好它的专长而主导 conversation。将 speaker balance 作为 selector feature 引入。

### Group chat vs supervisor

相同 primitives，不同默认值：

- Supervisor：一个 agent 规划，其他 agents 执行。Selector 是“问 planner 接下来做什么”。
- Group chat：所有 agents 都是 peers；selector 是一个作用于共享池的函数。

两者都使用 Lesson 04 中的四个 primitives。Group chat 默认使用 LLM-selected orchestration 和 full-pool shared state。

## 构建它

`code/main.py` 用 stdlib 从零实现一个 GroupChat。包含三个 agents（coder、reviewer、manager）、round-robin 和 LLM-selected 变体，以及基于 `TERMINATE` token 的终止。

该 demo 会打印两个变体的 conversation transcript 以及 selector 的 decision trace。

运行：

```
python3 code/main.py
```

## 使用它

`outputs/skill-groupchat-selector.md` 会为给定任务配置 GroupChat selector：round-robin vs LLM-selected vs custom，以及要使用哪些 selector inputs（recent messages、agent specialties、turn counts）。

## 发布它

Checklist：

- **Max rounds cap。** 始终需要。典型任务为 10-20。
- **Speaker-balance metric。** 跟踪每个 agent 的轮次数；当不平衡超过阈值时告警。
- **Termination token。** `TERMINATE` 或专用 verifier agent。
- **Projection 或 scoped memory。** 约 10 条 messages 后，考虑只给每个 agent 一个 scoped view，以防止 context bloat。
- **Selector logging。** 对于 LLM-selected 变体，同时记录 selector 的 input 和 choice。否则无法调试。

## 练习

1. 运行 `code/main.py`。比较 round-robin 与 LLM-selected 下的 conversation。每种方式下哪个 agent 占主导？
2. 在 selector 中加入一条 "max-speaks-per-agent" 规则。它如何影响 transcript？
3. 实现 goal-reached termination：当 reviewer 返回 "approved" 时停止。它在 round cap 之前触发的频率是多少？
4. 阅读 AutoGen stable docs 中关于 GroupChat 的内容（https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html）。识别 `GroupChatManager` 使用的默认 selector。
5. 阅读 AG2 repo（https://github.com/ag2ai/ag2），并将其 v0.2 GroupChat 与 v0.4 event-driven 版本对比。v0.4 增加了什么具体属性（throughput、fault-tolerance、composability）？

## 关键术语

| Term | 人们的说法 | 它实际的含义 |
|------|----------------|------------------------|
| GroupChat | "Agents in one chat room" | Shared message pool + selector function。AutoGen / AG2 primitive。 |
| Speaker selection | "Who talks next" | 选择下一个 agent 的函数。Round-robin、LLM-selected 或 custom。 |
| GroupChatManager | "The meeting host" | 拥有 selector 并循环处理轮次的 AutoGen component。 |
| ConversableAgent | "The base agent" | AutoGen base class；一个可以发送和接收 messages 的 agent。 |
| Termination token | "The 'stop' word" | 结束 chat 的 sentinel string（通常是 `TERMINATE`）。 |
| Hot speaker | "One agent dominates" | selector 不断选择同一个 agent 的 failure mode。 |
| Context bloat | "Pool grows unbounded" | 每个 agent 都读取所有先前 message；context 随轮次增长。 |
| Projection | "Scoped view" | 面向角色的共享池视图，用于防止 context bloat。 |

## 延伸阅读

- [AutoGen group chat docs](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html) — reference implementation
- [AG2 repo](https://github.com/ag2ai/ag2) — 社区延续的 AutoGen v0.2
- [Microsoft Agent Framework docs](https://microsoft.github.io/agent-framework/) — 合并后的继任者，RC 2026 年 2 月
- [AutoGen v0.4 release notes](https://microsoft.github.io/autogen/stable/) — event-driven actor model 重写细节
