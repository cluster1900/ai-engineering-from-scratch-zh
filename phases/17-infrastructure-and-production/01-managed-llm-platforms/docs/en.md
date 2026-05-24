# 托管 LLM 平台 — Bedrock, Vertex AI, Azure OpenAI

> 三家 hyperscaler，三种不同策略。AWS Bedrock 是模型市场 — Claude, Llama, Titan, Stability, Cohere 位于同一个 API 之后。Azure OpenAI 是独家的 OpenAI 合作关系，加上用于专用容量的 Provisioned Throughput Units (PTUs)。Vertex AI 以 Gemini 为先，拥有最佳的长上下文和 Multimodal 叙事。2026 年，Artificial Analysis 在 Llama 3.1 405B 等效场景下测得 Azure OpenAI median 约为 50 ms，Bedrock 约为 75 ms — PTUs 解释了这个差距，因为专用容量胜过共享 on-demand。决策规则不是“哪个最快”，而是“哪个模型目录和 FinOps 界面匹配我的产品”。本课会教你把 tradeoff 写下来再做选择，而不是凭感觉。

**Type:** Learn
**语言：** Python (stdlib, toy cost-and-latency comparator)
**前置要求：** Phase 11 (LLM Engineering), Phase 13 (Tools & Protocols)
**Time:** ~60 minutes

## 学习目标
- 说出三种平台策略（marketplace vs exclusive vs Gemini-first），并把每种策略匹配到一个产品用例。
- 解释 Azure OpenAI 中 Provisioned Throughput Units (PTUs) 给你买到了什么，以及为什么 on-demand Bedrock 在 405B 规模下通常读数会慢约 25 ms。
- 绘制每个平台的 FinOps 归因界面（Bedrock Application Inference Profiles vs Vertex project-per-team vs Azure scopes + PTU reservations）。
- 写下一条“two-provider minimum”策略，并解释为什么 single-vendor lock-in 是 2026 年代价高昂的错误。

## 问题
你为产品选择了 Claude 3.7 Sonnet。现在你需要提供服务。你可以直接调用 Anthropic API，也可以通过 AWS Bedrock 调用，或者通过 gateway。直接 API 最简单；Bedrock 增加了 BAAs、VPC endpoints、IAM 和 CloudWatch 归因。gateway 增加了跨 provider 的 failover、统一 billing 和 rate limits。

更深层的问题是目录。如果你需要在同一个产品中使用 Claude、Llama 和 Gemini，那么你无法从单一地点买齐它们，除非那个地点同时是 Bedrock 加 Vertex 加 Azure OpenAI。hyperscaler 不是可以互换的 — 它们各自对谁拥有模型层做出了不同押注。

本课会梳理这三种押注、latency 差距、FinOps 差距和 lock-in 风险。

## 概念
### 三种策略

**AWS Bedrock** — marketplace。Claude (Anthropic)、Llama (Meta)、Titan (AWS first-party)、Stability (image)、Cohere (embeddings)、Mistral，以及 image 和 embedding 子目录。一个 API，一个 IAM 界面，一个 CloudWatch export。Bedrock 的押注是，客户想要可选性，胜过想要单一模型。

**Azure OpenAI** — exclusive partnership。你在 Azure datacenters 中获得 GPT-4 / 4o / 5 / o-series、DALL·E、Whisper，以及 OpenAI 模型的 fine-tuning。“Azure OpenAI Service”目录中没有非 OpenAI 模型 — 这些会进入 Azure AI Foundry（独立产品）。Azure 的押注是 OpenAI 仍然处于前沿，而客户想要针对这段特定关系的企业控制能力。

**Vertex AI** — Gemini first，其余第二。Gemini 1.5 / 2.0 / 2.5 Flash and Pro，加上 Model Garden（third-party）。Vertex 的押注是 Multimodal 长上下文 — 1M-token Gemini context 是差异化因素。

### 规模下的 Latency 差距

