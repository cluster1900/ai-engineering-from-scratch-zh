# 推理平台经济学 — Fireworks、Together、Baseten、Modal、Replicate、Anyscale

> 2026 年的 inference 市场不再只是 GPU 时间租赁。它分化为 custom silicon（Groq、Cerebras、SambaNova）、GPU platforms（Baseten、Together、Fireworks、Modal）和 API-first marketplaces（Replicate、DeepInfra）。Fireworks 在 2026 年 5 月 1 日将每块 GPU 的价格提高了 $1/hr，而 $4B 估值和每天 10T+ tokens 的处理量说明了 volume-driven 模型是可行的。Baseten 于 2026 年 1 月以 $5B 估值完成了 $300M Series E。竞争定位规则很简单：Fireworks 优化 latency，Together 优化 catalog breadth，Baseten 优化 enterprise polish，Modal 优化 Python-native DX，Replicate 优化 Multimodal reach，Anyscale 优化 distributed Python。本课会给你一个可以直接交给 founder 的 Matrix。

**Type:** Learn
**Languages:** Python (stdlib, toy per-call economics comparator)
**前置要求:** Phase 17 · 01 (Managed LLM Platforms), Phase 17 · 04 (vLLM Serving Internals)
**Time:** ~60 minutes

## 学习目标
- 说出三个市场 segment（custom silicon、GPU platforms、API-first），并将每个 vendor 映射到一个 segment。
- 解释为什么 "per-token" API pricing model 会向 serving engine 的 cost curve 收敛，而不是向 hardware 的 cost curve 收敛。
- 计算至少三个 vendor 的每次请求有效成本，并解释什么时候 per-minute（Baseten、Modal）胜过 per-token。
- 识别给定 workload 的正确默认平台（serverless bursty、steady high-throughput、fine-tuned variants、Multimodal）。

## 问题
你已经评估了托管式 hyperscaler 平台。你决定需要一个更窄、更快的 provider：Fireworks 用于 latency，Together 用于 breadth，Baseten 用于 fine-tuned custom model。现在你有六个真实选择，而 pricing pages 并不一致。Fireworks 显示 $/M tokens；Baseten 显示 $/minute；Modal 显示 $/second；Replicate 显示 $/prediction。如果不对 workload 建模，你无法对它们进行 head-to-head 比较。

更糟的是，每个 pricing page 背后的 business model 都不同。Fireworks 在共享 GPU 上运行自己的 custom engine（FireAttention）；per-token rate 反映的是它们的 utilization curve。Baseten 给你 Truss + dedicated GPUs；per-minute 反映的是 exclusivity。Modal 是真正的 Python serverless：per-second billing，并且 cold start 可低于一秒。相同输出（一个 LLM response），三种不同的 cost functions。

本课会对这六个平台建模，并告诉你它们分别在什么时候胜出。

## 概念
### The three segments

**Custom silicon** — Groq（LPU）、Cerebras（WSE）、SambaNova（RDU）。在同一模型上，decode 通常比基于 GPU 的 cluster 快 5-10x。per-token 价格更高（2025 年末 Groq 在 Llama-70B 上约为 ~$0.99/M），但对于 latency-sensitive use cases 无可匹敌。Groq 是 voice agents 和 real-time translation 的生产环境选择。

**GPU platforms** — Baseten、Together、Fireworks、Modal、Anyscale。运行在 NVIDIA（2026 年为 H100、H200、B200）或有时运行在 AMD 上。它们位于 "raw GPU rental"（RunPod、Lambda）和 "hyperscaler managed service"（Bedrock）之间的经济层。

**API-first marketplaces** — Replicate、DeepInfra、OpenRouter、Fal。Broad catalog，pay-per-prediction 或 pay-per-second，强调 time-to-first-call。

### Fireworks — latency-optimized GPU platform

- FireAttention engine（custom）；市场宣传为在等效配置上 latency 比 vLLM 低 4x。
- Batch tier 约为 serverless rate 的 50%，用于 non-interactive workloads。
- Fine-tuned model 以与 base model 相同的 rate 提供服务，这是相对于那些会对你的 LoRA 加收 premium 的 provider 的真正差异点。
- 2026 年中：on-demand GPU rental 自 2026 年 5 月 1 日起提高 $1/hour。规模化时可协商 volume pricing。
- 财务信号：$4B 估值，每天处理 10T+ tokens。

### Together — breadth-optimized

- 200+ models，包括 upstream 发布后数天内上线的 open-source releases。
- 在等效 LLM models 上比 Replicate 便宜 50-70%；"AI Native Cloud" 定位的核心是 volume 和 catalog。
- Inference + fine-tuning + training 都在一个 API 中。

### Baseten — enterprise-polish-optimized

- Truss framework：将 dependencies、secrets、serving config 放在一个 manifest 中进行 model packaging。
- GPU 范围从 T4 到 B200。per-minute billing，并提供合理的 cold-start mitigation。
- SOC 2 Type II，HIPAA-ready。常见于 fintech 和 healthcare 选择。
- $5B 估值，2026 年 1 月 Series E（来自 CapitalG、IVP、NVIDIA 的 $300M）。

### Modal — Python-native-optimized

- 纯 Python 的 infrastructure-as-code。用 `@modal.function(gpu="A100")` 装饰一个 function，然后用一条 command 部署。
- Per-second billing。预热时 cold start 为 2-4s；小模型低于 1s。
- $87M Series B，估值 $1.1B（2025）。在独立调查中 developer experience 得分最高。

