# LLM Routing Layer — LiteLLM, OpenRouter, Portkey

> Provider lock-in 代价高昂。不同的 tool-calling 工作负载适合不同模型。Routing gateway 提供统一的 API 表面、重试、failover、成本跟踪和 guardrails。2026 年有三种主流形态：LiteLLM（开源、自托管）、OpenRouter（托管 SaaS）、Portkey（生产级，2026 年 3 月开源）。本课会说明决策标准，并演示一个 stdlib routing gateway。

**Type:** Learn
**Languages:** Python (stdlib, routing + failover + cost tracker)
**Prerequisites:** Phase 13 · 02 (function calling), Phase 13 · 17 (gateways)
**Time:** ~45 分钟

## 学习目标
- 区分自托管、托管和生产级 routing 选项。
- 实现一个 fallback chain，在 provider 失败时按定义好的优先级顺序重试。
- 跟踪跨 provider 的单次请求成本和 Token 使用量。
- 针对给定生产约束，在 LiteLLM、OpenRouter 和 Portkey 之间做出选择。

## 问题
Provider routing 重要的场景：

1. **成本。** Claude Sonnet 的成本是 Haiku 的 3 倍。对于 triage 任务，Haiku 足够；对于 synthesis 任务，Sonnet 值得。按请求路由。

2. **Failover。** OpenAI 出现一小时故障。每个请求都失败。你希望自动 fallback 到 Anthropic，而无需重新部署。

3. **延迟。** 实时聊天 UI 需要快速的 time-to-first-token。批量摘要器不需要。按 latency SLA 路由。

4. **合规。** EU 用户必须留在 EU 区域内。按区域路由。

5. **实验。** 在同一工作负载上对两个模型做 A/B。按测试 bucket 路由。

为每个集成手写这些逻辑很重复。Routing gateway 提供一个 OpenAI-compatible API，并处理其余部分。

## 概念
### OpenAI-compatible proxy 形态

所有人都使用 OpenAI-shape。Routing gateway 暴露 `/v1/chat/completions`，接受 OpenAI schema，并在内部代理到 Anthropic / Gemini / Cohere / Ollama / 任何后端。客户端不需要关心。

### Model aliases

你的代码不写 `claude-3-5-sonnet-20251022`，而是写 `our_smart_model`。Gateway 将 alias 映射到真实模型。当 Anthropic 发布 Claude 4 时，你在服务端修改 alias；你的代码无需改动任何东西。

### Fallback chains

```
primary: openai/gpt-4o
on 5xx: anthropic/claude-3-5-sonnet
on 5xx: google/gemini-1.5-pro
on 5xx: refuse
```

Gateway 在 config 中定义这些。重试会计入预算，避免 fallback 级联导致成本失控。

### Semantic caching

相同或近似相同的 prompt 命中缓存，而不是访问 provider。重复 agent loops 上的节省可达 30% 到 60%。Key 基于 Embedding；近似相同的 prompt 共享一个缓存槽位。

### Guardrails

网关级：

- **PII redaction.** 在发送 prompt 前执行 Regex 或基于 ML 的处理。
- **Policy violations.** 拒绝包含禁止内容的 prompt。
- **Output filters.** 清理 completion 中的泄漏内容。

Portkey 和 Kong 都内置有明确取向的 guardrails。LiteLLM 将其保留为可选项。

### Per-key rate limits

一个 API key = 一个团队。Per-key budget 防止一个团队消耗共享 quota。大多数 gateway 都支持这一点。

### Self-hosted 与 managed 的取舍

| Factor | LiteLLM (self-hosted) | OpenRouter (managed) | Portkey (production) |
|--------|----------------------|----------------------|----------------------|
| Code | 开源，Python | 托管 SaaS | 开源（2026 年 3 月）+ 托管 |
| Setup | 部署一个 proxy | 注册 | 二者均可 |
| Providers | 100+ | 300+ | 100+ |
| Billing | 你自己的 key | OpenRouter credits | 你自己的 key |
| Observability | OpenTelemetry | Dashboard | 完整 OTel + PII redaction |
| Best for | 想要完全控制的团队 | 快速原型开发 | 有合规需求的生产环境 |

当你有 SRE 团队并希望拥有数据主权时，LiteLLM 胜出。当你想要单一订阅且不想维护基础设施时，OpenRouter 胜出。当你需要开箱即用的 guardrails 和合规能力时，Portkey 胜出。

