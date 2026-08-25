# 托管 LLM 平台 — Bedrock、Vertex AI、Azure OpenAI

> 三家 hyperscaler，三种截然不同的策略。AWS Bedrock 是 Model 市场，通过一个 API 提供 Claude、Llama、Titan、Stability 和 Cohere。Azure OpenAI 是与 OpenAI 的独家合作服务，并通过 Provisioned Throughput Units（PTUs）提供专用容量。Vertex AI 以 Gemini 为核心，在长 Context 和 Multimodal 方面表现最佳。2026 年，Artificial Analysis 测得：在相当于 Llama 3.1 405B 的 Model 上，Azure OpenAI 的中位延迟约为 50 ms，而 Bedrock 约为 75 ms。PTUs 解释了这一差距，因为专用容量优于共享按需容量。决策原则不是“哪个最快”，而是“哪个 Model 目录和 FinOps 能力最适合我的产品”。本课将教你记录各项权衡并据此选择，而不是凭感觉决策。

**Type:** Learn
**Languages:** Python（stdlib，简化的成本与延迟比较器）
**Prerequisites:** Phase 11（LLM Engineering）、Phase 13（Tools & Protocols）
**Time:** ~60 分钟

## 学习目标

- 说出三种平台策略（市场、独家合作、Gemini-first），并将每种策略与相应的产品用例匹配。
- 解释 Azure OpenAI 中的 Provisioned Throughput Units（PTUs）能为你带来什么，以及为什么在 405B 规模上，按需 Bedrock 的读数通常慢约 25 ms。
- 绘制各平台的 FinOps 归因体系图（Bedrock Application Inference Profiles、Vertex 每团队一个项目、Azure scopes + PTU reservations）。
- 写出一项“至少两个 provider”政策，并解释为什么单一 vendor 锁定是 2026 年代价高昂的错误。

## 问题

你为产品选择了 Claude 3.7 Sonnet。现在需要将它投入服务。你可以直接调用 Anthropic API，也可以通过 AWS Bedrock 调用，或者经由 gateway 调用。直接 API 最简单；Bedrock 增加了 BAAs、VPC endpoints、IAM 和 CloudWatch 归因能力。gateway 则增加了跨 provider 的故障转移、统一计费和速率限制。

更深层的问题在于目录。如果同一产品需要 Claude、Llama 和 Gemini，那么你无法从一个地方购买全部服务，除非这个“地方”同时包括 Bedrock、Vertex 和 Azure OpenAI。这些 hyperscaler 并不能互换，因为它们对于谁将掌控 Model 层分别做出了不同的押注。

本课将梳理这三种押注、延迟差距、FinOps 差距和锁定风险。

## 概念

### 三种策略

**AWS Bedrock** — 市场。提供 Claude（Anthropic）、Llama（Meta）、Titan（AWS first-party）、Stability（图像）、Cohere（Embedding）、Mistral，以及图像和 Embedding 子目录。一个 API、一个 IAM 界面、一个 CloudWatch 导出接口。Bedrock 的押注是：与单一 Model 相比，客户更看重选择空间。

**Azure OpenAI** — 独家合作。你可以获得 GPT-4 / 4o / 5 / o-series、DALL·E、Whisper，以及在 Azure datacenters 中对 OpenAI Model 进行 Fine-tuning 的能力。“Azure OpenAI Service”目录中不包含非 OpenAI Model，这些 Model 位于 Azure AI Foundry（独立产品）中。Azure 的押注是：OpenAI 会继续处于前沿，而客户希望在这一特定合作关系之上获得企业级控制能力。

**Vertex AI** — Gemini 优先，其他 Model 居次。提供 Gemini 1.5 / 2.0 / 2.5 Flash 和 Pro，以及 Model Garden（第三方）。Vertex 押注的是 Multimodal 长 Context，拥有 1M Token Context 的 Gemini 是其差异化优势。

### 大规模场景下的延迟差距

