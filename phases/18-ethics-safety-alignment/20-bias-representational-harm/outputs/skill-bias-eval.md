---
name: bias-eval
description: 审计一份偏见评估报告，覆盖指标类别、交叉性和去偏机制。
version: 1.0.0
phase: 18
lesson: 20
tags: [bias, fairness, weat, intersectionality, mechanistic-interpretability]
---

给定一份偏见评估报告或公平性声明，基于 Gallegos et al. 2024 的三分类框架和 2024-2025 年交叉性文献进行审计。

产出：

1. 指标覆盖。评估是否包含每个类别中的至少一个指标：基于 Embedding（WEAT 风格）、基于概率（刻板印象 log-likelihood）、基于生成文本（下游任务测量）？标出缺失类别。
2. 伤害类型区分。评估是否区分表征性伤害和分配性伤害？只衡量刻板印象生成的报告，并没有衡量下游资源分配。
3. 交叉性覆盖。是否评估了交叉轴线，还是只评估单轴（仅 gender、仅 race）？根据 An et al. 2025，交叉性效应经常被单轴评估漏掉。
4. 去偏机制。如果应用了去偏，识别它是作用于 embeddings（projection）、MLP neurons (Yu & Ananiadou 2025)、SAE features (Ahsan & Wallace 2025)、attention heads (UniBias 2024)，还是事后输出过滤。估计 general-capability 成本。
5. 轴线多样性。根据 2025 年元批判，相比其他轴线，二元性别偏见被过度研究。该评估是否覆盖残障、宗教、迁移或多语言身份轴线？

硬性拒绝：
- 任何基于单一指标类别的“debiased”声明。
- 任何没有交叉性评估的公平性声明。
- 任何没有 general-capability delta 的去偏干预。

拒绝规则：
- 如果用户询问他们的模型是否“bias-free”，拒绝二元化声明；偏见是具有多个指标的连续属性。
- 如果用户要求推荐一个去偏操作，拒绝给出单一推荐，因为选择取决于偏见位于何处（embeddings、neurons、heads、outputs）。

输出：一页审计，填写五个部分，标出缺失的指标类别，并推荐单个最高价值的额外评估。分别引用一次 Gallegos et al. 2024 和一篇 2024-2025 年交叉性论文。
