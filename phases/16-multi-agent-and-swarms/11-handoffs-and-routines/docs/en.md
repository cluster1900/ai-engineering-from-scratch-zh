# Handoffs and Routines — 无状态编排

> OpenAI 的 Swarm（2024 年 10 月）将 multi-agent 编排提炼为两个原语：**routines**（作为 system prompt 的 instructions + tools）和 **handoffs**（返回另一个 Agent 的 tool）。没有状态机，没有 branching DSL——LLM 通过调用正确的 handoff tool 来路由。OpenAI Agents SDK（2025 年 3 月）是其生产级后继者。Swarm 本身仍然是最清晰的概念参考——它的全部源码只有几百行。这个 pattern 传播很快，因为 API 表面大致就是“agent = prompt + tools; handoff = function returning agent”。限制：无状态，因此 memory 是调用方的问题。

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## 问题

每个 multi-agent framework 都希望你学习它的 DSL：LangGraph 的 nodes 和 edges、CrewAI 的 crews 和 tasks、AutoGen 的 GroupChat 和 managers。这些 DSL 是真实的抽象，但它们让事情显得比必要的更重。

Swarm 走向相反方向：使用模型已经具备的 tool-calling 能力。Handoffs 变成 tool calls。Orchestrator 就是当前掌握对话的那个 Agent。状态机隐含在 Agent 的 system prompts 中。

## 概念

### 两个原语

**Routine。** 定义 Agent 角色和可用 tools 的 system prompt。可以把它看作一组有作用域的 instructions：“你是 triage agent；如果用户询问 refunds，就 hand off 给 refund agent。”

**Handoff。** Agent 可以调用的一个 tool，它返回一个新的 Agent object。Swarm runtime 检测到 Agent 返回值，并在下一轮切换 active agent。

```
def transfer_to_refunds():
    return refund_agent  # Swarm sees Agent return → switch active agent

triage_agent = Agent(
    name="triage",
    instructions="Route the user to the right specialist.",
    functions=[transfer_to_refunds, transfer_to_sales, transfer_to_support],
)
```

triage agent 的 system prompt 让它根据用户消息选择正确的 handoff。LLM 的 tool-calling 负责路由。

### 为什么它传播很快

- **API 小。** 只需要学习两个概念。
- **使用模型已经会做的事。** Tool calling 已经在各 providers 中达到生产级。
- **没有状态机负担。** 你不需要描述 graph；Agent 的 prompts 描述它们会 hand off 给谁。

### 无状态取舍

Swarm 在 runs 之间明确是无状态的。Framework 在一次 run 期间保留 message history，但不会持久化任何东西。Memory、连续性、长期运行任务——全都是调用方的问题。

在生产环境中（OpenAI Agents SDK，2025 年 3 月），这是主要变化之一：SDK 添加了内置 session management、guardrails 和 tracing，同时保留 handoff 原语。

### Swarm/handoffs 适合的场景

- **Triage patterns。** 一线 Agent 将用户路由给 specialist。
- **基于技能的 handoffs。** “如果任务需要 code，就 call coder；如果需要 research，就 call researcher。”
- **短而有边界的对话。** Customer support、FAQ-to-ticket、简单 workflows。

### Swarm 吃力的场景

- **带共享 memory 的长 sessions。** Handoffs 会把 conversation state 重置为新 Agent 的 prompt 加 history。没有调用方管理的 memory，就无法在 Agents 之间持久化 state。
- **并行执行。** Handoff 是一次一个——active agent 会切换。Parallelism 需要调用方编排多个 Swarm runs。
- **Audit 和 replay。** 无状态 runs 很难精确 replay；LLM 的 handoff 选择不是确定性的。

### OpenAI Agents SDK（2025 年 3 月）

生产级后继者添加了：

- **Session state。** 跨 runs 的持久 thread。
- **Guardrails。** 输入/输出 validation hooks。
- **Tracing。** 每个 tool call 和 handoff 都会被记录。
- **Handoff filters。** 控制 handoff 时转移哪些上下文。

