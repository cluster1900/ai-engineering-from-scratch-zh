# Inference 平台经济学 — Fireworks、Together、Baseten、Modal、Replicate、Anyscale

> 2026 年的 Inference 市场已不再只是租用 GPU 时间。它分化为 custom silicon（Groq、Cerebras、SambaNova）、GPU 平台（Baseten、Together、Fireworks、Modal）和 API-first 市场（Replicate、DeepInfra）。Fireworks 于 2026 年 5 月 1 日将每块 GPU 的价格上调 1 美元/小时，其 40 亿美元估值和每日超过 10T Token 的处理量表明，流量驱动模式行之有效。Baseten 于 2026 年 1 月完成 3 亿美元 E 轮融资，估值达到 50 亿美元。竞争定位原则很简单：Fireworks 优化延迟，Together 优化目录广度，Baseten 优化企业级完成度，Modal 优化 Python-native DX，Replicate 优化 Multimodal 覆盖范围，Anyscale 优化分布式 Python。本课会提供一张可以直接交给创始人的 Matrix。

**Type:** Learn
**Languages:** Python（stdlib，简化的单次调用经济性比较器）
**Prerequisites:** Phase 17 · 01（Managed LLM Platforms）、Phase 17 · 04（Serving Engine Internals）
**Time:** ~60 分钟

## 学习目标

- 说出三个市场细分领域（custom silicon、GPU 平台、API-first），并将每个 vendor 映射到相应领域。
- 解释为什么“按 Token”API 定价模式会趋近 serving engine 的成本曲线，而不是硬件成本曲线。
- 计算至少三个 vendor 的单次 request 有效成本，并解释按分钟计费（Baseten、Modal）何时优于按 Token 计费。
- 针对给定工作负载（serverless 突发流量、稳定高吞吐量、Fine-tuning 变体、Multimodal），确定应默认选择哪个平台。

## 问题

你已经评估过托管 hyperscaler 平台，并决定需要一家范围更聚焦、速度更快的 provider：选择 Fireworks 获得低延迟，选择 Together 获得广泛目录，选择 Baseten 托管 Fine-tuning 的自定义 Model。现在你有六个现实选项，但它们的定价页面无法直接对齐。Fireworks 显示美元/M Token；Baseten 显示美元/分钟；Modal 显示美元/秒；Replicate 显示美元/prediction。如果不对工作负载建模，就无法直接比较它们。

更麻烦的是，每个定价页面背后的商业模式都不同。Fireworks 在共享 GPU 上运行自己的自定义 engine（FireAttention）；按 Token 费率反映其利用率曲线。Baseten 为你提供 Truss + 专用 GPU；按分钟计费反映资源独占性。Modal 是真正的 Python serverless，以秒计费且 cold start 不到一秒。三者输出相同（一个 LLM response），但成本函数不同。

本课将对这六个平台进行建模，并告诉你每个平台在什么情况下胜出。

## 概念

### 三个细分领域

**Custom silicon** — Groq（LPU）、Cerebras（WSE）、SambaNova（RDU）。在同一 Model 上，decode 通常比基于 GPU 的集群快 5-10 倍。每 Token 价格较高（2025 年末，Groq 上的 Llama-70B 约为 0.99 美元/M），但在延迟敏感型用例中无可匹敌。对于 voice agent 和实时翻译，Groq 是 production 选择。

**GPU 平台** — Baseten、Together、Fireworks、Modal、Anyscale。运行于 NVIDIA（2026 年为 H100、H200、B200）或有时运行于 AMD。它们位于“裸 GPU 租用”（RunPod、Lambda）与“hyperscaler 托管服务”（Bedrock）之间的经济层。

**API-first 市场** — Replicate、DeepInfra、OpenRouter、Fal。目录广泛，按 prediction 或按秒付费，强调缩短首次调用所需时间。

### Fireworks — 延迟优化的 GPU 平台

- FireAttention engine（自定义）；宣传称，在相同配置下延迟比 vLLM 低 4 倍。
- 对于非交互式工作负载，Batch tier 的价格约为 serverless 费率的 50%。
- Fine-tuned Model 与 base Model 采用相同费率提供服务。与会对你的 LoRA 收取额外费用的 provider 相比，这是真正的差异化优势。
- 2026 年年中：自 2026 年 5 月 1 日起，按需 GPU 租用价格每小时上调 1 美元。达到一定规模后，可协商流量定价。
- 财务信号：估值 40 亿美元，每日处理超过 10T Token。

### Together — 目录广度优化

- 提供 200 多个 Model，包括在上游发布后数日内上线的开源版本。
- 在相当的 LLM Model 上比 Replicate 便宜 50-70%；“AI Native Cloud”定位的核心是流量与目录。
- 一个 API 同时提供 Inference、Fine-tuning 和 Training。

### Baseten — 企业级完成度优化

- Truss framework：使用一个 manifest 打包 Model 依赖项、secret 和 serving config。
- GPU 范围从 T4 到 B200。按分钟计费，并提供合理的 cold-start 缓解机制。
- 通过 SOC 2 Type II，支持 HIPAA。通常是 fintech 和医疗领域的选择。
- 估值 50 亿美元，2026 年 1 月完成 E 轮融资（CapitalG、IVP、NVIDIA 投资 3 亿美元）。

### Modal — Python-native 优化

- 以纯 Python 实现 infrastructure-as-code。使用 `@modal.function(gpu="A100")` 装饰一个函数，再用一条命令完成部署。
- 按秒计费。通过预热，cold start 为 2-4 秒；小型 Model 不到 1 秒。
- 2025 年完成 8700 万美元 B 轮融资，估值 11 亿美元。在独立调查中，其开发者体验得分最高。