### Cost tracking

每个请求携带 `provider`、`model`、`input_tokens`、`output_tokens`。乘以按模型、按 Token 的价格（从 gateway 维护的 pricing sheet 拉取）。按用户 / 团队 / 项目聚合。

### MCP plus routing

Gateway 可以同时路由 LLM 调用和 MCP sampling requests。当 sampling request 的 modelPreferences 偏好某个特定模型时，gateway 会转换到正确后端。这也是 Phase 13 · 17（MCP gateway）和本课 routing gateway 有时会合并成一个服务的地方。

### Routing strategies

- **Static priority.** 列表中的第一个；出错时 fallback。
- **Load balancing.** Round-robin 或加权。
- **Cost-aware.** 选择满足延迟 / 质量要求的最低成本模型。
- **Latency-aware.** 选择过去 N 分钟内最快的模型。
- **Task-aware.** Prompt classifier 将 coding 路由到一个模型，将 summarization 路由到另一个模型。

## 使用它
`code/main.py` 用约 150 行实现了一个 routing gateway：接受 OpenAI-shaped 请求，转换到各 provider stub，运行优先级 fallback chain，跟踪单次请求成本，并对输入应用 PII redaction pass。用三个场景运行它：正常请求、primary-provider outage 触发 fallback、PII 泄漏被 redaction 捕获。

需要关注：

- `ROUTES` dict：alias -> 按优先级排序的具体 provider 列表。
- Fallback loop 会在 5xx 上重试。
- Cost tracker 将 Token 使用量乘以每个模型的费率。
- PII redactor 会在转发前清理形似 SSN 的模式。

## 交付它
本课会产出 `outputs/skill-routing-config-designer.md`。给定一个 workload profile（延迟、成本、合规），该 skill 会选择 LiteLLM / OpenRouter / Portkey，并生成 routing config。

## 练习
1. 运行 `code/main.py`。触发 outage 场景；确认 fallback 落到第二个 provider，并且成本归因正确。

2. 添加 semantic caching：prompt 的 SHA256 作为 lookup key；cache hit 立即返回。测量重复调用的成本节省。

3. 添加一个 prompt classifier，将 `"code ..."` prompt 路由到偏向 intelligence 的 alias，将 `"summarize ..."` prompt 路由到偏向 speed 的 alias。

4. 设计 per-team budget：每个团队有月度支出上限；达到上限后，gateway 拒绝请求。选择一个 enforcement granularity（per-request 或 windowed）。

5. 并排阅读 LiteLLM、OpenRouter 和 Portkey 文档。指出每个产品提供而另外两个没有的一个功能。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Routing gateway | "LLM proxy" | 位于多个 provider 前方的统一 API 表面层 |
| OpenAI-compatible | "Speaks the OpenAI schema" | 接受 `/v1/chat/completions` shape，并转换到任意 backend |
| Model alias | "our_smart_model" | 你代码中的名称，由 gateway 映射到具体模型 |
| Fallback chain | "Retry list" | 失败时按顺序尝试的 provider 列表 |
| Semantic caching | "Prompt-embedding cache" | Key 是 prompt 的 Embedding；近似重复内容共享一次 cache hit |
| Guardrails | "Input/output filters" | 脱敏 PII，拒绝 policy violations |
| Per-key rate limit | "Team budget" | 作用域限定到 API key 的 quota |
| Cost tracking | "Per-request spend" | 聚合 Token 使用量 x 每个模型的价格 |
| LiteLLM | "The open proxy" | 可自托管的 OSS routing gateway |
| OpenRouter | "The managed SaaS" | 基于 credit 计费的托管 gateway |
| Portkey | "The production option" | 开源 + 托管，内置 guardrails |

## 延伸阅读
- [LiteLLM — docs](https://docs.litellm.ai/) — 自托管 routing gateway
- [OpenRouter — quickstart](https://openrouter.ai/docs/quickstart) — 托管 routing SaaS
- [Portkey — docs](https://portkey.ai/docs) — 带有 guardrails 的生产级 routing
- [TrueFoundry — LiteLLM vs OpenRouter](https://www.truefoundry.com/blog/litellm-vs-openrouter) — 决策指南
- [Relayplane — LLM gateway comparison 2026](https://relayplane.com/blog/llm-gateway-comparison-2026) — vendor 调研