handoff 原语保留下来；生产可用性围绕它补齐。

### Swarm vs GroupChat

两者都使用 LLM-driven routing，但区别在于**谁选择下一个**：

- GroupChat：由外部的 selector（function 或 LLM）从外部选择下一个 speaker。
- Swarm：当前 Agent 通过调用 handoff tool 选择它的继任者。

Swarm 是“Agent 决定下一步是什么”；GroupChat 是“manager 决定下一步是什么”。Swarm 的决策存在于 active agent 的 tool call 中；GroupChat 的决策存在于 `GroupChatManager` 中。

## 构建它

`code/main.py` 从零实现 Swarm：一个 Agent dataclass、一个 handoff mechanism（tool 返回 Agent），以及一个检测 Agent 切换的 run loop。

Demo：一个 triage agent 会路由到 refund、sales 或 support specialists。每个 specialist 都有自己的 tools。run loop 会打印每次 handoff。

运行：

```
python3 code/main.py
```

## 使用它

`outputs/skill-handoff-designer.md` 为给定任务设计 handoff topology：有哪些 Agents、它们可以调用哪些 handoffs、会转移哪些上下文。

## 发布它

Checklist：

- **Handoff logging。** 每次 handoff 都写入一个 trace event，包含 from-agent、to-agent、context snapshot。
- **上下文转移规则。** 决定 handoff 时移动什么：完整 history（昂贵）、最近 N 条消息，或 summary。
- **Handoff guardrail。** handoff 到具有不同 tool permissions 的 specialist 时必须经过认证——否则 prompt injection 可能强制触发不需要的 handoffs。
- **Loop detection。** 两个 Agents 来回 hand off 是常见失败；用简单的 last-K ring check 检测。
- **Fallback agent。** 如果 handoff target 不存在，fallback 到安全默认值。

## 练习

1. 运行 `code/main.py`，triage 到 refund agent。确认第二轮的 active agent 是 refund。
2. 添加 loop-detection 规则：如果同两个 Agents 已经连续 hand off 3 次，则强制退出。设计 fallback。
3. 阅读 OpenAI Agents SDK docs 中关于 handoff filters 的内容。实现一个“summarize-on-handoff”版本：outgoing agent 在 incoming agent 接管之前，将上下文压缩成 bullet summary。
4. 将 Swarm handoff 与 GroupChatManager selector 对比。哪种 pattern 会让 prompt injection 更严重，为什么？
5. 阅读 Swarm cookbook（https://developers.openai.com/cookbook/examples/orchestrating_agents）。找出 Swarm 做出的一个显式 design decision，并说明 OpenAI Agents SDK 是改变了它还是保留了它。

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| Routine | “Agent prompt” | System prompt + tool list。定义角色和可用 handoffs。 |
| Handoff | “转交给另一个 Agent” | active agent 可以调用的一个 tool，它返回新的 Agent。runtime 会切换 active agent。 |
| Stateless | “runs 之间没有 memory” | Swarm 不持久化任何东西；memory 是调用方的责任。 |
| Active agent | “现在谁在说话” | 当前掌握对话的 Agent。Handoff 会改变它。 |
| Context transfer | “handoff 时移动什么” | incoming agent 能看到哪些 history 的策略：full、last N 或 summarized。 |
| Handoff loop | “Agents 来回 ping-pong” | 两个 Agents 不断 hand back 给对方的失败模式。 |
| OpenAI Agents SDK | “生产级 Swarm” | 2025 年 3 月的后继者；在 handoff 原语之上添加 sessions、guardrails、tracing。 |
| Handoff filter | “转移时的 gate” | SDK feature，用于在 handoff 边界检查和修改上下文。 |

## 延伸阅读

- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) — 参考性阐述
- [OpenAI Swarm repo](https://github.com/openai/swarm) — 原始实现，作为概念参考保留
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) — 带 sessions 和 tracing 的生产级后继者
- [Anthropic handoff-in-Claude notes](https://docs.anthropic.com/en/docs/claude-code) — Claude Code subagents 如何通过 `Task` 使用类似 handoff 的 pattern
