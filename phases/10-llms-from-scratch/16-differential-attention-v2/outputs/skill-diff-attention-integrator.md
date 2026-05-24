---
name: diff-attention-integrator
description: 将 Differential Attention V2 添加到新的 pre-training run 或 LoRA fine-tune 的集成计划。
version: 1.0.0
phase: 10
lesson: 16
tags: [differential-attention, diff-transformer, long-context, flash-attention, pre-training, lora]
---

给定一个模型架构（hidden、heads、KV heads、layers、d_head）、目标 context length、hallucination 或 long-context profile（你现有 evals 上的 failure modes），以及训练预算（可用 Token、GPU-hours），为 DIFF V2 生成一份集成计划。

生成：

1. 集成模式。From-scratch pre-training、mid-training architecture swap，或在 Q projections 上进行 LoRA fine-tune。结合训练预算和可用的现有权重说明选择理由。
2. 架构 diff。具体到字段的变更清单：哪些 projections 扩大、哪些保持不变、增加了多少参数，以及减法放在 attention block 的什么位置。包含按 layer depth 设置的 `lambda_init` schedule（`0.8 - 0.6 * exp(-0.3 * (depth - 1))` 是论文默认值；如果 layerwise telemetry 显示不稳定，可按 depth 调整）。
3. Kernel 选择。确认在 V2 的 head-count doubling 下支持 FlashAttention 2 或 3。拒绝 V1 的 custom-kernel 路径，除非用户明确需要它来保证可复现性。
4. Memory 预算。KV cache 保持 baseline（KV heads 不变）。计算 per-token activation memory delta（额外 Q heads、额外计算）。在目标 context 下报告绝对数值。
5. 训练稳定性计划。描述需要监控的内容：每层的 `lambda` drift、每个 head 的 attention entropy、Q projections 上的 gradient variance。命名一个具体 metric：当 telemetry 显示 divergence 时，它应触发回滚到 baseline attention。

硬性拒绝：
- 在没有 continued pre-training 的情况下向 pre-trained model 添加 DIFF attention。输出分布会 drift，不能作为 drop-in fix。
- 对 2026 年 4 月之后的任何新 run 使用 DIFF V1。V2 在所有已测量维度上都严格更好。
- 集成 DIFF 但不同时启用 long-context training data。收益只会在超过 32k 后显现。
- 在没有 controlled experiment 的情况下将 `lambda_init` 改为负值。负 init 会减去超过 noise floor 的量并导致训练崩塌。

拒绝规则：
- 如果目标 context 低于 16k，拒绝集成并推荐 standard attention。基于 noise-floor 论点，新增参数成本并不合理。
- 如果用户无法提供 long-context evaluation data（RULER、needle-in-haystack、MultiNeedle），拒绝并先请求 calibration data。
- 如果用户使用的是 pre-FlashAttention-2 stack，拒绝并建议在尝试集成前先升级 stack。

输出：一页集成计划，列出 mode、param count delta、KV cache impact、FlashAttention confirmation、`lambda` schedule，以及包含 3 个 metric 的 monitoring board。以一个 "success criterion" 段落结尾，命名具体的 long-context eval 数值（RULER 64k 或等价指标上的 percentage point delta），用于判断是否值得在架构中保留 DIFF V2，而不是回退。
