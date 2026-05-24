# LLM 可观测性 Stack 选择

> 2026 年的可观测性市场分为两类。开发平台（LangSmith、Langfuse、Comet Opik）把监控与 evals、prompt 管理、session replay 打包在一起。Gateway/工具化工具（Helicone、SigNoz、OpenLLMetry、Phoenix）专注于遥测。Langfuse 是 MIT-licensed core，并在 OSS 方面取得了很好的平衡（免费 cloud 每月 50K events）。Phoenix 是 OpenTelemetry-native，采用 Elastic License 2.0 —— 非常适合 drift/RAG 可视化，但不是持久化生产后端。Arize AX 使用 zero-copy Iceberg/Parquet 集成，声称比 monolithic observability 便宜 100x。LangSmith 在 LangChain/LangGraph 方面领先，$39/user/mo，仅 Enterprise 支持 self-host。Helicone 基于 proxy，15-30 分钟可完成设置，每月免费 100K req，但 agent trace 深度较弱。常见生产模式：Gateway（Helicone/Portkey）+ eval platform（Phoenix/TruLens），由 OpenTelemetry 粘合。

**Type:** Learn
**Languages:** Python (stdlib, toy trace-sampling simulator)
**前置要求：** Phase 17 · 08 (Inference Metrics), Phase 14 (Agent Engineering)
**Time:** ~60 分钟

## 学习目标
- 区分开发平台（打包：evals + prompts + sessions）与 gateway/telemetry 工具（仅 traces + metrics）。
- 将六个主要工具（Langfuse、LangSmith、Phoenix、Arize AX、Helicone、Opik）映射到它们的 license、pricing 和最适合的 use cases。
- 解释 OpenTelemetry 粘合模式，它让你可以把 gateway 工具与独立的 eval platform 组合起来。
- 说出 2026 年的成本差异点（Arize AX 的 zero-copy 方法 vs monolithic ingest），并说明大约 100x 的倍数。

## 问题
你上线了一个 LLM 功能。它能工作。但你看不到 prompt failures、tool loops、latency regressions、cost spikes，或 prompt-cache hit rate。你 Google “LLM observability”，会看到八个工具都声称能解决同一个问题，而且价格档位还分成三档。

它们解决的不是同一个问题。LangSmith 回答“为什么这次 LangGraph run 失败了？”Phoenix 回答“我的 RAG pipeline 是否正在 drifting？”Helicone 回答“哪个 app 正在烧 Token？”Langfuse 回答“我能不能 self-host 整套东西？”工具不同，受众不同。

选择涉及四个轴：stack（LangChain？raw SDK？multi-vendor？）、license tolerance（只接受 MIT？Elastic 可以？commercial 没问题？）、budget（free tier？$100/mo？$1000/mo？）和 self-host（必须？nice-to-have？绝不？）。

## 概念
### 两类

**开发平台**把可观测性与 evals、prompt 管理、dataset versioning、session replay 打包在一起。你运行实验，查看哪个 prompt 有效，把新 prompt 与旧 winner 在 dataset 上做 regression。LangSmith、Langfuse、Comet Opik 属于这一类。

**Gateway/telemetry 工具**对 inference calls 做工具化采集 —— prompt、response、Token、latency、model、cost。Helicone、SigNoz、OpenLLMetry、Phoenix。更轻量。可以通过 OpenTelemetry 与独立的 eval 工具组合。

### Langfuse — OSS 平衡

- Core Apache / MIT licensed；通过 Docker self-host。
- Cloud free tier：50K events/month。Paid：$29/mo for team。
- Evals、prompt management、traces、datasets。对四个 dev-platform feature 都有合理覆盖。
- Sweet spot：你想要 LangSmith 级别的功能，但必须 self-host 或坚持 OSS license。

### Phoenix (Arize) — telemetry-first，OpenTelemetry-native

- Elastic License 2.0；self-host 很简单。
- 非常擅长 RAG 和 drift 可视化。Embedding-space scatter plots 是一等功能。
- 不是为持久化生产后端设计的 —— 主要是开发期可观测性。
- Sweet spot：RAG pipeline 开发、drift debugging，并与独立 gateway 搭配用于生产。

### Arize AX — scale play

- Commercial。通过 Iceberg/Parquet 实现 zero-copy data lake 集成。
- 声称在 scale 下比 monolithic observability（Datadog-class）便宜约 100x。计算方式：你把 traces 存在自己 S3 上的 Parquet 中；Arize 直接读取。
- Sweet spot：>10M traces/day、已有 data lake、想要 LLM-specific dashboards 但不想付 Datadog 价格。

### LangSmith — LangChain/LangGraph 优先

- Commercial，$39/user/month。仅 Enterprise 支持 self-host。
- 对 LangChain 和 LangGraph stacks 是 best-in-class。如果你不用这两者，吸引力会弱很多。
- Sweet spot：团队已投入 LangChain，并愿意付费。

