# Group Chat 与 Speaker Selection

> 共享对话编排将 N 个 Agent 放入同一场对话；selector function（LLM、round-robin 或自定义函数）决定下一个发言者。这是涌现式 Multi-Agent 对话的典型形式：Agent 并不知道自己在静态图中的角色，只会对共享消息池作出反应。AutoGen GroupChat 和 AG2 GroupChat 是参考实现：AutoGen v0.2 的 GroupChat 语义保留在 AG2 fork 中；AutoGen v0.4 则将其重写为 event-driven actor model。Microsoft 于 2026 年 2 月将 AutoGen 转入维护模式，并将其与 Semantic Kernel 合并为 Microsoft Agent Framework（2026 年 2 月发布 RC）。GroupChat primitive 在 AG2 和 Microsoft Agent Framework 中都得以保留：学习一次，即可随处使用。

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 分钟

## 问题

当工作流已知时，静态图（LangGraph）非常适用。但真实对话并不是静态的：有时 coder 会询问 reviewer，有时询问 researcher，有时询问 writer。对所有可能的 handoff 进行硬编码会导致边数量爆炸。你需要的是*让 Agent 对共享消息池作出反应*，并由某个函数决定接下来由谁发言。

这正是 AutoGen GroupChat 所做的事情。

## 概念

### 结构

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

每个 Agent 都能看到每条消息。系统会在每一轮调用 selector function，选择接下来的发言者。

### 三种 selector 类型

**Round-robin。** 固定循环。具有确定性。复杂度随 N 线性增长，但会忽略 Context：即使当前主题是法律审阅，也会轮到 coder 发言。

**LLM-selected。** 调用 LLM 读取最近的消息池，并返回最合适的下一位发言者。能够感知 Context，但速度较慢：每一轮都会增加一次 LLM 调用。这是 AutoGen 的默认方式。

**Custom。** 包含任意所需逻辑的 Python 函数。典型做法是采用 LLM-selected 并添加回退规则（例如：“coder 发言后，始终让 verifier 获得下一轮发言机会”）。

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

`GroupChatManager` 持有 selector。当一个 Agent 完成一轮发言后，manager 会调用 selector，由 selector 返回下一个 Agent。循环会持续到满足终止条件为止。

### 终止

三种常见模式：

- **最大轮数。** 对总轮数设置硬上限。
- **`"TERMINATE"` Token。** Agent 可以发出一条 sentinel 消息；manager 检测到它时会停止。
- **目标达成检查。** 每轮运行一个轻量级 verifier，并在对话完成目标时将其停止。

### 演进历程：fork 与合并

2025 年初，Microsoft 开始围绕 event-driven actor model 对 AutoGen 进行大规模重写（v0.4）。社区将 AutoGen v0.2 的 GroupChat 语义 fork 为 AG2，保留早期采用者已经集成的 API。

2026 年 2 月，Microsoft 宣布 AutoGen 将转入维护模式，其 event-driven actor model 会并入 **Microsoft Agent Framework**（2026 年 2 月发布 RC，现已与 Semantic Kernel 合并）。GroupChat 概念在两个分支中均得到保留，但实现细节有所不同。对于兼容 v0.2 的代码，AG2 是首选 upstream。

### GroupChat 的适用场景

- **涌现式对话。** 你不希望预先连接所有可能的下一位发言者。
- **角色混合型任务。** Coder 询问 researcher，researcher 询问 archivist，archivist 再询问 coder。流程不是 DAG。
- **探索式问题求解。** 把它想象成“头脑风暴会议”，而不是“流水线”。

### 失效场景

- **严格确定性。** LLM selector 可能表现不一致。相同 Prompt 在不同运行中可能选择不同的下一位发言者。
- **Sycophancy 级联。** Agent 会顺从表达最自信的发言者。需要使用 Prompt 明确抵消这种倾向。
- **Context 膨胀。** 每个 Agent 都会读取每条消息；经过 10 轮后，Context 会变得非常庞大。使用 projection（Lesson 15）限定各自的视图范围。
- **Hot speaker。** 由于 selector 偏爱某个 Agent 的专业能力，该 Agent 会主导整个对话。将发言平衡作为 selector 的一项 Feature。

