# OpenTelemetry GenAI — 端到端追踪 Tool Calls

> 一个 agent 调用了五个 tools、三个 MCP servers 和两个 sub-agents。你需要一个贯穿所有环节的 trace。OpenTelemetry GenAI semantic conventions（v1.37 及以上版本中的稳定 attributes）是 2026 年的标准，并由 Datadog、Langfuse、Arize Phoenix、OpenLLMetry 和 AgentOps 原生支持。本课会列出必需 attributes，讲解 span hierarchy（agent → LLM → tool），并提供一个 stdlib span emitter，你可以把它接入任何 OTel exporter。

**Type:** Build
**Languages:** Python (stdlib, OTel span emitter)
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~75 minutes

## 学习目标
- 说出 LLM span 和 tool-execution span 所需的 OTel GenAI attributes。
- 构建覆盖 agent loop、LLM call、tool call 和 MCP client dispatch 的 trace hierarchy。
- 决定要捕获哪些内容（opt-in）以及默认要 redact 哪些内容。
- 在不重写 tool code 的情况下，将 spans 发送到本地 collector（Jaeger、Langfuse）。

## 问题
一个 2026 年 2 月的 debug 案例：用户报告“我的 agent 有时需要 30 秒才响应；其他时候只要 3 秒。”没有 traces。Logs 显示了 LLM call，但没有显示 tool dispatch、MCP server round-trip，也没有显示 sub-agent。你只能猜。最后你发现：某个 MCP server 偶尔会在 cold-start 时卡住。

没有端到端 tracing，你无法定位这个问题。OTel GenAI 解决了它。

这些 conventions 在 2025-2026 年由 OpenTelemetry semantic-conventions group 定型。它们定义了稳定的 attribute names，因此 Datadog、Langfuse、Phoenix、OpenLLMetry 和 AgentOps 都能解析同样的 spans。只需 instrumentation 一次；即可发送到任意 backend。

## 概念
### Span hierarchy

```
agent.invoke_agent  (top, INTERNAL span)
 ├── llm.chat       (CLIENT span)
 ├── tool.execute   (INTERNAL)
 │    └── mcp.call  (CLIENT span)
 ├── llm.chat       (CLIENT span)
 └── subagent.invoke (INTERNAL)
```

整个流程嵌套在同一个 trace id 下。Span ids 连接 parent-child relationships。

### Required attributes

根据 2025-2026 semconv：

- `gen_ai.operation.name` — `"chat"`、`"text_completion"`、`"embeddings"`、`"execute_tool"`、`"invoke_agent"`。
- `gen_ai.provider.name` — `"openai"`、`"anthropic"`、`"google"`、`"azure_openai"`。
- `gen_ai.request.model` — 请求的 model string（例如 `"gpt-4o-2024-08-06"`）。
- `gen_ai.response.model` — 实际提供服务的 model。
- `gen_ai.usage.input_tokens` / `gen_ai.usage.output_tokens`。
- `gen_ai.response.id` — 用于关联的 provider response id。

对于 tool spans：

- `gen_ai.tool.name` — tool identifier。
- `gen_ai.tool.call.id` — 具体的 call id。
- `gen_ai.tool.description` — tool description（可选）。

对于 agent spans：

- `gen_ai.agent.name` / `gen_ai.agent.id` / `gen_ai.agent.description`。

### Span kinds

- `SpanKind.CLIENT` 用于跨越 process boundary 的调用（LLM provider、MCP server）。
- `SpanKind.INTERNAL` 用于 agent 自身的 loop steps 和 tool execution。

### Opt-in content capture