### Replicate — multimodal breadth

- Pay-per-prediction。image、video 和 audio models 的默认平台。
- Integration ecosystem（Zapier、Vercel、CMS plugins）。
- 在 LLM per-token rates 上竞争力较弱，但胜在 Multimodal variety。

### Anyscale — Ray-native

- 构建在 Ray 上；RayTurbo 是 Anyscale 的 proprietary inference engine（与 vLLM 竞争）。
- 最适合 distributed Python workloads，其中 inference step 是更大 graph 中的一个 node。
- Managed Ray clusters；与 Ray AIR 和 Ray Serve 深度集成。

### Per-token 与 per-minute：分别在什么时候胜出

当 workload 对 latency 不敏感且 bursty 时，per-token 是合理的，因为你只为实际使用付费。当 utilization 高且可预测时，per-minute 是合理的，因为一旦你让 GPU 饱和，就会胜过 per-token。

粗略规则：当 workload 高于 dedicated GPU 约 ~30% 的持续利用率时，per-minute（Baseten、Modal）开始胜过 per-token（Fireworks、Together）。低于该水平时，per-token 获胜，因为你避免为空闲付费。

### Custom engine is the real moat

vLLM 和 SGLang 之上的每个平台都声称拥有 custom engine。FireAttention、RayTurbo、Baseten 的 inference stack。custom-engine 声称带有营销色彩；更诚实的表述是，vLLM + SGLang 代表了大约 80% 的生产级 open-source inference，而 platform layer 的差异点是 DX、attribution 和 SLAs。

### Numbers you should remember

- Fireworks GPU rental：自 2026 年 5 月 1 日起提高 $1/hr。
- Fireworks claim：在等效配置上 latency 比 vLLM 低 4x。
- Together：在 LLMs 上比 Replicate 便宜 50-70%。
- Baseten valuation：$5B（Series E，2026 年 1 月，$300M round）。
- Modal valuation：$1.1B（Series B，2025）。
- per-minute 在高于 ~30% 持续利用率时胜过 per-token。


```figure
cost-per-token
```

## 使用它
`code/main.py` 在一个 synthetic workload 上跨 pricing models 比较六个 vendor。报告 $/day 和 effective $/M tokens。运行它来找出 per-token 与 per-minute 的 break-even。

## 交付它
本课会生成 `outputs/skill-inference-platform-picker.md`。给定 workload profile、SLA 和 budget，选择 primary inference platform，并给出 runner-up。

## 练习
1. 运行 `code/main.py`。对于一块 H100 上的 70B model，在什么持续利用率下 Baseten（per-minute）会胜过 Fireworks（per-token）？自己推导 crossover，并与经验法则对比。
2. 你的产品提供 image generation、chat 和 speech-to-text。为每种 modality 选择平台，并命名将它们统一起来的 gateway pattern。
3. Fireworks 将你的 primary model 价格提高 $1/hr。如果 40% 的流量转移到 batch tier（50% off），建模 blended cost impact。
4. 一个受监管客户要求 SOC 2 Type II + HIPAA + dedicated GPUs。哪三个平台可行，哪一个在 FinOps 上胜出？
5. 比较 Fireworks serverless、Together on-demand、Baseten dedicated 和 Replicate API 上 Llama 3.1 70B 每 1,000 predictions 的成本。每天 10 个 predictions 时哪个最便宜？10,000 个时呢？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Custom silicon | "non-GPU chips" | Groq LPU、Cerebras WSE、SambaNova RDU — 针对 decode 优化 |
| FireAttention | "Fireworks engine" | Custom attention kernel；市场宣传为 latency 比 vLLM 低 4x |
| Truss | "Baseten's format" | Model packaging manifest；dependencies + secrets + serving config |
| Per-token | "API pricing" | 按消耗的 tokens 收费；无需为空闲付费 |
| Per-minute | "dedicated pricing" | 按 wall-clock GPU time 收费；在高 utilization 时胜出 |
| Per-prediction | "Replicate pricing" | 按 model invocation 收费；常见于 image/video |
| RayTurbo | "Anyscale engine" | Ray 上的 proprietary inference；在 Ray clusters 上与 vLLM 竞争 |
| Batch tier | "50% off" | 降价的 non-interactive queue；常见于 Fireworks、OpenAI |
| Fine-tuned at base rate | "Fireworks LoRA" | 以 base model 的 rate 对 LoRA-served requests 收费（差异点） |

## 延伸阅读
- [Fireworks Pricing](https://fireworks.ai/pricing) — per-token rates、batch tier、GPU rental。
- [Baseten Pricing](https://www.baseten.co/pricing/) — per-minute rates、committed capacity、enterprise tiers。
- [Modal Pricing](https://modal.com/pricing) — per-second GPU rates 和 free tier。
- [Together AI Pricing](https://www.together.ai/pricing) — model catalog 和 per-token rates。
- [Anyscale Pricing](https://www.anyscale.com/pricing) — RayTurbo 和 managed Ray pricing。
- [Northflank — Fireworks AI Alternatives](https://northflank.com/blog/7-best-fireworks-ai-alternatives-for-inference) — comparative assessment。
- [Infrabase — AI Inference API Providers 2026](https://infrabase.ai/blog/ai-inference-api-providers-compared) — vendor landscape。
