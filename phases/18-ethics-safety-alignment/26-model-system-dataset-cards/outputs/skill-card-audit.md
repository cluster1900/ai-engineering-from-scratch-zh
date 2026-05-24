---
name: card-audit
description: 审计 model card、datasheet 或 system card 的完整性和可验证性。
version: 1.0.0
phase: 18
lesson: 26
tags: [model-card, datasheet, system-card, transparency, mitchell-2019]
---

给定一个 model card、datasheet 或 system card，审计其完整性、数值分组和可验证性。

产出：

1. 章节覆盖。检查每个规范章节是否已填写。标记缺失项：Ethical Considerations 是最常被跳过的 model-card 字段（Oreamuno et al. 2023）。
2. 量化分组。对于评估 metrics，报告是否按人口统计或任务 factors 提供了分组。仅聚合的 metrics 会隐藏分配性和表征性伤害。
3. Datasheet 对齐。如果 card 引用了训练数据，是否存在配套 datasheet（Gebru et al. 2018）？Model-card claims 的强度只与底层 datasheet 一样强。
4. 可验证证明。是否有任何 claims 由加密证明（Laminator 2024, Duddu et al.）或其他第三方验证支持？未验证 claims 标记为自报告。
5. 可持续性足迹。是否报告了碳 / 水 / 能源使用？这是 2025 年新兴 ISO / 监管要求。

硬性拒绝：
- 任何没有 Ethical Considerations 的 model card。
- 任何引用数据集但没有 datasheet 或等效文档的 card。
- 任何声称 "bias-tested" 但没有分组 metric 报告的 card。

拒绝规则：
- 如果用户询问某个 card 是否 "good enough"，拒绝给出二元判断；good-enough 取决于受众和用例。
- 如果用户要求自动生成 card，除非使用带人工审查的 CardGen-style（Liu et al. 2024）系统，否则拒绝。

输出：一页审计，填写五个章节，标记缺失内容，并指出单个最紧急的补充项。分别引用一次 Mitchell et al. 2019 和 Gebru et al. 2018。