Artificial Analysis 会持续运行 benchmark。在相当的 Llama 3.1 405B 部署上（共享按需容量），Azure OpenAI 的首个 Token 延迟中位数约为 50 ms；Bedrock 约为 75 ms。这一差距并非 AWS 的失败，而是容量模式不同所致。Azure 销售 PTUs（Provisioned Throughput Units），为你的 tenant 预留 GPU 容量。Bedrock 也有类似产品（Provisioned Throughput），但每个 unit 的起价约为每小时 21 美元，因此大多数客户仍使用共享按需容量。

按需共享容量需要与其他所有客户的流量竞争，专用容量则不需要。如果你的产品 SLA 要求 P99 TTFT < 100 ms，那么你要么购买 Azure PTUs，要么购买 Bedrock Provisioned Throughput，要么接受默认的波动。

### Provisioned Throughput 经济性

Azure PTUs：预留的一组 Inference 计算资源。对于可预测的工作负载，与按需模式相比最多可节省约 70%。无论流量多少，每小时成本固定，即使闲置也要为 reservation 付费。盈亏平衡点通常在 40-60% 的持续利用率附近。

Bedrock Provisioned Throughput：根据 Model 和 region 的不同，每小时为 21-50 美元。计算逻辑类似，盈亏平衡点约为峰值利用率的一半。需要按月承诺。

Vertex provisioned capacity 按 Gemini SKU 销售；价格因 Model 和 region 而异，公开程度较低。

### FinOps 界面 — 真正的差异化因素

**Bedrock Application Inference Profiles** 在市场型平台中提供了最清晰的归因能力。使用 `team`、`product`、`feature` 标记 profile；让所有 Model 调用通过它路由；CloudWatch 无需后处理即可按 profile 拆分成本。这项功能于 2025 年加入，至今仍是 hyperscaler 原生功能中粒度最细的方案。

**Vertex** 的归因方式是每团队一个项目，并在所有位置添加 label。你将每个团队建模为一个 GCP project，为每项资源添加 label，再使用 BigQuery Billing Export + DataStudio 进行汇总。工作量更大，但 BigQuery 允许你对成本数据执行任意 SQL。

**Azure** 依赖 subscription/resource-group scopes 和 tag，并将 PTU reservations 作为一级成本对象。tag 继承自 resource group，而不是 request，因此按 request 归因需要使用 Application Insights custom metrics，或者使用能够写入 header 的 gateway。

总体规律是：Bedrock 的原生体验最清晰，Vertex 通过 BigQuery 提供的灵活性最高，而 Azure 最不透明，除非你自行添加观测能力。

### 锁定是 2026 年的风险

当某个 Model 占据绝对优势时，只承诺使用一家 hyperscaler 并无大碍。但在 2026 年，前沿水平每月都在变化：一个季度是 Claude 3.7，下一个季度是 Gemini 2.5，再下一个季度则是 GPT-5。锁定一个平台，意味着你无法使用另外三分之二的前沿能力。

有效团队采用的模式是：对所有产品关键型 LLM 调用，至少使用两个 provider。Bedrock 加 Azure OpenAI 是常见组合，一个提供 Claude，另一个提供 GPT，在二者之间进行故障转移，并使用同一个 gateway。由于 gateway 会选择最优路由，增加的成本可以忽略不计；而在服务中断期间，例如 2025 年 1 月的 Azure OpenAI 事故和 AWS us-east-1 故障，可用性的提升具有决定性意义。

### 数据驻留、BAAs 与受监管行业

Bedrock：多数 region 提供 BAAs；支持 VPC endpoints 和 guardrails。通常是 fintech 的默认选择。
Azure OpenAI：支持 HIPAA、SOC 2、ISO 27001 和欧盟数据驻留；是受监管企业的默认选择。
Vertex：支持 HIPAA、GDPR 和按 region 的数据驻留；具备 Google Cloud 的合规体系。

三者都能满足基本的勾选式要求。区别在于数据保留政策、日志处理方式，以及滥用监测是否会读取你的流量（多数服务默认选择加入；企业客户可以选择退出）。

### 你应记住的数字

