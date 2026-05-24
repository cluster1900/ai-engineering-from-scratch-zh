# Model Routing 作为降低成本的基础手段

> 一个 dynamic broker 会评估每个 request（task type、Token length、Embedding similarity、confidence），并把简单 query 发送给便宜 model，把复杂 query 升级到 frontier model。也叫 model cascading。Production case studies 显示，在 US/UK/EU 部署中，iso-quality 下成本可降低 20-60%；在高流量 SaaS 上，30% 的 routing efficiency improvement 会转化为六位数年度节省。2026 年的背景是 LLM inference 价格每年下降约 10x：从 2022 年末到 2026 年，GPT-4-class Token 从 $20/M 降到约 $0.40/M。大部分下降来自更好的 serving stacks（Phase 17 · 04-09），不是 hardware。Routing 是你在不造成 product regression 的情况下，把这种价格下降转化为 margin 的方式。failure mode 是 cheap-model drift：route 把 40% 推给更弱的 model，reasoning tasks 上 quality 下降 3-5%，一个季度内没人注意到。用 online quality metrics 对 route 设 gate，而不是只依赖 offline eval sets。

**Type:** Learn
**Languages:** Python (stdlib, toy cascading router simulator)
**前置要求：** Phase 17 · 01 (Managed LLM Platforms), Phase 17 · 19 (AI Gateways)
**Time:** ~60 分钟

## 学习目标

- 解释 model cascading：cheap-first with confidence check，低 confidence 时 escalate。
- 枚举四个 routing signals（task classification、prompt length、Embedding similarity to known-hard set、first-pass 的 self-confidence）。
- 在目标 routing split 和 quality loss tolerance 下计算 expected blended cost。
- 说出能捕捉 cheap-model creep 的 drift-monitoring metric（online quality gate）。

## 问题

你的服务在 GPT-5 上每月花费 $80k。你的 analytics 显示 70% 的 queries 都很简单："what time is it in Paris?" "rephrase this sentence." Haiku-class model 可以以 3% 的成本完美处理这些。30% 需要 GPT-5 的 reasoning：coding、math、multi-step planning。

如果你把 70% route 到便宜 model，把 30% route 到昂贵 model，在相同 product quality 下，你的账单会下降约 65%。这就是 routing。难点是在不让 quality regression 的情况下构建 broker。

## 概念

### 四个 routing signals

1. **Task classification**：simple/complex/codegen/math/chat。可以是 rules-based classifier、小型 LLM（Haiku-class，$0.25/M），或到 labeled buckets 的 Embedding similarity。输出：route = cheap / balanced / frontier。

2. **Prompt length**：prompts >4K Token 通常需要 frontier 来保持 coherence。Prompts <500 Token 通常不需要。

3. **Embedding similarity to known-hard set**：如果 query 接近某个 known-hard bucket（cosine > 0.88），直接 escalate 到 frontier。

4. **Self-confidence from first-pass**：发送给 cheap；如果 model 的 log-probs 显示 low confidence，或者它 refuses，或者输出 hedging language，就在 frontier 上 retry。会在约 10% traffic 上增加 P95 latency，但在另外 90% 上节省 50%+。

### 三种模式

**Pre-route**（前置 classifier）：增加约 5-10ms latency；整体最快。

**Cascade**（cheap-first，low confidence 时 escalate）：median latency 约 1.2x（cheap run 加 verify），escalated 时约 2x。quality floor 最好。

**Ensemble route**（对样本并行运行 cheap 和 frontier，由 reward-model 选择）：quality 最高，cost 最高；只用于关键 A/B。

### 实现

AI gateways（Phase 17 · 19）暴露 routing。LiteLLM 有带 fallback 和 cost-routing 的 `router` config。Portkey 有 guards + routing。Kong AI Gateway 有 plugin-based routing。OpenRouter 的 model marketplace 暴露 recommendation API。

Open-source：RouteLLM (LMSYS)、Not Diamond (commercial)、Prompt Mule。