### Group chat 与 supervisor

它们使用相同的 primitive，但默认方式不同：

- Supervisor：一个 Agent 负责规划，其他 Agent 负责执行。Selector 的逻辑是“询问规划者下一步该做什么”。
- Group chat：所有 Agent 地位平等；selector 是一个作用于共享消息池的函数。

两者都使用 Lesson 04 中的四种 primitive。Group chat 默认使用 LLM-selected 编排和完整消息池共享状态。

```figure
swarm-speaker
```

## 动手构建

`code/main.py` 使用 stdlib 从零实现 GroupChat。它包含三个 Agent（coder、reviewer、manager）、round-robin 和 LLM-selected 两种变体，并在出现 `TERMINATE` Token 时终止。

Demo 会输出两种变体的对话记录，以及 selector 的决策轨迹。

运行：

```
python3 code/main.py
```

## 实际使用

`outputs/skill-groupchat-selector.md` 为给定任务配置 GroupChat selector：选择 round-robin、LLM-selected 或 custom，并确定要使用哪些 selector 输入（最近的消息、Agent 专长、发言次数）。

## 交付上线

检查清单：

- **最大轮数上限。** 始终设置。典型任务通常为 10 至 20 轮。
- **发言者平衡指标。** 跟踪每个 Agent 的发言轮数；当不平衡程度超过阈值时发出警报。
- **终止 Token。** 使用 `TERMINATE` 或专门的 verifier Agent。
- **Projection 或限定范围的 memory。** 超过约 10 条消息后，考虑只向每个 Agent 提供限定范围的视图，以防止 Context 膨胀。
- **Selector 日志。** 对于 LLM-selected 变体，同时记录 selector 的输入和选择结果。否则无法进行调试。

## 练习

1. 运行 `code/main.py`。对比 round-robin 与 LLM-selected 下的对话。每种方式下由哪个 Agent 主导？
2. 在 selector 中添加“每个 Agent 的最大发言次数”规则。它会如何影响对话记录？
3. 实现目标达成终止条件：当 reviewer 返回 `"approved"` 时停止。它有多大概率在达到轮数上限前触发？
4. 阅读 AutoGen stable 文档中关于 GroupChat 的内容（https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html）。找出 `GroupChatManager` 使用的默认 selector。
5. 阅读 AG2 repo（https://github.com/ag2ai/ag2），并对比其 v0.2 GroupChat 与 v0.4 event-driven 版本。v0.4 增加了哪项具体属性（吞吐量、容错性、可组合性）？

## 关键术语

| 术语 | 人们通常怎么说 | 实际含义 |
|------|----------------|------------------------|
| GroupChat | “同一个聊天室中的 Agent” | 共享消息池 + selector function。AutoGen / AG2 primitive。 |
| Speaker selection | “接下来谁发言” | 选择下一个 Agent 的函数。可以是 round-robin、LLM-selected 或 custom。 |
| GroupChatManager | “会议主持人” | 持有 selector 并循环推进各轮对话的 AutoGen 组件。 |
| ConversableAgent | “基础 Agent” | AutoGen 基类；可以发送和接收消息的 Agent。 |
| Termination token | “表示停止的词” | 用于结束对话的 sentinel 字符串（通常为 `TERMINATE`）。 |
| Hot speaker | “一个 Agent 主导对话” | Selector 不断选择同一个 Agent 的失效模式。 |
| Context bloat | “消息池无限增长” | 每个 Agent 都会读取之前的每条消息；Context 随轮数增长。 |
| Projection | “限定范围的视图” | 面向特定角色的共享消息池视图，用于防止 Context 膨胀。 |

## 延伸阅读

- [AutoGen group chat 文档](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html) — 参考实现
- [AG2 repo](https://github.com/ag2ai/ag2) — 社区延续的 AutoGen v0.2
- [Microsoft Agent Framework 文档](https://learn.microsoft.com/en-us/agent-framework/) — 合并后的后继项目，2026 年 2 月发布 RC
- [AutoGen v0.4 release notes](https://microsoft.github.io/autogen/stable/) — event-driven actor model 的重写细节
