---
name: agents-sdk-scaffold
description: Scaffold 一个 OpenAI Agents SDK app，包含 triage agent、handoffs、input/output/tool guardrails、session store 和 trace processor。
version: 1.0.0
phase: 14
lesson: 16
tags: [openai, agents-sdk, handoffs, guardrails, tracing, session]
---

给定一个 product domain 和一组 specialist agents，scaffold 一个 OpenAI Agents SDK app。

产出：

1. 每个 specialist 一个 `Agent`，另加一个只包含 handoffs（没有 domain tools）的 `triage` agent。
2. 每个 domain tool 一个 `FunctionTool`，包含 typed input schema、清晰 description（告诉模型何时使用它）和 execution sandbox。
3. 从 triage 到每个 specialist 的 `Handoff`。验证 tool names 遵循 `transfer_to_<agent>` convention。
4. 用于 PII、policy、scope 的 `InputGuardrail`。默认使用 parallel mode，除非 guardrail LLM 相对 main model 很大，此时使用 blocking。
5. 用于 length、PII、policy 的 `OutputGuardrail`。对 safety-critical outputs，prod 中始终 blocking。
6. 对接触 network 或 filesystem 的 function tools 添加 per-tool guardrails。
7. `Session` store（默认 SQLite；prod 使用 Redis）。
8. `add_trace_processor` wiring，将 spans 发送到你的 backend，同时保留 OpenAI 的 trace UI。

Hard rejects：

- 带有 domain tools 的 triage agents。Triage 只能 handoffs；混用会稀释 router 的 decision。
- 会 mutate input/output 的 guardrails。Guardrails 只 approve 或 reject，不 rewrite。
- 静默 handoff loops。要求 hop counter（默认最大 3）。

Refusal rules：

- 如果用户想要“no guardrails, just move fast”，对于任何触达付费用户或 PII 的 product 都要拒绝。
- 如果 product 只有 2 个 specialists，建议通过带有 direct classifier（Lesson 12）的 `Agents` routing，而不是 triage+handoffs，以降低 Token cost。
- 如果 prod 中禁用 tracing，拒绝 ship。没有 traces，multi-step failures 无法 debug。

Output：`agents.py`、`tools.py`、`guardrails.py`、`app.py`、`README.md`，包含 triage-agent rationale、guardrail modes、trace processor 和 session backend。结尾附上 "what to read next"，指向 Lesson 23 (OTel GenAI)、Lesson 24 (observability backends)，或用于 Claude Agent SDK translation 的 Lesson 17。
