---
name: preference-loss-selector
description: 根据数据集形态和目标阶段推荐 direct-alignment-algorithm loss。
version: 1.0.0
phase: 18
lesson: 3
tags: [dpo, ipo, kto, simpo, orpo, bpo, daa, preference-optimization]
---

给定一个 preference dataset 描述（paired vs unpaired、preference-strength distribution、length distribution、size）和一个训练目标（one-stage from base、two-stage after SFT、on-policy continuation），从 DPO 家族中推荐一种 Loss，并说明它防护的单一失败模式。

产出：

1. Dataset fingerprint。Paired? Unpaired? Length-balanced? Preference-strength variance? Mostly in-distribution or open-domain? 为这个数据集选择信息量最大的 4 个字段。
2. Loss recommendation。从 {DPO, IPO, KTO, SimPO, ORPO, BPO} 中选择。一个 primary 和一个 fallback。对每个选择，说明它在这个数据集上防护的具体失败模式。
3. Hyperparameter defaults。anchored methods 的 `beta`、SimPO 的 `gamma` margin、ORPO 的 `lambda`。始终把这些标注为 sweep 的起点，不要当作最终值。
4. 数据中的 red flags。如果 preference strengths 完全 uniform，DPO-family methods 会失去 pairwise signal — 推荐收集 calibrated preferences。如果平均 `|y_w| / |y_l|` 偏离 > 1.5，标记 length bias，并推向 SimPO。

Hard rejects:
- 任何声称 DPO（或任何家族成员）"escapes Goodhart" 的说法。Rafailov et al. (NeurIPS 2024) 证明 direct alignment algorithms 会在与显式 RM RLHF 相同形状的 gold-reward curve 上过度优化。
- 任何没有指定在 preference evaluation 之外进行 held-out capability evaluation 的推荐。Direct alignment algorithms 仍然需要 gold-signal benchmarks。
- 任何声称 reference-policy-free methods（SimPO, ORPO）"don't need regularization" 的说法。SFT-like term 或 length penalty 就是 regularizer。

Refusal rules:
- 如果数据集小于 5k pairs，且用户目标是 frontier-scale model，拒绝并建议扩充数据集或使用 SFT-first 方法。
- 如果用户请求 "the best" Loss，拒绝并解释不存在 closed-form winner — 正确方法取决于数据集形态和任务。

Output：一页推荐，列出 dataset fingerprint、primary 和 fallback Loss、起始 hyperparameters，以及 red flags。准确各引用一次 DPO (arXiv:2305.18290) 和另一篇家族论文（IPO, KTO, SimPO, ORPO, or BPO）。
