# OpenAI Agents SDK: Handoffs、Guardrails、Tracing

> OpenAI Agents SDK 是基于 Responses API 构建的轻量级 multi-agent framework。五个 primitives：Agent、Handoff、Guardrail、Session、Tracing。Handoff 是名为 `transfer_to_<agent>` 的 tools。Guardrail 会在 input 或 output 上触发。Tracing 默认开启。

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## 学习目标
- 说出 OpenAI Agents SDK 的五个 primitives。
- 解释 handoffs：为什么它们被建模为 tools、模型看到的 name 形状是什么，以及 context 如何 transfer。
- 区分 input guardrails、output guardrails 和 tool guardrails；解释 `run_in_parallel` 与 blocking mode。
- 用 stdlib 实现一个带有 handoffs + guardrails + span-style tracing 的 runtime。

## 问题
无法干净 delegate 的 agents 最终会把所有内容都塞进一个 prompt。没有 guardrails 的 agents 会交付 PII、违反 policy 的 output，或者永远 loop。OpenAI 的 SDK 将让 multi-agent 工作变得可控的三个 primitives 规范化了。

## 概念
### Five primitives

1. **Agent.** LLM + instructions + tools + handoffs。
2. **Handoff.** delegate 给另一个 agent。对模型表现为一个名为 `transfer_to_<agent_name>` 的 tool。
3. **Guardrail.** 对 input（仅第一个 agent）、output（仅最后一个 agent）或 tool invocation（每个 function tool）进行 validation。
4. **Session.** 跨 turns 的自动 conversation history。
5. **Tracing.** LLM generations、tool calls、handoffs、guardrails 的内置 spans。

### Handoffs as tools

模型会在它的 tool list 中看到 `transfer_to_billing_agent`。调用它会向 runtime 发出信号：

1. 复制 conversation context（或通过 `nest_handoff_history` beta 将其 collapse）。
2. 使用目标 agent 的 instructions 初始化目标 agent。
3. 用目标 agent 继续 run。

这就是产品化的 supervisor pattern（Lesson 13 / Lesson 28）。

### Guardrails

三种类型：

- **Input guardrails.** 在第一个 agent 的 input 上运行。在任何 LLM call 之前拒绝不安全或超出 scope 的 requests。
- **Output guardrails.** 在最后一个 agent 的 output 上运行。捕获 PII leaks、policy violations、malformed responses。
- **Tool guardrails.** 按 function-tool 运行。Validate arguments、检查 permissions、audit execution。

Mode：

- **Parallel**（默认）。Guardrail LLM 与 main LLM 同时运行。更低 tail latency。如果触发，main LLM 的工作会被丢弃（浪费 Token）。
- **Blocking**（`run_in_parallel=False`）。Guardrail LLM 先运行。如果触发，main call 不会浪费 Token。

Tripwires 会抛出 `InputGuardrailTripwireTriggered` / `OutputGuardrailTripwireTriggered`。

### Tracing

默认开启。每次 LLM generation、tool call、handoff 和 guardrail 都会 emit 一个 span。`OPENAI_AGENTS_DISABLE_TRACING=1` 会退出。`add_trace_processor(processor)` 会将 spans fan out 到你自己的 backend，同时也发送到 OpenAI 的 backend。

### Sessions

`Session` 将 conversation history 存储在 backend 中（SQLite、Redis、自定义）。`Runner.run(agent, input, session=session)` 会自动加载并追加。

### 这个模式容易出错的地方

- **Handoff drift.** Agent A hand off 给 Agent B，Agent B 又 hand back 给 Agent A。添加 hop counter。
- **Guardrail bypass.** Tool guardrails 只在 function tools 上触发；内置 tools（file reader、web fetch）需要单独的 policy。
- **Over-tracing.** spans 中包含敏感内容。与 OTel GenAI content-capture rules（Lesson 23）配合使用：外部存储，按 ID 引用。

```figure
ae-agent-handoff
```

## 构建它
`code/main.py` 用 stdlib 实现了 SDK 形状：

- `Agent`、`FunctionTool`、`Handoff`（作为带有 transfer 语义的 function tool）。
- 带 input/output/tool guardrails、handoff dispatch 和 hop counter 的 `Runner`。
- 一个简单的 span emitter，用于展示 trace 形状。
- 一个 triage agent，会根据用户 query hand off 到 billing 或 support；guardrail 会在一个 input 上触发。

运行：

```
python3 code/main.py
```

trace 展示了两个成功的 handoffs、一个 input guardrail trip，以及一棵与真实 SDK emit 内容相对应的 span tree。

## 使用它
- **OpenAI Agents SDK** 用于 OpenAI-first products。
- **Claude Agent SDK**（Lesson 17）用于 Claude-first products。
- **LangGraph**（Lesson 13）用于你想要 explicit state 和 durable resume 的情况。
- **Custom** 用于你需要精确控制（voice、multi-provider、federated deployments）的情况。

## 交付它
`outputs/skill-agents-sdk-scaffold.md` scaffold 一个 Agents SDK app，包含 triage agent、handoffs、input/output/tool guardrails、session store 和 trace processor。

## 练习
1. 添加 handoff hop counter：超过 N 次 transfers 后拒绝。Trace 这个行为。
2. 将 `nest_handoff_history` 实现为一个选项：在 transfer 前将 prior messages collapse 成一个 summary。
3. 编写一个 blocking output guardrail。比较会触发它的 prompts 与通过的 prompts 的 latency。
4. 将 `add_trace_processor` 连接到 JSON logger。它对每个 span emit 什么形状？
5. 阅读 SDK docs。将你的 stdlib toy port 到 `openai-agents-python`。你哪些地方建模错了？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | "LLM + instructions" | SDK 中的 Agent type；拥有 tools 和 handoffs |
| Handoff | "Transfer" | 模型调用以 delegate 给另一个 agent 的 tool |
| Guardrail | "Policy check" | 对 input / output / tool invocation 的 validation |
| Tripwire | "Guardrail trip" | guardrail 拒绝时抛出的 exception |
| Session | "History store" | runs 之间持久化的 conversation memory |
| Tracing | "Spans" | 覆盖 LLM + tool + handoff + guardrail 的内置 observability |
| Blocking guardrail | "Sequential check" | Guardrail 先运行；trip 时不浪费 Token |
| Parallel guardrail | "Concurrent check" | Guardrail 同时运行；latency 更低，trip 时浪费 Token |

## 延伸阅读
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) — primitives、handoffs、guardrails、tracing
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — Claude 风格的 counterpart
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — 何时真正应该使用 handoffs
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — Agents SDK spans 映射到的标准
