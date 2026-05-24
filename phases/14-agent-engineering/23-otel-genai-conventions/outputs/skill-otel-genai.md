---
name: otel-genai
description: 使用 OpenTelemetry GenAI semantic conventions 为 agent 插桩 — 包含带有正确 attributes 和 opt-in 内容捕获的 invoke_agent、chat、tool_call spans。
version: 1.0.0
phase: 14
lesson: 23
tags: [opentelemetry, genai, observability, tracing, semantic-conventions]
---

给定一个 agent runtime，接入 OTel GenAI semantic conventions。

产出：

1. 每次 agent run 一个 `invoke_agent` span。远程 agent services 使用 Kind CLIENT，进程内使用 INTERNAL。Name：`invoke_agent {gen_ai.agent.name}`。
2. 每次 LLM 调用一个 `chat` span，包含 `gen_ai.operation.name=chat`、`gen_ai.provider.name`、`gen_ai.request.model`、`gen_ai.response.model`。
3. 每次 tool invocation 一个 `tool_call` span，包含 `gen_ai.tool.name`，并在适用时包含 `gen_ai.data_source.id`（RAG corpus / memory store）。
4. Opt-in 内容捕获：默认 OFF；当 ON 时，将 inputs/outputs 存储在外部，并在 spans 上记录 `*.reference_id`。
5. Context propagation：使用 W3C trace context headers，让多进程运行（Claude Agent SDK CLI subprocess）拼接到同一个 trace 中。

硬性拒绝：

- 默认以内联方式捕获完整 prompts/outputs。存在 PII 和 secret 泄漏风险；也违反 spec。
- 缺少 `gen_ai.provider.name`。多 provider dashboards 会失效。
- 孤立的 tool spans。始终通过 active context 设置 parent-child relation。

拒绝规则：

- 如果 runtime 无法跨进程边界传播 context，则拒绝。Claude Agent SDK + CLI 用户需要多进程 trace stitching。
- 如果产品有监管约束（HIPAA、GDPR），则拒绝 inline content capture。只能使用带 access control 的 external store。
- 如果 backend 没有设置 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，则警告：collector upgrade 后 attribute names 可能变化。

输出：`tracer.py`、`attributes.py`、`content_store.py`、`README.md`，说明 span structure、stability opt-in 和 content-capture policy。最后以 "what to read next" 结尾，指向 Lesson 24（backends: Langfuse, Phoenix, Opik）或 Lesson 17（Claude Agent SDK trace-context propagation）。