### Replicate — Multimodal 广度

- 按 prediction 付费。图像、视频和音频 Model 的默认平台。
- 拥有丰富的集成生态（Zapier、Vercel、CMS plugins）。
- 在 LLM 按 Token 费率方面竞争力较弱，但凭借丰富的 Multimodal 选项取胜。

### Anyscale — Ray-native

- 构建于 Ray 之上；RayTurbo 是 Anyscale 的专有 Inference engine（与 vLLM 竞争）。
- 最适合 Inference 步骤只是大型 graph 中一个 node 的分布式 Python 工作负载。
- 提供托管 Ray 集群；与 Ray AIR 和 Ray Serve 紧密集成。

### 按 Token 与按分钟计费 — 各自在什么情况下胜出

当工作负载对延迟不敏感且具有突发性时，按 Token 计费更合理，因为你只需为实际用量付费。当利用率高且可预测时，按分钟计费更合理，因为 GPU 接近饱和后，它会优于按 Token 计费。

粗略原则：当工作负载持续使用专用 GPU 的比例超过约 30% 时，按分钟计费（Baseten、Modal）开始优于按 Token 计费（Fireworks、Together）。低于这个比例时，按 Token 计费胜出，因为你不必为空闲时间付费。

### 自定义 engine 才是真正的护城河

所有位于 vLLM 和 SGLang 之上的平台都声称拥有自定义 engine：FireAttention、RayTurbo、Baseten 的 Inference stack。自定义 engine 的说法往往带有营销色彩。更诚实的表述是：vLLM + SGLang 约占 production 开源 Inference 的 80%，而平台层真正的差异化因素是 DX、归因能力和 SLAs。

### 你应记住的数字

- Fireworks GPU 租用：自 2026 年 5 月 1 日起，每小时上调 1 美元。
- Fireworks 声称：相同配置下，延迟比 vLLM 低 4 倍。
- Together：在 LLM 上比 Replicate 便宜 50-70%。
- Baseten 估值：50 亿美元（2026 年 1 月 E 轮，融资 3 亿美元）。
- Modal 估值：11 亿美元（2025 年 B 轮）。
- 持续利用率超过约 30% 后，按分钟计费优于按 Token 计费。

```figure
cost-per-token
```

## 使用它

`code/main.py` 使用合成工作负载，在不同定价模式下比较六家 vendor。它会报告美元/天和有效美元/M Token。运行它，找出按 Token 计费与按分钟计费之间的盈亏平衡点。

## 交付它

本课会生成 `outputs/skill-inference-platform-picker.md`。给定工作负载概况、SLA 和预算，它会选择主要 Inference 平台并给出次优选择。

## 练习

1. 运行 `code/main.py`。对于在单块 H100 上运行的 70B Model，Baseten（按分钟）在多高的持续利用率下优于 Fireworks（按 Token）？自行推导交叉点，并与经验法则比较。
2. 你的产品需要同时提供图像生成、chat 和 speech-to-text。为每种 modality 选择平台，并说明使用哪种 gateway 模式将它们统一起来。
3. Fireworks 将你的主要 Model 价格提高了 1 美元/小时。如果 40% 的流量转移到 Batch tier（优惠 50%），对混合成本影响进行建模。
4. 一位受监管客户要求 SOC 2 Type II + HIPAA + 专用 GPU。哪三个平台可行？其中哪个在 FinOps 方面胜出？
5. 比较 Llama 3.1 70B 在 Fireworks serverless、Together 按需模式、Baseten 专用资源和 Replicate API 上每 1,000 次 prediction 的成本。每天 10 次 prediction 时哪个最便宜？每天 10,000 次时呢？

## 关键术语

| 术语 | 人们通常怎么说 | 它的实际含义 |
|------|----------------|------------------------|
| Custom silicon | “非 GPU 芯片” | Groq LPU、Cerebras WSE、SambaNova RDU — 针对 decode 优化 |
| FireAttention | “Fireworks engine” | 自定义 Attention kernel；宣传称延迟比 vLLM 低 4 倍 |
| Truss | “Baseten 的格式” | Model 打包 manifest；包含依赖项 + secret + serving config |
| 按 Token | “API 定价” | 按消耗的 Token 收费；无闲置成本 |
| 按分钟 | “专用资源定价” | 按 GPU 实际运行时间收费；在高利用率下胜出 |
| 按 prediction | “Replicate 定价” | 按 Model 调用收费；常见于图像/视频 |
| RayTurbo | “Anyscale engine” | Ray 上的专有 Inference；在 Ray 集群上与 vLLM 竞争 |
| Batch tier | “优惠 50%” | 以更低费率运行的非交互式队列；常见于 Fireworks、OpenAI |
| Fine-tuned at base rate | “Fireworks LoRA” | 以 base Model 的费率对通过 LoRA 提供服务的 request 收费（差异化优势） |

## 延伸阅读

- [Fireworks Pricing](https://fireworks.ai/pricing) — 按 Token 费率、Batch tier 和 GPU 租用。
- [Baseten Pricing](https://www.baseten.co/pricing/) — 按分钟费率、承诺容量和企业层级。
- [Modal Pricing](https://modal.com/pricing) — 按秒计算的 GPU 费率和免费层级。
- [Together AI Pricing](https://www.together.ai/pricing) — Model 目录和按 Token 费率。
- [Anyscale Pricing](https://www.anyscale.com/pricing) — RayTurbo 和托管 Ray 定价。
- [Northflank — Fireworks AI Alternatives](https://northflank.com/blog/7-best-fireworks-ai-alternatives-for-inference) — 对比评估。
- [Infrabase — AI Inference API Providers 2026](https://infrabase.ai/blog/ai-inference-api-providers-compared) — vendor 格局。