默认情况下，spans 携带 metrics 和 timing，而不是 prompts 或 completions。大型 payloads 和 PII 默认关闭。设置 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` 以及特定的 content-capture env vars 来包含内容。在 prod 中启用前请仔细审查。

### Events on spans

Token-level events 可以作为 span events 添加：

- `gen_ai.content.prompt` — input messages。
- `gen_ai.content.completion` — output messages。
- `gen_ai.content.tool_call` — 记录下来的 tool call。

Events 在一个 span 内按时间排序，便于详细 replay。

### Exporters

OTel spans 可以导出到：

- **Jaeger / Tempo.** OSS，on-prem。
- **Langfuse.** 面向 LLM observability；可视化 token usage。
- **Arize Phoenix.** Evals + tracing 结合。
- **Datadog.** 商业产品；原生解析 `gen_ai.*` attributes。
- **Honeycomb.** Column-oriented；便于查询。

它们都使用 OTLP，也就是 wire format。你的代码无需关心。

### Propagation across MCP

当 MCP client 调用 server 时，把 W3C traceparent header 注入请求。Streamable HTTP 支持标准 headers。Stdio 不原生携带 HTTP headers；该 spec 的 2026 roadmap 讨论了在 JSON-RPC calls 上添加 `_meta.traceparent` 字段。

在它发布之前：手动在每个 request 的 `_meta` 中包含 traceparent。Server 记录 trace id。

### Metrics

除了 spans，GenAI semconv 还定义了 metrics：

- `gen_ai.client.token.usage` — histogram。
- `gen_ai.client.operation.duration` — histogram。
- `gen_ai.tool.execution.duration` — histogram。

将这些用于不需要 per-call detail 的 dashboards。

### AgentOps layer

AgentOps（成立于 2024 年）专注于 GenAI observability。它封装了流行 frameworks（LangGraph、Pydantic AI、CrewAI），自动发送 OTel spans。如果你的 stack 使用受支持的 framework，它很有用；否则使用 manual instrumentation。

## 使用它
`code/main.py` 会把 OTel-shaped spans 发送到 stdout（采用类似 OTLP-JSON 的格式），用于一个调用 LLM、dispatch 两个 tools，并进行一次 MCP round-trip 的 agent。没有真实 exporter——本课聚焦于 span shape 和 attribute set。把输出粘贴到 OTLP-compatible viewer 中，或者直接阅读它。

需要关注的点：

- 所有 spans 共享同一个 trace id。
- Parent-child links 通过 `parentSpanId` 编码。
- 必需的 `gen_ai.*` attributes 已填充。
- Content capture 默认关闭；其中一个场景会通过 env var 打开它。

## 交付它
本课会产出 `outputs/skill-otel-genai-instrumentation.md`。给定一个 agent codebase，该 skill 会生成一份 instrumentation plan：在哪里添加 spans、填充哪些 attributes，以及目标 exporters 是哪些。

## 练习
1. 运行 `code/main.py`。统计 spans 数量，并识别哪些是 CLIENT，哪些是 INTERNAL。

2. 打开 content capture（env var），确认出现 `gen_ai.content.prompt` 和 `gen_ai.content.completion` events。注意这对 PII 的影响。

3. 添加 tool-execution metric `gen_ai.tool.execution.duration`，并按每次 call 将其作为 histogram sample 发送。

4. 将 traceparent 从 parent agent span 传播到 MCP request 的 `_meta.traceparent` 字段。验证 MCP server 会看到相同的 trace id。

5. 阅读 OTel GenAI semconv spec。找出一个 semconv 中列出但本课代码没有发送的 attribute。添加它。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OTel | "OpenTelemetry" | 用于 traces、metrics、logs 的开放标准 |
| GenAI semconv | "GenAI semantic conventions" | LLM / tool / agent spans 的稳定 attribute names |
| `gen_ai.*` | "The attribute namespace" | 所有 GenAI attributes 都共享此前缀 |
| Span | "Timed operation" | 一个具有 start、end 和 attributes 的 work unit |
| Trace | "Cross-span ancestry" | 共享同一个 trace id 的 spans 树 |
| SpanKind | "CLIENT / SERVER / INTERNAL" | 关于 span direction 的提示 |
| OTLP | "OpenTelemetry Line Protocol" | exporters 使用的 wire format |
| Opt-in content | "Prompt / completion capture" | 默认关闭；通过 env var 启用 |
| traceparent | "W3C header" | 跨 services 传播 trace context |
| Exporter | "Backend-specific shipper" | 将 spans 发送到 Jaeger / Datadog / 等的组件 |

## 延伸阅读
- [OpenTelemetry — GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — GenAI spans、metrics 和 events 的权威 conventions
- [OpenTelemetry — GenAI spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/) — LLM 和 tool-execution span attribute 列表
- [OpenTelemetry — GenAI agent spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/) — agent-level `invoke_agent` span
- [open-telemetry/semantic-conventions — GenAI spans](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/gen-ai/gen-ai-spans.md) — GitHub 托管的权威来源
- [Datadog — LLM OTel semantic convention](https://www.datadoghq.com/blog/llm-otel-semantic-convention/) — production integration 讲解