Artificial Analysis 运行持续 benchmark。在等效的 Llama 3.1 405B 部署上（shared on-demand），Azure OpenAI median first-token latency 约为 50 ms；Bedrock 约为 75 ms。这个差距不是 AWS 失败 — 它是容量模型差异。Azure 销售 PTUs (Provisioned Throughput Units)，为你的 tenant 预留 GPU 容量。Bedrock 的等价物（Provisioned Throughput）也存在，但每 unit 起价约 $21/hour，大多数客户仍停留在 shared on-demand。

On-demand shared capacity 会与所有其他客户的流量竞争。Dedicated capacity 不会。如果你的产品 SLA 是 TTFT < 100 ms at P99，那么你要么购买 Azure 上的 PTUs，要么购买 Bedrock Provisioned Throughput，要么接受默认波动。

### Provisioned Throughput 经济性

Azure PTUs：一块预留的 inference compute。对于可预测 workload，相比 on-demand 最高可节省约 70%。成本按小时固定，与流量无关 — 即使 idle 也要为 reservation 付费。break-even 通常在 40-60% sustained utilization 左右。

Bedrock Provisioned Throughput：根据模型和 region，每小时 $21-$50。数学类似 — break-even 大约在 peak utilization 的一半。需要 monthly commitment。

Vertex provisioned capacity 按 Gemini SKU 销售；pricing 因模型和 region 而异，公开宣传更少。

### FinOps 界面 — 真正的差异化因素

**Bedrock Application Inference Profiles** 是 marketplace 中最干净的归因。用 `team`、`product`、`feature` 标记 profile；让所有模型调用都通过它路由；CloudWatch 无需后处理即可按 profile 拆分成本。它于 2025 年新增，仍然是最细粒度的 hyperscaler 原生能力。

**Vertex** 归因是 project-per-team 加 labels-everywhere。你把每个团队建模为一个 GCP project，在每个 resource 上打 labels，并使用 BigQuery Billing Export + DataStudio 做 rollup。工作更多，但 BigQuery 让你可以对成本数据执行任意 SQL。

**Azure** 依赖 subscription/resource-group scopes 加 tags，并把 PTU reservations 作为一等成本对象。Tags 从 resource groups 继承，而不是从 requests 继承，所以 per-request 归因需要 Application Insights custom metrics，或一个会写入 headers 的 gateway。

模式是：Bedrock 原生最干净，Vertex 通过 BigQuery 最灵活，Azure 最不透明，除非你做 instrument。

### Lock-in 是 2026 年的风险

当一个模型占主导时，single-hyperscaler commitment 还可以接受。2026 年，前沿每月都在移动 — 一个季度是 Claude 3.7，下一个季度是 Gemini 2.5，再下一个季度是 GPT-5。锁定一个平台，就会把你排除在三分之二的前沿之外。

有效团队采用的模式是：对任何产品关键 LLM call，至少使用 two-provider minimum。Bedrock 加 Azure OpenAI 是常见组合 — 从一个平台拿 Claude，从另一个平台拿 GPT，在它们之间 failover，使用同一个 gateway。成本上升可以忽略，因为 gateway 会做 optimal routing；在 outage 期间（如 Azure OpenAI January 2025 incident、AWS us-east-1 outage），可用性提升是决定性的。

### Data residency、BAAs 和受监管行业

Bedrock：大多数 region 提供 BAAs；VPC endpoints；guardrails。常见 fintech 默认选项。
Azure OpenAI：HIPAA、SOC 2、ISO 27001；EU data residency；企业受监管场景的默认选项。
Vertex：HIPAA、GDPR、按 region 的 data residency；Google Cloud 的 compliance stack。

三者都满足基础 checkbox。差异在于 data retention policies、logs 如何处理，以及 abuse-monitoring 是否读取你的流量（大多数默认 opt-in；enterprise 可 opt-out）。

### 你应该记住的数字

