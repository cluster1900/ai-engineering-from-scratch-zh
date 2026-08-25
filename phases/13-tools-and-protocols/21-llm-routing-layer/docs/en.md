# LLM 路由层 — LiteLLM、OpenRouter、Portkey

> 供应商锁定代价高昂。不同的 Tool calling 工作负载适合不同的 Model。路由 gateway 提供统一的 API 接口、重试、故障转移、成本跟踪和 guardrails。2026 年主要有三种典型方案：LiteLLM（开源自托管）、OpenRouter（托管 SaaS）、Portkey（生产级，于 2026 年 3 月开源）。本课将说明决策标准，并带你实现一个基于 stdlib 的路由 gateway。

**Type:** Learn
**Languages:** Python（stdlib、路由 + 故障转移 + 成本跟踪器）
**Prerequisites:** Phase 13 · 02（function calling）、Phase 13 · 17（gateway）
**Time:** ~45 分钟

## 学习目标

- 区分自托管、托管和生产级路由方案。
- 实现一条 fallback chain，在供应商发生故障时按定义的优先顺序重试。
- 跨供应商跟踪每个请求的成本和 Token 用量。
- 针对给定的生产约束，在 LiteLLM、OpenRouter 和 Portkey 之间作出选择。

## 问题

供应商路由非常重要的场景：

1. **成本。** Claude Sonnet 的成本是 Haiku 的 3 倍。对于分流任务，Haiku 已经足够；对于综合任务，Sonnet 值得使用。按请求进行路由。

2. **故障转移。** OpenAI 出现一小时故障，所有请求都失败。你希望无需重新部署即可自动 fallback 到 Anthropic。

3. **延迟。** 实时聊天 UI 需要较短的首 Token 响应时间，而批量摘要器并不需要。按延迟 SLA 路由。

4. **合规。** EU 用户的数据必须保留在 EU 区域。按区域路由。

5. **实验。** 在同一工作负载上对两个 Model 进行 A/B 测试。按测试分组路由。

为每个集成手动编写所有这些逻辑非常重复。路由 gateway 提供一个与 OpenAI 兼容的 API，并处理其余工作。

## 概念

### OpenAI 兼容代理形式

所有系统都使用 OpenAI 形式。路由 gateway 暴露 `/v1/chat/completions`，接受 OpenAI schema，并在内部代理到 Anthropic / Gemini / Cohere / Ollama / 任何其他服务。client 无需关心。

### Model 别名

代码不使用固定的 snapshot id，而是写入 `our_smart_model`。gateway 将别名映射到真实 Model。当供应商发布新一代 Model 时，只需在 server 端更改别名；代码完全不需要改动。

### Fallback chain

```
primary: openai/gpt-4o
on 5xx: anthropic/claude-3-5-sonnet
on 5xx: google/gemini-1.5-pro
on 5xx: refuse
```

gateway 在配置中定义这条链。重试会计入预算，防止级联 fallback 导致成本失控。

### Semantic caching

相同或近似相同的 Prompt 会命中缓存，而不是调用供应商。在重复的 Agent 循环中可节省 30% 到 60% 的成本。key 基于 Embedding；近似相同的 Prompt 共享一个缓存槽位。

### Guardrails

Gateway 级别：

- **PII 脱敏。** 在发送 Prompt 前执行基于正则表达式或 ML 的处理。
- **策略违规。** 拒绝包含禁止内容的 Prompt。
- **输出过滤器。** 清理 completion，防止泄露。

Portkey 和 Kong 都提供了有明确约束的 guardrails。LiteLLM 将其保留为可选项。

### 按 key 限流

一个 API key 对应一个团队。按 key 设置预算，可防止单个团队耗尽共享配额。大多数 gateway 都支持这一功能。

### 自托管与托管的权衡

| 因素 | LiteLLM（自托管） | OpenRouter（托管） | Portkey（生产级） |
|--------|----------------------|----------------------|----------------------|
| 代码 | 开源，Python | 托管 SaaS | 开源（2026 年 3 月）+ 托管 |
| 设置 | 部署一个代理 | 注册 | 任一方式 |
| 供应商 | 100+ | 300+ | 100+ |
| 计费 | 使用自己的 key | OpenRouter credits | 使用自己的 key |
| 可观测性 | OpenTelemetry | Dashboard | 完整 OTel + PII 脱敏 |
| 最适合 | 希望完全掌控的团队 | 快速原型开发 | 具备合规要求的生产环境 |

如果拥有 SRE 团队并且希望实现数据主权，LiteLLM 更合适。希望使用单一订阅且不维护基础设施时，OpenRouter 更合适。需要开箱即用的 guardrails 和合规能力时，Portkey 更合适。

