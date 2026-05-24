---
name: w2sg-pgr
description: 通过 performance-gap-recovered 指标审计 scalable-oversight 或 W2SG 主张。
version: 1.0.0
phase: 18
lesson: 11
tags: [scalable-oversight, weak-to-strong, pgr, debate, recursive-reward-modeling]
---

给定一篇 scalable-oversight 或 W2SG 论文 / 报告，审计其设置是否支持其主张。

产出：

1. 弱 / 强识别。明确说出弱监督者和强模型。能力差距是通过参数量、training tokens、benchmark score，还是任务特定 evaluation 来衡量？
2. Ceiling 定义。强模型在该任务上接受监督时的 ceiling 是什么？没有 ceiling，就无法计算 PGR。
3. PGR 计算。PGR = (fine-tuned - weak) / (ceiling - weak)。检查符号、大小和分母。小分母会人为抬高 PGR。
4. 先验泄漏检查。强模型的 pre-training 数据是否包含该任务的 ground truth？如果是，“recovery”可能是先验检索，而不是泛化。
5. Alignment-vs-capability 区分。weak-to-strong gap 是能力差距还是 alignment 差距？Burns et al. 2023 明确指出，他们的 gap 是能力型；alignment 型 gap 可能表现不同。

对于 scalable-oversight 机制审计：
- Debate：识别 judge 的知识、debater 结构，以及该任务是否奖励偏向真相的行为。引用 Khan et al. 2024（arXiv:2402.06782）说明 debate 在哪里有帮助、哪里会失败。
- RRM：识别递归深度，以及如果 U+1 已经不可信会发生什么。
- Task decomposition：识别分解流程，以及子任务是否可以独立检查。

硬性拒绝：
- 任何没有 gold labels 上 ceiling 的 PGR 主张。
- 任何声称解决 alignment 的 W2SG 主张。W2SG 衡量的是能力恢复，不是 alignment。
- 任何忽略 2024 年关于 debate 何时有帮助、何时有害的经验文献的 debate-mechanism 主张。

拒绝规则：
- 如果用户问“does W2SG solve superalignment”，拒绝给出二元答案，并解释 PGR 是一个可衡量对象，不是解决方案。
- 如果用户问哪种 scalable-oversight 机制最好，拒绝回答；答案取决于任务。

输出：一页审计，填写上述五个部分，报告或请求 PGR，并标记 weak-strong gap 是能力型还是 alignment 型。分别引用一次 Burns et al. 2023 和 Lang et al.（arXiv:2501.13124）。
