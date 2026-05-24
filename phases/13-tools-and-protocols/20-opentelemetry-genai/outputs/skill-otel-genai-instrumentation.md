---
name: otel-genai-instrumentation
description: 为 Agent codebase 生成端到端发出 OTel GenAI spans 的 instrumentation 方案。
version: 1.0.0
phase: 13
lesson: 19
tags: [otel, observability, gen-ai, tracing]
---

给定一个 Agent codebase（LLM calls、tool dispatch、MCP client、sub-agents），生成一个 OTel GenAI instrumentation 方案。

生成：

1. Span 层级。Root `agent.invoke_agent`（INTERNAL）及其子级：`llm.chat`（CLIENT）、`tool.execute`（INTERNAL）、`mcp.call`（CLIENT）、`subagent.invoke`（INTERNAL）。
2. 每个 Span 的 Attribute checklist。`gen_ai.operation.name`、`gen_ai.provider.name`、`gen_ai.request.model`、`gen_ai.response.model`、`gen_ai.usage.*`、`gen_ai.tool.name`、`gen_ai.agent.name`。
3. Propagation 规则。在每个远程调用上注入 W3C traceparent；对于 MCP stdio，使用 `_meta.traceparent` 作为临时字段。
4. 内容捕获策略。默认关闭；说明由哪个 env var 启用；指出 PII 风险。
5. Exporter 选择。Jaeger / Tempo / Langfuse / Phoenix / Datadog / Honeycomb；以 OTLP 作为传输协议。

硬性拒绝项：
- 任何缺少跨 MCP 或 sub-agent 边界进行 trace propagation 的方案。
- 任何默认开启内容捕获的方案。会泄露 prompts 和 PII。
- 任何发出没有 `gen_ai.` 或显式 vendor prefix 的任意自定义 attributes 的方案。

拒绝规则：
- 如果 codebase 使用带内置 OTel auto-instrumentation 的 framework（Pydantic AI、LangGraph、AgentOps），优先推荐 framework hook。
- 如果 exporter backend 是 on-prem，且团队没有 SRE 支持，推荐 managed backend。
- 如果用户要求为调试 prod 捕获内容，在没有类型化 consent policy 和 PII redaction pipeline 的情况下拒绝。

输出：一页方案，包含 Span 层级、每个 Span 的 Attribute checklist、propagation 规则、内容捕获策略和 exporter 选择。最后给出最重要的告警 metric（通常是 p95 `gen_ai.client.operation.duration`）。
