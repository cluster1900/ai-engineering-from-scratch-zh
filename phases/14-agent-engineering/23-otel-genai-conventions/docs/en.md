# OpenTelemetry GenAI 语义约定

> OpenTelemetry 的 GenAI SIG（2024 年 4 月启动）定义了 Agent telemetry 的标准 schema。Span names、attributes 和 content-capture rules 会在各个 vendors 之间收敛，因此 Agent traces 在 Datadog、Grafana、Jaeger 和 Honeycomb 中表示相同含义。

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 13 (LangGraph), Phase 14 · 24 (Observability Platforms)
**Time:** ~60 分钟

## 学习目标
- 说出 GenAI span categories：model/client、agent、tool。
- 区分 `invoke_agent` CLIENT 与 INTERNAL spans，以及它们各自适用的场景。
- 列出顶层 GenAI attributes：provider name、request model、data-source ID。
- 解释 content-capture contract：opt-in、`OTEL_SEMCONV_STABILITY_OPT_IN`、external-reference recommendation。

## 问题
每个 vendor 都发明自己的 span names。Ops teams 最终要为每个 framework 分别构建 dashboards。OpenTelemetry 的 GenAI SIG 通过定义一个整个生态都对齐的标准来解决这个问题。

## 概念
### Span categories

1. **Model / client spans.** 覆盖原始 LLM calls。由 provider SDKs（Anthropic、OpenAI、Bedrock）和 framework model adapters 发出。
2. **Agent spans.** `create_agent`（构造 agent 时）和 `invoke_agent`（运行 agent 时）。
3. **Tool spans.** 每次 tool invocation 一个；通过 parent-child relation 连接到 agent span。

### Agent span naming

- Span name：如果已命名，则为 `invoke_agent {gen_ai.agent.name}`；fallback 为 `invoke_agent`。
- Span kind：
  - **CLIENT** — 用于 remote agent services（OpenAI Assistants API、Bedrock Agents）。
  - **INTERNAL** — 用于 in-process agent frameworks（LangChain、CrewAI、local ReAct）。

### Key attributes

- `gen_ai.provider.name` — `anthropic`、`openai`、`aws.bedrock`、`google.vertex`。
- `gen_ai.request.model` — model ID。
- `gen_ai.response.model` — 解析后的 model（可能因 routing 而不同于 request）。
- `gen_ai.agent.name` — agent identifier。
- `gen_ai.operation.name` — `chat`、`completion`、`invoke_agent`、`tool_call`。
- `gen_ai.data_source.id` — 用于 RAG：查询了哪个 corpus 或 store。

Anthropic、Azure AI Inference、AWS Bedrock、OpenAI 都有特定于技术的 conventions。

### Content capture

默认规则：instrumentations 默认 SHOULD NOT 捕获 inputs/outputs。Capture 通过以下方式 opt-in：

- `gen_ai.system_instructions`
- `gen_ai.input.messages`
- `gen_ai.output.messages`

推荐的生产模式：将内容存储在外部（S3、你的 log store），在 spans 上记录 references（pointer IDs，而不是 prose）。这是 Lesson 27 的 content-poisoning 防御接入 observability 的方式。

### Stability

截至 2026 年 3 月，大多数 conventions 仍是 experimental。使用以下方式 opt in 到 stable preview：

```
OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental
```

Datadog v1.37+ 会将 GenAI attributes 原生映射到其 LLM Observability schema。其他 backends（Grafana、Honeycomb、Jaeger）支持 raw attributes。

### 这个模式容易出错的地方

- **在 spans 中捕获完整 prompts。** PII、secrets、customer data 会进入 ops 可读取的 traces。应存储在外部。
- **没有 `gen_ai.provider.name`。** attribution 缺失时，multi-provider dashboards 会失效。
- **没有 parent links 的 spans。** 会产生孤立的 tool spans。始终传播 context。
- **没有设置 stability opt-in。** 后端升级时，你的 attributes 可能会被重命名。

## 构建它
`code/main.py` 实现了一个匹配 GenAI conventions 的 stdlib span emitter：

- 带 GenAI attribute schema 的 `Span`。
- 带 `start_span`、nested contexts 的 `Tracer`。
- 一个 scripted agent run，会发出：`create_agent`、`invoke_agent`（INTERNAL）、per-tool spans、用于 LLM calls 的 `chat` spans。
- 一个 content-capture mode，会把 prompts 存储在外部，并在 spans 上记录 IDs。

运行它：

```
python3 code/main.py
```

输出：一棵包含所有必需 GenAI attributes 的 span tree，以及一个显示 opt-in content references 的 "external store"。

## 使用它
- **Datadog LLM Observability**（v1.37+）原生映射 attributes。
- **Langfuse / Phoenix / Opik**（Lesson 24）— auto-instrument 生态。
- **Jaeger / Honeycomb / Grafana Tempo** — raw OTel traces；从 GenAI attributes 构建 dashboards。
- **Self-hosted** — 使用 GenAI processor 运行 OTel Collector。

## 交付它
`outputs/skill-otel-genai.md` 将 OTel GenAI spans 接入现有 agent，并带有 content-capture defaults 和 external-reference storage。

## 练习
1. 使用 `invoke_agent`（INTERNAL）+ per-tool spans instrument 你的 Lesson 01 ReAct loop。发送到一个 Jaeger instance。
2. 在 "references only" mode 中添加 content capture：prompts 写入 SQLite，span attributes 只携带 row IDs。
3. 阅读 `gen_ai.data_source.id` 的 spec。将它接入你的 Lesson 09 Mem0 search。
4. 设置 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，并验证你的 attributes 不会被 collector 重命名。
5. 构建一个 dashboard：仅从 GenAI attributes 看 "哪些 tool errors 与哪些 models 相关"。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GenAI SIG | "OpenTelemetry GenAI group" | 定义 schema 的 OTel working group |
| invoke_agent | "Agent span" | 表示一次 agent run 的 span name |
| CLIENT span | "Remote call" | 调用 remote agent service 的 span |
| INTERNAL span | "In-process" | in-process agent run 的 span |
| gen_ai.provider.name | "Provider" | anthropic / openai / aws.bedrock / google.vertex |
| gen_ai.data_source.id | "RAG source" | retrieval 命中了哪个 corpus/store |
| Content capture | "Prompt logging" | 对 messages 的 opt-in capture；prod 中存储在外部 |
| Stability opt-in | "Preview mode" | 用于固定 experimental conventions 的 env var |

## 延伸阅读
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — 规范
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) — 默认提供 GenAI spans
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) — 内置 OTel spans
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) — W3C trace context 传播