### 2026 价格曲线

| Model class | 2022 年末 | 2026 | 变化 |
|-------------|-----------|------|--------|
| GPT-4-level quality | ~$20/M | ~$0.40/M | 便宜 50x |
| Frontier (GPT-5, Claude 4) | — | ~$3-10/M | 新 tier |

大部分 improvement 来自 serving efficiency，也就是 Phase 17 · 04-09 中的核心课程转化成 provider 侧的成本下降。Routing 让你在 app layer 捕获这些收益，而不是等待所有用户迁移到 cheap tier。

### Drift 才是真正风险

你的 route 把 40% 发送给 cheap model。六个月后，task distribution 发生变化（用户更熟练，问题更长）。Router 没有注意到，因为它的 classifier 是基于 Q1 data 训练的。Quality 悄悄下降。没人发出足够强烈的 complaint。你在 competitor benchmark 中才发现自己输了。

用 online quality metrics 对 route 设 gate：

- 每条 route 的 user thumbs-up / thumbs-down。
- 每条 route 上对 held-out sample（5%）做 automated LLM-judge。
- Escalation rate：如果 cascade 的 up-route >30%，说明 cheap model 被 over-routed。
- 每条 route 的 refusal rate。

### 你应该记住的数字

- 2026 年 iso-quality 下 routing savings：case studies 为 20-60%。
- LLM price drop 2022-2026：aggregate 约每年 10x。
- GPT-4-level 2022 vs 2026：~$20/M → ~$0.40/M。
- Cascade latency impact：median 约 1.2x，escalated 约 2x（约 10% traffic）。

## 使用它

`code/main.py` 会在 mixed workload 上模拟 pre-route、cascade 和 ensemble。报告 blended cost、quality loss 和 escalation rate。

## 交付它

本课会产出 `outputs/skill-router-plan.md`。给定 workload 和 quality budget，选择 routing pattern 和 signals。

## 练习

1. 运行 `code/main.py`。在什么 accuracy floor 下，cascade 会胜过 pre-route？
2. 你的 user base 是 30% enterprise（complex queries）、70% free tier（simple）。设计 routing split。用什么 online metric 作为 gate？
3. 某个 route 让 quality 下降 2%，但节省 40%。是否应该 ship？取决于 product：从正反两面论证。
4. 使用 OpenAI / Anthropic APIs 的 logprobs 实现 confidence check。你会从什么 threshold 开始？
5. 六个月内，escalation rate 从 8% 上升到 22%。诊断三个原因，并给出每个原因的修复方式。

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Model routing | "cost broker" | 每个 request 动态选择 model |
| Model cascade | "cheap-first escalate" | 先运行 cheap，low confidence 时 fall through 到 frontier |
| Pre-route | "classify first" | 前置 classifier；不重新运行 |
| Ensemble route | "parallel pick" | 运行多个，由 reward-model 选最佳 |
| Escalation rate | "uprouted %" | cascade requests 中被 escalated 的比例 |
| RouteLLM | "LMSYS router" | OSS router library |
| Not Diamond | "commercial router" | SaaS model-routing product |
| Drift | "cheap creep" | distribution shift 发生但 router 没注意到 |
| Online quality gate | "live check" | 对 live traffic 采样做 automated LLM-judge |

## 延伸阅读

- [AbhyashSuchi — Model Routing LLM 2026 最佳实践](https://abhyashsuchi.in/model-routing-llm-2026-best-practices/)
- [Lukas Brunner — Rise of Inference Optimization 2026](https://dev.to/lukas_brunner/the-rise-of-inference-optimization-the-real-llm-infra-trend-shaping-2026-4e4o)
- [RouteLLM paper / code](https://github.com/lm-sys/RouteLLM)
- [Not Diamond — model routing](https://www.notdiamond.ai/)
- [OpenRouter](https://openrouter.ai/) — 带 routing primitives 的 multi-model gateway。