- Azure OpenAI 在 Llama 3.1 405B 等效场景下的 median TTFT：~50 ms（使用 PTUs）。
- Bedrock on-demand 中位 TTFT：~75 ms。
- Bedrock Provisioned Throughput：每 unit $21-$50/hr。
- Azure PTU break-even：~40-60% sustained utilization。
- 高利用率下 PTU 相比 on-demand 的节省：最高 70%。

## 使用它
`code/main.py` 会在一个 synthetic workload 上比较这三个平台 — 它建模 on-demand vs PTU 经济性、TTFT variance 和 cost attribution fidelity。运行它，看看 PTUs 在哪里回本，以及 marketplace 的模型广度在哪里超过 TTFT 差距。

## 交付它
本课会生成 `outputs/skill-managed-platform-picker.md`。给定 workload profile（所需模型、TTFT SLA、daily volume、compliance requirements），它会推荐 primary platform、fallback，以及 FinOps instrumentation plan。

## 练习
1. 运行 `code/main.py`。对于 70B class model，Azure PTU 在什么 sustained utilization 下优于 on-demand？计算 break-even，并与宣称的 40-60% 区间比较。
2. 你的产品需要 Claude 3.7 Sonnet 和 GPT-4o。设计一个 two-provider deployment — 哪个放到哪个 hyperscaler，前面放什么 gateway，failover policy 是什么？
3. 一位受监管的 healthcare 客户要求 BAAs、US-East data residency 和 sub-100ms P99 TTFT。选择一个平台，并用三个具体功能来论证。
4. 你发现本月 Bedrock 账单在没有流量变化的情况下上涨了 4x。没有 Application Inference Profiles 时，你会如何找到罪魁祸首？有 profiles 时，需要多久？
5. 阅读 Azure OpenAI 和 Bedrock pricing pages。对于 100M-token/month Claude workload，哪个更便宜 — direct Anthropic API、Bedrock on-demand，还是 Bedrock Provisioned Throughput？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Bedrock | "AWS LLM service" | 跨 Claude、Llama、Titan、Mistral、Cohere 的模型 marketplace |
| Azure OpenAI | "Azure's ChatGPT" | 位于 Azure datacenters 中、带企业控制能力的独家 OpenAI 模型 |
| Vertex AI | "Google's LLM" | 以 Gemini 为先的平台，Model Garden 用于 third-party models |
| PTU | "dedicated capacity" | Provisioned Throughput Unit — 预留 inference GPUs，按小时定价 |
| Application Inference Profile | "Bedrock tagging" | 带 tags 的 per-product cost/usage profile，CloudWatch-native |
| Model Garden | "Vertex catalog" | Vertex AI 的 third-party model section，独立于 Gemini |
| Two-provider minimum | "LLM redundancy" | 让每条关键 LLM 路径跨 ≥2 个 hyperscaler 运行的策略 |
| BAA | "HIPAA paperwork" | Business Associate Agreement；PHI 所必需；三者均提供 |
| Abuse monitoring | "the log watcher" | provider-side safety scan，作用于 prompts/outputs；enterprise 可 opt-out |

## 延伸阅读
- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/) — 权威 rate card 和 Provisioned Throughput pricing。
- [Azure OpenAI Service Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/) — PTU economics 和 rate cards。
- [Vertex AI Generative AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing) — Gemini tiers 和 Model Garden surcharges。
- [Artificial Analysis LLM Leaderboard](https://artificialanalysis.ai/) — 跨 provider 的持续 latency 和 throughput benchmarks。
- [The AI Journal — AWS Bedrock vs Azure OpenAI CTO Guide 2026](https://theaijournal.co/2026/03/aws-bedrock-vs-azure-openai/) — enterprise decision framework。
- [Finout — Bedrock vs Vertex vs Azure FinOps](https://www.finout.io/blog/bedrock-vs.-vertex-vs.-azure-cognitive-a-finops-comparison-for-ai-spend) — attribution mechanics side-by-side。