### 成本跟踪

每个请求都携带 `provider`、`model`、`input_tokens`、`output_tokens`。将这些值乘以各 Model 的每 Token 价格（取自 gateway 维护的价格表）。然后按用户、团队和项目聚合。

### MCP 与路由

一个 gateway 可以同时路由 LLM 调用和 MCP sampling 请求。当 sampling 请求的 modelPreferences 偏好某个特定 Model 时，gateway 会将请求转换到正确的 backend。这正是 Phase 13 · 17（MCP gateway）与本课路由 gateway 有时会合并为一个服务的地方。

### 路由策略

- **静态优先级。** 首先选择列表中的第一项；出错时 fallback。
- **负载均衡。** Round-robin 或加权。
- **成本感知。** 选择满足延迟和质量要求的最便宜 Model。
- **延迟感知。** 选择最近 N 分钟内速度最快的 Model。
- **任务感知。** Prompt 分类器将编码任务路由到一个 Model，将摘要任务路由到另一个 Model。

```figure
tp-router-failover
```

## 使用它

`code/main.py` 用约 150 行代码实现了一个路由 gateway：接受 OpenAI 形式的请求，将其转换为各供应商的 stub，运行按优先级排列的 fallback chain，跟踪每个请求的成本，并对输入执行 PII 脱敏。使用三种场景运行它：正常请求、主供应商故障触发 fallback，以及通过脱敏拦截 PII 泄露。

需要关注：

- `ROUTES` dict：别名 -> 按优先级排列的具体供应商列表。
- fallback 循环在发生 5xx 时重试。
- 成本跟踪器将 Token 用量乘以各 Model 的费率。
- PII 脱敏器在转发前清理符合 SSN 格式的内容。

## 交付它

本课将生成 `outputs/skill-routing-config-designer.md`。给定工作负载配置（延迟、成本、合规），该 Skill 会选择 LiteLLM / OpenRouter / Portkey 并生成路由配置。

## 练习

1. 运行 `code/main.py`。触发故障场景；确认请求 fallback 到第二个供应商，并且成本归属正确。

2. 添加 semantic caching：使用 Prompt 的 SHA256 作为查询 key；缓存命中时立即返回。测量重复调用节省的成本。

3. 添加 Prompt 分类器，将 `"code ..."` Prompt 路由到偏重智能能力的别名，将 `"summarize ..."` Prompt 路由到偏重速度的别名。

4. 设计按团队分配的预算：每个团队都有月度支出上限；达到上限后，gateway 拒绝请求。选择一种执行粒度（按请求或按时间窗口）。

5. 对照阅读 LiteLLM、OpenRouter 和 Portkey 文档。指出每个产品独有而另外两个产品没有的一项 Feature。

## 关键术语

| 术语 | 人们常说的含义 | 实际含义 |
|------|----------------|------------------------|
| Routing gateway | “LLM 代理” | 位于多个供应商之前、提供统一 API 接口的层 |
| OpenAI-compatible | “使用 OpenAI schema” | 接受 `/v1/chat/completions` 形式，并转换到任意 backend |
| Model alias | “our_smart_model” | 代码中的名称，由 gateway 将其映射到具体 Model |
| Fallback chain | “重试列表” | 失败时按顺序尝试的供应商列表 |
| Semantic caching | “Prompt-Embedding 缓存” | key 是 Prompt 的 Embedding；近似重复项共享缓存命中 |
| Guardrails | “输入/输出过滤器” | 对 PII 进行脱敏，拒绝策略违规内容 |
| Per-key rate limit | “团队预算” | 限定到一个 API key 的配额 |
| Cost tracking | “每请求支出” | 聚合 Token 用量 x 各 Model 价格 |
| LiteLLM | “开放代理” | 可自托管的 OSS 路由 gateway |
| OpenRouter | “托管 SaaS” | 采用 credits 计费的托管 gateway |
| Portkey | “生产环境方案” | 开源 + 托管，内置 guardrails |

## 延伸阅读

- [LiteLLM — docs](https://docs.litellm.ai/) — 自托管路由 gateway
- [OpenRouter — quickstart](https://openrouter.ai/docs/quickstart) — 托管路由 SaaS
- [Portkey — docs](https://portkey.ai/docs) — 带 guardrails 的生产级路由
- [TrueFoundry — LiteLLM vs OpenRouter](https://www.truefoundry.com/blog/litellm-vs-openrouter) — 决策指南
- [Relayplane — LLM gateway comparison 2026](https://relayplane.com/blog/llm-gateway-comparison-2026) — 供应商调研
