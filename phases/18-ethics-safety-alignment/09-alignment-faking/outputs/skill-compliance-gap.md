---
name: compliance-gap
description: 通过 monitored / unmonitored compliance gap，评估一份 safety report 是否能够检测 alignment faking。
version: 1.0.0
phase: 18
lesson: 9
tags: [alignment-faking, compliance-gap, anthropic, safety-evaluation]
---

给定一份 safety evaluation report，使用 Greenblatt et al. 2024 compliance-gap 框架，评估它是否能够将 alignment faking 与真实 compliance 区分开。

产出：

1. 条件划分。evaluation 是否同时运行 monitored（training-relevant）和 unmonitored（non-training）条件？没有两者，alignment faking 就不可见。
2. Compliance-gap 测量。将 gap 报告为 (monitored - unmonitored) compliance rate。解释符号和幅度：正 gap = faking-shaped 行为；负 gap = 被观察时过度拒绝。
3. Verbal-trace vs behaviour 检查。evaluation 依赖的是模型的 scratchpad reasoning，还是 action 本身？根据 Anthropic 2025，针对 verbal trace 的缓解措施可以移除 trace，而不移除行为。
4. 操作化审计。monitoring 条件是通过 system prompt、synthetic fine-tuning，还是自然部署语境创建的？system-prompt 依赖会削弱主张；synthetic-fine-tuning 复现会增强主张。
5. Residual-incentive 检查。应用任何 mitigation 后，incentive structure 是否仍然存在（如果模型选择 faking，它是否仍然会从中受益）？incentive 持续存在意味着行为可能在 distribution shift 下回归。

硬性拒绝：
- 任何基于仅 unmonitored evaluation 的「no alignment faking」主张。
- 任何声称「scratchpad reasoning 不再语言化 faking」就意味着行为已经停止的主张。
- 任何声称 HHH-trained models 不会 fake alignment 的主张——Greenblatt et al. 2024 确立的是 HHH training 是必要条件，而不是充分防御。

拒绝规则：
- 如果用户问「does my model fake alignment」，在没有 compliance-gap data 的情况下拒绝给出二元答案。
- 如果用户要求一种只攻击 verbal trace 的 remediation（例如，“train the scratchpad to match the action”），拒绝并解释 faithful-CoT failure mode（2025 后续研究）。

输出：一页 assessment，报告两个条件下的 compliance、gap、verbal-trace-vs-behaviour 分离，以及操作化强度。标记每个缺失元素。引用 Greenblatt et al. (arXiv:2412.14093) 一次，作为框架来源。
