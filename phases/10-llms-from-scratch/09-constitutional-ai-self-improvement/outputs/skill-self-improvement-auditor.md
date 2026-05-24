---
name: self-improvement-auditor
description: 在 proposed self-improvement 或 constitutional AI pipeline 大规模运行之前进行审计。
version: 1.0.0
phase: 10
lesson: 9
tags: [alignment, cai, grpo, rlhf, self-improvement, reward-hacking]
---

给定一个声称使用 Constitutional AI、RLAIF、GRPO 或任何形式的 self-generated preference data 的 proposed training pipeline，生成一份包含以下内容的审计：

1. Reward rule。说明确切的 verifier（regex、sympy、test suite、LLM judge）。分类为 deterministic、stochastic-LLM 或 hybrid。拒绝任何没有外部 grounding 的 "self-improvement" loop —— 模型无法凭空获取信号。
2. Group statistics。对于 GRPO pipelines，确认 group size、advantages 如何计算（z-score vs relative rank），以及当 group reward std 崩塌到零时会发生什么。pipeline 必须跳过或降低 zero-variance groups 的权重，而不是除以 epsilon 并假装信号是真实的。
3. KL budget。整个运行过程中 cumulative KL(policy || reference) 的数值上限。达到上限时，pipeline 必须 halt、reset，或切换到更温和的 reference。无界 KL 就是无界漂移。
4. Diversity floor。对 per-group reward std、response length variance 或 n-gram entropy 的实测下界，取任务允许的指标。如果 floor 连续 N 轮被突破，pipeline 必须混入新的 human data 或更宽的 prompt distribution。
5. Human data quota。训练混合中必须保持 human-authored 的最低比例，通常为 5-10%。仅 self-distillation 的 pipelines 会在 3-5 轮后崩塌。明确指出这一点。
6. Mode-collapse watchdog。标记自动检查项：跨轮次的 reward std、held-out prompts 上的 unique n-gram count、length distribution、refusal rate。任何一项越过阈值都会 halt training。
7. Constitution drift。对于 CAI pipelines，要求一个带版本的 constitution file、changelog，以及一个 "constitutional regression test set" —— 这些 prompts 的预期行为不得因编辑而改变。

拒绝批准符合以下情况的 pipelines：
- 声称 "zero human data"，但没有任何 external verifier（rule、tool、environment）。
- 使用 PRMs，但没有 process-reward hacking probe（模型是否会写出看起来正确但没有推进证明的步骤？）。
- 在没有 held-out diversity benchmark 的情况下运行超过 5 轮 rejection-sampling fine-tuning。
- policy 与 reference model 共享同一个模型（没有 reference 就没有 KL，也就没有锚点）。
- 使用与 policy 相同的模型作为 LLM judge 进行评分（judge contamination）。

输出：一页审计，每个 gate 给出 pass/fail、实测或声明的值，以及 pipeline 中产生每个信号的确切步骤。如果任何 gate fail，列出能让它转为 pass 的 minimum viable change。