### Helicone — 基于 proxy 的 minimum viable

- 通过把 `OPENAI_API_BASE` 替换为 Helicone proxy，15-30 分钟完成设置。
- MIT licensed；100K req/mo 免费，paid $20/mo+。
- 包含 failover、caching、rate limits —— 也可充当 gateway。
- 对 agent / multi-step traces 的深度较弱。
- Sweet spot：快速开始、single-stack app、需要 gateway + observability 合一。

### Opik (Comet) — OSS dev platform

- Apache 2.0，完全 OSS。
- 功能集与 Langfuse 类似，带有 Comet 传承。
- Sweet spot：已经使用 Comet 的 ML 团队，希望在同一个 pane 中获得 LLM 可观测性。

### SigNoz — OpenTelemetry-first 完整 APM

- Apache 2.0。通过 OpenTelemetry 同时处理 general APM 和 LLM。
- Sweet spot：跨服务和 LLM calls 的统一可观测性。

### 粘合层：OpenTelemetry + GenAI semantic conventions

OpenTelemetry 在 2025 年末发布了 GenAI semantic conventions（`gen_ai.system`、`gen_ai.request.model`、`gen_ai.usage.input_tokens`）。消费 OTel 的工具可以互操作。正在出现的生产模式：

1. 从每个 LLM call 发出符合 GenAI conventions 的 OTel。
2. 路由到 gateway（Helicone / Portkey）用于日常使用。
3. 双写到 eval platform（Phoenix / Langfuse）用于 regressions。
4. 归档到 data lake（Iceberg），用于通过 Arize AX 或 DuckDB 做长期分析。

### 陷阱：在错误层做工具化

在 agent framework 内部做工具化（例如添加 LangSmith traces）会把你耦合到该 framework。在 HTTP/OpenAI-SDK 层做工具化（通过 OpenLLMetry 或你的 gateway）更可移植。

### Sampling — 你无法保留所有东西

当请求量 >1M requests/day 时，full-trace retention 的成本会超过 LLM calls 本身。按规则采样：100% errors、100% high-cost、5% success。始终保留 aggregates；为 long tail 保留 raw。

### 你应该记住的数字

- Langfuse free cloud：50K events/month。
- LangSmith：$39/user/month。
- Helicone free：100K req/month。
- Arize AX claim：在 scale 下比 monolithic 便宜约 100x。
- OpenTelemetry GenAI conventions：2025 发布，2026 广泛采用。

## 使用它
`code/main.py` 模拟在不同 retention strategies（100% ingest、sampling、sampling + errors）下的一天 1M traces。报告 storage cost 以及每种策略下丢失的内容。

## 交付它
本课会产出 `outputs/skill-observability-stack.md`。根据 stack、scale、budget、license posture 选择工具。

## 练习
1. 你的团队使用 LangChain，并希望 OSS self-hosted observability。选择 Langfuse 或 Opik 并说明理由。
2. 在 5M traces/day 且 Datadog 报价 $150K/month 时，计算 Arize AX 的 break-even。
3. 设计一组你的组织 guideline 应要求每个 LLM call 都必须包含的 OpenTelemetry GenAI attributes。
4. 论证仅 Phoenix 是否足以用于生产。它什么时候不够？
5. Helicone 有 20ms proxy overhead。当 P99 TTFT 为 300 ms 时，这可以接受吗？如果 SLA 是 100 ms 呢？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OpenLLMetry | “OTel for LLMs” | 面向 LLMs 的开源 OpenTelemetry instrumentation |
| GenAI conventions | “OTel attributes” | LLM calls 的标准 OTel attribute names |
| LangSmith | “LangChain observability” | 与 LangChain ecosystem 打包的 commercial platform |
| Langfuse | “OSS LangSmith” | 具备类似功能集的 MIT OSS |
| Phoenix | “Arize dev tool” | OpenTelemetry-native dev/eval platform |
| Arize AX | “scale observability” | Commercial zero-copy Iceberg/Parquet observability |
| Helicone | “proxy observability” | 收集 LLM telemetry + gateway features 的 HTTP proxy |
| Opik | “Comet LLM” | 来自 Comet 的 Apache 2.0 OSS dev platform |
| Session replay | “trace rerun” | 带 tool calls 的完整 agent session replay |
| Eval | “offline test” | 在 labeled dataset 上运行 candidate model/prompt |

## 延伸阅读
- [SigNoz — 2026 顶级 LLM 可观测性工具](https://signoz.io/comparisons/llm-observability-tools/)
- [Langfuse — Arize AX Alternative analysis](https://langfuse.com/faq/all/best-phoenix-arize-alternatives)
- [PremAI — 设置 Langfuse、LangSmith、Helicone、Phoenix](https://blog.premai.io/llm-observability-setting-up-langfuse-langsmith-helicone-phoenix/)
- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Arize Phoenix docs](https://docs.arize.com/phoenix)
- [Helicone docs](https://docs.helicone.ai/)