- Azure OpenAI 在相当于 Llama 3.1 405B 的 Model 上的 TTFT 中位数：约 50 ms（使用 PTUs）。
- Bedrock 按需模式的 TTFT 中位数：约 75 ms。
- Bedrock Provisioned Throughput：每个 unit 每小时 21-50 美元。
- Azure PTU 盈亏平衡点：约 40-60% 的持续利用率。
- 高利用率下，PTU 相比按需模式最多可节省 70%。

```figure
i4-platform-lanes
```

## 使用它

`code/main.py` 使用合成工作负载比较三个平台，它对按需模式与 PTU 的经济性、TTFT 波动以及成本归因保真度进行建模。运行它，观察 PTU 在什么情况下能够回本，以及 Model 市场的广度在什么情况下比 TTFT 差距更重要。

## 交付它

本课会生成 `outputs/skill-managed-platform-picker.md`。给定工作负载概况（所需 Model、TTFT SLA、每日流量、合规要求），它会推荐主平台、备用平台和 FinOps 观测方案。

## 练习

1. 运行 `code/main.py`。对于 70B 级 Model，Azure PTU 在多高的持续利用率下优于按需模式？计算盈亏平衡点，并与宣传的 40-60% 区间比较。
2. 你的产品需要 Claude 3.7 Sonnet 和 GPT-4o。设计一个双 provider 部署：每个 Model 应使用哪家 hyperscaler、前方设置什么 gateway、采用什么故障转移政策？
3. 一家受监管的医疗客户要求 BAAs、US-East 数据驻留和低于 100 ms 的 P99 TTFT。选择一个平台，并用三个具体功能说明理由。
4. 你发现本月 Bedrock 账单增长了 4 倍，但流量没有变化。如果没有 Application Inference Profiles，你会如何找到问题来源？如果有 profiles，需要多长时间？
5. 阅读 Azure OpenAI 和 Bedrock 定价页面。对于每月 100M Token 的 Claude 工作负载，哪一种更便宜：直接使用 Anthropic API、Bedrock 按需模式，还是 Bedrock Provisioned Throughput？

## 关键术语

| 术语 | 人们通常怎么说 | 它的实际含义 |
|------|----------------|------------------------|
| Bedrock | “AWS LLM 服务” | 覆盖 Claude、Llama、Titan、Mistral 和 Cohere 的 Model 市场 |
| Azure OpenAI | “Azure 的 ChatGPT” | 部署在 Azure datacenters 中并提供企业控制能力的独家 OpenAI Model |
| Vertex AI | “Google 的 LLM” | 以 Gemini 为核心，并通过 Model Garden 提供第三方 Model 的平台 |
| PTU | “专用容量” | Provisioned Throughput Unit — 按小时计价的预留 Inference GPU |
| Application Inference Profile | “Bedrock 标记” | 按产品划分并带有 tag 的成本/用量 profile，CloudWatch-native |
| Model Garden | “Vertex 目录” | Vertex AI 的第三方 Model 区域，与 Gemini 分开 |
| 至少两个 provider | “LLM 冗余” | 在至少 2 家 hyperscaler 上运行每条关键 LLM 路径的政策 |
| BAA | “HIPAA 文书” | Business Associate Agreement；处理 PHI 时必须具备；三家平台均可提供 |
| 滥用监测 | “日志监视器” | provider 对 Prompt/输出执行的安全扫描；企业客户可以选择退出 |

## 延伸阅读

- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/) — 权威费率表和 Provisioned Throughput 定价。
- [Azure OpenAI Service Pricing](https://azure.microsoft.com/en-us/pricing/details/azure-openai/) — PTU 经济性和费率表。
- [Vertex AI Generative AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing) — Gemini 层级和 Model Garden 附加费用。
- [Artificial Analysis LLM Leaderboard](https://artificialanalysis.ai/) — 跨 provider 的持续延迟与吞吐量 benchmark。
- [The AI Journal — AWS Bedrock vs Azure OpenAI CTO Guide 2026](https://theaijournal.co/2026/03/aws-bedrock-vs-azure-openai/) — 企业决策框架。
- [Finout — Bedrock vs Vertex vs Azure FinOps](https://www.finout.io/blog/bedrock-vs.-vertex-vs.-azure-cognitive-a-finops-comparison-for-ai-spend) — 并列比较归因机制。
